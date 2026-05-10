"use client";

import { useState, useEffect, useCallback } from "react";
import type { Report, ResearchStage } from "@/lib/schemas";
import type { ReportExportData } from "@/lib/report-export-data";
import {
  parseSectionMeta,
  serializeGoals,
  serializeTimeline,
  serializeResults,
  serializePublications,
  serializeFinancial,
  serializeProblems,
  serializePlans,
  uid,
  RESULT_TYPES,
  RESULT_TYPE_LABELS,
  OVERALL_STATUS_LABELS,
  STAGE_STATUS_LABELS,
  SEVERITY_LABELS,
  CATEGORY_LABELS,
  SOLUTION_STATUS_LABELS,
  FINANCIAL_MODE_LABELS,
  FINANCIAL_STANDARD_PHRASES,
  PROBLEM_SEVERITIES,
  PROBLEM_CATEGORIES,
  SOLUTION_STATUSES,
  type ReportSectionMeta,
  type GoalItem,
  type TimelineMeta,
  type ResultItem,
  type PublicationsMeta,
  type FinancialMeta,
  type ProblemItem,
  type PlanItem,
  type SolutionItem,
  type OverallStatus,
  type StageComplianceStatus,
  type ResultType,
  type ProblemSeverity,
  type ProblemCategory,
  type SolutionStatus,
  type FinancialMode,
} from "@/lib/report-section-meta";

// ── helpers ──────────────────────────────────────────────────────────────────

function Chip({ children, color = "stone" }: { children: React.ReactNode; color?: string }) {
  const cls: Record<string, string> = {
    stone: "bg-stone-100 text-stone-600 border-stone-200",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    rose: "bg-rose-50 text-rose-600 border-rose-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
  };
  return (
    <span className={`inline-block rounded border px-1.5 py-0.5 text-xs font-semibold ${cls[color] ?? cls.stone}`}>
      {children}
    </span>
  );
}

function SectionHeader({ icon, title, subtitle }: { icon: string; title: string; subtitle?: string }) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <span className="mt-0.5 text-xl">{icon}</span>
      <div>
        <h3 className="font-semibold text-stone-900">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-stone-400">{subtitle}</p>}
      </div>
    </div>
  );
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-2 flex items-center gap-1.5 rounded border border-dashed border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-500 transition hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700"
    >
      <span className="text-base leading-none">+</span> {label}
    </button>
  );
}

function DeleteBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="ml-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded text-stone-300 transition hover:bg-rose-50 hover:text-rose-500"
      title="Видалити"
    >
      ×
    </button>
  );
}

// ── 1. Goals ─────────────────────────────────────────────────────────────────

function GoalsSectionEditor({
  items,
  onChange,
}: {
  items: GoalItem[];
  onChange: (items: GoalItem[]) => void;
}) {
  const add = (type: "goal" | "objective") =>
    onChange([...items, { id: uid(), type, text: "" }]);
  const remove = (id: string) => onChange(items.filter((i) => i.id !== id));
  const update = (id: string, text: string) =>
    onChange(items.map((i) => (i.id === id ? { ...i, text } : i)));
  const toggleType = (id: string) =>
    onChange(
      items.map((i) =>
        i.id === id ? { ...i, type: i.type === "goal" ? "objective" : "goal" } : i,
      ),
    );

  const goals = items.filter((i) => i.type === "goal");
  const objectives = items.filter((i) => i.type === "objective");

  return (
    <div>
      <SectionHeader icon="🎯" title="Мета та завдання дослідження" subtitle="Чітко сформулюйте мету та конкретні завдання роботи" />

      {items.length === 0 && (
        <p className="mb-3 rounded bg-stone-50 px-4 py-3 text-xs text-stone-400 italic">
          Немає жодного елемента. Додайте мету або завдання.
        </p>
      )}

      {goals.length > 0 && (
        <div className="mb-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-400">Мета</p>
          <div className="space-y-2">
            {goals.map((item) => (
              <div key={item.id} className="flex items-start gap-2">
                <span
                  className="mt-2.5 cursor-pointer"
                  onClick={() => toggleType(item.id)}
                  title="Переключити тип"
                >
                  <Chip color="indigo">Мета</Chip>
                </span>
                <input
                  type="text"
                  value={item.text}
                  onChange={(e) => update(item.id, e.target.value)}
                  placeholder="Сформулюйте мету дослідження…"
                  className="input-control flex-1"
                />
                <DeleteBtn onClick={() => remove(item.id)} />
              </div>
            ))}
          </div>
        </div>
      )}

      {objectives.length > 0 && (
        <div className="mb-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-400">Завдання</p>
          <div className="space-y-2">
            {objectives.map((item, idx) => (
              <div key={item.id} className="flex items-start gap-2">
                <span
                  className="mt-2.5 cursor-pointer"
                  onClick={() => toggleType(item.id)}
                  title="Переключити тип"
                >
                  <Chip color="stone">{idx + 1}</Chip>
                </span>
                <input
                  type="text"
                  value={item.text}
                  onChange={(e) => update(item.id, e.target.value)}
                  placeholder="Сформулюйте завдання…"
                  className="input-control flex-1"
                />
                <DeleteBtn onClick={() => remove(item.id)} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <AddButton label="Додати мету" onClick={() => add("goal")} />
        <AddButton label="Додати завдання" onClick={() => add("objective")} />
      </div>
    </div>
  );
}

// ── 2. Timeline ───────────────────────────────────────────────────────────────

const OVERALL_STATUS_COLORS: Record<OverallStatus, string> = {
  on_track: "border-emerald-400 text-emerald-700 bg-emerald-50",
  minor_delays: "border-amber-400 text-amber-700 bg-amber-50",
  significant_delays: "border-rose-400 text-rose-700 bg-rose-50",
  ahead: "border-indigo-400 text-indigo-700 bg-indigo-50",
};

const STAGE_STATUS_COLORS: Record<StageComplianceStatus, string> = {
  on_track: "text-emerald-700 bg-emerald-50",
  delayed: "text-amber-700 bg-amber-50",
  completed: "text-indigo-700 bg-indigo-50",
  not_started: "text-stone-500 bg-stone-50",
};

function TimelineSectionEditor({
  meta,
  stages,
  onChange,
}: {
  meta: TimelineMeta;
  stages: ResearchStage[];
  onChange: (m: TimelineMeta) => void;
}) {
  const setOverall = (s: OverallStatus) => onChange({ ...meta, overallStatus: s });
  const setStageStatus = (id: string, s: StageComplianceStatus) =>
    onChange({ ...meta, stageStatuses: { ...meta.stageStatuses, [id]: s } });

  return (
    <div>
      <SectionHeader icon="📅" title="Дотримання плану-графіку" subtitle="Оцініть загальний стан виконання та статус кожного етапу" />

      <div className="mb-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-400">Загальний статус</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(Object.keys(OVERALL_STATUS_LABELS) as OverallStatus[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setOverall(s)}
              className={`rounded border p-2.5 text-xs font-medium transition ${
                meta.overallStatus === s
                  ? OVERALL_STATUS_COLORS[s]
                  : "border-stone-200 bg-white text-stone-500 hover:border-stone-300 hover:bg-stone-50"
              }`}
            >
              {OVERALL_STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {stages.length > 0 && (
        <div className="mb-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-400">Статус за етапами</p>
          <div className="overflow-hidden rounded-lg border border-stone-200">
            {stages.map((stage, idx) => {
              const stageId = stage._id ?? "";
              const status = (meta.stageStatuses[stageId] ?? "not_started") as StageComplianceStatus;
              return (
                <div
                  key={stageId}
                  className={`flex items-center gap-3 px-4 py-2.5 ${idx < stages.length - 1 ? "border-b border-stone-100" : ""}`}
                >
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded bg-indigo-100 text-xs font-bold text-indigo-700">
                    {stage.stageNumber}
                  </span>
                  <span className="flex-1 truncate text-sm text-stone-700">{stage.title}</span>
                  <select
                    value={status}
                    onChange={(e) => setStageStatus(stageId, e.target.value as StageComplianceStatus)}
                    className={`rounded border border-stone-200 px-2 py-1 text-xs font-medium ${STAGE_STATUS_COLORS[status]}`}
                  >
                    {(Object.keys(STAGE_STATUS_LABELS) as StageComplianceStatus[]).map((s) => (
                      <option key={s} value={s}>{STAGE_STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <label className="mb-1 block text-xs font-semibold text-stone-500">Додаткові пояснення (необов'язково)</label>
        <textarea
          rows={3}
          value={meta.manualNote}
          onChange={(e) => onChange({ ...meta, manualNote: e.target.value })}
          placeholder="Вкажіть причини відхилень, форс-мажорні обставини тощо…"
          className="input-control w-full"
        />
      </div>
    </div>
  );
}

// ── 3. Results ────────────────────────────────────────────────────────────────

function ResultsSectionEditor({
  items,
  onChange,
}: {
  items: ResultItem[];
  onChange: (items: ResultItem[]) => void;
}) {
  const add = () =>
    onChange([...items, { id: uid(), resultType: "theoretical", description: "" }]);
  const remove = (id: string) => onChange(items.filter((i) => i.id !== id));
  const update = (id: string, patch: Partial<ResultItem>) =>
    onChange(items.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  return (
    <div>
      <SectionHeader icon="🔬" title="Наукові результати" subtitle="Опишіть отримані результати за категоріями" />

      {items.length === 0 && (
        <p className="mb-3 rounded bg-stone-50 px-4 py-3 text-xs text-stone-400 italic">
          Немає жодного результату. Натисніть «Додати результат».
        </p>
      )}

      <div className="space-y-3">
        {items.map((item, idx) => (
          <div key={item.id} className="rounded-lg border border-stone-200 bg-white p-4">
            <div className="mb-3 flex items-center gap-2">
              <Chip color="indigo">{idx + 1}</Chip>
              <select
                value={item.resultType}
                onChange={(e) => update(item.id, { resultType: e.target.value as ResultType })}
                className="input-control flex-1 text-xs"
              >
                {RESULT_TYPES.map((t) => (
                  <option key={t} value={t}>{RESULT_TYPE_LABELS[t]}</option>
                ))}
              </select>
              <DeleteBtn onClick={() => remove(item.id)} />
            </div>
            <textarea
              rows={3}
              value={item.description}
              onChange={(e) => update(item.id, { description: e.target.value })}
              placeholder="Опишіть отриманий результат…"
              className="input-control w-full text-sm"
            />
          </div>
        ))}
      </div>

      <AddButton label="Додати результат" onClick={add} />
    </div>
  );
}

// ── 4. Publications ───────────────────────────────────────────────────────────

type PubLike = { _id?: string; title: string; authors?: string; expectedYear?: number | null; type: string };
type EventLike = { _id?: string; title: string; type: string; startDate?: string };

function PublicationsSectionEditor({
  meta,
  publications,
  events,
  onChange,
}: {
  meta: PublicationsMeta;
  publications: PubLike[];
  events: EventLike[];
  onChange: (m: PublicationsMeta) => void;
}) {
  const togglePub = (id: string) => {
    const ids = meta.linkedPublicationIds.includes(id)
      ? meta.linkedPublicationIds.filter((x) => x !== id)
      : [...meta.linkedPublicationIds, id];
    onChange({ ...meta, linkedPublicationIds: ids });
  };
  const toggleEvent = (id: string) => {
    const ids = meta.linkedEventIds.includes(id)
      ? meta.linkedEventIds.filter((x) => x !== id)
      : [...meta.linkedEventIds, id];
    onChange({ ...meta, linkedEventIds: ids });
  };
  const addManual = () =>
    onChange({ ...meta, manualEntries: [...meta.manualEntries, { id: uid(), text: "" }] });
  const removeManual = (id: string) =>
    onChange({ ...meta, manualEntries: meta.manualEntries.filter((e) => e.id !== id) });
  const updateManual = (id: string, text: string) =>
    onChange({
      ...meta,
      manualEntries: meta.manualEntries.map((e) => (e.id === id ? { ...e, text } : e)),
    });

  return (
    <div>
      <SectionHeader icon="📄" title="Публікації та апробації" subtitle="Вкажіть публікації та участь у наукових заходах" />

      <label className="mb-4 flex cursor-pointer items-center gap-3 rounded-lg border border-stone-200 px-4 py-3 transition hover:bg-stone-50">
        <input
          type="checkbox"
          checked={meta.noPublications}
          onChange={(e) => onChange({ ...meta, noPublications: e.target.checked })}
          className="h-4 w-4 accent-rose-500"
        />
        <div>
          <p className="text-sm font-medium text-stone-700">У звітному периоді публікацій та апробацій не було</p>
          <p className="text-xs text-stone-400">Позначте, якщо у звітному периоді не було жодної публікації чи апробації</p>
        </div>
      </label>

      {!meta.noPublications && (
        <>
          {publications.length > 0 && (
            <div className="mb-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-400">
                Публікації з бази даних проєкту
              </p>
              <div className="space-y-1.5 rounded-lg border border-stone-200">
                {publications.map((pub, idx) => {
                  const id = pub._id ?? "";
                  return (
                    <label
                      key={id || idx}
                      className="flex cursor-pointer items-start gap-3 px-4 py-2.5 transition hover:bg-emerald-50"
                    >
                      <input
                        type="checkbox"
                        checked={meta.linkedPublicationIds.includes(id)}
                        onChange={() => togglePub(id)}
                        className="mt-0.5 h-4 w-4 accent-emerald-600"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium text-stone-800">{pub.title}</p>
                        <p className="text-xs text-stone-400">
                          {pub.authors && `${pub.authors} · `}
                          {pub.expectedYear && `${pub.expectedYear} · `}
                          <Chip>{pub.type}</Chip>
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {events.length > 0 && (
            <div className="mb-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-400">
                Наукові заходи
              </p>
              <div className="space-y-1.5 rounded-lg border border-stone-200">
                {events.map((ev, idx) => {
                  const id = ev._id ?? "";
                  return (
                    <label
                      key={id || idx}
                      className="flex cursor-pointer items-start gap-3 px-4 py-2.5 transition hover:bg-blue-50"
                    >
                      <input
                        type="checkbox"
                        checked={meta.linkedEventIds.includes(id)}
                        onChange={() => toggleEvent(id)}
                        className="mt-0.5 h-4 w-4 accent-blue-600"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium text-stone-800">{ev.title}</p>
                        <p className="text-xs text-stone-400">
                          <Chip>{ev.type}</Chip>
                          {ev.startDate && ` · ${new Date(ev.startDate).toLocaleDateString("uk-UA")}`}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {publications.length === 0 && events.length === 0 && (
            <p className="mb-4 rounded bg-stone-50 px-4 py-3 text-xs text-stone-400 italic">
              У базі даних проєкту немає публікацій та заходів.
            </p>
          )}

          <div className="mb-2">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-400">
              Додати вручну
            </p>
            <div className="space-y-2">
              {meta.manualEntries.map((entry) => (
                <div key={entry.id} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={entry.text}
                    onChange={(e) => updateManual(entry.id, e.target.value)}
                    placeholder="Бібліографічний опис або назва заходу…"
                    className="input-control flex-1"
                  />
                  <DeleteBtn onClick={() => removeManual(entry.id)} />
                </div>
              ))}
            </div>
            <AddButton label="Додати запис вручну" onClick={addManual} />
          </div>
        </>
      )}
    </div>
  );
}

// ── 5. Financial ──────────────────────────────────────────────────────────────

type BudgetSummary = {
  totalPlanned: number;
  totalSpent: number;
  currency: string;
  byCategory?: Array<{ category: string; planned: number; spent: number }>;
};

function FinancialSectionEditor({
  meta,
  budget,
  onChange,
}: {
  meta: FinancialMeta;
  budget: BudgetSummary | null;
  onChange: (m: FinancialMeta) => void;
}) {
  const setMode = (mode: FinancialMode) => onChange({ ...meta, mode });
  const togglePhrase = (phrase: string) => {
    const phrases = meta.selectedPhrases.includes(phrase)
      ? meta.selectedPhrases.filter((p) => p !== phrase)
      : [...meta.selectedPhrases, phrase];
    onChange({ ...meta, selectedPhrases: phrases });
  };

  return (
    <div>
      <SectionHeader icon="💰" title="Використання коштів" subtitle="Охарактеризуйте фінансовий стан виконання проєкту" />

      <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {(Object.keys(FINANCIAL_MODE_LABELS) as FinancialMode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`rounded border p-2.5 text-xs font-medium transition ${
              meta.mode === m
                ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                : "border-stone-200 bg-white text-stone-500 hover:border-stone-300 hover:bg-stone-50"
            }`}
          >
            {FINANCIAL_MODE_LABELS[m]}
          </button>
        ))}
      </div>

      {(meta.mode === "standard" || meta.mode === "mixed") && (
        <>
          {budget && (budget.totalPlanned > 0 || budget.totalSpent > 0) && (
            <div className="mb-5 rounded-lg border border-stone-200 bg-stone-50 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-400">
                Дані з кошторису проєкту
              </p>
              <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-stone-400">Заплановано</p>
                  <p className="text-base font-bold text-stone-800">
                    {budget.totalPlanned.toLocaleString("uk-UA")} {budget.currency}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-stone-400">Використано</p>
                  <p className="text-base font-bold text-stone-800">
                    {budget.totalSpent.toLocaleString("uk-UA")} {budget.currency}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-stone-400">Залишок</p>
                  <p className="text-base font-bold text-emerald-700">
                    {(budget.totalPlanned - budget.totalSpent).toLocaleString("uk-UA")} {budget.currency}
                  </p>
                </div>
              </div>
              {budget.byCategory && budget.byCategory.length > 0 && (
                <div className="space-y-1">
                  {budget.byCategory.map((cat) => (
                    <div key={cat.category} className="flex items-center gap-2 text-xs">
                      <span className="w-32 truncate text-stone-500">{cat.category}</span>
                      <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-stone-200">
                        <div
                          className="absolute inset-y-0 left-0 rounded-full bg-emerald-400"
                          style={{ width: `${cat.planned > 0 ? Math.min(100, (cat.spent / cat.planned) * 100) : 0}%` }}
                        />
                      </div>
                      <span className="w-24 text-right text-stone-500">
                        {cat.spent.toLocaleString("uk-UA")} / {cat.planned.toLocaleString("uk-UA")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="mb-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-400">
              Стандартні формулювання
            </p>
            <div className="space-y-2 rounded-lg border border-stone-200">
              {FINANCIAL_STANDARD_PHRASES.map((phrase) => (
                <label
                  key={phrase}
                  className="flex cursor-pointer items-start gap-3 px-4 py-2.5 transition hover:bg-emerald-50"
                >
                  <input
                    type="checkbox"
                    checked={meta.selectedPhrases.includes(phrase)}
                    onChange={() => togglePhrase(phrase)}
                    className="mt-0.5 h-4 w-4 accent-emerald-600"
                  />
                  <span className="text-sm text-stone-700">{phrase}</span>
                </label>
              ))}
            </div>
          </div>
        </>
      )}

      {meta.mode !== "no_budget" && meta.mode !== "open_source" && (
        <div>
          <label className="mb-1 block text-xs font-semibold text-stone-500">
            Додаткові пояснення (необов'язково)
          </label>
          <textarea
            rows={3}
            value={meta.customNote}
            onChange={(e) => onChange({ ...meta, customNote: e.target.value })}
            placeholder="Особливості використання коштів, пояснення відхилень…"
            className="input-control w-full"
          />
        </div>
      )}
    </div>
  );
}

// ── 6. Problems ───────────────────────────────────────────────────────────────

const SEVERITY_COLORS: Record<ProblemSeverity, string> = {
  low: "bg-blue-50 text-blue-700 border-blue-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  high: "bg-orange-50 text-orange-700 border-orange-200",
  critical: "bg-rose-50 text-rose-700 border-rose-200",
};

const SEVERITY_ICONS: Record<ProblemSeverity, string> = {
  low: "🔵", medium: "🟡", high: "🟠", critical: "🔴",
};

const SOLUTION_STATUS_ICONS: Record<SolutionStatus, string> = {
  planned: "○", in_progress: "◑", resolved: "●", deferred: "⊘",
};

function SolutionRow({
  sol,
  onChange,
  onRemove,
}: {
  sol: SolutionItem;
  onChange: (s: SolutionItem) => void;
  onRemove: () => void;
}) {
  return (
    <div className="ml-6 flex items-start gap-2 rounded-lg border border-stone-100 bg-stone-50 p-3">
      <span className="mt-2 text-sm text-stone-400">{SOLUTION_STATUS_ICONS[sol.status]}</span>
      <div className="flex-1 space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={sol.description}
            onChange={(e) => onChange({ ...sol, description: e.target.value })}
            placeholder="Опис шляху вирішення…"
            className="input-control flex-1 text-sm"
          />
          <select
            value={sol.status}
            onChange={(e) => onChange({ ...sol, status: e.target.value as SolutionStatus })}
            className="input-control w-32 text-xs"
          >
            {SOLUTION_STATUSES.map((s) => (
              <option key={s} value={s}>{SOLUTION_STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-stone-400">Термін виконання:</label>
          <input
            type="date"
            value={sol.deadline ?? ""}
            onChange={(e) => onChange({ ...sol, deadline: e.target.value || undefined })}
            className="input-control py-0.5 text-xs"
          />
        </div>
      </div>
      <DeleteBtn onClick={onRemove} />
    </div>
  );
}

function ProblemCard({
  prob,
  index,
  onChange,
  onRemove,
}: {
  prob: ProblemItem;
  index: number;
  onChange: (p: ProblemItem) => void;
  onRemove: () => void;
}) {
  const addSolution = () =>
    onChange({ ...prob, solutions: [...prob.solutions, { id: uid(), description: "", status: "planned" }] });
  const removeSolution = (id: string) =>
    onChange({ ...prob, solutions: prob.solutions.filter((s) => s.id !== id) });
  const updateSolution = (id: string, sol: SolutionItem) =>
    onChange({ ...prob, solutions: prob.solutions.map((s) => (s.id === id ? sol : s)) });

  return (
    <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
      <div className={`flex items-center gap-3 border-b px-4 py-3 ${SEVERITY_COLORS[prob.severity]}`}>
        <span className="text-lg">{SEVERITY_ICONS[prob.severity]}</span>
        <span className="font-semibold text-sm">
          Проблема {index + 1}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <select
            value={prob.severity}
            onChange={(e) => onChange({ ...prob, severity: e.target.value as ProblemSeverity })}
            className="rounded border border-current/20 bg-transparent px-2 py-0.5 text-xs font-medium"
          >
            {PROBLEM_SEVERITIES.map((s) => (
              <option key={s} value={s}>{SEVERITY_LABELS[s]}</option>
            ))}
          </select>
          <select
            value={prob.category}
            onChange={(e) => onChange({ ...prob, category: e.target.value as ProblemCategory })}
            className="rounded border border-current/20 bg-transparent px-2 py-0.5 text-xs font-medium"
          >
            {PROBLEM_CATEGORIES.map((c) => (
              <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={onRemove}
            className="rounded px-2 py-0.5 text-xs transition hover:bg-rose-100 hover:text-rose-600"
          >
            ✕ Видалити
          </button>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <input
          type="text"
          value={prob.title}
          onChange={(e) => onChange({ ...prob, title: e.target.value })}
          placeholder="Коротка назва проблеми…"
          className="input-control w-full font-medium"
        />
        <textarea
          rows={2}
          value={prob.description}
          onChange={(e) => onChange({ ...prob, description: e.target.value })}
          placeholder="Детальний опис проблеми, її впливу на виконання проєкту…"
          className="input-control w-full text-sm"
        />

        {prob.solutions.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-stone-100" />
              <span className="text-xs text-stone-400">Шляхи вирішення</span>
              <div className="h-px flex-1 bg-stone-100" />
            </div>
            {prob.solutions.map((sol) => (
              <SolutionRow
                key={sol.id}
                sol={sol}
                onChange={(s) => updateSolution(sol.id, s)}
                onRemove={() => removeSolution(sol.id)}
              />
            ))}
          </div>
        )}

        <AddButton label="Додати шлях вирішення" onClick={addSolution} />
      </div>
    </div>
  );
}

function ProblemsSectionEditor({
  items,
  onChange,
}: {
  items: ProblemItem[];
  onChange: (items: ProblemItem[]) => void;
}) {
  const add = () =>
    onChange([
      ...items,
      { id: uid(), title: "", description: "", severity: "medium", category: "technical", solutions: [] },
    ]);
  const remove = (id: string) => onChange(items.filter((p) => p.id !== id));
  const update = (id: string, p: ProblemItem) => onChange(items.map((x) => (x.id === id ? p : x)));

  return (
    <div>
      <SectionHeader
        icon="⚠️"
        title="Проблеми та шляхи їх вирішення"
        subtitle="Опишіть труднощі, що виникли, та заходи з їх усунення"
      />

      {items.length === 0 && (
        <p className="mb-3 rounded bg-stone-50 px-4 py-3 text-xs text-stone-400 italic">
          Немає зафіксованих проблем.
        </p>
      )}

      <div className="space-y-4">
        {items.map((prob, idx) => (
          <ProblemCard
            key={prob.id}
            prob={prob}
            index={idx}
            onChange={(p) => update(prob.id, p)}
            onRemove={() => remove(prob.id)}
          />
        ))}
      </div>

      <AddButton label="Додати проблему" onClick={add} />
    </div>
  );
}

// ── 7. Plans ──────────────────────────────────────────────────────────────────

type TaskLike = { _id?: string; title: string; dueDate?: string; status: string; priority?: string };
type MilestoneLike = { _id?: string; title: string; dueDate: string; status: string };

function PlansSectionEditor({
  items,
  tasks,
  milestones,
  onChange,
}: {
  items: PlanItem[];
  tasks: TaskLike[];
  milestones: MilestoneLike[];
  onChange: (items: PlanItem[]) => void;
}) {
  const now = new Date().toISOString().slice(0, 10);

  const upcomingTasks = tasks.filter(
    (t) => t.dueDate && t.dueDate >= now && t.status !== "done" && t.status !== "cancelled",
  );
  const upcomingMilestones = milestones.filter(
    (m) => m.dueDate >= now && m.status === "upcoming",
  );

  const isLinked = (source: string, linkedId: string) =>
    items.some((i) => i.source === source && i.linkedId === linkedId);

  const toggleLinked = (source: "task" | "milestone", item: TaskLike | MilestoneLike) => {
    const id = item._id ?? "";
    if (isLinked(source, id)) {
      onChange(items.filter((i) => !(i.source === source && i.linkedId === id)));
    } else {
      const dueDate = (item as TaskLike).dueDate ?? (item as MilestoneLike).dueDate ?? "";
      onChange([
        ...items,
        { id: uid(), source, activity: item.title, deadline: dueDate, linkedId: id },
      ]);
    }
  };

  const addCustom = () =>
    onChange([...items, { id: uid(), source: "custom", activity: "", deadline: "" }]);
  const remove = (id: string) => onChange(items.filter((i) => i.id !== id));
  const update = (id: string, patch: Partial<PlanItem>) =>
    onChange(items.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  const customItems = items.filter((i) => i.source === "custom");

  return (
    <div>
      <SectionHeader
        icon="🗓️"
        title="Плани на наступний звітний период"
        subtitle="Оберіть заходи з плану або додайте власні"
      />

      {upcomingTasks.length > 0 && (
        <div className="mb-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-400">Майбутні завдання</p>
          <div className="space-y-1 rounded-lg border border-stone-200">
            {upcomingTasks.map((task, idx) => {
              const id = task._id ?? "";
              const linked = isLinked("task", id);
              return (
                <label
                  key={id || idx}
                  className={`flex cursor-pointer items-start gap-3 px-4 py-2.5 transition hover:bg-indigo-50 ${linked ? "bg-indigo-50/40" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={linked}
                    onChange={() => toggleLinked("task", task)}
                    className="mt-0.5 h-4 w-4 accent-indigo-600"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-stone-800">{task.title}</p>
                    <p className="text-xs text-stone-400">
                      {task.dueDate && `Термін: ${new Date(task.dueDate).toLocaleDateString("uk-UA")} · `}
                      {task.priority && <Chip>{task.priority}</Chip>}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {upcomingMilestones.length > 0 && (
        <div className="mb-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-400">Майбутні етапні результати</p>
          <div className="space-y-1 rounded-lg border border-stone-200">
            {upcomingMilestones.map((ms, idx) => {
              const id = ms._id ?? "";
              const linked = isLinked("milestone", id);
              return (
                <label
                  key={id || idx}
                  className={`flex cursor-pointer items-start gap-3 px-4 py-2.5 transition hover:bg-amber-50 ${linked ? "bg-amber-50/40" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={linked}
                    onChange={() => toggleLinked("milestone", ms)}
                    className="mt-0.5 h-4 w-4 accent-amber-500"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-stone-800">◆ {ms.title}</p>
                    <p className="text-xs text-stone-400">
                      {new Date(ms.dueDate).toLocaleDateString("uk-UA")}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {upcomingTasks.length === 0 && upcomingMilestones.length === 0 && (
        <p className="mb-4 rounded bg-stone-50 px-4 py-3 text-xs text-stone-400 italic">
          Немає майбутніх завдань та етапних результатів у базі даних.
        </p>
      )}

      {customItems.length > 0 && (
        <div className="mb-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-400">
            Власні заходи
          </p>
          <div className="space-y-3">
            {customItems.map((item) => (
              <div key={item.id} className="rounded-lg border border-stone-200 bg-white p-3">
                <div className="mb-2 flex items-center gap-2">
                  <input
                    type="text"
                    value={item.activity}
                    onChange={(e) => update(item.id, { activity: e.target.value })}
                    placeholder="Назва заходу або роботи…"
                    className="input-control flex-1"
                  />
                  <input
                    type="date"
                    value={item.deadline}
                    onChange={(e) => update(item.id, { deadline: e.target.value })}
                    className="input-control w-36 text-xs"
                  />
                  <DeleteBtn onClick={() => remove(item.id)} />
                </div>
                <input
                  type="text"
                  value={item.expectedResult ?? ""}
                  onChange={(e) => update(item.id, { expectedResult: e.target.value })}
                  placeholder="Очікуваний результат (необов'язково)…"
                  className="input-control w-full text-xs text-stone-500"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <AddButton label="Додати захід вручну" onClick={addCustom} />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

const SECTION_IDS = ["goals", "timeline", "results", "publications", "financial", "problems", "plans"] as const;
type SectionId = (typeof SECTION_IDS)[number];

const SECTION_META: Record<SectionId, { icon: string; label: string }> = {
  goals:        { icon: "🎯", label: "Мета та завдання" },
  timeline:     { icon: "📅", label: "План-графік" },
  results:      { icon: "🔬", label: "Наукові результати" },
  publications: { icon: "📄", label: "Публікації" },
  financial:    { icon: "💰", label: "Фінансування" },
  problems:     { icon: "⚠️", label: "Проблеми" },
  plans:        { icon: "🗓️", label: "Плани" },
};

function defaultMeta(report: Report): ReportSectionMeta {
  const parsed = parseSectionMeta(report.sectionMeta ?? "{}");
  return {
    goals:        parsed.goals        ?? { items: [] },
    timeline:     parsed.timeline     ?? { overallStatus: "on_track", stageStatuses: {}, manualNote: "" },
    results:      parsed.results      ?? { items: [] },
    publications: parsed.publications ?? { noPublications: false, linkedPublicationIds: [], linkedEventIds: [], manualEntries: [] },
    financial:    parsed.financial    ?? { mode: "standard", selectedPhrases: [], customNote: "" },
    problems:     parsed.problems     ?? { items: [] },
    plans:        parsed.plans        ?? { items: [] },
  };
}

export function StructuredReportEditor({
  report,
  stages,
  projectId,
  locale,
}: {
  report: Report;
  stages: ResearchStage[];
  projectId: string;
  locale: string;
}) {
  const [activeSection, setActiveSection] = useState<SectionId>("goals");
  const [meta, setMeta] = useState<Required<ReportSectionMeta>>(() => defaultMeta(report) as Required<ReportSectionMeta>);
  const [exportData, setExportData] = useState<ReportExportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch(`/api/reports/export-data?projectId=${projectId}&reportId=${report._id ?? ""}`)
      .then((r) => r.json())
      .then((data: ReportExportData) => { setExportData(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [projectId, report._id]);

  const updateSection = useCallback(<K extends keyof ReportSectionMeta>(key: K, value: ReportSectionMeta[K]) => {
    setMeta((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const stagesForSerializer = stages.map((s) => ({
        _id: s._id,
        stageNumber: s.stageNumber,
        title: s.title,
      }));

      const publications = exportData?.publications ?? [];
      const events = exportData?.events ?? [];
      const budget = exportData?.budget
        ? {
            totalPlanned: exportData.budget.totalPlanned,
            totalSpent: exportData.budget.totalSpent,
            currency: exportData.budget.currency,
          }
        : null;

      const fields = {
        projectId,
        sectionGoals:        serializeGoals(meta.goals?.items ?? []),
        sectionTimeline:     meta.timeline ? serializeTimeline(meta.timeline, stagesForSerializer) : "",
        sectionResults:      serializeResults(meta.results?.items ?? []),
        sectionPublications: meta.publications
          ? serializePublications(meta.publications, publications, events)
          : "",
        sectionFinancial:    meta.financial ? serializeFinancial(meta.financial, budget) : "",
        sectionProblems:     serializeProblems(meta.problems?.items ?? []),
        sectionPlans:        serializePlans(meta.plans?.items ?? []),
        sectionMeta:         JSON.stringify(meta),
      };

      const res = await fetch(`/api/reports/${report._id}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });

      if (res.ok) setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  const publications = exportData?.publications ?? [];
  const events = exportData?.events ?? [];
  const tasks = (exportData?.tasks ?? []) as TaskLike[];
  const milestones = (exportData?.milestones ?? []) as MilestoneLike[];
  const budget = exportData?.budget ?? null;

  return (
    <div className="flex gap-0 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
      {/* Left nav */}
      <aside className="flex w-44 flex-shrink-0 flex-col border-r border-stone-100 bg-stone-50">
        <div className="px-3 py-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Розділи</p>
        </div>
        <nav className="flex-1 space-y-0.5 px-2 pb-3">
          {SECTION_IDS.map((id) => {
            const s = SECTION_META[id];
            const isActive = activeSection === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveSection(id)}
                className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs font-medium transition ${
                  isActive
                    ? "bg-white font-semibold text-emerald-700 shadow-sm ring-1 ring-stone-200"
                    : "text-stone-500 hover:bg-white hover:text-stone-700"
                }`}
              >
                <span>{s.icon}</span>
                <span className="truncate">{s.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="border-t border-stone-100 p-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className={`w-full rounded-lg py-2 text-xs font-semibold transition ${
              saved
                ? "bg-emerald-100 text-emerald-700"
                : "bg-emerald-600 text-white hover:bg-emerald-700"
            } disabled:opacity-60`}
          >
            {saving ? "Збереження…" : saved ? "✓ Збережено" : "Зберегти"}
          </button>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 overflow-auto px-6 py-6">
        {loading && (
          <div className="flex items-center gap-2 text-sm text-stone-400">
            <span className="animate-spin">⟳</span> Завантаження даних проєкту…
          </div>
        )}

        {!loading && activeSection === "goals" && (
          <GoalsSectionEditor
            items={meta.goals?.items ?? []}
            onChange={(items) => updateSection("goals", { items })}
          />
        )}

        {!loading && activeSection === "timeline" && (
          <TimelineSectionEditor
            meta={meta.timeline ?? { overallStatus: "on_track", stageStatuses: {}, manualNote: "" }}
            stages={stages}
            onChange={(m) => updateSection("timeline", m)}
          />
        )}

        {!loading && activeSection === "results" && (
          <ResultsSectionEditor
            items={meta.results?.items ?? []}
            onChange={(items) => updateSection("results", { items })}
          />
        )}

        {!loading && activeSection === "publications" && (
          <PublicationsSectionEditor
            meta={meta.publications ?? { noPublications: false, linkedPublicationIds: [], linkedEventIds: [], manualEntries: [] }}
            publications={publications}
            events={events}
            onChange={(m) => updateSection("publications", m)}
          />
        )}

        {!loading && activeSection === "financial" && (
          <FinancialSectionEditor
            meta={meta.financial ?? { mode: "standard", selectedPhrases: [], customNote: "" }}
            budget={budget}
            onChange={(m) => updateSection("financial", m)}
          />
        )}

        {!loading && activeSection === "problems" && (
          <ProblemsSectionEditor
            items={meta.problems?.items ?? []}
            onChange={(items) => updateSection("problems", { items })}
          />
        )}

        {!loading && activeSection === "plans" && (
          <PlansSectionEditor
            items={meta.plans?.items ?? []}
            tasks={tasks}
            milestones={milestones}
            onChange={(items) => updateSection("plans", { items })}
          />
        )}
      </div>
    </div>
  );
}
