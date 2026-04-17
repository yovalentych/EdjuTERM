import { ShieldCheck, UserRound } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";
import type { Project, SafeUser } from "@/lib/schemas";

type MemberEntry = {
  user: SafeUser;
  projects: Array<{
    project: Project;
    role: "owner" | "supervisor" | "member";
  }>;
};

export function TeamMemberList({
  dictionary,
  members,
}: {
  dictionary: Dictionary;
  members: MemberEntry[];
}) {
  return (
    <section className="border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-stone-950">
          {dictionary.team.members}
        </h2>
        <UserRound className="h-5 w-5 text-emerald-700" />
      </div>

      <div className="mt-5 space-y-3">
        {members.length === 0 ? (
          <div className="border border-dashed border-stone-300 p-4 text-sm text-stone-500">
            {dictionary.team.noMembers}
          </div>
        ) : (
          members.map((entry) => (
            <article key={entry.user._id} className="border border-stone-200 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="font-semibold text-stone-950">
                    {entry.user.firstName} {entry.user.lastName}
                  </p>
                  <p className="mt-1 text-sm text-stone-600">
                    {entry.user.firstNameLatin} {entry.user.lastNameLatin}
                  </p>
                  <p className="mt-1 text-sm text-stone-500">
                    {entry.user.email}
                  </p>
                </div>
                <span className="inline-flex w-fit items-center gap-2 border border-stone-200 bg-stone-50 px-2 py-1 text-xs font-medium text-stone-700">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" />
                  {dictionary.roles[entry.user.role]}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {entry.projects.map(({ project, role }) => (
                  <span
                    key={`${project._id}-${role}`}
                    className="border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs text-emerald-900"
                  >
                    {project.acronym}: {dictionary.team[role]}
                  </span>
                ))}
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
