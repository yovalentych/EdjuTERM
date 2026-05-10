import { UsersRound } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { TeamChat } from "@/components/team/team-chat";
import { TeamMemberList } from "@/components/team/team-member-list";
import { Breadcrumb, PageHeader } from "@/components/ui";
import { getCurrentUser } from "@/lib/current-user";
import { getDictionary, isLocale } from "@/lib/i18n";
import { listProjectsForUser } from "@/lib/projects";
import type { Project, SafeUser } from "@/lib/schemas";
import { listTeamMessages } from "@/lib/team";
import { listSafeUsersByIds } from "@/lib/users";

export default async function TeamPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;

  if (!isLocale(localeParam)) {
    notFound();
  }

  const user = await getCurrentUser();

  if (!user) {
    redirect(`/${localeParam}/login`);
  }

  const dictionary = getDictionary(localeParam);
  const projects = await listProjectsForUser(user);
  const projectIds = projects
    .map((project) => project._id)
    .filter((id): id is string => Boolean(id));
  const memberIds = collectMemberIds(projects);
  const [members, messages] = await Promise.all([
    listSafeUsersByIds(memberIds),
    listTeamMessages(projectIds),
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
    projects: getMemberProjects(member, projects),
  }));

  const isUk = localeParam === "uk";

  return (
    <AppShell dictionary={dictionary} locale={localeParam} user={user}>
      <PageHeader
        eyebrow={dictionary.shell.eyebrow}
        title={dictionary.team.title}
        description={dictionary.team.summary}
        breadcrumb={
          <Breadcrumb
            items={[
              { label: isUk ? "Кабінет" : "Dashboard", href: `/${localeParam}/app` },
              { label: dictionary.team.title },
            ]}
            homeHref={`/${localeParam}/app`}
          />
        }
        actions={
          <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">
            <UsersRound className="h-4 w-4 text-blue-600" />
            {projects.length} {dictionary.projects.project}
          </div>
        }
      />

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <TeamMemberList
          dictionary={dictionary}
          locale={localeParam}
          members={memberEntries}
          currentUserId={user._id ?? ""}
        />
        <TeamChat
          dictionary={dictionary}
          locale={localeParam}
          messages={messages}
          projects={projects}
          usersById={usersById}
          currentUserId={user._id ?? ""}
        />
      </section>
    </AppShell>
  );
}

function collectMemberIds(projects: Project[]) {
  return projects.flatMap((project) => [
    project.ownerId,
    project.supervisorId,
    ...project.memberIds,
  ]);
}

function getMemberProjects(member: SafeUser, projects: Project[]) {
  if (!member._id) {
    return [];
  }

  const memberId = member._id;

  return projects
    .map((project) => {
      if (project.ownerId === memberId) {
        return { project, role: "owner" as const };
      }

      if (project.supervisorId === memberId) {
        return { project, role: "supervisor" as const };
      }

      if (project.memberIds.includes(memberId)) {
        return { project, role: "member" as const };
      }

      return null;
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
}
