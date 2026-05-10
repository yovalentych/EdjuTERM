"use client";

import { useEffect, useRef } from "react";
import { AlertTriangle } from "lucide-react";

export function ConfirmModal({
  open,
  title = "Підтвердіть дію",
  message,
  confirmLabel = "Видалити",
  cancelLabel = "Скасувати",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => cancelRef.current?.focus(), 30);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onCancel]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-hidden={!open}
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-200 ${
        open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-[3px]"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Card */}
      <div
        className={`relative z-10 w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-[0_20px_60px_-10px_rgba(0,0,0,0.25)] ring-1 ring-black/5 transition-all duration-200 ease-out ${
          open
            ? "scale-100 opacity-100 translate-y-0"
            : "scale-95 opacity-0 -translate-y-1"
        }`}
      >
        {/* Gradient top bar */}
        <div className="h-[3px] w-full bg-gradient-to-r from-rose-400 via-rose-500 to-rose-600" />

        <div className="p-6">
          <div className="flex items-start gap-4">
            {/* Warning icon */}
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rose-50 ring-2 ring-rose-100">
              <AlertTriangle className="h-5 w-5 text-rose-500" />
            </div>

            {/* Text */}
            <div className="min-w-0 flex-1 pt-1">
              <h3 className="text-base font-semibold leading-snug text-stone-900">
                {title}
              </h3>
              {message && (
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
                  {message}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex justify-end gap-2.5">
            <button
              ref={cancelRef}
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition-all duration-150 hover:border-slate-300 hover:bg-slate-50 active:scale-95"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-rose-600 active:scale-95"
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
