"use client";

import { Archive, ArchiveRestore, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { archiveRecord, deleteRecord, restoreRecord } from "@/app/actions";

// ── Archive / Restore ─────────────────────────────────────────────────────────

export function ArchiveRecordButton({
  recordId,
  locale,
  returnTo,
  isArchived,
}: {
  recordId: string;
  locale: string;
  returnTo: string;
  isArchived: boolean;
}) {
  const action = isArchived ? restoreRecord : archiveRecord;
  const label = isArchived ? "Відновити" : "Архівувати";
  const Icon = isArchived ? ArchiveRestore : Archive;

  return (
    <form action={action}>
      <input type="hidden" name="recordId" value={recordId} />
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <button
        type="submit"
        title={label}
        className={`flex items-center gap-1.5 rounded border px-2.5 py-1.5 text-xs font-medium transition
          ${isArchived
            ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            : "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"}`}
      >
        <Icon className="h-3.5 w-3.5" />
        {label}
      </button>
    </form>
  );
}

// ── Hard delete (with confirmation dialog) ────────────────────────────────────

export function DeleteRecordButton({
  recordId,
  recordTitle,
  locale,
  returnTo,
}: {
  recordId: string;
  recordTitle: string;
  locale: string;
  returnTo: string;
}) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Видалити назавжди"
        className="flex items-center gap-1.5 rounded border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-medium text-rose-700 transition hover:bg-rose-100"
      >
        <Trash2 className="h-3.5 w-3.5" />
        Видалити
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="w-full max-w-sm rounded-lg border border-rose-200 bg-white shadow-xl">
            <div className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                  <Trash2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-stone-900">Видалити назавжди?</p>
                  <p className="mt-0.5 text-sm text-stone-500">Цю дію неможливо скасувати.</p>
                </div>
              </div>
              <div className="mt-4 rounded border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-800">
                «{recordTitle}»
              </div>
              <p className="mt-3 text-xs text-stone-400">
                Запис видаляється лише якщо він вже архівований. Всі дії фіксуються в журналі аудиту.
              </p>
            </div>
            <div className="flex justify-end gap-2 border-t border-stone-100 px-5 py-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="control px-4 py-2 text-sm font-medium"
              >
                Скасувати
              </button>
              <form ref={formRef} action={deleteRecord}>
                <input type="hidden" name="recordId" value={recordId} />
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="returnTo" value={returnTo} />
                <button
                  type="submit"
                  className="rounded border border-rose-600 bg-rose-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-700"
                >
                  Видалити назавжди
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
