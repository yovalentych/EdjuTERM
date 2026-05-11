"use client";

import {
  BookOpen,
  ChevronRight,
  Database,
  FlaskConical,
  KanbanSquare,
  LayoutList,
  Link2,
  Plus,
  Search,
  Sparkles,
  Timeline,
  X,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { createExperiment } from "@/app/actions";
import type {
  Experiment,
  ExperimentStatus,
  ExperimentType,
  Project,
  ProjectRecord,
  ResearchStage,
} from "@/lib/schemas";
import { experimentPriorities, experimentStatuses, experimentTypes } from "@/lib/schemas";
import type { Dictionary } from "@/lib/i18n";

// ── Color maps ─────────────────────────────────────────────────────────────────

const TYPE_COLORS: Record<ExperimentType, string> = {
  in_silico: "border-indigo-300 bg-indigo-50 text-indigo-700",
  in_vitro:  "border-emerald-300 bg-emerald-50 text-emerald-700",
  in_vivo:   "border-rose-300 bg-rose-50 text-rose-700",
  clinical:  "border-amber-300 bg-amber-50 text-amber-700",
  other:     "border-stone-300 bg-stone-50 text-stone-600",
};

const TYPE_ICONS: Record<ExperimentType, string> = {
  in_silico: "💻", in_vitro: "🧪", in_vivo: "🐭", clinical: "🏥", other: "🔬",
};

const STATUS_COLORS: Record<ExperimentStatus, string> = {
  planned:   "border-stone-200 bg-stone-100 text-stone-600",
  running:   "border-blue-200 bg-blue-100 text-blue-700",
  completed: "border-emerald-200 bg-emerald-100 text-emerald-700",
  failed:    "border-rose-200 bg-rose-100 text-rose-700",
  on_hold:   "border-amber-200 bg-amber-100 text-amber-700",
};

const STATUS_BAR: Record<ExperimentStatus, string> = {
  planned:   "#a8a29e",
  running:   "#3b82f6",
  completed: "#10b981",
  failed:    "#f43f5e",
  on_hold:   "#f59e0b",
};

const STATUS_DOT: Record<ExperimentStatus, string> = {
  planned: "bg-stone-400", running: "bg-blue-500", completed: "bg-emerald-500",
  failed: "bg-rose-500", on_hold: "bg-amber-500",
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "text-stone-400", medium: "text-blue-500", high: "text-amber-500", critical: "text-rose-600",
};
const PRIORITY_ICONS: Record<string, string> = {
  low: "↓", medium: "→", high: "↑", critical: "⚑",
};
const PRIORITY_RANK: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };

function fmtDate(d: string | undefined): string {
  if (!d) return "";
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? "" : dt.toLocaleDateString("uk-UA", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function getProgress(exp: Experiment): number {
  if (exp.status === "completed") return 100;
  if (exp.status === "failed") return 100;
  if (exp.status === "on_hold") return exp.results ? 65 : exp.methods ? 40 : 20;
  if (exp.status === "planned") {
    let s = 5;
    if (exp.hypothesis) s += 15;
    if (exp.methods) s += 20;
    if (exp.variables) s += 5;
    return Math.min(s, 40);
  }
  if (exp.status === "running") {
    let s = 40;
    if (exp.results) s += 30;
    if (exp.conclusion) s += 15;
    if ((exp.notes ?? "").length > 50) s += 10;
    return Math.min(s, 95);
  }
  return 0;
}

// ── Stat tile ─────────────────────────────────────────────────────────────────

function StatTile({ label, value, color, onClick, active }: {
  label: string; value: number; color: string; onClick?: () => void; active?: boolean;
}) {
  const El = onClick ? "button" : "div";
  return (
    <El
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`flex flex-1 flex-col items-center rounded-xl border px-4 py-3 shadow-sm transition ${
        active ? "ring-2 ring-offset-1 " + color : color
      } ${onClick ? "cursor-pointer hover:opacity-90" : ""}`}
    >
      <span className="text-2xl font-bold leading-tight">{value}</span>
      <span className="mt-0.5 text-[10px] font-medium">{label}</span>
    </El>
  );
}

// ── New experiment modal ──────────────────────────────────────────────────────

function NewExperimentModal({
  project, stages, locale, dictionary, onClose,
}: {
  project: Project; stages: ResearchStage[]; locale: string; dictionary: Dictionary; onClose: () => void;
}) {
  const isUk = locale === "uk";
  const d = dictionary.experiments;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex w-full max-w-2xl flex-col rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
        <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-4">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100">
            <FlaskConical className="h-4 w-4 text-indigo-600" />
          </span>
          <h2 className="text-sm font-semibold text-slate-900">{isUk ? "Новий експеримент" : "New experiment"}</h2>
          <button type="button" onClick={onClose} className="ml-auto rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form action={createExperiment} className="max-h-[80vh] overflow-y-auto">
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="projectId" value={project._id ?? ""} />
          <div className="space-y-4 px-6 py-5">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">{isUk ? "Назва *" : "Title *"}</label>
              <input name="title" required className="input-control w-full"
                placeholder={isUk ? "Диференційний аналіз lncRNA при гіпоксії…" : "Differential lncRNA analysis under hypoxia…"} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">{isUk ? "Тип" : "Type"}</label>
                <select name="type" className="input-control w-full">
                  {experimentTypes.map((t) => <option key={t} value={t}>{TYPE_ICONS[t]} {d.types[t]}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">{isUk ? "Статус" : "Status"}</label>
                <select name="status" defaultValue="planned" className="input-control w-full">
                  {experimentStatuses.map((s) => <option key={s} value={s}>{d.statuses[s]}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">{isUk ? "Пріоритет" : "Priority"}</label>
                <select name="priority" defaultValue="medium" className="input-control w-full">
                  {experimentPriorities.map((p) => <option key={p} value={p}>{PRIORITY_ICONS[p]} {p}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {stages.length > 0 && (
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">{d.linkedStage}</label>
                  <select name="stageId" className="input-control w-full">
                    <option value="">{d.noStage}</option>
                    {stages.map((s) => <option key={s._id} value={s._id ?? ""}>Е{s.stageNumber} — {s.title.slice(0, 40)}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">{d.startDate}</label>
                <input type="date" name="startDate" className="input-control w-full" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">{d.endDate}</label>
                <input type="date" name="endDate" className="input-control w-full" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">{isUk ? "Гіпотеза" : "Hypothesis"}</label>
              <textarea name="hypothesis" rows={2} className="input-control w-full resize-none" placeholder={d.hypothesisHint} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">{isUk ? "Методи / матеріали" : "Methods / materials"}</label>
              <textarea name="methods" rows={2} className="input-control w-full resize-none" placeholder={d.methodsHint} />
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-xs text-slate-600 hover:bg-slate-50">
              {isUk ? "Скасувати" : "Cancel"}
            </button>
            <button type="submit" className="control-primary flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs">
              <Plus className="h-3.5 w-3.5" />
              {d.saveExperiment}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Experiment card (list view) ───────────────────────────────────────────────

function ExperimentCard({
  experiment, stages, allRecords, locale, dictionary,
}: {
  experiment: Experiment; stages: ResearchStage[]; allRecords: ProjectRecord[];
  locale: string; dictionary: Dictionary;
}) {
  const d = dictionary.experiments;
  const linkedStage = stages.find((s) => s._id === experiment.stageId);
  const hasMethodology = !!(experiment.linkedMethodologyId && allRecords.find((r) => r._id === experiment.linkedMethodologyId));
  const outputCount = (experiment.outputRecordIds ?? []).length;
  const journalCount = (experiment.notes ?? "").split("---").length - 1 + ((experiment.notes ?? "").trim() ? 1 : 0);
  const progress = getProgress(experiment);
  const href = `/${locale}/app/experiments/${experiment._id}?projectId=${experiment.projectId}`;

  return (
    <a
      href={href}
      className="group block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-300"
      style={{ borderLeftWidth: "3px", borderLeftColor: STATUS_BAR[experiment.status] }}
    >
      {/* Top: type + status + priority badges */}
      <div className="flex flex-wrap items-center gap-1.5 px-4 pt-3.5 pb-0">
        <span className={`border px-1.5 py-0.5 text-[10px] font-semibold ${TYPE_COLORS[experiment.type]}`}>
          {TYPE_ICONS[experiment.type]} {d.types[experiment.type]}
        </span>
        <span className={`flex items-center gap-1 border px-1.5 py-0.5 text-[10px] font-semibold ${STATUS_COLORS[experiment.status]}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[experiment.status]}`} />
          {d.statuses[experiment.status]}
        </span>
        {experiment.priority && experiment.priority !== "medium" && (
          <span className={`text-[11px] font-bold ${PRIORITY_COLORS[experiment.priority]}`}>
            {PRIORITY_ICONS[experiment.priority]} {experiment.priority}
          </span>
        )}
        {linkedStage && (
          <span className="border border-indigo-200 bg-indigo-50 px-1.5 py-0.5 text-[10px] text-indigo-600">
            Е{linkedStage.stageNumber}
          </span>
        )}
        <div className="ml-auto flex items-center gap-1.5">
          {hasMethodology && <span className="text-[10px] text-purple-600">⚗️</span>}
          {outputCount > 0 && <span className="text-[10px] text-emerald-600">📋 {outputCount}</span>}
          {journalCount > 0 && <span className="text-[10px] text-blue-500">📝 {journalCount}</span>}
        </div>
      </div>

      {/* Title */}
      <div className="px-4 pt-2 pb-3">
        <p className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors line-clamp-2">
          {experiment.title}
        </p>
        {experiment.hypothesis && (
          <p className="mt-1 text-xs italic text-slate-400 line-clamp-1">{experiment.hypothesis}</p>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-1 w-full bg-slate-100">
        <div
          className="h-full transition-all"
          style={{
            width: `${progress}%`,
            backgroundColor: experiment.status === "failed" ? "#f87171" : STATUS_BAR[experiment.status],
          }}
        />
      </div>

      {/* Footer: dates + open arrow */}
      <div className="flex items-center justify-between px-4 py-2.5 text-[10px] text-slate-400">
        <span className="font-mono">
          {fmtDate(experiment.startDate)}{experiment.endDate ? ` → ${fmtDate(experiment.endDate)}` : ""}
        </span>
        <ChevronRight className="h-3.5 w-3.5 text-slate-300 transition group-hover:text-blue-500" />
      </div>
    </a>
  );
}

// ── Timeline view ─────────────────────────────────────────────────────────────

function TimelineView({
  experiments, stages, allRecords, locale, dictionary,
}: {
  experiments: Experiment[]; stages: ResearchStage[]; allRecords: ProjectRecord[];
  locale: string; dictionary: Dictionary;
}) {
  const isUk = locale === "uk";

  // Group by month of startDate, fallback to createdAt
  const groups = useMemo(() => {
    const map = new Map<string, Experiment[]>();
    for (const exp of experiments) {
      const dateStr = exp.startDate || exp.createdAt.toISOString().slice(0, 7);
      const dt = new Date(dateStr);
      const key = isNaN(dt.getTime()) ? "—" : dt.toLocaleDateString(isUk ? "uk-UA" : "en-US", { year: "numeric", month: "long" });
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(exp);
    }
    return Array.from(map.entries());
  }, [experiments, isUk]);

  if (experiments.length === 0) return null;

  return (
    <div className="relative">
      <div className="absolute left-5 top-4 bottom-4 w-0.5 bg-slate-200" />
      <div className="space-y-6">
        {groups.map(([month, exps]) => (
          <div key={month} className="relative">
            {/* Month label */}
            <div className="relative mb-3 flex items-center gap-3 pl-14">
              <div className="absolute left-3.5 z-10 flex h-3 w-3 items-center justify-center rounded-full border-2 border-blue-400 bg-white" />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">{month}</span>
              <span className="text-[10px] text-slate-400">({exps.length})</span>
            </div>
            {/* Cards */}
            <div className="space-y-2 pl-14">
              {exps.map((exp) => (
                <ExperimentCard key={exp._id} experiment={exp} stages={stages} allRecords={allRecords} locale={locale} dictionary={dictionary} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Kanban column ─────────────────────────────────────────────────────────────

function KanbanColumn({
  status, experiments, stages, allRecords, locale, dictionary,
}: {
  status: ExperimentStatus; experiments: Experiment[]; stages: ResearchStage[];
  allRecords: ProjectRecord[]; locale: string; dictionary: Dictionary;
}) {
  const d = dictionary.experiments;
  const colorMap: Record<ExperimentStatus, string> = {
    planned:   "border-stone-300 bg-stone-50",
    running:   "border-blue-300 bg-blue-50",
    completed: "border-emerald-300 bg-emerald-50",
    failed:    "border-rose-300 bg-rose-50",
    on_hold:   "border-amber-300 bg-amber-50",
  };
  const headerMap: Record<ExperimentStatus, string> = {
    planned: "text-stone-600", running: "text-blue-700", completed: "text-emerald-700",
    failed: "text-rose-700", on_hold: "text-amber-700",
  };

  return (
    <div className={`flex flex-col rounded-xl border-2 ${colorMap[status]} min-h-[200px]`}>
      <div className="flex items-center justify-between px-3 py-2.5">
        <span className={`flex items-center gap-1.5 text-xs font-bold ${headerMap[status]}`}>
          <span className={`h-2 w-2 rounded-full ${STATUS_DOT[status]}`} />
          {d.statuses[status]}
        </span>
        <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-bold text-slate-500 shadow-sm">
          {experiments.length}
        </span>
      </div>
      <div className="flex flex-col gap-2 p-2">
        {experiments.map((exp) => {
          const linkedStage = stages.find((s) => s._id === exp.stageId);
          const hasMethodology = !!(exp.linkedMethodologyId && allRecords.find((r) => r._id === exp.linkedMethodologyId));
          const outputCount = (exp.outputRecordIds ?? []).length;
          const progress = getProgress(exp);
          const href = `/${locale}/app/experiments/${exp._id}?projectId=${exp.projectId}`;
          return (
            <a
              key={exp._id}
              href={href}
              className="group block w-full overflow-hidden rounded-lg border border-white bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
            >
              <div className="p-3">
                <div className="mb-1.5 flex flex-wrap gap-1">
                  <span className={`border px-1.5 py-px text-[10px] font-semibold ${TYPE_COLORS[exp.type]}`}>
                    {TYPE_ICONS[exp.type]} {d.types[exp.type]}
                  </span>
                  {exp.priority && exp.priority !== "medium" && (
                    <span className={`text-[11px] font-bold ${PRIORITY_COLORS[exp.priority]}`}>{PRIORITY_ICONS[exp.priority]}</span>
                  )}
                  {linkedStage && (
                    <span className="border border-indigo-200 bg-indigo-50 px-1.5 py-px text-[10px] text-indigo-600">Е{linkedStage.stageNumber}</span>
                  )}
                </div>
                <p className="line-clamp-2 text-xs font-semibold text-slate-800 group-hover:text-blue-700">{exp.title}</p>
                {(hasMethodology || outputCount > 0) && (
                  <div className="mt-1.5 flex gap-1.5">
                    {hasMethodology && <span className="text-[9px] text-purple-600">⚗️</span>}
                    {outputCount > 0 && <span className="text-[9px] text-emerald-600">📋 {outputCount}</span>}
                  </div>
                )}
                {exp.startDate && <p className="mt-1 font-mono text-[9px] text-slate-400">{fmtDate(exp.startDate)}</p>}
              </div>
              <div className="h-1 w-full bg-slate-100">
                <div className="h-full" style={{ width: `${progress}%`, backgroundColor: STATUS_BAR[exp.status] }} />
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}

// ── Sort options ──────────────────────────────────────────────────────────────

type SortKey = "newest" | "oldest" | "priority" | "status" | "startDate";

function sortExperiments(exps: Experiment[], sort: SortKey): Experiment[] {
  return [...exps].sort((a, b) => {
    switch (sort) {
      case "newest": return b.createdAt.getTime() - a.createdAt.getTime();
      case "oldest": return a.createdAt.getTime() - b.createdAt.getTime();
      case "priority": return (PRIORITY_RANK[b.priority ?? "medium"] ?? 0) - (PRIORITY_RANK[a.priority ?? "medium"] ?? 0);
      case "status": return experimentStatuses.indexOf(a.status) - experimentStatuses.indexOf(b.status);
      case "startDate": return (a.startDate ?? "").localeCompare(b.startDate ?? "");
      default: return 0;
    }
  });
}

// ── Main explorer ─────────────────────────────────────────────────────────────

type ViewMode = "list" | "timeline" | "kanban";

export function ExperimentsExplorer({
  experiments: initialExperiments,
  stages,
  allRecords,
  project,
  locale,
  dictionary,
  canManage,
}: {
  experiments: Experiment[];
  stages: ResearchStage[];
  allRecords: ProjectRecord[];
  project: Project;
  locale: string;
  dictionary: Dictionary;
  canManage: boolean;
  initialSelectedId?: string;
}) {
  const isUk = locale === "uk";
  const d = dictionary.experiments;

  const [view, setView] = useState<ViewMode>("list");
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<ExperimentType | "">("");
  const [filterStatus, setFilterStatus] = useState<ExperimentStatus | "">("");
  const [sort, setSort] = useState<SortKey>("newest");
  const [showNewModal, setShowNewModal] = useState(false);

  const filtered = useMemo(() => {
    let base = initialExperiments;
    if (filterType) base = base.filter((e) => e.type === filterType);
    if (filterStatus) base = base.filter((e) => e.status === filterStatus);
    if (search.trim()) {
      const q = search.toLowerCase();
      base = base.filter((e) =>
        e.title.toLowerCase().includes(q) ||
        e.hypothesis?.toLowerCase().includes(q) ||
        e.methods?.toLowerCase().includes(q),
      );
    }
    return sortExperiments(base, sort);
  }, [initialExperiments, filterType, filterStatus, search, sort]);

  const stats = useMemo(() => ({
    total: initialExperiments.length,
    planned: initialExperiments.filter((e) => e.status === "planned").length,
    running: initialExperiments.filter((e) => e.status === "running").length,
    completed: initialExperiments.filter((e) => e.status === "completed").length,
    failed: initialExperiments.filter((e) => e.status === "failed").length,
    withMethodology: initialExperiments.filter((e) => !!e.linkedMethodologyId).length,
    withOutputs: initialExperiments.filter((e) => (e.outputRecordIds ?? []).length > 0).length,
  }), [initialExperiments]);

  const kanbanGroups = useMemo(() => {
    const groups: Record<ExperimentStatus, Experiment[]> = { planned: [], running: [], completed: [], failed: [], on_hold: [] };
    filtered.forEach((e) => groups[e.status].push(e));
    return groups;
  }, [filtered]);

  const sortOptions: { value: SortKey; label: string }[] = [
    { value: "newest",    label: d.sortNewest },
    { value: "oldest",    label: d.sortOldest },
    { value: "priority",  label: d.sortPriority },
    { value: "status",    label: d.sortStatus },
    { value: "startDate", label: d.sortStartDate },
  ];

  if (initialExperiments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white py-20 text-center">
        <span className="text-5xl">🧪</span>
        <h3 className="mt-4 text-base font-semibold text-slate-800">{d.noExperiments}</h3>
        <p className="mt-2 max-w-sm text-sm text-slate-400">
          {isUk
            ? "Реєструйте in silico, in vitro та in vivo дослідження з гіпотезою, методами й результатами."
            : "Log in silico, in vitro and in vivo studies with hypothesis, methods and results."}
        </p>
        {canManage && (
          <button type="button" onClick={() => setShowNewModal(true)}
            className="control-primary mt-6 flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm">
            <Plus className="h-4 w-4" />
            {d.addExperiment}
          </button>
        )}
        {showNewModal && (
          <NewExperimentModal project={project} stages={stages} locale={locale} dictionary={dictionary} onClose={() => setShowNewModal(false)} />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Stats row ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-7">
        <StatTile label={isUk ? "Всього" : "Total"} value={stats.total} color="border-slate-200 bg-white text-slate-700" />
        <StatTile label={d.statuses.planned} value={stats.planned} color="border-stone-200 bg-stone-50 text-stone-600"
          active={filterStatus === "planned"} onClick={() => setFilterStatus(filterStatus === "planned" ? "" : "planned")} />
        <StatTile label={d.statuses.running} value={stats.running} color="border-blue-200 bg-blue-50 text-blue-700"
          active={filterStatus === "running"} onClick={() => setFilterStatus(filterStatus === "running" ? "" : "running")} />
        <StatTile label={d.statuses.completed} value={stats.completed} color="border-emerald-200 bg-emerald-50 text-emerald-700"
          active={filterStatus === "completed"} onClick={() => setFilterStatus(filterStatus === "completed" ? "" : "completed")} />
        <StatTile label={d.statuses.failed} value={stats.failed} color="border-rose-200 bg-rose-50 text-rose-700"
          active={filterStatus === "failed"} onClick={() => setFilterStatus(filterStatus === "failed" ? "" : "failed")} />
        <StatTile label={isUk ? "З методикою" : "With method"} value={stats.withMethodology} color="border-purple-200 bg-purple-50 text-purple-700" />
        <StatTile label={isUk ? "Записи ↗" : "Records ↗"} value={stats.withOutputs} color="border-emerald-200 bg-emerald-50 text-emerald-600" />
      </div>

      {/* ── Toolbar ────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative min-w-[180px] flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input className="input-control w-full pl-8 text-xs" placeholder={isUk ? "Пошук…" : "Search…"}
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        {/* Type filter chips */}
        <div className="flex flex-wrap gap-1">
          {filterType && (
            <button type="button" onClick={() => setFilterType("")}
              className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] text-slate-500 hover:bg-slate-50">
              <X className="h-3 w-3" />
            </button>
          )}
          {experimentTypes.map((t) => (
            <button key={t} type="button" onClick={() => setFilterType(filterType === t ? "" : t)}
              className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-semibold transition ${filterType === t ? TYPE_COLORS[t] + " ring-1" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}>
              {TYPE_ICONS[t]} {d.types[t]}
            </button>
          ))}
        </div>

        {/* Sort */}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="input-control py-1 text-[11px]"
        >
          {sortOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {/* View toggle */}
        <div className="flex rounded-lg border border-slate-200 bg-white p-0.5">
          <button type="button" onClick={() => setView("list")} title={d.viewList}
            className={`rounded-md p-1.5 transition ${view === "list" ? "bg-indigo-100 text-indigo-700" : "text-slate-400 hover:text-slate-600"}`}>
            <LayoutList className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={() => setView("timeline")} title={d.viewTimeline}
            className={`rounded-md p-1.5 transition ${view === "timeline" ? "bg-indigo-100 text-indigo-700" : "text-slate-400 hover:text-slate-600"}`}>
            <Database className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={() => setView("kanban")} title={d.viewKanban}
            className={`rounded-md p-1.5 transition ${view === "kanban" ? "bg-indigo-100 text-indigo-700" : "text-slate-400 hover:text-slate-600"}`}>
            <KanbanSquare className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* New button */}
        {canManage && (
          <button type="button" onClick={() => setShowNewModal(true)}
            className="control-primary flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs">
            <Plus className="h-3.5 w-3.5" />
            {isUk ? "Новий" : "New"}
          </button>
        )}
      </div>

      {/* ── Content ────────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 py-10 text-center">
          <FlaskConical className="mx-auto mb-2 h-6 w-6 text-slate-300" />
          <p className="text-sm text-slate-400">{isUk ? "Нічого не знайдено. Змініть фільтри." : "Nothing found. Adjust filters."}</p>
        </div>
      ) : view === "list" ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((exp) => (
            <ExperimentCard key={exp._id} experiment={exp} stages={stages} allRecords={allRecords} locale={locale} dictionary={dictionary} />
          ))}
        </div>
      ) : view === "timeline" ? (
        <TimelineView experiments={filtered} stages={stages} allRecords={allRecords} locale={locale} dictionary={dictionary} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {experimentStatuses.map((status) => (
            <KanbanColumn key={status} status={status} experiments={kanbanGroups[status]} stages={stages}
              allRecords={allRecords} locale={locale} dictionary={dictionary} />
          ))}
        </div>
      )}

      {/* ── New experiment modal ────────────────────────────────────────── */}
      {showNewModal && (
        <NewExperimentModal project={project} stages={stages} locale={locale} dictionary={dictionary} onClose={() => setShowNewModal(false)} />
      )}
    </div>
  );
}
