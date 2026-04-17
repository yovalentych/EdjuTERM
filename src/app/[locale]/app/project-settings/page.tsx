import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ProjectMembersManager } from "@/components/projects/project-members-manager";
import { ProjectSettingsForm } from "@/components/projects/project-settings-form";
import { listAuditEvents } from "@/lib/audit";
import { getCurrentUser } from "@/lib/current-user";
import { getDictionary, isLocale } from "@/lib/i18n";
import { listProjectInvitations } from "@/lib/invitations";
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
  const [members, invitations, auditEvents] = await Promise.all([
    listSafeUsersByIds([
      project.ownerId,
      project.supervisorId,
      ...project.memberIds,
    ]),
    listProjectInvitations(project._id ?? ""),
    listAuditEvents({ projectId: project._id, limit: 50 }),
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
        invitations={invitations}
        locale={localeParam}
        members={members}
        project={project}
      />
      <section className="border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold text-stone-950">
          {dictionary.audit.title}
        </h2>
        <div className="mt-4 space-y-2">
          {auditEvents.length === 0 ? (
            <p className="border border-dashed border-stone-300 p-3 text-sm text-stone-500">
              {dictionary.audit.noEvents}
            </p>
          ) : (
            auditEvents.map((event) => (
              <article
                key={event._id ?? `${event.action}-${event.createdAt.toISOString()}`}
                className="grid gap-2 border border-stone-200 p-3 text-sm md:grid-cols-[1fr_1fr_auto]"
              >
                <p className="font-medium text-stone-950">{event.action}</p>
                <p className="text-stone-600">
                  {event.actorEmail ?? event.actorId}
                </p>
                <time className="text-stone-500">
                  {event.createdAt.toLocaleString(localeParam)}
                </time>
              </article>
            ))
          )}
        </div>
      </section>
    </AppShell>
  );
}
