import Link from "next/link";
import type { Report, ResearchStage } from "@/lib/schemas";
import type { Dictionary } from "@/lib/i18n";
import {
  updateReportStatus,
} from "@/app/actions";
import { ReportDeleteForm } from "@/components/reports/report-delete-form";
import { ExportPanel } from "@/components/reports/export-panel";

// Type-color map
const typeColors: Record<Report["type"], string> = {
  intermediate: "#4f46e5", // indigo-600
  annual: "#7c3aed",       // violet-600
  final: "#d97706",        // amber-600
  financial: "#059669",    // emerald-600
  conference: "#2563eb",   // blue-600
  custom: "#78716c",       // stone-500
};

// Status badge colors
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

export function ReportCard({
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
  const d = dictionary.reports;
  const typeLabel = d.reportTypes[report.type] ?? report.type;
  const statusLabel = d.reportStatuses[report.status] ?? report.status;

  const linkedStages = stages.filter((s) =>
    report.linkedStageIds.includes(s._id ?? ""),
  );

  const previewText =
    (report.sectionResults || report.sectionGoals || "").slice(0, 120) || null;

  const editorHref = `/${locale}/app/reports?projectId=${projectId}&reportId=${report._id}&tab=editor`;
  const printHref = `/${locale}/app/reports/print?projectId=${projectId}&reportId=${report._id}`;

  return (
    <div
      className="surface overflow-hidden"
      style={{ borderLeftWidth: "3px", borderLeftColor: typeColors[report.type] }}
    >
      {/* Header */}
      <div className="px-5 py-4">
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

        <h3 className="mt-2 text-lg font-semibold leading-snug text-stone-950">
          {report.title}
        </h3>

        {/* Meta row */}
        <div className="mt-2 flex flex-wrap gap-4 text-xs text-stone-400">
          <span>
            {d.createdAt}: {formatDate(report.createdAt)}
          </span>
          <span>
            {d.updatedAt}: {formatDate(report.updatedAt)}
          </span>
          {linkedStages.length > 0 && (
            <span>
              {d.linkedStages}: {linkedStages.map((s) => `#${s.stageNumber}`).join(", ")}
            </span>
          )}
        </div>

        {/* Section preview */}
        {previewText && (
          <p className="mt-2 line-clamp-2 text-sm text-stone-500">{previewText}</p>
        )}
      </div>

      {/* Actions */}
      <div className="border-t border-slate-200 bg-slate-50/70 px-5 py-3 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={editorHref}
            className="control px-3 py-2 text-sm font-semibold"
          >
            {d.editReport}
          </Link>

          {canManage && (
            <form action={updateReportStatus} className="flex items-center gap-2">
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="projectId" value={projectId} />
              <input type="hidden" name="reportId" value={report._id ?? ""} />
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
          )}

          {canManage && (
            <ReportDeleteForm
              locale={locale}
              projectId={projectId}
              reportId={report._id ?? ""}
              confirmMessage={d.confirmDelete}
              label={d.deleteReport}
              className="ml-auto"
              buttonClassName="text-xs text-rose-500 hover:text-rose-700"
            />
          )}
        </div>

        <ExportPanel
          projectId={projectId}
          reportId={report._id ?? null}
          locale={locale}
          printHref={printHref}
        />
      </div>
    </div>
  );
}
