"use client";

import { useRef, useState, useTransition } from "react";
import { Plus, Loader2, Check, X } from "lucide-react";
import { addResearchStage, addTaskAction } from "@/app/actions";

// ── Add Stage ─────────────────────────────────────────────────────────────────

export function AddStageInline({
  dataId, color, isUk,
}: { dataId: string; color: string; isUk: boolean }) {
  const [open, setOpen] = useState(false);
  const [busy, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(fd: FormData) {
    startTransition(async () => {
      await addResearchStage(fd);
      formRef.current?.reset();
      setOpen(false);
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold text-white transition hover:opacity-90"
        style={{ background: color }}
      >
        <Plus className="h-4 w-4" />
        {isUk ? "Додати етап" : "Add stage"}
      </button>
    );
  }

  return (
    <form ref={formRef} action={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <input type="hidden" name="projectId" value={dataId} />
      <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
        {isUk ? "Новий етап дослідження" : "New research stage"}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-semibold text-slate-600">
            {isUk ? "Назва етапу *" : "Stage title *"}
          </label>
          <input
            name="title"
            required
            autoFocus
            placeholder={isUk ? "н-р: Огляд літератури" : "e.g. Literature review"}
            className="input-control w-full text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">
            {isUk ? "Початок" : "Start date"}
          </label>
          <input type="date" name="startDate" className="input-control w-full text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">
            {isUk ? "Дедлайн" : "End date"}
          </label>
          <input type="date" name="endDate" className="input-control w-full text-sm" />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-semibold text-slate-600">
            {isUk ? "Цілі (необов'язково)" : "Goals (optional)"}
          </label>
          <textarea
            name="goals"
            rows={2}
            placeholder={isUk ? "Основні цілі цього етапу…" : "Main goals for this stage…"}
            className="input-control w-full resize-none text-sm"
          />
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <button
          type="submit"
          disabled={busy}
          className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
          style={{ background: color }}
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          {isUk ? "Зберегти" : "Save"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-50"
        >
          <X className="h-3.5 w-3.5" />
          {isUk ? "Скасувати" : "Cancel"}
        </button>
      </div>
    </form>
  );
}

// ── Add Task ──────────────────────────────────────────────────────────────────

export function AddTaskInline({
  dataId, isUk,
}: { dataId: string; isUk: boolean }) {
  const [open, setOpen] = useState(false);
  const [busy, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(fd: FormData) {
    startTransition(async () => {
      await addTaskAction(fd);
      formRef.current?.reset();
      setOpen(false);
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-amber-600"
      >
        <Plus className="h-4 w-4" />
        {isUk ? "Додати задачу" : "Add task"}
      </button>
    );
  }

  return (
    <form ref={formRef} action={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <input type="hidden" name="projectId" value={dataId} />
      <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
        {isUk ? "Нова задача" : "New task"}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-semibold text-slate-600">
            {isUk ? "Назва *" : "Title *"}
          </label>
          <input
            name="title"
            required
            autoFocus
            placeholder={isUk ? "н-р: Написати 1-й розділ" : "e.g. Write chapter 1"}
            className="input-control w-full text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">
            {isUk ? "Дедлайн" : "Due date"}
          </label>
          <input type="date" name="dueDate" className="input-control w-full text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">
            {isUk ? "Пріоритет" : "Priority"}
          </label>
          <select name="priority" className="input-control w-full text-sm">
            <option value="low">{isUk ? "Низький" : "Low"}</option>
            <option value="medium" selected>{isUk ? "Середній" : "Medium"}</option>
            <option value="high">{isUk ? "Високий" : "High"}</option>
            <option value="critical">{isUk ? "Критичний" : "Critical"}</option>
          </select>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <button
          type="submit"
          disabled={busy}
          className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-white disabled:opacity-60 hover:bg-amber-600"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          {isUk ? "Зберегти" : "Save"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-50"
        >
          <X className="h-3.5 w-3.5" />
          {isUk ? "Скасувати" : "Cancel"}
        </button>
      </div>
    </form>
  );
}
