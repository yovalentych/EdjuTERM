import { Send } from "lucide-react";
import { postTeamMessage } from "@/app/actions";
import type { Dictionary, Locale } from "@/lib/i18n";
import type { Project } from "@/lib/schemas";

export function TeamMessageForm({
  dictionary,
  locale,
  projects,
}: {
  dictionary: Dictionary;
  locale: Locale;
  projects: Project[];
}) {
  const hasProjects = projects.length > 0;

  return (
    <form action={postTeamMessage} className="space-y-4">
      <input type="hidden" name="locale" value={locale} />

      <div>
        <label
          htmlFor="projectId"
          className="text-sm font-medium text-stone-700"
        >
          {dictionary.team.projectScope}
        </label>
        <select
          id="projectId"
          name="projectId"
          required
          disabled={!hasProjects}
          className="mt-1 w-full border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none transition focus:border-emerald-700 disabled:bg-stone-100 disabled:text-stone-400"
        >
          {projects.map((project) => (
            <option key={project._id} value={project._id}>
              {project.acronym} · {project.title}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="body" className="text-sm font-medium text-stone-700">
          {dictionary.team.message}
        </label>
        <textarea
          id="body"
          name="body"
          required
          disabled={!hasProjects}
          rows={5}
          maxLength={2000}
          placeholder={dictionary.team.messagePlaceholder}
          className="mt-1 w-full resize-y border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-emerald-700 disabled:bg-stone-100"
        />
      </div>

      <button
        type="submit"
        disabled={!hasProjects}
        className="inline-flex items-center gap-2 bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:bg-stone-300 disabled:text-stone-500"
      >
        <Send className="h-4 w-4" />
        {dictionary.team.send}
      </button>

      {!hasProjects ? (
        <p className="text-sm leading-6 text-stone-500">
          {dictionary.team.noProjects}
        </p>
      ) : null}
    </form>
  );
}
