import { createProject } from "@/app/actions";
import type { Dictionary, Locale } from "@/lib/i18n";

const fieldClass =
  "w-full border border-stone-300 bg-white px-3 py-2 text-sm text-stone-950 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100";

export function ProjectCreateForm({
  dictionary,
  locale,
  error,
}: {
  dictionary: Dictionary;
  locale: Locale;
  error?: string;
}) {
  return (
    <form action={createProject} className="grid gap-3">
      <input type="hidden" name="locale" value={locale} />
      {error ? (
        <div className="border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {dictionary.auth.invalidError}
        </div>
      ) : null}
      <label className="space-y-1">
        <span className="text-sm font-medium text-stone-700">
          {dictionary.projects.title}
        </span>
        <input name="title" className={fieldClass} required />
      </label>
      <label className="space-y-1">
        <span className="text-sm font-medium text-stone-700">
          {dictionary.projects.acronym}
        </span>
        <input name="acronym" className={fieldClass} required />
      </label>
      <label className="space-y-1">
        <span className="text-sm font-medium text-stone-700">
          {dictionary.projects.summary}
        </span>
        <textarea name="summary" className={`${fieldClass} min-h-28 resize-y`} />
      </label>
      <button
        type="submit"
        className="bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800"
      >
        {dictionary.projects.submit}
      </button>
    </form>
  );
}
