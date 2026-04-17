import {
  ClipboardList,
  Database,
  History,
  Mail,
  UsersRound,
} from "lucide-react";
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";
import { createAuditEvent, listAuditEvents } from "@/lib/audit";
import { AppShell } from "@/components/app-shell";
import { getCurrentUser } from "@/lib/current-user";
import { getDictionary, isLocale } from "@/lib/i18n";
import { listAllProjectInvitations } from "@/lib/invitations";
import { listAllOpenScienceUpdates } from "@/lib/open-science";
import { listAllProjects } from "@/lib/projects";
import { listAllProjectRecords } from "@/lib/repositories";
import { listAllSafeUsers } from "@/lib/users";

export default async function AdminPage({
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

  if (user.role !== "admin") {
    redirect(`/${localeParam}/app`);
  }

  const dictionary = getDictionary(localeParam);
  const [users, projects, invitations, records, openScienceUpdates, auditEvents] =
    await Promise.all([
      listAllSafeUsers(),
      listAllProjects(),
      listAllProjectInvitations(),
      listAllProjectRecords(100),
      listAllOpenScienceUpdates(100),
      listAuditEvents({ limit: 100 }),
    ]);

  await createAuditEvent({ action: "admin.viewed", actor: user });

  return (
    <AppShell dictionary={dictionary} locale={localeParam} user={user}>
      <section className="border border-stone-200 bg-white p-5 shadow-sm">
        <h1 className="text-3xl font-semibold tracking-normal text-stone-950">
          {dictionary.admin.title}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">
          {dictionary.admin.summary}
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={<UsersRound className="h-5 w-5" />}
          label={dictionary.admin.totalUsers}
          value={users.length}
        />
        <MetricCard
          icon={<Database className="h-5 w-5" />}
          label={dictionary.admin.totalProjects}
          value={projects.length}
        />
        <MetricCard
          icon={<Mail className="h-5 w-5" />}
          label={dictionary.admin.totalInvitations}
          value={invitations.length}
        />
        <MetricCard
          icon={<History className="h-5 w-5" />}
          label={dictionary.admin.totalAuditEvents}
          value={auditEvents.length}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Panel title={dictionary.admin.users}>
          {users.map((item) => (
            <Row
              key={item._id}
              title={`${item.firstName} ${item.lastName}`}
              meta={`${item.email} · ${dictionary.roles[item.role]}`}
            />
          ))}
        </Panel>
        <Panel title={dictionary.admin.projects}>
          {projects.map((project) => (
            <Row
              key={project._id}
              title={project.title}
              meta={`${project.acronym} · ${project.status}`}
            />
          ))}
        </Panel>
        <Panel title={dictionary.admin.content}>
          <Row
            title={dictionary.sections.evidenceMatrix}
            meta={`${records.length}`}
          />
          <Row
            title={dictionary.openScience.manageTitle}
            meta={`${openScienceUpdates.length}`}
          />
        </Panel>
        <Panel title={dictionary.admin.invitations}>
          {invitations.map((invitation) => (
            <Row
              key={invitation._id ?? invitation.code}
              title={invitation.email}
              meta={`${invitation.status} · ${invitation.code}`}
            />
          ))}
        </Panel>
      </section>

      <section className="border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-emerald-700" />
          <h2 className="text-xl font-semibold text-stone-950">
            {dictionary.admin.audit}
          </h2>
        </div>
        <div className="mt-4 space-y-2">
          {auditEvents.length === 0 ? (
            <p className="border border-dashed border-stone-300 p-3 text-sm text-stone-500">
              {dictionary.audit.noEvents}
            </p>
          ) : (
            auditEvents.map((event) => (
              <Row
                key={event._id ?? `${event.action}-${event.createdAt.toISOString()}`}
                title={event.action}
                meta={`${event.actorEmail ?? event.actorId} · ${event.createdAt.toLocaleString(localeParam)}`}
              />
            ))
          )}
        </div>
      </section>
    </AppShell>
  );
}

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: number;
}) {
  return (
    <article className="border border-stone-200 bg-white p-5 shadow-sm">
      <div className="text-emerald-700">{icon}</div>
      <p className="mt-3 text-sm text-stone-500">{label}</p>
      <p className="mt-1 text-3xl font-semibold text-stone-950">{value}</p>
    </article>
  );
}

function Panel({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section className="border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-semibold text-stone-950">{title}</h2>
      <div className="mt-4 space-y-2">{children}</div>
    </section>
  );
}

function Row({ meta, title }: { meta: string; title: string }) {
  return (
    <article className="border border-stone-200 p-3">
      <p className="font-medium text-stone-950">{title}</p>
      <p className="mt-1 text-sm text-stone-500">{meta}</p>
    </article>
  );
}
