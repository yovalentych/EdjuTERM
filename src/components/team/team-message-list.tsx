import { MessageSquareText } from "lucide-react";
import { TeamMessageForm } from "@/components/team/team-message-form";
import type { Dictionary, Locale } from "@/lib/i18n";
import type { Project, SafeUser, TeamMessage } from "@/lib/schemas";

export function TeamMessageList({
  dictionary,
  locale,
  messages,
  projects,
  usersById,
}: {
  dictionary: Dictionary;
  locale: Locale;
  messages: TeamMessage[];
  projects: Project[];
  usersById: Map<string, SafeUser>;
}) {
  const projectsById = new Map(
    projects.map((project) => [project._id, project]),
  );

  return (
    <section className="border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-stone-950">
          {dictionary.team.chat}
        </h2>
        <MessageSquareText className="h-5 w-5 text-emerald-700" />
      </div>

      <div className="mt-5">
        <TeamMessageForm
          dictionary={dictionary}
          locale={locale}
          projects={projects}
        />
      </div>

      <div className="mt-6 space-y-3">
        {messages.length === 0 ? (
          <div className="border border-dashed border-stone-300 p-4 text-sm text-stone-500">
            {dictionary.team.noMessages}
          </div>
        ) : (
          messages.map((message) => {
            const author = usersById.get(message.authorId);
            const project = projectsById.get(message.projectId);

            return (
              <article key={message._id} className="border border-stone-200 p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-semibold text-stone-950">
                      {author
                        ? `${author.firstName} ${author.lastName}`
                        : message.authorId}
                    </p>
                    <p className="mt-1 text-xs text-stone-500">
                      {project?.acronym ?? message.projectId} ·{" "}
                      {formatMessageDate(message.createdAt, locale)}
                    </p>
                  </div>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-stone-700">
                  {message.body}
                </p>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}

function formatMessageDate(date: Date, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "uk" ? "uk-UA" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
