import {
  BookOpen,
  ExternalLink,
  Mail,
  RefreshCw,
  Settings,
  Users,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { generateSupervisorJoinCode } from "@/app/actions";
import { Avatar, EmptyState } from "@/components/ui";
import type { Dictionary, Locale } from "@/lib/i18n";
import type { Project, SafeUser } from "@/lib/schemas";

type MemberEntry = {
  user: SafeUser;
  projects: Array<{
    project: Project;
    role: "owner" | "supervisor" | "member";
  }>;
};

const ROLE_AVATAR_CLASS: Record<string, string> = {
  owner:      "bg-gradient-to-br from-amber-400 to-orange-500 text-white ring-2 ring-amber-200",
  supervisor: "bg-gradient-to-br from-indigo-500 to-violet-600 text-white ring-2 ring-indigo-200",
  member:     "bg-gradient-to-br from-slate-400 to-slate-500 text-white ring-2 ring-slate-200",
};

const ROLE_BADGE: Record<string, string> = {
  owner: "border-amber-200 bg-amber-50 text-amber-800",
  supervisor: "border-indigo-200 bg-indigo-50 text-indigo-800",
  member: "border-slate-200 bg-slate-100 text-slate-600",
};

const ROLE_BORDER: Record<string, string> = {
  owner: "border-l-amber-400",
  supervisor: "border-l-indigo-400",
  member: "border-l-slate-300",
};


export function TeamMemberList({
  dictionary,
  locale,
  members,
  project,
  currentUserId,
  isManager = false,
}: {
  dictionary: Dictionary;
  locale: Locale;
  members: MemberEntry[];
  project?: Project;
  currentUserId?: string;
  isManager?: boolean;
}) {
  const d = dictionary;
  const isUk = locale === "uk";

  const ownerCount = members.filter((m) =>
    m.projects.some((p) => p.role === "owner"),
  ).length;
  const supervisorCount = members.filter((m) =>
    m.projects.some((p) => p.role === "supervisor"),
  ).length;
  const memberCount = members.filter((m) =>
    m.projects.every((p) => p.role === "member"),
  ).length;

  return (
    <section className="surface overflow-hidden">
      {/* Header */}
      <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-blue-600">
              Directory
            </p>
            <h2 className="mt-0.5 text-lg font-bold text-stone-950">
              {d.team.members}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-600">
              <Users className="h-4 w-4" />
            </div>
            {isManager && project?._id && (
              <Link
                href={`/${locale}/app/project-settings?projectId=${project._id}&section=team`}
                className="control inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold"
              >
                <Settings className="h-3.5 w-3.5" />
                {isUk ? "Управління" : "Manage"}
              </Link>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full border border-stone-200 bg-white px-2.5 py-1 text-xs font-semibold text-stone-600">
            {members.length} {isUk ? "учасників" : "total"}
          </span>
          {ownerCount > 0 && (
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
              {ownerCount} {d.team.owner.toLowerCase()}
            </span>
          )}
          {supervisorCount > 0 && (
            <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
              {supervisorCount} {d.team.supervisor.toLowerCase()}
            </span>
          )}
          {memberCount > 0 && (
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
              {memberCount} {d.team.member.toLowerCase()}
            </span>
          )}
        </div>
      </div>

      {/* Join codes (managers only) */}
      {isManager && project && (
        <div className="divide-y divide-dashed divide-slate-200 border-b border-slate-200">
          {/* Member join code */}
          {project.joinCode && (
            <div className="bg-blue-50/50 px-5 py-3">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-blue-500">
                {isUk ? "Код для учасника" : "Member join code"}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <code
                  className="select-all cursor-pointer rounded border border-blue-200 bg-white px-3 py-1.5 font-mono text-sm font-bold tracking-widest text-blue-700"
                  title={isUk ? "Натисніть для виділення" : "Click to select"}
                >
                  {project.joinCode}
                </code>
                <p className="text-xs text-blue-500">
                  {isUk
                    ? "Поділіться з новим учасником команди"
                    : "Share with a new team member"}
                </p>
              </div>
            </div>
          )}

          {/* Supervisor join code */}
          <div className="bg-indigo-50/50 px-5 py-3">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-indigo-500">
              {isUk ? "Код наукового керівника" : "Supervisor join code"}
            </p>
            {project.supervisorJoinCode ? (
              <div className="flex flex-wrap items-center gap-3">
                <code
                  className="select-all cursor-pointer rounded border border-indigo-200 bg-white px-3 py-1.5 font-mono text-sm font-bold tracking-widest text-indigo-700"
                  title={isUk ? "Натисніть для виділення" : "Click to select"}
                >
                  {project.supervisorJoinCode}
                </code>
                <form action={generateSupervisorJoinCode}>
                  <input type="hidden" name="projectId" value={project._id ?? ""} />
                  <input type="hidden" name="locale" value={locale} />
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1 rounded border border-indigo-200 bg-white px-2 py-1 text-[11px] font-semibold text-indigo-600 transition hover:bg-indigo-50"
                    title={isUk ? "Оновити код" : "Regenerate code"}
                  >
                    <RefreshCw className="h-3 w-3" />
                    {isUk ? "Оновити" : "Regenerate"}
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <p className="text-xs text-indigo-400">
                  {isUk
                    ? "Код ще не створено. Згенеруйте, щоб запросити наукового керівника."
                    : "No code yet. Generate one to invite a supervisor."}
                </p>
                <form action={generateSupervisorJoinCode}>
                  <input type="hidden" name="projectId" value={project._id ?? ""} />
                  <input type="hidden" name="locale" value={locale} />
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1 rounded border border-indigo-300 bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-700"
                  >
                    <RefreshCw className="h-3 w-3" />
                    {isUk ? "Згенерувати" : "Generate"}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Member list */}
      <div className="divide-y divide-slate-100">
        {members.length === 0 ? (
          <div className="px-5 py-8">
            <EmptyState
              icon={<UserRound className="h-5 w-5" />}
              title={d.team.noMembers}
              description={
                isUk
                  ? "Учасники з'являться тут після додавання до проєкту."
                  : "Members will appear here after being added to the project."
              }
            />
          </div>
        ) : (
          members.map((entry) => {
            const topRole = entry.projects[0]?.role ?? "member";
            const projectId = entry.projects[0]?.project._id;
            const profileHref = projectId
              ? `/${locale}/app/member?userId=${entry.user._id}&projectId=${projectId}`
              : `/${locale}/app/member?userId=${entry.user._id}`;
            const isSelf = currentUserId ? entry.user._id === currentUserId : false;

            return (
              <article
                key={entry.user._id}
                className={`border-l-4 px-5 py-4 transition hover:bg-slate-50/70 ${ROLE_BORDER[topRole]}`}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <Avatar
                    firstName={entry.user.firstName}
                    lastName={entry.user.lastName}
                    size="md"
                    colorClass={ROLE_AVATAR_CLASS[topRole]}
                  />

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={profileHref}
                        className="font-semibold text-stone-950 transition hover:text-blue-700"
                      >
                        {entry.user.firstName} {entry.user.lastName}
                        {isSelf && (
                          <span className="ml-1.5 rounded bg-stone-100 px-1.5 py-0.5 text-[10px] font-semibold text-stone-500">
                            {isUk ? "Ви" : "You"}
                          </span>
                        )}
                      </Link>

                      {entry.projects.map(({ project: proj, role }) => (
                        <span
                          key={`${proj._id}-${role}`}
                          className={`rounded border px-2 py-0.5 text-[11px] font-semibold ${ROLE_BADGE[role]}`}
                        >
                          {d.team[role]}
                        </span>
                      ))}
                    </div>

                    {/* Latin name */}
                    {(entry.user.firstNameLatin || entry.user.lastNameLatin) && (
                      <p className="mt-0.5 text-xs text-stone-400">
                        {entry.user.firstNameLatin} {entry.user.lastNameLatin}
                      </p>
                    )}

                    {/* Position / Affiliation */}
                    {(entry.user.position || entry.user.affiliation) && (
                      <p className="mt-1 text-xs text-stone-500">
                        {[entry.user.position, entry.user.affiliation]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    )}

                    {/* Email + ORCID row */}
                    <div className="mt-1.5 flex flex-wrap items-center gap-3">
                      <span className="inline-flex items-center gap-1 text-[11px] text-stone-400">
                        <Mail className="h-3 w-3" />
                        {entry.user.email}
                      </span>
                      {entry.user.orcid && (
                        <a
                          href={`https://orcid.org/${entry.user.orcid}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 hover:underline"
                        >
                          <BookOpen className="h-3 w-3" />
                          {entry.user.orcid}
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Profile link */}
                  <Link
                    href={profileHref}
                    className="hidden shrink-0 items-center gap-1 text-[11px] text-slate-400 transition hover:text-blue-600 sm:inline-flex"
                    title={isUk ? "Переглянути профіль" : "View profile"}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
