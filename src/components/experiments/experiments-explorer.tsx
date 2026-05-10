"use client";

import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Database,
  Edit2,
  ExternalLink,
  FlaskConical,
  GitBranch,
  KanbanSquare,
  LayoutList,
  Link2,
  Link2Off,
  Plus,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  createExperiment,
  createRecordFromExperiment,
  deleteExperiment,
  linkMethodologyToExperiment,
  updateExperiment,
  updateExperimentStatus,
} from "@/app/actions";
import type { Experiment, ExperimentStatus, ExperimentType, Project, ProjectRecord, ResearchStage, SafeUser } from "@/lib/schemas";
import { experimentPriorities, experimentStatuses, experimentTypes } from "@/lib/schemas";
import type { Dictionary } from "@/lib/i18n";
import { ConfirmModal } from "@/components/ui/confirm-modal";

// ── Constants ─────────────────────────────────────────────────────────────────

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

const STATUS_DOT: Record<ExperimentStatus, string> = {
  planned: "bg-stone-400", running: "bg-blue-500", completed: "bg-emerald-500",
  failed: "bg-rose-500", on_hold: "bg-amber-500",
};

const PRIORITY_COLORS: Record<string, string> = {
  low:      "text-stone-400",
  medium:   "text-blue-500",
  high:     "text-amber-500",
  critical: "text-rose-600",
};

const PRIORITY_ICONS: Record<string, string> = {
  low: "↓", medium: "→", high: "↑", critical: "⚑",
};

function fmtDate(d: string | undefined): string {
  if (!d) return "";
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? "" : dt.toLocaleDateString("uk-UA", { day: "2-digit", month: "2-digit", year: "numeric" });
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

// ── New-experiment modal ───────────────────────────────────────────────────────

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
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-4">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100">
            <FlaskConical className="h-4 w-4 text-indigo-600" />
          </span>
          <h2 className="text-sm font-semibold text-slate-900">{isUk ? "Новий експеримент" : "New experiment"}</h2>
          <button type="button" onClick={onClose} className="ml-auto rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form action={createExperiment} className="max-h-[80vh] overflow-y-auto">
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="projectId" value={project._id ?? ""} />

          <div className="space-y-4 px-6 py-5">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                {isUk ? "Назва *" : "Title *"}
              </label>
              <input name="title" required className="input-control w-full"
                placeholder={isUk ? "Диференційний аналіз lncRNA при гіпоксії…" : "Differential lncRNA analysis under hypoxia…"} />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">{isUk ? "Тип" : "Type"}</label>
                <select name="type" className="input-control w-full">
                  {experimentTypes.map((t) => (
                    <option key={t} value={t}>{TYPE_ICONS[t]} {d.types[t]}</option>
                  ))}
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
                  {experimentPriorities.map((p) => (
                    <option key={p} value={p}>{PRIORITY_ICONS[p]} {p}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {stages.length > 0 && (
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">{d.linkedStage}</label>
                  <select name="stageId" className="input-control w-full">
                    <option value="">{d.noStage}</option>
                    {stages.map((s) => (
                      <option key={s._id} value={s._id ?? ""}>Е{s.stageNumber} — {s.title.slice(0, 40)}</option>
                    ))}
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
              <textarea name="hypothesis" rows={2} className="input-control w-full resize-none"
                placeholder={d.hypothesisHint} />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">{isUk ? "Методи / матеріали" : "Methods / materials"}</label>
              <textarea name="methods" rows={2} className="input-control w-full resize-none"
                placeholder={d.methodsHint} />
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

// ── Link methodology modal ────────────────────────────────────────────────────

function LinkMethodologyModal({
  experiment, methodologyRecords, locale, onClose,
}: {
  experiment: Experiment; methodologyRecords: ProjectRecord[]; locale: string; onClose: () => void;
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
            <input
              className="input-control w-full pl-8 text-xs"
              placeholder={isUk ? "Пошук методики…" : "Search methodology…"}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>

          {methodologyRecords.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 py-8 text-center">
              <BookOpen className="mx-auto mb-2 h-6 w-6 text-slate-300" />
              <p className="text-xs text-slate-400">
                {isUk ? "Немає записів типу «Методологія». Спочатку створіть методику у Записах та даних." : "No Methodology records found. Create one in Records & Data first."}
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
                  <button
                    type="submit"
                    className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-purple-50"
                  >
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
  experiment, stages, locale, onClose,
}: {
  experiment: Experiment; stages: ResearchStage[]; locale: string; onClose: () => void;
}) {
  const isUk = locale === "uk";
  const [kind, setKind] = useState("experiment_log");
  const linkedStage = stages.find((s) => s._id === experiment.stageId);

  const kinds = [
    { value: "experiment_log", label: isUk ? "📋 Журнал експерименту" : "📋 Experiment Log", hint: isUk ? "Детальний лог виконання" : "Detailed execution log" },
    { value: "dataset", label: isUk ? "📊 Набір даних" : "📊 Dataset", hint: isUk ? "Оброблені результати для депонування" : "Processed results for deposit" },
    { value: "measurement_log", label: isUk ? "📐 Журнал вимірювань" : "📐 Measurement Log", hint: isUk ? "Числові вимірювання" : "Numerical measurements" },
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-xl bg-white shadow-2xl">
        <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
          <Sparkles className="h-4 w-4 text-emerald-600" />
          <h3 className="text-sm font-semibold text-slate-900">
            {isUk ? "Згенерувати запис з результатів" : "Generate record from results"}
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

          <div>
            <p className="mb-2 text-xs font-semibold text-slate-600">{isUk ? "Тип запису" : "Record type"}</p>
            <div className="space-y-2">
              {kinds.map((k) => (
                <label key={k.value} className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition ${kind === k.value ? "border-emerald-300 bg-emerald-50" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"}`}>
                  <input type="radio" name="_kind_radio" value={k.value} checked={kind === k.value} onChange={() => setKind(k.value)} className="accent-emerald-600" />
                  <div>
                    <p className="text-xs font-semibold text-slate-800">{k.label}</p>
                    <p className="text-[10px] text-slate-500">{k.hint}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">
              {isUk ? "Назва запису" : "Record title"}
            </label>
            <input name="title" className="input-control w-full"
              defaultValue={`${experiment.title} — ${isUk ? "Результати" : "Results"}`} />
          </div>

          <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5 text-xs text-slate-500">
            <p className="mb-1 font-semibold text-slate-600">{isUk ? "Буде скопійовано з експерименту:" : "Will be copied from experiment:"}</p>
            <ul className="space-y-0.5 list-disc pl-4">
              <li>{isUk ? "Результати та висновки → Опис запису" : "Results & conclusion → Record summary"}</li>
              <li>{isUk ? "Гіпотеза, змінні, контролі → typedData" : "Hypothesis, variables, controls → typedData"}</li>
              <li>{isUk ? "Дати збору → dateCollectedFrom/To" : "Collection dates → dateCollectedFrom/To"}</li>
            </ul>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50">
              {isUk ? "Скасувати" : "Cancel"}
            </button>
            <button type="submit" className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700">
              <Sparkles className="h-3.5 w-3.5" />
              {isUk ? "Створити запис" : "Create record"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Edit form ─────────────────────────────────────────────────────────────────

function ExperimentEditForm({
  experiment, stages, locale, dictionary, onCancel,
}: {
  experiment: Experiment; stages: ResearchStage[]; locale: string; dictionary: Dictionary; onCancel: () => void;
}) {
  const isUk = locale === "uk";
  const d = dictionary.experiments;

  return (
    <form action={updateExperiment} className="space-y-4 px-5 py-4">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="projectId" value={experiment.projectId} />
      <input type="hidden" name="experimentId" value={experiment._id ?? ""} />
      <input type="hidden" name="linkedMethodologyId" value={experiment.linkedMethodologyId} />
      <input type="hidden" name="linkedRecordIds" value={JSON.stringify(experiment.linkedRecordIds ?? [])} />
      <input type="hidden" name="outputRecordIds" value={JSON.stringify(experiment.outputRecordIds ?? [])} />

      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{isUk ? "Редагування" : "Edit"}</p>

      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-600">{isUk ? "Назва" : "Title"}</label>
        <input name="title" defaultValue={experiment.title} className="input-control w-full" required />
      </div>

      <div className="grid grid-cols-3 gap-3">
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
      </div>

      <div className="grid grid-cols-2 gap-3">
        {stages.length > 0 && (
          <div className="col-span-2">
            <label className="mb-1 block text-xs font-semibold text-slate-600">{d.linkedStage}</label>
            <select name="stageId" defaultValue={experiment.stageId} className="input-control w-full">
              <option value="">{d.noStage}</option>
              {stages.map((s) => <option key={s._id} value={s._id ?? ""}>Е{s.stageNumber} — {s.title.slice(0, 50)}</option>)}
            </select>
          </div>
        )}
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">{d.startDate}</label>
          <input type="date" name="startDate" defaultValue={experiment.startDate} className="input-control w-full" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">{d.endDate}</label>
          <input type="date" name="endDate" defaultValue={experiment.endDate} className="input-control w-full" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">{isUk ? "Реплікати" : "Replicates"}</label>
          <input type="number" name="replicates" defaultValue={experiment.replicates ?? 0} min={0} className="input-control w-full" />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-600">{isUk ? "Цілі / завдання" : "Objectives"}</label>
        <textarea name="objectives" defaultValue={experiment.objectives} rows={2} className="input-control w-full resize-none" />
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-600">{isUk ? "Гіпотеза" : "Hypothesis"}</label>
        <textarea name="hypothesis" defaultValue={experiment.hypothesis} rows={2} className="input-control w-full resize-none" placeholder={d.hypothesisHint} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">{isUk ? "Змінні (НЗ/ЗЗ)" : "Variables (IV/DV)"}</label>
          <textarea name="variables" defaultValue={experiment.variables} rows={2} className="input-control w-full resize-none" placeholder={isUk ? "НЗ: доза; ЗЗ: рівень кортизолу…" : "IV: dose; DV: cortisol level…"} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">{isUk ? "Контролі" : "Controls"}</label>
          <textarea name="controls" defaultValue={experiment.controls} rows={2} className="input-control w-full resize-none" placeholder={isUk ? "Негативний контроль, blank, vehicle…" : "Negative control, blank, vehicle…"} />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-600">{isUk ? "Методи / матеріали" : "Methods / materials"}</label>
        <textarea name="methods" defaultValue={experiment.methods} rows={3} className="input-control w-full resize-none" placeholder={d.methodsHint} />
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-600">{isUk ? "Результати" : "Results"}</label>
        <textarea name="results" defaultValue={experiment.results} rows={3} className="input-control w-full resize-none" />
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-600">{isUk ? "Висновок" : "Conclusion"}</label>
        <textarea name="conclusion" defaultValue={experiment.conclusion} rows={2} className="input-control w-full resize-none" />
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-600">{isUk ? "Нотатки" : "Notes"}</label>
        <textarea name="notes" defaultValue={experiment.notes} rows={2} className="input-control w-full resize-none" />
      </div>

      <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
        <button type="button" onClick={onCancel} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50">
          {isUk ? "Скасувати" : "Cancel"}
        </button>
        <button type="submit" className="control-primary rounded-lg px-3 py-1.5 text-xs">
          {isUk ? "Зберегти зміни" : "Save changes"}
        </button>
      </div>
    </form>
  );
}

// ── Detail panel ──────────────────────────────────────────────────────────────

function ExperimentDetailPanel({
  experiment, allRecords, stages, locale, dictionary, canManage, onClose,
}: {
  experiment: Experiment; allRecords: ProjectRecord[]; stages: ResearchStage[];
  locale: string; dictionary: Dictionary; canManage: boolean; onClose: () => void;
}) {
  const isUk = locale === "uk";
  const d = dictionary.experiments;
  const [isEditing, setIsEditing] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showGenModal, setShowGenModal] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const deleteFormRef = useRef<HTMLFormElement>(null);

  const linkedStage = stages.find((s) => s._id === experiment.stageId);
  const linkedMethodology = experiment.linkedMethodologyId
    ? allRecords.find((r) => r._id === experiment.linkedMethodologyId)
    : null;
  const methodologyRecords = allRecords.filter((r) => r.kind === "methodology");
  const outputRecords = allRecords.filter((r) => (experiment.outputRecordIds ?? []).includes(r._id ?? ""));
  const inputRecords = allRecords.filter((r) => (experiment.linkedRecordIds ?? []).includes(r._id ?? ""));

  const canGenerate = canManage && (experiment.status === "completed" || experiment.status === "running" || !!experiment.results);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/25 backdrop-blur-sm" onClick={onClose} role="button" tabIndex={-1} aria-label="Закрити" onKeyDown={(e) => e.key === "Escape" && onClose()} />

      {/* Panel */}
      <aside className="fixed inset-y-0 right-0 z-50 flex w-full flex-col overflow-hidden bg-white shadow-2xl sm:w-[560px] lg:w-[640px]">
        {/* Header */}
        <div className="flex items-start gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={`border px-2 py-0.5 text-[10px] font-semibold ${TYPE_COLORS[experiment.type]}`}>
                {TYPE_ICONS[experiment.type]} {d.types[experiment.type]}
              </span>
              <span className={`flex items-center gap-1 border px-2 py-0.5 text-[10px] font-semibold ${STATUS_COLORS[experiment.status]}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[experiment.status]}`} />
                {d.statuses[experiment.status]}
              </span>
              {experiment.priority && experiment.priority !== "medium" && (
                <span className={`text-xs font-bold ${PRIORITY_COLORS[experiment.priority]}`}>
                  {PRIORITY_ICONS[experiment.priority]} {experiment.priority}
                </span>
              )}
              {linkedStage && (
                <span className="border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[10px] text-indigo-600">
                  Е{linkedStage.stageNumber}
                </span>
              )}
              {(experiment.startDate || experiment.endDate) && (
                <span className="font-mono text-[10px] text-slate-400">
                  {fmtDate(experiment.startDate)}{experiment.endDate ? ` — ${fmtDate(experiment.endDate)}` : ""}
                </span>
              )}
            </div>
            <h2 className="mt-2 text-base font-semibold text-slate-900">{experiment.title}</h2>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            {canManage && !isEditing && (
              <button type="button" onClick={() => setIsEditing(true)} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-blue-100 hover:text-blue-600" title={isUk ? "Редагувати" : "Edit"}>
                <Edit2 className="h-4 w-4" />
              </button>
            )}
            <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-200 hover:text-slate-600">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {isEditing ? (
            <ExperimentEditForm experiment={experiment} stages={stages} locale={locale} dictionary={dictionary} onCancel={() => setIsEditing(false)} />
          ) : (
            <div className="divide-y divide-slate-100">

              {/* ── Methodology link ───────────────────────────────────────── */}
              <div className="px-5 py-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    ⚗️ {isUk ? "Методика" : "Methodology"}
                  </p>
                  {canManage && (
                    <button
                      type="button"
                      onClick={() => setShowLinkModal(true)}
                      className="flex items-center gap-1 rounded-md border border-purple-200 bg-purple-50 px-2 py-1 text-[10px] font-semibold text-purple-700 transition hover:bg-purple-100"
                    >
                      {linkedMethodology ? <Link2Off className="h-3 w-3" /> : <Link2 className="h-3 w-3" />}
                      {linkedMethodology ? (isUk ? "Змінити" : "Change") : (isUk ? "Прив'язати" : "Link")}
                    </button>
                  )}
                </div>

                {linkedMethodology ? (
                  <a
                    href={`/${locale}/app/project?projectId=${experiment.projectId}&tab=records`}
                    className="flex items-start gap-3 rounded-xl border border-purple-200 bg-purple-50/50 px-4 py-3 transition hover:border-purple-300 hover:bg-purple-50"
                  >
                    <span className="mt-0.5 text-xl">⚗️</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-purple-900">{linkedMethodology.title}</p>
                      <p className="font-mono text-[10px] text-purple-500">{linkedMethodology.localId}</p>
                      {!!linkedMethodology.typedData?.method_family && (
                        <p className="mt-0.5 text-[10px] text-purple-600">
                          {String(linkedMethodology.typedData.method_family).replace(/_/g, " ")}
                        </p>
                      )}
                    </div>
                    <ExternalLink className="mt-1 h-3.5 w-3.5 shrink-0 text-purple-400" />
                  </a>
                ) : (
                  <div className="flex flex-col items-center rounded-lg border border-dashed border-slate-200 bg-slate-50/50 px-4 py-5 text-center">
                    <BookOpen className="mb-2 h-5 w-5 text-slate-300" />
                    <p className="text-xs text-slate-400">
                      {isUk ? "Методику ще не прив'язано." : "No methodology linked yet."}
                    </p>
                    {canManage && (
                      <button type="button" onClick={() => setShowLinkModal(true)}
                        className="mt-2 rounded-md bg-purple-100 px-3 py-1.5 text-xs font-semibold text-purple-700 transition hover:bg-purple-200">
                        {isUk ? "Прив'язати методику" : "Link methodology"}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* ── Hypothesis & objectives ───────────────────────────────── */}
              {(experiment.hypothesis || experiment.objectives) && (
                <div className="px-5 py-4 space-y-3">
                  {experiment.objectives && (
                    <div>
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">{isUk ? "Цілі" : "Objectives"}</p>
                      <p className="text-sm leading-6 text-slate-700">{experiment.objectives}</p>
                    </div>
                  )}
                  {experiment.hypothesis && (
                    <div>
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">{isUk ? "Гіпотеза" : "Hypothesis"}</p>
                      <p className="text-sm italic leading-6 text-slate-600">{experiment.hypothesis}</p>
                    </div>
                  )}
                </div>
              )}

              {/* ── Variables & controls ──────────────────────────────────── */}
              {(experiment.variables || experiment.controls || (experiment.replicates ?? 0) > 0) && (
                <div className="grid grid-cols-2 gap-4 px-5 py-4">
                  {experiment.variables && (
                    <div>
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">{isUk ? "Змінні" : "Variables"}</p>
                      <p className="text-xs leading-5 text-slate-700">{experiment.variables}</p>
                    </div>
                  )}
                  {experiment.controls && (
                    <div>
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">{isUk ? "Контролі" : "Controls"}</p>
                      <p className="text-xs leading-5 text-slate-700">{experiment.controls}</p>
                    </div>
                  )}
                  {(experiment.replicates ?? 0) > 0 && (
                    <div>
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">{isUk ? "Реплікати" : "Replicates"}</p>
                      <p className="text-sm font-bold text-slate-800">{experiment.replicates}</p>
                    </div>
                  )}
                </div>
              )}

              {/* ── Methods ──────────────────────────────────────────────── */}
              {experiment.methods && (
                <div className="px-5 py-4">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">{isUk ? "Методи / матеріали" : "Methods / materials"}</p>
                  <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{experiment.methods}</p>
                </div>
              )}

              {/* ── Results & conclusion ──────────────────────────────────── */}
              <div className="px-5 py-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    📊 {isUk ? "Результати" : "Results"}
                  </p>
                  {canGenerate && (
                    <button type="button" onClick={() => setShowGenModal(true)}
                      className="flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700 transition hover:bg-emerald-100">
                      <Sparkles className="h-3 w-3" />
                      {isUk ? "Згенерувати запис" : "Generate record"}
                    </button>
                  )}
                </div>

                {experiment.results ? (
                  <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{experiment.results}</p>
                ) : (
                  <p className="text-xs text-slate-400">
                    {experiment.status === "planned"
                      ? (isUk ? "Ще не розпочато. Результати з'являться після виконання." : "Not started yet. Results will appear after execution.")
                      : experiment.status === "running"
                      ? (isUk ? "Експеримент виконується. Результати в процесі." : "Experiment in progress. Results pending.")
                      : (isUk ? "Результати відсутні." : "No results recorded.")}
                  </p>
                )}

                {experiment.conclusion && (
                  <div className="mt-3">
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">{isUk ? "Висновок" : "Conclusion"}</p>
                    <p className="text-sm leading-6 text-slate-700">{experiment.conclusion}</p>
                  </div>
                )}
              </div>

              {/* ── Input records ─────────────────────────────────────────── */}
              {inputRecords.length > 0 && (
                <div className="px-5 py-4">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    📦 {isUk ? "Вхідні записи / зразки" : "Input records / samples"} ({inputRecords.length})
                  </p>
                  <div className="space-y-1.5">
                    {inputRecords.map((r) => (
                      <div key={r._id} className="flex items-center gap-2 rounded-md border border-slate-100 bg-white px-3 py-2 text-xs">
                        <span className="text-base">{r.kind === "sample" ? "🧬" : r.kind === "dataset" ? "📊" : "📁"}</span>
                        <span className="min-w-0 flex-1 truncate font-medium text-slate-800">{r.title}</span>
                        <span className="shrink-0 font-mono text-slate-400">{r.localId}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Output records ────────────────────────────────────────── */}
              <div className="px-5 py-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    <Database className="mr-1 inline h-3 w-3" />
                    {isUk ? "Записи-результати" : "Output records"}
                    {outputRecords.length > 0 && ` (${outputRecords.length})`}
                  </p>
                </div>

                {outputRecords.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/50 py-4 text-center">
                    <p className="text-[10px] text-slate-400">
                      {isUk ? "Записи ще не створено. Після отримання результатів натисніть «Згенерувати запис»." : "No output records yet. After getting results, click \"Generate record\"."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {outputRecords.map((r) => (
                      <div key={r._id} className="flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50/50 px-3 py-2 text-xs">
                        <span className="text-base">{r.kind === "experiment_log" ? "📋" : r.kind === "dataset" ? "📊" : "📁"}</span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-slate-800">{r.title}</p>
                          <p className="font-mono text-[10px] text-slate-400">{r.localId} · {r.kind.replace(/_/g, " ")}</p>
                        </div>
                        <span className={`rounded-sm px-1.5 py-px text-[10px] font-medium ${
                          r.processingStatus === "published" ? "bg-emerald-100 text-emerald-700"
                          : r.processingStatus === "raw" ? "bg-stone-100 text-stone-500"
                          : "bg-blue-100 text-blue-700"
                        }`}>{r.processingStatus}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Notes ────────────────────────────────────────────────── */}
              {experiment.notes && (
                <div className="px-5 py-4">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">{isUk ? "Нотатки" : "Notes"}</p>
                  <p className="text-xs leading-5 text-slate-500">{experiment.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        {!isEditing && canManage && (
          <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 bg-slate-50/80 px-5 py-3">
            <form action={updateExperimentStatus} className="flex items-center gap-1.5">
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="projectId" value={experiment.projectId} />
              <input type="hidden" name="experimentId" value={experiment._id ?? ""} />
              <select name="status" defaultValue={experiment.status} className="input-control py-1 text-[11px]">
                {experimentStatuses.map((s) => <option key={s} value={s}>{d.statuses[s]}</option>)}
              </select>
              <button type="submit" className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-100">
                {isUk ? "Оновити" : "Update"}
              </button>
            </form>

            {canGenerate && (
              <button type="button" onClick={() => setShowGenModal(true)}
                className="flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 transition hover:bg-emerald-100">
                <Sparkles className="h-3 w-3" />
                {isUk ? "У Записи" : "To Records"}
              </button>
            )}

            <button
              type="button"
              onClick={() => setConfirmDeleteOpen(true)}
              className="ml-auto text-[11px] text-rose-500 transition hover:text-rose-700"
            >
              {isUk ? "Видалити" : "Delete"}
            </button>
            <form ref={deleteFormRef} action={deleteExperiment} className="hidden" aria-hidden="true">
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="projectId" value={experiment.projectId} />
              <input type="hidden" name="experimentId" value={experiment._id ?? ""} />
              <button type="submit" />
            </form>
          </div>
        )}
      </aside>

      {/* Modals */}
      {showLinkModal && (
        <LinkMethodologyModal
          experiment={experiment}
          methodologyRecords={methodologyRecords}
          locale={locale}
          onClose={() => setShowLinkModal(false)}
        />
      )}
      {showGenModal && (
        <GenerateRecordModal
          experiment={experiment}
          stages={stages}
          locale={locale}
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
    </>
  );
}

// ── Experiment row (list view) ────────────────────────────────────────────────

function ExperimentRow({
  experiment, stages, allRecords, locale, dictionary, onOpen,
}: {
  experiment: Experiment; stages: ResearchStage[]; allRecords: ProjectRecord[];
  locale: string; dictionary: Dictionary; onOpen: (e: Experiment) => void;
}) {
  const isUk = locale === "uk";
  const d = dictionary.experiments;
  const linkedStage = stages.find((s) => s._id === experiment.stageId);
  const hasMethodology = !!(experiment.linkedMethodologyId && allRecords.find((r) => r._id === experiment.linkedMethodologyId));
  const outputCount = (experiment.outputRecordIds ?? []).length;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(experiment)}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onOpen(experiment)}
      className="group flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:-translate-y-px hover:border-blue-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-300"
      style={{ borderLeftWidth: "3px", borderLeftColor: { planned: "#a8a29e", running: "#3b82f6", completed: "#10b981", failed: "#f43f5e", on_hold: "#f59e0b" }[experiment.status] }}
    >
      {/* Type icon */}
      <span className="text-xl">{TYPE_ICONS[experiment.type]}</span>

      {/* Main content */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={`border px-1.5 py-px text-[10px] font-semibold ${TYPE_COLORS[experiment.type]}`}>
            {d.types[experiment.type]}
          </span>
          <span className={`flex items-center gap-1 border px-1.5 py-px text-[10px] font-semibold ${STATUS_COLORS[experiment.status]}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[experiment.status]}`} />
            {d.statuses[experiment.status]}
          </span>
          {experiment.priority && experiment.priority !== "medium" && (
            <span className={`text-[11px] font-bold ${PRIORITY_COLORS[experiment.priority]}`}>
              {PRIORITY_ICONS[experiment.priority]}
            </span>
          )}
          {linkedStage && (
            <span className="border border-indigo-200 bg-indigo-50 px-1.5 py-px text-[10px] text-indigo-600">
              Е{linkedStage.stageNumber}
            </span>
          )}
          {hasMethodology && (
            <span className="flex items-center gap-0.5 rounded-full bg-purple-100 px-1.5 py-px text-[10px] text-purple-700">
              ⚗️ {isUk ? "методика" : "method"}
            </span>
          )}
          {outputCount > 0 && (
            <span className="flex items-center gap-0.5 rounded-full bg-emerald-100 px-1.5 py-px text-[10px] text-emerald-700">
              📋 {outputCount}
            </span>
          )}
        </div>
        <p className="mt-1 truncate font-semibold text-slate-900 group-hover:text-blue-700">{experiment.title}</p>
        {experiment.hypothesis && (
          <p className="mt-0.5 truncate text-xs text-slate-400 italic">{experiment.hypothesis}</p>
        )}
      </div>

      {/* Date */}
      {(experiment.startDate || experiment.endDate) && (
        <span className="shrink-0 font-mono text-[10px] text-slate-400">
          {fmtDate(experiment.startDate)}{experiment.endDate ? ` – ${fmtDate(experiment.endDate)}` : ""}
        </span>
      )}

      <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-blue-400" />
    </div>
  );
}

// ── Kanban column ─────────────────────────────────────────────────────────────

function KanbanColumn({
  status, experiments, stages, allRecords, locale, dictionary, onOpen,
}: {
  status: ExperimentStatus; experiments: Experiment[]; stages: ResearchStage[];
  allRecords: ProjectRecord[]; locale: string; dictionary: Dictionary; onOpen: (e: Experiment) => void;
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
      <div className={`flex items-center justify-between px-3 py-2.5`}>
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
          return (
            <button
              key={exp._id}
              type="button"
              onClick={() => onOpen(exp)}
              className="group w-full rounded-lg border border-white bg-white px-3 py-2.5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
            >
              <div className="mb-1 flex flex-wrap gap-1">
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
                  {hasMethodology && <span className="text-[9px] text-purple-600">⚗️ {locale === "uk" ? "метод" : "method"}</span>}
                  {outputCount > 0 && <span className="text-[9px] text-emerald-600">📋 {outputCount}</span>}
                </div>
              )}
              {exp.startDate && (
                <p className="mt-1 font-mono text-[9px] text-slate-400">{fmtDate(exp.startDate)}</p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Main explorer ─────────────────────────────────────────────────────────────

export function ExperimentsExplorer({
  experiments: initialExperiments,
  stages,
  allRecords,
  project,
  locale,
  dictionary,
  canManage,
  initialSelectedId,
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

  const [selectedExp, setSelectedExp] = useState<Experiment | null>(
    initialSelectedId ? (initialExperiments.find((e) => e._id === initialSelectedId) ?? null) : null,
  );
  const [view, setView] = useState<"list" | "kanban">("list");
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<ExperimentType | "">("");
  const [filterStatus, setFilterStatus] = useState<ExperimentStatus | "">("");
  const [showNewModal, setShowNewModal] = useState(false);

  const openExp = useCallback((e: Experiment) => setSelectedExp(e), []);
  const closeExp = useCallback(() => setSelectedExp(null), []);

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
    return base;
  }, [initialExperiments, filterType, filterStatus, search]);

  // Stats
  const stats = useMemo(() => ({
    total: initialExperiments.length,
    planned: initialExperiments.filter((e) => e.status === "planned").length,
    running: initialExperiments.filter((e) => e.status === "running").length,
    completed: initialExperiments.filter((e) => e.status === "completed").length,
    failed: initialExperiments.filter((e) => e.status === "failed").length,
    withMethodology: initialExperiments.filter((e) => !!e.linkedMethodologyId).length,
    withOutputs: initialExperiments.filter((e) => (e.outputRecordIds ?? []).length > 0).length,
  }), [initialExperiments]);

  // Kanban grouped
  const kanbanGroups = useMemo(() => {
    const groups: Record<ExperimentStatus, Experiment[]> = {
      planned: [], running: [], completed: [], failed: [], on_hold: [],
    };
    filtered.forEach((e) => groups[e.status].push(e));
    return groups;
  }, [filtered]);

  if (initialExperiments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white py-16 text-center">
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
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            className="input-control w-full pl-8 text-xs"
            placeholder={isUk ? "Пошук…" : "Search…"}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Type filters */}
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

        {/* View toggle */}
        <div className="flex rounded-lg border border-slate-200 bg-white p-0.5">
          <button type="button" onClick={() => setView("list")}
            className={`rounded-md p-1.5 transition ${view === "list" ? "bg-indigo-100 text-indigo-700" : "text-slate-400 hover:text-slate-600"}`}>
            <LayoutList className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={() => setView("kanban")}
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
        <div className="space-y-2">
          {filtered.map((exp) => (
            <ExperimentRow key={exp._id} experiment={exp} stages={stages} allRecords={allRecords}
              locale={locale} dictionary={dictionary} onOpen={openExp} />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {experimentStatuses.map((status) => (
            <KanbanColumn key={status} status={status} experiments={kanbanGroups[status]} stages={stages}
              allRecords={allRecords} locale={locale} dictionary={dictionary} onOpen={openExp} />
          ))}
        </div>
      )}

      {/* ── Detail panel ───────────────────────────────────────────────── */}
      {selectedExp && (
        <ExperimentDetailPanel
          experiment={selectedExp}
          allRecords={allRecords}
          stages={stages}
          locale={locale}
          dictionary={dictionary}
          canManage={canManage}
          onClose={closeExp}
        />
      )}

      {/* ── New experiment modal ────────────────────────────────────────── */}
      {showNewModal && (
        <NewExperimentModal project={project} stages={stages} locale={locale} dictionary={dictionary} onClose={() => setShowNewModal(false)} />
      )}

    </div>
  );
}
