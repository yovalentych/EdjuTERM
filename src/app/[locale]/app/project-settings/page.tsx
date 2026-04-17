import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ProjectMembersManager } from "@/components/projects/project-members-manager";
import { ProjectSettingsForm } from "@/components/projects/project-settings-form";
import { getCurrentUser } from "@/lib/current-user";
import { getDictionary, isLocale } from "@/lib/i18n";
import { canManageProject, getProjectForUser } from "@/lib/projects";
import { listSafeUsersByIds } from "@/lib/users";

export default async function ProjectSettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string; projectId?: string; saved?: string }>;
}) {
  const { locale: localeParam } = await params;

  if (!isLocale(localeParam)) {
    notFound();
  }

  const user = await getCurrentUser();

  if (!user) {
    redirect(`/${localeParam}/login`);
  }

  const { error, projectId, saved } = await searchParams;

  if (!projectId) {
    redirect(`/${localeParam}/app`);
  }

  const project = await getProjectForUser(projectId, user);

  if (!project) {
    notFound();
  }

  if (!canManageProject(project, user)) {
    redirect(`/${localeParam}/app`);
  }

  const dictionary = getDictionary(localeParam);
  const members = await listSafeUsersByIds([
    project.ownerId,
    project.supervisorId,
    ...project.memberIds,
  ]);

  return (
    <AppShell dictionary={dictionary} locale={localeParam} user={user}>
      <section className="border border-stone-200 bg-white p-5 shadow-sm">
        <p className="font-mono text-xs text-stone-500">{project.acronym}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal text-stone-950">
          {dictionary.projects.settingsTitle}
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
          {project.title}
        </p>
        {saved ? (
          <p className="mt-3 border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
            {dictionary.projects.saved}
          </p>
        ) : null}
        {error ? (
          <p className="mt-3 border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
            {error === "user"
              ? dictionary.projects.memberNotFound
              : dictionary.projects.settingsForbidden}
          </p>
        ) : null}
      </section>
      <ProjectSettingsForm
        dictionary={dictionary}
        locale={localeParam}
        project={project}
      />
      <ProjectMembersManager
        dictionary={dictionary}
        locale={localeParam}
        members={members}
        project={project}
      />
    </AppShell>
  );
}
