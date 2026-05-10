"use client";

import { useRef, useState } from "react";
import type { Experiment, ResearchStage } from "@/lib/schemas";
import type { Dictionary } from "@/lib/i18n";
import { updateExperimentStatus, deleteExperiment } from "@/app/actions";
import { ConfirmModal } from "@/components/ui/confirm-modal";

const typeColors: Record<Experiment["type"], string> = {
  in_silico: "border-indigo-300 bg-indigo-50 text-indigo-700",
  in_vitro: "border-emerald-300 bg-emerald-50 text-emerald-700",
  in_vivo: "border-rose-300 bg-rose-50 text-rose-700",
  clinical: "border-amber-300 bg-amber-50 text-amber-700",
  other: "border-stone-300 bg-stone-50 text-stone-600",
};

const statusColors: Record<Experiment["status"], string> = {
  planned: "border-stone-200 bg-stone-100 text-stone-600",
  running: "border-blue-200 bg-blue-50 text-blue-700",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
  failed: "border-rose-200 bg-rose-50 text-rose-700",
  on_hold: "border-amber-200 bg-amber-50 text-amber-600",
};

const statusBorderLeft: Record<Experiment["status"], string> = {
  planned: "#a8a29e",
  running: "#3b82f6",
  completed: "#10b981",
  failed: "#f43f5e",
  on_hold: "#f59e0b",
};

function fmtDate(d: string | undefined): string {
  if (!d) return "";
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? "" : dt.toLocaleDateString("uk-UA", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function ExperimentCard({
  experiment,
  stages,
  dictionary,
  locale,
  projectId,
  canManage,
}: {
  experiment: Experiment;
  stages: ResearchStage[];
  dictionary: Dictionary;
  locale: string;
  projectId: string;
  canManage: boolean;
}) {
  const d = dictionary.experiments;
  const typeLabel = d.types[experiment.type] ?? experiment.type;
  const statusLabel = d.statuses[experiment.status] ?? experiment.status;
  const linkedStage = stages.find((s) => s._id === experiment.stageId);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const deleteFormRef = useRef<HTMLFormElement>(null);

  const hasSections =
    experiment.hypothesis || experiment.methods || experiment.results || experiment.conclusion;

  return (
    <div
      className="surface overflow-hidden"
      style={{ borderLeftWidth: "3px", borderLeftColor: statusBorderLeft[experiment.status] }}
    >
      {/* Header */}
      <div className="px-5 py-4">
        <div className="flex flex-wrap items-start gap-2">
          <span className={`inline-flex items-center rounded border px-2 py-0.5 font-mono text-xs font-semibold ${typeColors[experiment.type]}`}>
            {typeLabel}
          </span>
          <span className={`inline-flex items-center rounded border px-2 py-0.5 font-mono text-xs font-semibold ${statusColors[experiment.status]}`}>
            {statusLabel}
          </span>
          {linkedStage && (
            <span className="inline-flex items-center rounded border border-indigo-200 bg-indigo-50 px-2 py-0.5 font-mono text-xs text-indigo-600">
              Е{linkedStage.stageNumber}
            </span>
          )}
          {(experiment.startDate || experiment.endDate) && (
            <span className="ml-auto font-mono text-xs text-stone-400">
              {fmtDate(experiment.startDate)}
              {experiment.endDate ? ` — ${fmtDate(experiment.endDate)}` : ""}
            </span>
          )}
        </div>

        <h3 className="mt-2 text-base font-semibold leading-snug text-stone-900">
          {experiment.title}
        </h3>

        {experiment.hypothesis && (
          <p className="mt-1.5 line-clamp-2 text-sm italic text-stone-500">
            {experiment.hypothesis}
          </p>
        )}
      </div>

      {/* Expandable sections */}
      {hasSections && (
        <details className="border-t border-stone-100">
          <summary className="cursor-pointer select-none px-5 py-2.5 text-xs font-semibold text-stone-500 hover:text-stone-700 hover:bg-stone-50 transition">
            {locale === "uk" ? "Деталі експерименту ▾" : "Experiment details ▾"}
          </summary>
          <div className="divide-y divide-stone-100 px-5 pb-4 pt-1 space-y-3">
            {experiment.methods && (
              <div className="pt-2">
                <p className="mb-1 text-xs font-bold uppercase tracking-wider text-stone-400">{d.methods}</p>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-stone-700">{experiment.methods}</p>
              </div>
            )}
            {experiment.results && (
              <div className="pt-2">
                <p className="mb-1 text-xs font-bold uppercase tracking-wider text-stone-400">{d.results}</p>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-stone-700">{experiment.results}</p>
              </div>
            )}
            {experiment.conclusion && (
              <div className="pt-2">
                <p className="mb-1 text-xs font-bold uppercase tracking-wider text-stone-400">{d.conclusion}</p>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-stone-700">{experiment.conclusion}</p>
              </div>
            )}
            {experiment.notes && (
              <div className="pt-2">
                <p className="mb-1 text-xs font-bold uppercase tracking-wider text-stone-400">{d.notes}</p>
                <p className="whitespace-pre-wrap text-sm text-stone-500">{experiment.notes}</p>
              </div>
            )}
          </div>
        </details>
      )}

      {/* Actions */}
      {canManage && (
        <div className="flex flex-wrap items-center gap-2 border-t border-stone-100 bg-stone-50/60 px-5 py-2.5">
          <form action={updateExperimentStatus} className="flex items-center gap-2">
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="experimentId" value={experiment._id ?? ""} />
            <select
              name="status"
              defaultValue={experiment.status}
              className="input-control py-1 text-xs"
            >
              {(["planned", "running", "completed", "failed", "on_hold"] as const).map((s) => (
                <option key={s} value={s}>{d.statuses[s]}</option>
              ))}
            </select>
            <button type="submit" className="control px-2.5 py-1 text-xs font-semibold">
              {locale === "uk" ? "Змінити" : "Update"}
            </button>
          </form>

          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            className="ml-auto text-xs text-rose-500 hover:text-rose-700 transition"
          >
            {locale === "uk" ? "Видалити" : "Delete"}
          </button>

          <form ref={deleteFormRef} action={deleteExperiment} className="hidden" aria-hidden="true">
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="experimentId" value={experiment._id ?? ""} />
            <button type="submit" />
          </form>
        </div>
      )}

      <ConfirmModal
        open={confirmOpen}
        title={locale === "uk" ? "Видалити експеримент?" : "Delete experiment?"}
        message={d.confirmDelete}
        confirmLabel={locale === "uk" ? "Видалити" : "Delete"}
        onConfirm={() => { setConfirmOpen(false); deleteFormRef.current?.requestSubmit(); }}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
