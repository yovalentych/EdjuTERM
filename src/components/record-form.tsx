"use client";

import type React from "react";
import {
  BadgeCheck,
  ChevronDown,
  ChevronRight,
  Database,
  FileText,
  Globe,
  Info,
  KeyRound,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { createRecord } from "@/app/actions";
import { LicensePicker } from "@/components/license-picker";
import { localizeStageLabel, type Dictionary, type Locale } from "@/lib/i18n";
import type { Project, ProjectRecord, SafeUser } from "@/lib/schemas";
import { KIND_CONFIGS, getKindsByGroup } from "@/lib/record-field-definitions";
import { TypedRecordFormFields } from "@/components/records/typed-record-form-fields";

// ── Styles ────────────────────────────────────────────────────────────────────

const field = "input-control w-full px-3 py-2 text-sm outline-none";

// ── Repository definitions ────────────────────────────────────────────────────

const repositoryOptions = [
  {
    id: "Zenodo",
    label: "Zenodo",
    icon: "Z",
    bg: "bg-blue-600",
    bestFor: ["dataset", "output", "sample"],
    formats: ["csv", "xlsx", "xml", "json", "tsv", "image", "archive", "mixed", "other"],
    access: ["open", "embargoed"],
    note: "Рекомендовано для відкритих або ембаргованих наборів даних. Автоматично генерує DOI.",
    features: ["DOI", "Versioning", "FAIR", "OpenAIRE"],
    apiSupport: true,
  },
  {
    id: "GitHub + Zenodo",
    label: "GitHub + Zenodo",
    icon: "GZ",
    bg: "bg-gray-700",
    bestFor: ["output", "protocol", "dataset"],
    formats: ["json", "csv", "tsv", "archive", "other"],
    access: ["open"],
    note: "Для скриптів, відтворюваного аналізу, коду. Zenodo DOI при релізі.",
    features: ["Git", "DOI", "CI/CD"],
    apiSupport: false,
  },
  {
    id: "Protocols.io",
    label: "Protocols.io",
    icon: "P",
    bg: "bg-teal-600",
    bestFor: ["protocol", "sop", "measurement_method"],
    formats: ["protocol_document", "pdf", "docx", "other"],
    access: ["open", "embargoed"],
    note: "Для лабораторних протоколів, SOP і методичних процедур.",
    features: ["DOI", "Step-by-step"],
    apiSupport: false,
  },
  {
    id: "OSF",
    label: "OSF (Open Science Framework)",
    icon: "OSF",
    bg: "bg-teal-700",
    bestFor: ["dataset", "output", "protocol", "literature_review"],
    formats: ["mixed", "archive", "csv", "xlsx", "pdf", "other"],
    access: ["open", "embargoed", "restricted"],
    note: "Для проєктних матеріалів, pre-registration, mixed files.",
    features: ["Pre-reg", "DOI", "Components"],
    apiSupport: false,
  },
  {
    id: "Institutional repository",
    label: "Інституційний репозиторій",
    icon: "IR",
    bg: "bg-indigo-600",
    bestFor: ["dataset", "output", "protocol", "report"],
    formats: ["pdf", "docx", "archive", "mixed", "other"],
    access: ["open", "restricted"],
    note: "Для матеріалів за вимогами установи або грантодавця.",
    features: ["Policy", "Archival"],
    apiSupport: false,
  },
  {
    id: "Internal project storage",
    label: "Внутрішнє сховище проєкту",
    icon: "IN",
    bg: "bg-slate-500",
    bestFor: ["task", "risk", "sample", "dataset", "meeting_minutes", "decision_log"],
    formats: ["mixed", "xlsx", "csv", "image", "archive", "other"],
    access: ["internal", "restricted"],
    note: "Для чутливих або ще неготових до відкриття матеріалів.",
    features: ["Private", "Working"],
    apiSupport: false,
  },
] as const;

const dataFormats = [
  { value: "csv",               label: "CSV таблиці" },
  { value: "xlsx",              label: "Excel / XLSX" },
  { value: "xml",               label: "XML" },
  { value: "json",              label: "JSON / GeoJSON" },
  { value: "tsv",               label: "TSV" },
  { value: "image",             label: "Зображення / мікроскопія" },
  { value: "protocol_document", label: "Документ протоколу (Word/PDF)" },
  { value: "archive",           label: "Архів ZIP / TAR / GZ" },
  { value: "binary",            label: "Бінарні дані (HDF5, MAT, BAM)" },
  { value: "mixed",             label: "Змішані файли" },
  { value: "other",             label: "Інший формат" },
];

const processingOptions = [
  { value: "raw",       label: "Сирі дані (Raw)" },
  { value: "processed", label: "Оброблено (Processed)" },
  { value: "analyzed",  label: "Проаналізовано (Analyzed)" },
  { value: "published", label: "Опубліковано (Published)" },
];

const accessOptions = [
  { value: "internal",   label: "Внутрішній (Internal)" },
  { value: "open",       label: "Відкритий (Open)" },
  { value: "embargoed",  label: "Ембарго (Embargoed)" },
  { value: "restricted", label: "Обмежений (Restricted)" },
];

const languageOptions = [
  { value: "",   label: "— не вказано —" },
  { value: "uk", label: "Українська" },
  { value: "en", label: "English" },
  { value: "de", label: "Deutsch" },
  { value: "fr", label: "Français" },
  { value: "pl", label: "Polski" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function userDisplayName(user: SafeUser) {
  return [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;
}

function buildOwnerOptions(currentUser: SafeUser, members: SafeUser[]) {
  const all = [currentUser, ...members];
  const seen = new Set<string>();
  return all
    .map((u) => {
      const value = userDisplayName(u);
      const label = u.email ? `${value} (${u.email})` : value;
      return { key: u._id || u.email || value, label, value };
    })
    .filter(({ key, value }) => {
      if (seen.has(key) || !value) return false;
      seen.add(key);
      return true;
    });
}

function rankRepositories(kind: string, dataFormat: string, access: string) {
  return [...repositoryOptions].sort(
    (a, b) => score(b, kind, dataFormat, access) - score(a, kind, dataFormat, access),
  );
}

function score(
  opt: (typeof repositoryOptions)[number],
  kind: string,
  fmt: string,
  acc: string,
) {
  let s = 0;
  if ((opt.bestFor as readonly string[]).includes(kind)) s += 5;
  if ((opt.formats as readonly string[]).includes(fmt)) s += 3;
  if ((opt.access as readonly string[]).includes(acc)) s += 2;
  if (kind === "dataset" && acc === "open" && opt.id === "Zenodo") s += 4;
  if (kind === "output" && opt.id === "GitHub + Zenodo") s += 4;
  if (kind === "protocol" && opt.id === "Protocols.io") s += 4;
  if ((acc === "internal" || acc === "restricted") && opt.id === "Internal project storage") s += 4;
  return s;
}

function buildLocalId(
  existingRecords: ProjectRecord[],
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
    existingRecords
      .map((r) => r.localId)
      .filter((id) => id.startsWith(base))
      .map((id) => parseInt(id.split("-").at(-1) ?? "0", 10))
      .filter(Number.isFinite)
      .reduce((max, v) => Math.max(max, v), 0) + 1;
  return `${base}-${String(next).padStart(3, "0")}`;
}

function sanitize(v: string) {
  return v.normalize("NFKD").replace(/[^\w]+/g, "").toUpperCase().slice(0, 16) || "PRJ";
}

function defaultFormatForKind(kind: string) {
  if (kind === "protocol" || kind === "sop" || kind === "data_collection_protocol" || kind === "analysis_protocol") return "protocol_document";
  if (kind === "output") return "archive";
  if (kind === "sample") return "xlsx";
  return "mixed";
}

function defaultLicense(kind: string, access: string) {
  if (access === "internal" || access === "restricted") return "";
  if (kind === "output") return "mit";
  return "cc-by-4.0";
}

// ── Creator type ──────────────────────────────────────────────────────────────

type Creator = { name: string; nameEn: string; affiliation: string; orcid: string };
type Contributor = { name: string; nameEn: string; affiliation: string; orcid: string; role: string };
type RelatedId = { identifier: string; scheme: string; relation: string };

// ── Section header ────────────────────────────────────────────────────────────

function SectionHead({
  icon,
  title,
  sub,
}: {
  icon: React.ReactNode;
  title: string;
  sub?: string;
}) {
  return (
    <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
      <span className="flex h-7 w-7 items-center justify-center rounded bg-slate-100 text-slate-500">
        {icon}
      </span>
      <div>
        <p className="text-sm font-semibold text-stone-800">{title}</p>
        {sub && <p className="text-[11px] text-stone-400">{sub}</p>}
      </div>
    </div>
  );
}

// ── Kind purpose hints ────────────────────────────────────────────────────────

const KIND_HINTS_UK: Record<string, string> = {
  research_question:        "Формулюйте та відстежуйте ключові питання, гіпотези та їхній стан.",
  literature_review:        "Задокументуйте стратегію пошуку, ключові знахідки та прогалини.",
  theoretical_framework:    "Опишіть теоретичну основу: концепції, конструкти та очікувані зв'язки.",
  research_design:          "Задокументуйте дизайн дослідження та обґрунтування вибору методів.",
  methodology:              "Методологічний підхід, обґрунтування та процедури верифікації.",
  sop:                      "Стандартна операційна процедура — покрокова для відтворюваного виконання.",
  protocol:                 "Детальний протокол: кроки виконання, критерії прийняття та відхилення.",
  data_collection_protocol: "Протокол збору даних: форми, поля та методи реєстрації.",
  analysis_protocol:        "Протокол аналізу: кроки обробки, статистичні методи та інструменти.",
  dataset:                  "Набір даних із FAIR-метаданими, описом структури та умовами доступу.",
  measurement_method:       "Метод вимірювання: принцип, одиниці, точність та умови застосування.",
  calibration_record:       "Запис калібрування обладнання з результатами перевірки.",
  experiment_log:           "Журнал виконання: умови, покрокові дії, результати та контроль якості.",
  sample:                   "Характеристика зразка: тип, походження, умови зберігання, молекулярні показники.",
  task:                     "Завдання команди з пріоритетом, відповідальним та дедлайном.",
  task_set:                 "Набір пов'язаних завдань з мілстонами та відстеженням прогресу.",
  meeting_minutes:          "Протокол зустрічі: порядок денний, рішення та призначені дії.",
  supervision_log:          "Протокол наукового супервізійного зібрання: агенда, корекції та наступні кроки.",
  decision_log:             "Реєстр ключових рішень із обґрунтуванням та розглянутими альтернативами.",
  risk:                     "Реєстр ризиків: матриця ймовірність × вплив для всіх ідентифікованих ризиків.",
  ethics:                   "Матеріали етичного схвалення та відповідність нормативним вимогам.",
  data_management_plan:     "DMP — план управління даними відповідно до вимог фінансувальника.",
  output:                   "Результат дослідження для публікації, передачі або архівування.",
  report:                   "Офіційний звіт про результати або поточний стан проєкту.",
};

const KIND_HINTS_EN: Record<string, string> = {
  research_question:        "Formulate and track research questions, hypotheses, and their status.",
  literature_review:        "Document search strategy, key findings, and research gaps.",
  theoretical_framework:    "Describe theoretical base: concepts, constructs, and expected relationships.",
  research_design:          "Document research design and justification of method choices.",
  methodology:              "Methodological approach, justification, and verification procedures.",
  sop:                      "Standard operating procedure — step-by-step for reproducible execution.",
  protocol:                 "Detailed protocol: execution steps, acceptance and failure criteria.",
  data_collection_protocol: "Data collection protocol: forms, fields, and registration methods.",
  analysis_protocol:        "Analysis protocol: processing, statistical methods, and tools.",
  dataset:                  "Dataset with FAIR metadata, structure description, and access terms.",
  measurement_method:       "Measurement method: principle, units, precision, and conditions.",
  calibration_record:       "Equipment calibration record with verification results.",
  experiment_log:           "Execution log: conditions, step-by-step actions, results, and QC.",
  sample:                   "Sample characterization: type, origin, storage, and molecular metrics.",
  task:                     "Team task with priority, assignee, and deadline.",
  task_set:                 "Set of related tasks with milestones and progress tracking.",
  meeting_minutes:          "Meeting minutes: agenda, decisions, and assigned actions.",
  supervision_log:          "Supervision meeting: agenda, required corrections, and next steps.",
  decision_log:             "Key decisions log with rationale and alternatives considered.",
  risk:                     "Risk register: probability × impact matrix for identified risks.",
  ethics:                   "Ethics approval materials and regulatory compliance documentation.",
  data_management_plan:     "DMP — data management plan per funder requirements.",
  output:                   "Research output for publication, transfer, or archiving.",
  report:                   "Official report on research results or project status.",
};

// ── Grouped kind selector ─────────────────────────────────────────────────────

const kindsByGroup = getKindsByGroup();

// ── Main ──────────────────────────────────────────────────────────────────────

export function RecordForm({
  currentUser,
  dictionary,
  existingRecords = [],
  locale,
  members = [],
  projects,
  returnTo,
}: {
  currentUser: SafeUser;
  dictionary: Dictionary;
  existingRecords?: ProjectRecord[];
  locale: Locale;
  members?: SafeUser[];
  projects: Project[];
  returnTo?: string;
}) {
  const defaultProject = projects[0];
  const isUk = locale === "uk";

  const [projectId, setProjectId] = useState(defaultProject?._id ?? "");
  const [kind, setKind] = useState<ProjectRecord["kind"]>("dataset");
  const [stage, setStage] = useState("Stage 1");
  const [dataFormat, setDataFormat] = useState("csv");
  const [access, setAccess] = useState<ProjectRecord["access"]>("internal");
  const [idMode, setIdMode] = useState<"auto" | "manual">("auto");
  const [manualId, setManualId] = useState("");
  const [repoId, setRepoId] = useState("");
  const [owner, setOwner] = useState(userDisplayName(currentUser));
  const [typedData, setTypedData] = useState<Record<string, unknown>>({});
  const [creators, setCreators] = useState<Creator[]>([
    {
      name: userDisplayName(currentUser),
      nameEn: [currentUser.lastNameLatin, currentUser.firstNameLatin].filter(Boolean).join(", "),
      affiliation: currentUser.affiliation || "",
      orcid: currentUser.orcid || "",
    },
  ]);
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [relatedIds, setRelatedIds] = useState<RelatedId[]>([]);
  const [showExtra, setShowExtra] = useState(false);

  const selectedProject = projects.find((p) => p._id === projectId) ?? defaultProject;
  const ranked = useMemo(() => rankRepositories(kind, dataFormat, access), [kind, dataFormat, access]);
  const selectedRepo = repoId || ranked[0]?.id || "Internal project storage";
  const repoInfo = repositoryOptions.find((r) => r.id === selectedRepo) ?? ranked[0];
  const owners = useMemo(() => buildOwnerOptions(currentUser, members), [currentUser, members]);
  const kindConfig = KIND_CONFIGS[kind];
  const supportsFiles = kindConfig?.supportsFiles ?? true;
  const supportsZenodo = kindConfig?.supportsZenodo ?? false;

  const autoId = useMemo(
    () => buildLocalId(existingRecords, kind, selectedProject, stage),
    [existingRecords, kind, selectedProject, stage],
  );
  const finalId = idMode === "auto" ? autoId : manualId.trim();

  if (projects.length === 0) {
    return (
      <p className="rounded border border-dashed border-stone-300 p-4 text-sm text-stone-400">
        {dictionary.projects.none}
      </p>
    );
  }

  // Creator helpers
  const addCreator = () =>
    setCreators((c) => [...c, { name: "", nameEn: "", affiliation: "", orcid: "" }]);
  const removeCreator = (i: number) =>
    setCreators((c) => c.filter((_, idx) => idx !== i));
  const updateCreator = (i: number, f: keyof Creator, val: string) =>
    setCreators((c) => c.map((cr, idx) => (idx === i ? { ...cr, [f]: val } : cr)));

  function addMember(member: SafeUser) {
    const name = userDisplayName(member);
    if (creators.some((c) => c.name === name)) return;
    setCreators((c) => [...c, {
      name,
      nameEn: [member.lastNameLatin, member.firstNameLatin].filter(Boolean).join(", "),
      affiliation: member.affiliation || "",
      orcid: member.orcid || "",
    }]);
  }

  const addContributor = () =>
    setContributors((c) => [...c, { name: "", nameEn: "", affiliation: "", orcid: "", role: "Other" }]);
  const removeContributor = (i: number) =>
    setContributors((c) => c.filter((_, idx) => idx !== i));
  const updateContributor = (i: number, f: keyof Contributor, val: string) =>
    setContributors((c) => c.map((cr, idx) => (idx === i ? { ...cr, [f]: val } : cr)));

  const addRelatedId = () =>
    setRelatedIds((r) => [...r, { identifier: "", scheme: "doi", relation: "References" }]);
  const removeRelatedId = (i: number) =>
    setRelatedIds((r) => r.filter((_, idx) => idx !== i));
  const updateRelatedId = (i: number, f: keyof RelatedId, val: string) =>
    setRelatedIds((r) => r.map((ri, idx) => (idx === i ? { ...ri, [f]: val } : ri)));

  // Auto-set repository to internal for digital-only kinds
  const effectiveRepo = !supportsFiles ? "Internal project storage" : selectedRepo;

  return (
    <form action={createRecord} className="space-y-6">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="localId" value={finalId} />
      <input type="hidden" name="typedData" value={JSON.stringify(typedData)} />
      <input type="hidden" name="repository" value={effectiveRepo} />
      {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}
      {projects.length === 1 && (
        <input type="hidden" name="projectId" value={projects[0]._id} />
      )}

      {/* ── A: Core identification ───────────────────────────────────── */}
      <div>
        <SectionHead
          icon={<Database className="h-4 w-4" />}
          title={isUk ? "Ідентифікація" : "Identification"}
          sub={isUk ? "Тип запису, проєкт, назва та локальний ID" : "Record type, project, title and local ID"}
        />

        <div className="space-y-4">
          {/* Project selector — only when multiple */}
          {projects.length > 1 && (
            <label className="block space-y-1">
              <span className="text-xs font-medium text-stone-600">{dictionary.projects.project}</span>
              <select
                name="projectId"
                className={field}
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                required
              >
                {projects.map((p) => (
                  <option key={p._id ?? p.acronym} value={p._id}>
                    {p.acronym} — {p.title}
                  </option>
                ))}
              </select>
            </label>
          )}

          {/* Kind + Stage */}
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1">
              <span className="text-xs font-medium text-stone-600">{dictionary.form.kind}</span>
              <select
                name="kind"
                className={field}
                value={kind}
                onChange={(e) => {
                  const k = e.target.value as ProjectRecord["kind"];
                  setKind(k);
                  setTypedData({});
                  setRepoId("");
                  setDataFormat(defaultFormatForKind(k));
                }}
              >
                {kindsByGroup.map(({ group, kinds }) => (
                  <optgroup key={group.id} label={isUk ? group.uk : group.en}>
                    {kinds.map((k) => {
                      const cfg = KIND_CONFIGS[k];
                      return (
                        <option key={k} value={k}>
                          {cfg?.icon} {isUk ? cfg?.labelUk : cfg?.labelEn}
                        </option>
                      );
                    })}
                  </optgroup>
                ))}
              </select>
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-medium text-stone-600">{dictionary.form.stage}</span>
              <select
                name="stage"
                className={field}
                value={stage}
                onChange={(e) => setStage(e.target.value)}
              >
                <option value="General">{isUk ? "Загальне" : "General"}</option>
                <option value="Stage 1">{localizeStageLabel("Stage 1", dictionary)}</option>
                <option value="Stage 2">{localizeStageLabel("Stage 2", dictionary)}</option>
                <option value="Stage 3">{localizeStageLabel("Stage 3", dictionary)}</option>
              </select>
            </label>
          </div>

          {/* Kind info card */}
          {kindConfig && (
            <div className="rounded-lg border border-slate-200 bg-slate-50/80 px-3.5 py-3">
              <div className="flex items-start gap-2.5">
                <span className="mt-0.5 text-xl leading-none">{kindConfig.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-sm font-semibold text-slate-800">
                      {isUk ? kindConfig.labelUk : kindConfig.labelEn}
                    </span>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs text-slate-500">{isUk ? kindConfig.groupUk : kindConfig.groupEn}</span>
                    {!supportsFiles && (
                      <span className="rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-semibold text-violet-700">
                        {isUk ? "Без файлів" : "Digital only"}
                      </span>
                    )}
                    {supportsZenodo && (
                      <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">
                        Zenodo
                      </span>
                    )}
                  </div>
                  {(isUk ? KIND_HINTS_UK[kind] : KIND_HINTS_EN[kind]) && (
                    <p className="mt-1 flex items-start gap-1 text-xs leading-4 text-slate-500">
                      <Info className="mt-px h-3 w-3 shrink-0 text-slate-400" />
                      {isUk ? KIND_HINTS_UK[kind] : KIND_HINTS_EN[kind]}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Title */}
          <label className="block space-y-1">
            <span className="text-xs font-medium text-stone-600">
              {dictionary.form.title} <span className="text-rose-500">*</span>
            </span>
            <input
              name="title"
              className={field}
              placeholder={isUk ? "Коротка описова назва запису" : "Short descriptive title for this record"}
              required
            />
          </label>

          {/* Local ID */}
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-medium text-stone-600">
                <KeyRound className="h-3.5 w-3.5 text-slate-400" />
                {dictionary.form.localId}
              </span>
              <div className="flex overflow-hidden rounded border border-slate-200 text-[11px] font-medium">
                <button
                  type="button"
                  onClick={() => setIdMode("auto")}
                  className={`px-3 py-1 transition-colors ${idMode === "auto" ? "bg-blue-600 text-white" : "bg-white text-slate-500 hover:bg-slate-100"}`}
                >
                  {isUk ? "Авто" : "Auto"}
                </button>
                <button
                  type="button"
                  onClick={() => setIdMode("manual")}
                  className={`px-3 py-1 transition-colors ${idMode === "manual" ? "bg-blue-600 text-white" : "bg-white text-slate-500 hover:bg-slate-100"}`}
                >
                  {isUk ? "Вручну" : "Manual"}
                </button>
              </div>
            </div>

            {idMode === "auto" ? (
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded border border-slate-200 bg-white px-3 py-2 font-mono text-sm font-bold tracking-wide text-blue-800">
                  {autoId}
                </code>
                <button
                  type="button"
                  onClick={() => setStage((v) => v)}
                  className="control flex h-9 w-9 shrink-0 items-center justify-center"
                  title={isUk ? "Перерахувати" : "Recalculate"}
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <input
                className={`${field} font-mono tracking-wide`}
                value={manualId}
                onChange={(e) => setManualId(e.target.value.toUpperCase())}
                placeholder={`${sanitize(selectedProject?.acronym || "PRJ")}-REC-${new Date().getFullYear()}-S1-001`}
              />
            )}

            <p className="text-[10px] leading-4 text-stone-400">
              {isUk ? "Структура:" : "Format:"}{" "}
              <code className="font-mono">АКРОНІМ-ТИП-РІК-ЕТАП-№</code>
            </p>
          </div>
        </div>
      </div>

      {/* ── B: Type-specific fields ───────────────────────────────────── */}
      {kindConfig && kindConfig.fields.length > 0 && (
        <TypedRecordFormFields
          kind={kind}
          typedData={typedData}
          onChange={setTypedData}
          locale={locale}
        />
      )}

      {/* ── C: Access & processing ───────────────────────────────────── */}
      <div>
        <SectionHead
          icon={<ShieldCheck className="h-4 w-4" />}
          title={isUk ? "Доступ і статус" : "Access & Status"}
          sub={isUk ? "Рівень доступу, статус обробки, версія" : "Access level, processing status, version"}
        />

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1">
              <span className="text-xs font-medium text-stone-600">{dictionary.form.access}</span>
              <select
                name="access"
                className={field}
                value={access}
                onChange={(e) => {
                  setAccess(e.target.value as ProjectRecord["access"]);
                  setRepoId("");
                }}
              >
                {accessOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-medium text-stone-600">
                {isUk ? "Стан обробки" : "Processing status"}
              </span>
              <select name="processingStatus" className={field} defaultValue="raw">
                {processingOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1">
              <span className="text-xs font-medium text-stone-600">{dictionary.form.version}</span>
              <input name="version" className={field} defaultValue="v1.0" />
            </label>

            {access === "embargoed" && (
              <label className="block space-y-1">
                <span className="text-xs font-medium text-stone-600">
                  {isUk ? "Дата відкриття ембарго" : "Embargo lift date"}
                </span>
                <input name="embargoDate" type="date" className={field} />
              </label>
            )}
          </div>

          {supportsZenodo && (
            <LicensePicker
              label={isUk ? "Ліцензія на дані або код" : "Data / code license"}
              name="license"
              defaultValue={defaultLicense(kind, access)}
            />
          )}
        </div>
      </div>

      {/* ── D: Responsible person ────────────────────────────────────── */}
      <div>
        <SectionHead
          icon={<Users className="h-4 w-4" />}
          title={isUk ? "Відповідальний і автори" : "Responsible & Authors"}
          sub={isUk ? "Хто веде цей запис; автори для Zenodo" : "Record owner; authors for Zenodo metadata"}
        />

        <div className="space-y-4">
          {/* Responsible person — always shown */}
          <label className="block space-y-1">
            <span className="text-xs font-medium text-stone-600">
              {dictionary.form.owner}{" "}
              <span className="font-normal text-stone-400">
                {isUk ? "(відповідальна особа у системі)" : "(record owner in system)"}
              </span>
            </span>
            <select
              name="owner"
              className={field}
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              required
            >
              {owners.map((o) => (
                <option key={o.key} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>

          {/* Creators — only for Zenodo-capable kinds */}
          {supportsZenodo && (
            <>
              {members.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-medium text-stone-400">
                    {isUk ? "Учасники:" : "Members:"}
                  </span>
                  {members.map((m) => {
                    const name = userDisplayName(m);
                    const added = creators.some((c) => c.name === name);
                    return (
                      <button
                        key={m._id ?? m.email}
                        type="button"
                        onClick={() => addMember(m)}
                        disabled={added}
                        className={`flex items-center gap-1.5 rounded border px-2 py-0.5 text-xs transition-colors ${
                          added
                            ? "border-emerald-200 bg-emerald-50 text-emerald-600 cursor-default"
                            : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                        }`}
                      >
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-200 text-[9px] font-bold uppercase">
                          {name[0]}
                        </span>
                        {name.split(" ")[0]}
                        {added ? " ✓" : " +"}
                      </button>
                    );
                  })}
                </div>
              )}

              {creators.map((cr, i) => (
                <div key={i} className="rounded-md border border-slate-200 bg-slate-50/60 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {isUk ? `Автор ${i + 1}` : `Author ${i + 1}`}
                      {i === 0 && <span className="ml-1.5 text-blue-400">({isUk ? "основний" : "primary"})</span>}
                    </span>
                    {creators.length > 1 && (
                      <button type="button" onClick={() => removeCreator(i)} className="text-slate-300 hover:text-rose-400 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  <input type="hidden" name={`creator_name_${i}`} value={cr.name} />
                  <input type="hidden" name={`creator_nameEn_${i}`} value={cr.nameEn} />
                  <input type="hidden" name={`creator_affiliation_${i}`} value={cr.affiliation} />
                  <input type="hidden" name={`creator_orcid_${i}`} value={cr.orcid} />

                  <div className="grid grid-cols-2 gap-2">
                    <label className="block space-y-0.5">
                      <span className="text-[10px] font-medium text-stone-500">
                        {isUk ? "Прізвище Ім'я *" : "Full name *"}
                      </span>
                      <input className={field} value={cr.name} onChange={(e) => updateCreator(i, "name", e.target.value)} placeholder="Іваненко Іван" />
                    </label>
                    <label className="block space-y-0.5">
                      <span className="text-[10px] font-medium text-stone-500">
                        {isUk ? "Ім'я латиницею (Zenodo)" : "Latin name (Zenodo)"}
                      </span>
                      <input className={field} value={cr.nameEn} onChange={(e) => updateCreator(i, "nameEn", e.target.value)} placeholder="Ivanenko, Ivan" />
                    </label>
                    <label className="block space-y-0.5">
                      <span className="text-[10px] font-medium text-stone-500">{isUk ? "Аффіліація" : "Affiliation"}</span>
                      <input className={field} value={cr.affiliation} onChange={(e) => updateCreator(i, "affiliation", e.target.value)} placeholder="НАН України, Інститут..." />
                    </label>
                    <label className="block space-y-0.5">
                      <span className="text-[10px] font-medium text-stone-500">ORCID iD</span>
                      <input className={field} value={cr.orcid} onChange={(e) => updateCreator(i, "orcid", e.target.value)} placeholder="0000-0000-0000-0000" />
                    </label>
                  </div>
                </div>
              ))}

              <button type="button" onClick={addCreator} className="control flex items-center gap-1.5 px-3 py-1.5 text-xs">
                <Plus className="h-3.5 w-3.5" />
                {isUk ? "Додати автора" : "Add author"}
              </button>

              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                    {isUk ? "Контриб'ютори (не автори)" : "Contributors (non-authors)"}
                  </span>
                  <button type="button" onClick={addContributor} className="control flex items-center gap-1 px-2 py-1 text-[10px]">
                    <Plus className="h-3 w-3" /> {isUk ? "Додати" : "Add"}
                  </button>
                </div>
                {contributors.map((ct, i) => (
                  <div key={i} className="rounded border border-slate-200 bg-white p-2.5 space-y-2">
                    <input type="hidden" name={`contributor_name_${i}`} value={ct.name} />
                    <input type="hidden" name={`contributor_nameEn_${i}`} value={ct.nameEn} />
                    <input type="hidden" name={`contributor_affiliation_${i}`} value={ct.affiliation} />
                    <input type="hidden" name={`contributor_orcid_${i}`} value={ct.orcid} />
                    <input type="hidden" name={`contributor_role_${i}`} value={ct.role} />
                    <div className="grid grid-cols-2 gap-1.5">
                      <input className={field} value={ct.name} onChange={(e) => updateContributor(i, "name", e.target.value)} placeholder="Прізвище Ім'я" />
                      <input className={field} value={ct.nameEn} onChange={(e) => updateContributor(i, "nameEn", e.target.value)} placeholder="Last, First (латиниця)" />
                      <input className={field} value={ct.affiliation} onChange={(e) => updateContributor(i, "affiliation", e.target.value)} placeholder="Організація" />
                      <input className={field} value={ct.orcid} onChange={(e) => updateContributor(i, "orcid", e.target.value)} placeholder="ORCID" />
                    </div>
                    <div className="flex items-center gap-2">
                      <select className={`${field} flex-1`} value={ct.role} onChange={(e) => updateContributor(i, "role", e.target.value)}>
                        {["DataCollector","DataCurator","DataManager","Editor","ProjectLeader","ProjectMember","Researcher","Supervisor","Other"].map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                      <button type="button" onClick={() => removeContributor(i)} className="control px-2 py-1 text-[10px] text-rose-500">✕</button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── E: Repository & format (file-supporting kinds only) ──────── */}
      {supportsFiles && (
        <div>
          <SectionHead
            icon={<Database className="h-4 w-4" />}
            title={isUk ? "Репозиторій і формат" : "Repository & Format"}
            sub={isUk ? "Рекомендовано на основі типу та рівня доступу" : "Recommended based on kind and access level"}
          />

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1">
                <span className="text-xs font-medium text-stone-600">{dictionary.form.dataFormat}</span>
                <select
                  name="dataFormat"
                  className={field}
                  value={dataFormat}
                  onChange={(e) => { setDataFormat(e.target.value); setRepoId(""); }}
                >
                  {dataFormats.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1">
                <span className="text-xs font-medium text-stone-600">{dictionary.form.group}</span>
                <input name="group" className={field} placeholder="Experiment A / Batch 2" />
              </label>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {ranked.map((repo, idx) => {
                const sel = selectedRepo === repo.id;
                return (
                  <button
                    key={repo.id}
                    type="button"
                    onClick={() => setRepoId(repo.id)}
                    className={`relative flex items-start gap-2.5 rounded-md border p-3 text-left transition-all ${
                      sel
                        ? "border-blue-400 bg-blue-50 ring-1 ring-blue-300"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded text-[11px] font-bold text-white ${repo.bg}`}>
                      {repo.icon}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1">
                        <span className="text-xs font-semibold text-stone-800 leading-snug">{repo.label}</span>
                        {idx === 0 && <span className="rounded bg-blue-100 px-1 py-px text-[9px] font-bold text-blue-700">★ rec</span>}
                        {repo.apiSupport && <span className="rounded bg-emerald-100 px-1 py-px text-[9px] font-bold text-emerald-700">API</span>}
                      </div>
                      <div className="mt-0.5 flex flex-wrap gap-0.5">
                        {repo.features.map((f) => (
                          <span key={f} className="rounded bg-slate-100 px-1 text-[9px] text-slate-500">{f}</span>
                        ))}
                      </div>
                    </div>
                    {sel && <BadgeCheck className="absolute right-2 top-2 h-4 w-4 text-blue-500" />}
                  </button>
                );
              })}
            </div>

            {repoInfo && (
              <p className="rounded border border-indigo-100 bg-indigo-50/60 px-3 py-2 text-xs leading-5 text-indigo-900">
                <span className="font-semibold">{repoInfo.label}:</span> {repoInfo.note}
              </p>
            )}

            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1">
                <span className="text-xs font-medium text-stone-600">
                  {isUk ? "DOI або зовнішній ідентифікатор" : "DOI or external ID"}
                </span>
                <input name="doi" className={field} placeholder="10.xxxx/xxxxx" />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-medium text-stone-600">{isUk ? "Теги" : "Tags"}</span>
                <input name="tags" className={field} placeholder="proteomics, batch-1 (через кому)" />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ── F: Description & files ────────────────────────────────────── */}
      <div>
        <SectionHead
          icon={<FileText className="h-4 w-4" />}
          title={isUk ? "Опис і нотатки" : "Description & Notes"}
        />

        <div className="space-y-4">
          {supportsFiles && (
            <label className="block space-y-1">
              <span className="text-xs font-medium text-stone-600">{dictionary.form.files}</span>
              <input name="files" type="file" multiple className={field} />
              <span className="text-[10px] text-stone-400">{dictionary.form.filesHint}</span>
            </label>
          )}

          <label className="block space-y-1">
            <span className="text-xs font-medium text-stone-600">{dictionary.form.summary}</span>
            <textarea
              name="summary"
              rows={3}
              className={`${field} resize-y`}
              placeholder={isUk ? "Короткий опис запису, контекст, мета." : "Short description, context, and purpose of this record."}
            />
          </label>

          <label className="block space-y-1">
            <span className="text-xs font-medium text-stone-600">{dictionary.form.usageNotes}</span>
            <textarea
              name="usageNotes"
              rows={2}
              className={`${field} resize-y`}
              placeholder={isUk ? "Нотатки щодо використання, додаткові деталі." : "Usage notes, additional details."}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1">
              <span className="text-xs font-medium text-stone-600">{dictionary.form.keywords}</span>
              <input name="keywords" className={field} placeholder={isUk ? "ключові слова через кому" : "keywords, comma separated"} />
            </label>
            {!supportsFiles && (
              <label className="block space-y-1">
                <span className="text-xs font-medium text-stone-600">{isUk ? "Теги" : "Tags"}</span>
                <input name="tags" className={field} placeholder={isUk ? "теги через кому" : "tags, comma separated"} />
              </label>
            )}
            {supportsZenodo && (
              <label className="block space-y-1">
                <span className="text-xs font-medium text-stone-600">Subjects (Zenodo)</span>
                <input name="subjects" className={field} placeholder="Biochemistry, Proteomics" />
              </label>
            )}
          </div>
        </div>
      </div>

      {/* ── G: Extra Zenodo metadata (collapsible, Zenodo kinds only) ── */}
      {supportsZenodo && (
        <div className="rounded-md border border-slate-200">
          <button
            type="button"
            onClick={() => setShowExtra((v) => !v)}
            className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-stone-600 hover:bg-slate-50 transition-colors"
          >
            <Globe className="h-4 w-4 text-slate-400" />
            <span className="flex-1">
              {isUk ? "Додаткові метадані (мова, дати збору, фінансування)" : "Extra metadata (language, collection dates, funding)"}
            </span>
            {showExtra
              ? <ChevronDown className="h-4 w-4 text-slate-400" />
              : <ChevronRight className="h-4 w-4 text-slate-400" />
            }
          </button>

          {showExtra && (
            <div className="border-t border-slate-100 px-4 pb-4 pt-3 space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-stone-600">
                    {isUk ? "Мова даних" : "Data language"}
                  </span>
                  <select name="language" className={field} defaultValue="">
                    {languageOptions.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-stone-600">
                    {isUk ? "Дата збору (від)" : "Collected from"}
                  </span>
                  <input name="dateCollectedFrom" type="date" className={field} />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-stone-600">
                    {isUk ? "Дата збору (до)" : "Collected to"}
                  </span>
                  <input name="dateCollectedTo" type="date" className={field} />
                </label>
              </div>

              <label className="block space-y-1">
                <span className="text-xs font-medium text-stone-600">
                  {isUk ? "Грант / фінансування" : "Grant / funding"}
                </span>
                <input name="fundingGrant" className={field} placeholder="НАН України, Проект № 23-01-2026 / EU Horizon 2020 #123456" />
              </label>

              <label className="block space-y-1">
                <span className="text-xs font-medium text-stone-600">{isUk ? "Нотатки" : "Notes"}</span>
                <textarea name="notes" rows={2} className={`${field} resize-y`} placeholder={isUk ? "Будь-яка додаткова інформація" : "Any additional information"} />
              </label>

              <label className="block space-y-1">
                <span className="text-xs font-medium text-stone-600">
                  {isUk ? "Посилання / References" : "References"}
                </span>
                <textarea
                  name="references"
                  rows={3}
                  className={`${field} resize-y font-mono text-[11px]`}
                  placeholder={"Smith J. et al. (2024). Journal Name. DOI:10.xxxx/...\nПо одному на рядок"}
                />
                <span className="text-[10px] text-stone-400">
                  {isUk ? "По одному посиланню на рядок" : "One reference per line — shown on Zenodo"}
                </span>
              </label>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-stone-600">
                    {isUk ? "Пов'язані ідентифікатори (Related works)" : "Related identifiers"}
                  </span>
                  <button type="button" onClick={addRelatedId} className="control flex items-center gap-1 px-2 py-1 text-[10px]">
                    <Plus className="h-3 w-3" /> {isUk ? "Додати" : "Add"}
                  </button>
                </div>
                {relatedIds.map((ri, i) => (
                  <div key={i} className="flex gap-1.5 items-start">
                    <input type="hidden" name={`related_identifier_${i}`} value={ri.identifier} />
                    <input type="hidden" name={`related_scheme_${i}`} value={ri.scheme} />
                    <input type="hidden" name={`related_relation_${i}`} value={ri.relation} />
                    <input className={`${field} flex-1`} value={ri.identifier} onChange={(e) => updateRelatedId(i, "identifier", e.target.value)} placeholder="10.xxxx/... або https://..." />
                    <select className={field} value={ri.scheme} onChange={(e) => updateRelatedId(i, "scheme", e.target.value)}>
                      {["doi","url","isbn","issn","arxiv","pmid","handle","urn"].map((s) => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                    </select>
                    <select className={field} value={ri.relation} onChange={(e) => updateRelatedId(i, "relation", e.target.value)}>
                      {["IsCitedBy","Cites","IsSupplementTo","IsSupplementedBy","IsPartOf","HasPart","IsVersionOf","IsNewVersionOf","References","IsReferencedBy","IsDerivedFrom","IsSourceOf"].map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                    <button type="button" onClick={() => removeRelatedId(i)} className="control px-2 py-1 text-[10px] text-rose-500 shrink-0">✕</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Submit ────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <p className="max-w-sm text-xs text-stone-400">
          {isUk
            ? "Після створення: lifecycle, Open Science, Zenodo API (де підтримується)."
            : "After creation: lifecycle tracking, Open Science card, Zenodo API (where supported)."}
        </p>
        <button type="submit" className="control-primary px-5 py-2.5 text-sm font-semibold">
          {dictionary.form.submit}
        </button>
      </div>
    </form>
  );
}
