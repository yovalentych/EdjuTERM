"use client";

import { useMemo, useState } from "react";
import { BarChart3, CalendarDays, ClipboardList, GraduationCap, Plus, Users, type LucideIcon } from "lucide-react";
import { LiquidCard, LiquidTabs } from "@/components/ui/liquid";
import type {
  AttendanceRecord,
  CourseMember,
  LearningAssessment,
  LearningCourse,
  LearningModule,
  LearningSession,
  LearningTopic,
} from "@/lib/schemas";
import { GradebookView } from "./gradebook-view";
import { MembersView } from "./members-view";
import { ScheduleView } from "./schedule-view";
import { CoursesOverview } from "./courses-overview";
import { AssessmentsView } from "./assessments-view";

export type HubTab = "gradebook" | "schedule" | "courses" | "assessments" | "members";

export function LearningHub({
  locale,
  projectId,
  canManage,
  initialTab,
  initialCourseId,
  courses,
  modules,
  topics,
  assessments,
  sessions,
  members,
  attendance,
}: {
  locale: "uk" | "en";
  projectId: string;
  canManage: boolean;
  initialTab: HubTab;
  initialCourseId: string | null;
  courses: LearningCourse[];
  modules: LearningModule[];
  topics: LearningTopic[];
  assessments: LearningAssessment[];
  sessions: LearningSession[];
  members: CourseMember[];
  attendance: AttendanceRecord[];
}) {
  const isUk = locale === "uk";
  const [tab, setTab] = useState<HubTab>(initialTab);
  const [activeCourseId, setActiveCourseId] = useState<string | null>(initialCourseId);

  const activeCourse = courses.find((c) => c._id === activeCourseId) ?? null;
  const courseSessions = useMemo(
    () => (activeCourseId ? sessions.filter((s) => s.courseId === activeCourseId) : sessions),
    [sessions, activeCourseId],
  );
  const courseMembers = useMemo(
    () => (activeCourseId ? members.filter((m) => m.courseId === activeCourseId) : members),
    [members, activeCourseId],
  );
  const courseAssessments = useMemo(
    () => (activeCourseId ? assessments.filter((a) => a.courseId === activeCourseId) : assessments),
    [assessments, activeCourseId],
  );

  return (
    <div className="space-y-4">
      {/* ── Course picker + tabs ─────────────────────────────── */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <CoursePicker
          courses={courses}
          activeCourseId={activeCourseId}
          onChange={setActiveCourseId}
          isUk={isUk}
        />

        <LiquidTabs<HubTab>
          tint="emerald"
          active={tab}
          onChange={setTab}
          tabs={[
            { id: "gradebook",   label: isUk ? "Журнал"    : "Gradebook",   icon: <ClipboardList className="h-3.5 w-3.5" />, badge: courseMembers.length || null },
            { id: "schedule",    label: isUk ? "Розклад"   : "Schedule",    icon: <CalendarDays className="h-3.5 w-3.5" />,  badge: courseSessions.length || null },
            { id: "courses",     label: isUk ? "Курси"     : "Courses",     icon: <GraduationCap className="h-3.5 w-3.5" />, badge: courses.length || null },
            { id: "assessments", label: isUk ? "Оцінки"    : "Assessments", icon: <BarChart3 className="h-3.5 w-3.5" />,     badge: courseAssessments.length || null },
            { id: "members",     label: isUk ? "Учасники"  : "Members",     icon: <Users className="h-3.5 w-3.5" />,         badge: courseMembers.length || null },
          ]}
        />
      </div>

      {/* ── Tab content ──────────────────────────────────────── */}
      {tab === "gradebook" && (
        <GradebookView
          locale={locale}
          canManage={canManage}
          course={activeCourse}
          members={courseMembers}
          sessions={courseSessions}
          attendance={attendance}
        />
      )}
      {tab === "schedule" && (
        <ScheduleView
          locale={locale}
          canManage={canManage}
          course={activeCourse}
          courses={courses}
          modules={modules}
          topics={topics}
          sessions={courseSessions}
          members={courseMembers}
          attendance={attendance}
          projectId={projectId}
        />
      )}
      {tab === "courses" && (
        <CoursesOverview
          locale={locale}
          courses={courses}
          modules={modules}
          topics={topics}
          members={members}
          onPickCourse={(id) => { setActiveCourseId(id); setTab("gradebook"); }}
        />
      )}
      {tab === "assessments" && (
        <AssessmentsView
          locale={locale}
          course={activeCourse}
          assessments={courseAssessments}
          members={courseMembers}
          canManage={canManage}
          projectId={projectId}
        />
      )}
      {tab === "members" && (
        <MembersView
          locale={locale}
          canManage={canManage}
          course={activeCourse}
          projectId={projectId}
          members={courseMembers}
        />
      )}
    </div>
  );
}

function CoursePicker({
  courses,
  activeCourseId,
  onChange,
  isUk,
}: {
  courses: LearningCourse[];
  activeCourseId: string | null;
  onChange: (id: string | null) => void;
  isUk: boolean;
}) {
  if (courses.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <button
        type="button"
        onClick={() => onChange(null)}
        className={[
          "rounded-full px-3 py-1.5 text-[11px] font-bold transition",
          activeCourseId === null
            ? "bg-emerald-600 text-white shadow-sm"
            : "bg-slate-100 text-slate-500 hover:bg-slate-200",
        ].join(" ")}
      >
        {isUk ? "Усі" : "All"}
      </button>
      {courses.map((c) => {
        const active = activeCourseId === c._id;
        return (
          <button
            key={c._id}
            type="button"
            onClick={() => onChange(c._id ?? null)}
            title={c.title}
            className={[
              "max-w-[180px] truncate rounded-full px-3 py-1.5 text-[11px] font-bold transition",
              active
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200",
            ].join(" ")}
          >
            {c.code ? `${c.code} · ` : ""}{c.title}
          </button>
        );
      })}
    </div>
  );
}
