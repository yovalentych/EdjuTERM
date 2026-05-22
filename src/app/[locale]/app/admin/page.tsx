import {
  Building2,
  CheckCircle2,
  ClipboardList,
  Database,
  History,
  LayoutDashboard,
  Mail,
  ShieldCheck,
  UsersRound,
  BookOpen,
  UserRound,
  Settings,
  XCircle,
} from "lucide-react";
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";
import { createAuditEvent, listAuditEvents } from "@/lib/audit";
import { AuditLog } from "@/components/audit/audit-log";
import { WorkspaceShell, type NavGroup } from "@/components/workspace-shell";
import { Avatar } from "@/components/ui";
import { GlobalSearch } from "@/components/global-search";
import { NotificationBell } from "@/components/notification-bell";
import { PrivateThemeToggle } from "@/components/private-theme-toggle";
import { getCurrentUser } from "@/lib/current-user";
import { getDictionary, isLocale } from "@/lib/i18n";
import { listAllProjectInvitations } from "@/lib/invitations";
import { listAllOpenScienceUpdates } from "@/lib/open-science";
import { listAllProjects } from "@/lib/projects";
import { listAllProjectRecords } from "@/lib/repositories";
import { listAllSafeUsers } from "@/lib/users";
import { listAllInstitutions } from "@/lib/institutions-db";
import { InstitutionVerifyActions } from "@/components/admin/institution-verify-actions";
import { readPrefs } from "@/lib/prefs";
import { AiSettingsForm } from "@/components/admin/ai-settings-form";
import { getAiSystemSettings } from "@/lib/system-settings";

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
  const prefs = await readPrefs();
  const isUk = localeParam === "uk";

  const [users, projects, invitations, records, openScienceUpdates, auditEvents, institutions, aiSettings] =
    await Promise.all([
      listAllSafeUsers(),
      listAllProjects(),
      listAllProjectInvitations(),
      listAllProjectRecords(100),
      listAllOpenScienceUpdates(100),
      listAuditEvents({ limit: 500 }),
      listAllInstitutions(),
      getAiSystemSettings(),
    ]);

  const pendingInstitutions = institutions.filter((i) => !i.isVerified);

  await createAuditEvent({ action: "admin.viewed", actor: user });

  const navGroups: NavGroup[] = [
    {
      label: isUk ? "Навігація" : "Navigation",
      items: [
        { id: "dashboard", label: dictionary.nav.dashboard, icon: "layout-dashboard", href: `/${localeParam}/app` },
        { id: "library", label: isUk ? "Довідка" : "Library", icon: "book-open", href: `/${localeParam}/app/library` },
      ],
    },
    {
      label: isUk ? "Акаунт" : "Account",
      items: [
        { id: "profile", label: dictionary.nav.profile, icon: "user-round", href: `/${localeParam}/app/profile` },
        { id: "settings", label: dictionary.nav.settings, icon: "settings", href: `/${localeParam}/app/settings` },
        { id: "admin", label: dictionary.nav.admin, icon: "shield-check", href: `/${localeParam}/app/admin` },
      ],
    },
  ];

  return (
    <WorkspaceShell
      dictionary={dictionary}
      locale={localeParam}
      user={user}
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
        {/* ── Hero ────────────────────────────────────────────── */}
        <section className="relative overflow-hidden rounded-2xl border border-rose-100 bg-gradient-to-br from-rose-50 via-white to-violet-50/40 p-6 md:p-8">
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-rose-400/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-violet-400/10 blur-3xl" />
          <div className="relative max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-white/80 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-rose-700">
              <ShieldCheck className="h-3 w-3" />
              {isUk ? "Панель адміністратора" : "Admin Panel"}
            </span>
            <h1 className="mt-4 text-3xl font-bold leading-[1.1] tracking-tight text-slate-950 md:text-4xl">
              {dictionary.admin.title}
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
              {isUk
                ? "Користувачі, проєкти, запрошення та повний журнал дій у системі."
                : "Users, projects, invitations and a full system action log."}
            </p>
          </div>
        </section>

        {/* ── Stats row ───────────────────────────────────────── */}
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <AdminStatTile
            icon={<UsersRound className="h-4 w-4" />}
            label={dictionary.admin.totalUsers}
            value={users.length}
            tint="blue"
          />
          <AdminStatTile
            icon={<Database className="h-4 w-4" />}
            label={dictionary.admin.totalProjects}
            value={projects.length}
            tint="emerald"
          />
          <AdminStatTile
            icon={<Mail className="h-4 w-4" />}
            label={dictionary.admin.totalInvitations}
            value={invitations.length}
            tint="amber"
          />
          <AdminStatTile
            icon={<History className="h-4 w-4" />}
            label={dictionary.admin.totalAuditEvents}
            value={auditEvents.length}
            tint="violet"
          />
        </section>

        {/* ── AI settings ────────────────────────────────────── */}
        <section>
          <AdminPanel title={isUk ? "AI налаштування" : "AI settings"} tint="violet">
            <AiSettingsForm initialSettings={aiSettings} isUk={isUk} locale={localeParam} />
          </AdminPanel>
        </section>

        {/* ── Institution verification ────────────────────────── */}
        {institutions.length > 0 && (
          <section>
            <AdminPanel
              title={isUk ? `Заклади (${institutions.length})` : `Institutions (${institutions.length})`}
              count={institutions.length}
              tint="emerald"
              badge={pendingInstitutions.length > 0 ? { label: isUk ? `${pendingInstitutions.length} очікує` : `${pendingInstitutions.length} pending`, color: "amber" } : undefined}
            >
              {institutions.map((inst) => (
                <div key={inst._id} className="flex items-center gap-3 border-b border-slate-100/60 px-4 py-2.5 last:border-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50">
                    <Building2 className="h-4 w-4 text-emerald-700" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{inst.name}</p>
                    <p className="text-[10px] text-slate-400">
                      {[inst.city, inst.country, inst.email].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {inst.isVerified ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        <CheckCircle2 className="h-3 w-3" />
                        {isUk ? "верифіковано" : "verified"}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                        {isUk ? "очікує" : "pending"}
                      </span>
                    )}
                    <InstitutionVerifyActions
                      institutionId={inst._id!}
                      isVerified={inst.isVerified}
                      locale={localeParam}
                    />
                    {inst._id && (
                      <a
                        href={`/${localeParam}/institutions/${inst._id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded p-1 text-slate-400 hover:text-blue-600"
                        title={isUk ? "Публічний профіль" : "Public profile"}
                      >
                        <Building2 className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </AdminPanel>
          </section>
        )}

        {/* ── Data panels ─────────────────────────────────────── */}
        <section className="grid gap-5 xl:grid-cols-2">
          <AdminPanel title={dictionary.admin.users} count={users.length} tint="blue">
            {users.map((item) => (
              <AdminRow
                key={item._id}
                avatar={<Avatar firstName={item.firstName} lastName={item.lastName} size="sm" />}
                title={`${item.firstName} ${item.lastName}`}
                meta={`${item.email} · ${dictionary.roles[item.role as keyof typeof dictionary.roles]}`}
              />
            ))}
          </AdminPanel>

          <AdminPanel title={dictionary.admin.projects} count={projects.length} tint="emerald">
            {projects.map((project) => (
              <AdminRow
                key={project._id}
                avatar={
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-[10px] font-bold text-emerald-700 uppercase">
                    {project.acronym?.[0] ?? "P"}
                  </div>
                }
                title={project.title}
                meta={`${project.acronym} · ${project.status}`}
              />
            ))}
          </AdminPanel>

          <AdminPanel title={dictionary.admin.content} count={records.length + openScienceUpdates.length} tint="teal">
            <AdminRow
              key="content-records"
              avatar={<div className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue-200 bg-blue-50"><Database className="h-4 w-4 text-blue-600" /></div>}
              title={dictionary.sections.evidenceMatrix}
              meta={`${records.length} ${isUk ? "записів" : "records"}`}
            />
            <AdminRow
              key="content-openscience"
              avatar={<div className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50"><LayoutDashboard className="h-4 w-4 text-emerald-600" /></div>}
              title={dictionary.openScience.manageTitle}
              meta={`${openScienceUpdates.length} ${isUk ? "оновлень" : "updates"}`}
            />
          </AdminPanel>

          <AdminPanel title={dictionary.admin.invitations} count={invitations.length} tint="amber">
            {invitations.map((invitation) => (
              <AdminRow
                key={invitation._id ?? invitation.token}
                avatar={<div className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-200 bg-amber-50"><Mail className="h-4 w-4 text-amber-600" /></div>}
                title={invitation.email}
                meta={`${invitation.role} · ${invitation.token.substring(0, 8)}...`}
              />
            ))}
          </AdminPanel>
        </section>

        {/* ── Audit log ──────────────────────────────────────── */}
        <section className="liquid-card p-0 overflow-hidden" data-liquid-tint="violet">
          <div className="flex items-center gap-3 border-b border-slate-200/60 bg-gradient-to-br from-violet-50/60 via-white to-slate-50/60 px-5 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-slate-950">{dictionary.admin.audit}</h2>
              <p className="text-xs text-slate-500">{isUk ? "Усі дії у системі" : "All system actions"}</p>
            </div>
          </div>
          <div className="p-5">
            <AuditLog events={auditEvents} />
          </div>
        </section>
      </div>
    </WorkspaceShell>
  );
}

// ── Components ───────────────────────────────────────────────────────────────

function AdminStatTile({
  icon,
  label,
  value,
  tint,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  tint: "blue" | "emerald" | "amber" | "violet" | "teal" | "rose";
}) {
  return (
    <article data-liquid-tint={tint} className="liquid-stat flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="liquid-eyebrow">{label}</span>
        <span className="text-[color:var(--liquid-accent)]">{icon}</span>
      </div>
      <div className="text-2xl font-bold tracking-tight text-slate-950 tabular-nums">{value}</div>
    </article>
  );
}

function AdminPanel({
  children,
  title,
  count,
  tint,
  badge,
}: {
  children: ReactNode;
  title: string;
  count?: number;
  tint?: "blue" | "emerald" | "amber" | "violet" | "teal" | "rose";
  badge?: { label: string; color: "amber" | "rose" | "emerald" };
}) {
  const badgeCls: Record<string, string> = {
    amber:   "bg-amber-100 text-amber-700",
    rose:    "bg-rose-100 text-rose-700",
    emerald: "bg-emerald-100 text-emerald-700",
  };
  return (
    <section data-liquid-tint={tint} className="liquid-card p-0 overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-200/60 bg-gradient-to-br from-white/80 via-white to-slate-50/60 px-5 py-3.5">
        <div className="flex items-center gap-2">
          <span className="liquid-eyebrow">{title}</span>
          {badge && (
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${badgeCls[badge.color]}`}>
              {badge.label}
            </span>
          )}
        </div>
        {count !== undefined && (
          <span className="rounded-full bg-[color:color-mix(in_srgb,var(--liquid-accent)_12%,white)] px-2 py-0.5 text-xs font-bold text-[color:var(--liquid-accent)]">
            {count}
          </span>
        )}
      </div>
      <div className="divide-y divide-slate-100/70">{children}</div>
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
    <article className="flex items-center gap-3 px-4 py-2.5 transition hover:bg-slate-50/70">
      {avatar}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-slate-900">{title}</p>
        <p className="truncate text-[11px] text-slate-500">{meta}</p>
      </div>
    </article>
  );
}
