"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Database,
  Download,
  FileJson,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import { LiquidCard } from "@/components/ui/liquid";

// ── Blank templates (empty fields, correct structure) ────────────────────────

const BLANK_ADMINS = [
  { position: "", fullName: "", title: "", phone: "", email: "", orderIndex: 0 },
];

const BLANK_UNITS = [
  { type: "faculty", name: "", shortName: "", head: "", headEmail: "", description: "", orderIndex: 0 },
];

const BLANK_MEMBERS = [
  {
    fullName: "", email: "", phone: "",
    role: "lecturer",
    staffCategory: "teaching",
    title: "", position: "", orcid: "",
    isActive: true, hiredAt: "",
  },
];

const BLANK_PROGRAMS = [
  {
    title: "", code: "", specialty: "",
    level: "bachelor",
    academicYear: "",
    ects: 240, durationYears: 4,
    language: "uk",
    description: "",
  },
];

const BLANK_COURSES = [
  {
    title: "", code: "",
    courseType: "mandatory",
    ects: 3, hoursTotal: 90,
    semester: 1, year: 1,
    language: "uk",
    description: "",
  },
];

const BLANK_BACKUP = {
  version: "1.0",
  admins: BLANK_ADMINS,
  units: BLANK_UNITS,
  members: BLANK_MEMBERS,
  programs: BLANK_PROGRAMS,
  courses: BLANK_COURSES,
};

// ── Sample JSON data ─────────────────────────────────────────────────────────

const SAMPLE_UNITS = [
  { type: "faculty",    name: "Факультет природничих наук", shortName: "ФПН", head: "Іваненко Іван Іванович", headEmail: "dean@inst.ua", orderIndex: 1 },
  { type: "department", name: "Кафедра молекулярної біології", shortName: "КМБ", head: "Петренко Ольга Сергіївна", headEmail: "o.petrenko@inst.ua", orderIndex: 1 },
  { type: "lab",        name: "Лабораторія клітинної сигналізації", shortName: "ЛКС", head: "Коваль Дмитро Михайлович", description: "Дослідження внутрішньоклітинних сигнальних каскадів", orderIndex: 1 },
];

const SAMPLE_MEMBERS = [
  { fullName: "Іваненко Іван Іванович",   email: "i.ivanenko@inst.ua",  role: "professor",  staffCategory: "teaching",   title: "д.б.н., проф.", position: "Завідувач кафедри",        orcid: "0000-0001-2345-6789", isActive: true },
  { fullName: "Петренко Ольга Сергіївна", email: "o.petrenko@inst.ua",  role: "associate",  staffCategory: "teaching",   title: "к.б.н., доц.",  position: "Доцент кафедри",           orcid: "",                    isActive: true },
  { fullName: "Сидоренко Микола Юрійович",email: "m.sydorenko@inst.ua", role: "researcher", staffCategory: "research",   title: "к.б.н.",        position: "Науковий співробітник",    orcid: "",                    isActive: true },
  { fullName: "Коваль Тетяна Василівна",  email: "t.koval@inst.ua",     role: "dean",       staffCategory: "leadership", title: "д.мед.н.",      position: "Декан факультету",         orcid: "",                    isActive: true },
];

const SAMPLE_PROGRAMS = [
  { code: "091-PhD", title: "Біологія", specialty: "091 — Біологія", level: "phd",    academicYear: "2024-2025", ects: 60,  durationYears: 4,   language: "uk", description: "Аспірантська програма з біологічних наук" },
  { code: "091-PhD", title: "Біологія", specialty: "091 — Біологія", level: "phd",    academicYear: "2023-2024", ects: 60,  durationYears: 4,   language: "uk", description: "Попередня версія програми" },
  { code: "091-MSC", title: "Молекулярна біологія та біохімія",       level: "master", academicYear: "2024-2025", ects: 90,  durationYears: 1.5, language: "uk" },
  { code: "222-PhD", title: "Медицина",  specialty: "222 — Медицина", level: "phd",    ects: 60,  durationYears: 4, language: "uk" },
];

const SAMPLE_COURSES = [
  { code: "BIO-101", title: "Загальна біологія клітини",     courseType: "mandatory", ects: 5, hoursTotal: 150, semester: 1, year: 1, language: "uk" },
  { code: "BIO-203", title: "Молекулярна генетика",          courseType: "mandatory", ects: 4, hoursTotal: 120, semester: 3, year: 2, language: "uk" },
  { code: "BIO-301", title: "Методи наукових досліджень",    courseType: "practice",  ects: 6, hoursTotal: 180, semester: 5, year: 3, language: "uk" },
];

const SAMPLE_ADMINS = [
  { position: "Директор інституту",                         fullName: "Веселовський Микола Сергійович",  title: "академік НАН України, доктор біологічних наук", phone: "+380442562400", email: "director@inst.ua", orderIndex: 0 },
  { position: "Заступник директора з наукової роботи",      fullName: "Лук'янець Олена Олександрівна",   title: "член-кор. НАН України, д.б.н.",                 phone: "+380442562525", email: "deputy1@inst.ua", orderIndex: 1 },
  { position: "Заступник директора з науково-технічних питань", fullName: "Максимюк Олександр Петрович", title: "кандидат біологічних наук",                     phone: "+380442562403", email: "deputy2@inst.ua", orderIndex: 2 },
  { position: "Вчений секретар",                            fullName: "Шиш Анжела Михайлівна",           title: "кандидат біологічних наук",                     phone: "+380442562034", email: "secretary@inst.ua", orderIndex: 3 },
  { position: "Радник дирекції",                            fullName: "Кришталь Олег Олександрович",    title: "академік НАН України, д.б.н.",                  phone: "+380442562524", email: "advisor@inst.ua",  orderIndex: 4 },
];

const SAMPLE_BACKUP = {
  version: "1.0",
  exportedAt: new Date().toISOString(),
  institution: { name: "Назва закладу", shortName: "НЗ" },
  admins: SAMPLE_ADMINS,
  units: SAMPLE_UNITS,
  members: SAMPLE_MEMBERS,
  programs: SAMPLE_PROGRAMS,
  courses: SAMPLE_COURSES,
};

// ── Tab config ───────────────────────────────────────────────────────────────

type EntityType = "admins" | "units" | "members" | "programs" | "courses" | "backup";

type TabConfig = {
  id: EntityType;
  label: { uk: string; en: string };
  hint: { uk: string; en: string };
  sample: unknown;
  blank: unknown;
  previewKeys: string[];
  previewLabels: { uk: string[]; en: string[] };
};

const TABS: TabConfig[] = [
  {
    id: "admins",
    label: { uk: "Адміністрація", en: "Administration" },
    hint: { uk: "Директорат, заступники, вчений секретар", en: "Director, deputies, scientific secretary" },
    sample: SAMPLE_ADMINS,
    blank: BLANK_ADMINS,
    previewKeys: ["position", "fullName", "title"],
    previewLabels: { uk: ["Посада", "ПІБ", "Ступінь/звання"], en: ["Position", "Name", "Degree"] },
  },
  {
    id: "units",
    label: { uk: "Структура", en: "Structure" },
    hint: { uk: "Факультети, кафедри, відділи, лабораторії", en: "Faculties, departments, divisions, labs" },
    sample: SAMPLE_UNITS,
    blank: BLANK_UNITS,
    previewKeys: ["name", "type", "head"],
    previewLabels: { uk: ["Назва", "Тип", "Керівник"], en: ["Name", "Type", "Head"] },
  },
  {
    id: "members",
    label: { uk: "Працівники", en: "Staff" },
    hint: { uk: "Науково-педагогічний склад та персонал", en: "Academic staff and personnel" },
    sample: SAMPLE_MEMBERS,
    blank: BLANK_MEMBERS,
    previewKeys: ["fullName", "role", "email"],
    previewLabels: { uk: ["ПІБ", "Роль", "Email"], en: ["Full name", "Role", "Email"] },
  },
  {
    id: "programs",
    label: { uk: "Програми", en: "Programs" },
    hint: { uk: "Освітні та наукові програми", en: "Educational and research programs" },
    sample: SAMPLE_PROGRAMS,
    blank: BLANK_PROGRAMS,
    previewKeys: ["title", "level", "ects"],
    previewLabels: { uk: ["Назва", "Рівень", "ECTS"], en: ["Title", "Level", "ECTS"] },
  },
  {
    id: "courses",
    label: { uk: "Курси", en: "Courses" },
    hint: { uk: "Каталог навчальних дисциплін", en: "Course catalog / disciplines" },
    sample: SAMPLE_COURSES,
    blank: BLANK_COURSES,
    previewKeys: ["title", "courseType", "ects"],
    previewLabels: { uk: ["Назва", "Тип", "ECTS"], en: ["Title", "Type", "ECTS"] },
  },
  {
    id: "backup",
    label: { uk: "Повний бекап", en: "Full backup" },
    hint: { uk: "Усі дані одним файлом (структура + адміністрація + працівники + програми + курси)", en: "All data in one file (units + admins + staff + programs + courses)" },
    sample: SAMPLE_BACKUP,
    blank: BLANK_BACKUP,
    previewKeys: [],
    previewLabels: { uk: [], en: [] },
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function downloadJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function formatCount(n: number, isUk: boolean) {
  if (isUk) {
    if (n % 100 >= 11 && n % 100 <= 14) return `${n} записів`;
    if (n % 10 === 1) return `${n} запис`;
    if (n % 10 >= 2 && n % 10 <= 4) return `${n} записи`;
    return `${n} записів`;
  }
  return `${n} record${n === 1 ? "" : "s"}`;
}

// ── Main component ───────────────────────────────────────────────────────────

export function ImportClient({
  locale,
  institutionName,
  counts,
}: {
  locale: "uk" | "en";
  institutionName: string;
  counts: { units: number; members: number; programs: number; courses: number };
}) {
  const isUk = locale === "uk";
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<EntityType>("units");

  const tab = TABS.find((t) => t.id === activeTab)!;

  return (
    <div className="space-y-4">
      {/* ── Header ──────────────────────────────────────────── */}
      <LiquidCard className="overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-br from-slate-50/70 via-white to-emerald-50/40 px-5 py-4">
          <div>
            <p className="liquid-eyebrow text-slate-600">
              {isUk ? "Міграція даних" : "Data migration"}
            </p>
            <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-900">
              {institutionName}
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              {isUk
                ? "Імпорт та експорт даних у форматі JSON"
                : "Import and export data in JSON format"}
            </p>
          </div>
          <div className="flex items-center gap-1.5 rounded-xl bg-slate-100/60 px-3 py-2 text-xs text-slate-500">
            <Database className="h-3.5 w-3.5 text-emerald-600" />
            <span>{counts.units + counts.members + counts.programs + counts.courses} {isUk ? "записів всього" : "records total"}</span>
          </div>
        </div>
      </LiquidCard>

      {/* ── Tab navigation ───────────────────────────────────── */}
      <div className="flex flex-wrap gap-1.5">
        {TABS.map((t) => {
          const count = t.id !== "backup" ? counts[t.id as keyof typeof counts] : null;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                activeTab === t.id
                  ? "bg-emerald-500 text-white shadow"
                  : "bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {isUk ? t.label.uk : t.label.en}
              {count !== null && (
                <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                  activeTab === t.id ? "bg-white/25 text-white" : "bg-slate-100 text-slate-500"
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Tab hint ─────────────────────────────────────────── */}
      <p className="text-xs text-slate-500">{isUk ? tab.hint.uk : tab.hint.en}</p>

      {/* ── Panels ───────────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ExportPanel tab={tab} counts={counts} locale={locale} />
        <ImportPanel tab={tab} locale={locale} onSuccess={() => router.refresh()} />
      </div>

      {/* ── Format reference ─────────────────────────────────── */}
      <SchemaReference tab={tab} locale={locale} />
    </div>
  );
}

// ── Export panel ─────────────────────────────────────────────────────────────

function ExportPanel({
  tab,
  counts,
  locale,
}: {
  tab: TabConfig;
  counts: { units: number; members: number; programs: number; courses: number };
  locale: "uk" | "en";
}) {
  const isUk = locale === "uk";
  const [loading, setLoading] = useState(false);

  const count = tab.id !== "backup" ? counts[tab.id as keyof typeof counts] : null;
  const total = Object.values(counts).reduce((s, v) => s + v, 0);

  async function exportData() {
    setLoading(true);
    try {
      const url = tab.id === "backup"
        ? "/api/institution/export?type=all"
        : `/api/institution/export?type=${tab.id}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const filename = disposition.match(/filename="([^"]+)"/)?.[1] ?? `${tab.id}.json`;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
    } finally {
      setLoading(false);
    }
  }

  const recordCount = tab.id === "backup" ? total : (count ?? 0);

  return (
    <LiquidCard className="flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
          <Download className="h-4 w-4 text-emerald-600" />
        </div>
        <div>
          <h2 className="font-bold text-slate-900">
            {isUk ? "Експорт" : "Export"}
          </h2>
          <p className="text-xs text-slate-500">
            {isUk ? "Завантажте поточні дані у форматі JSON" : "Download current data as JSON"}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200/70 bg-slate-50/40 px-4 py-3">
        <p className="text-2xl font-bold text-slate-900">{recordCount}</p>
        <p className="text-xs text-slate-500">
          {tab.id === "backup"
            ? (isUk ? "записів у базі (всі категорії)" : "total records (all categories)")
            : (isUk ? `записів у категорії «${tab.label.uk}»` : `${tab.label.en} records in database`)}
        </p>
        {tab.id === "backup" && (
          <div className="mt-2 flex flex-wrap gap-2">
            {(["units", "members", "programs", "courses"] as const).map((k) => (
              <span key={k} className="rounded-md bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600 shadow-sm">
                {k}: {counts[k]}
              </span>
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={exportData}
        disabled={loading || recordCount === 0}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600 disabled:opacity-50"
      >
        {loading
          ? <Loader2 className="h-4 w-4 animate-spin" />
          : <Download className="h-4 w-4" />}
        {isUk ? "Скачати JSON" : "Download JSON"}
      </button>

      {recordCount === 0 && (
        <p className="text-center text-xs text-slate-400">
          {isUk ? "Немає даних для експорту" : "No data to export"}
        </p>
      )}
    </LiquidCard>
  );
}

// ── Import panel ─────────────────────────────────────────────────────────────

type ImportResult =
  | { type: "single"; created: number; errors: { index: number; message: string }[]; total: number }
  | { type: "backup"; totalCreated: number; totalErrors: number; results: Record<string, { created: number; errors: unknown[] }> };

function ImportPanel({
  tab,
  locale,
  onSuccess,
}: {
  tab: TabConfig;
  locale: "uk" | "en";
  onSuccess: () => void;
}) {
  const isUk = locale === "uk";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<unknown[] | null>(null);
  const [parsedBackup, setParsedBackup] = useState<Record<string, unknown[]> | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  function reset() {
    setFile(null);
    setParsed(null);
    setParsedBackup(null);
    setParseError(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const processFile = useCallback(
    (f: File) => {
      if (!f.name.endsWith(".json")) {
        setParseError(isUk ? "Будь ласка, оберіть JSON-файл" : "Please select a JSON file");
        return;
      }
      setFile(f);
      setResult(null);
      setParseError(null);

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target?.result as string);

          if (tab.id === "backup") {
            // Detect full backup
            if (typeof json === "object" && json !== null && !Array.isArray(json)) {
              const b = json as Record<string, unknown>;
              const sections: Record<string, unknown[]> = {};
              for (const k of ["units", "members", "programs", "courses"]) {
                sections[k] = Array.isArray(b[k]) ? (b[k] as unknown[]) : [];
              }
              setParsedBackup(sections);
              setParsed(null);
            } else {
              setParseError(isUk ? "Очікується об'єкт резервної копії {version, units, …}" : "Expected backup object {version, units, …}");
            }
          } else {
            if (!Array.isArray(json)) {
              setParseError(isUk ? "Файл повинен містити масив JSON [ { … }, … ]" : "File must contain a JSON array [ { … }, … ]");
              return;
            }
            if (json.length === 0) {
              setParseError(isUk ? "Файл порожній (0 записів)" : "File is empty (0 records)");
              return;
            }
            if (json.length > 500) {
              setParseError(isUk ? "Максимум 500 записів за один імпорт" : "Max 500 records per import");
              return;
            }
            setParsed(json);
            setParsedBackup(null);
          }
        } catch {
          setParseError(isUk ? "Помилка читання JSON. Перевірте формат файлу." : "JSON parse error. Check the file format.");
        }
      };
      reader.readAsText(f);
    },
    [tab.id, isUk],
  );

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) processFile(f);
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) processFile(f);
  }

  async function runImport() {
    if ((!parsed && !parsedBackup) || importing) return;
    setImporting(true);
    setResult(null);

    try {
      if (tab.id === "backup" && parsedBackup) {
        const res = await fetch("/api/institution/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "backup", data: parsedBackup }),
        });
        const data = await res.json();
        setResult({ type: "backup", ...data });
        if (data.totalCreated > 0) onSuccess();
      } else if (parsed) {
        const res = await fetch("/api/institution/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: tab.id, data: parsed }),
        });
        const data = await res.json();
        setResult({ type: "single", ...data });
        if (data.created > 0) onSuccess();
      }
    } finally {
      setImporting(false);
    }
  }

  const totalBackupCount = parsedBackup
    ? Object.values(parsedBackup).reduce((s, arr) => s + arr.length, 0)
    : 0;

  return (
    <LiquidCard className="flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100">
          <Upload className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <h2 className="font-bold text-slate-900">
            {isUk ? "Імпорт" : "Import"}
          </h2>
          <p className="text-xs text-slate-500">
            {isUk ? "Завантажте JSON-файл з даними" : "Upload a JSON file with data"}
          </p>
        </div>
      </div>

      {/* Drop zone */}
      {!file ? (
        <div
          onDrop={onDrop}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onClick={() => fileInputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 transition ${
            dragging
              ? "border-blue-400 bg-blue-50"
              : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
          }`}
        >
          <FileJson className="h-8 w-8 text-slate-300" />
          <p className="text-center text-sm font-semibold text-slate-600">
            {isUk ? "Перетягніть JSON-файл сюди" : "Drop JSON file here"}
          </p>
          <p className="text-xs text-slate-400">
            {isUk ? "або натисніть щоб вибрати" : "or click to browse"}
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={onFileChange}
          />
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <FileJson className="h-4 w-4 shrink-0 text-blue-500" />
          <span className="flex-1 truncate text-xs font-semibold text-slate-700">{file.name}</span>
          <button type="button" onClick={reset} className="rounded p-1 text-slate-400 hover:text-slate-600">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Parse error */}
      {parseError && (
        <div className="flex gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-700">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>{parseError}</span>
        </div>
      )}

      {/* Preview */}
      {parsed && parsed.length > 0 && tab.previewKeys.length > 0 && (
        <PreviewTable rows={parsed} tab={tab} locale={locale} />
      )}

      {parsedBackup && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3 text-xs">
          <p className="mb-2 font-bold text-blue-800">{isUk ? "Вміст бекапу:" : "Backup contents:"}</p>
          <div className="grid grid-cols-2 gap-1.5">
            {(["units", "members", "programs", "courses"] as const).map((k) => {
              const labels = { uk: { units: "Структура", members: "Викладачі", programs: "Програми", courses: "Курси" }, en: { units: "Units", members: "Members", programs: "Programs", courses: "Courses" } };
              return (
                <div key={k} className="flex items-center justify-between rounded-md bg-white px-2 py-1">
                  <span className="text-slate-600">{isUk ? labels.uk[k] : labels.en[k]}</span>
                  <span className="font-bold text-slate-900">{parsedBackup[k]?.length ?? 0}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Template + sample downloads */}
      <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3">
        <button
          type="button"
          onClick={() => downloadJson(tab.blank, `template-${tab.id}.json`)}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100"
        >
          <Download className="h-3.5 w-3.5" />
          {isUk ? "Порожній бланк" : "Blank template"}
        </button>
        <button
          type="button"
          onClick={() => downloadJson(tab.sample, `sample-${tab.id}.json`)}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-700"
        >
          <FileJson className="h-3.5 w-3.5" />
          {isUk ? "Зразок із даними" : "Sample with data"}
        </button>
      </div>

      {/* Import button */}
      {(parsed || parsedBackup) && !parseError && (
        <button
          type="button"
          onClick={runImport}
          disabled={importing}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
        >
          {importing
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <Upload className="h-4 w-4" />}
          {isUk
            ? `Імпортувати ${formatCount(tab.id === "backup" ? totalBackupCount : (parsed?.length ?? 0), true)}`
            : `Import ${formatCount(tab.id === "backup" ? totalBackupCount : (parsed?.length ?? 0), false)}`}
        </button>
      )}

      {/* Result */}
      {result && <ImportResult result={result} locale={locale} onReset={reset} />}
    </LiquidCard>
  );
}

// ── Preview table ─────────────────────────────────────────────────────────────

function PreviewTable({
  rows,
  tab,
  locale,
}: {
  rows: unknown[];
  tab: TabConfig;
  locale: "uk" | "en";
}) {
  const isUk = locale === "uk";
  const preview = rows.slice(0, 4);
  const labels = isUk ? tab.previewLabels.uk : tab.previewLabels.en;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <div className="border-b border-slate-200 bg-slate-50/60 px-3 py-1.5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
          {isUk ? `Попередній перегляд — ${rows.length} записів` : `Preview — ${rows.length} records`}
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead>
            <tr className="border-b border-slate-100">
              {labels.map((l) => (
                <th key={l} className="px-3 py-1.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {l}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {preview.map((row, i) => (
              <tr key={i} className="border-b border-slate-100/60 last:border-0">
                {tab.previewKeys.map((k) => (
                  <td key={k} className="max-w-[160px] truncate px-3 py-1.5 text-slate-700">
                    {String((row as Record<string, unknown>)[k] ?? "—")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length > 4 && (
          <p className="border-t border-slate-100 px-3 py-1.5 text-[10px] text-slate-400">
            {isUk ? `… і ще ${rows.length - 4} записів` : `… and ${rows.length - 4} more`}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Import result ─────────────────────────────────────────────────────────────

function ImportResult({
  result,
  locale,
  onReset,
}: {
  result: ImportResult;
  locale: "uk" | "en";
  onReset: () => void;
}) {
  const isUk = locale === "uk";
  const [showErrors, setShowErrors] = useState(false);

  const { success, errorCount, errors } = (() => {
    if (result.type === "single") {
      return {
        success: result.created,
        errorCount: result.errors.length,
        errors: result.errors,
      };
    }
    return {
      success: result.totalCreated,
      errorCount: result.totalErrors,
      errors: [] as { index: number; message: string }[],
    };
  })();

  return (
    <div className={`rounded-xl border p-3 ${
      errorCount === 0
        ? "border-emerald-200 bg-emerald-50/60"
        : success === 0
        ? "border-rose-200 bg-rose-50/60"
        : "border-amber-200 bg-amber-50/60"
    }`}>
      <div className="flex items-start gap-2">
        {errorCount === 0
          ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
          : <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />}
        <div className="flex-1">
          <p className="text-sm font-bold text-slate-900">
            {isUk
              ? `Імпортовано ${success} ${success !== 1 ? "записів" : "запис"}`
              : `Imported ${success} ${success !== 1 ? "records" : "record"}`}
            {errorCount > 0 && (
              <span className="ml-1 text-amber-700">
                ({isUk ? `${errorCount} помилок` : `${errorCount} errors`})
              </span>
            )}
          </p>

          {result.type === "backup" && (
            <div className="mt-1.5 grid grid-cols-2 gap-1">
              {Object.entries(result.results).map(([k, r]) => (
                <p key={k} className="text-[10px] text-slate-600">
                  {k}: +{r.created}
                  {r.errors.length > 0 && ` (${r.errors.length} err)`}
                </p>
              ))}
            </div>
          )}

          {errors.length > 0 && (
            <button
              type="button"
              onClick={() => setShowErrors((s) => !s)}
              className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-amber-700"
            >
              {showErrors ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              {isUk ? "Показати помилки" : "Show errors"}
            </button>
          )}

          {showErrors && errors.length > 0 && (
            <ul className="mt-2 space-y-1">
              {errors.slice(0, 10).map((e) => (
                <li key={e.index} className="text-[10px] text-rose-700">
                  #{e.index + 1}: {e.message}
                </li>
              ))}
              {errors.length > 10 && (
                <li className="text-[10px] text-slate-500">
                  {isUk ? `… і ще ${errors.length - 10} помилок` : `… and ${errors.length - 10} more`}
                </li>
              )}
            </ul>
          )}
        </div>
        <button type="button" onClick={onReset} className="rounded p-0.5 text-slate-400 hover:text-slate-600">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── Schema reference ──────────────────────────────────────────────────────────

const FIELD_DOCS: Record<EntityType, { field: string; type: string; required: boolean; note_uk: string }[]> = {
  admins: [
    { field: "position",   type: "string",  required: true,  note_uk: "Посада (Директор інституту, Заступник директора з наукової роботи, Вчений секретар…)" },
    { field: "fullName",   type: "string",  required: true,  note_uk: "ПІБ (Прізвище Ім'я По-батькові)" },
    { field: "title",      type: "string",  required: false, note_uk: "Науковий ступінь та звання (академік НАН України, д.б.н., проф.)" },
    { field: "phone",      type: "string",  required: false, note_uk: "Телефон у довільному форматі" },
    { field: "email",      type: "string",  required: false, note_uk: "Електронна пошта" },
    { field: "orderIndex", type: "number",  required: false, note_uk: "Порядок відображення: 0 = директор (велика картка), 1+ = інші (сітка)" },
  ],
  units: [
    { field: "name",        type: "string",  required: true,  note_uk: "Повна назва підрозділу" },
    { field: "type",        type: "enum",    required: false, note_uk: "faculty | institute | department | division | lab | sector | group | center | council | office | other" },
    { field: "shortName",   type: "string",  required: false, note_uk: "Скорочена назва (до 40 символів)" },
    { field: "head",        type: "string",  required: false, note_uk: "ПІБ керівника" },
    { field: "headEmail",   type: "string",  required: false, note_uk: "Email керівника" },
    { field: "description", type: "string",  required: false, note_uk: "Опис (до 2000 символів)" },
    { field: "orderIndex",  type: "number",  required: false, note_uk: "Порядок відображення (ціле число)" },
  ],
  members: [
    { field: "fullName",  type: "string",  required: true,  note_uk: "ПІБ (прізвище ім'я по-батькові)" },
    { field: "email",     type: "string",  required: false, note_uk: "Email для запрошення" },
    { field: "staffCategory", type: "enum",   required: false, note_uk: "Категорія: leadership | teaching | research | admin | other" },
    { field: "role",      type: "enum",    required: false, note_uk: "rector | vice_rector | dean | vice_dean | head | professor | associate | lecturer | assistant | researcher | staff | admin" },
    { field: "title",     type: "string",  required: false, note_uk: "Науковий ступінь / звання: д.б.н., к.мед.н., проф." },
    { field: "position",  type: "string",  required: false, note_uk: "Посада (повна назва)" },
    { field: "orcid",     type: "string",  required: false, note_uk: "ORCID iD у форматі 0000-0000-0000-0000" },
    { field: "phone",     type: "string",  required: false, note_uk: "Телефон" },
    { field: "isActive",  type: "boolean", required: false, note_uk: "true — діючий, false — архів (за замовчуванням true)" },
  ],
  programs: [
    { field: "title",         type: "string",  required: true,  note_uk: "Назва освітньої програми" },
    { field: "code",          type: "string",  required: false, note_uk: "Внутрішній код (напр. 091-PhD)" },
    { field: "specialty",     type: "string",  required: false, note_uk: "Спеціальність за класифікатором 1021 (напр. 091 — Біологія)" },
    { field: "level",         type: "enum",    required: false, note_uk: "bachelor | master | phd | post_doc | certificate" },
    { field: "academicYear",  type: "string",  required: false, note_uk: "Навчальний рік версії програми, напр. \"2024-2025\". Якщо програма змінюється щорічно — кожна версія окремим рядком з тим самим code/title." },
    { field: "ects",          type: "number",  required: false, note_uk: "Кредити ECTS (за замовчуванням 240)" },
    { field: "durationYears", type: "number",  required: false, note_uk: "Тривалість у роках (напр. 4 або 1.5)" },
    { field: "language",      type: "string",  required: false, note_uk: "uk | en | pl | de | fr | other" },
    { field: "description",   type: "string",  required: false, note_uk: "Опис програми" },
  ],
  courses: [
    { field: "title",      type: "string",  required: true,  note_uk: "Назва дисципліни" },
    { field: "code",       type: "string",  required: false, note_uk: "Код дисципліни (напр. BIO-101)" },
    { field: "courseType", type: "enum",    required: false, note_uk: "mandatory | elective | optional | language | physical | practice | research" },
    { field: "ects",       type: "number",  required: false, note_uk: "Кредити ECTS (за замовчуванням 3)" },
    { field: "hoursTotal", type: "number",  required: false, note_uk: "Загальна кількість годин" },
    { field: "semester",   type: "number",  required: false, note_uk: "Семестр (1–12)" },
    { field: "year",       type: "number",  required: false, note_uk: "Рік навчання (1–10)" },
    { field: "language",   type: "string",  required: false, note_uk: "uk | en | pl | de | fr" },
    { field: "description",type: "string",  required: false, note_uk: "Опис курсу" },
  ],
  backup: [
    { field: "version",   type: "string", required: true,  note_uk: "Версія формату (наразі \"1.0\")" },
    { field: "admins",    type: "array",  required: false, note_uk: "Масив адміністрації (директорат) — той самий формат що для Адміністрація" },
    { field: "units",     type: "array",  required: false, note_uk: "Масив підрозділів (той самий формат що для Структура)" },
    { field: "members",   type: "array",  required: false, note_uk: "Масив викладачів (той самий формат що для Викладачі)" },
    { field: "programs",  type: "array",  required: false, note_uk: "Масив програм (той самий формат що для Програми)" },
    { field: "courses",   type: "array",  required: false, note_uk: "Масив курсів (той самий формат що для Курси)" },
  ],
};

function SchemaReference({ tab, locale }: { tab: TabConfig; locale: "uk" | "en" }) {
  const isUk = locale === "uk";
  const [open, setOpen] = useState(false);
  const fields = FIELD_DOCS[tab.id];

  return (
    <LiquidCard className="overflow-hidden p-0">
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <FileJson className="h-4 w-4 text-slate-400" />
          <span className="text-sm font-semibold text-slate-700">
            {isUk ? `Формат JSON — «${tab.label.uk}»` : `JSON format — "${tab.label.en}"`}
          </span>
        </div>
        {open
          ? <ChevronDown className="h-4 w-4 text-slate-400" />
          : <ChevronRight className="h-4 w-4 text-slate-400" />}
      </button>

      {open && (
        <div className="border-t border-slate-200/60">
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="bg-slate-50/60">
                  <th className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {isUk ? "Поле" : "Field"}
                  </th>
                  <th className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {isUk ? "Тип" : "Type"}
                  </th>
                  <th className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {isUk ? "Обов'язк." : "Required"}
                  </th>
                  <th className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {isUk ? "Опис" : "Description"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {fields.map((f) => (
                  <tr key={f.field} className="border-t border-slate-100/60">
                    <td className="px-4 py-2 font-mono font-bold text-violet-700">{f.field}</td>
                    <td className="px-4 py-2 font-mono text-slate-500">{f.type}</td>
                    <td className="px-4 py-2">
                      {f.required
                        ? <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[9px] font-bold text-rose-700">{isUk ? "так" : "yes"}</span>
                        : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-2 text-slate-600">{f.note_uk}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </LiquidCard>
  );
}
