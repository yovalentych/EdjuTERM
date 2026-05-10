import { Microscope } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { ProjectShell } from "@/components/project-shell";
import { EventsTab } from "@/components/events/events-tab";
import { Breadcrumb, PageHeader } from "@/components/ui";
import { getCurrentUser } from "@/lib/current-user";
import { getDictionary, isLocale } from "@/lib/i18n";
import { canManageProject, getProjectForUser } from "@/lib/projects";
import { listResearchEvents, listAllParticipationsForProject } from "@/lib/events";
import { listSafeUsersByIds } from "@/lib/users";

export default async function EventsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ projectId?: string }>;
}) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();

  const user = await getCurrentUser();
  if (!user) redirect(`/${localeParam}/login`);

  const { projectId } = await searchParams;
  if (!projectId) redirect(`/${localeParam}/app`);

  const project = await getProjectForUser(projectId, user);
  if (!project?._id) notFound();

  const dictionary = getDictionary(localeParam);
  const isManager = canManageProject(project, user);

  const [events, allParticipations, members] = await Promise.all([
    listResearchEvents(project._id),
    listAllParticipationsForProject(project._id),
    listSafeUsersByIds([project.ownerId, project.supervisorId, ...project.memberIds]),
  ]);

  const returnTo = `/${localeParam}/app/events?projectId=${project._id}`;

  return (
    <ProjectShell
      dictionary={dictionary}
      locale={localeParam}
      user={user}
      project={project}
      activeTab="events"
    >
      <PageHeader
        eyebrow={project.acronym}
        title={localeParam === "uk" ? "Наукові події" : "Research Events"}
        breadcrumb={
          <Breadcrumb
            items={[
              { label: project.acronym, href: `/${localeParam}/app/project?projectId=${project._id}` },
              { label: localeParam === "uk" ? "Наукові події" : "Research Events" },
            ]}
            homeHref={`/${localeParam}/app`}
          />
        }
        description={
          localeParam === "uk"
            ? "Конференції, воркшопи, симпозіуми та інші заходи. Відстежуйте участь команди, подання тез і дедлайни."
            : "Conferences, workshops, symposia and other events. Track team participation, abstract submissions and deadlines."
        }
        actions={
          <div className="flex items-center gap-2 rounded border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">
            <Microscope className="h-4 w-4" />
            {events.length} {localeParam === "uk" ? "подій" : "events"}
          </div>
        }
      />

      <EventsTab
        events={events}
        allParticipations={allParticipations}
        members={members}
        locale={localeParam}
        projectId={project._id}
        returnTo={returnTo}
        canManage={isManager}
      />
    </ProjectShell>
  );
}
