"use client";

import { useState } from "react";
import type { Report, ResearchStage } from "@/lib/schemas";
import type { Dictionary } from "@/lib/i18n";
import {
  updateReport,
  updateReportStatus,
  autoFillReportSections,
} from "@/app/actions";
import { ReportDeleteForm } from "@/components/reports/report-delete-form";
import { ExportPanel } from "@/components/reports/export-panel";
import { StructuredReportEditor } from "@/components/reports/structured-report-editor";

const typeColors: Record<Report["type"], string> = {
  intermediate: "#4f46e5",
  annual: "#7c3aed",
  final: "#d97706",
  financial: "#059669",
  conference: "#2563eb",
  custom: "#78716c",
};

const statusBadge: Record<Report["status"], string> = {
  draft: "border-slate-200 bg-slate-100 text-slate-600",
  ready: "border-blue-200 bg-blue-50 text-blue-700",
  submitted: "border-violet-200 bg-violet-50 text-violet-700",
  approved: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

function formatDate(d: Date): string {
  return new Date(d).toLocaleDateString("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

type SectionKey =
  | "sectionGoals"
  | "sectionResults"
  | "sectionPublications"
  | "sectionTimeline"
  | "sectionFinancial"
  | "sectionProblems"
  | "sectionPlans";

export function ReportEditor({
  report,
  stages,
  dictionary,
  locale,
  projectId,
  canManage,
}: {
  report: Report;
  stages: ResearchStage[];
  dictionary: Dictionary;
  locale: string;
  projectId: string;
  canManage: boolean;
}) {
  const [editorMode, setEditorMode] = useState<"structured" | "raw">("structured");
  const d = dictionary.reports;
  const typeLabel = d.reportTypes[report.type] ?? report.type;
  const statusLabel = d.reportStatuses[report.status] ?? report.status;

  const sections: { key: SectionKey; label: string; hint: string }[] = [
    { key: "sectionGoals", label: d.sectionGoals, hint: d.sectionGoalsHint },
    { key: "sectionResults", label: d.sectionResults, hint: d.sectionResultsHint },
    { key: "sectionPublications", label: d.sectionPublications, hint: d.sectionPublicationsHint },
    { key: "sectionTimeline", label: d.sectionTimeline, hint: d.sectionTimelineHint },
    { key: "sectionFinancial", label: d.sectionFinancial, hint: d.sectionFinancialHint },
    { key: "sectionProblems", label: d.sectionProblems, hint: d.sectionProblemsHint },
    { key: "sectionPlans", label: d.sectionPlans, hint: d.sectionPlansHint },
  ];

  const filledSections = sections.filter((s) => !!report[s.key]);

  return (
    <div className="space-y-5">
      {/* Top section: title, badges, status management */}
      <div
        className="surface overflow-hidden"
        style={{ borderLeftWidth: "3px", borderLeftColor: typeColors[report.type] }}
      >
        <div className="px-5 py-5">
          <div className="flex flex-wrap items-start gap-3">
            <div className="flex flex-wrap gap-1.5">
              <span className="inline-block rounded border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold text-slate-600">
                {typeLabel}
              </span>
              <span
                className={`inline-block rounded border px-2 py-0.5 font-mono text-xs font-semibold ${statusBadge[report.status]}`}
              >
                {statusLabel}
              </span>
            </div>
            {report.period && (
              <span className="shell-chip rounded border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-xs text-slate-500">
                {report.period}
              </span>
            )}
          </div>
          <h1 className="mt-3 text-2xl font-semibold leading-snug text-stone-950">
            {report.title}
          </h1>
          <p className="mt-1 text-xs text-stone-400">
            {d.createdAt}: {formatDate(report.createdAt)} &middot; {d.updatedAt}: {formatDate(report.updatedAt)}
          </p>

          {/* Status management */}
          {canManage && (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <form action={updateReportStatus} className="flex flex-wrap items-center gap-2">
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="projectId" value={projectId} />
                <input type="hidden" name="reportId" value={report._id ?? ""} />
                <label className="text-xs font-semibold text-stone-600">{d.changeStatus}:</label>
                <select
                  name="status"
                  defaultValue={report.status}
                  className="input-control py-1 text-xs"
                >
                  {(["draft", "ready", "submitted", "approved"] as const).map((s) => (
                    <option key={s} value={s}>
                      {d.reportStatuses[s]}
                    </option>
                  ))}
                </select>
                <button type="submit" className="control px-3 py-1.5 text-xs font-semibold">
                  {d.changeStatus}
                </button>
              </form>
            </div>
          )}

          {/* Export panel */}
          <div className="mt-4 border-t border-slate-100 pt-4">
            <ExportPanel
              projectId={projectId}
              reportId={report._id ?? null}
              locale={locale}
              printHref={`/${locale}/app/reports/print?projectId=${projectId}&reportId=${report._id ?? ""}`}
            />
          </div>
        </div>
      </div>

      {/* Edit mode toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Mode tabs */}
        <div className="flex rounded-lg border border-stone-200 bg-stone-50 p-0.5">
          <button
            type="button"
            onClick={() => setEditorMode("structured")}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
              editorMode === "structured"
                ? "bg-white text-emerald-700 shadow-sm ring-1 ring-stone-200"
                : "text-stone-500 hover:text-stone-700"
            }`}
          >
            {locale === "uk" ? "✦ Структурований" : "✦ Structured"}
          </button>
          <button
            type="button"
            onClick={() => setEditorMode("raw")}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
              editorMode === "raw"
                ? "bg-white text-stone-700 shadow-sm ring-1 ring-stone-200"
                : "text-stone-500 hover:text-stone-700"
            }`}
          >
            {locale === "uk" ? "Текстовий" : "Raw text"}
          </button>
        </div>

        {canManage && editorMode === "raw" && (
          <form action={autoFillReportSections}>
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="reportId" value={report._id ?? ""} />
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100 hover:border-indigo-300"
            >
              <span>⚡</span>
              {locale === "uk" ? "Заповнити автоматично" : "Auto-fill from DB"}
            </button>
          </form>
        )}
      </div>

      {/* Structured editor */}
      {editorMode === "structured" && canManage && (
        <StructuredReportEditor
          report={report}
          stages={stages}
          projectId={projectId}
          locale={locale}
        />
      )}

      {/* Main editor form (raw mode) */}
      {editorMode === "raw" && <form action={updateReport} className="space-y-4">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="reportId" value={report._id ?? ""} />

        {/* Title */}
        <div className="surface px-5 py-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-stone-600">
                {d.reportTitle} *
              </label>
              <input
                type="text"
                name="title"
                required
                defaultValue={report.title}
                placeholder={d.reportTitlePlaceholder}
                className="input-control w-full"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-stone-600">
                {d.reportType}
              </label>
              <select name="type" defaultValue={report.type} className="input-control w-full">
                {(["intermediate", "annual", "final", "financial", "conference", "custom"] as const).map(
                  (t) => (
                    <option key={t} value={t}>
                      {d.reportTypes[t]}
                    </option>
                  ),
                )}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-stone-600">
                {d.reportPeriod}
              </label>
              <input
                type="text"
                name="period"
                defaultValue={report.period}
                placeholder={d.reportPeriodPlaceholder}
                className="input-control w-full"
              />
            </div>
          </div>

          {stages.length > 0 && (
            <div className="mt-4">
              <label className="mb-1 block text-xs font-semibold text-stone-600">
                {d.linkedStages}
              </label>
              <div className="flex flex-wrap gap-3">
                {stages.map((stage) => (
                  <label key={stage._id} className="flex items-center gap-1.5 text-sm text-stone-700">
                    <input
                      type="checkbox"
                      name="linkedStageIds"
                      value={stage._id ?? ""}
                      defaultChecked={report.linkedStageIds.includes(stage._id ?? "")}
                      className="accent-indigo-600"
                    />
                    #{stage.stageNumber} {stage.title.slice(0, 40)}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Section editors */}
        <div className="space-y-3">
          {sections.map((section) => {
            const hasContent = !!report[section.key];
            return (
              <details
                key={section.key}
                className="surface"
                open={hasContent}
              >
                <summary className="flex cursor-pointer select-none items-center gap-2 px-5 py-3 font-semibold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700">
                  <span className="font-mono text-blue-600 transition-transform group-open:rotate-45">
                    §
                  </span>
                  {section.label}
                </summary>
                <div className="border-t border-stone-100 px-5 pb-4 pt-3">
                  <p className="mb-2 text-xs text-stone-400">{section.hint}</p>
                  <textarea
                    name={section.key}
                    rows={6}
                    placeholder={section.hint}
                    defaultValue={report[section.key]}
                    className="input-control w-full"
                  />
                </div>
              </details>
            );
          })}
        </div>

        {/* Note */}
        <div className="surface px-5 py-4">
          <label className="mb-1 block text-xs font-semibold text-stone-600">
            {d.reportNote}
          </label>
          <textarea
            name="note"
            rows={3}
            defaultValue={report.note}
            className="input-control w-full"
          />
        </div>

        <div className="flex justify-end">
          <button type="submit" className="control-primary">
            {d.saveReport}
          </button>
        </div>
      </form>}

      {/* Preview */}
      {filledSections.length > 0 && (
        <details className="surface">
          <summary className="flex cursor-pointer select-none items-center gap-2 px-5 py-3 font-semibold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700">
            <span className="font-mono text-blue-600">▶</span>
            {d.preview}
          </summary>
          <div className="border-t border-stone-100 bg-white px-6 py-6 print:block">
            <h1 className="font-serif text-2xl font-bold text-stone-900">{report.title}</h1>
            {report.period && (
              <p className="mt-1 text-sm text-stone-500">{report.period}</p>
            )}
            <hr className="my-4 border-stone-200" />

            {filledSections.map((section) => {
              const content = report[section.key];
              if (!content) return null;
              return (
                <div key={section.key} className="mb-6">
                  <h2 className="font-serif text-lg font-semibold text-stone-800 mb-2">
                    {section.label}
                  </h2>
                  <div className="text-sm text-stone-700 whitespace-pre-wrap leading-relaxed">
                    {content}
                  </div>
                </div>
              );
            })}

            <hr className="my-4 border-stone-200" />
            <p className="text-xs text-stone-400">
              Звіт підготовлено: {formatDate(new Date())}
            </p>
          </div>
        </details>
      )}

      {/* Danger zone */}
      {canManage && (
        <div className="surface border border-rose-100 px-5 py-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-rose-500">
            Danger zone
          </p>
          <ReportDeleteForm
            locale={locale}
            projectId={projectId}
            reportId={report._id ?? ""}
            confirmMessage={d.confirmDelete}
            label={d.deleteReport}
            buttonClassName="control border-rose-200 text-rose-600 hover:border-rose-400 hover:bg-rose-50"
          />
        </div>
      )}
    </div>
  );
}
