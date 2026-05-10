"use client";

import { X, ChevronLeft, ChevronRight, Check, Globe, Lock, Users, BookOpen, RefreshCw, Info } from "lucide-react";
import { useMemo, useState } from "react";
import { createRecord } from "@/app/actions";
import { KIND_CONFIGS, getKindsByGroup } from "@/lib/record-field-definitions";
import { TypedRecordFormFields } from "@/components/records/typed-record-form-fields";
import { LicensePicker } from "@/components/license-picker";
import { localizeStageLabel, type Dictionary } from "@/lib/i18n";
import type { Project, ProjectRecord, SafeUser } from "@/lib/schemas";

// ── Helpers ───────────────────────────────────────────────────────────────────

function userDisplayName(u: SafeUser) {
  return [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email;
}

function sanitize(v: string) {
  return v.normalize("NFKD").replace(/[^\w]+/g, "").toUpperCase().slice(0, 16) || "PRJ";
}

function buildLocalId(
  existing: ProjectRecord[],
  kind: string,
  project: Project | undefined,
  stage: string,
) {
  const acronym = sanitize(project?.acronym || "PRJ");
  const prefix = KIND_CONFIGS[kind]?.prefix ?? "REC";
  const year = new Date().getFullYear();
  const s = stage.replace(/\D+/g, "");
  const stageCode = s ? `S${s}` : "S0";
  const base = `${acronym}-${prefix}-${year}-${stageCode}`;
  const next =
    existing
      .map((r) => r.localId)
      .filter((id) => id.startsWith(base))
      .map((id) => parseInt(id.split("-").at(-1) ?? "0", 10))
      .filter(Number.isFinite)
      .reduce((max, v) => Math.max(max, v), 0) + 1;
  return `${base}-${String(next).padStart(3, "0")}`;
}

function defaultFormatForKind(kind: string) {
  if (["protocol", "sop", "data_collection_protocol", "analysis_protocol"].includes(kind)) return "protocol_document";
  if (kind === "output") return "archive";
  if (kind === "sample") return "xlsx";
  return "mixed";
}

const kindsByGroup = getKindsByGroup();

// ── Step indicator ────────────────────────────────────────────────────────────

const STEP_LABELS_UK = ["Тип", "Інфо", "Поля", "Доступ", "Огляд"];
const STEP_LABELS_EN = ["Type", "Info", "Fields", "Access", "Review"];

function StepIndicator({
  current,
  steps,
  locale,
}: {
  current: number;
  steps: number[];
  locale: string;
}) {
  const labels = locale === "uk" ? STEP_LABELS_UK : STEP_LABELS_EN;
  return (
    <div className="flex items-center gap-1 mt-3">
      {steps.map((stepNum, i) => {
        const done = stepNum < current;
        const active = stepNum === current;
        return (
          <div key={stepNum} className="flex items-center gap-1 flex-1">
            <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-all ${
              done ? "bg-emerald-500 text-white" : active ? "bg-blue-600 text-white ring-2 ring-blue-200" : "bg-slate-100 text-slate-400"
            }`}>
              {done ? <Check className="h-3 w-3" /> : stepNum}
            </div>
            <span className={`hidden text-[10px] font-medium sm:block ${
              active ? "text-blue-700" : done ? "text-emerald-600" : "text-slate-400"
            }`}>
              {labels[stepNum - 1] ?? ""}
            </span>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 rounded-full ${done ? "bg-emerald-300" : "bg-slate-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Step 1: Kind picker ───────────────────────────────────────────────────────

function KindStep({
  selected,
  onSelect,
  locale,
}: {
  selected: string;
  onSelect: (k: string) => void;
  locale: string;
}) {
  const isUk = locale === "uk";
  const colorBg: Record<string, string> = {
    indigo: "bg-indigo-50 border-indigo-200 hover:border-indigo-400",
    purple: "bg-purple-50 border-purple-200 hover:border-purple-400",
    blue:   "bg-blue-50 border-blue-200 hover:border-blue-400",
    sky:    "bg-sky-50 border-sky-200 hover:border-sky-400",
    amber:  "bg-amber-50 border-amber-200 hover:border-amber-400",
    rose:   "bg-rose-50 border-rose-200 hover:border-rose-400",
    emerald:"bg-emerald-50 border-emerald-200 hover:border-emerald-400",
    violet: "bg-violet-50 border-violet-200 hover:border-violet-400",
    orange: "bg-orange-50 border-orange-200 hover:border-orange-400",
  };
  const colorText: Record<string, string> = {
    indigo: "text-indigo-700", purple: "text-purple-700", blue: "text-blue-700",
    sky: "text-sky-700", amber: "text-amber-700", rose: "text-rose-700",
    emerald: "text-emerald-700", violet: "text-violet-700", orange: "text-orange-700",
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-bold text-slate-900">{isUk ? "Оберіть тип запису" : "Choose record type"}</h3>
        <p className="mt-0.5 text-xs text-slate-500">
          {isUk ? "Кожен тип має власні поля та метадані, призначені для цього класу наукових матеріалів." : "Each type has its own fields and metadata designed for that class of scientific materials."}
        </p>
      </div>

      {kindsByGroup.map(({ group, kinds }) => (
        <div key={group.id}>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">{isUk ? group.uk : group.en}</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {kinds.map((k) => {
              const cfg = KIND_CONFIGS[k];
              if (!cfg) return null;
              const isSelected = selected === k;
              const bgCls = colorBg[cfg.color] ?? "bg-slate-50 border-slate-200 hover:border-slate-400";
              const textCls = colorText[cfg.color] ?? "text-slate-700";
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => onSelect(k)}
                  className={`group relative flex items-start gap-2.5 rounded-lg border-2 p-3 text-left transition-all ${bgCls} ${
                    isSelected ? "ring-2 ring-blue-400 ring-offset-1 border-blue-400" : ""
                  }`}
                >
                  {isSelected && (
                    <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-white">
                      <Check className="h-2.5 w-2.5" />
                    </span>
                  )}
                  <span className="mt-0.5 text-xl leading-none">{cfg.icon}</span>
                  <div className="min-w-0">
                    <p className={`text-xs font-bold leading-tight ${textCls}`}>{isUk ? cfg.labelUk : cfg.labelEn}</p>
                    <p className="mt-0.5 text-[10px] font-mono text-slate-400">{cfg.prefix}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Step 2: Basic info ────────────────────────────────────────────────────────

function InfoStep({
  kind,
  title, setTitle,
  stage, setStage,
  group, setGroup,
  idMode, setIdMode,
  manualId, setManualId,
  autoId,
  projects, projectId, setProjectId,
  locale,
  dictionary,
}: {
  kind: string;
  title: string; setTitle: (v: string) => void;
  stage: string; setStage: (v: string) => void;
  group: string; setGroup: (v: string) => void;
  idMode: "auto" | "manual"; setIdMode: (v: "auto" | "manual") => void;
  manualId: string; setManualId: (v: string) => void;
  autoId: string;
  projects: Project[]; projectId: string; setProjectId: (v: string) => void;
  locale: string;
  dictionary: Dictionary;
}) {
  const isUk = locale === "uk";
  const cfg = KIND_CONFIGS[kind];
  const fc = "input-control w-full px-3 py-2 text-sm outline-none";

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-bold text-slate-900">{isUk ? "Основна інформація" : "Basic information"}</h3>
        {cfg && (
          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
            <span>{cfg.icon}</span>
            <span className="font-medium">{isUk ? cfg.labelUk : cfg.labelEn}</span>
            <span>·</span>
            <span>{isUk ? cfg.groupUk : cfg.groupEn}</span>
          </div>
        )}
      </div>

      {/* Title — prominent */}
      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-700">
          {isUk ? "Назва запису" : "Record title"} <span className="text-rose-500">*</span>
        </label>
        <input
          className={`${fc} text-base font-medium`}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={isUk ? "Коротка описова назва…" : "Short descriptive title…"}
          autoFocus
        />
      </div>

      {/* Project + Stage */}
      <div className="grid grid-cols-2 gap-3">
        {projects.length > 1 && (
          <label className="block space-y-1">
            <span className="text-xs font-semibold text-slate-700">{dictionary.projects.project}</span>
            <select className={fc} value={projectId} onChange={(e) => setProjectId(e.target.value)}>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>{p.acronym} — {p.title}</option>
              ))}
            </select>
          </label>
        )}
        <label className="block space-y-1">
          <span className="text-xs font-semibold text-slate-700">{dictionary.form.stage}</span>
          <select className={fc} value={stage} onChange={(e) => setStage(e.target.value)}>
            <option value="General">{isUk ? "Загальне" : "General"}</option>
            <option value="Stage 1">{localizeStageLabel("Stage 1", dictionary)}</option>
            <option value="Stage 2">{localizeStageLabel("Stage 2", dictionary)}</option>
            <option value="Stage 3">{localizeStageLabel("Stage 3", dictionary)}</option>
          </select>
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-semibold text-slate-700">{isUk ? "Група / серія" : "Group / batch"}</span>
          <input className={fc} value={group} onChange={(e) => setGroup(e.target.value)} placeholder="Experiment A / Batch 2" />
        </label>
      </div>

      {/* Local ID */}
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700">{dictionary.form.localId}</span>
          <div className="flex overflow-hidden rounded border border-slate-200 text-[10px] font-medium">
            <button type="button" onClick={() => setIdMode("auto")}
              className={`px-2.5 py-1 transition ${idMode === "auto" ? "bg-blue-600 text-white" : "bg-white text-slate-500"}`}>
              {isUk ? "Авто" : "Auto"}
            </button>
            <button type="button" onClick={() => setIdMode("manual")}
              className={`px-2.5 py-1 transition ${idMode === "manual" ? "bg-blue-600 text-white" : "bg-white text-slate-500"}`}>
              {isUk ? "Вручну" : "Manual"}
            </button>
          </div>
        </div>
        {idMode === "auto" ? (
          <code className="block rounded border border-slate-200 bg-white px-3 py-2 font-mono text-sm font-bold tracking-wide text-blue-800">
            {autoId}
          </code>
        ) : (
          <input className={`${fc} font-mono tracking-wide`} value={manualId}
            onChange={(e) => setManualId(e.target.value.toUpperCase())}
            placeholder={`${sanitize(projects.find(p => p._id === projectId)?.acronym || "PRJ")}-REC-${new Date().getFullYear()}-S1-001`} />
        )}
        <p className="text-[10px] text-stone-400">{isUk ? "Формат:" : "Format:"} <code className="font-mono">АКРОНІМ-ТИП-РІК-ЕТАП-№</code></p>
      </div>
    </div>
  );
}

// ── Step 3: Type-specific fields ──────────────────────────────────────────────

function FieldsStep({
  kind,
  typedData,
  onChange,
  locale,
}: {
  kind: string;
  typedData: Record<string, unknown>;
  onChange: (d: Record<string, unknown>) => void;
  locale: string;
}) {
  const isUk = locale === "uk";
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-bold text-slate-900">{isUk ? "Специфічні поля" : "Type-specific fields"}</h3>
        <p className="mt-0.5 text-xs text-slate-500">
          {isUk ? "Заповніть поля, що стосуються цього типу запису. Частина полів необов'язкова." : "Fill fields relevant to this record type. Some fields are optional."}
        </p>
      </div>
      <TypedRecordFormFields kind={kind} typedData={typedData} onChange={onChange} locale={locale} />
    </div>
  );
}

// ── Step 4: Access & visibility ───────────────────────────────────────────────

type AccessChoice = "draft" | "internal" | "public";

function AccessStep({
  choice,
  setChoice,
  dataFormat, setDataFormat,
  locale,
}: {
  choice: AccessChoice;
  setChoice: (c: AccessChoice) => void;
  dataFormat: string;
  setDataFormat: (v: string) => void;
  locale: string;
}) {
  const isUk = locale === "uk";
  const fc = "input-control w-full px-3 py-2 text-sm outline-none";

  const opts: { id: AccessChoice; icon: React.ReactNode; title: string; desc: string; color: string }[] = [
    {
      id: "draft",
      icon: <Lock className="h-5 w-5" />,
      title: isUk ? "Чернетка (тільки для мене)" : "Draft (private)",
      desc: isUk ? "Збережено як незавершений запис. Видно лише вам. Можна опублікувати пізніше." : "Saved as an unfinished record. Visible only to you. Can be published later.",
      color: "border-slate-300 hover:border-slate-500",
    },
    {
      id: "internal",
      icon: <Users className="h-5 w-5" />,
      title: isUk ? "Внутрішній (команда)" : "Internal (team only)",
      desc: isUk ? "Видно всій команді проєкту. Недоступне для зовнішніх користувачів." : "Visible to the project team. Not accessible to external users.",
      color: "border-blue-300 hover:border-blue-500",
    },
    {
      id: "public",
      icon: <Globe className="h-5 w-5" />,
      title: isUk ? "Публічний (відкрита наука)" : "Public (open science)",
      desc: isUk ? "Опубліковано як відкрити дані. З'явиться на сторінці Open Science проєкту." : "Published as open data. Will appear on the project's Open Science page.",
      color: "border-emerald-300 hover:border-emerald-500",
    },
  ];

  const selectedColors: Record<AccessChoice, string> = {
    draft: "border-slate-500 bg-slate-50 ring-1 ring-slate-300",
    internal: "border-blue-500 bg-blue-50 ring-1 ring-blue-300",
    public: "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-300",
  };
  const iconColors: Record<AccessChoice, string> = {
    draft: "text-slate-600",
    internal: "text-blue-600",
    public: "text-emerald-600",
  };

  const dataFormats = [
    { value: "csv", label: "CSV" }, { value: "xlsx", label: "Excel / XLSX" },
    { value: "json", label: "JSON" }, { value: "xml", label: "XML" },
    { value: "image", label: isUk ? "Зображення" : "Image" },
    { value: "protocol_document", label: isUk ? "Документ протоколу" : "Protocol document" },
    { value: "archive", label: isUk ? "Архів (ZIP/TAR)" : "Archive (ZIP/TAR)" },
    { value: "binary", label: isUk ? "Бінарні дані" : "Binary data" },
    { value: "mixed", label: isUk ? "Змішані файли" : "Mixed files" },
    { value: "other", label: isUk ? "Інший" : "Other" },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-bold text-slate-900">{isUk ? "Доступ і видимість" : "Access & visibility"}</h3>
        <p className="mt-0.5 text-xs text-slate-500">
          {isUk ? "Хто зможе бачити цей запис після збереження?" : "Who will be able to see this record after saving?"}
        </p>
      </div>

      {/* Access choice cards */}
      <div className="space-y-2">
        {opts.map((opt) => {
          const isSelected = choice === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setChoice(opt.id)}
              className={`flex w-full items-start gap-3.5 rounded-xl border-2 p-4 text-left transition-all ${
                isSelected ? selectedColors[opt.id] : `border-slate-200 bg-white ${opt.color}`
              }`}
            >
              <span className={`mt-0.5 shrink-0 ${isSelected ? iconColors[opt.id] : "text-slate-400"}`}>
                {opt.icon}
              </span>
              <div className="min-w-0">
                <p className={`text-sm font-semibold ${isSelected ? "text-slate-900" : "text-slate-700"}`}>{opt.title}</p>
                <p className="mt-0.5 text-xs leading-5 text-slate-500">{opt.desc}</p>
              </div>
              <div className={`ml-auto mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                isSelected ? `${opt.id === "public" ? "border-emerald-500 bg-emerald-500" : opt.id === "internal" ? "border-blue-500 bg-blue-500" : "border-slate-500 bg-slate-500"} text-white` : "border-slate-300"
              }`}>
                {isSelected && <Check className="h-2.5 w-2.5" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Data format */}
      <div>
        <label className="block space-y-1">
          <span className="text-xs font-semibold text-slate-700">{isUk ? "Формат даних" : "Data format"}</span>
          <select className={fc} value={dataFormat} onChange={(e) => setDataFormat(e.target.value)}>
            {dataFormats.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </label>
      </div>

      {choice === "public" && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3">
          <div className="flex items-start gap-1.5 text-xs text-emerald-800">
            <Info className="mt-px h-3.5 w-3.5 shrink-0 text-emerald-600" />
            <p>{isUk ? "Для публічного запису рекомендується вибрати ліцензію на дані та перевірити метадані перед публікацією." : "For a public record, it's recommended to choose a data license and verify metadata before publishing."}</p>
          </div>
          <div className="mt-3">
            <LicensePicker label={isUk ? "Ліцензія" : "License"} name="license" defaultValue="cc-by-4.0" />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Step 5: Review ────────────────────────────────────────────────────────────

function ReviewStep({
  kind, title, stage, group, autoId, finalId,
  choice, dataFormat,
  typedData,
  owner, setOwner,
  summary, setSummary,
  owners,
  locale,
}: {
  kind: string; title: string; stage: string; group: string;
  autoId: string; finalId: string;
  choice: AccessChoice; dataFormat: string;
  typedData: Record<string, unknown>;
  owner: string; setOwner: (v: string) => void;
  summary: string; setSummary: (v: string) => void;
  owners: { key: string; label: string; value: string }[];
  locale: string;
}) {
  const isUk = locale === "uk";
  const cfg = KIND_CONFIGS[kind];
  const fc = "input-control w-full px-3 py-2 text-sm outline-none";

  // Typed data summary
  const typedSummary: string[] = [];
  if (cfg) {
    for (const f of cfg.fields) {
      const val = typedData[f.key];
      if (Array.isArray(val) && val.length > 0) {
        typedSummary.push(`${val.length} ${f.type === "steps" ? (isUk ? "кроків" : "steps") : f.type === "risk_items" ? (isUk ? "ризиків" : "risks") : (isUk ? "елементів" : "items")} (${isUk ? f.uk : f.en})`);
      } else if (val && typeof val === "string" && val.length > 0) {
        typedSummary.push(`${isUk ? f.uk : f.en}: ${val.length > 40 ? val.slice(0, 40) + "…" : val}`);
      }
    }
  }

  const accessLabel = {
    draft: isUk ? "Чернетка (приватна)" : "Draft (private)",
    internal: isUk ? "Внутрішній (команда)" : "Internal (team)",
    public: isUk ? "Публічний (відкрита наука)" : "Public (open science)",
  }[choice];

  const accessColor = {
    draft: "bg-slate-100 text-slate-700",
    internal: "bg-blue-100 text-blue-800",
    public: "bg-emerald-100 text-emerald-800",
  }[choice];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-bold text-slate-900">{isUk ? "Перегляд і збереження" : "Review & save"}</h3>
        <p className="mt-0.5 text-xs text-slate-500">{isUk ? "Перевірте дані перед збереженням. Все можна змінити пізніше." : "Review before saving. Everything can be edited later."}</p>
      </div>

      {/* Summary card */}
      <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
        <div className="flex items-start gap-3 p-4">
          <span className="text-2xl leading-none">{cfg?.icon ?? "📄"}</span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 leading-snug">{title || (isUk ? "(без назви)" : "(untitled)")}</p>
            <code className="mt-0.5 block font-mono text-[10px] text-slate-400">{finalId}</code>
          </div>
          <span className={`ml-auto shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${accessColor}`}>{accessLabel}</span>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 p-4 text-xs">
          <div><p className="text-stone-400">{isUk ? "Тип" : "Kind"}</p><p className="font-medium">{cfg ? (isUk ? cfg.labelUk : cfg.labelEn) : kind}</p></div>
          <div><p className="text-stone-400">{isUk ? "Етап" : "Stage"}</p><p className="font-medium">{stage}</p></div>
          {group && <div><p className="text-stone-400">{isUk ? "Група" : "Group"}</p><p className="font-medium">{group}</p></div>}
          <div><p className="text-stone-400">{isUk ? "Формат" : "Format"}</p><p className="font-medium">{dataFormat}</p></div>
          {typedSummary.length > 0 && (
            <div className="col-span-2">
              <p className="text-stone-400">{isUk ? "Специфічні поля" : "Typed fields"}</p>
              <div className="mt-0.5 flex flex-wrap gap-1">
                {typedSummary.slice(0, 4).map((s, i) => (
                  <span key={i} className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">{s}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Owner + summary fields */}
      <div className="space-y-3">
        <label className="block space-y-1">
          <span className="text-xs font-semibold text-slate-700">{isUk ? "Відповідальний" : "Record owner"} *</span>
          <select className={fc} value={owner} onChange={(e) => setOwner(e.target.value)} required>
            {owners.map((o) => <option key={o.key} value={o.value}>{o.label}</option>)}
          </select>
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-semibold text-slate-700">{isUk ? "Короткий опис" : "Summary"}</span>
          <textarea className={`${fc} resize-y`} rows={3} value={summary} onChange={(e) => setSummary(e.target.value)}
            placeholder={isUk ? "Контекст, мета, умови збору даних…" : "Context, purpose, collection conditions…"} />
        </label>
      </div>

      {/* Status hint */}
      <div className={`rounded-lg p-3 text-xs leading-5 ${choice === "draft" ? "bg-slate-50 border border-slate-200 text-slate-600" : choice === "public" ? "bg-emerald-50 border border-emerald-200 text-emerald-800" : "bg-blue-50 border border-blue-200 text-blue-800"}`}>
        {choice === "draft"
          ? (isUk ? "💾 Буде збережено як чернетку зі статусом «Заплановано». Ви зможете опублікувати пізніше з розділу записів." : "💾 Will be saved as a draft with status «Planned». You can publish it later from the records section.")
          : choice === "internal"
          ? (isUk ? "🏢 Буде збережено як внутрішній запис команди. Видно у списку записів проєкту." : "🏢 Will be saved as an internal team record. Visible in the project records list.")
          : (isUk ? "🌍 Буде опубліковано з відкритим доступом. Видно в розділі «Відкрита наука»." : "🌍 Will be published with open access. Visible in the «Open Science» section.")}
      </div>
    </div>
  );
}

// ── Main wizard ───────────────────────────────────────────────────────────────

export function RecordWizard({
  currentUser,
  projects,
  members,
  existingRecords,
  locale,
  returnTo,
  dictionary,
  onClose,
}: {
  currentUser: SafeUser;
  projects: Project[];
  members: SafeUser[];
  existingRecords: ProjectRecord[];
  locale: string;
  returnTo: string;
  dictionary: Dictionary;
  onClose: () => void;
}) {
  const defaultProject = projects[0];
  const isUk = locale === "uk";

  const [step, setStep] = useState(1);
  const [kind, setKind] = useState("");
  const [title, setTitle] = useState("");
  const [stage, setStage] = useState("Stage 1");
  const [group, setGroup] = useState("");
  const [idMode, setIdMode] = useState<"auto" | "manual">("auto");
  const [manualId, setManualId] = useState("");
  const [typedData, setTypedData] = useState<Record<string, unknown>>({});
  const [accessChoice, setAccessChoice] = useState<AccessChoice>("internal");
  const [dataFormat, setDataFormat] = useState("mixed");
  const [projectId, setProjectId] = useState(defaultProject?._id ?? "");
  const [owner, setOwner] = useState(userDisplayName(currentUser));
  const [summary, setSummary] = useState("");

  const selectedProject = projects.find((p) => p._id === projectId) ?? defaultProject;
  const autoId = useMemo(
    () => kind ? buildLocalId(existingRecords, kind, selectedProject, stage) : "",
    [existingRecords, kind, selectedProject, stage],
  );
  const finalId = idMode === "auto" ? autoId : manualId.trim();

  const kindConfig = KIND_CONFIGS[kind];
  const hasTypedFields = (kindConfig?.fields?.length ?? 0) > 0;

  // Build steps list (skip step 3 if no typed fields)
  const steps: number[] = hasTypedFields ? [1, 2, 3, 4, 5] : [1, 2, 4, 5];
  const stepIdx = steps.indexOf(step);
  const prevStep = stepIdx > 0 ? steps[stepIdx - 1] : null;
  const nextStep = stepIdx < steps.length - 1 ? steps[stepIdx + 1] : null;
  const isLast = nextStep === null;

  // Owner options
  const owners = useMemo(() => {
    const all = [currentUser, ...members];
    const seen = new Set<string>();
    return all.map((u) => {
      const value = userDisplayName(u);
      const label = u.email ? `${value} (${u.email})` : value;
      return { key: u._id || u.email || value, label, value };
    }).filter(({ key, value }) => {
      if (seen.has(key) || !value) return false;
      seen.add(key);
      return true;
    });
  }, [currentUser, members]);

  // Derived access values for form submission
  const formAccess = accessChoice === "public" ? "open" : "internal";
  const formStatus = accessChoice === "draft" ? "planned" : "active";

  // Can proceed validation
  const canProceed = step === 1 ? kind !== "" : step === 2 ? title.trim().length >= 3 : true;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4" onKeyDown={handleKeyDown}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />

      {/* Modal */}
      <div className="relative z-10 flex w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl sm:max-w-2xl sm:max-h-[90vh] max-h-[95vh]">
        {/* Header */}
        <div className="shrink-0 border-b border-slate-100 px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                {isUk ? "Новий запис" : "New record"}
                {kind && kindConfig && (
                  <span className="ml-2 text-slate-400 font-normal">
                    · {kindConfig.icon} {isUk ? kindConfig.labelUk : kindConfig.labelEn}
                  </span>
                )}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <StepIndicator current={step} steps={steps} locale={locale} />
        </div>

        {/* Scrollable step content */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {step === 1 && (
            <KindStep
              selected={kind}
              onSelect={(k) => { setKind(k); setTypedData({}); setDataFormat(defaultFormatForKind(k)); }}
              locale={locale}
            />
          )}
          {step === 2 && (
            <InfoStep
              kind={kind} title={title} setTitle={setTitle}
              stage={stage} setStage={setStage}
              group={group} setGroup={setGroup}
              idMode={idMode} setIdMode={setIdMode}
              manualId={manualId} setManualId={setManualId}
              autoId={autoId}
              projects={projects} projectId={projectId} setProjectId={setProjectId}
              locale={locale}
              dictionary={dictionary}
            />
          )}
          {step === 3 && hasTypedFields && (
            <FieldsStep kind={kind} typedData={typedData} onChange={setTypedData} locale={locale} />
          )}
          {step === 4 && (
            <AccessStep
              choice={accessChoice} setChoice={setAccessChoice}
              dataFormat={dataFormat} setDataFormat={setDataFormat}
              locale={locale}
            />
          )}
          {step === 5 && (
            <ReviewStep
              kind={kind} title={title} stage={stage} group={group}
              autoId={autoId} finalId={finalId}
              choice={accessChoice} dataFormat={dataFormat}
              typedData={typedData}
              owner={owner} setOwner={setOwner}
              summary={summary} setSummary={setSummary}
              owners={owners}
              locale={locale}
            />
          )}
        </div>

        {/* Footer — form wraps submit buttons */}
        <form action={createRecord} className="shrink-0 border-t border-slate-100 bg-slate-50/80 px-5 py-4">
          {/* All hidden inputs */}
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="kind" value={kind} />
          <input type="hidden" name="localId" value={finalId} />
          <input type="hidden" name="title" value={title} />
          <input type="hidden" name="stage" value={stage} />
          <input type="hidden" name="group" value={group} />
          <input type="hidden" name="access" value={formAccess} />
          <input type="hidden" name="owner" value={owner} />
          <input type="hidden" name="repository" value={accessChoice === "public" ? "Zenodo" : "Internal project storage"} />
          <input type="hidden" name="dataFormat" value={dataFormat} />
          <input type="hidden" name="version" value="v1.0" />
          <input type="hidden" name="summary" value={summary} />
          <input type="hidden" name="processingStatus" value="raw" />
          <input type="hidden" name="typedData" value={JSON.stringify(typedData)} />
          {projects.length === 1 && <input type="hidden" name="projectId" value={projects[0]._id} />}

          <div className="flex items-center justify-between gap-3">
            {/* Back */}
            <button
              type="button"
              onClick={() => prevStep && setStep(prevStep)}
              disabled={!prevStep}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              {isUk ? "Назад" : "Back"}
            </button>

            <div className="flex items-center gap-2">
              {/* Save as draft — available from step 2 onwards */}
              {step >= 2 && title.trim().length >= 3 && kind && (
                <button
                  type="submit"
                  name="recordStatus"
                  value="planned"
                  className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  💾 {isUk ? "Зберегти чернетку" : "Save draft"}
                </button>
              )}

              {/* Next / Publish */}
              {!isLast ? (
                <button
                  type="button"
                  onClick={() => nextStep && setStep(nextStep)}
                  disabled={!canProceed}
                  className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:pointer-events-none disabled:opacity-40"
                >
                  {isUk ? "Далі" : "Next"}
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  name="recordStatus"
                  value={formStatus}
                  disabled={!title.trim() || !kind || !finalId}
                  className={`flex items-center gap-1.5 rounded-lg px-5 py-2 text-sm font-semibold text-white shadow-sm transition disabled:pointer-events-none disabled:opacity-40 ${
                    accessChoice === "draft"
                      ? "bg-slate-600 hover:bg-slate-700"
                      : accessChoice === "public"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  <Check className="h-4 w-4" />
                  {accessChoice === "draft"
                    ? (isUk ? "Зберегти чернетку" : "Save draft")
                    : accessChoice === "public"
                    ? (isUk ? "Опублікувати" : "Publish")
                    : (isUk ? "Зберегти" : "Save")}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
