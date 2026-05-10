import { FileText, PencilLine } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { ProjectShell } from "@/components/project-shell";
import { ReportCard } from "@/components/reports/report-card";
import { ReportEditor } from "@/components/reports/report-editor";
import { Breadcrumb, Card, EmptyState, PageHeader, Tabs, type TabItem } from "@/components/ui";
import { listReports, getReport } from "@/lib/reports";
import { listResearchStages } from "@/lib/research-plan";
import { getCurrentUser } from "@/lib/current-user";
import { getDictionary, isLocale } from "@/lib/i18n";
import { canManageProject, getProjectForUser } from "@/lib/projects";
import { createReport } from "@/app/actions";

type Tab = "list" | "editor";
const validTabs: Tab[] = ["list", "editor"];

export default async function ReportsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    projectId?: string;
    tab?: string;
    reportId?: string;
    saved?: string;
    error?: string;
  }>;
}) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();

  const user = await getCurrentUser();
  if (!user) redirect(`/${localeParam}/login`);

  const { projectId, tab, reportId, saved, error } = await searchParams;
  if (!projectId) redirect(`/${localeParam}/app`);

  const project = await getProjectForUser(projectId, user);
  if (!project?._id) notFound();

  const dictionary = getDictionary(localeParam);
  const d = dictionary.reports;

  const isManager = canManageProject(project, user);

  // Determine active tab
  let activeTab: Tab = validTabs.includes(tab as Tab) ? (tab as Tab) : "list";
  if (reportId && activeTab !== "editor") activeTab = "editor";

  const baseUrl = `/${localeParam}/app/reports?projectId=${project._id}`;

  // Load data
  const [reports, stages] = await Promise.all([
    listReports(project._id),
    listResearchStages(project._id),
  ]);

  // Load specific report for editor tab
  let currentReport = null;
  if (activeTab === "editor" && reportId) {
    currentReport = await getReport(reportId, project._id);
    if (!currentReport) {
      redirect(baseUrl);
    }
  }

  // Summary stats
  const totalReports = reports.length;
  const draftCount = reports.filter((r) => r.status === "draft").length;
  const submittedCount = reports.filter((r) => r.status === "submitted").length;
  const approvedCount = reports.filter((r) => r.status === "approved").length;

  return (
    <ProjectShell
      dictionary={dictionary}
      locale={localeParam}
      user={user}
      project={project}
      activeTab="reports"
    >
      <PageHeader
        eyebrow={project.acronym}
        title={d.title}
        breadcrumb={
          <Breadcrumb
            items={[
              { label: project.acronym, href: `/${localeParam}/app/project?projectId=${project._id}` },
              { label: d.title },
            ]}
            homeHref={`/${localeParam}/app`}
          />
        }
        description={d.subtitle}
        stats={
          <div className="flex flex-wrap gap-3">
            <div className="rounded border border-slate-200 bg-white px-4 py-2.5 text-center shadow-sm">
              <p className="text-2xl font-bold text-stone-900">{totalReports}</p>
              <p className="text-xs text-stone-500">{d.totalReports}</p>
            </div>
            <div className="rounded border border-amber-200 bg-amber-50 px-4 py-2.5 text-center shadow-sm">
              <p className="text-2xl font-bold text-amber-700">{draftCount}</p>
              <p className="text-xs text-amber-600">{d.draftReports}</p>
            </div>
            <div className="rounded border border-blue-200 bg-blue-50 px-4 py-2.5 text-center shadow-sm">
              <p className="text-2xl font-bold text-blue-700">{submittedCount}</p>
              <p className="text-xs text-blue-600">{d.submittedReports}</p>
            </div>
            <div className="rounded border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-center shadow-sm">
              <p className="text-2xl font-bold text-emerald-700">{approvedCount}</p>
              <p className="text-xs text-emerald-600">{d.approvedReports}</p>
            </div>
          </div>
        }
      />

      {/* Status messages */}
      {saved === "autofill" && (
        <p className="status-note border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
          ⚡ {localeParam === "uk" ? "Розділи заповнено автоматично з бази даних." : "Sections auto-filled from database."}
        </p>
      )}
      {saved === "report" && (
        <p className="status-note border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm text-indigo-700">
          {d.reportSaved}
        </p>
      )}
      {saved === "updated" && (
        <p className="status-note border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm text-indigo-700">
          {d.reportUpdated}
        </p>
      )}
      {saved === "status" && (
        <p className="status-note border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm text-indigo-700">
          {d.statusUpdated}
        </p>
      )}
      {saved === "deleted" && (
        <p className="status-note border border-stone-200 bg-stone-50 px-4 py-2 text-sm text-stone-600">
          {d.reportDeleted}
        </p>
      )}
      {error === "invalid" && (
        <p className="status-note border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
          {d.invalidError}
        </p>
      )}
      {error === "forbidden" && (
        <p className="status-note border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
          {d.forbiddenError}
        </p>
      )}

      <Tabs
        activeId={activeTab}
        items={
          [
            {
              id: "list",
              label: d.openReports,
              href: `${baseUrl}&tab=list`,
              icon: <FileText className="h-4 w-4" />,
              badge: reports.length || undefined,
            },
            ...(activeTab === "editor" && currentReport
              ? [
                  {
                    id: "editor" as const,
                    label: d.editReport,
                    href: `${baseUrl}&tab=editor&reportId=${currentReport._id}`,
                    icon: <PencilLine className="h-4 w-4" />,
                  },
                ]
              : []),
          ] satisfies TabItem<Tab>[]
        }
      />

      {/* ── List tab ────────────────────────────────────────────────────── */}
      {activeTab === "list" && (
        <div className="space-y-5">
          {/* Create report form */}
          <details className="surface group overflow-hidden">
            <summary className="flex cursor-pointer select-none items-center gap-2 px-5 py-4 font-semibold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700">
              <span className="font-mono text-blue-600 transition-transform group-open:rotate-45">
                +
              </span>
              {d.addReport}
            </summary>
            <div className="border-t border-slate-200 bg-slate-50/50 px-5 pb-6 pt-4">
              <form action={createReport} className="space-y-4">
                <input type="hidden" name="locale" value={localeParam} />
                <input type="hidden" name="projectId" value={project._id} />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-semibold text-stone-600">
                      {d.reportTitle} *
                    </label>
                    <input
                      type="text"
                      name="title"
                      required
                      placeholder={d.reportTitlePlaceholder}
                      className="input-control w-full"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-stone-600">
                      {d.reportType}
                    </label>
                    <select name="type" className="input-control w-full">
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
                      placeholder={d.reportPeriodPlaceholder}
                      className="input-control w-full"
                    />
                  </div>
                </div>

                {stages.length > 0 && (
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-stone-600">
                      {d.linkedStages}
                    </label>
                    <div className="flex flex-wrap gap-3">
                      {stages.map((stage) => (
                        <label
                          key={stage._id}
                          className="flex items-center gap-1.5 text-sm text-stone-700"
                        >
                          <input
                            type="checkbox"
                            name="linkedStageIds"
                            value={stage._id ?? ""}
                            className="accent-indigo-600"
                          />
                          #{stage.stageNumber} {stage.title.slice(0, 40)}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-xs font-semibold text-stone-600">
                    {d.reportNote}
                  </label>
                  <textarea
                    name="note"
                    rows={2}
                    className="input-control w-full"
                  />
                </div>

                <div className="flex justify-end">
                  <button type="submit" className="control-primary">
                    {d.saveReport}
                  </button>
                </div>
              </form>
            </div>
          </details>

          {/* Report list */}
          {reports.length === 0 ? (
            <Card>
              <EmptyState
                icon={<FileText className="h-5 w-5" />}
                title={d.noReports}
                description="Створіть перший звіт, щоб вести проміжні, фінансові та підсумкові матеріали в одному місці."
              />
            </Card>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <ReportCard
                  key={report._id}
                  report={report}
                  stages={stages}
                  dictionary={dictionary}
                  locale={localeParam}
                  projectId={project._id ?? ""}
                  canManage={isManager}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Editor tab ──────────────────────────────────────────────────── */}
      {activeTab === "editor" && currentReport && (
        <ReportEditor
          report={currentReport}
          stages={stages}
          dictionary={dictionary}
          locale={localeParam}
          projectId={project._id ?? ""}
          canManage={isManager}
        />
      )}
    </ProjectShell>
  );
}
