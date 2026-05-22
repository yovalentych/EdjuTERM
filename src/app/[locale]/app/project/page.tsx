import {
  BookOpen,
  CalendarDays,
  ClipboardList,
  Database,
  FileSignature,
  FileText,
  FlaskConical,
  Globe,
  GraduationCap,
  LayoutDashboard,
  Microscope,
  BookMarked,
  Settings,
  SquareStack,
  Users,
  Wallet,
  Briefcase,
  NotebookPen,
} from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { WorkspaceShell, type NavGroup } from "@/components/workspace-shell";
import { OpenScienceForm } from "@/components/open-science/open-science-form";
import { OpenScienceList } from "@/components/open-science/open-science-list";
import { TeamChat } from "@/components/team/team-chat";
import { TeamMemberList } from "@/components/team/team-member-list";
import { ProjectOverviewDashboard } from "@/components/overview/project-overview-dashboard";
import { RecordsExplorer } from "@/components/records/records-explorer";
import { ManuscriptsExplorer } from "@/components/manuscripts/manuscripts-explorer";
import { GlobalSearch } from "@/components/global-search";
import { NotificationBell } from "@/components/notification-bell";
import { PrivateThemeToggle } from "@/components/private-theme-toggle";
import { getCurrentUser } from "@/lib/current-user";
import { getDictionary, isLocale } from "@/lib/i18n";
import { listOpenScienceUpdatesForProjects } from "@/lib/open-science";
import { canManageProject, getProjectForUser } from "@/lib/projects";
import { getDashboardData } from "@/lib/repositories";
import { listManuscripts } from "@/lib/manuscripts";
import { listTeamMessages } from "@/lib/team";
import { listPublications } from "@/lib/research-publications";
import { listSafeUsersByIds } from "@/lib/users";
import { readPrefs } from "@/lib/prefs";
import type { SafeUser } from "@/lib/schemas";

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
  const prefs = await readPrefs();
  const isUk = localeParam === "uk";
  const isDissertation = project.projectType === "dissertation";

  const validTabs = ["overview", "records", "openscience", "manuscripts", "team", "budget", "settings"];
  const activeTab = validTabs.includes(tab || "") ? tab : "overview";

  if (activeTab === "budget") {
    redirect(`/${localeParam}/app/budget?projectId=${project._id}`);
  }

  const [data, openScienceUpdates, teamMessages, members, publications, manuscripts] = await Promise.all([
    getDashboardData(localeParam, [project._id]),
    listOpenScienceUpdatesForProjects([project._id]),
    listTeamMessages([project._id]),
    listSafeUsersByIds([project.ownerId, project.supervisorId, ...project.memberIds]),
    listPublications(project._id),
    listManuscripts(project._id),
  ]);

  const navGroups: NavGroup[] = [
    {
      label: isUk ? "Огляд" : "Overview",
      items: [
        { id: "overview", label: dictionary.projects.tabOverview, icon: "square-stack", href: `/${localeParam}/app/project?projectId=${project._id}&tab=overview` },
      ],
    },
    {
      label: isUk ? "Доказова база" : "Evidence",
      items: [
        { id: "records", label: dictionary.projects.tabRecords, icon: "database", href: `/${localeParam}/app/project?projectId=${project._id}&tab=records` },
        { id: "experiments", label: dictionary.experiments.openExperiments, icon: "flask-conical", href: `/${localeParam}/app/experiments?projectId=${project._id}` },
        { id: "almanac", label: isUk ? "Альманах" : "Almanac", icon: "book-marked", href: `/${localeParam}/app/almanac?projectId=${project._id}` },
      ],
    },
    {
      label: isUk ? "Виконання" : "Execution",
      items: [
        { id: "research-plan", label: dictionary.researchPlan.openPlan, icon: "clipboard-list", href: `/${localeParam}/app/research-plan?projectId=${project._id}` },
        { id: "planning", label: dictionary.planning.openPlanning, icon: "calendar-days", href: `/${localeParam}/app/planning?projectId=${project._id}` },
        { id: "budget", label: dictionary.budget.openBudget, icon: "wallet", href: `/${localeParam}/app/budget?projectId=${project._id}` },
      ],
    },
    {
      label: isUk ? "Результати" : "Outputs",
      items: [
        { id: "openscience", label: dictionary.projects.tabOpenScience, icon: "globe", href: `/${localeParam}/app/project?projectId=${project._id}&tab=openscience` },
        { id: "manuscripts", label: isUk ? "Рукописи" : "Manuscripts", icon: "file-signature", href: `/${localeParam}/app/project?projectId=${project._id}&tab=manuscripts` },
        { id: "reports", label: dictionary.reports.openReports, icon: "file-text", href: `/${localeParam}/app/reports?projectId=${project._id}` },
      ],
    },
    {
      label: isUk ? "Команда та Навчання" : "Team & Education",
      items: [
        { id: "team", label: dictionary.projects.tabTeam, icon: "users", href: `/${localeParam}/app/project?projectId=${project._id}&tab=team` },
        { id: "learning", label: isUk ? "Журнал навчання" : "learning", icon: "book-open", href: `/${localeParam}/app/learning?projectId=${project._id}` },
        { id: "diary", label: isUk ? "Щоденник" : "Diary", icon: "notebook-pen", href: `/${localeParam}/app/diary?projectId=${project._id}` },
        ...(isDissertation ? [{ id: "phd-plan", label: isUk ? "Інд. план" : "PhD Plan", icon: "graduation-cap" as const, href: `/${localeParam}/app/phd-plan?projectId=${project._id}` }] : []),
      ],
    },
    {
      label: isUk ? "Керування" : "Settings",
      items: [
        { id: "settings", label: dictionary.projects.settings, icon: "settings", href: `/${localeParam}/app/project-settings?projectId=${project._id}` },
      ],
    },
  ];

  const usersById = new Map(members.filter((m): m is SafeUser & { _id: string } => Boolean(m._id)).map((m) => [m._id, m]));
  const isManager = canManageProject(project, user);
  const activeRecords = data.records.filter((r) => !r.archivedAt);
  const archivedRecords = data.records.filter((r) => !!r.archivedAt);
  const returnTo = `/${localeParam}/app/project?projectId=${project._id}&tab=${activeTab}`;

  return (
    <WorkspaceShell
      dictionary={dictionary}
      locale={localeParam}
      user={user}
      project={project}
      navGroups={navGroups}
      headerActions={
        <div key="header-actions-wrapper" className="flex items-center gap-1.5">
          <GlobalSearch key="global-search" locale={localeParam} />
          {prefs.notifications && <NotificationBell key="notification-bell" />}
          <PrivateThemeToggle key="theme-toggle" />
        </div>
      }
    >
      <div className="space-y-6">
        {activeTab === "overview" && (
          <ProjectOverviewDashboard
            project={project}
            records={data.records}
            members={members}
            teamMessages={teamMessages}
            openScienceCount={openScienceUpdates.filter(u => u.status === "published").length}
            locale={localeParam}
          />
        )}

        {activeTab === "records" && (
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
            projects={[project]}
            dictionary={dictionary}
          />
        )}

        {activeTab === "manuscripts" && (
          <ManuscriptsExplorer
            manuscripts={manuscripts}
            records={activeRecords}
            members={members}
            projectId={project._id ?? ""}
            user={user}
            dictionary={dictionary}
            locale={localeParam}
          />
        )}

        {activeTab === "openscience" && (
          <div className="grid gap-6">
            <div className="card-surface overflow-hidden">
              <details className="group">
                <summary className="flex cursor-pointer items-center gap-3 px-6 py-4 text-sm font-bold text-slate-800 transition hover:bg-emerald-50 hover:text-emerald-800">
                  <Globe className="h-5 w-5 text-emerald-600" />
                  {isUk ? "+ Новий публічний допис" : "+ New public post"}
                </summary>
                <div className="border-t border-slate-100 p-6">
                  <OpenScienceForm
                    dictionary={dictionary}
                    locale={localeParam}
                    projects={[project]}
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
          </div>
        )}

        {activeTab === "team" && (
          <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
            <TeamMemberList
              dictionary={dictionary}
              locale={localeParam}
              members={members.map(m => ({ user: m, projects: [{ project, role: project.ownerId === m._id ? "owner" : project.supervisorId === m._id ? "supervisor" : "member" }] }))}
              project={project}
              currentUserId={user._id ?? ""}
              isManager={isManager}
            />
            <TeamChat
              dictionary={dictionary}
              locale={localeParam}
              messages={teamMessages}
              projects={[project]}
              usersById={usersById}
              currentUserId={user._id ?? ""}
              returnTo={returnTo}
            />
          </div>
        )}
      </div>
    </WorkspaceShell>
  );
}
