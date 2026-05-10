import {
  FileText,
  Database,
  Code2,
  ShieldCheck,
  ClipboardList,
  BarChart3,
  GraduationCap,
  Wrench,
  Package,
} from "lucide-react";
import type { Dictionary } from "@/lib/i18n";
import type { ResearchDeliverable, ResearchStage, DeliverableType, DeliverableStatus } from "@/lib/schemas";
import { addDeliverable, updateDeliverable, deleteDeliverable } from "@/app/actions";
import { ConfirmDeleteButton } from "@/components/ui";

const delivTypeIcons: Record<DeliverableType, React.ComponentType<{ className?: string }>> = {
  publication: FileText,
  dataset: Database,
  software: Code2,
  patent: ShieldCheck,
  protocol: ClipboardList,
  report: BarChart3,
  training: GraduationCap,
  equipment: Wrench,
  other: Package,
};

const delivTypeColors: Record<DeliverableType, string> = {
  publication: "text-indigo-600 bg-indigo-50 border-indigo-200",
  dataset: "text-teal-600 bg-teal-50 border-teal-200",
  software: "text-violet-600 bg-violet-50 border-violet-200",
  patent: "text-amber-600 bg-amber-50 border-amber-200",
  protocol: "text-blue-600 bg-blue-50 border-blue-200",
  report: "text-stone-600 bg-stone-100 border-stone-200",
  training: "text-sky-600 bg-sky-50 border-sky-200",
  equipment: "text-orange-600 bg-orange-50 border-orange-200",
  other: "text-stone-500 bg-stone-50 border-stone-200",
};

const delivStatusColors: Record<DeliverableStatus, string> = {
  planned: "bg-stone-100 text-stone-600 border-stone-200",
  in_progress: "bg-blue-100 text-blue-700 border-blue-200",
  delayed: "bg-rose-100 text-rose-700 border-rose-200",
  completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

const DELIV_TYPES = ["publication", "dataset", "software", "patent", "protocol", "report", "training", "equipment", "other"] as const;
const DELIV_STATUSES = ["planned", "in_progress", "delayed", "completed"] as const;

export function DeliverablesTab({
  deliverables,
  stages,
  dictionary,
  locale,
  projectId,
  canManage,
}: {
  deliverables: ResearchDeliverable[];
  stages: ResearchStage[];
  dictionary: Dictionary;
  locale: string;
  projectId: string;
  canManage: boolean;
}) {
  const d = dictionary.researchPlan;
  const isUk = locale === "uk";

  const dd = (d as { deliverableTypes?: Record<string, string>; deliverableStatuses?: Record<string, string> });
  const typeLabel = (t: string) => dd.deliverableTypes?.[t] ?? t;
  const statusLabel = (s: string) => dd.deliverableStatuses?.[s] ?? s;
  const stageName = (stageId: string) => {
    const s = stages.find((st) => st._id === stageId);
    return s ? `${isUk ? "Е" : "S"}${s.stageNumber}: ${s.title.slice(0, 35)}` : "";
  };

  const total = deliverables.length;
  const completed = deliverables.filter((d) => d.status === "completed").length;
  const inProgress = deliverables.filter((d) => d.status === "in_progress").length;
  const delayed = deliverables.filter((d) => d.status === "delayed").length;
  const completePct = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Group by stage
  const grouped: { stage: ResearchStage | null; items: ResearchDeliverable[] }[] = [];
  const withStage = deliverables.filter((d) => d.stageId);
  const withoutStage = deliverables.filter((d) => !d.stageId);

  stages.forEach((stage) => {
    const items = withStage.filter((d) => d.stageId === stage._id);
    if (items.length > 0) grouped.push({ stage, items });
  });
  if (withoutStage.length > 0) grouped.push({ stage: null, items: withoutStage });

  return (
    <div className="space-y-5">
      {/* Stats */}
      {total > 0 && (
        <div className="flex flex-wrap gap-3">
          <div className="rounded border border-stone-200 bg-white px-4 py-2.5 text-center shadow-sm">
            <p className="text-2xl font-bold text-stone-900">{total}</p>
            <p className="text-xs text-stone-500">{isUk ? "Всього" : "Total"}</p>
          </div>
          <div className="rounded border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-center shadow-sm">
            <p className="text-2xl font-bold text-emerald-700">{completed}</p>
            <p className="text-xs text-emerald-600">{statusLabel("completed")}</p>
          </div>
          {inProgress > 0 && (
            <div className="rounded border border-blue-200 bg-blue-50 px-4 py-2.5 text-center shadow-sm">
              <p className="text-2xl font-bold text-blue-700">{inProgress}</p>
              <p className="text-xs text-blue-600">{statusLabel("in_progress")}</p>
            </div>
          )}
          {delayed > 0 && (
            <div className="rounded border border-rose-200 bg-rose-50 px-4 py-2.5 text-center shadow-sm">
              <p className="text-2xl font-bold text-rose-700">{delayed}</p>
              <p className="text-xs text-rose-600">{statusLabel("delayed")}</p>
            </div>
          )}
          <div className="flex min-w-40 flex-col justify-center rounded border border-stone-200 bg-white px-4 py-2.5 shadow-sm">
            <div className="mb-1 flex justify-between text-xs text-stone-500">
              <span>{isUk ? "Виконано" : "Completed"}</span>
              <span className="font-mono font-semibold">{completePct}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-stone-200">
              <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${completePct}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* Add form */}
      {canManage && (
        <details className="surface group overflow-hidden rounded-lg border border-stone-200" open={deliverables.length === 0}>
          <summary className="flex cursor-pointer select-none items-center gap-2 px-5 py-4 font-semibold text-stone-700 hover:bg-stone-50">
            <span className="font-mono text-indigo-600 transition-transform group-open:rotate-45">+</span>
            {String((d as Record<string, unknown>).addDeliverable ?? (isUk ? "Додати результат" : "Add deliverable"))}
          </summary>
          <div className="border-t border-stone-100 px-5 pb-6 pt-4">
            <form action={addDeliverable} className="space-y-4">
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="projectId" value={projectId} />
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-stone-600">{isUk ? "Тип" : "Type"}</label>
                  <select name="type" className="input-control w-full">
                    {DELIV_TYPES.map((t) => (<option key={t} value={t}>{typeLabel(t)}</option>))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-stone-600">{isUk ? "Статус" : "Status"}</label>
                  <select name="status" className="input-control w-full">
                    {DELIV_STATUSES.map((s) => (<option key={s} value={s}>{statusLabel(s)}</option>))}
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-stone-600">{isUk ? "Назва *" : "Title *"}</label>
                <input type="text" name="title" required className="input-control w-full" placeholder={isUk ? "Наприклад: Звіт про результати 1-го етапу" : "e.g. Stage 1 progress report"} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-stone-600">{isUk ? "Опис" : "Description"}</label>
                <textarea name="description" rows={2} className="input-control w-full" placeholder={isUk ? "Що саме є результатом?" : "What specifically is the deliverable?"} />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-stone-600">{isUk ? "Планова дата" : "Planned date"}</label>
                  <input type="date" name="plannedDate" className="input-control w-full" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-stone-600">{isUk ? "Етап" : "Stage"}</label>
                  <select name="stageId" className="input-control w-full">
                    <option value="">—</option>
                    {stages.map((s) => (<option key={s._id} value={s._id ?? ""}>Е{s.stageNumber}: {s.title.slice(0, 30)}</option>))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-stone-600">URL / {isUk ? "посилання" : "link"}</label>
                  <input type="url" name="link" className="input-control w-full" placeholder="https://..." />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-stone-600">{isUk ? "Примітка" : "Note"}</label>
                <textarea name="note" rows={2} className="input-control w-full" />
              </div>
              <div className="flex justify-end">
                <button type="submit" className="control-primary">
                  {String((d as Record<string, unknown>).saveDeliverable ?? (isUk ? "Зберегти результат" : "Save deliverable"))}
                </button>
              </div>
            </form>
          </div>
        </details>
      )}

      {/* List */}
      {deliverables.length === 0 ? (
        <div className="rounded-lg border border-dashed border-stone-300 bg-stone-50 px-6 py-10 text-center">
          <p className="text-2xl">📦</p>
          <p className="mt-2 text-sm font-semibold text-stone-600">
            {isUk ? "Результатів ще не додано" : "No deliverables yet"}
          </p>
          <p className="mt-1 text-xs text-stone-400">
            {isUk
              ? "Додайте звіти, датасети, програмне забезпечення, патенти та інші результати проєкту."
              : "Add reports, datasets, software, patents and other project outputs."}
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {grouped.map(({ stage, items }) => (
            <div key={stage?._id ?? "no-stage"} className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
              <div className="flex items-center gap-2 border-b border-stone-100 bg-stone-50 px-5 py-2.5">
                {stage ? (
                  <>
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                      {stage.stageNumber}
                    </span>
                    <span className="truncate text-xs font-semibold text-stone-700">{stage.title}</span>
                  </>
                ) : (
                  <span className="text-xs font-semibold text-stone-400">{isUk ? "Без прив'язки до етапу" : "Not linked to a stage"}</span>
                )}
                <span className="ml-auto rounded-full bg-stone-200 px-2 py-0.5 text-[10px] font-mono text-stone-600">
                  {items.length}
                </span>
              </div>

              <div className="divide-y divide-stone-100">
                {items.map((deliv) => {
                  const Icon = delivTypeIcons[deliv.type] ?? Package;
                  const typeColor = delivTypeColors[deliv.type] ?? delivTypeColors.other;
                  const statusColor = delivStatusColors[deliv.status] ?? delivStatusColors.planned;

                  return (
                    <details key={deliv._id} className="group">
                      <summary className="flex cursor-pointer select-none items-start gap-3 px-5 py-3.5 hover:bg-stone-50">
                        <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded border ${typeColor}`}>
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-stone-900 leading-snug">{deliv.title}</p>
                          {deliv.description && (
                            <p className="mt-0.5 truncate text-xs text-stone-400">{deliv.description}</p>
                          )}
                        </div>
                        <div className="ml-auto flex shrink-0 flex-col items-end gap-1.5">
                          {deliv.plannedDate && (
                            <span className="font-mono text-[11px] text-stone-400">{deliv.plannedDate}</span>
                          )}
                          <span className={`rounded border px-2 py-0.5 text-[10px] font-semibold ${statusColor}`}>
                            {statusLabel(deliv.status)}
                          </span>
                          <span className="text-xs text-stone-400 transition-transform group-open:rotate-180">▼</span>
                        </div>
                      </summary>

                      {/* Expanded */}
                      <div className="border-t border-stone-100 bg-stone-50/50 px-5 pb-5 pt-4 space-y-3">
                        {deliv.link && (
                          <a href={deliv.link} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-indigo-600 underline hover:text-indigo-800">
                            {isUk ? "Відкрити посилання →" : "Open link →"}
                          </a>
                        )}
                        {deliv.note && (
                          <p className="text-xs text-stone-500 italic">{deliv.note}</p>
                        )}

                        {canManage && (
                          <form action={updateDeliverable} className="space-y-3 border-t border-stone-200 pt-3">
                            <p className="text-xs font-bold uppercase tracking-wider text-stone-400">
                              {isUk ? "Редагувати" : "Edit"}
                            </p>
                            <input type="hidden" name="locale" value={locale} />
                            <input type="hidden" name="projectId" value={projectId} />
                            <input type="hidden" name="delivId" value={deliv._id} />

                            <div className="grid gap-3 sm:grid-cols-2">
                              <div className="sm:col-span-2">
                                <label className="mb-1 block text-xs font-semibold text-stone-600">{isUk ? "Назва *" : "Title *"}</label>
                                <input type="text" name="title" required defaultValue={deliv.title} className="input-control w-full text-sm" />
                              </div>
                              <div>
                                <label className="mb-1 block text-xs font-semibold text-stone-600">{isUk ? "Тип" : "Type"}</label>
                                <select name="type" defaultValue={deliv.type} className="input-control w-full text-sm">
                                  {DELIV_TYPES.map((t) => (<option key={t} value={t}>{typeLabel(t)}</option>))}
                                </select>
                              </div>
                              <div>
                                <label className="mb-1 block text-xs font-semibold text-stone-600">{isUk ? "Статус" : "Status"}</label>
                                <select name="status" defaultValue={deliv.status} className="input-control w-full text-sm">
                                  {DELIV_STATUSES.map((s) => (<option key={s} value={s}>{statusLabel(s)}</option>))}
                                </select>
                              </div>
                              <div>
                                <label className="mb-1 block text-xs font-semibold text-stone-600">{isUk ? "Планова дата" : "Planned date"}</label>
                                <input type="date" name="plannedDate" defaultValue={deliv.plannedDate} className="input-control w-full text-sm" />
                              </div>
                              <div>
                                <label className="mb-1 block text-xs font-semibold text-stone-600">{isUk ? "Етап" : "Stage"}</label>
                                <select name="stageId" defaultValue={deliv.stageId ?? ""} className="input-control w-full text-sm">
                                  <option value="">—</option>
                                  {stages.map((s) => (<option key={s._id} value={s._id ?? ""}>Е{s.stageNumber}: {s.title.slice(0, 25)}</option>))}
                                </select>
                              </div>
                              <div>
                                <label className="mb-1 block text-xs font-semibold text-stone-600">URL</label>
                                <input type="url" name="link" defaultValue={deliv.link} className="input-control w-full text-sm" placeholder="https://..." />
                              </div>
                              <div className="sm:col-span-2">
                                <label className="mb-1 block text-xs font-semibold text-stone-600">{isUk ? "Опис" : "Description"}</label>
                                <textarea name="description" rows={2} defaultValue={deliv.description} className="input-control w-full text-sm" />
                              </div>
                              <div className="sm:col-span-2">
                                <label className="mb-1 block text-xs font-semibold text-stone-600">{isUk ? "Примітка" : "Note"}</label>
                                <textarea name="note" rows={2} defaultValue={deliv.note} className="input-control w-full text-sm" />
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-3">
                              <ConfirmDeleteButton
                                formAction={deleteDeliverable}
                                message={isUk ? "Видалити результат?" : "Delete this deliverable?"}
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
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
