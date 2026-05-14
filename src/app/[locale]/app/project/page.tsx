import {
  BookOpen,
  Database,
  FileSignature,
  Globe,
  Settings,
  SquareStack,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { ProjectShell, type ProjectTab } from "@/components/project-shell";
import { OpenScienceForm } from "@/components/open-science/open-science-form";
import { OpenScienceList } from "@/components/open-science/open-science-list";
import { TeamChat } from "@/components/team/team-chat";
import { TeamMemberList } from "@/components/team/team-member-list";
import { DashboardLayout, DashboardSection } from "@/components/dashboard/dashboard-layout";
import {
  ProjectResearchHeader,
  ResearchChip,
  ResearchWorkspaceFrame,
  type ResearchTone,
} from "@/components/research-os";
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
import type { Project, SafeUser } from "@/lib/schemas";
import { listTeamMessages } from "@/lib/team";
import { listPublications } from "@/lib/research-publications";
import { listSafeUsersByIds } from "@/lib/users";

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
  if (activeTab === "budget") {
    redirect(`/${localeParam}/app/budget?projectId=${project._id}`);
  }

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
  const tabCounts: ProjectWorkspaceHeaderProps["counts"] = {
    manuscripts: manuscripts.length,
    members: members.length,
    openScience: publishedUpdates.length,
    records: activeRecords.length,
  };

  return (
    <ProjectShell dictionary={dictionary} locale={localeParam} user={user} project={project} activeTab={activeTab}>
      <DashboardLayout>
        <ResearchWorkspaceFrame>
          <ProjectWorkspaceHeader
            activeTab={activeTab}
            counts={tabCounts}
            dictionary={dictionary}
            locale={localeParam}
            project={project}
          />

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
        </ResearchWorkspaceFrame>
      </DashboardLayout>
    </ProjectShell>
  );
}

// ── Helper components ─────────────────────────────────────────────────────────

type ProjectWorkspaceHeaderProps = {
  activeTab: ProjectTab;
  counts: {
    manuscripts: number;
    members: number;
    openScience: number;
    records: number;
  };
  dictionary: Dictionary;
  locale: string;
  project: Project;
};

type ProjectWorkspaceTabInfo = {
  description: string;
  icon: LucideIcon;
  iconTone: ResearchTone;
  metric: string;
  metricTone: ResearchTone;
  title: string;
};

function ProjectWorkspaceHeader({
  activeTab,
  counts,
  dictionary,
  locale,
  project,
}: ProjectWorkspaceHeaderProps) {
  const isUk = locale === "uk";
  const tab = getProjectWorkspaceTab(activeTab, dictionary, isUk, counts);
  const Icon = tab.icon;

  return (
    <ProjectResearchHeader
      description={tab.description}
      dictionary={dictionary}
      icon={Icon}
      locale={locale}
      metrics={
        <>
          <ResearchChip tone={tab.metricTone}>{tab.metric}</ResearchChip>
        </>
      }
      project={project}
      tone={tab.iconTone}
      title={tab.title}
    />
  );
}

function getProjectWorkspaceTab(
  activeTab: ProjectTab,
  dictionary: Dictionary,
  isUk: boolean,
  counts: ProjectWorkspaceHeaderProps["counts"],
): ProjectWorkspaceTabInfo {
  const overview: ProjectWorkspaceTabInfo = {
    description: isUk
      ? "Короткий стан дослідження, активність і наступні пріоритети."
      : "Research status, recent activity, and next priorities.",
    icon: SquareStack,
    iconTone: "blue",
    metric: isUk ? "Огляд" : "Overview",
    metricTone: "blue",
    title: dictionary.projects.tabOverview,
  };
  const copy: Partial<Record<ProjectTab, ProjectWorkspaceTabInfo>> = {
    overview,
    records: {
      description: isUk
        ? "Дані, протоколи, файли та внутрішні матеріали проєкту."
        : "Project data, protocols, files, and internal materials.",
      icon: Database,
      iconTone: "cyan",
      metric: isUk ? `${counts.records} активних записів` : `${counts.records} active records`,
      metricTone: "blue",
      title: dictionary.projects.tabRecords,
    },
    openscience: {
      description: isUk
        ? "Публічні оновлення, матеріали для поширення та доступи за кодом."
        : "Public updates, shared materials, and code-based access.",
      icon: Globe,
      iconTone: "emerald",
      metric: isUk ? `${counts.openScience} публікацій` : `${counts.openScience} posts`,
      metricTone: "emerald",
      title: dictionary.projects.tabOpenScience,
    },
    manuscripts: {
      description: isUk
        ? "Чернетки, секції, автори та матеріали для наукових текстів."
        : "Drafts, sections, authors, and materials for scientific writing.",
      icon: FileSignature,
      iconTone: "violet",
      metric: isUk ? `${counts.manuscripts} рукописів` : `${counts.manuscripts} manuscripts`,
      metricTone: "violet",
      title: isUk ? "Рукописи" : "Manuscripts",
    },
    team: {
      description: isUk
        ? "Учасники, ролі, комунікація і відповідальність у проєкті."
        : "Members, roles, communication, and responsibilities.",
      icon: Users,
      iconTone: "orange",
      metric: isUk ? `${counts.members} учасників` : `${counts.members} members`,
      metricTone: "orange",
      title: dictionary.projects.tabTeam,
    },
    budget: {
      description: isUk
        ? "План витрат, закупівлі та фінансові записи дослідження."
        : "Costs, purchases, and financial records for the research.",
      icon: Wallet,
      iconTone: "amber",
      metric: isUk ? "Бюджет" : "Budget",
      metricTone: "amber",
      title: dictionary.budget.openBudget,
    },
    settings: {
      description: isUk
        ? "Параметри проєкту, доступи, політики даних і конфігурація."
        : "Project settings, access, data policies, and configuration.",
      icon: Settings,
      iconTone: "slate",
      metric: isUk ? "Налаштування" : "Settings",
      metricTone: "slate",
      title: dictionary.projects.settings,
    },
  };

  return copy[activeTab] ?? overview;
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
