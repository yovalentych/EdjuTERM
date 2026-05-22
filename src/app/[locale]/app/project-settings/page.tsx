import { ClipboardList } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { ProjectShell } from "@/components/project-shell";
import { ProjectMembersManager } from "@/components/projects/project-members-manager";
import { ProjectSettingsForm } from "@/components/projects/project-settings-form";
import { ProjectDangerZone } from "@/components/projects/project-danger-zone";
import { AuditLog } from "@/components/audit/audit-log";
import { Breadcrumb, PageHeader } from "@/components/ui";
import { listAuditEvents } from "@/lib/audit";
import { getCurrentUser } from "@/lib/current-user";
import { getDictionary, isLocale } from "@/lib/i18n";
import { listProjectInvitations } from "@/lib/invitations";
import { canManageProject, getProjectForUser, listLaboratories } from "@/lib/projects";
import { listSafeUsersByIds } from "@/lib/users";

export default async function ProjectSettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string; projectId?: string; saved?: string; wrong_confirmation?: string }>;
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
  const [members, invitations, auditEvents, laboratories] = await Promise.all([
    listSafeUsersByIds([
      project.ownerId,
      project.supervisorId,
      ...project.memberIds,
    ]),
    listProjectInvitations(project._id ?? ""),
    listAuditEvents({ projectId: project._id, limit: 500 }),
    listLaboratories(),
  ]);

  return (
    <ProjectShell dictionary={dictionary} locale={localeParam} user={user} project={project} activeTab="settings">
      <PageHeader
        eyebrow={project.acronym}
        title={dictionary.projects.settingsTitle}
        description={project.title}
        breadcrumb={
          <Breadcrumb
            items={[
              { label: project.acronym, href: `/${localeParam}/app/project?projectId=${project._id}` },
              { label: dictionary.projects.settingsTitle },
            ]}
            homeHref={`/${localeParam}/app`}
          />
        }
      />

      {saved && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {dictionary.projects.saved}
        </p>
      )}
      {error === "wrong_confirmation" && (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          {dictionary.projects.hardDeleteConfirmMismatch}
        </p>
      )}
      {error && error !== "wrong_confirmation" && (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          {error === "user"
            ? dictionary.projects.memberNotFound
            : dictionary.projects.settingsForbidden}
        </p>
      )}

      <ProjectSettingsForm
        dictionary={dictionary}
        locale={localeParam}
        project={project}
        availableLabs={laboratories}
      />
      <ProjectMembersManager
        dictionary={dictionary}
        invitations={invitations}
        locale={localeParam}
        members={members}
        project={project}
      />

      <ProjectDangerZone
        project={project}
        locale={localeParam}
        dictionary={dictionary}
      />

      <section className="surface overflow-hidden">
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-600">
            <ClipboardList className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">{dictionary.audit.title}</h2>
            <p className="text-xs text-slate-500">
              {localeParam === "uk" ? "Усі дії учасників проєкту" : "All project member actions"}
            </p>
          </div>
        </div>
        <div className="p-5">
          <AuditLog events={auditEvents} />
        </div>
      </section>
    </ProjectShell>
  );
}
