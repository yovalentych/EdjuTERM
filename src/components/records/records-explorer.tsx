"use client";

import {
  Archive,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Clock,
  Download,
  Edit2,
  ExternalLink,
  FileArchive,
  Filter,
  FolderOpen,
  GanttChart,
  Globe,
  Grid3X3,
  Layers,
  List,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Tag,
  TriangleAlert,
  Upload,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import type React from "react";
import { ArchiveRecordButton, DeleteRecordButton } from "@/components/record-actions";
import { FilePreviewButton, RecordFileUpload } from "@/components/file-viewer";
import { LicenseBadge } from "@/components/license-badge";
import { RecordWizard } from "@/components/records/record-wizard";
import { VersionTree } from "@/components/records/version-tree";
import {
  addRecordProcessingNote,
  changeRecordProcessingStatus,
  checkRecordZenodoStatus,
  createZenodoNewVersion,
  prepareRecordForOpenScience,
  publishRecordZenodo,
  syncRecordZenodoDraft,
  syncRecordZenodoFiles,
  updateRecord,
} from "@/app/actions";
import type { OpenScienceUpdate, Project, ProjectRecord, ResearchPublication, SafeUser } from "@/lib/schemas";
import { KIND_CONFIGS, getKindsByGroup } from "@/lib/record-field-definitions";
import type { Dictionary } from "@/lib/i18n";
import { InstitutionSearch } from "@/components/ui/institution-search";

// ── Types & constants ─────────────────────────────────────────────────────────

type ViewMode = "grid" | "list" | "timeline" | "cluster";
type SortKey = "newest" | "oldest" | "title" | "files" | "size";
type GroupBy = "kind" | "stage" | "group" | "month" | "processingStatus" | "access";

const COLOR_BADGE: Record<string, string> = {
  indigo:  "border-indigo-200 bg-indigo-50 text-indigo-800",
  purple:  "border-purple-200 bg-purple-50 text-purple-800",
  blue:    "border-blue-200 bg-blue-50 text-blue-800",
  sky:     "border-sky-200 bg-sky-50 text-sky-800",
  amber:   "border-amber-200 bg-amber-50 text-amber-800",
  rose:    "border-rose-200 bg-rose-50 text-rose-800",
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-800",
  violet:  "border-violet-200 bg-violet-50 text-violet-800",
  orange:  "border-orange-200 bg-orange-50 text-orange-800",
};

export const KIND_LABELS: Record<string, string> = Object.fromEntries(
  Object.entries(KIND_CONFIGS).map(([k, v]) => [k, v.labelUk])
);

const KIND_COLORS: Record<string, string> = Object.fromEntries(
  Object.entries(KIND_CONFIGS).map(([k, v]) => [k, COLOR_BADGE[v.color] ?? "border-stone-200 bg-stone-50 text-stone-800"])
);

const ACCESS_LABELS: Record<string, string> = {
  internal: "Внутрішній",
  open: "Відкритий",
  embargoed: "Ембарго",
  restricted: "Обмежений",
};

const ACCESS_COLORS: Record<string, string> = {
  internal: "border-stone-300 bg-stone-100 text-stone-600",
  open: "border-emerald-300 bg-emerald-50 text-emerald-700",
  embargoed: "border-amber-300 bg-amber-50 text-amber-700",
  restricted: "border-rose-300 bg-rose-50 text-rose-700",
};

const PROCESSING_STEPS: { key: string; label: string }[] = [
  { key: "raw", label: "Сирі дані" },
  { key: "processed", label: "Оброблено" },
  { key: "analyzed", label: "Проаналізовано" },
  { key: "published", label: "Опубліковано" },
];

const PROCESSING_COLORS: Record<string, string> = {
  raw: "bg-slate-400",
  processed: "bg-blue-500",
  analyzed: "bg-violet-500",
  published: "bg-emerald-500",
};

const STATUS_OPTIONS = ["planned", "active", "review", "released", "blocked"] as const;
const STATUS_LABELS: Record<string, string> = {
  planned: "Заплановано",
  active: "Активний",
  review: "На перевірці",
  released: "Опублікований",
  blocked: "Заблокований",
};

const DATA_FORMATS = ["csv", "xlsx", "xml", "json", "tsv", "image", "protocol_document", "archive", "mixed", "other"] as const;

const STAGE_OPTIONS = ["Stage 1", "Stage 2", "Stage 3"] as const;

// ── Utils ─────────────────────────────────────────────────────────────────────

function formatBytes(b: number) {
  if (!b) return "0 B";
  const u = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(b) / Math.log(1024)), u.length - 1);
  return `${(b / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${u[i]}`;
}

function formatDate(value: Date | string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("uk-UA", { day: "2-digit", month: "short", year: "numeric" });
}

function formatDateTime(value: Date | string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("uk-UA", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function recordBytes(r: ProjectRecord) {
  return r.rawDataFiles.reduce((s, f) => s + (f.bytes ?? 0), 0);
}

function recordMonth(r: ProjectRecord) {
  const d = new Date(r.createdAt);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function recordMonthLabel(r: ProjectRecord) {
  const d = new Date(r.createdAt);
  return d.toLocaleDateString("uk-UA", { month: "long", year: "numeric" });
}

function matchesSearch(r: ProjectRecord, q: string) {
  if (!q) return true;
  const ql = q.toLowerCase();
  return (
    r.title.toLowerCase().includes(ql) ||
    r.localId.toLowerCase().includes(ql) ||
    (r.summary ?? "").toLowerCase().includes(ql) ||
    (r.keywords ?? "").toLowerCase().includes(ql) ||
    (r.group ?? "").toLowerCase().includes(ql) ||
    (r.owner ?? "").toLowerCase().includes(ql) ||
    r.tags.some((t) => t.toLowerCase().includes(ql))
  );
}

function getUserName(userId: string, members: SafeUser[]) {
  const m = members.find((u) => u._id === userId);
  return m ? `${m.firstName} ${m.lastName}` : userId ? "Учасник" : "—";
}

// ── File type detection ───────────────────────────────────────────────────────

type PreviewType = "csv" | "excel" | "json" | "text";
interface FileType { ext: string; bg: string; color: string; previewType?: PreviewType }

function detectFileType(name: string, mime: string): FileType {
  const ext = name.toLowerCase().split(".").pop() ?? "";
  const map: Record<string, FileType> = {
    csv:  { ext: "CSV",  bg: "bg-emerald-50",  color: "text-emerald-700", previewType: "csv" },
    tsv:  { ext: "TSV",  bg: "bg-emerald-50",  color: "text-emerald-700", previewType: "csv" },
    xlsx: { ext: "XLS",  bg: "bg-green-50",    color: "text-green-700",   previewType: "excel" },
    xls:  { ext: "XLS",  bg: "bg-green-50",    color: "text-green-700",   previewType: "excel" },
    xlsm: { ext: "XLSM", bg: "bg-green-50",    color: "text-green-700",   previewType: "excel" },
    ods:  { ext: "ODS",  bg: "bg-green-50",    color: "text-green-700",   previewType: "excel" },
    json: { ext: "JSON", bg: "bg-amber-50",    color: "text-amber-700",   previewType: "json" },
    jsonl:{ ext: "JSONL",bg: "bg-amber-50",    color: "text-amber-700",   previewType: "json" },
    geojson:{ ext: "GEO",bg: "bg-amber-50",   color: "text-amber-700",   previewType: "json" },
    txt:  { ext: "TXT",  bg: "bg-slate-100",   color: "text-slate-600",   previewType: "text" },
    md:   { ext: "MD",   bg: "bg-slate-100",   color: "text-slate-600",   previewType: "text" },
    r:    { ext: "R",    bg: "bg-blue-50",     color: "text-blue-700",    previewType: "text" },
    py:   { ext: "PY",   bg: "bg-blue-50",     color: "text-blue-700",    previewType: "text" },
    m:    { ext: "M",    bg: "bg-blue-50",     color: "text-blue-700",    previewType: "text" },
    log:  { ext: "LOG",  bg: "bg-slate-100",   color: "text-slate-600",   previewType: "text" },
    xml:  { ext: "XML",  bg: "bg-orange-50",   color: "text-orange-700",  previewType: "text" },
    yaml: { ext: "YAML", bg: "bg-orange-50",   color: "text-orange-700",  previewType: "text" },
    yml:  { ext: "YAML", bg: "bg-orange-50",   color: "text-orange-700",  previewType: "text" },
    pdf:  { ext: "PDF",  bg: "bg-rose-50",     color: "text-rose-700" },
    docx: { ext: "DOC",  bg: "bg-blue-50",     color: "text-blue-700" },
    doc:  { ext: "DOC",  bg: "bg-blue-50",     color: "text-blue-700" },
    zip:  { ext: "ZIP",  bg: "bg-slate-100",   color: "text-slate-600" },
    gz:   { ext: "GZ",   bg: "bg-slate-100",   color: "text-slate-600" },
    h5:   { ext: "HDF5", bg: "bg-violet-50",   color: "text-violet-700" },
    hdf5: { ext: "HDF5", bg: "bg-violet-50",   color: "text-violet-700" },
    mat:  { ext: "MAT",  bg: "bg-violet-50",   color: "text-violet-700" },
    nc:   { ext: "NetCDF",bg:"bg-violet-50",   color: "text-violet-700" },
    fasta:{ ext: "FASTA",bg: "bg-teal-50",    color: "text-teal-700" },
    fastq:{ ext: "FASTQ",bg: "bg-teal-50",    color: "text-teal-700" },
    vcf:  { ext: "VCF",  bg: "bg-teal-50",    color: "text-teal-700" },
    bam:  { ext: "BAM",  bg: "bg-teal-50",    color: "text-teal-700" },
    png:  { ext: "PNG",  bg: "bg-pink-50",     color: "text-pink-700" },
    jpg:  { ext: "JPG",  bg: "bg-pink-50",     color: "text-pink-700" },
    jpeg: { ext: "JPG",  bg: "bg-pink-50",     color: "text-pink-700" },
    tif:  { ext: "TIF",  bg: "bg-pink-50",     color: "text-pink-700" },
    svg:  { ext: "SVG",  bg: "bg-pink-50",     color: "text-pink-700" },
  };
  if (map[ext]) return map[ext];
  if (mime === "text/csv" || mime === "application/csv") return map.csv;
  if (mime === "application/json") return map.json;
  if (mime.startsWith("image/")) return map.png;
  if (mime.startsWith("text/")) return { ext: ext.toUpperCase() || "TXT", bg: "bg-slate-100", color: "text-slate-600", previewType: "text" };
  return { ext: (ext.toUpperCase() || "FILE").slice(0, 4), bg: "bg-slate-100", color: "text-slate-500" };
}

// ── Processing pipeline ───────────────────────────────────────────────────────

function ProcessingPipeline({ status }: { status: string }) {
  const idx = PROCESSING_STEPS.findIndex((s) => s.key === status);
  return (
    <div className="flex items-center gap-0">
      {PROCESSING_STEPS.map((step, i) => {
        const done = i <= idx;
        const active = i === idx;
        return (
          <div key={step.key} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-[10px] font-bold ${
                done ? `border-transparent ${PROCESSING_COLORS[step.key]} text-white` : "border-slate-200 bg-white text-slate-300"
              } ${active ? "ring-2 ring-offset-1 ring-blue-300" : ""}`}>
                {i + 1}
              </div>
              <span className={`mt-1 text-[10px] font-medium ${done ? "text-slate-700" : "text-slate-300"}`}>{step.label}</span>
            </div>
            {i < PROCESSING_STEPS.length - 1 && (
              <div className={`mb-4 h-0.5 w-8 ${i < idx ? "bg-slate-400" : "bg-slate-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function getLifecycleReadiness(record: ProjectRecord, linked: ResearchPublication[]) {
  return [
    {
      key: "files",
      label: "Файли додані",
      done: record.rawDataFiles.length > 0,
      hint: "Для переходу далі потрібен хоча б один прикріплений файл.",
    },
    {
      key: "metadata",
      label: "Метадані заповнені",
      done: Boolean(record.title && record.owner && record.repository && record.dataFormat && record.summary),
      hint: "Назва, власник, репозиторій, формат і короткий опис мають бути заповнені.",
    },
    {
      key: "usage",
      label: "Є опис використання",
      done: Boolean(record.usageNotes || record.keywords || record.tags.length > 0),
      hint: "Додай нотатки, ключові слова або теги, щоб інші розуміли контекст даних.",
    },
    {
      key: "analysis",
      label: "Повʼязано з результатом",
      done: linked.length > 0 || record.doi.length > 0,
      hint: "Для проаналізованих даних бажано мати DOI або повʼязану публікацію/результат.",
    },
    {
      key: "open",
      label: "Готовність до відкриття",
      done: record.access === "open" || record.access === "embargoed" || record.status === "released",
      hint: "Для публікації потрібен відкритий/ембарго-доступ або released статус запису.",
    },
  ];
}

function nextProcessingStatus(status: string) {
  const idx = PROCESSING_STEPS.findIndex((step) => step.key === status);
  if (idx < 0 || idx >= PROCESSING_STEPS.length - 1) return null;
  return PROCESSING_STEPS[idx + 1];
}

function getZenodoPublishIssues(record: ProjectRecord) {
  return [
    record.access !== "open" ? "Доступ має бути відкритий." : "",
    record.processingStatus !== "published" ? "Стан обробки має бути “Опубліковано”." : "",
    !record.summary.trim() ? "Потрібен короткий опис." : "",
    !record.owner.trim() ? "Потрібен власник/creator." : "",
    !record.license.trim() ? "Потрібна ліцензія." : "",
    record.rawDataFiles.length === 0 ? "Потрібен хоча б один файл запису." : "",
    record.zenodoSubmitted ? "Запис уже опублікований у Zenodo." : "",
  ].filter(Boolean);
}

function DataLifecyclePanel({
  record,
  linked,
  openScienceUpdate,
  locale,
  returnTo,
}: {
  record: ProjectRecord;
  linked: ResearchPublication[];
  openScienceUpdate?: OpenScienceUpdate;
  locale: string;
  returnTo: string;
}) {
  const readiness = getLifecycleReadiness(record, linked);
  const completed = readiness.filter((item) => item.done).length;
  const next = nextProcessingStatus(record.processingStatus ?? "raw");
  const pct = Math.round((completed / readiness.length) * 100);
  const history = record.processingHistory.length > 0
    ? record.processingHistory
    : [{
        status: record.processingStatus ?? "raw",
        changedAt: record.createdAt,
        changedBy: record.createdBy,
        note: "Початковий стан запису.",
      }];
  const zenodoPublishIssues = getZenodoPublishIssues(record);
  const canPublishToZenodo = zenodoPublishIssues.length === 0;

  return (
    <div className="space-y-4">
      <ProcessingPipeline status={record.processingStatus ?? "raw"} />

      {record._id && (
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 p-3">
          <div className="flex items-start gap-2">
            <Upload className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold text-indigo-950">Zenodo draft</p>
                  <p className="mt-1 text-xs leading-5 text-indigo-800">
                    Синхронізує метадані запису з Zenodo через серверний API та резервує DOI. Публікація не запускається автоматично.
                  </p>
                </div>
                {record.zenodoState && (
                  <span className="rounded border border-indigo-200 bg-white px-2 py-1 text-[10px] font-semibold text-indigo-700">
                    {record.zenodoState}
                  </span>
                )}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-indigo-800">
                {(record.zenodoDoi || record.zenodoConceptDoi) && (
                  <span className="rounded border border-indigo-200 bg-white px-2 py-1 font-mono">
                    {record.zenodoDoi || record.zenodoConceptDoi}
                  </span>
                )}
                {record.zenodoFileCount > 0 && (
                  <span className="rounded border border-indigo-200 bg-white px-2 py-1">
                    {record.zenodoFileCount} Zenodo файлів
                  </span>
                )}
                {record.zenodoSyncedAt && (
                  <span className="text-indigo-700">
                    Оновлено: {formatDateTime(record.zenodoSyncedAt)}
                  </span>
                )}
              </div>
              {record.zenodoSyncError && (
                <p className="mt-2 rounded border border-rose-200 bg-rose-50 px-2 py-1.5 text-[11px] leading-4 text-rose-700">
                  {record.zenodoSyncError}
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <form action={syncRecordZenodoDraft}>
                  <input type="hidden" name="recordId" value={record._id} />
                  <input type="hidden" name="locale" value={locale} />
                  <input type="hidden" name="returnTo" value={returnTo} />
                  <button type="submit" className="control-primary inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold">
                    <Upload className="h-3.5 w-3.5" />
                    {record.zenodoDepositionId ? "Оновити Zenodo" : "Створити Zenodo draft"}
                  </button>
                </form>
                <form action={syncRecordZenodoFiles}>
                  <input type="hidden" name="recordId" value={record._id} />
                  <input type="hidden" name="locale" value={locale} />
                  <input type="hidden" name="returnTo" value={returnTo} />
                  <button type="submit" className="control inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold">
                    <Upload className="h-3.5 w-3.5" />
                    Завантажити файли
                  </button>
                </form>
                {record.zenodoDepositionId && (
                  <form action={checkRecordZenodoStatus}>
                    <input type="hidden" name="recordId" value={record._id} />
                    <input type="hidden" name="locale" value={locale} />
                    <input type="hidden" name="returnTo" value={returnTo} />
                    <button type="submit" className="control inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold" title="Перевірити чи запис існує на Zenodo та оновити статус">
                      <RefreshCw className="h-3.5 w-3.5" />
                      Перевірити статус
                    </button>
                  </form>
                )}
                {(record.zenodoDraftUrl || record.zenodoUrl) && (
                  <a
                    href={record.zenodoDraftUrl || record.zenodoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="control inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold"
                  >
                    Відкрити Zenodo <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
              {record.zenodoSubmitted ? (
                <div className="mt-3 space-y-2">
                  <p className="rounded border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-[11px] leading-4 text-emerald-800">
                    Запис опублікований у Zenodo.{" "}
                    {record.zenodoDoi && (
                      <a
                        href={`https://doi.org/${record.zenodoDoi}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono font-semibold underline underline-offset-2"
                      >
                        {record.zenodoDoi}
                      </a>
                    )}
                  </p>
                  <form action={createZenodoNewVersion}>
                    <input type="hidden" name="recordId" value={record._id} />
                    <input type="hidden" name="locale" value={locale} />
                    <input type="hidden" name="returnTo" value={returnTo} />
                    <button
                      type="submit"
                      className="control inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold"
                      title="Створює новий Zenodo draft з тим самим Concept DOI, але новим Version DOI. Файли копіюються автоматично."
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                      Нова версія Zenodo
                    </button>
                  </form>
                </div>
              ) : (
                <div className="mt-3 rounded border border-white/80 bg-white/70 p-2.5">
                  {canPublishToZenodo ? (
                    <form action={publishRecordZenodo} className="grid gap-2">
                      <input type="hidden" name="recordId" value={record._id} />
                      <input type="hidden" name="locale" value={locale} />
                      <input type="hidden" name="returnTo" value={returnTo} />
                      <label className="flex items-start gap-2 text-[11px] leading-4 text-indigo-900">
                        <input
                          type="checkbox"
                          name="confirmPublish"
                          value="yes"
                          required
                          className="mt-0.5 shrink-0 accent-indigo-600"
                        />
                        <span>
                          Підтверджую публікацію в Zenodo. Після publish запис отримає публічний DOI, а редагування файлів буде обмежене правилами Zenodo.
                        </span>
                      </label>
                      <button type="submit" className="rounded border border-rose-600 bg-rose-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-700">
                        Publish to Zenodo
                      </button>
                    </form>
                  ) : (
                    <div>
                      <p className="text-[11px] font-semibold text-indigo-950">До publish треба закрити перевірки</p>
                      <ul className="mt-1 grid gap-1">
                        {zenodoPublishIssues.map((issue) => (
                          <li key={issue} className="flex items-start gap-1.5 text-[11px] leading-4 text-indigo-800">
                            <TriangleAlert className="mt-0.5 h-3 w-3 shrink-0 text-amber-500" />
                            {issue}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-blue-50/50 p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-slate-800">Готовність запису</p>
            <p className="text-xs text-slate-500">{completed} з {readiness.length} умов виконано</p>
          </div>
          <span className="rounded-full border border-blue-200 bg-white px-2.5 py-1 font-mono text-xs font-semibold text-blue-700">
            {pct}%
          </span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
          <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-3 grid gap-2">
          {readiness.map((item) => (
            <div key={item.key} className="flex items-start gap-2 rounded-lg bg-white/75 px-2.5 py-2">
              {item.done ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              ) : (
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              )}
              <div>
                <p className={`text-xs font-semibold ${item.done ? "text-slate-800" : "text-amber-800"}`}>{item.label}</p>
                {!item.done && <p className="mt-0.5 text-[11px] leading-4 text-slate-500">{item.hint}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {next && record._id && (
        <div className="grid gap-3">
          <form action={changeRecordProcessingStatus} className="rounded-xl border border-blue-100 bg-blue-50/60 p-3">
            <input type="hidden" name="recordId" value={record._id} />
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="returnTo" value={returnTo} />
            <input type="hidden" name="processingStatus" value={next.key} />
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-blue-900">Наступний крок</p>
                <p className="text-xs text-blue-700">Перевести запис у стан “{next.label}”.</p>
              </div>
              <button type="submit" className="control-primary inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold">
                Перевести <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <textarea
              name="note"
              rows={2}
              className="input-control mt-3 w-full px-3 py-2 text-xs"
              placeholder="Коротка нотатка: що було зроблено перед зміною стану"
            />
          </form>

          <form action={addRecordProcessingNote} className="rounded-xl border border-slate-200 bg-white p-3">
            <input type="hidden" name="recordId" value={record._id} />
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="returnTo" value={returnTo} />
            <p className="text-xs font-semibold text-slate-800">Додати нотатку без зміни етапу</p>
            <textarea
              name="note"
              rows={2}
              required
              className="input-control mt-2 w-full px-3 py-2 text-xs"
              placeholder="Що зроблено під час обробки: очищення, перевірка, нормалізація, контроль якості..."
            />
            <button type="submit" className="control mt-2 px-3 py-2 text-xs font-semibold">
              Додати нотатку
            </button>
          </form>
        </div>
      )}

      {!next && record._id && (
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-3">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-emerald-900">Дані пройшли lifecycle</p>
              <p className="mt-1 text-xs leading-5 text-emerald-800">
                Можна створити публічну картку для open science. Вона стане видимою на публічній сторінці, якщо доступ запису встановлено як “Відкритий”.
              </p>
              {record.access !== "open" && (
                <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2 text-[11px] leading-4 text-amber-800">
                  Зараз доступ не відкритий. Картка буде створена як чернетка, доки в записі не змінити доступ на “Відкритий”.
                </p>
              )}
              {openScienceUpdate && (
                <div className="mt-3 rounded-lg border border-emerald-200 bg-white/80 px-3 py-2">
                  <p className="text-xs font-semibold text-emerald-900">
                    Open Science: {openScienceUpdate.status === "published" ? "опубліковано" : "чернетка"}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] text-emerald-700">{openScienceUpdate.title}</p>
                </div>
              )}
              <form action={prepareRecordForOpenScience} className="mt-3 grid gap-2">
                <input type="hidden" name="recordId" value={record._id} />
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="returnTo" value={returnTo} />
                <label className="grid gap-1">
                  <span className="text-[11px] font-semibold text-emerald-900">Публічна назва</span>
                  <input
                    name="publicTitle"
                    defaultValue={openScienceUpdate?.title ?? record.title}
                    className="input-control px-3 py-2 text-xs"
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-[11px] font-semibold text-emerald-900">Короткий опис для сторінки</span>
                  <textarea
                    name="publicSummary"
                    rows={2}
                    defaultValue={openScienceUpdate?.summary ?? record.summary}
                    className="input-control px-3 py-2 text-xs"
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-[11px] font-semibold text-emerald-900">Опис використання / методичний контекст</span>
                  <textarea
                    name="publicContent"
                    rows={4}
                    defaultValue={openScienceUpdate?.content ?? record.usageNotes}
                    className="input-control px-3 py-2 text-xs"
                    placeholder="Що це за дані, як ними користуватися, які обмеження або підготовчі кроки потрібні."
                  />
                </label>
                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="grid gap-1">
                    <span className="text-[11px] font-semibold text-emerald-900">Публічне посилання / DOI</span>
                    <input
                      name="publicUrl"
                      defaultValue={openScienceUpdate?.publicUrl ?? record.doi}
                      className="input-control px-3 py-2 text-xs"
                    />
                  </label>
                  <label className="grid gap-1">
                    <span className="text-[11px] font-semibold text-emerald-900">Ліцензія</span>
                    <input
                      name="license"
                      defaultValue={openScienceUpdate?.license ?? record.license}
                      className="input-control px-3 py-2 text-xs"
                      placeholder="CC-BY-4.0"
                    />
                  </label>
                </div>
                <label className="grid gap-1">
                  <span className="text-[11px] font-semibold text-emerald-900">Нотатки інклюзивності</span>
                  <textarea
                    name="accessibilityNotes"
                    rows={2}
                    defaultValue={openScienceUpdate?.accessibilityNotes ?? ""}
                    className="input-control px-3 py-2 text-xs"
                    placeholder="Пояснення для користувачів зі screen reader, опис структури таблиць, альтернативний формат тощо."
                  />
                </label>
                <button type="submit" className="control-primary px-3 py-2 text-xs font-semibold">
                  {openScienceUpdate ? "Оновити open science картку" : "Підготувати для open science"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Історія життєвого циклу</p>
        <div className="space-y-2">
          {history.slice().reverse().map((event, index) => (
            <div key={`${event.status}-${event.changedAt}-${index}`} className="rounded-lg border border-slate-100 bg-white px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-800">
                  {PROCESSING_STEPS.find((step) => step.key === event.status)?.label ?? event.status}
                </span>
                <span className="text-[11px] text-slate-400">{formatDateTime(event.changedAt)}</span>
              </div>
              {event.note && <p className="mt-1 text-xs leading-5 text-slate-500">{event.note}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Creator Edit Section ──────────────────────────────────────────────────────

function CreatorEditSection({ record }: { record: ProjectRecord }) {
  const [rows, setRows] = useState<{ name: string; affiliation: string; orcid: string }[]>(
    record.creators && record.creators.length > 0
      ? record.creators
      : [{ name: record.owner ?? "", affiliation: "", orcid: "" }],
  );

  function addRow() {
    setRows((prev) => [...prev, { name: "", affiliation: "", orcid: "" }]);
  }
  function removeRow(i: number) {
    setRows((prev) => prev.filter((_, idx) => idx !== i));
  }
  function update(i: number, field: "name" | "affiliation" | "orcid", value: string) {
    setRows((prev) => prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r));
  }

  const fc = "input-control w-full px-3 py-2 text-sm outline-none";
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-600">Автори / укладачі</span>
        <button type="button" onClick={addRow} className="control px-2 py-1 text-xs">+ Додати</button>
      </div>
      {rows.map((row, i) => (
        <div key={i} className="grid gap-1.5 sm:grid-cols-3 items-start">
          <input
            name={`creator_name_${i}`}
            value={row.name}
            onChange={(e) => update(i, "name", e.target.value)}
            placeholder="Прізвище Ім'я"
            className={fc}
            required
          />
          <InstitutionSearch
            name={`creator_affiliation_${i}`}
            value={row.affiliation}
            onChange={(v) => update(i, "affiliation", v)}
            placeholder="Організація"
          />
          <div className="flex gap-1">
            <input
              name={`creator_orcid_${i}`}
              value={row.orcid}
              onChange={(e) => update(i, "orcid", e.target.value)}
              placeholder="ORCID"
              className={`${fc} flex-1`}
            />
            {rows.length > 1 && (
              <button type="button" onClick={() => removeRow(i)} className="control px-2 text-xs text-rose-500">✕</button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Edit Form ─────────────────────────────────────────────────────────────────

function RecordEditForm({
  record,
  locale,
  returnTo,
  onCancel,
}: {
  record: ProjectRecord;
  locale: string;
  returnTo: string;
  onCancel: () => void;
}) {
  const fc = "input-control w-full px-3 py-2 text-sm outline-none";
  return (
    <form action={updateRecord} className="space-y-4">
      <input type="hidden" name="recordId" value={record._id ?? ""} />
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="returnTo" value={returnTo} />

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1">
          <span className="text-xs font-semibold text-slate-600">Тип</span>
          <select name="kind" defaultValue={record.kind} className={fc}>
            {Object.entries(KIND_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-xs font-semibold text-slate-600">Доступ</span>
          <select name="access" defaultValue={record.access} className={fc}>
            {Object.entries(ACCESS_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </label>
        <label className="col-span-2 space-y-1">
          <span className="text-xs font-semibold text-slate-600">Назва</span>
          <input name="title" defaultValue={record.title} required className={fc} />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-semibold text-slate-600">Етап</span>
          <select name="stage" defaultValue={record.stage} className={fc}>
            {STAGE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-xs font-semibold text-slate-600">Група</span>
          <input name="group" defaultValue={record.group} className={fc} />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-semibold text-slate-600">Формат</span>
          <select name="dataFormat" defaultValue={record.dataFormat} className={fc}>
            {DATA_FORMATS.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-xs font-semibold text-slate-600">Версія</span>
          <input name="version" defaultValue={record.version} className={fc} placeholder="v1.0" />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-semibold text-slate-600">Власник</span>
          <input name="owner" defaultValue={record.owner} required className={fc} />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-semibold text-slate-600">Репозиторій</span>
          <input name="repository" defaultValue={record.repository} required className={fc} />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-semibold text-slate-600">Стан обробки</span>
          <select name="processingStatus" defaultValue={record.processingStatus ?? "raw"} className={fc}>
            {PROCESSING_STEPS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-xs font-semibold text-slate-600">Статус запису</span>
          <select name="status" defaultValue={record.status} className={fc}>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
        </label>
        <label className="col-span-2 space-y-1">
          <span className="text-xs font-semibold text-slate-600">DOI</span>
          <input name="doi" defaultValue={record.doi} className={fc} placeholder="10.xxxx/..." />
        </label>
        <label className="col-span-2 space-y-1">
          <span className="text-xs font-semibold text-slate-600">Теги (через кому)</span>
          <input name="tags" defaultValue={record.tags.join(", ")} className={fc} />
        </label>
        <label className="col-span-2 space-y-1">
          <span className="text-xs font-semibold text-slate-600">Ключові слова</span>
          <input name="keywords" defaultValue={record.keywords} className={fc} />
        </label>
        <label className="col-span-2 space-y-1">
          <span className="text-xs font-semibold text-slate-600">Опис</span>
          <textarea name="summary" defaultValue={record.summary} className={`${fc} min-h-20 resize-y`} />
        </label>
        <label className="col-span-2 space-y-1">
          <span className="text-xs font-semibold text-slate-600">Нотатки з використання</span>
          <textarea name="usageNotes" defaultValue={record.usageNotes} className={`${fc} min-h-16 resize-y`} />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-semibold text-slate-600">Мова (ISO 639-1)</span>
          <input name="language" defaultValue={record.language ?? ""} className={fc} placeholder="uk" />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-semibold text-slate-600">Дата ембарго</span>
          <input name="embargoDate" type="date" defaultValue={record.embargoDate ?? ""} className={fc} />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-semibold text-slate-600">Дата збору від</span>
          <input name="dateCollectedFrom" type="date" defaultValue={record.dateCollectedFrom ?? ""} className={fc} />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-semibold text-slate-600">Дата збору до</span>
          <input name="dateCollectedTo" type="date" defaultValue={record.dateCollectedTo ?? ""} className={fc} />
        </label>
        <label className="col-span-2 space-y-1">
          <span className="text-xs font-semibold text-slate-600">Грант / фінансування</span>
          <input name="fundingGrant" defaultValue={record.fundingGrant ?? ""} className={fc} placeholder="OpenAIRE ID або назва гранту" />
        </label>
        <label className="col-span-2 space-y-1">
          <span className="text-xs font-semibold text-slate-600">Тематичні теги (по одному на рядок)</span>
          <textarea
            name="subjects"
            defaultValue={(record.subjects ?? []).join("\n")}
            className={`${fc} min-h-16 resize-y`}
            placeholder="Одна тема на рядок"
          />
        </label>
        <label className="col-span-2 space-y-1">
          <span className="text-xs font-semibold text-slate-600">Примітки</span>
          <textarea name="notes" defaultValue={record.notes ?? ""} className={`${fc} min-h-16 resize-y`} />
        </label>
      </div>

      {/* Creators */}
      <CreatorEditSection record={record} />

      <div className="flex gap-2 pt-2">
        <button type="submit" className="control-primary px-4 py-2 text-sm font-semibold">
          Зберегти зміни
        </button>
        <button type="button" onClick={onCancel} className="control px-4 py-2 text-sm font-semibold">
          Скасувати
        </button>
      </div>
    </form>
  );
}

// ── Detail Panel ──────────────────────────────────────────────────────────────

function DetailPanel({
  record,
  publications,
  openScienceUpdates,
  allRecords,
  members,
  locale,
  returnTo,
  onClose,
  onSelectRecord,
}: {
  record: ProjectRecord;
  publications: ResearchPublication[];
  openScienceUpdates: OpenScienceUpdate[];
  allRecords: ProjectRecord[];
  members: SafeUser[];
  locale: string;
  returnTo: string;
  onClose: () => void;
  onSelectRecord: (r: ProjectRecord) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const linked = publications.filter((p) => record.linkedPublicationIds.includes(p._id ?? ""));
  const openScienceUpdate = openScienceUpdates.find((update) =>
    record._id ? update.linkedRecordIds.includes(record._id) : false,
  );
  const related = allRecords.filter((r) => r._id !== record._id && record.relatedIds.includes(r._id ?? ""));
  const isArchived = !!record.archivedAt;
  const totalBytes = recordBytes(record);
  const authorName = getUserName(record.createdBy, members);

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        role="button"
        tabIndex={-1}
        aria-label="Закрити"
      />
      <aside className="fixed inset-y-0 right-0 z-50 flex w-full flex-col overflow-hidden bg-white shadow-2xl sm:w-[560px] lg:w-[640px]">
        {/* Header */}
        <div className="flex items-start gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`border px-2 py-0.5 text-xs font-semibold ${KIND_COLORS[record.kind] ?? ""}`}>
                {KIND_LABELS[record.kind] ?? record.kind}
              </span>
              <span className={`border px-2 py-0.5 text-xs ${ACCESS_COLORS[record.access] ?? ""}`}>
                {ACCESS_LABELS[record.access] ?? record.access}
              </span>
              <span className={`rounded border px-2 py-0.5 text-[10px] font-medium ${
                record.status === "released" ? "border-emerald-200 bg-emerald-50 text-emerald-700" :
                record.status === "blocked" ? "border-rose-200 bg-rose-50 text-rose-700" :
                "border-slate-200 bg-slate-50 text-slate-500"
              }`}>{STATUS_LABELS[record.status] ?? record.status}</span>
              {isArchived && <span className="border border-amber-200 bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">Архів</span>}
            </div>
            <p className="mt-2 font-mono text-xs text-slate-400">{record.localId}</p>
            <h2 className="mt-0.5 text-base font-semibold text-slate-950">{record.title}</h2>
            <p className="mt-1 text-xs text-slate-400">
              Додав: <span className="font-medium text-slate-600">{authorName}</span>
              {" · "}{formatDateTime(record.createdAt)}
              {record.updatedAt !== record.createdAt && <> · оновлено {formatDate(record.updatedAt)}</>}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {!isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-blue-100 hover:text-blue-600"
                title="Редагувати"
              >
                <Edit2 className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-200 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          <div className="divide-y divide-slate-100">

            {/* Edit form or view */}
            {isEditing ? (
              <div className="px-5 py-4">
                <p className="mb-4 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Редагування запису</p>
                <RecordEditForm record={record} locale={locale} returnTo={returnTo} onCancel={() => setIsEditing(false)} />
              </div>
            ) : (
              <>
                {/* Processing pipeline */}
                <div className="px-5 py-4">
                  <p className="mb-3 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Стан обробки даних</p>
                  <DataLifecyclePanel
                    record={record}
                    linked={linked}
                    openScienceUpdate={openScienceUpdate}
                    locale={locale}
                    returnTo={returnTo}
                  />
                </div>

                {/* Core metadata */}
                <div className="px-5 py-4">
                  <p className="mb-3 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Метадані</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <MetaItem label="Етап" value={record.stage} />
                    <MetaItem label="Формат" value={record.dataFormat || "—"} />
                    <MetaItem label="Версія" value={record.version || "v1"} />
                    <MetaItem label="Власник" value={record.owner} />
                    <MetaItem label="Репозиторій" value={record.repository} />
                    <MetaItem label="Статус" value={STATUS_LABELS[record.status] ?? record.status} />
                    <MetaItem label="Створено" value={formatDateTime(record.createdAt)} />
                    <MetaItem label="Оновлено" value={formatDate(record.updatedAt)} />
                    <MetaItem label="Автор" value={authorName} />
                    {record.doi && (
                      <div className="col-span-2">
                        <p className="text-[10px] text-slate-400">DOI</p>
                        <a
                          href={record.doi.startsWith("http") ? record.doi : `https://doi.org/${record.doi}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline"
                        >
                          {record.doi} <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                    {(record.zenodoDraftUrl || record.zenodoUrl) && (
                      <div className="col-span-2">
                        <p className="text-[10px] text-slate-400">Zenodo</p>
                        <a
                          href={record.zenodoDraftUrl || record.zenodoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:underline"
                        >
                          {record.zenodoSubmitted ? "Опублікований запис" : "Чернетка депозиції"}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Summary & notes */}
                {(record.summary || record.usageNotes) && (
                  <div className="px-5 py-4 space-y-3">
                    {record.summary && (
                      <div>
                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Опис</p>
                        <p className="text-sm leading-6 text-slate-700">{record.summary}</p>
                      </div>
                    )}
                    {record.usageNotes && (
                      <div>
                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Нотатки з використання</p>
                        <p className="text-sm leading-6 text-slate-700">{record.usageNotes}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Typed data preview */}
                {record.typedData && Object.keys(record.typedData).length > 0 && (() => {
                  const cfg = KIND_CONFIGS[record.kind];
                  if (!cfg || cfg.fields.length === 0) return null;
                  const COMPLEX_PREVIEW = ["steps", "risk_items", "reagents", "qc_points", "troubleshooting"];
                  const scalarFields = cfg.fields.filter((f) => !COMPLEX_PREVIEW.includes(f.type)).slice(0, 8);
                  const complexFields = cfg.fields.filter((f) => COMPLEX_PREVIEW.includes(f.type));

                  const complexLabels: Record<string, (n: number) => string> = {
                    steps: (n) => `${n} кр.`,
                    risk_items: (n) => `${n} ризик.`,
                    reagents: (n) => `${n} реаг.`,
                    qc_points: (n) => `${n} КТЯ`,
                    troubleshooting: (n) => `${n} запис.`,
                  };

                  return (
                    <div className="px-5 py-4 border-t border-slate-100">
                      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        {cfg.icon} {cfg.labelUk}
                      </p>
                      {/* Complex array counts row */}
                      {complexFields.some((f) => Array.isArray(record.typedData?.[f.key]) && (record.typedData[f.key] as unknown[]).length > 0) && (
                        <div className="mb-2 flex flex-wrap gap-1.5">
                          {complexFields.map((f) => {
                            const arr = record.typedData?.[f.key];
                            if (!Array.isArray(arr) || arr.length === 0) return null;
                            const labelFn = complexLabels[f.type];
                            return (
                              <span key={f.key} className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600" title={f.uk}>
                                {labelFn ? labelFn(arr.length) : `${arr.length} ${f.uk}`}
                              </span>
                            );
                          })}
                        </div>
                      )}
                      <dl className="grid gap-x-4 gap-y-1.5 sm:grid-cols-2">
                        {scalarFields
                          .filter((f) => record.typedData?.[f.key] !== undefined && record.typedData?.[f.key] !== "")
                          .map((f) => {
                            const val = record.typedData?.[f.key];
                            const display = Array.isArray(val)
                              ? `${val.length} ${f.uk}`
                              : typeof val === "string" && val.length > 120
                              ? val.slice(0, 120) + "…"
                              : String(val ?? "");
                            return (
                              <div key={f.key} className="min-w-0">
                                <dt className="text-[10px] font-semibold text-slate-400 truncate">{f.uk}</dt>
                                <dd className="text-xs text-slate-700 leading-5 truncate">{display.replace(/_/g, " ")}</dd>
                              </div>
                            );
                          })}
                      </dl>
                    </div>
                  );
                })()}

                {/* Keywords & tags */}
                {(record.keywords || record.tags.length > 0) && (
                  <div className="px-5 py-4">
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Теги та ключові слова</p>
                    <div className="flex flex-wrap gap-1.5">
                      {record.tags.map((tag) => (
                        <span key={tag} className="inline-flex items-center gap-1 rounded-full border border-blue-100 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                          <Tag className="h-2.5 w-2.5" /> {tag}
                        </span>
                      ))}
                      {record.keywords && record.keywords.split(",").map((kw) => kw.trim()).filter(Boolean).map((kw) => (
                        <span key={kw} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs text-slate-600">{kw}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* License */}
                {record.license && (
                  <div className="px-5 py-4">
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Ліцензія</p>
                    <LicenseBadge licenseId={record.license} />
                  </div>
                )}

                {/* Linked publications */}
                {linked.length > 0 && (
                  <div className="px-5 py-4">
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Пов&apos;язані публікації ({linked.length})</p>
                    <div className="space-y-2">
                      {linked.map((p) => (
                        <div key={p._id ?? p.title} className="rounded-md border border-slate-100 bg-white px-3 py-2.5 text-sm">
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-medium text-slate-900">{p.title}</span>
                            <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] ${p.status === "published" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-500"}`}>{p.status}</span>
                          </div>
                          {p.authors && <p className="mt-0.5 text-xs text-slate-500">{p.authors}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Related records */}
                {related.length > 0 && (
                  <div className="px-5 py-4">
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Пов&apos;язані записи ({related.length})</p>
                    <div className="space-y-1.5">
                      {related.map((r) => (
                        <div key={r._id ?? r.localId} className="flex items-center gap-2 rounded-md border border-slate-100 bg-white px-3 py-2 text-xs">
                          <span className={`border px-1.5 py-0.5 text-[10px] font-medium ${KIND_COLORS[r.kind] ?? ""}`}>{KIND_LABELS[r.kind] ?? r.kind}</span>
                          <span className="min-w-0 flex-1 truncate font-medium text-slate-800">{r.title}</span>
                          <span className="font-mono text-slate-400">{r.localId}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Version & variant tree */}
                <VersionTree
                  record={record}
                  allRecords={allRecords}
                  locale={locale}
                  returnTo={returnTo}
                  onSelectRecord={onSelectRecord}
                />
              </>
            )}

            {/* Files — always visible */}
            {!isEditing && (
              <div className="px-5 py-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Файли ({record.rawDataFiles.length}) · {formatBytes(totalBytes)}
                  </p>
                </div>
                {record.rawDataFiles.length === 0 ? (
                  <p className="text-sm text-slate-400">Файли ще не прикріплені.</p>
                ) : (
                  <div className="space-y-1.5">
                    {record.rawDataFiles.map((file, idx) => {
                      const ft = detectFileType(file.name, file.mimeType ?? "");
                      return (
                        <div key={`${file.storageUri}-${idx}`} className="flex items-center gap-2">
                          <a
                            href={`/api/records/${record._id}/files/${idx}`}
                            className="flex min-w-0 flex-1 items-center gap-2.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs transition hover:border-blue-200 hover:bg-blue-50"
                          >
                            <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded text-[10px] font-bold ${ft.bg} ${ft.color}`}>{ft.ext}</span>
                            <span className="min-w-0">
                              <span className="block truncate font-medium text-slate-800">{file.name}</span>
                              <span className="text-slate-400">{formatBytes(file.bytes ?? 0)}</span>
                            </span>
                            <Download className="ml-auto h-3.5 w-3.5 shrink-0 text-slate-400" />
                          </a>
                          {ft.previewType && record._id && (
                            <FilePreviewButton
                              recordId={record._id}
                              fileIndex={idx}
                              fileName={file.name}
                              fileType={ft.previewType}
                              mimeType={file.mimeType}
                              storageUri={file.storageUri}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                {record._id && !isEditing && (
                  <div className="mt-3">
                    <RecordFileUpload recordId={record._id} />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        {!isEditing && record._id && (
          <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3">
            <ArchiveRecordButton recordId={record._id} locale={locale} returnTo={returnTo} isArchived={isArchived} />
            {isArchived && (
              <DeleteRecordButton recordId={record._id} recordTitle={record.title} locale={locale} returnTo={returnTo} />
            )}
          </div>
        )}
      </aside>
    </>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-slate-800 break-words">{value}</p>
    </div>
  );
}

// ── Record Card (Grid view) ───────────────────────────────────────────────────

// ── Stat tile ─────────────────────────────────────────────────────────────────

function StatTile({
  icon,
  label,
  value,
  color,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: "blue" | "slate" | "emerald" | "violet" | "amber" | "rose";
  onClick?: () => void;
}) {
  const colorMap = {
    blue:    "border-blue-100 bg-gradient-to-br from-blue-50 to-white text-blue-600",
    slate:   "border-slate-200 bg-gradient-to-br from-slate-50 to-white text-slate-500",
    emerald: "border-emerald-100 bg-gradient-to-br from-emerald-50 to-white text-emerald-600",
    violet:  "border-violet-100 bg-gradient-to-br from-violet-50 to-white text-violet-600",
    amber:   "border-amber-100 bg-gradient-to-br from-amber-50 to-white text-amber-600",
    rose:    "border-rose-100 bg-gradient-to-br from-rose-50 to-white text-rose-600",
  };
  const El = onClick ? "button" : "div";
  return (
    <El
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`flex items-center gap-3 rounded-xl border p-3.5 shadow-sm ${colorMap[color]} ${onClick ? "cursor-pointer transition hover:shadow-md hover:-translate-y-0.5" : ""}`}
    >
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ${colorMap[color].split(" ")[2]}`}>
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-lg font-bold leading-none text-slate-900 truncate">{value}</p>
        <p className="mt-0.5 text-[10px] font-medium text-slate-500 truncate">{label}</p>
      </div>
    </El>
  );
}

function EvidenceMetric({
  icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  detail: string;
  tone: "blue" | "slate" | "emerald" | "amber" | "rose";
}) {
  const toneMap = {
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    slate: "border-slate-200 bg-white text-slate-600",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    rose: "border-rose-200 bg-rose-50 text-rose-700",
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
          <p className="mt-1 truncate text-2xl font-bold text-slate-900">{value}</p>
        </div>
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border ${toneMap[tone]}`}>
          {icon}
        </span>
      </div>
      <p className="mt-3 line-clamp-2 text-xs leading-5 text-slate-500">{detail}</p>
    </div>
  );
}

function typedDataSummary(record: ProjectRecord): string | null {
  const cfg = KIND_CONFIGS[record.kind];
  if (!cfg || !record.typedData || Object.keys(record.typedData).length === 0) return null;
  const parts: string[] = [];
  for (const f of cfg.fields) {
    const val = record.typedData[f.key];
    if (!Array.isArray(val) || val.length === 0) continue;
    const noun = f.type === "steps" ? "кроків" : f.type === "risk_items" ? "ризиків" : "ел.";
    parts.push(`${val.length} ${noun}`);
    if (parts.length >= 2) break;
  }
  return parts.length > 0 ? parts.join(" · ") : null;
}

function RecordCard({
  record,
  members,
  onOpen,
  multiSelectMode,
  isSelected,
  onToggleSelect,
}: {
  record: ProjectRecord;
  members: SafeUser[];
  onOpen: (r: ProjectRecord) => void;
  multiSelectMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (r: ProjectRecord) => void;
}) {
  const isArchived = !!record.archivedAt;
  const procStep = PROCESSING_STEPS.findIndex((s) => s.key === (record.processingStatus ?? "raw"));
  const authorName = getUserName(record.createdBy, members);
  const kindIcon = KIND_CONFIGS[record.kind]?.icon;
  const summary = typedDataSummary(record);

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => multiSelectMode && onToggleSelect ? onToggleSelect(record) : onOpen(record)}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (multiSelectMode && onToggleSelect ? onToggleSelect(record) : onOpen(record))}
      className={`group relative cursor-pointer rounded-lg border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-300
        ${isArchived ? "opacity-70" : ""}
        ${isSelected ? "border-blue-500 ring-1 ring-blue-500" : "border-slate-200 hover:border-blue-300"}
      `}
    >
      {multiSelectMode && (
        <div className="absolute right-3 top-3">
          <input
            type="checkbox"
            checked={isSelected}
            readOnly
            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
          />
        </div>
      )}
      <div className={`flex flex-wrap items-center gap-1.5 ${multiSelectMode ? "pr-6" : ""}`}>
        {kindIcon && <span className="text-base leading-none">{kindIcon}</span>}
        <span className={`border px-2 py-0.5 text-[10px] font-semibold ${KIND_COLORS[record.kind] ?? ""}`}>{KIND_LABELS[record.kind] ?? record.kind}</span>
        <span className={`border px-2 py-0.5 text-[10px] ${ACCESS_COLORS[record.access] ?? ""}`}>{ACCESS_LABELS[record.access] ?? record.access}</span>
        {summary && (
          <span className="rounded border border-stone-200 bg-stone-50 px-1.5 py-0.5 text-[10px] text-stone-500">{summary}</span>
        )}
        {record.zenodoDepositionId && (
          <span className="border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-700">
            Zenodo
          </span>
        )}
        {record.variantLabel && (
          <span className="border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
            ⑂ {record.variantLabel}
          </span>
        )}
        {record.version && (
          <span className="border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-500">
            {record.version}
          </span>
        )}
        {!record.variantLabel && record.rootRecordId && (
          <span className="border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600">
            версія
          </span>
        )}
        {isArchived && <span className="border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-600">Архів</span>}
      </div>
      <p className="mt-3 font-mono text-[10px] text-slate-400">{record.localId}</p>
      <h3 className="mt-0.5 line-clamp-2 text-sm font-semibold text-slate-950 group-hover:text-blue-700">{record.title}</h3>
      {record.summary && <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-slate-500">{record.summary}</p>}
      {record.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {record.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600">{tag}</span>
          ))}
          {record.tags.length > 3 && <span className="rounded-full border border-slate-100 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-400">+{record.tags.length - 3}</span>}
        </div>
      )}
      <div className="mt-3 flex items-center gap-0.5">
        {PROCESSING_STEPS.map((step, i) => (
          <div key={step.key} title={step.label} className={`h-1.5 flex-1 rounded-full ${i <= procStep ? PROCESSING_COLORS[step.key] : "bg-slate-100"}`} />
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-2 text-[10px] text-slate-400">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" /> {authorName}
        </span>
        <span>{record.rawDataFiles.length} файлів · {formatDate(record.updatedAt)}</span>
      </div>
    </article>
  );
}

// ── Record List Row ───────────────────────────────────────────────────────────

function RecordRow({
  record,
  members,
  onOpen,
  multiSelectMode,
  isSelected,
  onToggleSelect,
}: {
  record: ProjectRecord;
  members: SafeUser[];
  onOpen: (r: ProjectRecord) => void;
  multiSelectMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (r: ProjectRecord) => void;
}) {
  const procStep = PROCESSING_STEPS.findIndex((s) => s.key === (record.processingStatus ?? "raw"));
  const authorName = getUserName(record.createdBy, members);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => multiSelectMode && onToggleSelect ? onToggleSelect(record) : onOpen(record)}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (multiSelectMode && onToggleSelect ? onToggleSelect(record) : onOpen(record))}
      className={`flex cursor-pointer items-center gap-3 border-b px-4 py-3 text-sm transition focus:outline-none
        ${isSelected ? "bg-blue-50/70 border-blue-200" : "border-slate-100 hover:bg-blue-50/50"}
      `}
    >
      {multiSelectMode && (
        <input
          type="checkbox"
          checked={isSelected}
          readOnly
          className="h-4 w-4 shrink-0 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
        />
      )}
      <span className={`shrink-0 border px-1.5 py-0.5 text-[10px] font-semibold ${KIND_COLORS[record.kind] ?? ""}`}>{KIND_LABELS[record.kind]?.slice(0, 4) ?? record.kind}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-[10px] text-slate-400">{record.localId}</span>
          <span className="truncate font-medium text-slate-900">{record.title}</span>
        </div>
        <span className="text-[10px] text-slate-400">{authorName}</span>
      </div>
      <div className="hidden shrink-0 items-center gap-0.5 sm:flex">
        {PROCESSING_STEPS.map((step, i) => (
          <div key={step.key} title={step.label} className={`h-1.5 w-5 rounded-full ${i <= procStep ? PROCESSING_COLORS[step.key] : "bg-slate-100"}`} />
        ))}
      </div>
      <span className={`hidden shrink-0 border px-1.5 py-0.5 text-[10px] sm:block ${ACCESS_COLORS[record.access] ?? ""}`}>{ACCESS_LABELS[record.access]?.slice(0, 4)}</span>
      {record.zenodoDepositionId && (
        <span className="hidden shrink-0 border border-indigo-200 bg-indigo-50 px-1.5 py-0.5 text-[10px] text-indigo-700 sm:block">
          ZEN
        </span>
      )}
      <span className="shrink-0 text-[10px] text-slate-400">{record.rawDataFiles.length} ф.</span>
      <span className="shrink-0 text-[10px] text-slate-400">{formatDate(record.updatedAt)}</span>
      <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
    </div>
  );
}

// ── Group header ──────────────────────────────────────────────────────────────

function GroupHeader({ title, count, bytes, fileCount }: { title: string; count: number; bytes: number; fileCount: number }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-t border-slate-200 bg-slate-50 px-4 py-2.5">
      <span className="text-xs font-semibold text-slate-700">{title}</span>
      <span className="text-[10px] text-slate-400">{count} записів · {fileCount} файлів · {formatBytes(bytes)}</span>
    </div>
  );
}

// ── Timeline entry ────────────────────────────────────────────────────────────

function TimelineEntry({
  record,
  showMonth,
  month,
  onOpen,
  multiSelectMode,
  isSelected,
  onToggleSelect,
}: {
  record: ProjectRecord;
  showMonth: boolean;
  month: string;
  onOpen: (r: ProjectRecord) => void;
  multiSelectMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (r: ProjectRecord) => void;
}) {
  return (
    <div>
      {showMonth && (
        <div className="mb-3 mt-6 flex items-center gap-3 first:mt-0">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500">{month}</span>
          <div className="flex-1 border-t border-slate-200" />
        </div>
      )}
      <div className="flex gap-3">
        <div className="flex flex-col items-center">
          <div className={`h-3 w-3 rounded-full border-2 border-white ring-2 ${PROCESSING_COLORS[record.processingStatus ?? "raw"]}`} />
          <div className="mt-1 w-0.5 flex-1 bg-slate-200" />
        </div>
        <div
          role="button"
          tabIndex={0}
          onClick={() => multiSelectMode && onToggleSelect ? onToggleSelect(record) : onOpen(record)}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (multiSelectMode && onToggleSelect ? onToggleSelect(record) : onOpen(record))}
          className={`group relative mb-3 min-w-0 flex-1 cursor-pointer rounded-lg border bg-white p-3 text-sm shadow-sm transition focus:outline-none
            ${isSelected ? "border-blue-500 bg-blue-50/30 ring-1 ring-blue-500" : "border-slate-200 hover:border-blue-200 hover:shadow-md"}
          `}
        >
          {multiSelectMode && (
            <div className="absolute right-3 top-3">
              <input
                type="checkbox"
                checked={isSelected}
                readOnly
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
              />
            </div>
          )}
          <div className={`flex items-start justify-between gap-2 ${multiSelectMode ? "pr-6" : ""}`}>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className={`border px-1.5 py-0.5 text-[10px] font-semibold ${KIND_COLORS[record.kind] ?? ""}`}>{KIND_LABELS[record.kind] ?? record.kind}</span>
                <span className="font-mono text-[10px] text-slate-400">{record.localId}</span>
              </div>
              <p className="mt-1 font-medium text-slate-900">{record.title}</p>
            </div>
            <span className="shrink-0 text-[10px] text-slate-400">{formatDate(record.createdAt)}</span>
          </div>
          {record.summary && <p className="mt-1 line-clamp-1 text-xs text-slate-500">{record.summary}</p>}
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

const ERROR_MESSAGES: Record<string, string> = {
  zenodo: "Помилка Zenodo API. Перевірте що токен має права deposit:write та deposit:actions.",
  zenodo_files: "Не вдалося завантажити файли до Zenodo. Перевірте токен і статус deposition.",
  zenodo_confirm: "Потрібно підтвердити публікацію: поставте галочку перед кнопкою Publish.",
  zenodo_version: "Не вдалося створити нову версію Zenodo. Запис може бути вже в draft-стані.",
  zenodo_publish: "Публікація в Zenodo не вдалася. Перегляньте помилку в блоку «Zenodo draft» нижче.",
  zenodo_not_ready: "Запис ще не готовий до публікації: перевірте всі умови готовності.",
  record: "Запис не знайдено.",
  project: "Немає доступу до цього проєкту.",
  record_not_published: "Стан обробки запису має бути «Опубліковано» перед публікацією у Zenodo.",
};

const kindsByGroup = getKindsByGroup();

export function RecordsExplorer({
  records,
  archivedRecords,
  publications,
  openScienceUpdates,
  members,
  locale,
  returnTo,
  initialError,
  currentUser,
  projects,
  dictionary,
}: {
  records: ProjectRecord[];
  archivedRecords: ProjectRecord[];
  publications: ResearchPublication[];
  openScienceUpdates: OpenScienceUpdate[];
  members: SafeUser[];
  locale: string;
  returnTo: string;
  initialError?: string;
  currentUser: SafeUser;
  projects: Project[];
  dictionary: Dictionary;
}) {
  const router = useRouter();
  const [errorBanner, setErrorBanner] = useState<string | null>(
    initialError ? (ERROR_MESSAGES[initialError] ?? `Сталася помилка: ${initialError}`) : null
  );

  const [showWizard, setShowWizard] = useState(false);
  const [kindTab, setKindTab] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [filterAccess, setFilterAccess] = useState<string[]>([]);
  const [filterProc, setFilterProc] = useState<string[]>([]);
  const [sort, setSort] = useState<SortKey>("newest");
  const [view, setView] = useState<ViewMode>("grid");
  const [groupBy, setGroupBy] = useState<GroupBy>("group");
  const [showArchived, setShowArchived] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ProjectRecord | null>(null);

  // Multi-select state
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const allRecords = useMemo(() => [...records, ...archivedRecords], [records, archivedRecords]);

  // Stats
  const draftCount = useMemo(() => records.filter((r) => r.status === "planned").length, [records]);
  const publishedCount = useMemo(() => records.filter((r) => r.access === "open" || r.status === "released").length, [records]);

  // Kind counts for tabs + tiles
  const kindCounts = useMemo(() => {
    const counts: Record<string, number> = { all: records.length };
    for (const r of records) counts[r.kind] = (counts[r.kind] ?? 0) + 1;
    return counts;
  }, [records]);

  const filtered = useMemo(() => {
    let base = showArchived ? allRecords : records;
    if (kindTab !== "all") base = base.filter((r) => r.kind === kindTab);
    if (search) base = base.filter((r) => matchesSearch(r, search));
    if (filterAccess.length > 0) base = base.filter((r) => filterAccess.includes(r.access));
    if (filterProc.length > 0) base = base.filter((r) => filterProc.includes(r.processingStatus ?? "raw"));
    return [...base].sort((a, b) => {
      if (sort === "newest") return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      if (sort === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sort === "title") return a.title.localeCompare(b.title, "uk");
      if (sort === "files") return b.rawDataFiles.length - a.rawDataFiles.length;
      if (sort === "size") return recordBytes(b) - recordBytes(a);
      return 0;
    });
  }, [allRecords, records, showArchived, kindTab, search, filterAccess, filterProc, sort]);

  const grouped = useMemo(() => {
    const map = new Map<string, ProjectRecord[]>();
    for (const r of filtered) {
      let key: string;
      if (groupBy === "kind") key = KIND_LABELS[r.kind] ?? r.kind;
      else if (groupBy === "stage") key = r.stage || "Без етапу";
      else if (groupBy === "group") key = r.group || `${r.stage} · ${new Date(r.createdAt).getFullYear()}`;
      else if (groupBy === "month") key = recordMonth(r);
      else if (groupBy === "processingStatus") key = PROCESSING_STEPS.find((s) => s.key === (r.processingStatus ?? "raw"))?.label ?? "Сирі дані";
      else key = ACCESS_LABELS[r.access] ?? r.access;
      map.set(key, [...(map.get(key) ?? []), r]);
    }
    return Array.from(map.entries()).map(([name, items]) => ({
      name,
      items,
      bytes: items.reduce((s, r) => s + recordBytes(r), 0),
      fileCount: items.reduce((s, r) => s + r.rawDataFiles.length, 0),
    }));
  }, [filtered, groupBy]);

  const totalBytes = records.reduce((s, r) => s + recordBytes(r), 0);
  const totalFiles = records.reduce((s, r) => s + r.rawDataFiles.length, 0);
  const hasFilters = search || filterAccess.length > 0 || filterProc.length > 0;
  const withFilesCount = records.filter((r) => r.rawDataFiles.length > 0).length;
  const openAccessCount = records.filter((r) => r.access === "open" || r.access === "embargoed").length;
  const publishedProcessingCount = records.filter((r) => r.processingStatus === "published").length;
  const zenodoReadyCount = records.filter((r) =>
    (r.access === "open" || r.access === "embargoed") &&
    r.processingStatus === "published" &&
    r.rawDataFiles.length > 0 &&
    Boolean(r.license.trim()) &&
    Boolean(r.title.trim()) &&
    Boolean(r.summary.trim()),
  ).length;
  const doiCount = records.filter((r) => Boolean(r.doi || r.zenodoDoi || r.zenodoConceptDoi)).length;
  const zenodoDraftCount = records.filter((r) => Boolean(r.zenodoDepositionId) && !r.zenodoSubmitted).length;
  const zenodoPublishedCount = records.filter((r) => r.zenodoSubmitted).length;
  const readinessPct = records.length > 0 ? Math.round((zenodoReadyCount / records.length) * 100) : 0;

  const toggleFilter = useCallback((set: React.Dispatch<React.SetStateAction<string[]>>, val: string) => {
    set((prev) => prev.includes(val) ? prev.filter((x) => x !== val) : [...prev, val]);
  }, []);

  const openRecord = useCallback((r: ProjectRecord) => setSelectedRecord(r), []);
  const closeDetail = useCallback(() => {
    setSelectedRecord(null);
    router.refresh();
  }, [router]);

  const toggleSelectRecord = useCallback((r: ProjectRecord) => {
    if (!r._id) return;
    const id = r._id;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    const ids = filtered.map(r => r._id).filter((id): id is string => !!id);
    setSelectedIds(new Set(ids));
  }, [filtered]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setMultiSelectMode(false);
  }, []);

  return (
    <div className="space-y-4">

      {/* ── Wizard modal ──────────────────────────────────────────────────── */}
      {showWizard && (
        <RecordWizard
          currentUser={currentUser}
          projects={projects}
          members={members}
          existingRecords={records}
          locale={locale}
          returnTo={returnTo}
          dictionary={dictionary}
          onClose={() => setShowWizard(false)}
        />
      )}

      {/* ── Error banner ──────────────────────────────────────────────────── */}
      {errorBanner && (
        <div className="flex items-start justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <div className="flex items-start gap-2">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
            <span>{errorBanner}</span>
          </div>
          <button type="button" onClick={() => setErrorBanner(null)} className="shrink-0 text-rose-400 hover:text-rose-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── Evidence readiness ────────────────────────────────────────────── */}
      <div className="surface overflow-hidden rounded-lg bg-white">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Evidence workspace</p>
            <h3 className="mt-1 text-lg font-bold text-slate-900">Готовність доказової бази</h3>
            <p className="mt-1 text-sm text-slate-500">
              Перевіряй записи, файли, статус обробки та DOI-ready пакети перед звітами й open science.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowWizard(true)}
            className="inline-flex w-fit items-center gap-2 rounded-md bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Новий запис
          </button>
        </div>

        <div className="grid gap-4 p-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <EvidenceMetric
              icon={<CheckCircle2 className="h-4 w-4" />}
              label="Zenodo-ready"
              value={`${zenodoReadyCount}/${records.length}`}
              detail={`${readinessPct}% записів мають open/embargoed доступ, published-статус, файли, ліцензію й опис.`}
              tone={readinessPct >= 70 ? "emerald" : readinessPct > 0 ? "amber" : "slate"}
            />
            <EvidenceMetric
              icon={<Upload className="h-4 w-4" />}
              label="Файли"
              value={`${withFilesCount}/${records.length}`}
              detail={`${totalFiles} файлів, сумарно ${formatBytes(totalBytes)}.`}
              tone={withFilesCount > 0 ? "blue" : "slate"}
            />
            <EvidenceMetric
              icon={<Globe className="h-4 w-4" />}
              label="Open access"
              value={openAccessCount}
              detail={`${publishedProcessingCount} записів мають published-статус обробки.`}
              tone={openAccessCount > 0 ? "emerald" : "slate"}
            />
            <EvidenceMetric
              icon={<ExternalLink className="h-4 w-4" />}
              label="DOI / Zenodo"
              value={doiCount}
              detail={`${zenodoDraftCount} draft · ${zenodoPublishedCount} published на Zenodo.`}
              tone={doiCount > 0 || zenodoDraftCount > 0 ? "blue" : "slate"}
            />
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Quick filters</p>
              {hasFilters && (
                <button
                  type="button"
                  onClick={() => { setSearch(""); setFilterAccess([]); setFilterProc([]); setKindTab("all"); }}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-800"
                >
                  Скинути
                </button>
              )}
            </div>
            <div className="mt-3 grid gap-2">
              <button
                type="button"
                onClick={() => { setKindTab("all"); setFilterAccess(["open", "embargoed"]); setFilterProc(["published"]); }}
                className="flex items-center justify-between gap-3 rounded-md border border-emerald-200 bg-white px-3 py-2 text-left text-sm transition hover:bg-emerald-50"
              >
                <span className="font-semibold text-slate-800">Open science candidates</span>
                <span className="font-mono text-xs text-emerald-700">{zenodoReadyCount}</span>
              </button>
              <button
                type="button"
                onClick={() => { setKindTab("all"); setFilterAccess([]); setFilterProc(["raw", "processed", "analyzed"]); }}
                className="flex items-center justify-between gap-3 rounded-md border border-amber-200 bg-white px-3 py-2 text-left text-sm transition hover:bg-amber-50"
              >
                <span className="font-semibold text-slate-800">Потребують обробки</span>
                <span className="font-mono text-xs text-amber-700">{records.length - publishedProcessingCount}</span>
              </button>
              <button
                type="button"
                onClick={() => { setKindTab("all"); setFilterAccess(["restricted", "internal"]); setFilterProc([]); }}
                className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-white px-3 py-2 text-left text-sm transition hover:bg-slate-100"
              >
                <span className="font-semibold text-slate-800">Internal / restricted</span>
                <span className="font-mono text-xs text-slate-600">{records.length - openAccessCount}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats tiles ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile icon={<FolderOpen className="h-4 w-4" />} label="Всього записів" value={records.length} color="blue" />
        <StatTile icon={<span className="text-sm">📝</span>} label="Чернетки" value={draftCount} color="slate" onClick={draftCount > 0 ? () => { setKindTab("all"); } : undefined} />
        <StatTile icon={<Globe className="h-4 w-4" />} label="Відкриті" value={publishedCount} color="emerald" />
        <StatTile icon={<FileArchive className="h-4 w-4" />} label="Файли / розмір" value={`${totalFiles} / ${formatBytes(totalBytes)}`} color="violet" />
      </div>

      {/* ── Kind tiles grid ───────────────────────────────────────────────── */}
      <div className="surface overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Типи записів</h3>
          <button
            type="button"
            onClick={() => setShowWizard(true)}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus className="h-3.5 w-3.5" />
            Новий запис
          </button>
        </div>

        {/* "All" tile + kind tiles grouped by category */}
        <div className="space-y-3 p-4">
          {/* All tile */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setKindTab("all")}
              className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2 text-xs font-semibold transition ${
                kindTab === "all"
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <span>📂</span>
              Всі
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${kindTab === "all" ? "bg-blue-200 text-blue-800" : "bg-slate-100 text-slate-500"}`}>
                {kindCounts.all ?? 0}
              </span>
            </button>
          </div>

          {/* Kind tiles by group */}
          {kindsByGroup.map(({ group, kinds }) => {
            const groupKindsWithRecords = kinds.filter((k) => (kindCounts[k] ?? 0) > 0);
            if (groupKindsWithRecords.length === 0) return null;
            return (
              <div key={group.id}>
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">{group.uk}</p>
                <div className="flex flex-wrap gap-1.5">
                  {kinds.map((k) => {
                    const cfg = KIND_CONFIGS[k];
                    if (!cfg) return null;
                    const count = kindCounts[k] ?? 0;
                    const isSelected = kindTab === k;
                    const colorMap: Record<string, string> = {
                      indigo: "border-indigo-300 bg-indigo-50 text-indigo-700 hover:border-indigo-400",
                      purple: "border-purple-300 bg-purple-50 text-purple-700 hover:border-purple-400",
                      blue:   "border-blue-300 bg-blue-50 text-blue-700 hover:border-blue-400",
                      sky:    "border-sky-300 bg-sky-50 text-sky-700 hover:border-sky-400",
                      amber:  "border-amber-300 bg-amber-50 text-amber-700 hover:border-amber-400",
                      rose:   "border-rose-300 bg-rose-50 text-rose-700 hover:border-rose-400",
                      emerald:"border-emerald-300 bg-emerald-50 text-emerald-700 hover:border-emerald-400",
                      violet: "border-violet-300 bg-violet-50 text-violet-700 hover:border-violet-400",
                      orange: "border-orange-300 bg-orange-50 text-orange-700 hover:border-orange-400",
                    };
                    const cls = colorMap[cfg.color] ?? "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300";
                    return (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setKindTab(isSelected ? "all" : k)}
                        className={`flex items-center gap-1.5 rounded-lg border-2 px-2.5 py-1.5 text-xs font-medium transition ${
                          isSelected ? `${cls} ring-2 ring-offset-1 ring-current` : count === 0 ? "border-slate-100 bg-slate-50 text-slate-300 cursor-default" : cls
                        }`}
                        disabled={count === 0}
                      >
                        <span>{cfg.icon}</span>
                        <span>{cfg.labelUk}</span>
                        {count > 0 && (
                          <span className={`rounded-full px-1.5 text-[10px] font-bold ${isSelected ? "bg-white/60" : "bg-white/80"}`}>{count}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Archive toggle */}
        {archivedRecords.length > 0 && (
          <div className="border-t border-slate-100 px-4 py-2.5">
            <button
              type="button"
              onClick={() => setShowArchived((v) => !v)}
              className="flex items-center gap-1.5 text-xs text-amber-600 transition hover:text-amber-800"
            >
              <Archive className="h-3.5 w-3.5" />
              {showArchived ? "Приховати архів" : `Показати архів (${archivedRecords.length})`}
              <ChevronDown className={`h-3.5 w-3.5 transition ${showArchived ? "rotate-180" : ""}`} />
            </button>
          </div>
        )}
      </div>

      {/* ── Toolbar ───────────────────────────────────────────────────────── */}
      <div className="surface flex flex-wrap items-center gap-2 px-4 py-3">
        {/* Search */}
        <div className="flex min-w-[180px] flex-1 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-200">
          <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <input
            type="text"
            placeholder="Пошук по назві, ID, тегах..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-slate-800 placeholder-slate-400 outline-none"
          />
          {search && (
            <button type="button" onClick={() => setSearch("")} className="text-slate-400 hover:text-slate-600">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Access filter */}
        <div className="flex items-center gap-1">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          {["internal", "open", "embargoed", "restricted"].map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => toggleFilter(setFilterAccess, a)}
              className={`rounded border px-2 py-1 text-[10px] font-medium transition ${
                filterAccess.includes(a) ? ACCESS_COLORS[a] : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
              }`}
            >
              {ACCESS_LABELS[a]}
            </button>
          ))}
        </div>

        {/* Processing filter */}
        <div className="flex items-center gap-1.5">
          {PROCESSING_STEPS.map((step) => (
            <button
              key={step.key}
              type="button"
              onClick={() => toggleFilter(setFilterProc, step.key)}
              title={step.label}
              className={`h-5 w-5 rounded-full border-2 transition ${
                filterProc.includes(step.key)
                  ? `border-transparent ${PROCESSING_COLORS[step.key]} ring-2 ring-offset-1 ring-blue-300`
                  : "border-slate-300 bg-white hover:border-slate-400"
              }`}
            />
          ))}
        </div>

        {/* Clear filters */}
        {hasFilters && (
          <button
            type="button"
            onClick={() => { setSearch(""); setFilterAccess([]); setFilterProc([]); }}
            className="flex items-center gap-1 rounded border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-medium text-rose-600 transition hover:bg-rose-100"
          >
            <RotateCcw className="h-3 w-3" /> Скинути
          </button>
        )}

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (multiSelectMode) clearSelection();
              else setMultiSelectMode(true);
            }}
            className={`flex h-8 items-center gap-1.5 rounded border px-3 text-xs font-semibold transition ${
              multiSelectMode
                ? "border-blue-600 bg-blue-600 text-white shadow-sm shadow-blue-200"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            <CheckCircle2 className="h-4 w-4" />
            {multiSelectMode ? "Готово" : "Вибрати"}
          </button>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 outline-none focus:border-blue-300"
          >
            <option value="newest">Новіші</option>
            <option value="oldest">Старіші</option>
            <option value="title">Назва A-Я</option>
            <option value="files">Більше файлів</option>
            <option value="size">Більший розмір</option>
          </select>

          {view === "cluster" && (
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as GroupBy)}
              className="rounded border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 outline-none focus:border-blue-300"
            >
              <option value="group">За групою</option>
              <option value="kind">За типом</option>
              <option value="stage">За етапом</option>
              <option value="month">За місяцем</option>
              <option value="processingStatus">За стадією обробки</option>
              <option value="access">За доступом</option>
            </select>
          )}

          <div className="flex overflow-hidden rounded-md border border-slate-200 bg-white">
            {([
              { mode: "grid", icon: <Grid3X3 className="h-3.5 w-3.5" />, title: "Сітка" },
              { mode: "list", icon: <List className="h-3.5 w-3.5" />, title: "Список" },
              { mode: "timeline", icon: <GanttChart className="h-3.5 w-3.5" />, title: "Хронологія" },
              { mode: "cluster", icon: <Layers className="h-3.5 w-3.5" />, title: "Кластери" },
            ] as const).map(({ mode, icon, title }) => (
              <button
                key={mode}
                type="button"
                title={title}
                onClick={() => setView(mode as ViewMode)}
                className={`flex h-7 w-8 items-center justify-center transition ${view === mode ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-slate-100"}`}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results count */}
      {hasFilters && !multiSelectMode && (
        <p className="text-xs text-slate-500">
          Знайдено {filtered.length} з {kindTab === "all" ? records.length : (kindCounts[kindTab] ?? 0)} записів
        </p>
      )}

      {/* Multi-select Batch Actions */}
      {multiSelectMode && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 shadow-sm">
          <p className="text-sm font-semibold text-blue-900">
            Вибрано {selectedIds.size} записів
          </p>
          <button type="button" onClick={selectAll} className="text-xs font-medium text-blue-700 hover:text-blue-900 underline underline-offset-2">Вибрати всі {filtered.length}</button>
          <button type="button" onClick={() => setSelectedIds(new Set())} className="text-xs font-medium text-blue-700 hover:text-blue-900 underline underline-offset-2">Очистити вибір</button>
          <div className="ml-auto flex gap-2">
            <button
              type="button"
              disabled={selectedIds.size === 0}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 disabled:shadow-none"
            >
              <Download className="h-3.5 w-3.5" />
              Експорт (CSV)
            </button>
            <button
              type="button"
              disabled={selectedIds.size === 0}
              className="inline-flex items-center gap-1.5 rounded-md border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 shadow-sm transition hover:bg-amber-100 disabled:opacity-50 disabled:shadow-none"
            >
              <Archive className="h-3.5 w-3.5" />
              В архів
            </button>
          </div>
        </div>
      )}

      {/* ── Views ─────────────────────────────────────────────────────────── */}

      {filtered.length === 0 && (
        <div className="surface px-6 py-14 text-center">
          {records.length === 0 ? (
            <>
              <span className="text-4xl">📂</span>
              <p className="mt-3 text-sm font-semibold text-slate-700">Записів поки немає</p>
              <p className="mt-1 text-xs text-slate-400">Натисніть «+ Новий запис» вгорі сторінки, щоб додати перший.</p>
            </>
          ) : hasFilters ? (
            <>
              <span className="text-4xl">🔍</span>
              <p className="mt-3 text-sm font-semibold text-slate-700">Жоден запис не відповідає фільтрам</p>
              <p className="mt-1 text-xs text-slate-400">Спробуйте змінити умови пошуку або скинути фільтри.</p>
            </>
          ) : (
            <>
              <span className="text-4xl">📋</span>
              <p className="mt-3 text-sm font-semibold text-slate-700">Немає записів у цій категорії</p>
              <p className="mt-1 text-xs text-slate-400">Оберіть інший тип або перейдіть до «Всі».</p>
            </>
          )}
        </div>
      )}

      {view === "grid" && filtered.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((r) => (
            <RecordCard
              key={r._id ?? r.localId}
              record={r}
              members={members}
              onOpen={openRecord}
              multiSelectMode={multiSelectMode}
              isSelected={r._id ? selectedIds.has(r._id) : false}
              onToggleSelect={toggleSelectRecord}
            />
          ))}
        </div>
      )}

      {view === "list" && filtered.length > 0 && (
        <div className="surface overflow-hidden">
          <div className="hidden border-b border-slate-100 bg-slate-50 px-4 py-2 sm:flex items-center gap-3 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            {multiSelectMode && <div className="w-4 shrink-0" />}
            <span className="w-14 shrink-0">Тип</span>
            <span className="flex-1">Назва / ID / Автор</span>
            <span className="hidden w-24 shrink-0 sm:block">Обробка</span>
            <span className="hidden w-14 shrink-0 sm:block">Доступ</span>
            <span className="w-6 shrink-0">Ф.</span>
            <span className="w-20 shrink-0">Дата</span>
          </div>
          {filtered.map((r) => (
            <RecordRow
              key={r._id ?? r.localId}
              record={r}
              members={members}
              onOpen={openRecord}
              multiSelectMode={multiSelectMode}
              isSelected={r._id ? selectedIds.has(r._id) : false}
              onToggleSelect={toggleSelectRecord}
            />
          ))}
        </div>
      )}

      {view === "timeline" && filtered.length > 0 && (
        <div className="surface px-5 py-5">
          {(() => {
            let lastMonth = "";
            return filtered.map((r) => {
              const month = recordMonth(r);
              const showMonth = month !== lastMonth;
              if (showMonth) lastMonth = month;
              return (
                <TimelineEntry
                  key={r._id ?? r.localId}
                  record={r}
                  showMonth={showMonth}
                  month={recordMonthLabel(r)}
                  onOpen={openRecord}
                  multiSelectMode={multiSelectMode}
                  isSelected={r._id ? selectedIds.has(r._id) : false}
                  onToggleSelect={toggleSelectRecord}
                />
              );
            });
          })()}
        </div>
      )}

      {view === "cluster" && filtered.length > 0 && (
        <div className="surface overflow-hidden">
          {grouped.map(({ name, items, bytes, fileCount }) => (
            <details key={name} open>
              <summary className="cursor-pointer list-none">
                <GroupHeader title={name} count={items.length} bytes={bytes} fileCount={fileCount} />
              </summary>
              <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((r) => (
                  <RecordCard
                    key={r._id ?? r.localId}
                    record={r}
                    members={members}
                    onOpen={openRecord}
                    multiSelectMode={multiSelectMode}
                    isSelected={r._id ? selectedIds.has(r._id) : false}
                    onToggleSelect={toggleSelectRecord}
                  />
                ))}
              </div>
            </details>
          ))}
        </div>
      )}

      {/* Detail panel */}
      {selectedRecord && (
        <DetailPanel
          record={selectedRecord}
          publications={publications}
          openScienceUpdates={openScienceUpdates}
          allRecords={allRecords}
          members={members}
          locale={locale}
          returnTo={returnTo}
          onClose={closeDetail}
          onSelectRecord={openRecord}
        />
      )}
    </div>
  );
}
