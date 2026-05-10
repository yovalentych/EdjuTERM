import {
  BadgeCheck,
  BookOpen,
  CalendarRange,
  Download,
  FileText,
  FlaskConical,
  GitBranch,
  ShieldCheck,
} from "lucide-react";
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";
import { ProjectShell, type ProjectTab } from "@/components/project-shell";
import { OpenScienceForm } from "@/components/open-science/open-science-form";
import { OpenScienceList } from "@/components/open-science/open-science-list";
import { TeamChat } from "@/components/team/team-chat";
import { TeamMemberList } from "@/components/team/team-member-list";
import { Breadcrumb, EmptyState, PageHeader } from "@/components/ui";
import { DashboardLayout, DashboardSection } from "@/components/dashboard/dashboard-layout";
import { FilePreviewButton, RecordFileUpload } from "@/components/file-viewer";
import { ArchiveRecordButton, DeleteRecordButton } from "@/components/record-actions";
import { LicenseBadge } from "@/components/license-badge";
import { ProjectOverviewDashboard } from "@/components/overview/project-overview-dashboard";
import { RecordsExplorer } from "@/components/records/records-explorer";
import { getCurrentUser } from "@/lib/current-user";
import {
  getDictionary,
  isLocale,
  type Dictionary,
} from "@/lib/i18n";
import { listOpenScienceUpdatesForProjects } from "@/lib/open-science";
import { canManageProject, getProjectForUser } from "@/lib/projects";
import { getDashboardData } from "@/lib/repositories";
import { listManuscripts } from "@/lib/manuscripts";
import { ManuscriptsExplorer } from "@/components/manuscripts/manuscripts-explorer";
import type { Project, ProjectRecord, SafeUser } from "@/lib/schemas";
import { listTeamMessages } from "@/lib/team";
import { listPublications } from "@/lib/research-publications";
import { listSafeUsersByIds } from "@/lib/users";

// ── Color maps ────────────────────────────────────────────────────────────────

const kindColors: Record<string, string> = {
  dataset: "border-blue-200 bg-blue-50 text-blue-800",
  protocol: "border-purple-200 bg-purple-50 text-purple-800",
  task: "border-amber-200 bg-amber-50 text-amber-800",
  output: "border-emerald-200 bg-emerald-50 text-emerald-800",
  sample: "border-sky-200 bg-sky-50 text-sky-800",
  risk: "border-rose-200 bg-rose-50 text-rose-800",
};

const accessColors: Record<string, string> = {
  internal: "border-stone-300 bg-stone-100 text-stone-600",
  open: "border-emerald-300 bg-emerald-50 text-emerald-700",
  embargoed: "border-amber-300 bg-amber-50 text-amber-700",
  restricted: "border-rose-300 bg-rose-50 text-rose-700",
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ProjectWorkspacePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ projectId?: string; tab?: string; error?: string }>;
}) {
  const { locale: localeParam } = await params;

  if (!isLocale(localeParam)) notFound();

  const user = await getCurrentUser();
  if (!user) redirect(`/${localeParam}/login`);

  const { projectId, tab, error } = await searchParams;
  if (!projectId) redirect(`/${localeParam}/app`);

  const project = await getProjectForUser(projectId, user);
  if (!project?._id) notFound();

  const dictionary = getDictionary(localeParam);
  const projects = [project];

  const validTabs: ProjectTab[] = ["overview", "records", "openscience", "manuscripts", "team", "budget", "settings"];
  const activeTab: ProjectTab = validTabs.includes(tab as ProjectTab)
    ? (tab as ProjectTab)
    : "overview";

  const baseUrl = `/${localeParam}/app/project?projectId=${project._id}`;
  const returnTo = `${baseUrl}&tab=${activeTab}`;

  const [data, openScienceUpdates, teamMessages, members, publications, manuscripts] = await Promise.all([
    getDashboardData(localeParam, [project._id]),
    listOpenScienceUpdatesForProjects([project._id]),
    listTeamMessages([project._id]),
    listSafeUsersByIds([
      project.ownerId,
      project.supervisorId,
      ...project.memberIds,
    ]),
    listPublications(project._id),
    listManuscripts(project._id),
  ]);

  const usersById = new Map(
    members
      .filter((m): m is SafeUser & { _id: string } => Boolean(m._id))
      .map((m) => [m._id, m]),
  );
  const memberEntries = members.map((member) => ({
    user: member,
    projects: getMemberProjects(member, project),
  }));

  const isManager = canManageProject(project, user);
  const d = dictionary;
  const publishedUpdates = openScienceUpdates.filter(
    (u) => u.status === "published",
  );
  const activeRecords = data.records.filter((r) => !r.archivedAt);
  const archivedRecords = data.records.filter((r) => !!r.archivedAt);

  return (
    <ProjectShell dictionary={dictionary} locale={localeParam} user={user} project={project} activeTab={activeTab}>
      <DashboardLayout>
        <div className="space-y-6">
          {/* ── Project Banner ──────────────────────────────────────────────── */}
          <DashboardSection className="page-hero overflow-hidden rounded-2xl shadow-sm">
            <div className="p-6 md:p-8">
              {/* Breadcrumb */}
              <Breadcrumb
                className="mb-5"
                items={[
                  { label: d.projects.current, href: `/${localeParam}/app` },
                  { label: project.acronym },
                ]}
                homeHref={`/${localeParam}/app`}
              />
              <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1 font-mono text-sm font-bold tracking-widest text-blue-700">
                      {project.acronym}
                    </span>
                    <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                      {d.statuses.active}
                    </span>
                  </div>
                  <h1 className="mt-4 text-3xl font-bold leading-tight text-slate-950 md:text-4xl">
                    {project.title}
                  </h1>
                  <p className="mt-4 max-w-3xl text-sm leading-7 text-stone-600">
                    {project.summary || d.projects.noDescription}
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2 md:flex-col md:items-end">
                  {/* Actions moved to sidebar */}
                </div>
              </div>

              {/* Metadata chips */}
              <div className="mt-8 flex flex-wrap gap-3 border-t border-slate-200/50 pt-6">
                <MetaChip
                  icon={<FlaskConical className="h-3.5 w-3.5" />}
                  label={d.projects.typeOptions[project.projectType]}
                />
                <MetaChip
                  icon={<BookOpen className="h-3.5 w-3.5" />}
                  label={d.projects.fieldOptions[project.researchField]}
                />
                {project.grantProgram && (
                  <MetaChip
                    icon={<BadgeCheck className="h-3.5 w-3.5" />}
                    label={project.grantProgram}
                    highlight
                  />
                )}
                <MetaChip
                  icon={<CalendarRange className="h-3.5 w-3.5" />}
                  label={
                    project.startDate && project.endDate
                      ? `${project.startDate} — ${project.endDate}`
                      : d.projects.noDateSet
                  }
                />
                <MetaChip
                  icon={<ShieldCheck className="h-3.5 w-3.5" />}
                  label={d.projects.ethicsOptions[project.ethicsReview]}
                />
                <div className="flex items-center gap-2 rounded-lg border border-slate-200/80 bg-slate-50/80 px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50">
                  <GitBranch className="h-3.5 w-3.5 text-slate-500" />
                  {d.hero.git}
                </div>
              </div>
            </div>
          </DashboardSection>

          {/* ── Tab: Overview ───────────────────────────────────────────────── */}
          {activeTab === "overview" && (
            <ProjectOverviewDashboard
              project={project}
              records={data.records}
              members={members}
              teamMessages={teamMessages}
              openScienceCount={publishedUpdates.length}
              locale={localeParam}
            />
          )}

          {/* ── Tab: Records & Data ─────────────────────────────────────────── */}
          {activeTab === "records" && (
            <DashboardSection>
              <RecordsExplorer
                records={activeRecords}
                archivedRecords={archivedRecords}
                publications={publications}
                openScienceUpdates={openScienceUpdates}
                members={members}
                locale={localeParam}
                returnTo={returnTo}
                initialError={error}
                currentUser={user}
                projects={projects}
                dictionary={dictionary}
              />
            </DashboardSection>
          )}

          {/* ── Tab: Manuscripts ───────────────────────────────────────────── */}
          {activeTab === "manuscripts" && (
            <DashboardSection>
              <ManuscriptsExplorer
                manuscripts={manuscripts}
                records={activeRecords}
                members={members}
                projectId={project._id ?? ""}
                user={user}
                dictionary={dictionary}
                locale={localeParam}
              />
            </DashboardSection>
          )}

          {/* ── Tab: Open Science ───────────────────────────────────────────── */}
          {activeTab === "openscience" && (
            <DashboardSection className="grid gap-6">
              {/* New post — collapsible */}
              <div className="surface overflow-hidden rounded-2xl bg-white/80 backdrop-blur-md">
                <details>
                  <summary className="flex cursor-pointer items-center gap-3 px-6 py-5 text-sm font-bold text-stone-800 transition hover:bg-emerald-50 hover:text-emerald-800">
                    <BookOpen className="h-5 w-5 text-emerald-600" />
                    + Новий допис / публікація відкритої науки
                  </summary>
                  <div className="border-t border-slate-100 px-6 pb-6 pt-5">
                    <p className="mb-4 text-xs font-medium text-stone-500">
                      {d.openScience.manageSummary}
                    </p>
                    <OpenScienceForm
                      dictionary={dictionary}
                      locale={localeParam}
                      projects={projects}
                      returnTo={returnTo}
                      records={activeRecords}
                    />
                  </div>
                </details>
              </div>

              <OpenScienceList
                updates={openScienceUpdates}
                dictionary={dictionary}
                members={members}
                records={activeRecords}
                locale={localeParam}
                returnTo={returnTo}
              />
            </DashboardSection>
          )}

          {/* ── Tab: Team ───────────────────────────────────────────────────── */}
          {activeTab === "team" && (
            <DashboardSection className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
              <TeamMemberList
                dictionary={dictionary}
                locale={localeParam}
                members={memberEntries}
                project={project}
                currentUserId={user._id ?? ""}
                isManager={isManager}
              />
              <TeamChat
                dictionary={dictionary}
                locale={localeParam}
                messages={teamMessages}
                projects={projects}
                usersById={usersById}
                currentUserId={user._id ?? ""}
                returnTo={returnTo}
              />
            </DashboardSection>
          )}
        </div>
      </DashboardLayout>
    </ProjectShell>
  );
}

// ── Helper components ─────────────────────────────────────────────────────────


function RepositoryStat({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="rounded border border-slate-200 bg-white p-3 shadow-sm">
      <div className="mx-auto flex h-8 w-8 items-center justify-center rounded bg-blue-50 text-blue-600">
        {icon}
      </div>
      <p className="mt-2 text-lg font-semibold text-stone-950">{value}</p>
      <p className="text-xs text-stone-500">{label}</p>
    </div>
  );
}

function RecordRepositoryCard({
  dictionary,
  locale,
  record,
  returnTo,
}: {
  dictionary: Dictionary;
  locale: string;
  record: ProjectRecord;
  returnTo: string;
}) {
  const isArchived = !!record.archivedAt;
  return (
    <article className={`rounded border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md
      ${isArchived ? "border-amber-200 bg-amber-50/30 opacity-75" : "border-slate-200 hover:border-blue-200"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`border px-2 py-0.5 text-xs font-medium ${kindColors[record.kind] ?? ""}`}>
              {dictionary.kinds[record.kind]}
            </span>
            <span className={`border px-2 py-0.5 text-xs ${accessColors[record.access] ?? ""}`}>
              {dictionary.access[record.access]}
            </span>
            {isArchived && (
              <span className="border border-amber-200 bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                Архів
              </span>
            )}
          </div>
          <p className="mt-3 font-mono text-xs text-stone-400">{record.localId}</p>
          <h3 className="mt-1 line-clamp-2 text-sm font-semibold text-stone-950">{record.title}</h3>
        </div>
        <FileText className="h-5 w-5 shrink-0 text-blue-600" />
      </div>
      <p className="mt-2 line-clamp-2 text-xs leading-5 text-stone-500">
        {record.summary || "Опис ще не додано."}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-stone-500">
        <span>{record.dataFormat || "mixed"}</span>
        <span>{record.version || "v1"}</span>
        <span>{record.owner}</span>
        <span>{formatRecordDate(record.createdAt)}</span>
      </div>
      {record.license && (
        <div className="mt-2">
          <LicenseBadge licenseId={record.license} />
        </div>
      )}
      <div className="mt-3">
        <FileList record={record} compact />
      </div>
      {record._id && (
        <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
          <ArchiveRecordButton
            recordId={record._id}
            locale={locale}
            returnTo={returnTo}
            isArchived={isArchived}
          />
          {isArchived && (
            <DeleteRecordButton
              recordId={record._id}
              recordTitle={record.title}
              locale={locale}
              returnTo={returnTo}
            />
          )}
        </div>
      )}
    </article>
  );
}

// Infer display + preview type from file name / MIME
function detectFileType(name: string, mime: string) {
  const n = name.toLowerCase();
  const ext = n.split(".").pop() ?? "";

  type PreviewType = "csv" | "excel" | "json" | "text";
  interface FT { ext: string; bg: string; color: string; previewType?: PreviewType }

  const map: Record<string, FT> = {
    csv:  { ext: "CSV",  bg: "bg-emerald-50",  color: "text-emerald-700", previewType: "csv" },
    tsv:  { ext: "TSV",  bg: "bg-emerald-50",  color: "text-emerald-700", previewType: "csv" },
    xlsx: { ext: "XLS",  bg: "bg-green-50",    color: "text-green-700",   previewType: "excel" },
    xls:  { ext: "XLS",  bg: "bg-green-50",    color: "text-green-700",   previewType: "excel" },
    xlsm: { ext: "XLSM", bg: "bg-green-50",    color: "text-green-700",   previewType: "excel" },
    ods:  { ext: "ODS",  bg: "bg-green-50",    color: "text-green-700",   previewType: "excel" },
    json: { ext: "JSON", bg: "bg-amber-50",    color: "text-amber-700",   previewType: "json" },
    jsonl:{ ext: "JSONL",bg: "bg-amber-50",    color: "text-amber-700",   previewType: "json" },
    geojson:{ ext: "GEO",bg: "bg-amber-50",   color: "text-amber-700",   previewType: "json" },
    txt:  { ext: "TXT",  bg: "bg-slate-100",   color: "text-slate-600",   previewType: "text" },
    md:   { ext: "MD",   bg: "bg-slate-100",   color: "text-slate-600",   previewType: "text" },
    r:    { ext: "R",    bg: "bg-blue-50",     color: "text-blue-700",    previewType: "text" },
    py:   { ext: "PY",   bg: "bg-blue-50",     color: "text-blue-700",    previewType: "text" },
    m:    { ext: "M",    bg: "bg-blue-50",     color: "text-blue-700",    previewType: "text" },
    log:  { ext: "LOG",  bg: "bg-slate-100",   color: "text-slate-600",   previewType: "text" },
    xml:  { ext: "XML",  bg: "bg-orange-50",   color: "text-orange-700",  previewType: "text" },
    yaml: { ext: "YAML", bg: "bg-orange-50",   color: "text-orange-700",  previewType: "text" },
    yml:  { ext: "YAML", bg: "bg-orange-50",   color: "text-orange-700",  previewType: "text" },
    pdf:  { ext: "PDF",  bg: "bg-rose-50",     color: "text-rose-700" },
    docx: { ext: "DOC",  bg: "bg-blue-50",     color: "text-blue-700" },
    doc:  { ext: "DOC",  bg: "bg-blue-50",     color: "text-blue-700" },
    zip:  { ext: "ZIP",  bg: "bg-slate-100",   color: "text-slate-600" },
    gz:   { ext: "GZ",   bg: "bg-slate-100",   color: "text-slate-600" },
    h5:   { ext: "HDF5", bg: "bg-violet-50",   color: "text-violet-700" },
    hdf5: { ext: "HDF5", bg: "bg-violet-50",   color: "text-violet-700" },
    mat:  { ext: "MAT",  bg: "bg-violet-50",   color: "text-violet-700" },
    nc:   { ext: "NetCDF",bg:"bg-violet-50",   color: "text-violet-700" },
    fasta:{ ext: "FASTA",bg: "bg-teal-50",    color: "text-teal-700" },
    fastq:{ ext: "FASTQ",bg: "bg-teal-50",    color: "text-teal-700" },
    vcf:  { ext: "VCF",  bg: "bg-teal-50",    color: "text-teal-700" },
    bam:  { ext: "BAM",  bg: "bg-teal-50",    color: "text-teal-700" },
    png:  { ext: "PNG",  bg: "bg-pink-50",     color: "text-pink-700" },
    jpg:  { ext: "JPG",  bg: "bg-pink-50",     color: "text-pink-700" },
    jpeg: { ext: "JPG",  bg: "bg-pink-50",     color: "text-pink-700" },
    tif:  { ext: "TIF",  bg: "bg-pink-50",     color: "text-pink-700" },
    tiff: { ext: "TIF",  bg: "bg-pink-50",     color: "text-pink-700" },
    svg:  { ext: "SVG",  bg: "bg-pink-50",     color: "text-pink-700" },
  };

  if (map[ext]) return map[ext];

  // MIME fallback
  if (mime === "text/csv" || mime === "application/csv") return map.csv;
  if (mime === "application/json") return map.json;
  if (mime.startsWith("image/")) return map.png;
  if (mime.startsWith("text/")) return { ext: ext.toUpperCase() || "TXT", bg: "bg-slate-100", color: "text-slate-600", previewType: "text" as PreviewType };

  const extUpper = ext.toUpperCase() || "FILE";
  return { ext: extUpper.slice(0, 4), bg: "bg-slate-100", color: "text-slate-500" };
}

function FileList({
  compact = false,
  record,
}: {
  compact?: boolean;
  record: ProjectRecord;
}) {
  if (record.rawDataFiles.length === 0) {
    return (
      <div className="space-y-2">
        <p className="border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-400">
          Файли ще не прикріплені.
        </p>
        {record._id && !compact && <RecordFileUpload recordId={record._id} />}
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {record.rawDataFiles.map((file, index) => {
        const ft = detectFileType(file.name, file.mimeType ?? "");
        return (
          <div key={`${file.storageUri}-${index}`}>
            {record._id ? (
              <div className="flex items-center gap-2">
                <a
                  href={`/api/records/${record._id}/files/${index}`}
                  className="flex min-w-0 flex-1 items-center gap-2.5 border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 transition hover:border-blue-200 hover:bg-blue-50"
                >
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded text-[10px] font-bold ${ft.bg} ${ft.color}`}>
                    {ft.ext}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-slate-800">{file.name}</span>
                    {!compact && (
                      <span className="text-slate-400">
                        {formatBytes(file.bytes ?? 0)}
                      </span>
                    )}
                  </span>
                  <Download className="ml-auto h-3.5 w-3.5 shrink-0 text-slate-400" />
                </a>
                {ft.previewType && !compact && (
                  <FilePreviewButton
                    recordId={record._id}
                    fileIndex={index}
                    fileName={file.name}
                    fileType={ft.previewType}
                    mimeType={file.mimeType}
                    storageUri={file.storageUri}
                  />
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded text-[10px] font-bold ${ft.bg} ${ft.color}`}>
                  {ft.ext}
                </span>
                <span className="truncate">{file.name}</span>
              </div>
            )}
          </div>
        );
      })}
      {record._id && !compact && <RecordFileUpload recordId={record._id} />}
    </div>
  );
}

function MetaChip({
  icon,
  label,
  highlight = false,
}: {
  icon: ReactNode;
  label: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium ${
        highlight
          ? "border-blue-200 bg-blue-50 text-blue-700"
          : "border-slate-200 bg-white/80 text-slate-600"
      }`}
    >
      <span className={highlight ? "text-blue-500" : "text-slate-400"}>
        {icon}
      </span>
      {label}
    </div>
  );
}

function RecordPanel({
  title,
  icon,
  records,
  dictionary,
  kindColor,
}: {
  title: string;
  icon: ReactNode;
  records: Awaited<ReturnType<typeof getDashboardData>>["records"];
  dictionary: Dictionary;
  kindColor: string;
}) {
  return (
    <div className="surface overflow-hidden">
      <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-3">
        <span className={`border px-1.5 py-0.5 ${kindColor}`}>{icon}</span>
        <h3 className="font-semibold text-stone-950">{title}</h3>
        <span className="ml-auto rounded bg-slate-100 px-2 py-0.5 font-mono text-sm font-semibold text-slate-500">
          {records.length}
        </span>
      </div>
      <div className="divide-y divide-stone-100">
        {records.length === 0 ? (
          <p className="px-5 py-4 text-sm text-stone-400">
            {dictionary.sections.noRecords}
          </p>
        ) : (
          records.map((record) => (
            <div key={record.localId} className="px-5 py-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-mono text-xs text-stone-400">
                    {record.localId}
                  </p>
                  <p className="mt-0.5 truncate text-sm font-medium text-stone-900">
                    {record.title}
                  </p>
                </div>
                <span
                  className={`shrink-0 border px-1.5 py-0.5 text-xs ${accessColors[record.access] ?? ""}`}
                >
                  {dictionary.access[record.access]}
                </span>
              </div>
              {record.summary && (
                <p className="mt-1 line-clamp-2 text-xs text-stone-400">
                  {record.summary}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function groupRecords(records: ProjectRecord[]) {
  const groups = new Map<string, ProjectRecord[]>();

  records.forEach((record) => {
    const groupName =
      record.group ||
      `${localStageName(record.stage)} · ${record.createdAt.getFullYear()}`;
    groups.set(groupName, [...(groups.get(groupName) ?? []), record]);
  });

  return Array.from(groups.entries())
    .map(([name, groupRecords]) => {
      const latest = groupRecords.reduce(
        (current, record) =>
          record.createdAt > current ? record.createdAt : current,
        groupRecords[0].createdAt,
      );
    const fileCount = groupRecords.reduce(
      (sum, record) => sum + record.rawDataFiles.length,
      0,
    );
    const bytes = groupRecords.reduce(
      (sum, record) =>
        sum +
        record.rawDataFiles.reduce(
          (fileSum, file) => fileSum + (file.bytes ?? 0),
          0,
        ),
      0,
    );

      return {
        bytes,
        fileCount,
        latest,
        name,
        records: groupRecords,
      };
    })
    .sort((left, right) => right.latest.getTime() - left.latest.getTime());
}

function localStageName(stage: string) {
  return stage || "Без етапу";
}

function formatRecordDate(value: Date) {
  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(value);
}

function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / 1024 ** index;
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

function getMemberProjects(member: SafeUser, project: Project) {
  if (!member._id) return [];
  if (project.ownerId === member._id)
    return [{ project, role: "owner" as const }];
  if (project.supervisorId === member._id)
    return [{ project, role: "supervisor" as const }];
  if (project.memberIds.includes(member._id))
    return [{ project, role: "member" as const }];
  return [];
}
