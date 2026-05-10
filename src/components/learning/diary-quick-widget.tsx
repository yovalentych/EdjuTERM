"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  NotebookPen, X, ChevronDown, CalendarCheck, CheckCircle2,
  Users2, FilePlus, MessageSquare, Inbox, PenLine, Send,
} from "lucide-react";
import { useState, useTransition, useRef, useEffect } from "react";
import { saveDiaryEntry } from "@/app/actions";
import type { DiaryEntryType } from "@/lib/schemas";

const TYPE_OPTIONS: Array<{ code: DiaryEntryType; label: string; icon: React.ElementType; color: string }> = [
  { code: "note",             label: "Нотатка",           icon: PenLine,       color: "text-blue-600 bg-blue-50 border-blue-200" },
  { code: "meeting",          label: "Зустріч",           icon: Users2,        color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  { code: "application",      label: "Заява",             icon: FilePlus,      color: "text-orange-600 bg-orange-50 border-orange-200" },
  { code: "info_received",    label: "Отримана інфо",     icon: MessageSquare, color: "text-violet-600 bg-violet-50 border-violet-200" },
  { code: "request_received", label: "Запит",             icon: Inbox,         color: "text-amber-600 bg-amber-50 border-amber-200" },
  { code: "task_done",        label: "Виконано",          icon: CheckCircle2,  color: "text-teal-600 bg-teal-50 border-teal-200" },
  { code: "event",            label: "Подія",             icon: CalendarCheck, color: "text-rose-600 bg-rose-50 border-rose-200" },
];

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function DiaryQuickWidget({
  projectId,
  userId,
}: {
  projectId: string;
  userId: string;
}) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<DiaryEntryType>("note");
  const [date, setDate] = useState(todayIso());
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const titleRef = useRef<HTMLInputElement>(null);
  const [bottomOffset, setBottomOffset] = useState(20);

  // Keep widget above footer
  useEffect(() => {
    const update = () => {
      const footer = document.querySelector("footer");
      if (!footer) return;
      const visible = Math.max(0, window.innerHeight - footer.getBoundingClientRect().top);
      setBottomOffset(visible + 20);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => titleRef.current?.focus(), 120);
  }, [open]);

  function reset() {
    setTitle("");
    setBody("");
    setType("note");
    setDate(todayIso());
    setError("");
    setSaved(false);
  }

  function handleClose() {
    setOpen(false);
    reset();
  }

  function handleSubmit() {
    const t = title.trim();
    if (!t || isPending) return;
    setError("");
    const fd = new FormData();
    fd.set("projectId", projectId);
    fd.set("userId", userId);
    fd.set("date", date);
    fd.set("type", type);
    fd.set("title", t);
    fd.set("body", body.trim());

    startTransition(async () => {
      const res = await saveDiaryEntry(fd);
      if (!res.ok) {
        setError("Не вдалося зберегти. Спробуйте ще раз.");
        return;
      }
      setSaved(true);
      setTimeout(reset, 1400);
    });
  }

  const selectedType = TYPE_OPTIONS.find((o) => o.code === type)!;

  return (
    <div
      className="fixed z-50 flex flex-col items-end gap-2"
      style={{ bottom: `${bottomOffset + 68}px`, right: "20px" }}
    >
      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="diary-panel"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 420, damping: 30 }}
            className="w-[340px] max-w-[calc(100vw-2.5rem)] overflow-hidden border border-violet-100 bg-white shadow-[0_20px_56px_rgba(109,40,217,0.16)]"
          >
            {/* Header */}
            <div className="flex shrink-0 items-center gap-3 border-b border-violet-100 bg-gradient-to-r from-violet-50 to-indigo-50 px-4 py-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-violet-700 shadow-sm">
                <NotebookPen className="h-4 w-4" />
              </div>
              <p className="flex-1 truncate text-sm font-semibold text-stone-900">
                Швидкий запис
              </p>
              <button
                onClick={handleClose}
                className="flex h-7 w-7 items-center justify-center rounded-full text-stone-400 transition hover:bg-white hover:text-violet-700"
                aria-label="Закрити"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              {/* Type chips */}
              <div className="flex flex-wrap gap-1.5">
                {TYPE_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const active = opt.code === type;
                  return (
                    <button
                      key={opt.code}
                      type="button"
                      onClick={() => setType(opt.code)}
                      className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                        active ? opt.color + " shadow-sm" : "border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700"
                      }`}
                    >
                      <Icon className="h-3 w-3" />
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              {/* Date + title row */}
              <div className="flex gap-2">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-[130px] shrink-0 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-700 outline-none focus:border-violet-400 focus:bg-white transition"
                />
                <input
                  ref={titleRef}
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value.slice(0, 300))}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
                  placeholder="Заголовок…"
                  className="flex-1 min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none placeholder:text-slate-400 focus:border-violet-400 focus:bg-white transition"
                />
              </div>

              {/* Body */}
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value.slice(0, 4000))}
                placeholder="Деталі (необов'язково)…"
                rows={3}
                className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-900 outline-none placeholder:text-slate-400 focus:border-violet-400 focus:bg-white transition"
              />

              {error && (
                <p className="text-xs text-rose-600">{error}</p>
              )}

              {/* Submit */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!title.trim() || isPending}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40"
              >
                {saved ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Збережено!
                  </>
                ) : isPending ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Зберегти запис
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle button */}
      <motion.button
        whileTap={{ scale: 0.93 }}
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-[0_10px_28px_rgba(109,40,217,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(99,102,241,0.32)]"
        aria-label="Щоденник діяльності"
        title="Щоденник діяльності"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.span
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.14 }}
            >
              <X className="h-5 w-5" />
            </motion.span>
          ) : (
            <motion.span
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.14 }}
            >
              <NotebookPen className="h-5 w-5" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
