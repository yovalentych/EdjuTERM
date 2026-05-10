import {
  addProjectMember,
  createProjectInvite,
  deleteProjectMember,
  promoteProjectSupervisor,
  resetProjectJoinCode,
} from "@/app/actions";
import type { Dictionary, Locale } from "@/lib/i18n";
import type { Project, ProjectInvitation, SafeUser } from "@/lib/schemas";
import Link from "next/link";

export function ProjectMembersManager({
  dictionary,
  locale,
  members,
  project,
  invitations,
}: {
  dictionary: Dictionary;
  locale: Locale;
  invitations: ProjectInvitation[];
  members: SafeUser[];
  project: Project;
}) {
  return (
    <section className="surface p-5 md:p-6">
      <div className="border-b border-stone-200 pb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
          Team access
        </p>
        <h2 className="mt-1 text-xl font-semibold text-stone-950">
          {dictionary.projects.membersTitle}
        </h2>
      </div>
      <div className="mt-4 border border-emerald-200 bg-emerald-50 p-4 shadow-[0_10px_28px_rgba(5,150,105,0.08)]">
        <p className="text-sm font-medium text-emerald-950">
          {dictionary.projects.joinCode}
        </p>
        <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="font-mono text-2xl font-semibold tracking-normal text-emerald-950">
            {project.joinCode || "-"}
          </p>
          <form action={resetProjectJoinCode}>
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="projectId" value={project._id} />
            <button
              type="submit"
              className="control px-3 py-2 text-sm font-semibold"
            >
              {dictionary.projects.resetJoinCode}
            </button>
          </form>
        </div>
      </div>
      <form action={addProjectMember} className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="projectId" value={project._id} />
        <label className="space-y-1">
          <span className="text-sm font-medium text-stone-700">
            {dictionary.projects.memberEmail}
          </span>
          <input
            name="email"
            type="email"
            placeholder={dictionary.projects.memberEmailPlaceholder}
            className="input-control px-3 py-2 text-sm outline-none"
            required
          />
        </label>
        <button
          type="submit"
          className="control-primary self-end px-4 py-2 text-sm font-semibold"
        >
          {dictionary.projects.addMember}
        </button>
      </form>
      <form action={createProjectInvite} className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="projectId" value={project._id} />
        <label className="space-y-1">
          <span className="text-sm font-medium text-stone-700">
            {dictionary.projects.memberEmail}
          </span>
          <input
            name="email"
            type="email"
            placeholder={dictionary.projects.memberEmailPlaceholder}
            className="input-control px-3 py-2 text-sm outline-none"
            required
          />
        </label>
        <button
          type="submit"
          className="control self-end px-4 py-2 text-sm font-semibold"
        >
          {dictionary.projects.inviteMember}
        </button>
        <p className="text-sm leading-6 text-stone-500 md:col-span-2">
          {dictionary.projects.emailInviteNote}
        </p>
      </form>
      <div className="mt-5">
        <h3 className="text-sm font-semibold text-stone-950">
          {dictionary.projects.invitationsTitle}
        </h3>
        <div className="mt-3 grid gap-2">
          {invitations.length === 0 ? (
            <p className="surface-muted border-dashed p-3 text-sm text-stone-500">
              {dictionary.team.noMessages}
            </p>
          ) : (
            invitations.map((invitation) => (
              <div
                key={invitation._id ?? invitation.code}
                className="surface-muted flex flex-col gap-2 p-3 text-sm md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="font-medium text-stone-950">{invitation.email}</p>
                  <p className="text-stone-500">{invitation.status}</p>
                </div>
                <span className="font-mono text-stone-950">
                  {dictionary.projects.invitationCode}: {invitation.code}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
      <div className="mt-5 space-y-3">
        {members.map((member) => (
          <article
            key={member._id}
            className="metric-card flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between"
          >
            <div>
              <p className="font-semibold text-stone-950">
                <Link
                  href={`/${locale}/app/member?userId=${member._id}&projectId=${project._id}`}
                  className="transition hover:text-emerald-800"
                >
                  {member.firstName} {member.lastName}
                </Link>
              </p>
              <p className="text-sm text-stone-500">{member.email}</p>
              <p className="mt-1 text-xs text-emerald-800">
                {member._id === project.ownerId
                  ? dictionary.projects.ownerLabel
                  : member._id === project.supervisorId
                    ? dictionary.projects.supervisorLabel
                    : dictionary.projects.memberLabel}
              </p>
            </div>
            {member._id !== project.ownerId ? (
              <div className="flex flex-wrap gap-2">
                <form action={promoteProjectSupervisor}>
                  <input type="hidden" name="locale" value={locale} />
                  <input type="hidden" name="projectId" value={project._id} />
                  <input type="hidden" name="supervisorId" value={member._id} />
                  <button
                    type="submit"
                    className="control px-3 py-2 text-sm font-semibold"
                  >
                    {dictionary.projects.makeSupervisor}
                  </button>
                </form>
                <form action={deleteProjectMember}>
                  <input type="hidden" name="locale" value={locale} />
                  <input type="hidden" name="projectId" value={project._id} />
                  <input type="hidden" name="memberId" value={member._id} />
                  <button
                    type="submit"
                    className="border border-rose-300 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-900 transition hover:-translate-y-0.5 hover:border-rose-700 hover:bg-rose-100"
                  >
                    {dictionary.projects.removeMember}
                  </button>
                </form>
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
