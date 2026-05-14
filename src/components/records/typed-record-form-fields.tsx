"use client";

import { KIND_CONFIGS, type FieldDef } from "@/lib/record-field-definitions";

const inputCls = "input-control w-full px-3 py-2 text-sm outline-none";

// ── Kind-specific hints ────────────────────────────────────────────────────────

const KIND_HINTS: Record<string, { uk: string; en: string }> = {
  research_question:        { uk: "Формулюйте та відстежуйте ключові питання, гіпотези та їхній стан.", en: "Formulate and track research questions, hypotheses, and their status." },
  literature_review:        { uk: "Задокументуйте стратегію пошуку, ключові знахідки та прогалини.", en: "Document search strategy, key findings, and research gaps." },
  theoretical_framework:    { uk: "Опишіть теоретичну основу: концепції, конструкти та очікувані зв'язки.", en: "Describe theoretical base: concepts, constructs, and expected relationships." },
  research_design:          { uk: "Задокументуйте дизайн дослідження та обґрунтування вибору методів.", en: "Document research design and justification of method choices." },
  methodology:              { uk: "Методологічний підхід, обґрунтування та процедури верифікації.", en: "Methodological approach, justification, and verification procedures." },
  sop:                      { uk: "Стандартна операційна процедура — покрокова для відтворюваного виконання.", en: "Standard operating procedure — step-by-step for reproducible execution." },
  protocol:                 { uk: "Детальний протокол: кроки виконання, критерії прийняття та відхилення.", en: "Detailed protocol: execution steps, acceptance and failure criteria." },
  data_collection_protocol: { uk: "Протокол збору даних: форми, поля та методи реєстрації.", en: "Data collection protocol: forms, fields, and registration methods." },
  analysis_protocol:        { uk: "Протокол аналізу: кроки обробки, статистичні методи та інструменти.", en: "Analysis protocol: processing, statistical methods, and tools." },
  dataset:                  { uk: "Набір даних із FAIR-метаданими, описом структури та умовами доступу.", en: "Dataset with FAIR metadata, structure description, and access terms." },
  measurement_method:       { uk: "Метод вимірювання: принцип, одиниці, точність та умови застосування.", en: "Measurement method: principle, units, precision, and conditions." },
  spectrophotometry_method: { uk: "Спектрофотометрія: тип сигналу, довжини хвиль, бланк, калібрування та QC.", en: "Spectrophotometry: signal type, wavelengths, blank, calibration, and QC." },
  calibration_record:       { uk: "Запис калібрування обладнання з результатами перевірки.", en: "Equipment calibration record with verification results." },
  experiment_log:           { uk: "Журнал виконання: умови, покрокові дії, результати та контроль якості.", en: "Execution log: conditions, step-by-step actions, results, and QC." },
  sample:                   { uk: "Характеристика зразка: тип, походження, умови зберігання, молекулярні показники.", en: "Sample characterization: type, origin, storage, and molecular metrics." },
  culture_medium_recipe:    { uk: "Рецепт середовища: компоненти, масштабування, pH, стерилізація, добавки та QC.", en: "Culture medium recipe: components, scaling, pH, sterilization, supplements, and QC." },
  task:                     { uk: "Завдання команди з пріоритетом, відповідальним та дедлайном.", en: "Team task with priority, assignee, and deadline." },
  task_set:                 { uk: "Набір пов'язаних завдань з мілстонами та відстеженням прогресу.", en: "Set of related tasks with milestones and progress tracking." },
  meeting_minutes:          { uk: "Протокол зустрічі: порядок денний, рішення та призначені дії.", en: "Meeting minutes: agenda, decisions, and assigned actions." },
  supervision_log:          { uk: "Протокол наукового супервізійного зібрання: агенда, корекції, наступні кроки.", en: "Supervision meeting: agenda, required corrections, and next steps." },
  decision_log:             { uk: "Реєстр ключових рішень із обґрунтуванням та розглянутими альтернативами.", en: "Key decisions log with rationale and alternatives considered." },
  risk:                     { uk: "Реєстр ризиків: матриця ймовірність × вплив для всіх ідентифікованих ризиків.", en: "Risk register: probability × impact matrix for identified risks." },
  ethics:                   { uk: "Матеріали етичного схвалення та відповідність нормативним вимогам.", en: "Ethics approval materials and regulatory compliance documentation." },
  data_management_plan:     { uk: "DMP — план управління даними відповідно до вимог фінансувальника.", en: "DMP — data management plan per funder requirements." },
  output:                   { uk: "Результат дослідження для публікації, передачі або архівування.", en: "Research output for publication, transfer, or archiving." },
  report:                   { uk: "Офіційний звіт про результати або поточний стан проєкту.", en: "Official report on research results or project status." },
};

// ── Shared primitives ─────────────────────────────────────────────────────────

function PlusIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function RemoveIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden>
      <path d="M8.5 2.5l-6 6M2.5 2.5l6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function Label({ field, locale, count }: { field: FieldDef; locale: string; count?: number }) {
  return (
    <div className="mb-1.5 flex items-center gap-2">
      <span className="text-xs font-semibold text-stone-600">
        {locale === "uk" ? field.uk : field.en}
        {field.required && <span className="ml-0.5 text-rose-500">*</span>}
      </span>
      {typeof count === "number" && count > 0 && (
        <span className="rounded-full bg-stone-200 px-1.5 py-0 text-[10px] font-bold leading-4 text-stone-600">{count}</span>
      )}
    </div>
  );
}

function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-stone-300 py-2 text-xs font-medium text-stone-500 transition hover:border-emerald-400 hover:bg-emerald-50/60 hover:text-emerald-700"
    >
      <PlusIcon />
      {label}
    </button>
  );
}

// ── Simple field components ───────────────────────────────────────────────────

function TextField({ field, value, onChange, locale }: {
  field: FieldDef; value: string; onChange: (v: string) => void; locale: string;
}) {
  return (
    <label className="block">
      <Label field={field} locale={locale} />
      <input type="text" className={inputCls} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder ?? ""} required={field.required} />
    </label>
  );
}

function TextareaField({ field, value, onChange, locale }: {
  field: FieldDef; value: string; onChange: (v: string) => void; locale: string;
}) {
  return (
    <label className="block">
      <Label field={field} locale={locale} />
      <textarea className={`${inputCls} resize-y`} rows={field.rows ?? 3} value={value}
        onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder ?? ""} required={field.required} />
    </label>
  );
}

function SelectField({ field, value, onChange, locale }: {
  field: FieldDef; value: string; onChange: (v: string) => void; locale: string;
}) {
  return (
    <label className="block">
      <Label field={field} locale={locale} />
      <select className={inputCls} value={value} onChange={(e) => onChange(e.target.value)} required={field.required}>
        <option value="">— {locale === "uk" ? "оберіть" : "select"} —</option>
        {(field.options ?? []).map((opt) => (
          <option key={opt} value={opt}>{opt.replace(/_/g, " ")}</option>
        ))}
      </select>
    </label>
  );
}

function NumberField({ field, value, onChange, locale }: {
  field: FieldDef; value: string; onChange: (v: string) => void; locale: string;
}) {
  return (
    <label className="block">
      <Label field={field} locale={locale} />
      <input type="number" className={inputCls} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder ?? "0"} required={field.required} min={0} />
    </label>
  );
}

function DateField({ field, value, onChange, locale }: {
  field: FieldDef; value: string; onChange: (v: string) => void; locale: string;
}) {
  return (
    <label className="block">
      <Label field={field} locale={locale} />
      <input type="date" className={inputCls} value={value} onChange={(e) => onChange(e.target.value)}
        required={field.required} />
    </label>
  );
}

// ── Repeatable text list ──────────────────────────────────────────────────────

function RepeatableTextField({ field, value, onChange, locale }: {
  field: FieldDef; value: string[]; onChange: (v: string[]) => void; locale: string;
}) {
  const isUk = locale === "uk";
  const label = isUk ? field.uk : field.en;

  function add() { onChange([...value, ""]); }
  function remove(i: number) { onChange(value.filter((_, idx) => idx !== i)); }
  function update(i: number, v: string) { onChange(value.map((item, idx) => idx === i ? v : item)); }

  return (
    <div>
      <Label field={field} locale={locale} count={value.length} />
      {value.length === 0 ? (
        <div className="mb-2 rounded-lg border border-dashed border-stone-300 bg-stone-50/60 px-4 py-5 text-center">
          <p className="text-xs font-medium text-stone-500">
            {isUk
              ? `Список «${label}» порожній — натисніть нижче, щоб додати перший елемент`
              : `"${label}" list is empty — click below to add the first item`}
          </p>
        </div>
      ) : (
        <div className="mb-2 space-y-1.5">
          {value.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-stone-200 text-[10px] font-bold text-stone-600">
                {i + 1}
              </span>
              <input
                type="text"
                className={`${inputCls} flex-1`}
                value={item}
                onChange={(e) => update(i, e.target.value)}
                placeholder={`${isUk ? "Елемент" : "Item"} ${i + 1}…`}
              />
              <button
                type="button"
                onClick={() => remove(i)}
                title={isUk ? "Видалити" : "Remove"}
                className="shrink-0 rounded p-1.5 text-stone-400 transition hover:bg-rose-50 hover:text-rose-500"
              >
                <RemoveIcon />
              </button>
            </div>
          ))}
        </div>
      )}
      <AddButton onClick={add} label={isUk ? "Додати елемент" : "Add item"} />
    </div>
  );
}

// ── Procedure / execution steps ───────────────────────────────────────────────

type StepItem = {
  num: number;
  title: string;
  instruction: string;
  critical: boolean;
  time_min: string;
  role: string;
};

function StepsField({ field, value, onChange, locale }: {
  field: FieldDef; value: StepItem[]; onChange: (v: StepItem[]) => void; locale: string;
}) {
  const isUk = locale === "uk";

  function add() {
    onChange([...value, { num: value.length + 1, title: "", instruction: "", critical: false, time_min: "", role: "" }]);
  }
  function remove(i: number) {
    onChange(value.filter((_, idx) => idx !== i).map((s, idx) => ({ ...s, num: idx + 1 })));
  }
  function update(i: number, patch: Partial<StepItem>) {
    onChange(value.map((s, idx) => idx === i ? { ...s, ...patch } : s));
  }

  return (
    <div>
      <Label field={field} locale={locale} count={value.length} />

      {value.length === 0 ? (
        <div className="mb-2 rounded-lg border border-dashed border-stone-300 bg-stone-50/60 px-5 py-6 text-center">
          <span className="text-2xl">📋</span>
          <p className="mt-2 text-sm font-semibold text-stone-600">
            {isUk ? "Кроків ще немає" : "No steps yet"}
          </p>
          <p className="mt-1 text-xs leading-5 text-stone-400">
            {isUk
              ? "Опишіть процедуру покроково. Кожен крок має назву, інструкцію та відповідальну роль."
              : "Describe the procedure step-by-step. Each step has a title, instruction, and assigned role."}
          </p>
        </div>
      ) : (
        <div className="mb-2 space-y-2">
          {value.map((step, i) => (
            <div
              key={i}
              className={`rounded-lg border bg-white p-3 shadow-sm transition ${
                step.critical ? "border-rose-200 ring-1 ring-rose-100" : "border-stone-200"
              }`}
            >
              {/* Step header */}
              <div className="mb-2.5 flex items-center gap-2">
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${step.critical ? "bg-rose-500" : "bg-stone-700"}`}>
                  {step.num}
                </span>
                {step.critical && (
                  <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-700">
                    {isUk ? "Критичний" : "Critical"}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="ml-auto rounded p-1 text-stone-400 transition hover:bg-rose-50 hover:text-rose-500"
                  title={isUk ? "Видалити крок" : "Remove step"}
                >
                  <RemoveIcon />
                </button>
              </div>

              {/* Fields */}
              <div className="space-y-1.5">
                <input
                  type="text"
                  className={inputCls}
                  value={step.title}
                  onChange={(e) => update(i, { title: e.target.value })}
                  placeholder={isUk ? "Назва кроку…" : "Step title…"}
                />
                <textarea
                  className={`${inputCls} resize-y`}
                  rows={2}
                  value={step.instruction}
                  onChange={(e) => update(i, { instruction: e.target.value })}
                  placeholder={isUk ? "Докладна інструкція, умови виконання…" : "Detailed instruction, execution conditions…"}
                />
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <p className="mb-0.5 text-[10px] font-medium text-stone-400">{isUk ? "Час (хв)" : "Time (min)"}</p>
                    <input
                      type="text"
                      className={inputCls}
                      value={step.time_min}
                      onChange={(e) => update(i, { time_min: e.target.value })}
                      placeholder="15"
                    />
                  </div>
                  <div>
                    <p className="mb-0.5 text-[10px] font-medium text-stone-400">{isUk ? "Роль" : "Role"}</p>
                    <input
                      type="text"
                      className={inputCls}
                      value={step.role}
                      onChange={(e) => update(i, { role: e.target.value })}
                      placeholder={isUk ? "Лаборант…" : "Lab tech…"}
                    />
                  </div>
                  <div className="flex items-end pb-1">
                    <label className="flex cursor-pointer items-center gap-1.5 text-xs text-stone-600">
                      <input
                        type="checkbox"
                        checked={step.critical}
                        onChange={(e) => update(i, { critical: e.target.checked })}
                        className="accent-rose-500"
                      />
                      {isUk ? "Критичний" : "Critical"}
                    </label>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddButton onClick={add} label={isUk ? "Додати крок" : "Add step"} />
    </div>
  );
}

// ── Risk items matrix ─────────────────────────────────────────────────────────

type RiskItem = {
  id: string;
  title: string;
  description: string;
  category: string;
  probability: number;
  impact: number;
  warnings: string;
  owner: string;
  mitigation: string;
  status: string;
  review_date: string;
};

const RISK_CATEGORIES = [
  "scientific_hypothesis", "methodological", "technical", "data_quality", "sample_availability",
  "ethical_approval", "biosafety", "timeline", "funding", "publication", "team_capacity",
  "equipment", "software", "reproducibility", "repository_deposit", "defense_procedure", "other",
];

const RISK_STATUSES = ["open", "monitoring", "mitigation_in_progress", "realized", "closed", "accepted"];

function calcRiskLevel(score: number): { level: string; levelUk: string; color: string; border: string } {
  if (score >= 15) return { level: "CRITICAL", levelUk: "КРИТИЧНИЙ", color: "text-rose-700 bg-rose-100",   border: "border-rose-300 ring-1 ring-rose-100" };
  if (score >= 9)  return { level: "HIGH",     levelUk: "ВИСОКИЙ",   color: "text-orange-700 bg-orange-100", border: "border-orange-200" };
  if (score >= 4)  return { level: "MEDIUM",   levelUk: "СЕРЕДНІЙ",  color: "text-amber-700 bg-amber-100",  border: "border-amber-200" };
  return                  { level: "LOW",      levelUk: "НИЗЬКИЙ",   color: "text-emerald-700 bg-emerald-100", border: "border-stone-200" };
}

function RiskItemsField({ field, value, onChange, locale }: {
  field: FieldDef; value: RiskItem[]; onChange: (v: RiskItem[]) => void; locale: string;
}) {
  const isUk = locale === "uk";

  function add() {
    const id = `R${Date.now().toString(36).toUpperCase()}`;
    onChange([...value, { id, title: "", description: "", category: "", probability: 1, impact: 1, warnings: "", owner: "", mitigation: "", status: "open", review_date: "" }]);
  }
  function remove(i: number) { onChange(value.filter((_, idx) => idx !== i)); }
  function update(i: number, patch: Partial<RiskItem>) {
    onChange(value.map((r, idx) => idx === i ? { ...r, ...patch } : r));
  }

  return (
    <div>
      <Label field={field} locale={locale} count={value.length} />

      {/* Matrix legend */}
      {value.length > 0 && (
        <div className="mb-2 flex flex-wrap items-center gap-2 text-[10px]">
          <span className="text-stone-400">{isUk ? "Рівень ризику:" : "Risk level:"}</span>
          {[
            { label: isUk ? "Низький (1–3)" : "Low (1–3)", cls: "bg-emerald-100 text-emerald-700" },
            { label: isUk ? "Середній (4–8)" : "Medium (4–8)", cls: "bg-amber-100 text-amber-700" },
            { label: isUk ? "Високий (9–14)" : "High (9–14)", cls: "bg-orange-100 text-orange-700" },
            { label: isUk ? "Критичний (15–25)" : "Critical (15–25)", cls: "bg-rose-100 text-rose-700" },
          ].map((l) => (
            <span key={l.label} className={`rounded px-1.5 py-0.5 font-semibold ${l.cls}`}>{l.label}</span>
          ))}
        </div>
      )}

      {value.length === 0 ? (
        <div className="mb-2 rounded-lg border border-dashed border-rose-200 bg-rose-50/40 px-5 py-6 text-center">
          <span className="text-2xl">⚠️</span>
          <p className="mt-2 text-sm font-semibold text-rose-700">
            {isUk ? "Реєстр ризиків порожній" : "Risk register is empty"}
          </p>
          <p className="mt-1 text-xs leading-5 text-rose-400">
            {isUk
              ? "Додайте ідентифіковані ризики. Рівень розраховується автоматично: P × I (1–25)."
              : "Add identified risks. Risk level is calculated automatically: P × I (1–25)."}
          </p>
        </div>
      ) : (
        <div className="mb-2 space-y-2.5">
          {value.map((risk, i) => {
            const score = risk.probability * risk.impact;
            const { level, levelUk, color, border } = calcRiskLevel(score);
            return (
              <div key={i} className={`rounded-lg border bg-white p-3 shadow-sm ${border}`}>
                {/* Risk header */}
                <div className="mb-2.5 flex items-center gap-2">
                  <code className="text-[10px] font-bold text-stone-400">{risk.id}</code>
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${color}`}>
                    {isUk ? levelUk : level} · {score}/25
                  </span>
                  <div className="ml-auto flex items-center gap-3">
                    {/* P×I visual bars */}
                    <div className="flex items-center gap-1 text-[10px] text-stone-400">
                      <span>P={risk.probability}</span>
                      <span>×</span>
                      <span>I={risk.impact}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(i)}
                      className="rounded p-1 text-stone-400 transition hover:bg-rose-50 hover:text-rose-500"
                      title={isUk ? "Видалити ризик" : "Remove risk"}
                    >
                      <RemoveIcon />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <input
                    type="text"
                    className={inputCls}
                    value={risk.title}
                    onChange={(e) => update(i, { title: e.target.value })}
                    placeholder={isUk ? "Назва ризику…" : "Risk title…"}
                  />
                  <textarea
                    className={`${inputCls} resize-y`}
                    rows={2}
                    value={risk.description}
                    onChange={(e) => update(i, { description: e.target.value })}
                    placeholder={isUk ? "Детальний опис ризику та можливих наслідків…" : "Detailed description of the risk and its potential consequences…"}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="mb-0.5 text-[10px] font-medium text-stone-400">{isUk ? "Категорія" : "Category"}</p>
                      <select className={inputCls} value={risk.category} onChange={(e) => update(i, { category: e.target.value })}>
                        <option value="">—</option>
                        {RISK_CATEGORIES.map((c) => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
                      </select>
                    </div>
                    <div>
                      <p className="mb-0.5 text-[10px] font-medium text-stone-400">{isUk ? "Статус" : "Status"}</p>
                      <select className={inputCls} value={risk.status} onChange={(e) => update(i, { status: e.target.value })}>
                        {RISK_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <p className="mb-0.5 text-[10px] font-medium text-stone-400">{isUk ? "Ймовірність (1–5)" : "Probability (1–5)"}</p>
                      <input
                        type="number"
                        className={inputCls}
                        value={risk.probability}
                        min={1}
                        max={5}
                        onChange={(e) => update(i, { probability: Math.min(5, Math.max(1, Number(e.target.value))) })}
                      />
                    </div>
                    <div>
                      <p className="mb-0.5 text-[10px] font-medium text-stone-400">{isUk ? "Вплив (1–5)" : "Impact (1–5)"}</p>
                      <input
                        type="number"
                        className={inputCls}
                        value={risk.impact}
                        min={1}
                        max={5}
                        onChange={(e) => update(i, { impact: Math.min(5, Math.max(1, Number(e.target.value))) })}
                      />
                    </div>
                    <div>
                      <p className="mb-0.5 text-[10px] font-medium text-stone-400">{isUk ? "Дата перегляду" : "Review date"}</p>
                      <input
                        type="date"
                        className={inputCls}
                        value={risk.review_date}
                        onChange={(e) => update(i, { review_date: e.target.value })}
                      />
                    </div>
                  </div>
                  <input
                    type="text"
                    className={inputCls}
                    value={risk.owner}
                    onChange={(e) => update(i, { owner: e.target.value })}
                    placeholder={isUk ? "Власник ризику (відповідальний)…" : "Risk owner (responsible person)…"}
                  />
                  <input
                    type="text"
                    className={inputCls}
                    value={risk.warnings}
                    onChange={(e) => update(i, { warnings: e.target.value })}
                    placeholder={isUk ? "Ранні сигнали попередження (triggers)…" : "Early warning signals (triggers)…"}
                  />
                  <textarea
                    className={`${inputCls} resize-y`}
                    rows={2}
                    value={risk.mitigation}
                    onChange={(e) => update(i, { mitigation: e.target.value })}
                    placeholder={isUk ? "План мітигації — кроки для зниження ймовірності або впливу…" : "Mitigation plan — steps to reduce probability or impact…"}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AddButton onClick={add} label={isUk ? "Додати ризик" : "Add risk"} />
    </div>
  );
}

// ── Reagents list ─────────────────────────────────────────────────────────────

type ReagentItem = {
  name: string;
  role: string;
  hazard_class: string;
  bleach_incompatible: boolean;
  lot_tracking: boolean;
  notes: string;
};

const REAGENT_ROLES = ["lysis", "protein_digestion", "rna_removal", "phase_separation", "binding", "wash", "precipitation", "elution", "control", "buffer", "stain", "other"];
const HAZARD_CLASSES = ["nonhazardous", "corrosive", "toxic", "flammable", "chaotropic", "biohazard_associated", "carcinogenic", "other"];

function ReagentsField({ field, value, onChange, locale }: {
  field: FieldDef; value: ReagentItem[]; onChange: (v: ReagentItem[]) => void; locale: string;
}) {
  const isUk = locale === "uk";
  const empty: ReagentItem = { name: "", role: "", hazard_class: "nonhazardous", bleach_incompatible: false, lot_tracking: true, notes: "" };

  function add() { onChange([...value, { ...empty }]); }
  function remove(i: number) { onChange(value.filter((_, idx) => idx !== i)); }
  function update(i: number, patch: Partial<ReagentItem>) { onChange(value.map((r, idx) => idx === i ? { ...r, ...patch } : r)); }

  const hazardColor = (h: string) =>
    h === "toxic" || h === "carcinogenic" ? "border-rose-300 bg-rose-50"
    : h === "chaotropic" || h === "corrosive" ? "border-amber-300 bg-amber-50"
    : h === "flammable" ? "border-orange-300 bg-orange-50"
    : h === "biohazard_associated" ? "border-purple-300 bg-purple-50"
    : "border-stone-200 bg-white";

  return (
    <div>
      <Label field={field} locale={locale} count={value.length} />
      {value.length === 0 ? (
        <div className="mb-2 rounded-lg border border-dashed border-stone-300 bg-stone-50/60 px-5 py-6 text-center">
          <span className="text-2xl">🧪</span>
          <p className="mt-2 text-sm font-semibold text-stone-600">{isUk ? "Реагентів ще немає" : "No reagents yet"}</p>
          <p className="mt-1 text-xs leading-5 text-stone-400">
            {isUk ? "Додайте кожен реагент окремо — з роллю, класом небезпеки та відстеженням серії." : "Add each reagent with its role, hazard class, and lot tracking requirements."}
          </p>
        </div>
      ) : (
        <div className="mb-2 space-y-2">
          {value.map((reagent, i) => (
            <div key={i} className={`rounded-lg border p-3 shadow-sm transition ${hazardColor(reagent.hazard_class)}`}>
              <div className="mb-2 flex items-center gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-stone-700 text-[10px] font-bold text-white">{i + 1}</span>
                {reagent.hazard_class !== "nonhazardous" && reagent.hazard_class && (
                  <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700 ring-1 ring-amber-200">
                    ⚠ {reagent.hazard_class.replace(/_/g, " ")}
                  </span>
                )}
                {reagent.bleach_incompatible && (
                  <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                    🚫 {isUk ? "Несумісний з відбілювачем" : "Bleach incompatible"}
                  </span>
                )}
                <button type="button" onClick={() => remove(i)} className="ml-auto rounded p-1 text-stone-400 transition hover:bg-rose-50 hover:text-rose-500">
                  <RemoveIcon />
                </button>
              </div>
              <div className="space-y-1.5">
                <input type="text" className={inputCls} value={reagent.name} onChange={(e) => update(i, { name: e.target.value })}
                  placeholder={isUk ? "Назва реагенту (напр. Buffer AL, Proteinase K)…" : "Reagent name (e.g. Buffer AL, Proteinase K)…"} />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="mb-0.5 text-[10px] font-medium text-stone-400">{isUk ? "Роль" : "Role"}</p>
                    <select className={inputCls} value={reagent.role} onChange={(e) => update(i, { role: e.target.value })}>
                      <option value="">—</option>
                      {REAGENT_ROLES.map((r) => <option key={r} value={r}>{r.replace(/_/g, " ")}</option>)}
                    </select>
                  </div>
                  <div>
                    <p className="mb-0.5 text-[10px] font-medium text-stone-400">{isUk ? "Клас небезпеки" : "Hazard class"}</p>
                    <select className={inputCls} value={reagent.hazard_class} onChange={(e) => update(i, { hazard_class: e.target.value })}>
                      {HAZARD_CLASSES.map((h) => <option key={h} value={h}>{h.replace(/_/g, " ")}</option>)}
                    </select>
                  </div>
                </div>
                <input type="text" className={inputCls} value={reagent.notes} onChange={(e) => update(i, { notes: e.target.value })}
                  placeholder={isUk ? "Постачальник, каталожний №, концентрація, умови зберігання…" : "Vendor, catalog #, working concentration, storage…"} />
                <div className="flex gap-4">
                  <label className="flex cursor-pointer items-center gap-1.5 text-xs text-stone-600">
                    <input type="checkbox" checked={reagent.bleach_incompatible} onChange={(e) => update(i, { bleach_incompatible: e.target.checked })} className="accent-rose-500" />
                    {isUk ? "Несумісний з відбілювачем" : "Bleach incompatible"}
                  </label>
                  <label className="flex cursor-pointer items-center gap-1.5 text-xs text-stone-600">
                    <input type="checkbox" checked={reagent.lot_tracking} onChange={(e) => update(i, { lot_tracking: e.target.checked })} className="accent-emerald-500" />
                    {isUk ? "Відстеження серії (lot)" : "Lot tracking required"}
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <AddButton onClick={add} label={isUk ? "Додати реагент" : "Add reagent"} />
    </div>
  );
}

// ── QC checkpoints ────────────────────────────────────────────────────────────

type QcPoint = {
  stage: string;
  metric: string;
  method: string;
  threshold: string;
  unit: string;
  failure_action: string;
};

const QC_METHODS = ["visual_inspection", "nanodrop_uv", "qubit_fluorometry", "gel_electrophoresis", "capillary_electrophoresis", "pcr_functionality", "blank_extraction_control", "microplate_reader", "mass_spectrometry", "other"];
const FAILURE_ACTIONS = ["repeat_cleanup", "repeat_extraction", "reject_batch", "allow_with_comment", "supervisor_review"];

function QcPointsField({ field, value, onChange, locale }: {
  field: FieldDef; value: QcPoint[]; onChange: (v: QcPoint[]) => void; locale: string;
}) {
  const isUk = locale === "uk";
  const empty: QcPoint = { stage: "", metric: "", method: "", threshold: "", unit: "", failure_action: "supervisor_review" };

  function add() { onChange([...value, { ...empty }]); }
  function remove(i: number) { onChange(value.filter((_, idx) => idx !== i)); }
  function update(i: number, patch: Partial<QcPoint>) { onChange(value.map((q, idx) => idx === i ? { ...q, ...patch } : q)); }

  const actionColor = (a: string) =>
    a === "reject_batch" ? "border-rose-200 bg-rose-50"
    : a === "repeat_extraction" ? "border-amber-200 bg-amber-50"
    : "border-emerald-200 bg-emerald-50";

  return (
    <div>
      <Label field={field} locale={locale} count={value.length} />
      {value.length === 0 ? (
        <div className="mb-2 rounded-lg border border-dashed border-stone-300 bg-stone-50/60 px-5 py-6 text-center">
          <span className="text-2xl">📊</span>
          <p className="mt-2 text-sm font-semibold text-stone-600">{isUk ? "Контрольних точок ще немає" : "No QC checkpoints yet"}</p>
          <p className="mt-1 text-xs leading-5 text-stone-400">
            {isUk ? "Додайте контрольні точки для кожного етапу: метрика, метод вимірювання, порогове значення та дія при невдачі." : "Add checkpoints per stage: metric, measurement method, threshold, and failure action."}
          </p>
        </div>
      ) : (
        <div className="mb-2 space-y-2">
          {value.map((qc, i) => (
            <div key={i} className={`rounded-lg border p-3 shadow-sm ${actionColor(qc.failure_action)}`}>
              <div className="mb-2 flex items-center gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">✓{i + 1}</span>
                {qc.failure_action && (
                  <span className={`rounded-sm px-2 py-0.5 text-[10px] font-semibold ${
                    qc.failure_action === "reject_batch" ? "bg-rose-100 text-rose-700"
                    : qc.failure_action === "repeat_extraction" ? "bg-amber-100 text-amber-700"
                    : "bg-emerald-100 text-emerald-700"
                  }`}>
                    {qc.failure_action.replace(/_/g, " ")}
                  </span>
                )}
                <button type="button" onClick={() => remove(i)} className="ml-auto rounded p-1 text-stone-400 transition hover:bg-rose-50 hover:text-rose-500">
                  <RemoveIcon />
                </button>
              </div>
              <div className="space-y-1.5">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="mb-0.5 text-[10px] font-medium text-stone-400">{isUk ? "Етап" : "Stage"}</p>
                    <input type="text" className={inputCls} value={qc.stage} onChange={(e) => update(i, { stage: e.target.value })}
                      placeholder={isUk ? "post_lysis, post_elution, batch_control…" : "post_lysis, post_elution, batch_control…"} />
                  </div>
                  <div>
                    <p className="mb-0.5 text-[10px] font-medium text-stone-400">{isUk ? "Метрика" : "Metric"}</p>
                    <input type="text" className={inputCls} value={qc.metric} onChange={(e) => update(i, { metric: e.target.value })}
                      placeholder="A260/A280, dsDNA concentration…" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="mb-0.5 text-[10px] font-medium text-stone-400">{isUk ? "Метод вимірювання" : "Measurement method"}</p>
                    <select className={inputCls} value={qc.method} onChange={(e) => update(i, { method: e.target.value })}>
                      <option value="">—</option>
                      {QC_METHODS.map((m) => <option key={m} value={m}>{m.replace(/_/g, " ")}</option>)}
                    </select>
                  </div>
                  <div>
                    <p className="mb-0.5 text-[10px] font-medium text-stone-400">{isUk ? "Дія при невдачі" : "Failure action"}</p>
                    <select className={inputCls} value={qc.failure_action} onChange={(e) => update(i, { failure_action: e.target.value })}>
                      {FAILURE_ACTIONS.map((a) => <option key={a} value={a}>{a.replace(/_/g, " ")}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <p className="mb-0.5 text-[10px] font-medium text-stone-400">{isUk ? "Порогове значення (напр. 1.7–1.9 або ≥10)" : "Threshold (e.g. 1.7–1.9 or ≥10)"}</p>
                    <input type="text" className={inputCls} value={qc.threshold} onChange={(e) => update(i, { threshold: e.target.value })}
                      placeholder="1.7–1.9 / ≥10 / no visible band…" />
                  </div>
                  <div>
                    <p className="mb-0.5 text-[10px] font-medium text-stone-400">{isUk ? "Одиниця" : "Unit"}</p>
                    <input type="text" className={inputCls} value={qc.unit} onChange={(e) => update(i, { unit: e.target.value })} placeholder="ng/µL" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <AddButton onClick={add} label={isUk ? "Додати контрольну точку" : "Add QC checkpoint"} />
    </div>
  );
}

// ── Troubleshooting guide ─────────────────────────────────────────────────────

type TroubleshootingItem = {
  symptom: string;
  causes: string;
  actions: string;
};

function TroubleshootingField({ field, value, onChange, locale }: {
  field: FieldDef; value: TroubleshootingItem[]; onChange: (v: TroubleshootingItem[]) => void; locale: string;
}) {
  const isUk = locale === "uk";
  const empty: TroubleshootingItem = { symptom: "", causes: "", actions: "" };

  function add() { onChange([...value, { ...empty }]); }
  function remove(i: number) { onChange(value.filter((_, idx) => idx !== i)); }
  function update(i: number, patch: Partial<TroubleshootingItem>) { onChange(value.map((t, idx) => idx === i ? { ...t, ...patch } : t)); }

  return (
    <div>
      <Label field={field} locale={locale} count={value.length} />
      {value.length === 0 ? (
        <div className="mb-2 rounded-lg border border-dashed border-stone-300 bg-stone-50/60 px-5 py-6 text-center">
          <span className="text-2xl">🔧</span>
          <p className="mt-2 text-sm font-semibold text-stone-600">{isUk ? "Нотаток з усунення неполадок ще немає" : "No troubleshooting entries yet"}</p>
          <p className="mt-1 text-xs leading-5 text-stone-400">
            {isUk ? "Документуйте типові симптоми, ймовірні причини та корекційні дії для майбутнього використання." : "Document common symptoms, likely causes, and corrective actions for future reference."}
          </p>
        </div>
      ) : (
        <div className="mb-2 space-y-2">
          {value.map((item, i) => (
            <div key={i} className="rounded-lg border border-stone-200 bg-white p-3 shadow-sm">
              <div className="mb-2 flex items-center gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">?{i + 1}</span>
                <button type="button" onClick={() => remove(i)} className="ml-auto rounded p-1 text-stone-400 transition hover:bg-rose-50 hover:text-rose-500">
                  <RemoveIcon />
                </button>
              </div>
              <div className="space-y-1.5">
                <div>
                  <p className="mb-0.5 text-[10px] font-semibold text-amber-700">{isUk ? "🔍 Симптом / Спостереження" : "🔍 Symptom / Observation"}</p>
                  <input type="text" className={inputCls} value={item.symptom} onChange={(e) => update(i, { symptom: e.target.value })}
                    placeholder={isUk ? "Низький вихід, низьке A260/A280, неспецифічні смуги…" : "Low yield, low A260/A280, non-specific bands…"} />
                </div>
                <div>
                  <p className="mb-0.5 text-[10px] font-semibold text-rose-700">{isUk ? "⚡ Ймовірні причини" : "⚡ Likely causes"}</p>
                  <textarea className={`${inputCls} resize-y`} rows={2} value={item.causes} onChange={(e) => update(i, { causes: e.target.value })}
                    placeholder={isUk ? "Неповний лізис, недостатній вхідний матеріал, залишковий гуанідин…" : "Incomplete lysis, insufficient input, residual guanidine carryover…"} />
                </div>
                <div>
                  <p className="mb-0.5 text-[10px] font-semibold text-emerald-700">{isUk ? "✅ Корекційні дії" : "✅ Corrective actions"}</p>
                  <textarea className={`${inputCls} resize-y`} rows={2} value={item.actions} onChange={(e) => update(i, { actions: e.target.value })}
                    placeholder={isUk ? "Подовжити лізис, підтвердити вхідну масу, повторити сухе центрифугування…" : "Extend lysis time, verify input mass, repeat dry spin…"} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <AddButton onClick={add} label={isUk ? "Додати запис" : "Add troubleshooting entry"} />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function TypedRecordFormFields({
  kind,
  typedData,
  onChange,
  locale,
}: {
  kind: string;
  typedData: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
  locale: string;
}) {
  const config = KIND_CONFIGS[kind];
  if (!config || config.fields.length === 0) return null;

  const isUk = locale === "uk";

  function set(key: string, value: unknown) { onChange({ ...typedData, [key]: value }); }
  function getStr(key: string): string {
    const v = typedData[key];
    return v === undefined || v === null ? "" : String(v);
  }

  // Complex types are always full-width; pair adjacent short scalar types
  const COMPLEX_TYPES: FieldDef["type"][] = ["steps", "risk_items", "repeatable", "reagents", "qc_points", "troubleshooting", "textarea"];
  const shortTypes: FieldDef["type"][] = ["date", "number", "select"];
  type Row = { type: "pair"; a: FieldDef; b: FieldDef } | { type: "single"; f: FieldDef };
  const rows: Row[] = [];
  let fi = 0;
  while (fi < config.fields.length) {
    const cur = config.fields[fi];
    const isComplex = COMPLEX_TYPES.includes(cur.type);
    if (!isComplex && shortTypes.includes(cur.type) && fi + 1 < config.fields.length) {
      const next = config.fields[fi + 1];
      const nextComplex = COMPLEX_TYPES.includes(next.type);
      if (!nextComplex && shortTypes.includes(next.type)) {
        rows.push({ type: "pair", a: cur, b: next });
        fi += 2;
        continue;
      }
    }
    rows.push({ type: "single", f: cur });
    fi++;
  }

  function renderField(field: FieldDef) {
    switch (field.type) {
      case "steps":
        return (
          <StepsField key={field.key} field={field}
            value={(typedData[field.key] as StepItem[]) ?? []}
            onChange={(v) => set(field.key, v)} locale={locale} />
        );
      case "risk_items":
        return (
          <RiskItemsField key={field.key} field={field}
            value={(typedData[field.key] as RiskItem[]) ?? []}
            onChange={(v) => set(field.key, v)} locale={locale} />
        );
      case "repeatable":
        return (
          <RepeatableTextField key={field.key} field={field}
            value={(typedData[field.key] as string[]) ?? []}
            onChange={(v) => set(field.key, v)} locale={locale} />
        );
      case "reagents":
        return (
          <ReagentsField key={field.key} field={field}
            value={(typedData[field.key] as ReagentItem[]) ?? []}
            onChange={(v) => set(field.key, v)} locale={locale} />
        );
      case "qc_points":
        return (
          <QcPointsField key={field.key} field={field}
            value={(typedData[field.key] as QcPoint[]) ?? []}
            onChange={(v) => set(field.key, v)} locale={locale} />
        );
      case "troubleshooting":
        return (
          <TroubleshootingField key={field.key} field={field}
            value={(typedData[field.key] as TroubleshootingItem[]) ?? []}
            onChange={(v) => set(field.key, v)} locale={locale} />
        );
      default: {
        const value = getStr(field.key);
        const onFieldChange = (v: string) => set(field.key, v);
        switch (field.type) {
          case "textarea": return <TextareaField key={field.key} field={field} value={value} onChange={onFieldChange} locale={locale} />;
          case "select":   return <SelectField   key={field.key} field={field} value={value} onChange={onFieldChange} locale={locale} />;
          case "number":   return <NumberField   key={field.key} field={field} value={value} onChange={onFieldChange} locale={locale} />;
          case "date":     return <DateField     key={field.key} field={field} value={value} onChange={onFieldChange} locale={locale} />;
          default:         return <TextField     key={field.key} field={field} value={value} onChange={onFieldChange} locale={locale} />;
        }
      }
    }
  }

  const colorMap: Record<string, string> = {
    indigo:  "border-indigo-200 bg-indigo-50/30",
    purple:  "border-purple-200 bg-purple-50/30",
    blue:    "border-blue-200 bg-blue-50/30",
    sky:     "border-sky-200 bg-sky-50/30",
    amber:   "border-amber-200 bg-amber-50/30",
    rose:    "border-rose-200 bg-rose-50/30",
    emerald: "border-emerald-200 bg-emerald-50/30",
    violet:  "border-violet-200 bg-violet-50/30",
    orange:  "border-orange-200 bg-orange-50/30",
  };
  const headerColorMap: Record<string, string> = {
    indigo:  "text-indigo-700",
    purple:  "text-purple-700",
    blue:    "text-blue-700",
    sky:     "text-sky-700",
    amber:   "text-amber-700",
    rose:    "text-rose-700",
    emerald: "text-emerald-700",
    violet:  "text-violet-700",
    orange:  "text-orange-700",
  };
  const accentColorMap: Record<string, string> = {
    indigo:  "bg-indigo-100",
    purple:  "bg-purple-100",
    blue:    "bg-blue-100",
    sky:     "bg-sky-100",
    amber:   "bg-amber-100",
    rose:    "bg-rose-100",
    emerald: "bg-emerald-100",
    violet:  "bg-violet-100",
    orange:  "bg-orange-100",
  };

  const borderColor = colorMap[config.color] ?? "border-stone-200 bg-stone-50/30";
  const headerColor = headerColorMap[config.color] ?? "text-stone-700";
  const accentColor = accentColorMap[config.color] ?? "bg-stone-100";

  const hint = KIND_HINTS[kind];
  const hintText = hint ? (isUk ? hint.uk : hint.en) : (isUk ? "Специфічні поля для цього типу запису" : "Type-specific fields for this record kind");

  return (
    <div className={`rounded-xl border ${borderColor} overflow-hidden`}>
      {/* Section header */}
      <div className={`flex items-start gap-3 px-5 py-3.5 ${accentColor}`}>
        <span className="mt-0.5 text-xl leading-none">{config.icon}</span>
        <div>
          <p className={`text-sm font-bold ${headerColor}`}>
            {isUk ? config.labelUk : config.labelEn}
            <span className="ml-1.5 font-normal text-stone-400">
              · {isUk ? config.groupUk : config.groupEn}
            </span>
          </p>
          <p className="mt-0.5 text-[11px] leading-4 text-stone-500">{hintText}</p>
        </div>
      </div>

      {/* Fields */}
      <div className="space-y-3 p-5">
        {rows.map((row, idx) => {
          if (row.type === "pair") {
            return (
              <div key={idx} className="grid grid-cols-2 gap-3">
                {renderField(row.a)}
                {renderField(row.b)}
              </div>
            );
          }
          return <div key={idx}>{renderField(row.f)}</div>;
        })}
      </div>
    </div>
  );
}
