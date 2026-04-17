import {
  Activity,
  Archive,
  BadgeCheck,
  Database,
  FileCheck2,
  FlaskConical,
  GitBranch,
  MessageSquareText,
} from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { OpenScienceForm } from "@/components/open-science/open-science-form";
import { OpenScienceList } from "@/components/open-science/open-science-list";
import { RecordForm } from "@/components/record-form";
import { TeamMemberList } from "@/components/team/team-member-list";
import { TeamMessageList } from "@/components/team/team-message-list";
import { getCurrentUser } from "@/lib/current-user";
import {
  getDictionary,
  isLocale,
  localizeStageLabel,
  type Dictionary,
} from "@/lib/i18n";
import { listOpenScienceUpdatesForProjects } from "@/lib/open-science";
import { getProjectForUser } from "@/lib/projects";
import { getDashboardData } from "@/lib/repositories";
import type { Project, SafeUser } from "@/lib/schemas";
import { listTeamMessages } from "@/lib/team";
import { listSafeUsersByIds } from "@/lib/users";

export default async function ProjectWorkspacePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ projectId?: string }>;
}) {
  const { locale: localeParam } = await params;

  if (!isLocale(localeParam)) {
    notFound();
  }

  const user = await getCurrentUser();

  if (!user) {
    redirect(`/${localeParam}/login`);
  }

  const { projectId } = await searchParams;

  if (!projectId) {
    redirect(`/${localeParam}/app`);
  }

  const project = await getProjectForUser(projectId, user);

  if (!project?._id) {
    notFound();
  }

  const dictionary = getDictionary(localeParam);
  const projects = [project];
  const data = await getDashboardData(localeParam, [project._id]);
  const [openScienceUpdates, teamMessages, members] = await Promise.all([
    listOpenScienceUpdatesForProjects([project._id]),
    listTeamMessages([project._id]),
    listSafeUsersByIds([project.ownerId, project.supervisorId, ...project.memberIds]),
  ]);
  const usersById = new Map(
    members
      .filter((member): member is SafeUser & { _id: string } =>
        Boolean(member._id),
      )
      .map((member) => [member._id, member]),
  );
  const memberEntries = members.map((member) => ({
    user: member,
    projects: getMemberProjects(member, project),
  }));
  const returnTo = `/${localeParam}/app/project?projectId=${project._id}`;

  return (
    <AppShell dictionary={dictionary} locale={localeParam} user={user}>
      <section className="border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="font-mono text-xs text-stone-500">
              {project.acronym}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal text-stone-950">
              {project.title}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">
              {project.summary}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/${localeParam}/app`}
              className="border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-stone-800 transition hover:border-emerald-700 hover:text-emerald-800"
            >
              {dictionary.nav.dashboard}
            </Link>
            <Link
              href={`/${localeParam}/app/project-settings?projectId=${project._id}`}
              className="bg-stone-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-stone-800"
            >
              {dictionary.projects.settings}
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
        <div className="border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-700">
                {dictionary.nav.projectWorkspace}
              </p>
              <h2 className="mt-2 max-w-3xl text-2xl font-semibold tracking-normal text-stone-950">
                {dictionary.hero.title}
              </h2>
            </div>
            <div className="flex items-center gap-2 border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-700">
              <GitBranch className="h-4 w-4 text-emerald-700" />
              {dictionary.hero.git}
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {data.metrics.map((metric) => (
              <div
                key={metric.label}
                className="border border-stone-200 bg-stone-50 p-4"
              >
                <p className="text-sm text-stone-500">{metric.label}</p>
                <p className="mt-2 text-3xl font-semibold text-stone-950">
                  {metric.value}
                </p>
                <p className="mt-1 text-sm text-stone-600">{metric.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-stone-950">
              {dictionary.sections.newRecord}
            </h2>
            <Database className="h-5 w-5 text-emerald-700" />
          </div>
          <RecordForm
            dictionary={dictionary}
            locale={localeParam}
            projects={projects}
            returnTo={returnTo}
          />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <RecordPanel
          dictionary={dictionary}
          title={dictionary.sections.datasets}
          icon={<Archive className="h-5 w-5" />}
          records={data.records.filter((record) => record.kind === "dataset")}
        />
        <RecordPanel
          dictionary={dictionary}
          title={dictionary.sections.protocols}
          icon={<FileCheck2 className="h-5 w-5" />}
          records={data.records.filter((record) => record.kind === "protocol")}
        />
        <RecordPanel
          dictionary={dictionary}
          title={dictionary.sections.teamWork}
          icon={<Activity className="h-5 w-5" />}
          records={data.records.filter((record) => record.kind === "task")}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-stone-950">
            {dictionary.openScience.manageTitle}
          </h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            {dictionary.openScience.manageSummary}
          </p>
          <div className="mt-5">
            <OpenScienceForm
              dictionary={dictionary}
              locale={localeParam}
              projects={projects}
              returnTo={returnTo}
            />
          </div>
        </div>
        <OpenScienceList updates={openScienceUpdates} dictionary={dictionary} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <TeamMemberList
          dictionary={dictionary}
          locale={localeParam}
          members={memberEntries}
        />
        <div>
          <div className="mb-4 flex items-center gap-2 text-sm font-medium text-stone-600">
            <MessageSquareText className="h-4 w-4 text-emerald-700" />
            {dictionary.team.chat}
          </div>
          <TeamMessageList
            dictionary={dictionary}
            locale={localeParam}
            messages={teamMessages}
            projects={projects}
            usersById={usersById}
            returnTo={returnTo}
          />
        </div>
      </section>

      <section className="border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-stone-950">
              {dictionary.sections.evidenceMatrix}
            </h2>
            <p className="text-sm text-stone-600">
              {dictionary.sections.evidenceSubtitle}
            </p>
          </div>
          <BadgeCheck className="h-5 w-5 text-emerald-700" />
        </div>
        <div className="mt-5 overflow-hidden border border-stone-200">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-stone-100 text-stone-600">
              <tr>
                <th className="px-3 py-3 font-medium">
                  {dictionary.table.id}
                </th>
                <th className="px-3 py-3 font-medium">
                  {dictionary.table.title}
                </th>
                <th className="px-3 py-3 font-medium">
                  {dictionary.table.kind}
                </th>
                <th className="px-3 py-3 font-medium">
                  {dictionary.table.stage}
                </th>
                <th className="px-3 py-3 font-medium">
                  {dictionary.table.access}
                </th>
                <th className="px-3 py-3 font-medium">
                  {dictionary.table.owner}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {data.records.map((record) => (
                <tr key={record.localId} className="bg-white">
                  <td className="px-3 py-3 font-mono text-xs text-stone-600">
                    {record.localId}
                  </td>
                  <td className="px-3 py-3 font-medium text-stone-900">
                    {record.title}
                  </td>
                  <td className="px-3 py-3 text-stone-600">
                    {dictionary.kinds[record.kind]}
                  </td>
                  <td className="px-3 py-3 text-stone-600">
                    {localizeStageLabel(record.stage, dictionary)}
                  </td>
                  <td className="px-3 py-3 text-stone-600">
                    {dictionary.access[record.access]}
                  </td>
                  <td className="px-3 py-3 text-stone-600">{record.owner}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}

function RecordPanel({
  title,
  icon,
  records,
  dictionary,
}: {
  title: string;
  icon: ReactNode;
  records: Awaited<ReturnType<typeof getDashboardData>>["records"];
  dictionary: Dictionary;
}) {
  return (
    <section className="border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-stone-950">{title}</h2>
        <div className="text-emerald-700">{icon}</div>
      </div>
      <div className="mt-5 space-y-3">
        {records.length === 0 ? (
          <div className="border border-dashed border-stone-300 p-4 text-sm text-stone-500">
            {dictionary.sections.noRecords}
          </div>
        ) : (
          records.map((record) => (
            <article key={record.localId} className="border border-stone-200 p-4">
              <div className="flex items-start gap-3">
                <FlaskConical className="mt-1 h-4 w-4 shrink-0 text-emerald-700" />
                <div>
                  <p className="font-mono text-xs text-stone-500">
                    {record.localId}
                  </p>
                  <h3 className="mt-1 font-semibold text-stone-950">
                    {record.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-stone-600">
                    {record.summary}
                  </p>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

function getMemberProjects(member: SafeUser, project: Project) {
  if (!member._id) {
    return [];
  }

  if (project.ownerId === member._id) {
    return [{ project, role: "owner" as const }];
  }

  if (project.supervisorId === member._id) {
    return [{ project, role: "supervisor" as const }];
  }

  if (project.memberIds.includes(member._id)) {
    return [{ project, role: "member" as const }];
  }

  return [];
}
