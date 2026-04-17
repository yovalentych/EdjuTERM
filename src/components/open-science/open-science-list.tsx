import type { Dictionary } from "@/lib/i18n";
import type { OpenScienceUpdate } from "@/lib/schemas";

export function OpenScienceList({
  updates,
  dictionary,
  publicOnly = false,
}: {
  updates: OpenScienceUpdate[];
  dictionary: Dictionary;
  publicOnly?: boolean;
}) {
  if (updates.length === 0) {
    return (
      <div className="border border-dashed border-stone-300 bg-white p-4 text-sm text-stone-500">
        {publicOnly
          ? dictionary.openScience.noPublished
          : dictionary.openScience.noUpdates}
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {updates.map((update) => (
        <article key={update._id} className="border border-stone-200 bg-white p-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <h2 className="text-lg font-semibold text-stone-950">
              {update.title}
            </h2>
            <span className="border border-stone-200 bg-stone-50 px-2 py-1 text-xs font-medium text-stone-600">
              {update.status === "published"
                ? dictionary.openScience.published
                : dictionary.openScience.draft}
            </span>
          </div>
          {update.summary ? (
            <p className="mt-2 text-sm leading-6 text-stone-600">
              {update.summary}
            </p>
          ) : null}
          {update.content ? (
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-stone-700">
              {update.content}
            </p>
          ) : null}
        </article>
      ))}
    </div>
  );
}
