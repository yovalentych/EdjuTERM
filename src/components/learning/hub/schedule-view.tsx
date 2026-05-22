"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, ArrowRight, BookOpen, CalendarDays, Check, CheckCircle2,
  ChevronRight, Clock, Download, Hash, LayoutList, Loader2, MapPin, Pencil, Plus, Sparkles, Trash2, UserMinus,
  Users, Wifi, X, XCircle,
} from "lucide-react";
import { LiquidCard } from "@/components/ui/liquid";
import type {
  AttendanceRecord,
  CourseMember,
  LearningCourse, LearningModule, LearningSession, LearningTopic,
} from "@/lib/schemas";

const CalendarGridView = dynamic(
  () => import("./calendar-grid").then((m) => m.CalendarGridView),
  { ssr: false, loading: () => <div className="flex items-center justify-center py-16 text-sm text-slate-400">Завантаження календаря…</div> },
);

const SESSION_TYPES = [
  { id: "lecture",      uk: "Лекція",       en: "Lecture",      icon: "📘", color: "blue"    },
  { id: "seminar",      uk: "Семінар",      en: "Seminar",      icon: "💬", color: "emerald" },
  { id: "practical",    uk: "Практична",    en: "Practical",    icon: "🛠",  color: "amber"   },
  { id: "lab",          uk: "Лабораторна",  en: "Lab",          icon: "🧪", color: "violet"  },
  { id: "self_study",   uk: "Самостійна",   en: "Self study",   icon: "📖", color: "slate"   },
  { id: "consultation", uk: "Консультація", en: "Consultation", icon: "🎓", color: "rose"    },
] as const;

type SessionType = (typeof SESSION_TYPES)[number]["id"];
type AttendanceStatus = "present" | "absent" | "excused" | "late" | "online";

const ATTEND_META: Record<AttendanceStatus | "none", {
  label: { uk: string; en: string };
  color: string;
  icon: React.ComponentType<{ className?: string }>;
}> = {
  present: { label: { uk: "Присутній", en: "Present" }, color: "emerald", icon: CheckCircle2 },
  absent:  { label: { uk: "Відсутній", en: "Absent" },  color: "rose",    icon: XCircle },
  excused: { label: { uk: "Поважна",   en: "Excused" }, color: "amber",   icon: UserMinus },
  late:    { label: { uk: "Запізнення",en: "Late" },    color: "amber",   icon: Clock },
  online:  { label: { uk: "Онлайн",    en: "Online" },  color: "blue",    icon: Wifi },
  none:    { label: { uk: "—", en: "—" }, color: "slate", icon: () => null },
};

const ATTEND_CYCLE: AttendanceStatus[] = ["present", "absent", "excused", "late", "online"];

// ── iCal export ──────────────────────────────────────────────────────────────

const ICAL_TYPE_LABEL: Record<string, string> = {
  lecture: "Лекція", seminar: "Семінар", practical: "Практична",
  lab: "Лаб. робота", self_study: "Сам. робота", consultation: "Консультація",
};

function generateIcal(sessions: LearningSession[], title: string): string {
  const esc = (s: string) =>
    s.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\n/g, "\\n");

  const dt = (date: string, time?: string) =>
    time ? `${date.replace(/-/g, "")}T${time.replace(/:/g, "").padEnd(6, "0")}` : date.replace(/-/g, "");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//EdjuTERM//Schedule//UK`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${esc(title)}`,
  ];

  for (const s of sessions) {
    if (!s.date) continue;
    const typeLbl = ICAL_TYPE_LABEL[s.sessionType] || s.sessionType;
    const descParts = [typeLbl, s.notes].filter(Boolean).join("\\n");
    lines.push(
      "BEGIN:VEVENT",
      `UID:${s._id}@edujterm`,
      `DTSTART:${dt(s.date, s.startTime)}`,
      `DTEND:${dt(s.date, s.endTime || s.startTime)}`,
      `SUMMARY:${esc(s.title || typeLbl)}`,
      ...(s.location ? [`LOCATION:${esc(s.location)}`] : []),
      `DESCRIPTION:${esc(descParts)}`,
      "END:VEVENT",
    );
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

function formatDate(iso: string, locale: "uk" | "en"): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(locale === "uk" ? "uk-UA" : "en-GB", {
    weekday: "long", day: "numeric", month: "long",
  });
}

function dayDiff(iso: string): number {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(iso + "T00:00:00");
  return Math.floor((d.getTime() - today.getTime()) / 86_400_000);
}

export function ScheduleView({
  locale,
  canManage,
  course,
  courses,
  modules,
  topics,
  sessions,
  members,
  attendance: attendanceProp,
  projectId,
}: {
  locale: "uk" | "en";
  canManage: boolean;
  course: LearningCourse | null;
  courses: LearningCourse[];
  modules: LearningModule[];
  topics: LearningTopic[];
  sessions: LearningSession[];
  members: CourseMember[];
  attendance: AttendanceRecord[];
  projectId: string;
}) {
  const isUk = locale === "uk";
  const [wizardOpen, setWizardOpen] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(attendanceProp);
  const [sessionStatuses, setSessionStatuses] = useState<Record<string, string>>(() =>
    Object.fromEntries(sessions.map((s) => [s._id!, s.status])),
  );
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [editingSession, setEditingSession] = useState<LearningSession | null>(null);

  const sorted = useMemo(
    () => sessions.slice().sort((a, b) =>
      (a.date || "").localeCompare(b.date || "") || (a.startTime || "").localeCompare(b.startTime || ""),
    ),
    [sessions],
  );

  // self_study is excluded from count and attendance, but shown inline per day
  const scheduledSessions = useMemo(() => sorted.filter((s) => s.sessionType !== "self_study"), [sorted]);

  // Group all sessions (incl. self_study) by date for rendering
  const byDate = useMemo(() => {
    const map = new Map<string, LearningSession[]>();
    for (const s of sorted) {
      const key = s.date || "unknown";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return [...map.entries()];
  }, [sorted]);

  const downloadIcal = useCallback(() => {
    const name = course?.title || "Розклад";
    const content = generateIcal(scheduledSessions, name);
    const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name.replace(/\s+/g, "_")}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  }, [course, scheduledSessions]);

  const handleSessionDrop = useCallback(async (sessionId: string, newDate: string, newStart: string, newEnd: string) => {
    try {
      await fetch(`/api/learning/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: newDate, startTime: newStart, endTime: newEnd }),
      });
    } catch { /* optimistic — grid already updated locally via schedule-x */ }
  }, []);

  const toggleSelfStudy = useCallback(async (s: LearningSession) => {
    const current = sessionStatuses[s._id!] ?? s.status;
    const next = current === "completed" ? "active" : "completed";
    setSessionStatuses((prev) => ({ ...prev, [s._id!]: next }));
    try {
      await fetch(`/api/learning/sessions/${s._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
    } catch {
      setSessionStatuses((prev) => ({ ...prev, [s._id!]: current }));
    }
  }, [sessionStatuses]);

  const attendanceByKey = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    for (const r of attendance) map.set(`${r.sessionId}:${r.memberId}`, r);
    return map;
  }, [attendance]);

  function sessionAttendanceStats(sessionId: string) {
    const records = members.map((m) => attendanceByKey.get(`${sessionId}:${m._id}`));
    const marked = records.filter(Boolean).length;
    const present = records.filter((r) => r && (r.status === "present" || r.status === "online" || r.status === "late")).length;
    return { marked, present, total: members.length };
  }

  async function cycleAttendance(session: LearningSession, member: CourseMember) {
    if (!canManage) return;
    const k = `${session._id}:${member._id}`;
    const current = attendanceByKey.get(k);
    const idx = current ? (ATTEND_CYCLE.indexOf(current.status as AttendanceStatus) + 1) % ATTEND_CYCLE.length : 0;
    const nextStatus = ATTEND_CYCLE[idx];

    const payload = {
      sessionId: session._id!,
      courseId: session.courseId,
      projectId: session.projectId,
      memberId: member._id!,
      status: nextStatus,
      grade: current?.grade ?? null,
      notes: current?.notes ?? "",
    };

    setAttendance((prev) => {
      const others = prev.filter((r) => !(r.sessionId === session._id && r.memberId === member._id));
      return [...others, { ...(current ?? {} as any), ...payload, _id: current?._id || `tmp-${Date.now()}` } as AttendanceRecord];
    });

    try {
      const res = await fetch("/api/learning/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data?.record) {
        setAttendance((prev) => {
          const others = prev.filter((r) => !(r.sessionId === session._id && r.memberId === member._id));
          return [...others, data.record];
        });
      }
    } catch {
      if (current) {
        setAttendance((prev) => prev.map((r) =>
          r.sessionId === session._id && r.memberId === member._id ? current : r,
        ));
      }
    }
  }

  async function markAll(session: LearningSession, status: AttendanceStatus) {
    if (!canManage) return;
    await Promise.all(
      members.map(async (m) => {
        const k = `${session._id}:${m._id}`;
        const current = attendanceByKey.get(k);
        const payload = {
          sessionId: session._id!,
          courseId: session.courseId,
          projectId: session.projectId,
          memberId: m._id!,
          status,
          grade: current?.grade ?? null,
          notes: current?.notes ?? "",
        };
        setAttendance((prev) => {
          const others = prev.filter((r) => !(r.sessionId === session._id && r.memberId === m._id));
          return [...others, { ...(current ?? {} as any), ...payload, _id: current?._id || `tmp-${Date.now()}` } as AttendanceRecord];
        });
        try {
          const res = await fetch("/api/learning/attendance", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          const data = await res.json();
          if (data?.record) {
            setAttendance((prev) => {
              const others = prev.filter((r) => !(r.sessionId === session._id && r.memberId === m._id));
              return [...others, data.record];
            });
          }
        } catch { /* ignore */ }
      }),
    );
  }

  return (
    <div className="space-y-4">
      <LiquidCard tint="blue" className="overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/60 bg-gradient-to-br from-blue-50/60 via-white to-slate-50/60 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-blue-600" />
            <h2 className="text-sm font-bold tracking-tight text-slate-900">
              {isUk ? "Розклад занять" : "Schedule"}
            </h2>
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
              {scheduledSessions.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`flex items-center gap-1 rounded-md px-2.5 py-1 transition ${
                  viewMode === "list" ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <LayoutList className="h-3 w-3" />
                {isUk ? "Список" : "List"}
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`flex items-center gap-1 rounded-md px-2.5 py-1 transition ${
                  viewMode === "grid" ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <CalendarDays className="h-3 w-3" />
                {isUk ? "Сітка" : "Grid"}
              </button>
            </div>
            {scheduledSessions.length > 0 && (
              <button
                type="button"
                onClick={downloadIcal}
                title={isUk ? "Експорт у .ics (Google Calendar, Apple Calendar…)" : "Export .ics"}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-bold text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
              >
                <Download className="h-3 w-3" />
                .ics
              </button>
            )}
            {canManage && (
              <button type="button" onClick={() => setWizardOpen(true)} className="liquid-cta text-xs">
                <Plus className="h-4 w-4" />
                {isUk ? "Нова пара" : "New session"}
              </button>
            )}
          </div>
        </div>

        {scheduledSessions.length === 0 && sessions.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-5 py-12 text-center">
            <CalendarDays className="h-10 w-10 text-slate-200" />
            <p className="text-sm font-bold text-slate-500">
              {isUk ? "Розклад порожній" : "Schedule is empty"}
            </p>
            <p className="text-xs text-slate-400">
              {isUk ? "Натисніть «Нова пара», щоб додати заняття." : "Click «New session» to add one."}
            </p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="p-2">
            <CalendarGridView
              locale={locale}
              sessions={sessions}
              onSessionClick={(id) => setActiveSessionId(id === activeSessionId ? null : id)}
              onSessionDrop={handleSessionDrop}
            />
            {/* Attendance panel for clicked session in grid mode */}
            {activeSessionId && (() => {
              const s = sessions.find((x) => x._id === activeSessionId);
              if (!s) return null;
              return (
                <div className="mt-3 rounded-xl border border-blue-200/60 bg-blue-50/30">
                  <div className="flex items-center justify-between border-b border-blue-100 px-4 py-2">
                    <p className="text-xs font-bold text-slate-700">{s.title}</p>
                    <button type="button" onClick={() => setActiveSessionId(null)} className="rounded p-0.5 text-slate-400 hover:text-slate-600">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <SessionAttendancePanel
                    session={s}
                    members={members}
                    attendanceByKey={attendanceByKey}
                    canManage={canManage}
                    isUk={isUk}
                    onCycle={cycleAttendance}
                    onMarkAll={markAll}
                  />
                </div>
              );
            })()}
            {/* Self-study items in grid mode */}
            {sessions.some((s) => s.sessionType === "self_study") && (
              <div className="mt-3">
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {isUk ? "Самостійна робота" : "Self study"}
                </p>
                <div className="space-y-1">
                  {sessions.filter((s) => s.sessionType === "self_study").map((s) => {
                    const done = (sessionStatuses[s._id!] ?? s.status) === "completed";
                    return (
                      <div key={s._id} className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 ${done ? "border-slate-100 opacity-60" : "border-slate-200 bg-white"}`}>
                        <button
                          type="button"
                          onClick={() => toggleSelfStudy(s)}
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${done ? "border-emerald-400 bg-emerald-400 text-white" : "border-slate-300 bg-white"}`}
                        >
                          {done && <Check className="h-2.5 w-2.5" />}
                        </button>
                        <span className={`text-xs font-medium ${done ? "text-slate-400 line-through" : "text-slate-700"}`}>{s.title}</span>
                        {s.date && <span className="ml-auto text-[10px] font-mono text-slate-400">{s.date}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100/70">
            {byDate.map(([date, dateSessions]) => {
              const diff = dayDiff(date);
              const isToday = diff === 0;
              const isPast = diff < 0;

              return (
                <div key={date}>
                  {/* Day header */}
                  <div className={`flex items-center gap-2 px-5 py-2 ${
                    isToday ? "bg-blue-50/60" : isPast ? "bg-slate-50/30" : ""
                  }`}>
                    <div className={`h-1.5 w-1.5 rounded-full ${
                      isToday ? "bg-blue-500" : isPast ? "bg-slate-300" : "bg-emerald-400"
                    }`} />
                    <span className={`text-[11px] font-bold uppercase tracking-wider ${
                      isToday ? "text-blue-700" : isPast ? "text-slate-400" : "text-emerald-700"
                    }`}>
                      {formatDate(date, locale)}
                      {isToday && (
                        <span className="ml-1.5 rounded-full bg-blue-100 px-1.5 py-0.5 text-[9px] font-black text-blue-700">
                          {isUk ? "СЬОГОДНІ" : "TODAY"}
                        </span>
                      )}
                    </span>
                  </div>

                  {dateSessions.map((s) => {
                    const isSelfStudy = s.sessionType === "self_study";

                    if (isSelfStudy) {
                      const done = (sessionStatuses[s._id!] ?? s.status) === "completed";
                      return (
                        <div key={s._id} className={`border-b border-slate-100/50 last:border-b-0 ${isPast || done ? "opacity-60" : ""}`}>
                          <div className="flex w-full items-center gap-3 px-5 py-2.5">
                            <button
                              type="button"
                              onClick={() => toggleSelfStudy(s)}
                              title={isUk ? (done ? "Позначити як не пройдено" : "Позначити як пройдено") : (done ? "Mark incomplete" : "Mark complete")}
                              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition ${
                                done
                                  ? "border-emerald-400 bg-emerald-400 text-white"
                                  : "border-slate-300 bg-white hover:border-slate-400"
                              }`}
                            >
                              {done && <Check className="h-3 w-3" />}
                            </button>
                            <span className="mt-0.5 shrink-0 text-base opacity-70">📖</span>
                            <div className="min-w-0 flex-1">
                              <p className={`truncate text-xs font-semibold ${done ? "text-slate-400 line-through" : "text-slate-600"}`}>
                                {s.title}
                              </p>
                              {(s.startTime || s.location) && (
                                <div className="mt-0.5 flex items-center gap-2 text-[10px] text-slate-400">
                                  {s.startTime && <span className="inline-flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{s.startTime}–{s.endTime}</span>}
                                  {s.location && <span className="inline-flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{s.location}</span>}
                                </div>
                              )}
                            </div>
                            <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-slate-400">
                              {isUk ? "Сам. робота" : "Self study"}
                            </span>
                          </div>
                        </div>
                      );
                    }

                    const meta = SESSION_TYPES.find((t) => t.id === s.sessionType);
                    const stats = sessionAttendanceStats(s._id!);
                    const isActive = activeSessionId === s._id;
                    const pct = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;

                    return (
                      <div key={s._id} className={`border-b border-slate-100/50 last:border-b-0 ${isPast ? "opacity-75" : ""}`}>
                        <button
                          type="button"
                          onClick={() => setActiveSessionId(isActive ? null : (s._id ?? null))}
                          className={`flex w-full items-start gap-3 px-5 py-3 text-left transition hover:bg-slate-50/60 ${isActive ? "bg-blue-50/40" : ""}`}
                        >
                          <span className="mt-0.5 shrink-0 text-xl">{meta?.icon ?? "📚"}</span>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <p className="truncate text-sm font-bold text-slate-900">{s.title}</p>
                              <span className="rounded px-1.5 py-0.5 text-[9px] font-bold bg-slate-100 text-slate-500 uppercase">
                                {isUk ? (meta?.uk ?? s.sessionType) : (meta?.en ?? s.sessionType)}
                              </span>
                            </div>
                            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                              <span className="inline-flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {s.startTime}–{s.endTime}
                              </span>
                              {s.location && (
                                <span className="inline-flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {s.location}
                                </span>
                              )}
                            </div>

                            {/* Attendance mini-bar */}
                            {members.length > 0 && (
                              <div className="mt-2 flex items-center gap-2">
                                <div className="h-1 flex-1 overflow-hidden rounded-full bg-slate-100">
                                  <div
                                    className={`h-full rounded-full transition-all ${
                                      stats.marked === 0 ? "bg-slate-200"
                                      : pct >= 80 ? "bg-emerald-400"
                                      : pct >= 50 ? "bg-amber-400"
                                      : "bg-rose-400"
                                    }`}
                                    style={{ width: `${stats.marked === 0 ? 0 : pct}%` }}
                                  />
                                </div>
                                <span className={`shrink-0 text-[10px] font-bold tabular-nums ${
                                  stats.marked === 0 ? "text-slate-400"
                                  : pct >= 80 ? "text-emerald-700"
                                  : pct >= 50 ? "text-amber-700"
                                  : "text-rose-700"
                                }`}>
                                  {stats.marked === 0
                                    ? (isUk ? "не відмічено" : "unmarked")
                                    : `${stats.present}/${stats.total} ${isUk ? "прис." : "pres."}`}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="flex shrink-0 items-center gap-1 ml-1">
                            {canManage && (
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setEditingSession(s); }}
                                className="rounded p-1 text-slate-300 transition hover:bg-slate-100 hover:text-slate-600"
                                title={isUk ? "Редагувати" : "Edit"}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                            )}
                            <ChevronRight className={`h-4 w-4 text-slate-400 transition-transform ${isActive ? "rotate-90" : ""}`} />
                          </div>
                        </button>

                        {/* Inline attendance panel */}
                        {isActive && (
                          <SessionAttendancePanel
                            session={s}
                            members={members}
                            attendanceByKey={attendanceByKey}
                            canManage={canManage}
                            isUk={isUk}
                            onCycle={cycleAttendance}
                            onMarkAll={markAll}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </LiquidCard>

      {wizardOpen && canManage && (
        <QuickAddSessionWizard
          locale={locale}
          projectId={projectId}
          courses={courses}
          modules={modules}
          topics={topics}
          defaultCourse={course}
          onClose={() => setWizardOpen(false)}
        />
      )}

      {editingSession && canManage && (
        <EditSessionModal
          locale={locale}
          session={editingSession}
          onClose={() => setEditingSession(null)}
        />
      )}
    </div>
  );
}

// ── Attendance panel ──────────────────────────────────────────────────────────

function SessionAttendancePanel({
  session,
  members,
  attendanceByKey,
  canManage,
  isUk,
  onCycle,
  onMarkAll,
}: {
  session: LearningSession;
  members: CourseMember[];
  attendanceByKey: Map<string, AttendanceRecord>;
  canManage: boolean;
  isUk: boolean;
  onCycle: (s: LearningSession, m: CourseMember) => Promise<void>;
  onMarkAll: (s: LearningSession, status: AttendanceStatus) => Promise<void>;
}) {
  const [marking, setMarking] = useState<"present" | "absent" | null>(null);

  async function handleMarkAll(status: AttendanceStatus) {
    setMarking(status === "present" ? "present" : "absent");
    await onMarkAll(session, status);
    setMarking(null);
  }

  const stats = {
    present: members.filter((m) => {
      const r = attendanceByKey.get(`${session._id}:${m._id}`);
      return r?.status === "present" || r?.status === "online" || r?.status === "late";
    }).length,
    absent: members.filter((m) => {
      const r = attendanceByKey.get(`${session._id}:${m._id}`);
      return r?.status === "absent";
    }).length,
    unmarked: members.filter((m) => !attendanceByKey.get(`${session._id}:${m._id}`)).length,
  };

  if (members.length === 0) {
    return (
      <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-4 text-center text-xs text-slate-400">
        {isUk
          ? "Немає учасників. Додайте студентів на вкладці «Учасники»."
          : "No members. Add students in the Members tab."}
      </div>
    );
  }

  return (
    <div className="border-t border-slate-100 bg-gradient-to-b from-blue-50/30 to-white">
      {/* Panel header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3">
        <div className="flex items-center gap-3 text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
            <span className="font-bold text-emerald-700">{stats.present}</span>
            {isUk ? " прис." : " pres."}
          </span>
          <span className="flex items-center gap-1">
            <XCircle className="h-3 w-3 text-rose-400" />
            <span className="font-bold text-rose-700">{stats.absent}</span>
            {isUk ? " відс." : " abs."}
          </span>
          {stats.unmarked > 0 && (
            <span className="text-slate-400">
              {stats.unmarked} {isUk ? "не відм." : "unmarked"}
            </span>
          )}
        </div>
        {canManage && (
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => handleMarkAll("present")}
              disabled={marking !== null}
              className="inline-flex items-center gap-1 rounded-lg bg-emerald-100 px-2.5 py-1.5 text-[10px] font-bold text-emerald-800 transition hover:bg-emerald-200 disabled:opacity-60"
            >
              {marking === "present" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
              {isUk ? "Всі присутні" : "All present"}
            </button>
            <button
              type="button"
              onClick={() => handleMarkAll("absent")}
              disabled={marking !== null}
              className="inline-flex items-center gap-1 rounded-lg bg-rose-100 px-2.5 py-1.5 text-[10px] font-bold text-rose-800 transition hover:bg-rose-200 disabled:opacity-60"
            >
              {marking === "absent" ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
              {isUk ? "Всі відсутні" : "All absent"}
            </button>
          </div>
        )}
      </div>

      {/* Member list */}
      <div className="grid gap-0.5 px-5 pb-4 sm:grid-cols-2 xl:grid-cols-3">
        {members.map((m) => {
          const rec = attendanceByKey.get(`${session._id}:${m._id}`);
          const status = (rec?.status ?? "none") as AttendanceStatus | "none";
          const meta = ATTEND_META[status];
          const Icon = meta.icon;

          const colorMap: Record<string, string> = {
            emerald: "bg-emerald-50 border-emerald-200 text-emerald-800",
            rose:    "bg-rose-50 border-rose-200 text-rose-800",
            amber:   "bg-amber-50 border-amber-200 text-amber-800",
            blue:    "bg-blue-50 border-blue-200 text-blue-800",
            slate:   "bg-slate-50 border-slate-200 text-slate-500",
          };

          return (
            <button
              key={m._id}
              type="button"
              onClick={() => onCycle(session, m)}
              disabled={!canManage}
              className={`flex items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition hover:shadow-sm disabled:cursor-default ${
                colorMap[meta.color] ?? colorMap.slate
              }`}
            >
              <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                status === "none" ? "bg-slate-200" : `bg-${meta.color}-200`
              }`}>
                {status !== "none" && <Icon className="h-3.5 w-3.5" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold leading-tight">{m.fullName}</p>
                <p className="text-[10px] leading-tight opacity-70">
                  {isUk ? meta.label.uk : meta.label.en}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Edit Session Modal ────────────────────────────────────────────────────────

function EditSessionModal({
  locale, session, onClose,
}: {
  locale: "uk" | "en";
  session: LearningSession;
  onClose: () => void;
}) {
  const isUk = locale === "uk";
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [title, setTitle]         = useState(session.title);
  const [sessionType, setType]    = useState<SessionType>(session.sessionType as SessionType);
  const [date, setDate]           = useState(session.date || "");
  const [startTime, setStartTime] = useState(session.startTime || "");
  const [endTime, setEndTime]     = useState(session.endTime || "");
  const [location, setLocation]   = useState(session.location || "");
  const [notes, setNotes]         = useState(session.notes || "");
  const [busy, setBusy]           = useState(false);
  const [error, setError]         = useState<string | null>(null);

  async function handleSave() {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/learning/sessions/${session._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, sessionType, date, startTime, endTime, location, notes }),
      });
      if (!res.ok) throw new Error("save_failed");
      startTransition(() => { router.refresh(); onClose(); });
    } catch {
      setError(isUk ? "Помилка збереження" : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!confirm(isUk ? `Видалити «${session.title}»?` : `Delete "${session.title}"?`)) return;
    setBusy(true);
    try {
      await fetch(`/api/learning/sessions/${session._id}`, { method: "DELETE" });
      startTransition(() => { router.refresh(); onClose(); });
    } catch {
      setError(isUk ? "Помилка видалення" : "Delete failed");
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
      onClick={onClose}>
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}>
        <div className="h-1 bg-gradient-to-r from-blue-500 to-sky-400" />
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
          <p className="text-sm font-bold text-slate-900">{isUk ? "Редагувати заняття" : "Edit session"}</p>
          <button type="button" onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[calc(100vh-180px)] overflow-y-auto px-5 py-4 space-y-3">
          {/* Title */}
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {isUk ? "Назва" : "Title"}
            </label>
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              autoFocus className="input-control w-full text-sm" />
          </div>

          {/* Type pills */}
          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {isUk ? "Тип" : "Type"}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {SESSION_TYPES.map((t) => (
                <button key={t.id} type="button" onClick={() => setType(t.id)}
                  className={`rounded-lg border px-2.5 py-1 text-[10px] font-bold transition ${
                    sessionType === t.id
                      ? `border-${t.color}-300 bg-${t.color}-50 text-${t.color}-700`
                      : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                  }`}>
                  {t.icon} {isUk ? t.uk : t.en}
                </button>
              ))}
            </div>
          </div>

          {/* Date + time */}
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-3 sm:col-span-1">
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {isUk ? "Дата" : "Date"}
              </label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="input-control w-full text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {isUk ? "Початок" : "Start"}
              </label>
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)}
                className="input-control w-full text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {isUk ? "Кінець" : "End"}
              </label>
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)}
                className="input-control w-full text-sm" />
            </div>
          </div>

          {/* Location + notes */}
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {isUk ? "Локація" : "Location"}
            </label>
            <input value={location} onChange={(e) => setLocation(e.target.value)}
              placeholder={isUk ? "Ауд. 402 / Zoom" : "Room 402 / Zoom"}
              className="input-control w-full text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {isUk ? "Нотатки" : "Notes"}
            </label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              className="input-control w-full resize-none text-sm" />
          </div>

          {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3">
          <button type="button" onClick={handleDelete} disabled={busy}
            className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50">
            <Trash2 className="h-3.5 w-3.5" />
            {isUk ? "Видалити" : "Delete"}
          </button>
          <div className="flex gap-2">
            <button type="button" onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">
              {isUk ? "Скасувати" : "Cancel"}
            </button>
            <button type="button" onClick={handleSave} disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-60">
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              {isUk ? "Зберегти" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Quick Add Session Wizard ──────────────────────────────────────────────────

function QuickAddSessionWizard({
  locale,
  projectId,
  courses,
  modules,
  topics,
  defaultCourse,
  onClose,
}: {
  locale: "uk" | "en";
  projectId: string;
  courses: LearningCourse[];
  modules: LearningModule[];
  topics: LearningTopic[];
  defaultCourse: LearningCourse | null;
  onClose: () => void;
}) {
  const isUk = locale === "uk";
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [step, setStep]           = useState<1 | 2 | 3>(1);
  const [sessionType, setType]    = useState<SessionType>("lecture");
  const [date, setDate]           = useState(() => new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime]     = useState("11:30");
  const [location, setLocation]   = useState("");
  const [courseId, setCourseId]   = useState(defaultCourse?._id ?? courses[0]?._id ?? "");
  const [moduleId, setModuleId]   = useState("");
  const [topicId, setTopicId]     = useState("");
  const [title, setTitle]         = useState("");
  const [busy, setBusy]           = useState(false);
  const [errorMsg, setErrorMsg]   = useState<string | null>(null);

  const courseModules = useMemo(() => modules.filter((m) => m.courseId === courseId), [modules, courseId]);
  const moduleTopics  = useMemo(
    () => (moduleId
      ? topics.filter((t) => t.moduleId === moduleId && t.topicType === sessionType)
      : topics.filter((t) => t.courseId === courseId && t.topicType === sessionType)
    ),
    [topics, moduleId, courseId, sessionType],
  );

  function durationHours(): number {
    try {
      const [sh, sm] = startTime.split(":").map(Number);
      const [eh, em] = endTime.split(":").map(Number);
      return Math.max(0.25, ((eh * 60 + em) - (sh * 60 + sm)) / 60);
    } catch { return 1.5; }
  }

  async function handleSave() {
    setErrorMsg(null);
    if (!courseId || !date || !startTime || !endTime) {
      setErrorMsg(isUk ? "Заповніть курс, дату і час." : "Fill course, date and time.");
      return;
    }
    const finalTitle = title.trim() || (
      topicId ? topics.find((t) => t._id === topicId)?.title :
      moduleId ? modules.find((m) => m._id === moduleId)?.title :
      SESSION_TYPES.find((t) => t.id === sessionType)?.[isUk ? "uk" : "en"]
    ) || "";
    if (!finalTitle) {
      setErrorMsg(isUk ? "Додайте назву." : "Add a title.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/learning/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId, projectId, moduleId: moduleId || "", topicId: topicId || "",
          title: finalTitle.slice(0, 300), sessionType, date, startTime, endTime,
          durationHours: durationHours(), attendance: null, grade: null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "save_failed");
      }
      startTransition(() => { router.refresh(); onClose(); });
    } catch (e: any) {
      setErrorMsg(e?.message || (isUk ? "Помилка збереження" : "Save failed"));
    } finally {
      setBusy(false);
    }
  }

  const typeMeta = SESSION_TYPES.find((t) => t.id === sessionType)!;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/55 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="my-8 w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <LiquidCard className="overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-slate-200/60 bg-gradient-to-br from-emerald-50/70 via-white to-slate-50/60 px-5 py-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-600" />
              <h2 className="text-base font-bold text-slate-900">
                {isUk ? "Нова пара" : "New session"}
              </h2>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                {step}/3
              </span>
            </div>
            <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-4 p-5">
            {errorMsg && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
                {errorMsg}
              </div>
            )}

            {step === 1 && (
              <div>
                <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                  {isUk ? "Крок 1 / 3 — Тип пари" : "Step 1 / 3 — Session type"}
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {SESSION_TYPES.map((t) => {
                    const active = t.id === sessionType;
                    return (
                      <button key={t.id} type="button" onClick={() => setType(t.id)}
                        className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition ${
                          active ? `border-${t.color}-300 bg-${t.color}-50 shadow-sm`
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                        }`}>
                        <span className="text-3xl">{t.icon}</span>
                        <span className={`text-xs font-bold ${active ? `text-${t.color}-700` : "text-slate-700"}`}>
                          {isUk ? t.uk : t.en}
                        </span>
                        {active && <Check className={`h-3.5 w-3.5 text-${t.color}-600`} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3">
                <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                  {isUk ? "Крок 2 / 3 — Дата і час" : "Step 2 / 3 — Date & time"}
                </p>
                <div className="grid gap-3 sm:grid-cols-[1fr_120px_120px]">
                  <label className="block space-y-1">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      <CalendarDays className="h-3 w-3" />
                      {isUk ? "Дата" : "Date"}
                    </span>
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input-control w-full rounded-xl px-3 py-2 text-sm" />
                  </label>
                  <label className="block space-y-1">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      <Clock className="h-3 w-3" />
                      {isUk ? "Початок" : "Start"}
                    </span>
                    <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="input-control w-full rounded-xl px-3 py-2 text-sm" />
                  </label>
                  <label className="block space-y-1">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      <Clock className="h-3 w-3" />
                      {isUk ? "Кінець" : "End"}
                    </span>
                    <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="input-control w-full rounded-xl px-3 py-2 text-sm" />
                  </label>
                </div>
                <label className="block space-y-1">
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    <MapPin className="h-3 w-3" />
                    {isUk ? "Локація / аудиторія" : "Location"}
                  </span>
                  <input value={location} onChange={(e) => setLocation(e.target.value)}
                    placeholder={isUk ? "Ауд. 402 / Zoom" : "Room 402 / Zoom"}
                    className="input-control w-full rounded-xl px-3 py-2 text-sm" />
                </label>
                <p className="text-xs text-slate-400">
                  {isUk ? "Тривалість" : "Duration"}: <span className="font-mono">{durationHours().toFixed(1)} год</span>
                </p>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-3">
                <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                  {isUk ? "Крок 3 / 3 — Курс, модуль, тема" : "Step 3 / 3 — Course, module, topic"}
                </p>
                <label className="block space-y-1">
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    <BookOpen className="h-3 w-3" />
                    {isUk ? "Курс *" : "Course *"}
                  </span>
                  <select value={courseId} onChange={(e) => { setCourseId(e.target.value); setModuleId(""); setTopicId(""); }}
                    className="input-control w-full rounded-xl px-3 py-2 text-sm">
                    {courses.length === 0 && <option value="">— {isUk ? "немає курсів" : "no courses"} —</option>}
                    {courses.map((c) => (
                      <option key={c._id} value={c._id}>{c.code ? `${c.code} · ` : ""}{c.title}</option>
                    ))}
                  </select>
                </label>
                {courseModules.length > 0 && (
                  <label className="block space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      {isUk ? "Модуль" : "Module"}
                    </span>
                    <select value={moduleId} onChange={(e) => { setModuleId(e.target.value); setTopicId(""); }}
                      className="input-control w-full rounded-xl px-3 py-2 text-sm">
                      <option value="">— {isUk ? "не обрано" : "none"} —</option>
                      {courseModules.map((m) => <option key={m._id} value={m._id}>{m.title}</option>)}
                    </select>
                  </label>
                )}
                {moduleTopics.length > 0 && (
                  <label className="block space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      {isUk ? `Тема (${typeMeta.uk.toLowerCase()})` : `Topic (${typeMeta.en.toLowerCase()})`}
                    </span>
                    <select value={topicId} onChange={(e) => {
                      setTopicId(e.target.value);
                      const t = topics.find((x) => x._id === e.target.value);
                      if (t && !title) setTitle(t.title);
                    }} className="input-control w-full rounded-xl px-3 py-2 text-sm">
                      <option value="">— {isUk ? "не обрано" : "none"} —</option>
                      {moduleTopics.map((t) => <option key={t._id} value={t._id}>{t.title}</option>)}
                    </select>
                  </label>
                )}
                <label className="block space-y-1">
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    <Hash className="h-3 w-3" />
                    {isUk ? "Назва пари" : "Session title"}
                  </span>
                  <input value={title} onChange={(e) => setTitle(e.target.value)}
                    placeholder={isUk ? "Наприклад: «Системний підхід»" : "e.g. \"Systems approach\""}
                    className="input-control w-full rounded-xl px-3 py-2 text-sm" />
                </label>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-slate-200/60 bg-slate-50/60 px-5 py-3">
            <button type="button"
              onClick={() => { if (step === 1) onClose(); else setStep((s) => (s - 1) as 1 | 2 | 3); }}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              <ArrowLeft className="h-3.5 w-3.5" />
              {step === 1 ? (isUk ? "Скасувати" : "Cancel") : (isUk ? "Назад" : "Back")}
            </button>
            {step < 3 ? (
              <button type="button" onClick={() => setStep((s) => (s + 1) as 2 | 3)} className="liquid-cta text-sm">
                {isUk ? "Далі" : "Next"} <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button type="button" onClick={handleSave} disabled={busy} className="liquid-cta text-sm disabled:opacity-60">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
                {isUk ? "Створити" : "Create"}
              </button>
            )}
          </div>
        </LiquidCard>
      </div>
    </div>
  );
}
