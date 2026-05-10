"use client";

import { useState } from "react";
import {
  BookOpen,
  Beaker,
  Microscope,
  Building2,
  GraduationCap,
  Globe,
  Lock,
  Users,
  CheckCircle2,
  Circle,
  ChevronRight,
  Sparkles,
  CalendarDays,
  Tag,
  Layers,
} from "lucide-react";
import { createProjectWithTemplate } from "@/app/actions";
import { PROJECT_TEMPLATES, type TemplateId } from "@/lib/project-templates";
import type { Dictionary, Locale } from "@/lib/i18n";
import { projectTypes, researchFields } from "@/lib/schemas";

// ── Types ─────────────────────────────────────────────────────────────────────

interface WizardData {
  title: string;
  acronym: string;
  grantProgram: string;
  summary: string;
  startDate: string;
  endDate: string;
  projectType: string;
  researchField: string;
  defaultLocale: string;
  visibility: string;
  dataPolicy: string;
  repositoryPlan: string;
  ethicsReview: string;
  template: TemplateId;
}

// ── Step bar ──────────────────────────────────────────────────────────────────

const STEPS_UK = [
  { label: "Основне", desc: "Назва, програма, терміни" },
  { label: "Деталі", desc: "Тип, галузь, доступ" },
  { label: "Шаблон", desc: "Структура WBS" },
  { label: "Огляд", desc: "Перевірка й створення" },
];
const STEPS_EN = [
  { label: "Basic", desc: "Title, programme, dates" },
  { label: "Details", desc: "Type, field, access" },
  { label: "Template", desc: "WBS structure" },
  { label: "Review", desc: "Check & create" },
];

function StepBar({ current, isUk }: { current: number; isUk: boolean }) {
  const steps = isUk ? STEPS_UK : STEPS_EN;
  return (
    <div className="flex items-start gap-0">
      {steps.map((step, i) => {
        const n = i + 1;
        const done = n < current;
        const active = n === current;
        const last = i === steps.length - 1;
        return (
          <div key={n} className="flex flex-1 flex-col items-center gap-1.5">
            <div className="flex w-full items-center">
              {/* Left connector */}
              <div
                className={`h-0.5 flex-1 transition-colors duration-300 ${i === 0 ? "opacity-0" : done || active ? "bg-blue-500" : "bg-stone-200"}`}
              />
              {/* Circle */}
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold transition-all duration-300 ${
                  done
                    ? "border-blue-500 bg-blue-500 text-white shadow-md shadow-blue-200"
                    : active
                      ? "border-blue-500 bg-white text-blue-600 shadow-lg shadow-blue-100 ring-4 ring-blue-50"
                      : "border-stone-200 bg-white text-stone-400"
                }`}
              >
                {done ? <CheckCircle2 className="h-4.5 w-4.5" strokeWidth={2.5} /> : n}
              </div>
              {/* Right connector */}
              <div
                className={`h-0.5 flex-1 transition-colors duration-300 ${last ? "opacity-0" : done ? "bg-blue-500" : "bg-stone-200"}`}
              />
            </div>
            <div className="text-center">
              <p className={`text-xs font-semibold leading-tight transition-colors ${active ? "text-blue-700" : done ? "text-stone-600" : "text-stone-400"}`}>
                {step.label}
              </p>
              <p className={`hidden text-[10px] leading-tight sm:block ${active ? "text-blue-500" : "text-stone-400"}`}>
                {step.desc}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Field wrapper ─────────────────────────────────────────────────────────────

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1 text-sm font-semibold text-stone-700">
        {label}
        {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs leading-relaxed text-stone-400">{hint}</p>}
    </div>
  );
}

const inputCls = "input-control w-full px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400";

// ── Option card (clickable) ───────────────────────────────────────────────────

function OptionCard({
  value,
  current,
  onClick,
  icon,
  label,
  desc,
  accent,
}: {
  value: string;
  current: string;
  onClick: (v: string) => void;
  icon: React.ReactNode;
  label: string;
  desc?: string;
  accent?: string;
}) {
  const selected = current === value;
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={`group flex items-start gap-3 rounded-xl border-2 p-3.5 text-left transition-all duration-150 hover:-translate-y-0.5 ${
        selected
          ? `border-blue-500 bg-blue-50 shadow-md shadow-blue-100`
          : "border-stone-200 bg-white hover:border-blue-200 hover:bg-blue-50/30 hover:shadow-sm"
      }`}
    >
      <div
        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-base transition-colors ${
          selected ? "bg-blue-500 text-white shadow-sm" : `bg-stone-100 text-stone-500 group-hover:bg-blue-100 group-hover:text-blue-600`
        }`}
        style={selected && accent ? { background: accent } : undefined}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className={`text-sm font-semibold leading-tight ${selected ? "text-blue-800" : "text-stone-700"}`}>
          {label}
        </p>
        {desc && (
          <p className={`mt-0.5 text-xs leading-relaxed ${selected ? "text-blue-600" : "text-stone-400"}`}>
            {desc}
          </p>
        )}
      </div>
      {selected && <CheckCircle2 className="ml-auto mt-0.5 h-4 w-4 shrink-0 text-blue-500" />}
    </button>
  );
}

// ── Section heading ───────────────────────────────────────────────────────────

function SectionLabel({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 pb-1">
      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-100 text-blue-600">
        {icon}
      </span>
      <span className="text-xs font-bold uppercase tracking-wider text-stone-500">{text}</span>
    </div>
  );
}

// ── Project type icons ────────────────────────────────────────────────────────

const projectTypeOptions = (isUk: boolean) => [
  { value: "fundamental", icon: <Microscope className="h-4 w-4" />, label: isUk ? "Фундаментальне" : "Fundamental", desc: isUk ? "Базові наукові дослідження" : "Basic scientific research" },
  { value: "applied", icon: <Beaker className="h-4 w-4" />, label: isUk ? "Прикладне" : "Applied", desc: isUk ? "Практичне застосування" : "Practical applications" },
  { value: "experimental", icon: <Sparkles className="h-4 w-4" />, label: isUk ? "Дослідно-конструкторське" : "Experimental dev.", desc: isUk ? "Розробка технологій" : "Technology development" },
  { value: "dissertation", icon: <GraduationCap className="h-4 w-4" />, label: isUk ? "Дисертація" : "Dissertation", desc: isUk ? "PhD/кандидатська" : "PhD/doctoral work" },
  { value: "grant", icon: <Building2 className="h-4 w-4" />, label: isUk ? "Грантовий" : "Grant", desc: isUk ? "Фінансований грант" : "Funded grant project" },
  { value: "internship", icon: <Users className="h-4 w-4" />, label: isUk ? "Стажування" : "Internship", desc: isUk ? "Наукове стажування" : "Research internship" },
];

const visibilityOptions = (isUk: boolean) => [
  { value: "private", icon: <Lock className="h-4 w-4" />, label: isUk ? "Приватний" : "Private", desc: isUk ? "Тільки ви" : "Only you" },
  { value: "team", icon: <Users className="h-4 w-4" />, label: isUk ? "Команда" : "Team", desc: isUk ? "Учасники проєкту" : "Project members" },
  { value: "public_profile", icon: <Globe className="h-4 w-4" />, label: isUk ? "Публічний" : "Public", desc: isUk ? "Відкритий перегляд" : "Open to everyone" },
];

// ── Main wizard ───────────────────────────────────────────────────────────────

export function ProjectWizard({
  locale,
  dictionary,
}: {
  locale: Locale;
  dictionary: Dictionary;
}) {
  const isUk = locale === "uk";
  const [step, setStep] = useState(1);
  const TOTAL = 4;

  const [data, setData] = useState<WizardData>({
    title: "",
    acronym: "",
    grantProgram: "",
    summary: "",
    startDate: "",
    endDate: "",
    projectType: "fundamental",
    researchField: "physiology",
    defaultLocale: locale,
    visibility: "private",
    dataPolicy: "embargo_then_open",
    repositoryPlan: "github_zenodo",
    ethicsReview: "planned",
    template: "phd_dissertation",
  });

  const set = <K extends keyof WizardData>(key: K, value: WizardData[K]) =>
    setData((prev) => ({ ...prev, [key]: value }));

  const isGrant = data.projectType === "grant";
  const step1Valid =
    data.title.trim().length >= 3 &&
    data.acronym.trim().length >= 2 &&
    (!isGrant || data.grantProgram.trim().length >= 2);

  // ── Context-aware field config for "grant program" field ──────────────────

  const programFieldConfig: Record<
    string,
    { label: string; placeholder: string; hint: string; required: boolean }
  > = {
    grant: {
      label: isUk ? "Грантова програма / фінансувальник" : "Grant programme / funder",
      placeholder: isUk ? "Молодий вчений НАН України 2025–2027" : "Young Scientist NAS of Ukraine 2025–2027",
      hint: isUk
        ? "Вкажіть офіційну назву гранту або фінансової програми."
        : "Enter the official name of the grant or funding programme.",
      required: true,
    },
    dissertation: {
      label: isUk ? "Університет / кафедра / спеціальність" : "University / department / specialty",
      placeholder: isUk
        ? "КНУ ім. Тараса Шевченка, каф. молекулярної біології, 091"
        : "Taras Shevchenko NUK, Dept. Molecular Biology, 091",
      hint: isUk
        ? "Не обов'язково. Установа, кафедра або освітньо-наукова програма."
        : "Optional. Institution, department or educational-scientific programme.",
      required: false,
    },
    fundamental: {
      label: isUk ? "Установа / тема НДР" : "Institution / R&D topic",
      placeholder: isUk
        ? "ІФБ НАН України, НДР «...» № 0124U001234"
        : "Institute, NAS of Ukraine, R&D topic #0124U001234",
      hint: isUk
        ? "Не обов'язково. Установа-виконавець та номер держреєстрації теми."
        : "Optional. Executing institution and state-registration topic number.",
      required: false,
    },
    applied: {
      label: isUk ? "Замовник / фінансувальник" : "Client / funder",
      placeholder: isUk ? "МОН України, внутрішній конкурс 2025" : "Ministry of Education, internal call 2025",
      hint: isUk
        ? "Не обов'язково. Організація-замовник або джерело фінансування."
        : "Optional. Contracting organization or funding source.",
      required: false,
    },
    experimental: {
      label: isUk ? "Замовник / договір" : "Client / contract",
      placeholder: isUk ? "ДП «НВП Аерон», договір № 12/2025" : "State Enterprise R&D, contract #12/2025",
      hint: isUk ? "Не обов'язково." : "Optional.",
      required: false,
    },
    internship: {
      label: isUk ? "Приймаюча установа / програма" : "Host institution / programme",
      placeholder: isUk
        ? "Max Planck Institute, DAAD Research Stays 2025"
        : "Max Planck Institute, DAAD Research Stays 2025",
      hint: isUk
        ? "Не обов'язково. Установа або програма стажування."
        : "Optional. Host institution or internship programme.",
      required: false,
    },
  };

  const pf = programFieldConfig[data.projectType] ?? {
    label: isUk ? "Установа / програма" : "Institution / programme",
    placeholder: isUk ? "Назва установи або програми" : "Institution or programme name",
    hint: isUk ? "Не обов'язково." : "Optional.",
    required: false,
  };

  // ── Quick-type pill bar ────────────────────────────────────────────────────

  const QUICK_TYPES = [
    { value: "dissertation", emoji: "🎓", label: isUk ? "Дисертація" : "Dissertation" },
    { value: "grant",        emoji: "📊", label: isUk ? "Грант" : "Grant" },
    { value: "fundamental",  emoji: "🔬", label: isUk ? "НДР" : "Research" },
    { value: "applied",      emoji: "⚗️", label: isUk ? "Прикладне" : "Applied" },
    { value: "experimental", emoji: "⚙️", label: isUk ? "ДКР" : "Dev." },
    { value: "internship",   emoji: "🌍", label: isUk ? "Стажування" : "Internship" },
  ];

  // ── Step 1 ────────────────────────────────────────────────────────────────

  const renderStep1 = () => (
    <div className="space-y-6">

      {/* Quick project type selector */}
      <div className="space-y-2">
        <SectionLabel icon={<Tag className="h-3.5 w-3.5" />} text={isUk ? "Тип проєкту" : "Project type"} />
        <div className="flex flex-wrap gap-2">
          {QUICK_TYPES.map((t) => {
            const active = data.projectType === t.value;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => set("projectType", t.value)}
                className={`flex items-center gap-1.5 rounded-full border-2 px-3.5 py-1.5 text-xs font-semibold transition-all duration-150 ${
                  active
                    ? "border-blue-500 bg-blue-500 text-white shadow-md shadow-blue-200"
                    : "border-stone-200 bg-white text-stone-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                }`}
              >
                <span>{t.emoji}</span>
                {t.label}
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-stone-400">
          {isUk
            ? "Тип визначає контекст полів нижче. Деталі можна уточнити на наступному кроці."
            : "The type sets the field context below. Details can be refined on the next step."}
        </p>
      </div>

      {/* Title + Acronym */}
      <div className="space-y-3">
        <SectionLabel icon={<Tag className="h-3.5 w-3.5" />} text={isUk ? "Ідентифікація проєкту" : "Project identity"} />
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <Field
              label={isUk ? "Повна назва проєкту" : "Full project title"}
              required
              hint={isUk ? "Так, як буде у звітах та публікаціях" : "As it will appear in reports and publications"}
            >
              <input
                className={inputCls}
                value={data.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder={
                  data.projectType === "dissertation"
                    ? isUk ? "Механізми регуляції апоптозу при гіпоксії міокарда" : "Mechanisms of apoptosis regulation under myocardial hypoxia"
                    : data.projectType === "grant"
                    ? isUk ? "Дослідження молекулярних механізмів кардіопротекції" : "Investigation of cardioprotection molecular mechanisms"
                    : isUk ? "Назва наукового дослідження або проєкту" : "Research project title"
                }
                maxLength={200}
              />
              {data.title.length > 0 && (
                <p className={`mt-0.5 text-right text-[10px] font-mono ${data.title.length >= 3 ? "text-emerald-600" : "text-rose-500"}`}>
                  {data.title.length}/200 {data.title.length >= 3 ? "✓" : `(${isUk ? "мін. 3 символи" : "min. 3 chars"})`}
                </p>
              )}
            </Field>
          </div>
          <Field
            label={isUk ? "Акронім" : "Acronym"}
            required
            hint={isUk ? "2–32 символи" : "2–32 chars"}
          >
            <input
              className={`${inputCls} font-mono uppercase tracking-widest`}
              value={data.acronym}
              onChange={(e) => set("acronym", e.target.value.toUpperCase())}
              placeholder={
                data.projectType === "dissertation" ? "PHD-2025"
                : data.projectType === "grant" ? "GRANT-25"
                : "PROJ-25"
              }
              maxLength={32}
            />
            {data.acronym.length > 0 && (
              <p className={`mt-0.5 text-right text-[10px] font-mono ${data.acronym.length >= 2 ? "text-emerald-600" : "text-rose-500"}`}>
                {data.acronym.length >= 2 ? "✓" : isUk ? "мін. 2 символи" : "min. 2 chars"}
              </p>
            )}
          </Field>
        </div>
      </div>

      {/* Adaptive program / institution field */}
      <Field label={pf.label} required={pf.required} hint={pf.hint}>
        <input
          className={inputCls}
          value={data.grantProgram}
          onChange={(e) => set("grantProgram", e.target.value)}
          placeholder={pf.placeholder}
          maxLength={160}
        />
      </Field>

      {/* Abstract */}
      <Field
        label={isUk ? "Короткий опис / анотація" : "Short description / abstract"}
        hint={isUk ? "Не обов'язково. 2–3 речення про суть дослідження." : "Optional. 2–3 sentences about the research focus."}
      >
        <textarea
          className={`${inputCls} min-h-[80px] resize-y leading-relaxed`}
          value={data.summary}
          onChange={(e) => set("summary", e.target.value)}
          placeholder={isUk ? "Опис мети, підходів та очікуваних результатів..." : "Description of the aim, approaches and expected outcomes..."}
          maxLength={1200}
        />
      </Field>

      {/* Timeline */}
      <div className="space-y-2">
        <SectionLabel icon={<CalendarDays className="h-3.5 w-3.5" />} text={isUk ? "Терміни реалізації" : "Project timeline"} />
        <p className="text-[11px] text-stone-400">
          {isUk
            ? "Використовуються для автоматичного розрахунку дат етапів у шаблоні WBS."
            : "Used to automatically calculate stage dates in the WBS template."}
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={isUk ? "Дата початку" : "Start date"}>
            <input type="date" className={inputCls} value={data.startDate} onChange={(e) => set("startDate", e.target.value)} />
          </Field>
          <Field label={isUk ? "Дата завершення" : "End date"}>
            <input type="date" className={inputCls} value={data.endDate} onChange={(e) => set("endDate", e.target.value)} />
          </Field>
        </div>
      </div>
    </div>
  );

  // ── Step 2 ────────────────────────────────────────────────────────────────

  const renderStep2 = () => (
    <div className="space-y-6">
      {/* Confirm/refine type */}
      <div>
        <SectionLabel icon={<Microscope className="h-3.5 w-3.5" />} text={isUk ? "Тип проєкту" : "Project type"} />
        <p className="mb-2 text-[11px] text-stone-400">
          {isUk ? "Підтвердіть або змініть тип — він впливає на шаблони звітів та поля форм." : "Confirm or change the type — it affects report templates and form fields."}
        </p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {projectTypeOptions(isUk).map((opt) => (
            <OptionCard key={opt.value} {...opt} current={data.projectType} onClick={(v) => set("projectType", v)} />
          ))}
        </div>
      </div>

      {/* Research field */}
      <div>
        <SectionLabel icon={<BookOpen className="h-3.5 w-3.5" />} text={isUk ? "Галузь досліджень" : "Research field"} />
        <div className="mt-2">
          <select className={inputCls} value={data.researchField} onChange={(e) => set("researchField", e.target.value)}>
            {researchFields.map((v) => (
              <option key={v} value={v}>{dictionary.projects.fieldOptions[v]}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Visibility */}
      <div>
        <SectionLabel icon={<Lock className="h-3.5 w-3.5" />} text={isUk ? "Видимість і доступ" : "Visibility & access"} />
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {visibilityOptions(isUk).map((opt) => (
            <OptionCard key={opt.value} {...opt} current={data.visibility} onClick={(v) => set("visibility", v)} />
          ))}
        </div>
      </div>

      {/* Language + data policy + ethics */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label={isUk ? "Мова проєкту" : "Project language"}>
          <select className={inputCls} value={data.defaultLocale} onChange={(e) => set("defaultLocale", e.target.value)}>
            <option value="uk">🇺🇦 Українська</option>
            <option value="en">🇬🇧 English</option>
          </select>
        </Field>
        <Field label={isUk ? "Політика даних" : "Data policy"}>
          <select className={inputCls} value={data.dataPolicy} onChange={(e) => set("dataPolicy", e.target.value)}>
            <option value="internal">{dictionary.projects.dataPolicyOptions.internal}</option>
            <option value="open_by_default">{dictionary.projects.dataPolicyOptions.open_by_default}</option>
            <option value="embargo_then_open">{dictionary.projects.dataPolicyOptions.embargo_then_open}</option>
            <option value="restricted_sensitive">{dictionary.projects.dataPolicyOptions.restricted_sensitive}</option>
          </select>
        </Field>
        <Field label={isUk ? "Етична експертиза" : "Ethics review"}>
          <select className={inputCls} value={data.ethicsReview} onChange={(e) => set("ethicsReview", e.target.value)}>
            <option value="not_required">{dictionary.projects.ethicsOptions.not_required}</option>
            <option value="planned">{dictionary.projects.ethicsOptions.planned}</option>
            <option value="approved">{dictionary.projects.ethicsOptions.approved}</option>
          </select>
        </Field>
      </div>
    </div>
  );

  // ── Step 3 ────────────────────────────────────────────────────────────────

  const renderStep3 = () => {
    const templates = Object.values(PROJECT_TEMPLATES);
    return (
      <div className="space-y-4">
        <p className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm leading-relaxed text-blue-800">
          {isUk
            ? "⚡ Оберіть шаблон — система одразу створить усі етапи, ключові дати та зв'язки. Все можна змінити після створення."
            : "⚡ Choose a template — the system will instantly create all stages, milestones and links. Everything can be edited after creation."}
        </p>

        <div className="space-y-3">
          {templates.map((tpl) => {
            const selected = data.template === tpl.id;
            const isPhd = tpl.id === "phd_dissertation";
            return (
              <button
                key={tpl.id}
                type="button"
                onClick={() => set("template", tpl.id)}
                className={`group w-full rounded-xl border-2 p-5 text-left transition-all duration-200 ${
                  selected
                    ? "border-blue-500 bg-blue-50 shadow-lg shadow-blue-100"
                    : "border-stone-200 bg-white hover:border-blue-200 hover:bg-blue-50/20 hover:shadow-md"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl shadow-sm transition-transform group-hover:scale-105 ${
                      selected ? "bg-blue-100 shadow-blue-200" : "bg-stone-100"
                    }`}
                  >
                    {tpl.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className={`text-sm font-bold ${selected ? "text-blue-900" : "text-stone-800"}`}>
                        {isUk ? tpl.labelUk : tpl.labelEn}
                      </h3>
                      {isPhd && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                          {isUk ? "РЕКОМЕНДОВАНО" : "RECOMMENDED"}
                        </span>
                      )}
                      {selected && <CheckCircle2 className="ml-auto h-5 w-5 shrink-0 text-blue-500" />}
                    </div>
                    <p className={`mt-0.5 text-xs ${selected ? "text-blue-600" : "text-stone-500"}`}>
                      {isUk ? tpl.descriptionUk : tpl.descriptionEn}
                    </p>
                  </div>
                </div>

                {tpl.stages.length > 0 && (
                  <div className={`mt-4 rounded-lg border p-3 ${selected ? "border-blue-200 bg-white" : "border-stone-100 bg-stone-50/80"}`}>
                    <p className={`mb-2 text-[10px] font-bold uppercase tracking-wider ${selected ? "text-blue-500" : "text-stone-400"}`}>
                      {isUk ? "Етапи WBS" : "WBS Stages"}
                    </p>
                    <div className="grid gap-1 sm:grid-cols-2">
                      {tpl.stages.map((s) => (
                        <div key={s.stageNumber} className="flex items-center gap-2">
                          <span className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${selected ? "bg-blue-500 text-white" : "bg-stone-300 text-white"}`}>
                            {s.stageNumber}
                          </span>
                          <span className={`truncate text-[11px] leading-tight ${selected ? "text-blue-800" : "text-stone-600"}`}>
                            {isUk ? s.title : s.titleEn}
                          </span>
                        </div>
                      ))}
                    </div>
                    <p className={`mt-2 text-[10px] ${selected ? "text-blue-500" : "text-stone-400"}`}>
                      + {tpl.stages.length} {isUk ? "ключових дат (вісей)" : "milestones"}
                    </p>
                  </div>
                )}

                {tpl.stages.length === 0 && (
                  <div className={`mt-4 rounded-lg border p-3 text-xs ${selected ? "border-blue-200 bg-white text-blue-600" : "border-stone-100 bg-stone-50 text-stone-400"}`}>
                    {isUk ? "Починаєте з чистого аркуша. Всі етапи створюєте вручну." : "Start with a blank slate. All stages added manually."}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // ── Step 4 ────────────────────────────────────────────────────────────────

  const renderStep4 = () => {
    const tpl = PROJECT_TEMPLATES[data.template];
    const typeLabel = projectTypeOptions(isUk).find((o) => o.value === data.projectType)?.label ?? data.projectType;
    const visLabel = visibilityOptions(isUk).find((o) => o.value === data.visibility)?.label ?? data.visibility;

    return (
      <form action={createProjectWithTemplate} className="space-y-5">
        {/* Hidden fields */}
        {(Object.keys(data) as (keyof WizardData)[]).map((key) => (
          <input key={key} type="hidden" name={key} value={data[key]} />
        ))}
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="openScienceEnabled" value="on" />
        <input type="hidden" name="teamChatEnabled" value="on" />
        <input type="hidden" name="taskManagementEnabled" value="on" />
        <input type="hidden" name="rawDataRegistryEnabled" value="on" />

        {/* Project identity card */}
        <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
          <div className="border-b border-stone-100 bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4">
            <p className="font-mono text-xs font-bold uppercase tracking-widest text-blue-200">
              {data.grantProgram
                ? `${pf.label}: ${data.grantProgram}`
                : (QUICK_TYPES.find((t) => t.value === data.projectType)?.emoji ?? "") +
                  " " +
                  (QUICK_TYPES.find((t) => t.value === data.projectType)?.label ??
                    (isUk ? "Проєкт" : "Project"))}
            </p>
            <h2 className="mt-1 text-lg font-bold leading-snug text-white">
              {data.title}
            </h2>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="rounded-full bg-white/20 px-2.5 py-0.5 font-mono text-xs font-bold text-white">
                {data.acronym}
              </span>
              <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs text-blue-100">
                {typeLabel}
              </span>
              <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs text-blue-100">
                {visLabel}
              </span>
            </div>
          </div>
          <dl className="divide-y divide-stone-50">
            {data.startDate && (
              <div className="flex items-center justify-between px-5 py-2.5">
                <dt className="text-xs text-stone-400">{isUk ? "Початок" : "Start"}</dt>
                <dd className="text-sm font-medium text-stone-700">{data.startDate}</dd>
              </div>
            )}
            {data.endDate && (
              <div className="flex items-center justify-between px-5 py-2.5">
                <dt className="text-xs text-stone-400">{isUk ? "Завершення" : "End"}</dt>
                <dd className="text-sm font-medium text-stone-700">{data.endDate}</dd>
              </div>
            )}
            <div className="flex items-center justify-between px-5 py-2.5">
              <dt className="text-xs text-stone-400">{isUk ? "Шаблон WBS" : "WBS Template"}</dt>
              <dd className="flex items-center gap-1.5 text-sm font-medium text-stone-700">
                <span>{tpl.icon}</span>
                {isUk ? tpl.labelUk : tpl.labelEn}
              </dd>
            </div>
            <div className="flex items-center justify-between px-5 py-2.5">
              <dt className="text-xs text-stone-400">{isUk ? "Мова" : "Language"}</dt>
              <dd className="text-sm font-medium text-stone-700">
                {data.defaultLocale === "uk" ? "🇺🇦 Українська" : "🇬🇧 English"}
              </dd>
            </div>
          </dl>
        </div>

        {/* Template stages preview */}
        {tpl.stages.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-indigo-200">
            <div className="flex items-center gap-2 border-b border-indigo-100 bg-indigo-50 px-5 py-3">
              <Layers className="h-4 w-4 text-indigo-500" />
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                {isUk ? `Буде створено ${tpl.stages.length} етапів + ${tpl.stages.length} ключових дат` : `Will create ${tpl.stages.length} stages + ${tpl.stages.length} milestones`}
              </p>
            </div>
            <div className="divide-y divide-indigo-50">
              {tpl.stages.map((s, i) => (
                <div key={s.stageNumber} className="flex items-center gap-3 px-5 py-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-[11px] font-bold text-white shadow-sm">
                    {s.stageNumber}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-indigo-900">
                      {isUk ? s.title : s.titleEn}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-mono text-indigo-600">
                    {s.endWeek - s.startWeek} {isUk ? "тиж." : "wk"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.summary && (
          <div className="rounded-xl border border-stone-200 bg-stone-50 px-5 py-4">
            <p className="mb-1 text-xs font-bold uppercase tracking-wider text-stone-400">{isUk ? "Анотація" : "Abstract"}</p>
            <p className="text-sm leading-relaxed text-stone-600">{data.summary}</p>
          </div>
        )}

        <button
          type="submit"
          className="group relative w-full overflow-hidden rounded-xl border-0 bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 px-6 py-4 text-sm font-bold text-white shadow-lg shadow-blue-200 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-300 active:translate-y-0"
        >
          <span className="relative flex items-center justify-center gap-2">
            <Sparkles className="h-4 w-4" />
            {isUk ? `Створити проєкт «${data.acronym}»` : `Create project "${data.acronym}"`}
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </button>
      </form>
    );
  };

  // ── Step header ───────────────────────────────────────────────────────────

  const stepTitles = isUk
    ? ["Основна інформація", "Класифікація та параметри", "Оберіть шаблон WBS", "Перегляд і створення"]
    : ["Basic information", "Classification & parameters", "Choose WBS template", "Review and create"];
  const stepDescs = isUk
    ? ["Назва, акронім, грантова програма та терміни", "Тип проєкту, галузь, видимість і доступ", "Автоматично створить структуру з етапів і дат", "Перевірте дані — після натискання кнопки проєкт буде створено"]
    : ["Title, acronym, grant programme and dates", "Project type, research field, visibility and access", "Auto-creates a structure of stages and milestones", "Review the data — the project will be created on submit"];

  // ── Layout ────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-12">
      {/* Step bar */}
      <div className="surface px-6 py-5">
        <StepBar current={step} isUk={isUk} />
      </div>

      {/* Step content */}
      <div className="surface overflow-hidden">
        {/* Step header */}
        <div className="border-b border-stone-100 bg-gradient-to-r from-stone-50 to-blue-50/30 px-6 py-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-wider text-blue-500">
                {isUk ? `Крок ${step} з ${TOTAL}` : `Step ${step} of ${TOTAL}`}
              </p>
              <h2 className="mt-1 text-xl font-bold text-stone-900">{stepTitles[step - 1]}</h2>
              <p className="mt-0.5 text-sm text-stone-500">{stepDescs[step - 1]}</p>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-xl">
              {["📋", "🏷️", "📐", "🚀"][step - 1]}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
        </div>
      </div>

      {/* Navigation */}
      {step < 4 && (
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 1}
            className="control flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold disabled:pointer-events-none disabled:opacity-40"
          >
            ← {isUk ? "Назад" : "Back"}
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: TOTAL }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i + 1 === step ? "w-6 bg-blue-500" : i + 1 < step ? "w-2.5 bg-blue-300" : "w-2.5 bg-stone-200"
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            disabled={step === 1 && !step1Valid}
            className="control-primary flex items-center gap-1.5 rounded-lg px-5 py-2.5 text-sm font-semibold disabled:pointer-events-none disabled:opacity-40"
          >
            {isUk ? "Далі" : "Next"}
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {step === 4 && (
        <button
          type="button"
          onClick={() => setStep(3)}
          className="control flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold"
        >
          ← {isUk ? "Назад до шаблону" : "Back to template"}
        </button>
      )}
    </div>
  );
}
