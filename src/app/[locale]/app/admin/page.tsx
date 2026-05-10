import {
  ClipboardList,
  Database,
  History,
  LayoutDashboard,
  Mail,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";
import { createAuditEvent, listAuditEvents } from "@/lib/audit";
import { AuditLog } from "@/components/audit/audit-log";
import { AppShell } from "@/components/app-shell";
import { Avatar, Breadcrumb, PageHeader } from "@/components/ui";
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

  if (!isLocale(localeParam)) notFound();

  const user = await getCurrentUser();
  if (!user) redirect(`/${localeParam}/login`);
  if (user.role !== "admin") redirect(`/${localeParam}/app`);

  const dictionary = getDictionary(localeParam);
  const isUk = localeParam === "uk";

  const [users, projects, invitations, records, openScienceUpdates, auditEvents] =
    await Promise.all([
      listAllSafeUsers(),
      listAllProjects(),
      listAllProjectInvitations(),
      listAllProjectRecords(100),
      listAllOpenScienceUpdates(100),
      listAuditEvents({ limit: 500 }),
    ]);

  await createAuditEvent({ action: "admin.viewed", actor: user });

  return (
    <AppShell dictionary={dictionary} locale={localeParam} user={user}>
      <PageHeader
        eyebrow={isUk ? "Система" : "System"}
        title={dictionary.admin.title}
        description={dictionary.admin.summary}
        breadcrumb={
          <Breadcrumb
            items={[
              { label: isUk ? "Кабінет" : "Dashboard", href: `/${localeParam}/app` },
              { label: dictionary.admin.title },
            ]}
            homeHref={`/${localeParam}/app`}
          />
        }
        actions={
          <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
            <ShieldCheck className="h-4 w-4" />
            Admin
          </div>
        }
      />

      {/* Stat row */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStat
          icon={<UsersRound className="h-5 w-5" />}
          label={dictionary.admin.totalUsers}
          value={users.length}
          iconClass="bg-label-primary"
        />
        <AdminStat
          icon={<Database className="h-5 w-5" />}
          label={dictionary.admin.totalProjects}
          value={projects.length}
          iconClass="bg-label-success"
        />
        <AdminStat
          icon={<Mail className="h-5 w-5" />}
          label={dictionary.admin.totalInvitations}
          value={invitations.length}
          iconClass="bg-label-warning"
        />
        <AdminStat
          icon={<History className="h-5 w-5" />}
          label={dictionary.admin.totalAuditEvents}
          value={auditEvents.length}
          iconClass="bg-label-muted"
        />
      </section>

      {/* Data panels */}
      <section className="grid gap-4 xl:grid-cols-2">
        <AdminPanel title={dictionary.admin.users} count={users.length}>
          {users.map((item) => (
            <AdminRow
              key={item._id}
              avatar={
                <Avatar
                  firstName={item.firstName}
                  lastName={item.lastName}
                  size="sm"
                />
              }
              title={`${item.firstName} ${item.lastName}`}
              meta={`${item.email} · ${dictionary.roles[item.role]}`}
            />
          ))}
        </AdminPanel>

        <AdminPanel title={dictionary.admin.projects} count={projects.length}>
          {projects.map((project) => (
            <AdminRow
              key={project._id}
              avatar={
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-xs font-bold text-blue-700">
                  {project.acronym?.[0] ?? "P"}
                </div>
              }
              title={project.title}
              meta={`${project.acronym} · ${project.status}`}
            />
          ))}
        </AdminPanel>

        <AdminPanel title={dictionary.admin.content} count={records.length + openScienceUpdates.length}>
          <AdminRow
            avatar={<div className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50"><Database className="h-4 w-4 text-blue-600" /></div>}
            title={dictionary.sections.evidenceMatrix}
            meta={`${records.length} ${isUk ? "записів" : "records"}`}
          />
          <AdminRow
            avatar={<div className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50"><LayoutDashboard className="h-4 w-4 text-emerald-600" /></div>}
            title={dictionary.openScience.manageTitle}
            meta={`${openScienceUpdates.length} ${isUk ? "оновлень" : "updates"}`}
          />
        </AdminPanel>

        <AdminPanel title={dictionary.admin.invitations} count={invitations.length}>
          {invitations.map((invitation) => (
            <AdminRow
              key={invitation._id ?? invitation.code}
              avatar={<div className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-200 bg-amber-50"><Mail className="h-4 w-4 text-amber-600" /></div>}
              title={invitation.email}
              meta={`${invitation.status} · ${invitation.code}`}
            />
          ))}
        </AdminPanel>
      </section>

      {/* Audit log */}
      <section className="surface overflow-hidden">
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700">
            <ClipboardList className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">{dictionary.admin.audit}</h2>
            <p className="text-xs text-slate-500">{isUk ? "Усі дії у системі" : "All system actions"}</p>
          </div>
        </div>
        <div className="p-5">
          <AuditLog events={auditEvents} />
        </div>
      </section>
    </AppShell>
  );
}

// ── Components ───────────────────────────────────────────────────────────────

function AdminStat({
  icon,
  label,
  value,
  iconClass,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  iconClass: string;
}) {
  return (
    <article className="metric-card flex items-center justify-between gap-3 p-5">
      <div className="min-w-0">
        <p className="truncate text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
        <p className="mt-1.5 text-3xl font-bold tabular-nums text-slate-900">{value}</p>
      </div>
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconClass}`}>
        {icon}
      </div>
    </article>
  );
}

function AdminPanel({
  children,
  title,
  count,
}: {
  children: ReactNode;
  title: string;
  count?: number;
}) {
  return (
    <section className="surface overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <h2 className="font-semibold text-slate-900">{title}</h2>
        {count !== undefined && (
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
            {count}
          </span>
        )}
      </div>
      <div className="divide-y divide-slate-50 p-2">{children}</div>
    </section>
  );
}

function AdminRow({
  avatar,
  meta,
  title,
}: {
  avatar?: ReactNode;
  meta: string;
  title: string;
}) {
  return (
    <article className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition hover:bg-slate-50">
      {avatar}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-900">{title}</p>
        <p className="truncate text-xs text-slate-500">{meta}</p>
      </div>
    </article>
  );
}
