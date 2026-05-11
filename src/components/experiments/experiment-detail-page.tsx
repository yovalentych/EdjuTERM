"use client";

import {
  ArrowLeft,
  BookOpen,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Database,
  Edit2,
  ExternalLink,
  FlaskConical,
  Link2,
  Link2Off,
  NotebookPen,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Wrench,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import {
  addExperimentJournalEntry,
  createRecordFromExperiment,
  deleteExperiment,
  linkMethodologyToExperiment,
  updateExperiment,
  updateExperimentStatus,
} from "@/app/actions";
import { PCRPrimerTool } from "@/components/experiments/lab-tools/pcr-primer-tool";
import { ConcentrationTool } from "@/components/experiments/lab-tools/concentration-tool";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import type { Dictionary } from "@/lib/i18n";
import type {
  Experiment,
  ExperimentStatus,
  Project,
  ProjectRecord,
  ResearchStage,
} from "@/lib/schemas";
import { experimentPriorities, experimentStatuses, experimentTypes } from "@/lib/schemas";

// ── Color maps ────────────────────────────────────────────────────────────────

const TYPE_COLORS: Record<Experiment["type"], string> = {
  in_silico: "border-indigo-300 bg-indigo-50 text-indigo-700",
  in_vitro:  "border-emerald-300 bg-emerald-50 text-emerald-700",
  in_vivo:   "border-rose-300 bg-rose-50 text-rose-700",
  clinical:  "border-amber-300 bg-amber-50 text-amber-700",
  other:     "border-stone-300 bg-stone-50 text-stone-600",
};

const TYPE_ICONS: Record<Experiment["type"], string> = {
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
  planned:   "bg-stone-400",
  running:   "bg-blue-500",
  completed: "bg-emerald-500",
  failed:    "bg-rose-500",
  on_hold:   "bg-amber-400",
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "text-stone-400", medium: "text-blue-500", high: "text-amber-500", critical: "text-rose-600",
};
const PRIORITY_ICONS: Record<string, string> = {
  low: "↓", medium: "→", high: "↑", critical: "⚑",
};

// ── Progress ──────────────────────────────────────────────────────────────────

function getProgress(exp: Experiment): number {
  if (exp.status === "completed") return 100;
  if (exp.status === "failed") return 100;
  if (exp.status === "on_hold") {
    return exp.results ? 65 : exp.methods ? 40 : 20;
  }
  if (exp.status === "planned") {
    let s = 5;
    if (exp.hypothesis) s += 15;
    if (exp.methods) s += 20;
    if (exp.variables) s += 5;
    if (exp.objectives) s += 5;
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

// ── Journal parsing ───────────────────────────────────────────────────────────

type JournalEntry = { date: string; text: string; fromTool?: boolean };

function parseJournal(notes: string): JournalEntry[] {
  if (!notes.trim()) return [];
  return notes.split(/\n\n---\n\n/).map((chunk) => {
    const lines = chunk.trim().split("\n");
    const first = lines[0] ?? "";
    const isDateLine = /^\d{2}\.\d{2}\.\d{4},\s\d{2}:\d{2}/.test(first);
    if (isDateLine) {
      return {
        date: first,
        text: lines.slice(1).join("\n").trim(),
        fromTool: first.includes("🧬") || first.includes("⚗️"),
      };
    }
    return { date: "", text: chunk.trim() };
  }).filter((e) => e.text);
}

function fmtDate(d: string | undefined): string {
  if (!d) return "";
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? "" : dt.toLocaleDateString("uk-UA", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// ── Link methodology modal ────────────────────────────────────────────────────

function LinkMethodologyModal({
  experiment, methodologyRecords, locale, returnPath, onClose,
}: {
  experiment: Experiment; methodologyRecords: ProjectRecord[]; locale: string; returnPath: string; onClose: () => void;
}) {
  const isUk = locale === "uk";
  const [search, setSearch] = useState("");
  const filtered = methodologyRecords.filter((r) =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    r.localId.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-xl bg-white shadow-2xl">
        <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
          <Link2 className="h-4 w-4 text-purple-600" />
          <h3 className="text-sm font-semibold text-slate-900">
            {isUk ? "Прив'язати методику" : "Link methodology"}
          </h3>
          <button type="button" onClick={onClose} className="ml-auto rounded-lg p-1 text-slate-400 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-4">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input className="input-control w-full pl-8 text-xs"
              placeholder={isUk ? "Пошук методики…" : "Search methodology…"}
              value={search} onChange={(e) => setSearch(e.target.value)} autoFocus />
          </div>
          {methodologyRecords.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 py-8 text-center">
              <BookOpen className="mx-auto mb-2 h-6 w-6 text-slate-300" />
              <p className="text-xs text-slate-400">
                {isUk ? "Немає записів типу «Методологія»." : "No Methodology records found."}
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-4 text-center text-xs text-slate-400">{isUk ? "Нічого не знайдено" : "Nothing found"}</p>
          ) : (
            <div className="max-h-60 space-y-1 overflow-y-auto">
              {filtered.map((r) => (
                <form key={r._id} action={linkMethodologyToExperiment}>
                  <input type="hidden" name="locale" value={locale} />
                  <input type="hidden" name="projectId" value={experiment.projectId} />
                  <input type="hidden" name="experimentId" value={experiment._id ?? ""} />
                  <input type="hidden" name="linkedMethodologyId" value={r._id ?? ""} />
                  <input type="hidden" name="returnPath" value={returnPath} />
                  <button type="submit" className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-purple-50">
                    <span className="mt-0.5 text-lg">⚗️</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-slate-800">{r.title}</p>
                      <p className="font-mono text-[10px] text-slate-400">{r.localId}</p>
                    </div>
                    <ChevronRight className="mt-1 h-3.5 w-3.5 shrink-0 text-slate-400" />
                  </button>
                </form>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Generate record modal ─────────────────────────────────────────────────────

function GenerateRecordModal({
  experiment, stages, locale, returnPath, onClose,
}: {
  experiment: Experiment; stages: ResearchStage[]; locale: string; returnPath: string; onClose: () => void;
}) {
  const isUk = locale === "uk";
  const [kind, setKind] = useState("experiment_log");
  const linkedStage = stages.find((s) => s._id === experiment.stageId);
  const kinds = [
    { value: "experiment_log", label: isUk ? "📋 Журнал експерименту" : "📋 Experiment Log" },
    { value: "dataset", label: isUk ? "📊 Набір даних" : "📊 Dataset" },
    { value: "measurement_log", label: isUk ? "📐 Журнал вимірювань" : "📐 Measurement Log" },
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-xl bg-white shadow-2xl">
        <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
          <Sparkles className="h-4 w-4 text-emerald-600" />
          <h3 className="text-sm font-semibold text-slate-900">
            {isUk ? "Згенерувати запис" : "Generate record"}
          </h3>
          <button type="button" onClick={onClose} className="ml-auto rounded-lg p-1 text-slate-400 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form action={createRecordFromExperiment} className="p-5 space-y-4">
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="projectId" value={experiment.projectId} />
          <input type="hidden" name="experimentId" value={experiment._id ?? ""} />
          <input type="hidden" name="stage" value={linkedStage?.title ?? "Stage 1"} />
          <input type="hidden" name="recordKind" value={kind} />
          <div className="space-y-2">
            {kinds.map((k) => (
              <label key={k.value} className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition ${kind === k.value ? "border-emerald-300 bg-emerald-50" : "border-slate-200 hover:bg-slate-50"}`}>
                <input type="radio" value={k.value} checked={kind === k.value} onChange={() => setKind(k.value)} className="accent-emerald-600" />
                <span className="text-xs font-semibold text-slate-800">{k.label}</span>
              </label>
            ))}
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">{isUk ? "Назва запису" : "Record title"}</label>
            <input name="title" className="input-control w-full" defaultValue={`${experiment.title} — ${isUk ? "Результати" : "Results"}`} />
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50">
              {isUk ? "Скасувати" : "Cancel"}
            </button>
            <button type="submit" className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">
              <Sparkles className="h-3.5 w-3.5" />
              {isUk ? "Створити" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

type Tab = "journal" | "protocol" | "results" | "tools";
type ToolId = "pcr" | "concentration";

export function ExperimentDetailPage({
  experiment,
  project,
  stages,
  allRecords,
  locale,
  dictionary,
  canManage,
}: {
  experiment: Experiment;
  project: Project;
  stages: ResearchStage[];
  allRecords: ProjectRecord[];
  locale: string;
  dictionary: Dictionary;
  canManage: boolean;
}) {
  const isUk = locale === "uk";
  const d = dictionary.experiments;

  const [activeTab, setActiveTab] = useState<Tab>("journal");
  const [isEditing, setIsEditing] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showGenModal, setShowGenModal] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<ToolId | null>(null);
  const [pendingToolNote, setPendingToolNote] = useState("");
  const deleteFormRef = useRef<HTMLFormElement>(null);

  const returnPath = `/${locale}/app/experiments/${experiment._id}?projectId=${experiment.projectId}`;
  const listPath = `/${locale}/app/experiments?projectId=${experiment.projectId}`;

  const progress = getProgress(experiment);
  const journalEntries = parseJournal(experiment.notes ?? "");
  const linkedStage = stages.find((s) => s._id === experiment.stageId);
  const linkedMethodology = experiment.linkedMethodologyId
    ? allRecords.find((r) => r._id === experiment.linkedMethodologyId)
    : null;
  const methodologyRecords = allRecords.filter((r) => r.kind === "methodology");
  const inputRecords = allRecords.filter((r) => (experiment.linkedRecordIds ?? []).includes(r._id ?? ""));
  const outputRecords = allRecords.filter((r) => (experiment.outputRecordIds ?? []).includes(r._id ?? ""));
  const canGenerate = canManage && (experiment.status === "completed" || experiment.status === "running" || !!experiment.results);

  function handleSaveToolResult(text: string) {
    setPendingToolNote(text);
    setActiveTool(null);
    setActiveTab("journal");
  }

  const tabs: { id: Tab; icon: React.ElementType; label: string }[] = [
    { id: "journal",   icon: NotebookPen,   label: d.journal },
    { id: "protocol",  icon: ClipboardList, label: d.protocol },
    { id: "results",   icon: FlaskConical,  label: d.results },
    { id: "tools",     icon: Wrench,        label: d.labTools },
  ];

  return (
    <div className="space-y-0">
      {/* ── Back nav ─────────────────────────────────────────── */}
      <div className="mb-4 flex items-center gap-2">
        <a href={listPath} className="flex items-center gap-1.5 text-xs text-slate-500 transition hover:text-blue-600">
          <ArrowLeft className="h-3.5 w-3.5" />
          {d.backToList}
        </a>
      </div>

      {/* ── Header card ──────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Color stripe by status */}
        <div className={`h-1.5 w-full ${STATUS_BAR[experiment.status]}`} />

        <div className="px-6 py-5">
          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-semibold ${TYPE_COLORS[experiment.type]}`}>
              {TYPE_ICONS[experiment.type]} {d.types[experiment.type]}
            </span>
            <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold ${STATUS_COLORS[experiment.status]}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${STATUS_BAR[experiment.status]}`} />
              {d.statuses[experiment.status]}
            </span>
            {experiment.priority && (
              <span className={`text-sm font-bold ${PRIORITY_COLORS[experiment.priority]}`}>
                {PRIORITY_ICONS[experiment.priority]} {experiment.priority}
              </span>
            )}
            {linkedStage && (
              <span className="rounded-md border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
                Е{linkedStage.stageNumber} — {linkedStage.title.slice(0, 30)}
              </span>
            )}
            <div className="ml-auto flex items-center gap-2">
              {canManage && !isEditing && (
                <button type="button" onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700">
                  <Edit2 className="h-3.5 w-3.5" />
                  {d.editExperiment}
                </button>
              )}
              {canManage && (
                <button type="button" onClick={() => setConfirmDeleteOpen(true)}
                  className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-100">
                  {isUk ? "Видалити" : "Delete"}
                </button>
              )}
            </div>
          </div>

          {/* Title */}
          <h1 className="mt-3 text-xl font-bold text-slate-900 sm:text-2xl">{experiment.title}</h1>

          {/* Meta row */}
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
            {experiment.startDate && (
              <span>📅 {fmtDate(experiment.startDate)}{experiment.endDate ? ` → ${fmtDate(experiment.endDate)}` : ""}</span>
            )}
            {(experiment.replicates ?? 0) > 0 && (
              <span>🔁 {experiment.replicates}× {isUk ? "реплікати" : "replicates"}</span>
            )}
            {linkedMethodology && (
              <span className="flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-purple-700">
                ⚗️ {linkedMethodology.title.slice(0, 30)}
              </span>
            )}
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="mb-1 flex items-center justify-between text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
              <span>{d.progress}</span>
              <span>{experiment.status === "failed" ? isUk ? "Невдало" : "Failed" : `${progress}%`}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full transition-all duration-500 ${experiment.status === "failed" ? "bg-rose-400" : STATUS_BAR[experiment.status]}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Quick status update */}
        {canManage && !isEditing && (
          <div className="flex items-center gap-2 border-t border-slate-100 bg-slate-50/60 px-6 py-3">
            <form action={updateExperimentStatus} className="flex items-center gap-2">
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="projectId" value={experiment.projectId} />
              <input type="hidden" name="experimentId" value={experiment._id ?? ""} />
              <input type="hidden" name="returnPath" value={returnPath} />
              <select name="status" defaultValue={experiment.status} className="input-control py-1 text-xs">
                {experimentStatuses.map((s) => (
                  <option key={s} value={s}>{d.statuses[s]}</option>
                ))}
              </select>
              <button type="submit" className="rounded-md border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100">
                {isUk ? "Оновити статус" : "Update status"}
              </button>
            </form>
            {canGenerate && (
              <button type="button" onClick={() => setShowGenModal(true)}
                className="ml-auto flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100">
                <Sparkles className="h-3.5 w-3.5" />
                {isUk ? "У записи" : "To records"}
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Edit form (full-width) ────────────────────────────── */}
      {isEditing && (
        <div className="mt-4 overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-blue-100 bg-blue-50 px-6 py-4">
            <Edit2 className="h-4 w-4 text-blue-600" />
            <h2 className="text-sm font-semibold text-blue-900">{d.editExperiment}</h2>
            <button type="button" onClick={() => setIsEditing(false)} className="ml-auto text-xs text-slate-500 hover:text-slate-700">
              {isUk ? "Скасувати" : "Cancel"}
            </button>
          </div>
          <ExperimentEditForm
            experiment={experiment}
            stages={stages}
            locale={locale}
            dictionary={dictionary}
            returnPath={returnPath}
            onCancel={() => setIsEditing(false)}
          />
        </div>
      )}

      {/* ── Main layout: sidebar + tabs ──────────────────────── */}
      {!isEditing && (
        <div className="mt-4 flex gap-4 lg:items-start">
          {/* Mobile sidebar toggle */}
          <div className="lg:hidden w-full">
            <button type="button" onClick={() => setShowSidebar((p) => !p)}
              className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
              <span className="flex items-center gap-2">
                <Database className="h-4 w-4 text-slate-400" />
                {isUk ? "Деталі експерименту" : "Experiment details"}
              </span>
              <ChevronDown className={`h-4 w-4 text-slate-400 transition ${showSidebar ? "rotate-180" : ""}`} />
            </button>
            {showSidebar && (
              <div className="mt-2">
                <SidebarContent
                  experiment={experiment}
                  linkedMethodology={linkedMethodology}
                  methodologyRecords={methodologyRecords}
                  inputRecords={inputRecords}
                  outputRecords={outputRecords}
                  linkedStage={linkedStage}
                  stages={stages}
                  locale={locale}
                  dictionary={dictionary}
                  canManage={canManage}
                  returnPath={returnPath}
                  onLinkMethodology={() => setShowLinkModal(true)}
                />
              </div>
            )}
          </div>

          {/* Desktop sidebar */}
          <aside className="hidden lg:block w-72 shrink-0 space-y-3">
            <SidebarContent
              experiment={experiment}
              linkedMethodology={linkedMethodology}
              methodologyRecords={methodologyRecords}
              inputRecords={inputRecords}
              outputRecords={outputRecords}
              linkedStage={linkedStage}
              stages={stages}
              locale={locale}
              dictionary={dictionary}
              canManage={canManage}
              returnPath={returnPath}
              onLinkMethodology={() => setShowLinkModal(true)}
            />
          </aside>

          {/* Main content area */}
          <div className="min-w-0 flex-1">
            {/* Tab bar */}
            <div className="flex overflow-x-auto rounded-t-xl border border-b-0 border-slate-200 bg-white">
              {tabs.map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => { setActiveTab(id); if (id !== "tools") setActiveTool(null); }}
                  className={`flex flex-1 min-w-max items-center justify-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold transition ${
                    activeTab === id
                      ? "border-blue-600 text-blue-700 bg-blue-50/40"
                      : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                  {id === "journal" && journalEntries.length > 0 && (
                    <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">
                      {journalEntries.length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="rounded-b-xl rounded-tr-xl border border-slate-200 bg-white">
              {/* JOURNAL TAB */}
              {activeTab === "journal" && (
                <div>
                  {/* Pending tool result */}
                  {pendingToolNote && (
                    <div className="border-b border-blue-100 bg-blue-50/50 p-5">
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-blue-600">
                        📋 {isUk ? "Результат з інструменту — переглянь та збережи" : "Tool result — review and save"}
                      </p>
                      <form action={addExperimentJournalEntry}>
                        <input type="hidden" name="locale" value={locale} />
                        <input type="hidden" name="projectId" value={experiment.projectId} />
                        <input type="hidden" name="experimentId" value={experiment._id ?? ""} />
                        <textarea
                          name="text"
                          defaultValue={pendingToolNote}
                          rows={6}
                          className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2 font-mono text-xs text-slate-800 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200"
                        />
                        <div className="mt-2 flex gap-2">
                          <button type="submit" className="rounded-lg border border-blue-300 bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700">
                            {d.addEntry}
                          </button>
                          <button type="button" onClick={() => setPendingToolNote("")}
                            className="rounded-lg border border-slate-200 px-4 py-1.5 text-xs text-slate-500 transition hover:bg-slate-50">
                            {isUk ? "Скасувати" : "Cancel"}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* New entry form */}
                  {canManage && !pendingToolNote && (
                    <div className="border-b border-slate-100 p-5">
                      <form action={addExperimentJournalEntry}>
                        <input type="hidden" name="locale" value={locale} />
                        <input type="hidden" name="projectId" value={experiment.projectId} />
                        <input type="hidden" name="experimentId" value={experiment._id ?? ""} />
                        <textarea
                          name="text"
                          rows={3}
                          placeholder={d.entryPlaceholder}
                          className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                        />
                        <div className="mt-2 flex justify-end">
                          <button type="submit" className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700">
                            <Plus className="h-3.5 w-3.5" />
                            {d.addEntry}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Journal timeline */}
                  {journalEntries.length === 0 ? (
                    <div className="flex flex-col items-center py-14 text-center">
                      <NotebookPen className="mb-3 h-10 w-10 text-slate-200" />
                      <p className="text-sm font-medium text-slate-400">{d.noJournalEntries}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {isUk ? "Фіксуйте спостереження, результати та нотатки." : "Record observations, results and notes above."}
                      </p>
                    </div>
                  ) : (
                    <div className="relative px-5 py-4">
                      <div className="absolute left-9 top-4 bottom-4 w-px bg-slate-100" />
                      <div className="space-y-5">
                        {journalEntries.map((entry, i) => (
                          <div key={i} className="relative flex gap-4">
                            <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-sm shadow-sm">
                              {entry.fromTool ? "🔬" : "📝"}
                            </div>
                            <div className="min-w-0 flex-1 rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3">
                              {entry.date && (
                                <p className="mb-1.5 font-mono text-[10px] font-semibold text-slate-400">{entry.date}</p>
                              )}
                              <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{entry.text}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* PROTOCOL TAB */}
              {activeTab === "protocol" && (
                <div className="divide-y divide-slate-100">
                  {(experiment.objectives || experiment.hypothesis || experiment.variables || experiment.controls) && (
                    <div className="grid gap-4 p-5 sm:grid-cols-2">
                      {experiment.objectives && (
                        <div>
                          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">{d.objectives}</p>
                          <p className="text-sm leading-6 text-slate-700">{experiment.objectives}</p>
                        </div>
                      )}
                      {experiment.hypothesis && (
                        <div>
                          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">{d.hypothesis}</p>
                          <p className="text-sm italic leading-6 text-slate-600">{experiment.hypothesis}</p>
                        </div>
                      )}
                      {experiment.variables && (
                        <div>
                          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">{d.variables}</p>
                          <p className="text-sm leading-5 text-slate-700">{experiment.variables}</p>
                        </div>
                      )}
                      {experiment.controls && (
                        <div>
                          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">{d.controls}</p>
                          <p className="text-sm leading-5 text-slate-700">{experiment.controls}</p>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="p-5">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">{d.methods}</p>
                    {experiment.methods ? (
                      <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">{experiment.methods}</p>
                    ) : (
                      <div className="rounded-xl border border-dashed border-slate-200 py-8 text-center">
                        <ClipboardList className="mx-auto mb-2 h-7 w-7 text-slate-200" />
                        <p className="text-xs text-slate-400">
                          {isUk ? "Протокол ще не заповнено. Натисніть «Редагувати» для заповнення." : "Protocol not filled yet. Click Edit to add."}
                        </p>
                        {canManage && (
                          <button type="button" onClick={() => setIsEditing(true)}
                            className="mt-3 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50">
                            {d.editExperiment}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  {/* Linked methodology in protocol */}
                  {linkedMethodology && (
                    <div className="p-5">
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        ⚗️ {isUk ? "СОП / Методика" : "SOP / Methodology"}
                      </p>
                      <a href={`/${locale}/app/project?projectId=${experiment.projectId}&tab=records`}
                        className="flex items-center gap-3 rounded-xl border border-purple-200 bg-purple-50/60 px-4 py-3 transition hover:border-purple-300 hover:bg-purple-50">
                        <span className="text-xl">⚗️</span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-purple-900">{linkedMethodology.title}</p>
                          <p className="font-mono text-[10px] text-purple-500">{linkedMethodology.localId}</p>
                        </div>
                        <ExternalLink className="h-3.5 w-3.5 shrink-0 text-purple-400" />
                      </a>
                      {linkedMethodology.summary && (
                        <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
                          <p className="whitespace-pre-wrap text-xs leading-6 text-slate-700">{linkedMethodology.summary}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* RESULTS TAB */}
              {activeTab === "results" && (
                <div className="divide-y divide-slate-100">
                  <div className="p-5">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">📊 {d.results}</p>
                      {canGenerate && (
                        <button type="button" onClick={() => setShowGenModal(true)}
                          className="flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700 transition hover:bg-emerald-100">
                          <Sparkles className="h-3 w-3" />
                          {isUk ? "Згенерувати запис" : "Generate record"}
                        </button>
                      )}
                    </div>
                    {experiment.results ? (
                      <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">{experiment.results}</p>
                    ) : (
                      <div className="rounded-xl border border-dashed border-slate-200 py-10 text-center">
                        <FlaskConical className="mx-auto mb-2 h-7 w-7 text-slate-200" />
                        <p className="text-xs text-slate-400">
                          {experiment.status === "planned"
                            ? (isUk ? "Ще не розпочато." : "Not started yet.")
                            : experiment.status === "running"
                            ? (isUk ? "Результати в процесі — записуйте в журнал." : "Results pending — use the journal tab.")
                            : (isUk ? "Результати відсутні." : "No results recorded.")}
                        </p>
                      </div>
                    )}
                  </div>
                  {experiment.conclusion && (
                    <div className="p-5">
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">{d.conclusion}</p>
                      <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4">
                        <p className="text-sm leading-7 text-slate-700">{experiment.conclusion}</p>
                      </div>
                    </div>
                  )}
                  {/* Output records */}
                  {outputRecords.length > 0 && (
                    <div className="p-5">
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        <Database className="mr-1 inline h-3 w-3" />
                        {d.outputRecords} ({outputRecords.length})
                      </p>
                      <div className="space-y-2">
                        {outputRecords.map((r) => (
                          <div key={r._id} className="flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50/50 px-3 py-2.5 text-xs">
                            <span className="text-base">{r.kind === "experiment_log" ? "📋" : r.kind === "dataset" ? "📊" : "📁"}</span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-medium text-slate-800">{r.title}</p>
                              <p className="font-mono text-[10px] text-slate-400">{r.localId}</p>
                            </div>
                            <span className={`rounded px-1.5 py-px text-[10px] font-medium ${r.processingStatus === "published" ? "bg-emerald-100 text-emerald-700" : "bg-stone-100 text-stone-600"}`}>
                              {r.processingStatus}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TOOLS TAB */}
              {activeTab === "tools" && (
                activeTool === null ? (
                  <div className="p-5">
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">{d.labTools}</p>
                    <p className="mb-5 text-xs text-slate-500">
                      {isUk ? "Результати розрахунків зберігаються у журналі нотаток." : "Calculation results are saved to the journal."}
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <ToolCard
                        emoji="🧬"
                        title={isUk ? "ПЛР Праймери" : "PCR Primer Design"}
                        desc={isUk ? "Підбір оптимальних праймерів за послідовністю ДНК. GC%, Tm, ΔTm, карта ампліконів." : "Design primers from DNA sequence. GC%, Tm, ΔTm, amplicon map."}
                        color="bg-violet-50 border-violet-200 hover:border-violet-400 hover:bg-violet-50"
                        labelColor="text-violet-700"
                        onClick={() => setActiveTool("pcr")}
                      />
                      <ToolCard
                        emoji="⚗️"
                        title={isUk ? "Концентрації" : "Concentrations"}
                        desc={isUk ? "Розведення (C₁V₁=C₂V₂), молярність, приготування стокових розчинів. Всі одиниці." : "Dilution (C₁V₁=C₂V₂), molarity, stock solutions. All units."}
                        color="bg-emerald-50 border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50"
                        labelColor="text-emerald-700"
                        onClick={() => setActiveTool("concentration")}
                      />
                    </div>
                    <p className="mt-5 text-[10px] text-slate-400">
                      {isUk ? "Більше інструментів з'явиться в наступних версіях." : "More tools coming in future versions."}
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-2.5">
                      <button type="button" onClick={() => setActiveTool(null)}
                        className="flex items-center gap-1 text-[11px] text-slate-500 transition hover:text-blue-600">
                        ← {isUk ? "Всі інструменти" : "All tools"}
                      </button>
                      <span className="text-slate-300">/</span>
                      <span className="text-[11px] font-semibold text-slate-700">
                        {activeTool === "pcr" ? (isUk ? "ПЛР Праймери" : "PCR Primers") : (isUk ? "Концентрації" : "Concentrations")}
                      </span>
                    </div>
                    {activeTool === "pcr" && (
                      <PCRPrimerTool onSaveToExperiment={handleSaveToolResult} />
                    )}
                    {activeTool === "concentration" && (
                      <ConcentrationTool onSaveToExperiment={handleSaveToolResult} />
                    )}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Modals ───────────────────────────────────────────── */}
      {showLinkModal && (
        <LinkMethodologyModal
          experiment={experiment}
          methodologyRecords={methodologyRecords}
          locale={locale}
          returnPath={returnPath}
          onClose={() => setShowLinkModal(false)}
        />
      )}
      {showGenModal && (
        <GenerateRecordModal
          experiment={experiment}
          stages={stages}
          locale={locale}
          returnPath={returnPath}
          onClose={() => setShowGenModal(false)}
        />
      )}
      <ConfirmModal
        open={confirmDeleteOpen}
        title={isUk ? "Видалити експеримент?" : "Delete experiment?"}
        message={d.confirmDelete}
        confirmLabel={isUk ? "Видалити" : "Delete"}
        onConfirm={() => { setConfirmDeleteOpen(false); deleteFormRef.current?.requestSubmit(); }}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
      <form ref={deleteFormRef} action={deleteExperiment} className="hidden" aria-hidden="true">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="projectId" value={experiment.projectId} />
        <input type="hidden" name="experimentId" value={experiment._id ?? ""} />
        <button type="submit" />
      </form>
    </div>
  );
}

// ── Sidebar content ───────────────────────────────────────────────────────────

function SidebarContent({
  experiment, linkedMethodology, methodologyRecords, inputRecords, outputRecords,
  linkedStage, stages, locale, dictionary, canManage, returnPath, onLinkMethodology,
}: {
  experiment: Experiment;
  linkedMethodology: ProjectRecord | null | undefined;
  methodologyRecords: ProjectRecord[];
  inputRecords: ProjectRecord[];
  outputRecords: ProjectRecord[];
  linkedStage: ResearchStage | undefined;
  stages: ResearchStage[];
  locale: string;
  dictionary: Dictionary;
  canManage: boolean;
  returnPath: string;
  onLinkMethodology: () => void;
}) {
  const isUk = locale === "uk";
  const d = dictionary.experiments;

  return (
    <div className="space-y-3">
      {/* Hypothesis */}
      {experiment.hypothesis && (
        <SidebarCard icon="💡" title={d.hypothesis}>
          <p className="text-xs italic leading-5 text-slate-600">{experiment.hypothesis}</p>
        </SidebarCard>
      )}

      {/* Variables & controls */}
      {(experiment.variables || experiment.controls || (experiment.replicates ?? 0) > 0) && (
        <SidebarCard icon="⚖️" title={isUk ? "Дизайн досліду" : "Study design"}>
          {experiment.variables && (
            <div className="mb-2">
              <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">{d.variables}</p>
              <p className="text-xs leading-5 text-slate-700">{experiment.variables}</p>
            </div>
          )}
          {experiment.controls && (
            <div className="mb-2">
              <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">{d.controls}</p>
              <p className="text-xs leading-5 text-slate-700">{experiment.controls}</p>
            </div>
          )}
          {(experiment.replicates ?? 0) > 0 && (
            <p className="text-xs text-slate-600">
              <span className="font-semibold">{experiment.replicates}</span> {isUk ? "реплікатів" : "replicates"}
            </p>
          )}
        </SidebarCard>
      )}

      {/* Methodology */}
      <SidebarCard
        icon="⚗️"
        title={isUk ? "Методика / СОП" : "Methodology / SOP"}
        action={canManage ? (
          <button type="button" onClick={onLinkMethodology}
            className="flex items-center gap-1 rounded-md border border-purple-200 bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-700 transition hover:bg-purple-100">
            {linkedMethodology ? <Link2Off className="h-3 w-3" /> : <Link2 className="h-3 w-3" />}
            {linkedMethodology ? d.changeMethodology : d.linkMethodology}
          </button>
        ) : null}
      >
        {linkedMethodology ? (
          <a href={`/${locale}/app/project?projectId=${experiment.projectId}&tab=records`}
            className="flex items-center gap-2 rounded-lg border border-purple-200 bg-purple-50/60 px-3 py-2 transition hover:bg-purple-50">
            <span>⚗️</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-purple-900">{linkedMethodology.title}</p>
              <p className="font-mono text-[10px] text-purple-500">{linkedMethodology.localId}</p>
            </div>
            <ExternalLink className="h-3 w-3 shrink-0 text-purple-400" />
          </a>
        ) : (
          <p className="text-xs text-slate-400">{d.methodologyNone}</p>
        )}
      </SidebarCard>

      {/* Input records */}
      <SidebarCard icon="📦" title={`${d.inputRecords} (${inputRecords.length})`}>
        {inputRecords.length === 0 ? (
          <p className="text-xs text-slate-400">{d.noInputRecords}</p>
        ) : (
          <div className="space-y-1">
            {inputRecords.map((r) => (
              <div key={r._id} className="flex items-center gap-2 rounded-md border border-slate-100 px-2 py-1.5 text-xs">
                <span>{r.kind === "sample" ? "🧬" : "📁"}</span>
                <span className="min-w-0 flex-1 truncate font-medium text-slate-700">{r.title}</span>
                <span className="shrink-0 font-mono text-[10px] text-slate-400">{r.localId}</span>
              </div>
            ))}
          </div>
        )}
      </SidebarCard>

      {/* Output records */}
      <SidebarCard icon="📋" title={`${d.outputRecords} (${outputRecords.length})`}>
        {outputRecords.length === 0 ? (
          <p className="text-xs text-slate-400">{d.noOutputRecords}</p>
        ) : (
          <div className="space-y-1">
            {outputRecords.map((r) => (
              <div key={r._id} className="flex items-center gap-2 rounded-md border border-emerald-100 bg-emerald-50/50 px-2 py-1.5 text-xs">
                <span>{r.kind === "dataset" ? "📊" : "📋"}</span>
                <span className="min-w-0 flex-1 truncate font-medium text-slate-700">{r.title}</span>
              </div>
            ))}
          </div>
        )}
      </SidebarCard>
    </div>
  );
}

function SidebarCard({
  icon, title, action, children,
}: {
  icon: string; title: string; action?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-3 py-2.5">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">{icon}</span>
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{title}</p>
        </div>
        {action}
      </div>
      <div className="px-3 py-3">{children}</div>
    </div>
  );
}

// ── Tool card ─────────────────────────────────────────────────────────────────

function ToolCard({
  emoji, title, desc, color, labelColor, onClick,
}: {
  emoji: string; title: string; desc: string; color: string; labelColor: string; onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick}
      className={`flex flex-col items-start rounded-xl border-2 p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md ${color}`}>
      <span className="mb-2 text-3xl">{emoji}</span>
      <p className={`text-sm font-bold ${labelColor}`}>{title}</p>
      <p className="mt-1 text-[11px] leading-5 text-slate-500">{desc}</p>
    </button>
  );
}

// ── Edit form ─────────────────────────────────────────────────────────────────

function ExperimentEditForm({
  experiment, stages, locale, dictionary, returnPath, onCancel,
}: {
  experiment: Experiment; stages: ResearchStage[]; locale: string; dictionary: Dictionary; returnPath: string; onCancel: () => void;
}) {
  const isUk = locale === "uk";
  const d = dictionary.experiments;

  return (
    <form action={updateExperiment} className="divide-y divide-slate-100">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="projectId" value={experiment.projectId} />
      <input type="hidden" name="experimentId" value={experiment._id ?? ""} />
      <input type="hidden" name="linkedMethodologyId" value={experiment.linkedMethodologyId} />
      <input type="hidden" name="linkedRecordIds" value={JSON.stringify(experiment.linkedRecordIds ?? [])} />
      <input type="hidden" name="outputRecordIds" value={JSON.stringify(experiment.outputRecordIds ?? [])} />
      <input type="hidden" name="notes" value={experiment.notes ?? ""} />
      <input type="hidden" name="returnPath" value={returnPath} />

      {/* Identification */}
      <div className="grid gap-4 p-6 sm:grid-cols-3">
        <div className="sm:col-span-3">
          <label className="mb-1 block text-xs font-semibold text-slate-600">{isUk ? "Назва *" : "Title *"}</label>
          <input name="title" defaultValue={experiment.title} className="input-control w-full" required />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">{isUk ? "Тип" : "Type"}</label>
          <select name="type" defaultValue={experiment.type} className="input-control w-full">
            {experimentTypes.map((t) => <option key={t} value={t}>{d.types[t]}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">{isUk ? "Статус" : "Status"}</label>
          <select name="status" defaultValue={experiment.status} className="input-control w-full">
            {experimentStatuses.map((s) => <option key={s} value={s}>{d.statuses[s]}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">{isUk ? "Пріоритет" : "Priority"}</label>
          <select name="priority" defaultValue={experiment.priority ?? "medium"} className="input-control w-full">
            {experimentPriorities.map((p) => <option key={p} value={p}>{PRIORITY_ICONS[p]} {p}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">{d.startDate}</label>
          <input type="date" name="startDate" defaultValue={experiment.startDate} className="input-control w-full" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">{d.endDate}</label>
          <input type="date" name="endDate" defaultValue={experiment.endDate} className="input-control w-full" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">{d.replicates}</label>
          <input type="number" name="replicates" defaultValue={experiment.replicates ?? 0} min={0} className="input-control w-full" />
        </div>
        {stages.length > 0 && (
          <div className="sm:col-span-3">
            <label className="mb-1 block text-xs font-semibold text-slate-600">{d.linkedStage}</label>
            <select name="stageId" defaultValue={experiment.stageId} className="input-control w-full">
              <option value="">{d.noStage}</option>
              {stages.map((s) => <option key={s._id} value={s._id ?? ""}>Е{s.stageNumber} — {s.title}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Science */}
      <div className="grid gap-4 p-6 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-semibold text-slate-600">{isUk ? "Цілі / завдання" : "Objectives"}</label>
          <textarea name="objectives" defaultValue={experiment.objectives} rows={2} className="input-control w-full resize-none" />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-semibold text-slate-600">{d.hypothesis}</label>
          <textarea name="hypothesis" defaultValue={experiment.hypothesis} rows={2} className="input-control w-full resize-none" placeholder={d.hypothesisHint} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">{d.variables}</label>
          <textarea name="variables" defaultValue={experiment.variables} rows={2} className="input-control w-full resize-none" placeholder={isUk ? "НЗ: доза; ЗЗ: рівень…" : "IV: dose; DV: level…"} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">{d.controls}</label>
          <textarea name="controls" defaultValue={experiment.controls} rows={2} className="input-control w-full resize-none" placeholder={isUk ? "Негативний контроль, blank…" : "Negative control, blank…"} />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-semibold text-slate-600">{d.methods}</label>
          <textarea name="methods" defaultValue={experiment.methods} rows={4} className="input-control w-full resize-none" placeholder={d.methodsHint} />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-semibold text-slate-600">{d.results}</label>
          <textarea name="results" defaultValue={experiment.results} rows={3} className="input-control w-full resize-none" />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-semibold text-slate-600">{d.conclusion}</label>
          <textarea name="conclusion" defaultValue={experiment.conclusion} rows={2} className="input-control w-full resize-none" />
        </div>
      </div>

      <div className="flex justify-end gap-2 px-6 py-4">
        <button type="button" onClick={onCancel} className="rounded-lg border border-slate-200 px-4 py-2 text-xs text-slate-600 transition hover:bg-slate-50">
          {isUk ? "Скасувати" : "Cancel"}
        </button>
        <button type="submit" className="control-primary rounded-lg px-6 py-2 text-xs font-semibold">
          {d.saveChanges}
        </button>
      </div>
    </form>
  );
}
