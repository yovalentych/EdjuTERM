import {
  ArrowRight,
  BookOpen,
  Database,
  FlaskConical,
  FolderOpen,
  Globe2,
  KeyRound,
  Plus,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { notFound, redirect } from "next/navigation";
import { joinProjectWithCode } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { DashboardLayout, DashboardSection } from "@/components/dashboard/dashboard-layout";
import { ProjectList } from "@/components/projects/project-list";
import { Avatar } from "@/components/ui";
import { getCurrentUser } from "@/lib/current-user";
import { getDictionary, isLocale } from "@/lib/i18n";
import { listProjectsForUser } from "@/lib/projects";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale = isLocale(localeParam) ? localeParam : "uk";
  return {
    title: locale === "uk" ? "Мій кабінет" : "My dashboard",
    description: locale === "uk" ? "Персональний кабінет користувача" : "Personal user dashboard",
  };
}

export default async function DashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { locale: localeParam } = await params;

  if (!isLocale(localeParam)) notFound();

  const dictionary = getDictionary(localeParam);
  const user = await getCurrentUser();
  if (!user) redirect(`/${localeParam}/login`);

  const projects = await listProjectsForUser(user);
  const { error, saved } = await searchParams;

  const isUk = localeParam === "uk";
  const userId = user._id ?? "";

  const managedProjects = projects.filter((p) => p.ownerId === userId || p.supervisorId === userId);
  const openScienceProjects = projects.filter((p) => p.openScienceEnabled);
  const dataRegistryProjects = projects.filter((p) => p.rawDataRegistryEnabled);
  const firstProjectId = projects.find((p) => p._id)?._id ?? "";

  return (
    <AppShell dictionary={dictionary} locale={localeParam} user={user}>
      <DashboardLayout>
        {/* Left Column: Hero & Main Workspace */}
        <div className="space-y-6">
          {/* Hero Section */}
          <DashboardSection className="page-hero overflow-hidden">
            <div className="p-6 md:p-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex min-w-0 items-center gap-5">
                  <Avatar
                    firstName={user.firstName}
                    lastName={user.lastName}
                    size="xl"
                    colorClass="bg-gradient-to-br from-blue-500 to-indigo-600 text-white ring-4 ring-white shadow-lg"
                    className="shrink-0 text-2xl"
                  />
                  <div className="min-w-0">
                    <p className="font-mono text-xs font-bold uppercase tracking-widest text-blue-600">
                      {dictionary.shell.projectShortName}
                    </p>
                    <h1 className="mt-1 text-3xl font-bold text-slate-950 md:text-4xl">
                      {isUk ? "Вітаємо" : "Welcome"}, {user.firstName}
                    </h1>
                  </div>
                </div>

                <div className="flex shrink-0 gap-3">
                  <Link
                    href={`/${localeParam}/projects/new`}
                    className="control-primary inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold shadow-sm transition hover:shadow-md"
                  >
                    <Plus className="h-4 w-4" />
                    {dictionary.projects.newProject}
                  </Link>
                </div>
              </div>

              {/* Sneat-style stat row */}
              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatTile
                  icon={<FolderOpen className="h-5 w-5" />}
                  value={projects.length}
                  label={isUk ? "Проєктів" : "Projects"}
                  color="blue"
                />
                <StatTile
                  icon={<ShieldCheck className="h-5 w-5" />}
                  value={managedProjects.length}
                  label={isUk ? "Під керівництвом" : "Managed"}
                  color="indigo"
                />
                <StatTile
                  icon={<Globe2 className="h-5 w-5" />}
                  value={openScienceProjects.length}
                  label="Open Science"
                  color="emerald"
                />
                <StatTile
                  icon={<Database className="h-5 w-5" />}
                  value={dataRegistryProjects.length}
                  label={isUk ? "Реєстр даних" : "Data Registry"}
                  color="cyan"
                />
              </div>
            </div>
          </DashboardSection>

          {/* Project List */}
          <DashboardSection className="surface overflow-hidden rounded-2xl bg-white/60 backdrop-blur-md">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-white/50 px-6 py-5">
              <div>
                <h2 className="font-serif text-xl font-bold text-slate-950">
                  {dictionary.projects.current}
                </h2>
                <p className="text-sm text-slate-500">{dictionary.projects.createHint}</p>
              </div>
            </div>
            <div className="p-6">
              <ProjectList
                projects={projects}
                dictionary={dictionary}
                locale={localeParam}
                user={user}
              />
            </div>
          </DashboardSection>
        </div>

        {/* Right Column: Widgets */}
        <div className="space-y-6">
          {/* Profile Bento */}
          <DashboardSection className="surface rounded-2xl bg-white/80 p-5 backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900">
                <UserRound className="h-4 w-4 text-blue-600" />
                <h2 className="text-sm font-bold uppercase tracking-wider">{isUk ? "Профіль" : "Profile"}</h2>
              </div>
              <Link
                href={`/${localeParam}/app/profile`}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
              >
                {isUk ? "Редагувати" : "Edit"}
              </Link>
            </div>
            <div className="mt-4 space-y-3">
              <ProfileRow label={isUk ? "Роль" : "Role"} value={dictionary.roles[user.role]} />
              <ProfileRow label="Email" value={user.email} />
              {user.affiliation && <ProfileRow label={isUk ? "Установа" : "Affiliation"} value={user.affiliation} />}
              {user.position && <ProfileRow label={isUk ? "Посада" : "Position"} value={user.position} />}
              {user.orcid && (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">ORCID</span>
                  <a
                    href={`https://orcid.org/${user.orcid}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:underline"
                  >
                    <BookOpen className="h-3 w-3" />
                    {user.orcid}
                  </a>
                </div>
              )}
            </div>
          </DashboardSection>

          {/* Quick Shortcuts Bento */}
          {projects.length > 0 && (
            <DashboardSection className="surface rounded-2xl bg-white/80 p-5 backdrop-blur-md">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3 text-slate-900">
                <FlaskConical className="h-4 w-4 text-purple-600" />
                <h2 className="text-sm font-bold uppercase tracking-wider">{isUk ? "Швидкий доступ" : "Shortcuts"}</h2>
              </div>
              <div className="mt-4 grid gap-3">
                <QuickModuleCard
                  icon={<FlaskConical className="h-5 w-5" />}
                  title={isUk ? "Експерименти" : "Experiments"}
                  iconClass="bg-label-muted text-violet-600"
                  href={firstProjectId ? `/${localeParam}/app/experiments?projectId=${firstProjectId}` : undefined}
                />
                <QuickModuleCard
                  icon={<Database className="h-5 w-5" />}
                  title={isUk ? "Записи і дані" : "Records & data"}
                  iconClass="bg-label-primary"
                  href={firstProjectId ? `/${localeParam}/app/project?projectId=${firstProjectId}&tab=records` : undefined}
                />
                <QuickModuleCard
                  icon={<Globe2 className="h-5 w-5" />}
                  title="Open Science"
                  iconClass="bg-label-success"
                  href={firstProjectId ? `/${localeParam}/app/open-science?projectId=${firstProjectId}` : undefined}
                />
                <QuickModuleCard
                  icon={<BookOpen className="h-5 w-5" />}
                  title={isUk ? "Довідка" : "Library"}
                  iconClass="bg-label-info"
                  href={`/${localeParam}/app/library`}
                />
              </div>
            </DashboardSection>
          )}

          {/* Join Project Bento */}
          <DashboardSection className="surface rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/30 p-5 backdrop-blur-md">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 text-slate-900">
              <KeyRound className="h-4 w-4 text-amber-500" />
              <h2 className="text-sm font-bold uppercase tracking-wider">{isUk ? "Приєднання" : "Join"}</h2>
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-500">
              {dictionary.projects.emailInviteNote}
            </p>
            <form action={joinProjectWithCode} className="mt-3 flex flex-col gap-2">
              <input type="hidden" name="locale" value={localeParam} />
              <input
                name="joinCode"
                placeholder={dictionary.projects.joinCodePlaceholder}
                className="input-control w-full rounded-lg px-3 py-2.5 font-mono text-sm shadow-sm"
                required
              />
              <button
                type="submit"
                className="control-primary w-full rounded-lg px-4 py-2.5 text-sm font-semibold shadow-sm transition hover:shadow-md"
              >
                {isUk ? "Приєднатись" : "Join Project"}
              </button>
            </form>
            {error === "join-code" && (
              <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-800">
                {dictionary.projects.invalidJoinCode}
              </p>
            )}
            {saved === "joined" && (
              <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">
                {dictionary.projects.saved}
              </p>
            )}
          </DashboardSection>
        </div>
      </DashboardLayout>
    </AppShell>
  );
}

// ── Components ───────────────────────────────────────────────────────────────

const TILE_ICON: Record<string, string> = {
  blue:   "bg-blue-50 text-blue-600 border border-blue-200",
  indigo: "bg-indigo-50 text-indigo-600 border border-indigo-200",
  emerald:"bg-emerald-50 text-emerald-600 border border-emerald-200",
  cyan:   "bg-cyan-50 text-cyan-600 border border-cyan-200",
};

function StatTile({
  icon,
  value,
  label,
  color,
}: {
  icon: ReactNode;
  value: number;
  label: string;
  color: keyof typeof TILE_ICON;
}) {
  return (
    <div className="metric-card flex items-center justify-between gap-3 p-5">
      <div className="min-w-0">
        <p className="truncate text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
        <p className="mt-1.5 text-3xl font-bold tabular-nums text-slate-900">{value}</p>
      </div>
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${TILE_ICON[color]}`}>
        {icon}
      </div>
    </div>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs font-semibold text-slate-500">{label}</span>
      <span className="text-right text-xs font-medium text-slate-900 break-all">{value}</span>
    </div>
  );
}

function QuickModuleCard({
  icon,
  title,
  iconClass,
  href,
}: {
  icon: ReactNode;
  title: string;
  iconClass: string;
  href?: string;
}) {
  const content = (
    <div className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 transition-all hover:border-blue-200 hover:shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}>
          {icon}
        </div>
        <p className="text-sm font-semibold text-slate-900 transition-colors group-hover:text-blue-700">{title}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-400" />
    </div>
  );

  if (href) return <Link href={href} className="block">{content}</Link>;
  return content;
}

