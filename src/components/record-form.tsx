import { createRecord } from "@/app/actions";
import { localizeStageLabel, type Dictionary, type Locale } from "@/lib/i18n";
import type { Project } from "@/lib/schemas";

const fieldClass =
  "w-full border border-stone-300 bg-white px-3 py-2 text-sm text-stone-950 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100";

export function RecordForm({
  dictionary,
  locale,
  projects,
}: {
  dictionary: Dictionary;
  locale: Locale;
  projects: Project[];
}) {
  if (projects.length === 0) {
    return (
      <div className="mt-5 border border-dashed border-stone-300 p-4 text-sm text-stone-500">
        {dictionary.projects.none}
      </div>
    );
  }

  return (
    <form action={createRecord} className="mt-5 grid gap-3 md:grid-cols-2">
      <input type="hidden" name="locale" value={locale} />
      <label className="space-y-1 md:col-span-2">
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
          {dictionary.form.kind}
        </span>
        <select name="kind" className={fieldClass} defaultValue="dataset">
          <option value="dataset">{dictionary.kinds.dataset}</option>
          <option value="protocol">{dictionary.kinds.protocol}</option>
          <option value="task">{dictionary.kinds.task}</option>
          <option value="output">{dictionary.kinds.output}</option>
          <option value="sample">{dictionary.kinds.sample}</option>
          <option value="risk">{dictionary.kinds.risk}</option>
        </select>
      </label>
      <label className="space-y-1">
        <span className="text-sm font-medium text-stone-700">
          {dictionary.form.localId}
        </span>
        <input
          name="localId"
          className={fieldClass}
          placeholder="DATA-YYYY-NNN"
          required
        />
      </label>
      <label className="space-y-1 md:col-span-2">
        <span className="text-sm font-medium text-stone-700">
          {dictionary.form.title}
        </span>
        <input
          name="title"
          className={fieldClass}
          placeholder={dictionary.form.titlePlaceholder}
          required
        />
      </label>
      <label className="space-y-1">
        <span className="text-sm font-medium text-stone-700">
          {dictionary.form.stage}
        </span>
        <select name="stage" className={fieldClass} defaultValue="Stage 1">
          <option value="Stage 1">
            {localizeStageLabel("Stage 1", dictionary)}
          </option>
          <option value="Stage 2">
            {localizeStageLabel("Stage 2", dictionary)}
          </option>
          <option value="Stage 3">
            {localizeStageLabel("Stage 3", dictionary)}
          </option>
        </select>
      </label>
      <label className="space-y-1">
        <span className="text-sm font-medium text-stone-700">
          {dictionary.form.access}
        </span>
        <select name="access" className={fieldClass} defaultValue="internal">
          <option value="internal">{dictionary.access.internal}</option>
          <option value="open">{dictionary.access.open}</option>
          <option value="embargoed">{dictionary.access.embargoed}</option>
          <option value="restricted">{dictionary.access.restricted}</option>
        </select>
      </label>
      <label className="space-y-1">
        <span className="text-sm font-medium text-stone-700">
          {dictionary.form.owner}
        </span>
        <input
          name="owner"
          className={fieldClass}
          placeholder={dictionary.form.ownerPlaceholder}
          required
        />
      </label>
      <label className="space-y-1">
        <span className="text-sm font-medium text-stone-700">
          {dictionary.form.repository}
        </span>
        <input
          name="repository"
          className={fieldClass}
          placeholder={dictionary.form.repositoryPlaceholder}
          required
        />
      </label>
      <label className="space-y-1 md:col-span-2">
        <span className="text-sm font-medium text-stone-700">
          {dictionary.form.summary}
        </span>
        <textarea
          name="summary"
          className={`${fieldClass} min-h-24 resize-y`}
          placeholder={dictionary.form.summaryPlaceholder}
        />
      </label>
      <button
        type="submit"
        className="md:col-span-2 bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800"
      >
        {dictionary.form.submit}
      </button>
    </form>
  );
}
