import { saveOpenScienceUpdate } from "@/app/actions";
import type { Dictionary, Locale } from "@/lib/i18n";
import type { Project } from "@/lib/schemas";

const fieldClass =
  "w-full border border-stone-300 bg-white px-3 py-2 text-sm text-stone-950 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100";

export function OpenScienceForm({
  dictionary,
  locale,
  projects,
  returnTo,
}: {
  dictionary: Dictionary;
  locale: Locale;
  projects: Project[];
  returnTo?: string;
}) {
  if (projects.length === 0) {
    return (
      <div className="border border-dashed border-stone-300 p-4 text-sm text-stone-500">
        {dictionary.projects.none}
      </div>
    );
  }

  return (
    <form action={saveOpenScienceUpdate} className="grid gap-3">
      <input type="hidden" name="locale" value={locale} />
      {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}
      <label className="space-y-1">
        <span className="text-sm font-medium text-stone-700">
          {dictionary.projects.project}
        </span>
        <select name="projectId" className={fieldClass} required>
          {projects.map((project) => (
            <option key={project._id ?? project.acronym} value={project._id}>
              {project.title}
            </option>
          ))}
        </select>
      </label>
      <label className="space-y-1">
        <span className="text-sm font-medium text-stone-700">
          {dictionary.openScience.title}
        </span>
        <input name="title" className={fieldClass} required />
      </label>
      <label className="space-y-1">
        <span className="text-sm font-medium text-stone-700">
          {dictionary.openScience.summary}
        </span>
        <textarea name="summary" className={`${fieldClass} min-h-20 resize-y`} />
      </label>
      <label className="space-y-1">
        <span className="text-sm font-medium text-stone-700">
          {dictionary.openScience.content}
        </span>
        <textarea name="content" className={`${fieldClass} min-h-40 resize-y`} />
      </label>
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          name="status"
          value="draft"
          className="border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800 transition hover:border-emerald-700 hover:text-emerald-800"
        >
          {dictionary.openScience.saveDraft}
        </button>
        <button
          type="submit"
          name="status"
          value="published"
          className="bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800"
        >
          {dictionary.openScience.publish}
        </button>
      </div>
    </form>
  );
}
