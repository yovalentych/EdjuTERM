import { saveOpenScienceUpdate } from "@/app/actions";
import { LicensePicker } from "@/components/license-picker";
import type { Dictionary, Locale } from "@/lib/i18n";
import {
  openScienceCategories,
  type OpenScienceUpdate,
  type Project,
  type ProjectRecord,
} from "@/lib/schemas";

const fieldClass = "input-control px-3 py-2 text-sm outline-none";

export function OpenScienceForm({
  dictionary,
  locale,
  projects,
  returnTo,
  editUpdate,
  records = [],
}: {
  dictionary: Dictionary;
  locale: Locale;
  projects: Project[];
  returnTo?: string;
  editUpdate?: OpenScienceUpdate | null;
  records?: ProjectRecord[];
}) {
  if (projects.length === 0) {
    return (
      <div className="surface-muted border-dashed p-4 text-sm text-stone-500">
        {dictionary.projects.none}
      </div>
    );
  }

  const isEdit = Boolean(editUpdate);
  const def = editUpdate;

  return (
    <form action={saveOpenScienceUpdate} className="grid gap-3">
      <input type="hidden" name="locale" value={locale} />
      {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}
      {isEdit && def?._id ? (
        <input type="hidden" name="updateId" value={def._id} />
      ) : null}

      {/* Project selector (hidden in edit mode since it can't change) */}
      {isEdit && def ? (
        <input type="hidden" name="projectId" value={def.projectId} />
      ) : (
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
      )}

      <label className="space-y-1">
        <span className="text-sm font-medium text-stone-700">
          {dictionary.openScience.category}
        </span>
        <select
          name="category"
          className={fieldClass}
          defaultValue={def?.category ?? "updates"}
        >
          {openScienceCategories.map((category) => (
            <option key={category} value={category}>
              {dictionary.openScience.categories[category]}
            </option>
          ))}
        </select>
      </label>

      <label className="space-y-1">
        <span className="text-sm font-medium text-stone-700">
          {dictionary.openScience.title}
        </span>
        <input
          name="title"
          className={fieldClass}
          required
          defaultValue={def?.title ?? ""}
        />
      </label>

      <label className="space-y-1">
        <span className="text-sm font-medium text-stone-700">
          {dictionary.openScience.summary}
        </span>
        <textarea
          name="summary"
          className={`${fieldClass} min-h-20 resize-y`}
          defaultValue={def?.summary ?? ""}
        />
      </label>

      <label className="space-y-1">
        <span className="text-sm font-medium text-stone-700">
          {dictionary.openScience.content}
        </span>
        <textarea
          name="content"
          className={`${fieldClass} min-h-40 resize-y`}
          defaultValue={def?.content ?? ""}
        />
      </label>

      <label className="space-y-1">
        <span className="text-sm font-medium text-stone-700">
          {dictionary.openScience.publicUrl}
        </span>
        <input
          name="publicUrl"
          type="url"
          className={fieldClass}
          placeholder="https://doi.org/..."
          defaultValue={def?.publicUrl ?? ""}
        />
      </label>

      <label className="space-y-1">
        <span className="text-sm font-medium text-stone-700">
          {dictionary.openScience.accessibilityNotes}
        </span>
        <textarea
          name="accessibilityNotes"
          className={`${fieldClass} min-h-24 resize-y`}
          placeholder={dictionary.openScience.accessibilityPlaceholder}
          defaultValue={def?.accessibilityNotes ?? ""}
        />
      </label>

      <LicensePicker
        label="Ліцензія на матеріал"
        name="license"
        defaultValue={def?.license}
      />

      {/* Linked records */}
      {records.length > 0 && (
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-stone-700">
            Прив&apos;язані записи
          </legend>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {records.map((record) => {
              const checked = def?.linkedRecordIds?.includes(record._id ?? "") ?? false;
              return (
                <label
                  key={record._id}
                  className="flex cursor-pointer items-start gap-2 rounded border border-slate-200 bg-slate-50 px-3 py-2 text-xs hover:border-blue-200 hover:bg-blue-50"
                >
                  <input
                    type="checkbox"
                    name="linkedRecordIds"
                    value={record._id}
                    defaultChecked={checked}
                    className="mt-0.5 shrink-0 accent-blue-600"
                  />
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-stone-800">
                      {record.title}
                    </span>
                    <span className="font-mono text-stone-400">{record.localId}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          name="status"
          value="draft"
          className="control px-4 py-2 text-sm font-semibold"
        >
          {dictionary.openScience.saveDraft}
        </button>
        <button
          type="submit"
          name="status"
          value="published"
          className="control-primary px-4 py-2 text-sm font-semibold"
        >
          {dictionary.openScience.publish}
        </button>
      </div>
    </form>
  );
}
