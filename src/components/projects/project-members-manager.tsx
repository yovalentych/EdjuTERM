import {
  addProjectMember,
  deleteProjectMember,
  promoteProjectSupervisor,
} from "@/app/actions";
import type { Dictionary, Locale } from "@/lib/i18n";
import type { Project, SafeUser } from "@/lib/schemas";

export function ProjectMembersManager({
  dictionary,
  locale,
  members,
  project,
}: {
  dictionary: Dictionary;
  locale: Locale;
  members: SafeUser[];
  project: Project;
}) {
  return (
    <section className="border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-semibold text-stone-950">
        {dictionary.projects.membersTitle}
      </h2>
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
            className="w-full border border-stone-300 bg-white px-3 py-2 text-sm text-stone-950 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
            required
          />
        </label>
        <button
          type="submit"
          className="self-end bg-stone-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-800"
        >
          {dictionary.projects.addMember}
        </button>
      </form>
      <div className="mt-5 space-y-3">
        {members.map((member) => (
          <article
            key={member._id}
            className="flex flex-col gap-3 border border-stone-200 p-4 md:flex-row md:items-center md:justify-between"
          >
            <div>
              <p className="font-semibold text-stone-950">
                {member.firstName} {member.lastName}
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
                    className="border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-900 transition hover:border-emerald-700"
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
                    className="border border-rose-300 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-900 transition hover:border-rose-700"
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
