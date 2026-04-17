import { createRecord } from "@/app/actions";

const fieldClass =
  "w-full border border-stone-300 bg-white px-3 py-2 text-sm text-stone-950 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100";

export function RecordForm() {
  return (
    <form action={createRecord} className="mt-5 grid gap-3 md:grid-cols-2">
      <label className="space-y-1">
        <span className="text-sm font-medium text-stone-700">Kind</span>
        <select name="kind" className={fieldClass} defaultValue="dataset">
          <option value="dataset">Dataset</option>
          <option value="protocol">Protocol</option>
          <option value="task">Team task</option>
          <option value="output">Output</option>
          <option value="sample">Sample set</option>
          <option value="risk">Risk</option>
        </select>
      </label>
      <label className="space-y-1">
        <span className="text-sm font-medium text-stone-700">Local ID</span>
        <input
          name="localId"
          className={fieldClass}
          placeholder="DATA-2027-004"
          required
        />
      </label>
      <label className="space-y-1 md:col-span-2">
        <span className="text-sm font-medium text-stone-700">Title</span>
        <input
          name="title"
          className={fieldClass}
          placeholder="qPCR RAGE expression dataset"
          required
        />
      </label>
      <label className="space-y-1">
        <span className="text-sm font-medium text-stone-700">Stage</span>
        <select name="stage" className={fieldClass} defaultValue="Stage 1">
          <option>Stage 1</option>
          <option>Stage 2</option>
          <option>Stage 3</option>
        </select>
      </label>
      <label className="space-y-1">
        <span className="text-sm font-medium text-stone-700">Access</span>
        <select name="access" className={fieldClass} defaultValue="internal">
          <option value="internal">Internal</option>
          <option value="open">Open</option>
          <option value="embargoed">Embargoed</option>
          <option value="restricted">Restricted</option>
        </select>
      </label>
      <label className="space-y-1">
        <span className="text-sm font-medium text-stone-700">Owner</span>
        <input name="owner" className={fieldClass} placeholder="Data steward" />
      </label>
      <label className="space-y-1">
        <span className="text-sm font-medium text-stone-700">Repository</span>
        <input name="repository" className={fieldClass} placeholder="Zenodo" />
      </label>
      <label className="space-y-1 md:col-span-2">
        <span className="text-sm font-medium text-stone-700">Summary</span>
        <textarea
          name="summary"
          className={`${fieldClass} min-h-24 resize-y`}
          placeholder="Metadata, raw data location, protocol relation, quality-control status."
        />
      </label>
      <button
        type="submit"
        className="md:col-span-2 bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800"
      >
        Add record
      </button>
    </form>
  );
}
