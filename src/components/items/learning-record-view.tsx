"use server";

import Link from "next/link";
import {
  GraduationCap, BookOpen, FlaskConical, CalendarDays, Target,
  Award, Users, BarChart3, Lightbulb, FileText, TrendingUp,
  Clock, ChevronRight, Plus, Microscope, DollarSign, Notebook,
} from "lucide-react";
import { CompletionBlock } from "./completion-block";
import { LiquidCard, LiquidStatTile } from "@/components/ui/liquid";
import { LearningRecordTabs } from "./learning-record-tabs";
import { ItemEditButton } from "./item-edit-button";
import type { WorkspaceItem } from "@/lib/workspaces";
import type { ItemType } from "@/lib/workspaces-meta";
import { ITEM_TYPE_META } from "@/lib/workspaces-meta";
import {
  listCourses,
  listModulesForProject,
  listTopicsForProject,
  listAssessmentsForProject,
  listSessionsForProject,
  listAssignmentsForProject,
} from "@/lib/learning";
import { getPhdPlan } from "@/lib/phd-plan";
import { listResearchStages } from "@/lib/research-plan";
import { listTasks, listMilestones } from "@/lib/planning";
import { listExperiments } from "@/lib/experiments";
import { listBudgetPeriods } from "@/lib/budget";

type LearningType = "bachelor" | "master" | "phd";

const TYPE_LABELS: Record<LearningType, { uk: string; en: string; color: string; sciLabel: { uk: string; en: string } }> = {
  bachelor: {
    uk: "Бакалаврат", en: "Bachelor's",
    color: "#059669",
    sciLabel: { uk: "Кваліфікаційна робота", en: "Thesis" },
  },
  master: {
    uk: "Магістратура", en: "Master's",
    color: "#0369a1",
    sciLabel: { uk: "Магістерська робота", en: "Master's Thesis" },
  },
  phd: {
    uk: "Аспірантура", en: "PhD",
    color: "#7c3aed",
    sciLabel: { uk: "Дисертація", en: "Dissertation" },
  },
};

export async function LearningRecordView({
  item,
  locale,
  wsId,
  wsUniversity,
}: {
  item: WorkspaceItem;
  locale: string;
  wsId: string;
  wsUniversity?: string;
}) {
  const isUk = locale === "uk";
  const learningType = item.type as LearningType;
  const meta = ITEM_TYPE_META[item.type as ItemType];
  const typeInfo = TYPE_LABELS[learningType];
  const dataId = item.legacyProjectId || item._id || "";

  // ── Parallel data fetch ───────────────────────────────────────────────────
  const [
    courses,
    modules,
    topics,
    assessments,
    sessions,
    assignments,
    phdPlan,
    stages,
    tasks,
    milestones,
    experiments,
    budgetPeriods,
  ] = await Promise.all([
    listCourses(dataId).catch(() => []),
    listModulesForProject(dataId).catch(() => []),
    listTopicsForProject(dataId).catch(() => []),
    listAssessmentsForProject(dataId).catch(() => []),
    listSessionsForProject(dataId).catch(() => []),
    listAssignmentsForProject(dataId).catch(() => []),
    learningType === "phd" ? getPhdPlan(dataId).catch(() => null) : Promise.resolve(null),
    listResearchStages(dataId).catch(() => []),
    listTasks(dataId).catch(() => []),
    listMilestones(dataId).catch(() => []),
    learningType === "phd" ? listExperiments(dataId).catch(() => []) : Promise.resolve([]),
    learningType === "phd" ? listBudgetPeriods(dataId).catch(() => []) : Promise.resolve([]),
  ]);

  // ── Stats derivations ─────────────────────────────────────────────────────
  const totalCredits = courses.reduce((s, c) => s + (Number(c.credits) || 0), 0);
  const completedCourses = courses.filter((c) => c.status === "completed");
  const gradedAssessments = assessments.filter((a) => a.achievedScore !== null && a.achievedScore !== undefined);
  const avgScore = gradedAssessments.length
    ? Math.round(gradedAssessments.reduce((s, a) => s + (Number(a.achievedScore) || 0), 0) / gradedAssessments.length)
    : null;
  const presentSessions = sessions.filter((s) => s.attendance === "present" || s.attendance === "late");
  const attendancePct = sessions.length
    ? Math.round((presentSessions.length / sessions.length) * 100)
    : null;

  const activeTasks = tasks.filter((t) => t.status !== "done" && t.status !== "archived" && t.status !== "cancelled");
  const doneTasks = tasks.filter((t) => t.status === "done");
  const completedStages = stages.filter((s) => s.status === "completed" || s.status === "reported");

  // Phd-specific
  const earnedCredits = phdPlan
    ? (phdPlan.curriculumCourses || []).filter((c) => c.credited).reduce((s, c) => s + Number(c.credits || 0), 0)
    : 0;
  const targetCredits = phdPlan?.totalCredits || 60;

  // ── Learning section data ─────────────────────────────────────────────────
  const learningData = {
    courses, modules, topics, assessments, sessions, assignments,
    stats: { totalCredits, completedCourses: completedCourses.length, avgScore, attendancePct, totalCourses: courses.length },
    phdPlan,
    earnedCredits, targetCredits,
  };

  // ── Science section data ──────────────────────────────────────────────────
  const scienceData = {
    stages, tasks, milestones, experiments, budgetPeriods,
    stats: {
      stageCount: stages.length, completedStages: completedStages.length,
      taskCount: tasks.length, activeTasks: activeTasks.length, doneTasks: doneTasks.length,
      milestonesCount: milestones.length,
      experimentsCount: experiments.length,
      hasBudget: budgetPeriods.length > 0,
    },
    phdPlan,
    supervisor: item.supervisor,
    fields: {
      ...(item.fields as Record<string, any>),
      university: (item.fields as any)?.university || wsUniversity || undefined,
    },
  };

  const defenseDate = (item.fields as any)?.defenseDate || item.plannedEndDate;

  return (
    <div className="flex flex-col gap-6">
      {/* ── Hero ── */}
      <LiquidCard className="overflow-hidden p-0" glow={false}>
        <div
          className="relative p-6"
          style={{ background: `linear-gradient(135deg, ${typeInfo.color}18 0%, ${typeInfo.color}06 100%)` }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-3xl"
                style={{ backgroundColor: typeInfo.color + "20" }}
              >
                {item.emoji || meta.emoji}
              </div>
              <div className="min-w-0">
                <span className="liquid-eyebrow" style={{ color: typeInfo.color }}>
                  {isUk ? typeInfo.uk : typeInfo.en}
                </span>
                <h1 className="mt-0.5 text-xl font-bold tracking-tight text-slate-900">{item.title}</h1>
                {item.description && <p className="mt-1 text-sm text-slate-500">{item.description}</p>}
              </div>
            </div>
            <ItemEditButton
              item={{
                _id: item._id, type: item.type, title: item.title,
                description: item.description, emoji: item.emoji,
                status: item.status, visibility: item.visibility,
                supervisor: item.supervisor, startDate: item.startDate,
                plannedEndDate: item.plannedEndDate, tags: item.tags,
                fields: item.fields as Record<string, any>,
              }}
              locale={locale as "uk" | "en"}
              label={isUk ? "Редагувати" : "Edit"}
              accentColor={typeInfo.color}
            />
          </div>

          {/* Quick info row */}
          <div className="mt-4 flex flex-wrap gap-2">
            <StatusPill status={item.status} />
            {item.supervisor && (
              <span className="flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1 text-[11px] font-semibold text-slate-600">
                <Users className="h-3 w-3" />
                {item.supervisor}
              </span>
            )}
            {defenseDate && (
              <span className="flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1 text-[11px] font-semibold text-slate-600">
                <CalendarDays className="h-3 w-3" />
                {isUk ? "Захист" : "Defense"}: {defenseDate}
              </span>
            )}
            {item.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-white/70 px-3 py-1 text-[11px] font-semibold text-slate-600">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Quick stats strip */}
        <div className="grid grid-cols-4 divide-x divide-slate-100/80 border-t border-slate-100/80">
          <QuickStat
            icon={<BookOpen className="h-3.5 w-3.5" />}
            label={isUk ? "Курси" : "Courses"}
            value={learningData.stats.totalCourses}
            color="#0369a1"
          />
          <QuickStat
            icon={<Award className="h-3.5 w-3.5" />}
            label={isUk ? "Ср. оцінка" : "Avg. score"}
            value={avgScore !== null ? `${avgScore}%` : "—"}
            color="#059669"
          />
          <QuickStat
            icon={<Target className="h-3.5 w-3.5" />}
            label={isUk ? "Задачі" : "Tasks"}
            value={activeTasks.length > 0 ? `${activeTasks.length} активних` : tasks.length}
            color="#d97706"
          />
          <QuickStat
            icon={<TrendingUp className="h-3.5 w-3.5" />}
            label={isUk ? "Прогрес" : "Progress"}
            value={stages.length > 0 ? `${completedStages.length}/${stages.length}` : learningType === "phd" ? `${earnedCredits}/${targetCredits} кр.` : "—"}
            color={typeInfo.color}
          />
        </div>
      </LiquidCard>

      {/* ── Two-section tabs ── */}
      <LearningRecordTabs
        itemId={item._id!}
        dataId={dataId}
        learningType={learningType}
        locale={locale}
        wsId={wsId}
        learningData={learningData}
        scienceData={scienceData}
        typeInfo={typeInfo}
      />

      {/* ── Completion & CV ── */}
      <CompletionBlock
        item={{
          _id: item._id!,
          type: item.type,
          status: item.status,
          title: item.title,
          supervisor: item.supervisor,
          startDate: item.startDate,
          plannedEndDate: item.plannedEndDate,
          fields: {
            ...(item.fields as Record<string, any>),
            // workspace-level university takes priority over item-level if not already set in item
            university: (item.fields as any)?.university || wsUniversity || undefined,
          },
          workspaceIds: item.workspaceIds,
          visibility: item.visibility,
          tags: item.tags,
          description: item.description,
          emoji: item.emoji,
          parentItemId: (item as any).parentItemId,
          learningItemId: (item as any).learningItemId,
        }}
        locale={locale}
      />
    </div>
  );
}

// ── Primitives ────────────────────────────────────────────────────────────────

function QuickStat({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 px-3 py-3">
      <span style={{ color }} className="mb-0.5">{icon}</span>
      <span className="text-sm font-bold text-slate-900">{value}</span>
      <span className="text-[10px] text-slate-400">{label}</span>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, [string, string]> = {
    active:    ["bg-emerald-100 text-emerald-700", "Активне"],
    draft:     ["bg-slate-200 text-slate-600",     "Чернетка"],
    paused:    ["bg-amber-100 text-amber-700",     "Пауза"],
    completed: ["bg-blue-100 text-blue-700",       "Завершено"],
    archived:  ["bg-slate-100 text-slate-500",     "Архів"],
  };
  const [cls, label] = map[status] ?? ["bg-slate-100 text-slate-500", status];
  return <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${cls}`}>{label}</span>;
}
