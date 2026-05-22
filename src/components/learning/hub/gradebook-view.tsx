"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock, Sparkles, UserMinus, Wifi, XCircle } from "lucide-react";
import { LiquidCard } from "@/components/ui/liquid";
import type {
  AttendanceRecord,
  CourseMember,
  LearningCourse,
  LearningSession,
} from "@/lib/schemas";

type AttendanceStatus = AttendanceRecord["status"];

const STATUS_META: Record<AttendanceStatus | "none", { label: { uk: string; en: string }; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  present: { label: { uk: "присутній", en: "present" }, color: "emerald", icon: CheckCircle2 },
  absent:  { label: { uk: "відсутній", en: "absent" },  color: "rose",    icon: XCircle },
  excused: { label: { uk: "поваж.",    en: "excused" }, color: "amber",   icon: UserMinus },
  late:    { label: { uk: "запізн.",   en: "late" },    color: "amber",   icon: Clock },
  online:  { label: { uk: "онлайн",    en: "online" },  color: "blue",    icon: Wifi },
  none:    { label: { uk: "—",         en: "—" },       color: "slate",   icon: () => null },
};

const STATUS_CYCLE: AttendanceStatus[] = ["present", "absent", "excused", "late", "online"];

export function GradebookView({
  locale,
  canManage,
  course,
  members,
  sessions,
  attendance: attendanceProp,
}: {
  locale: "uk" | "en";
  canManage: boolean;
  course: LearningCourse | null;
  members: CourseMember[];
  sessions: LearningSession[];
  attendance: AttendanceRecord[];
}) {
  const isUk = locale === "uk";
  const router = useRouter();
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(attendanceProp);
  const [, startTransition] = useTransition();

  const sortedSessions = useMemo(
    () => sessions.slice().sort((a, b) => (a.date || "").localeCompare(b.date || "") || (a.startTime || "").localeCompare(b.startTime || "")),
    [sessions],
  );

  const byKey = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    for (const r of attendance) {
      map.set(`${r.sessionId}:${r.memberId}`, r);
    }
    return map;
  }, [attendance]);

  if (!course) {
    return (
      <LiquidCard tint="amber" className="text-center">
        <h3 className="text-sm font-bold text-slate-900">
          {isUk ? "Оберіть курс зверху" : "Pick a course at the top"}
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          {isUk ? "Журнал відображається для конкретного курсу." : "Gradebook is shown per-course."}
        </p>
      </LiquidCard>
    );
  }

  if (members.length === 0) {
    return (
      <LiquidCard tint="blue" className="text-center" accent>
        <h3 className="text-sm font-bold text-slate-900">
          {isUk ? "Немає учасників" : "No members yet"}
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          {isUk
            ? "Перейдіть на вкладку «Учасники» і додайте студентів."
            : "Go to the Members tab and add students."}
        </p>
      </LiquidCard>
    );
  }

  if (sortedSessions.length === 0) {
    return (
      <LiquidCard tint="violet" className="text-center" accent>
        <h3 className="text-sm font-bold text-slate-900">
          {isUk ? "Немає сесій" : "No sessions yet"}
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          {isUk
            ? "Створіть лекції/семінари на вкладці «Розклад»."
            : "Create lectures/seminars in the Schedule tab."}
        </p>
      </LiquidCard>
    );
  }

  async function cycleStatus(session: LearningSession, member: CourseMember) {
    if (!canManage) return;
    const k = `${session._id}:${member._id}`;
    const current = byKey.get(k);
    const currentStatus = current?.status as AttendanceStatus | undefined;
    const nextIdx = currentStatus ? (STATUS_CYCLE.indexOf(currentStatus) + 1) % STATUS_CYCLE.length : 0;
    const nextStatus = STATUS_CYCLE[nextIdx];

    const payload = {
      sessionId: session._id!,
      courseId:  session.courseId,
      projectId: session.projectId,
      memberId:  member._id!,
      status:    nextStatus,
      grade:     current?.grade ?? null,
      notes:     current?.notes ?? "",
    };

    // Optimistic update.
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
      startTransition(() => router.refresh());
    } catch {
      // revert
      setAttendance((prev) => {
        if (!current) {
          return prev.filter((r) => !(r.sessionId === session._id && r.memberId === member._id));
        }
        return prev.map((r) =>
          r.sessionId === session._id && r.memberId === member._id ? current : r,
        );
      });
    }
  }

  async function setGrade(session: LearningSession, member: CourseMember, raw: string) {
    if (!canManage) return;
    const trimmed = raw.trim();
    const grade = trimmed === "" ? null : Number(trimmed);
    if (grade !== null && (Number.isNaN(grade) || grade < 0 || grade > 100)) return;

    const k = `${session._id}:${member._id}`;
    const current = byKey.get(k);

    const payload = {
      sessionId: session._id!,
      courseId:  session.courseId,
      projectId: session.projectId,
      memberId:  member._id!,
      status:    (current?.status as AttendanceStatus) ?? "present",
      grade,
      notes:     current?.notes ?? "",
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
      // ignore
    }
  }

  return (
    <LiquidCard tint="emerald" className="overflow-hidden p-0">
      <div className="flex items-center justify-between border-b border-slate-200/60 bg-gradient-to-br from-emerald-50/60 via-white to-slate-50/60 px-5 py-3.5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-600" />
            <h2 className="text-sm font-bold tracking-tight text-slate-900">
              {course.code ? `${course.code} · ` : ""}{course.title}
            </h2>
          </div>
          <p className="mt-0.5 text-[11px] text-slate-500">
            {isUk
              ? `${members.length} учасник.${members.length === 1 ? "" : "ів"} · ${sortedSessions.length} сесій`
              : `${members.length} members · ${sortedSessions.length} sessions`}
          </p>
        </div>
        <div className="hidden items-center gap-2 text-[10px] text-slate-400 sm:flex">
          {isUk ? "Клік по комірці — змінити статус" : "Click cell — change status"}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200/60 bg-slate-50/40">
              <th className="sticky left-0 z-10 bg-slate-50/95 px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500 backdrop-blur-sm">
                {isUk ? "Учасник" : "Member"}
              </th>
              {sortedSessions.map((s) => (
                <th key={s._id} className="min-w-[90px] px-2 py-2 text-center text-[10px] font-bold tracking-wider text-slate-500" title={s.title}>
                  <div className="font-mono">{s.date}</div>
                  <div className="text-[9px] text-slate-400">{s.startTime}</div>
                  <SessionTypeBadge type={s.sessionType} isUk={isUk} />
                </th>
              ))}
              <th className="px-3 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {isUk ? "Середн./%" : "Avg/%"}
              </th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => {
              const stats = computeMemberStats(m, sortedSessions, byKey);
              return (
                <tr key={m._id} className="border-b border-slate-100/70 hover:bg-slate-50/40">
                  <td className="sticky left-0 z-10 bg-white/95 px-4 py-2 backdrop-blur-sm">
                    <p className="truncate text-sm font-bold text-slate-900">{m.fullName}</p>
                    <p className="truncate text-[10px] text-slate-500">
                      {m.group || m.studentId || m.email || "—"}
                    </p>
                  </td>
                  {sortedSessions.map((s) => {
                    const rec = byKey.get(`${s._id}:${m._id}`);
                    return (
                      <td key={s._id} className="px-2 py-2 text-center">
                        <Cell
                          record={rec}
                          isUk={isUk}
                          canManage={canManage}
                          onCycleStatus={() => cycleStatus(s, m)}
                          onSetGrade={(v) => setGrade(s, m, v)}
                        />
                      </td>
                    );
                  })}
                  <td className="px-3 py-2 text-right">
                    <div className="text-sm font-bold tabular-nums text-slate-900">
                      {stats.avgGrade != null ? stats.avgGrade.toFixed(1) : "—"}
                    </div>
                    <div className={`text-[10px] font-bold tabular-nums ${
                      stats.attendancePct >= 80 ? "text-emerald-700"
                      : stats.attendancePct >= 50 ? "text-amber-700"
                      : "text-rose-700"
                    }`}>
                      {stats.attendancePct}% {isUk ? "відв." : "att."}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </LiquidCard>
  );
}

function Cell({
  record,
  isUk,
  canManage,
  onCycleStatus,
  onSetGrade,
}: {
  record?: AttendanceRecord;
  isUk: boolean;
  canManage: boolean;
  onCycleStatus: () => void;
  onSetGrade: (v: string) => void;
}) {
  const status = (record?.status ?? "none") as AttendanceStatus | "none";
  const meta = STATUS_META[status];
  const Icon = meta.icon;

  const tintBg: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
    rose:    "bg-rose-50 text-rose-700 hover:bg-rose-100",
    amber:   "bg-amber-50 text-amber-700 hover:bg-amber-100",
    blue:    "bg-blue-50 text-blue-700 hover:bg-blue-100",
    slate:   "bg-slate-50 text-slate-400 hover:bg-slate-100",
  };

  return (
    <div className="flex flex-col items-center gap-0.5">
      <button
        type="button"
        onClick={onCycleStatus}
        disabled={!canManage}
        className={`inline-flex h-7 w-7 items-center justify-center rounded-md transition disabled:cursor-default ${tintBg[meta.color]}`}
        title={isUk ? meta.label.uk : meta.label.en}
      >
        {status !== "none" && <Icon className="h-3.5 w-3.5" />}
      </button>
      <input
        type="number"
        min={0}
        max={100}
        defaultValue={record?.grade ?? ""}
        onBlur={(e) => onSetGrade(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
        disabled={!canManage}
        placeholder="—"
        className="w-12 rounded-md border border-slate-200 bg-white px-1 py-0.5 text-center text-[11px] font-bold text-slate-700 outline-none focus:border-emerald-400 disabled:bg-slate-50"
      />
    </div>
  );
}

function SessionTypeBadge({ type, isUk }: { type: string; isUk: boolean }) {
  const map: Record<string, { uk: string; en: string; color: string }> = {
    lecture:      { uk: "лек", en: "lec", color: "bg-blue-100 text-blue-700" },
    seminar:      { uk: "сем", en: "sem", color: "bg-emerald-100 text-emerald-700" },
    practical:    { uk: "пр",  en: "pr",  color: "bg-amber-100 text-amber-700" },
    lab:          { uk: "лаб", en: "lab", color: "bg-violet-100 text-violet-700" },
    self_study:   { uk: "сам", en: "ss",  color: "bg-slate-100 text-slate-600" },
    consultation: { uk: "конс", en: "cn", color: "bg-rose-100 text-rose-700" },
  };
  const m = map[type] ?? { uk: type, en: type, color: "bg-slate-100 text-slate-600" };
  return (
    <span className={`mt-0.5 inline-block rounded px-1 py-0.5 text-[8px] font-bold uppercase ${m.color}`}>
      {isUk ? m.uk : m.en}
    </span>
  );
}

function computeMemberStats(
  member: CourseMember,
  sessions: LearningSession[],
  byKey: Map<string, AttendanceRecord>,
): { avgGrade: number | null; attendancePct: number } {
  const grades: number[] = [];
  let attended = 0;
  let total = 0;

  for (const s of sessions) {
    const r = byKey.get(`${s._id}:${member._id}`);
    if (r) {
      total++;
      if (r.status === "present" || r.status === "online" || r.status === "late") attended++;
      if (r.grade != null) grades.push(r.grade);
    }
  }

  const avg = grades.length > 0 ? grades.reduce((a, b) => a + b, 0) / grades.length : null;
  const pct = total > 0 ? Math.round((attended / total) * 100) : 0;
  return { avgGrade: avg, attendancePct: pct };
}
