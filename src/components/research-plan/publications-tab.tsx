import type { Dictionary } from "@/lib/i18n";
import type { ResearchPublication, ResearchStage, PublicationType, PublicationStatus } from "@/lib/schemas";
import { addPublication, updatePublication, deletePublication } from "@/app/actions";
import { ConfirmDeleteButton } from "@/components/ui";

const pubTypeColors: Record<PublicationType, string> = {
  article: "bg-indigo-100 text-indigo-700 border-indigo-200",
  conference: "bg-violet-100 text-violet-700 border-violet-200",
  book_chapter: "bg-blue-100 text-blue-700 border-blue-200",
  monograph: "bg-sky-100 text-sky-700 border-sky-200",
  patent: "bg-amber-100 text-amber-700 border-amber-200",
  report: "bg-stone-100 text-stone-600 border-stone-200",
  dataset: "bg-teal-100 text-teal-700 border-teal-200",
  software: "bg-cyan-100 text-cyan-700 border-cyan-200",
  other: "bg-stone-100 text-stone-500 border-stone-200",
};

const pubStatusColors: Record<PublicationStatus, string> = {
  planned: "bg-stone-100 text-stone-600 border-stone-200",
  submitted: "bg-blue-100 text-blue-700 border-blue-200",
  under_review: "bg-amber-100 text-amber-700 border-amber-200",
  accepted: "bg-indigo-100 text-indigo-700 border-indigo-200",
  published: "bg-emerald-100 text-emerald-700 border-emerald-200",
  rejected: "bg-rose-100 text-rose-700 border-rose-200",
};

const PUB_TYPES = ["article", "conference", "book_chapter", "monograph", "patent", "report", "dataset", "software", "other"] as const;
const PUB_STATUSES = ["planned", "submitted", "under_review", "accepted", "published", "rejected"] as const;

export function PublicationsTab({
  publications,
  stages,
  dictionary,
  locale,
  projectId,
  canManage,
}: {
  publications: ResearchPublication[];
  stages: ResearchStage[];
  dictionary: Dictionary;
  locale: string;
  projectId: string;
  canManage: boolean;
}) {
  const d = dictionary.researchPlan;
  const isUk = locale === "uk";

  const pd = (d as { publicationTypes?: Record<string, string>; publicationStatuses?: Record<string, string> });

  const typeLabel = (t: string) => pd.publicationTypes?.[t] ?? t;
  const statusLabel = (s: string) => pd.publicationStatuses?.[s] ?? s;
  const stageLabel = (stageId: string) => {
    const s = stages.find((st) => st._id === stageId);
    return s ? `${isUk ? "Е" : "S"}${s.stageNumber}` : "";
  };

  const totalCount = publications.length;
  const publishedCount = publications.filter((p) => p.status === "published").length;
  const underReviewCount = publications.filter((p) => p.status === "under_review" || p.status === "submitted").length;
  const acceptedCount = publications.filter((p) => p.status === "accepted").length;
  const publishedPct = totalCount > 0 ? Math.round((publishedCount / totalCount) * 100) : 0;

  const sorted = [...publications].sort((a, b) => {
    const order = PUB_STATUSES;
    return order.indexOf(a.status) - order.indexOf(b.status);
  });

  return (
    <div className="space-y-5">
      {/* Stats */}
      {totalCount > 0 && (
        <div className="flex flex-wrap gap-3">
          <div className="rounded border border-stone-200 bg-white px-4 py-2.5 text-center shadow-sm">
            <p className="text-2xl font-bold text-stone-900">{totalCount}</p>
            <p className="text-xs text-stone-500">{isUk ? "Всього" : "Total"}</p>
          </div>
          <div className="rounded border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-center shadow-sm">
            <p className="text-2xl font-bold text-emerald-700">{publishedCount}</p>
            <p className="text-xs text-emerald-600">{statusLabel("published")}</p>
          </div>
          {acceptedCount > 0 && (
            <div className="rounded border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-center shadow-sm">
              <p className="text-2xl font-bold text-indigo-700">{acceptedCount}</p>
              <p className="text-xs text-indigo-600">{statusLabel("accepted")}</p>
            </div>
          )}
          {underReviewCount > 0 && (
            <div className="rounded border border-amber-200 bg-amber-50 px-4 py-2.5 text-center shadow-sm">
              <p className="text-2xl font-bold text-amber-700">{underReviewCount}</p>
              <p className="text-xs text-amber-600">{isUk ? "На розгляді" : "Under review"}</p>
            </div>
          )}
          <div className="flex min-w-40 flex-col justify-center rounded border border-stone-200 bg-white px-4 py-2.5 shadow-sm">
            <div className="mb-1 flex justify-between text-xs text-stone-500">
              <span>{isUk ? "Опубліковано" : "Published"}</span>
              <span className="font-mono font-semibold">{publishedPct}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-stone-200">
              <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${publishedPct}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* Add form */}
      {canManage && (
        <details className="surface group overflow-hidden rounded-lg border border-stone-200" open={publications.length === 0}>
          <summary className="flex cursor-pointer select-none items-center gap-2 px-5 py-4 font-semibold text-stone-700 hover:bg-stone-50">
            <span className="font-mono text-indigo-600 transition-transform group-open:rotate-45">+</span>
            {String((d as Record<string, unknown>).addPublication ?? (isUk ? "Додати публікацію" : "Add publication"))}
          </summary>
          <div className="border-t border-stone-100 px-5 pb-6 pt-4">
            <form action={addPublication} className="space-y-4">
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="projectId" value={projectId} />
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-stone-600">{isUk ? "Тип" : "Type"}</label>
                  <select name="type" className="input-control w-full">
                    {PUB_TYPES.map((t) => (
                      <option key={t} value={t}>{typeLabel(t)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-stone-600">{isUk ? "Статус" : "Status"}</label>
                  <select name="status" className="input-control w-full">
                    {PUB_STATUSES.map((s) => (
                      <option key={s} value={s}>{statusLabel(s)}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-stone-600">{isUk ? "Назва *" : "Title *"}</label>
                <textarea name="title" rows={2} required className="input-control w-full" placeholder={isUk ? "Повна назва статті / розділу / патенту..." : "Full title of article / chapter / patent..."} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-stone-600">{isUk ? "Автори" : "Authors"}</label>
                  <input type="text" name="authors" className="input-control w-full" placeholder="Іваненко І.І., Петренко П.П." />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-stone-600">{isUk ? "Журнал / конференція" : "Journal / conference"}</label>
                  <input type="text" name="journal" className="input-control w-full" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-stone-600">{isUk ? "Рік (план.)" : "Expected year"}</label>
                  <input type="number" name="expectedYear" min={2020} max={2040} className="input-control w-full" placeholder="2026" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-stone-600">DOI</label>
                  <input type="text" name="doi" className="input-control w-full" placeholder="10.xxxx/..." />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-stone-600">URL</label>
                  <input type="url" name="url" className="input-control w-full" placeholder="https://..." />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-stone-600">{isUk ? "Етап" : "Stage"}</label>
                  <select name="stageId" className="input-control w-full">
                    <option value="">—</option>
                    {stages.map((s) => (
                      <option key={s._id} value={s._id}>Е{s.stageNumber}: {s.title.slice(0, 30)}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-stone-600">{isUk ? "Примітка" : "Note"}</label>
                <textarea name="note" rows={2} className="input-control w-full" />
              </div>
              <div className="flex justify-end">
                <button type="submit" className="control-primary">
                  {String((d as Record<string, unknown>).savePublication ?? (isUk ? "Зберегти публікацію" : "Save publication"))}
                </button>
              </div>
            </form>
          </div>
        </details>
      )}

      {/* Publications list */}
      {publications.length === 0 ? (
        <div className="rounded-lg border border-dashed border-stone-300 bg-stone-50 px-6 py-10 text-center">
          <p className="text-2xl">📄</p>
          <p className="mt-2 text-sm font-semibold text-stone-600">
            {isUk ? "Публікацій ще не додано" : "No publications yet"}
          </p>
          <p className="mt-1 text-xs text-stone-400">
            {isUk
              ? "Тут ви можете відстежувати статті, розділи монографій, патенти та інші результати."
              : "Track articles, book chapters, patents and other scholarly outputs here."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((pub) => (
            <details key={pub._id} className="group overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
              <summary className="flex cursor-pointer select-none items-start gap-3 px-5 py-3.5 hover:bg-stone-50">
                <span className={`mt-0.5 shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-bold ${pubTypeColors[pub.type] ?? pubTypeColors.other}`}>
                  {typeLabel(pub.type)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold leading-snug text-stone-900">{pub.title}</p>
                  {pub.authors && <p className="mt-0.5 truncate text-xs text-stone-400">{pub.authors}</p>}
                  {pub.journal && <p className="mt-0.5 truncate text-xs text-stone-500 italic">{pub.journal}</p>}
                </div>
                <div className="ml-auto flex shrink-0 flex-col items-end gap-1.5">
                  {pub.stageId && (
                    <span className="rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-600">
                      {stageLabel(pub.stageId)}
                    </span>
                  )}
                  {pub.expectedYear && (
                    <span className="font-mono text-[11px] text-stone-400">{pub.expectedYear}</span>
                  )}
                  <span className={`rounded border px-2 py-0.5 text-[10px] font-semibold ${pubStatusColors[pub.status] ?? pubStatusColors.planned}`}>
                    {statusLabel(pub.status)}
                  </span>
                  <span className="text-xs text-stone-400 transition-transform group-open:rotate-180">▼</span>
                </div>
              </summary>

              {/* Expanded: full edit form */}
              <div className="border-t border-stone-100 bg-stone-50/50 px-5 pb-5 pt-4 space-y-3">
                {/* DOI / URL quick links */}
                {(pub.doi || pub.url) && (
                  <div className="flex flex-wrap gap-3">
                    {pub.doi && (
                      <a href={`https://doi.org/${pub.doi}`} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-indigo-600 underline hover:text-indigo-800">
                        DOI: {pub.doi}
                      </a>
                    )}
                    {pub.url && (
                      <a href={pub.url} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-indigo-600 underline hover:text-indigo-800">
                        {isUk ? "Посилання →" : "Link →"}
                      </a>
                    )}
                  </div>
                )}
                {pub.note && (
                  <p className="text-xs text-stone-500 italic">{pub.note}</p>
                )}

                {canManage && (
                  <form action={updatePublication} className="space-y-3 border-t border-stone-200 pt-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-stone-400">
                      {isUk ? "Редагувати" : "Edit"}
                    </p>
                    <input type="hidden" name="locale" value={locale} />
                    <input type="hidden" name="projectId" value={projectId} />
                    <input type="hidden" name="pubId" value={pub._id} />

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <label className="mb-1 block text-xs font-semibold text-stone-600">{isUk ? "Назва *" : "Title *"}</label>
                        <textarea name="title" rows={2} required defaultValue={pub.title} className="input-control w-full text-sm" />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-stone-600">{isUk ? "Тип" : "Type"}</label>
                        <select name="type" defaultValue={pub.type} className="input-control w-full text-sm">
                          {PUB_TYPES.map((t) => (<option key={t} value={t}>{typeLabel(t)}</option>))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-stone-600">{isUk ? "Статус" : "Status"}</label>
                        <select name="status" defaultValue={pub.status} className="input-control w-full text-sm">
                          {PUB_STATUSES.map((s) => (<option key={s} value={s}>{statusLabel(s)}</option>))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-stone-600">{isUk ? "Автори" : "Authors"}</label>
                        <input type="text" name="authors" defaultValue={pub.authors} className="input-control w-full text-sm" />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-stone-600">{isUk ? "Журнал" : "Journal"}</label>
                        <input type="text" name="journal" defaultValue={pub.journal} className="input-control w-full text-sm" />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-stone-600">{isUk ? "Рік" : "Year"}</label>
                        <input type="number" name="expectedYear" defaultValue={pub.expectedYear ?? ""} min={2020} max={2040} className="input-control w-full text-sm" />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-stone-600">{isUk ? "Етап" : "Stage"}</label>
                        <select name="stageId" defaultValue={pub.stageId ?? ""} className="input-control w-full text-sm">
                          <option value="">—</option>
                          {stages.map((s) => (<option key={s._id} value={s._id ?? ""}>Е{s.stageNumber}: {s.title.slice(0, 30)}</option>))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-stone-600">DOI</label>
                        <input type="text" name="doi" defaultValue={pub.doi} className="input-control w-full text-sm" placeholder="10.xxxx/..." />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-stone-600">URL</label>
                        <input type="url" name="url" defaultValue={pub.url} className="input-control w-full text-sm" placeholder="https://..." />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="mb-1 block text-xs font-semibold text-stone-600">{isUk ? "Примітка" : "Note"}</label>
                        <textarea name="note" rows={2} defaultValue={pub.note} className="input-control w-full text-sm" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <ConfirmDeleteButton
                        formAction={deletePublication}
                        message={isUk ? "Видалити публікацію?" : "Delete this publication?"}
                        label={`🗑 ${isUk ? "Видалити" : "Delete"}`}
                        className="text-xs font-semibold text-stone-400 underline hover:text-rose-600"
                      />
                      <button type="submit" className="control-primary text-xs">
                        {isUk ? "Зберегти зміни" : "Save changes"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
