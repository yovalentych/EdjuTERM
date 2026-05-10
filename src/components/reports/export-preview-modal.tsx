"use client";

import { useState, useEffect, useCallback } from "react";
import {
  X, FileDown, Loader2, File, Presentation, FileSpreadsheet,
  FileText, Printer, ChevronDown, ChevronRight,
} from "lucide-react";
import type { ReportExportData } from "@/lib/report-export-data";
import type { Report } from "@/lib/schemas";
import { downloadCsv } from "@/lib/exporters/csv-exporter";
import { downloadTxt } from "@/lib/exporters/txt-exporter";
import { downloadXlsx } from "@/lib/exporters/xlsx-exporter";

// ── Types ─────────────────────────────────────────────────────────────────────

export type ExportFormat = "pdf" | "docx" | "pptx" | "xlsx" | "csv" | "txt";

type ExportConfig = {
  includeProject: boolean;
  reportGoals: boolean;
  reportTimeline: boolean;
  reportResults: boolean;
  reportPublications: boolean;
  reportFinancial: boolean;
  reportProblems: boolean;
  reportPlans: boolean;
  includeStages: boolean;
  includeExperiments: boolean;
  includeTasks: boolean;
  includeMilestones: boolean;
  includeEvents: boolean;
  includePublications: boolean;
  includeDeliverables: boolean;
  includeOpenScience: boolean;
  includeBudget: boolean;
};

const ALL_ON: ExportConfig = {
  includeProject: true, reportGoals: true, reportTimeline: true,
  reportResults: true, reportPublications: true, reportFinancial: true,
  reportProblems: true, reportPlans: true, includeStages: true,
  includeExperiments: true, includeTasks: true, includeMilestones: true,
  includeEvents: true, includePublications: true, includeDeliverables: true,
  includeOpenScience: true, includeBudget: true,
};

type Props = {
  open: boolean;
  onClose: () => void;
  initialFormat: ExportFormat;
  projectId: string;
  reportId: string | null;
  locale: string;
  printHref?: string;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function applyConfig(data: ReportExportData, cfg: ExportConfig): ReportExportData {
  return {
    ...data,
    report: data.report ? {
      ...data.report,
      sectionGoals: cfg.reportGoals ? data.report.sectionGoals : "",
      sectionTimeline: cfg.reportTimeline ? data.report.sectionTimeline : "",
      sectionResults: cfg.reportResults ? data.report.sectionResults : "",
      sectionPublications: cfg.reportPublications ? data.report.sectionPublications : "",
      sectionFinancial: cfg.reportFinancial ? data.report.sectionFinancial : "",
      sectionProblems: cfg.reportProblems ? data.report.sectionProblems : "",
      sectionPlans: cfg.reportPlans ? data.report.sectionPlans : "",
    } : null,
    stages: cfg.includeStages ? data.stages : [],
    experiments: cfg.includeExperiments ? data.experiments : [],
    tasks: cfg.includeTasks ? data.tasks : [],
    milestones: cfg.includeMilestones ? data.milestones : [],
    events: cfg.includeEvents ? data.events : [],
    publications: cfg.includePublications ? data.publications : [],
    deliverables: cfg.includeDeliverables ? data.deliverables : [],
    openScience: cfg.includeOpenScience ? data.openScience : [],
    budget: cfg.includeBudget ? data.budget : {
      ...data.budget, totalPlanned: 0, totalCommitted: 0, totalSpent: 0,
      byCategory: [], lineItems: [], purchaseRequests: [], periods: [],
    },
  };
}

function sectionsParam(cfg: ExportConfig): string {
  const s: string[] = [];
  if (cfg.includeProject) s.push("project");
  if (cfg.reportGoals) s.push("sectionGoals");
  if (cfg.reportTimeline) s.push("sectionTimeline");
  if (cfg.reportResults) s.push("sectionResults");
  if (cfg.reportPublications) s.push("sectionPublications");
  if (cfg.reportFinancial) s.push("sectionFinancial");
  if (cfg.reportProblems) s.push("sectionProblems");
  if (cfg.reportPlans) s.push("sectionPlans");
  if (cfg.includeStages) s.push("stages");
  if (cfg.includeExperiments) s.push("experiments");
  if (cfg.includeTasks) s.push("tasks");
  if (cfg.includeMilestones) s.push("milestones");
  if (cfg.includeEvents) s.push("events");
  if (cfg.includePublications) s.push("publications");
  if (cfg.includeDeliverables) s.push("deliverables");
  if (cfg.includeOpenScience) s.push("openScience");
  if (cfg.includeBudget) s.push("budget");
  return s.join(",");
}

function fmtDate(d: string | null | undefined | Date): string {
  if (!d) return "—";
  const dt = new Date(d as string);
  return isNaN(dt.getTime()) ? "—" : dt.toLocaleDateString("uk-UA", { day: "2-digit", month: "2-digit", year: "numeric" });
}
function fmtMoney(n: number, cur: string) { return `${n.toLocaleString("uk-UA")} ${cur}`; }

// ── Format metadata ────────────────────────────────────────────────────────────

const FORMATS: Array<{
  id: ExportFormat; label: string; icon: React.ReactNode;
  ring: string; bg: string; text: string; activeBg: string;
}> = [
  { id: "pdf",  label: "PDF",  icon: <Printer className="h-3.5 w-3.5" />,        ring: "ring-rose-400",    bg: "bg-rose-50",    text: "text-rose-600",    activeBg: "bg-rose-500"    },
  { id: "docx", label: "DOCX", icon: <File className="h-3.5 w-3.5" />,           ring: "ring-blue-400",    bg: "bg-blue-50",    text: "text-blue-600",    activeBg: "bg-blue-500"    },
  { id: "pptx", label: "PPTX", icon: <Presentation className="h-3.5 w-3.5" />,   ring: "ring-orange-400",  bg: "bg-orange-50",  text: "text-orange-600",  activeBg: "bg-orange-500"  },
  { id: "xlsx", label: "XLSX", icon: <FileSpreadsheet className="h-3.5 w-3.5" />, ring: "ring-emerald-400", bg: "bg-emerald-50", text: "text-emerald-600", activeBg: "bg-emerald-500" },
  { id: "csv",  label: "CSV",  icon: <FileText className="h-3.5 w-3.5" />,        ring: "ring-teal-400",    bg: "bg-teal-50",    text: "text-teal-600",    activeBg: "bg-teal-500"    },
  { id: "txt",  label: "TXT",  icon: <FileText className="h-3.5 w-3.5" />,        ring: "ring-stone-400",   bg: "bg-stone-50",   text: "text-stone-500",   activeBg: "bg-stone-500"   },
];

// ── Section sidebar ────────────────────────────────────────────────────────────

function Toggle({ checked, onChange, label, count, indent = false }: {
  checked: boolean; onChange: () => void; label: string;
  count?: number; indent?: boolean;
}) {
  return (
    <label className={`flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 transition hover:bg-stone-100 ${indent ? "ml-4" : ""}`}>
      <div
        onClick={onChange}
        className={`relative h-4 w-7 shrink-0 cursor-pointer rounded-full transition-colors duration-150 ${checked ? "bg-emerald-500" : "bg-stone-200"}`}
      >
        <div className={`absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-transform duration-150 ${checked ? "translate-x-3" : "translate-x-0.5"}`} />
      </div>
      <span className={`flex-1 text-xs ${checked ? "text-stone-700" : "text-stone-400 line-through"}`}>{label}</span>
      {count !== undefined && count > 0 && (
        <span className={`rounded px-1 py-0.5 text-[10px] font-mono font-semibold ${checked ? "bg-stone-100 text-stone-500" : "text-stone-300"}`}>{count}</span>
      )}
    </label>
  );
}

function SectionGroup({ title, children, defaultOpen = true }: {
  title: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center gap-1 px-2 py-1.5 text-left"
      >
        {open ? <ChevronDown className="h-3 w-3 text-stone-400" /> : <ChevronRight className="h-3 w-3 text-stone-400" />}
        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">{title}</span>
      </button>
      {open && <div className="space-y-0.5">{children}</div>}
    </div>
  );
}

// ── Document preview ───────────────────────────────────────────────────────────

function PreviewTable({ headers, rows, maxRows = 8 }: {
  headers: string[]; rows: string[][]; maxRows?: number;
}) {
  const visible = rows.slice(0, maxRows);
  const extra = rows.length - visible.length;
  return (
    <div className="overflow-hidden rounded border border-stone-200">
      <table className="w-full text-left text-[11px]">
        <thead>
          <tr className="bg-emerald-600 text-white">
            {headers.map(h => <th key={h} className="px-2 py-1 font-semibold">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {visible.map((row, ri) => (
            <tr key={ri} className={ri % 2 === 0 ? "bg-white" : "bg-stone-50"}>
              {row.map((cell, ci) => (
                <td key={ci} className="px-2 py-1 text-stone-700 max-w-[180px] truncate">{cell || "—"}</td>
              ))}
            </tr>
          ))}
          {extra > 0 && (
            <tr className="bg-stone-50">
              <td colSpan={headers.length} className="px-2 py-1 text-stone-400 italic">
                + ще {extra} рядків
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function PreviewSection({ title, badge, children }: {
  title: string; badge?: string | number; children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-baseline gap-2 border-b border-stone-200 pb-1">
        <h3 className="font-sans text-sm font-bold text-stone-800">{title}</h3>
        {badge !== undefined && (
          <span className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-[10px] text-stone-500">{badge}</span>
        )}
      </div>
      {children}
    </section>
  );
}

function DocumentPreview({ data }: { data: ReportExportData }) {
  const { project, report, stages, experiments, tasks, milestones,
          events, publications, deliverables, openScience, budget } = data;

  const reportSections: Array<{ key: keyof Report; label: string }> = [
    { key: "sectionGoals",        label: "1. Мета та завдання" },
    { key: "sectionTimeline",     label: "2. Хід виконання" },
    { key: "sectionResults",      label: "3. Результати" },
    { key: "sectionPublications", label: "4. Публікації та апробація" },
    { key: "sectionFinancial",    label: "5. Фінансова звітність" },
    { key: "sectionProblems",     label: "6. Проблеми та відхилення" },
    { key: "sectionPlans",        label: "7. Плани на наступний період" },
  ];

  const hasAnyContent =
    report || stages.length || experiments.length || tasks.length ||
    milestones.length || events.length || publications.length ||
    deliverables.length || openScience.length || budget.totalPlanned > 0 ||
    budget.byCategory.length > 0 || budget.lineItems.length > 0;

  if (!hasAnyContent) {
    return (
      <div className="flex h-full items-center justify-center text-stone-400">
        <div className="text-center">
          <FileDown className="mx-auto mb-2 h-8 w-8 opacity-30" />
          <p className="text-sm">Всі розділи відключено</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans text-stone-700">

      {/* Cover */}
      <div className="rounded-lg border-l-4 border-emerald-500 bg-emerald-50/50 px-4 py-3">
        {project.grantProgram && (
          <p className="mb-0.5 text-[10px] font-bold uppercase tracking-widest text-stone-400">{project.grantProgram}</p>
        )}
        <h2 className="text-base font-bold leading-snug text-stone-900">{project.title}</h2>
        {project.acronym && <p className="mt-0.5 text-sm font-semibold text-emerald-700">{project.acronym}</p>}
        {(project.startDate || project.endDate) && (
          <p className="mt-1 text-xs text-stone-500">
            {fmtDate(project.startDate)} — {fmtDate(project.endDate)} · {project.status}
          </p>
        )}
      </div>

      {/* Report text sections */}
      {report && reportSections.filter(s => !!(report[s.key] as string)).map(s => (
        <PreviewSection key={s.key} title={s.label}>
          <p className="whitespace-pre-wrap text-xs leading-relaxed text-stone-600 line-clamp-6">
            {report[s.key] as string}
          </p>
        </PreviewSection>
      ))}

      {/* Stages */}
      {stages.length > 0 && (
        <PreviewSection title="Етапи дослідження" badge={stages.length}>
          <PreviewTable
            headers={["#", "Назва", "Термін", "Статус", "%"]}
            rows={stages.map(s => [
              String(s.stageNumber), s.title,
              `${fmtDate(s.startDate)} — ${fmtDate(s.endDate)}`,
              s.status, `${s.progress}%`,
            ])}
          />
        </PreviewSection>
      )}

      {/* Experiments */}
      {experiments.length > 0 && (
        <PreviewSection title="Експерименти" badge={experiments.length}>
          <PreviewTable
            headers={["Назва", "Тип", "Статус", "Початок", "Кінець"]}
            rows={experiments.map(e => [
              e.title, e.type, e.status,
              fmtDate(e.startDate), fmtDate(e.endDate),
            ])}
          />
        </PreviewSection>
      )}

      {/* Tasks */}
      {tasks.length > 0 && (
        <PreviewSection title="Задачі" badge={tasks.length}>
          <PreviewTable
            headers={["Назва", "Статус", "Пріоритет", "Дедлайн"]}
            rows={tasks.map(t => [t.title, t.status, t.priority, fmtDate(t.dueDate)])}
          />
        </PreviewSection>
      )}

      {/* Milestones */}
      {milestones.length > 0 && (
        <PreviewSection title="Контрольні точки" badge={milestones.length}>
          <div className="space-y-1">
            {milestones.map((m, i) => (
              <div key={i} className="flex items-center gap-2 rounded bg-stone-50 px-2 py-1">
                <span className={`shrink-0 text-sm ${m.status === "reached" ? "text-emerald-500" : m.status === "missed" ? "text-rose-500" : "text-stone-400"}`}>
                  {m.status === "reached" ? "✓" : m.status === "missed" ? "✗" : "○"}
                </span>
                <span className="text-xs text-stone-700">{m.title}</span>
                <span className="ml-auto text-[10px] text-stone-400">{fmtDate(m.dueDate)}</span>
              </div>
            ))}
          </div>
        </PreviewSection>
      )}

      {/* Events */}
      {events.length > 0 && (
        <PreviewSection title="Заходи / Конференції" badge={events.length}>
          <PreviewTable
            headers={["Назва", "Тип", "Дата", "Місце"]}
            rows={events.map(e => [e.title, e.type, fmtDate(e.startDate), e.location ?? ""])}
          />
        </PreviewSection>
      )}

      {/* Publications */}
      {publications.length > 0 && (
        <PreviewSection title="Публікації" badge={publications.length}>
          <PreviewTable
            headers={["Назва", "Тип", "Автори", "Рік", "Статус"]}
            rows={publications.map(p => [p.title, p.type, p.authors ?? "", String(p.expectedYear ?? ""), p.status])}
          />
        </PreviewSection>
      )}

      {/* Deliverables */}
      {deliverables.length > 0 && (
        <PreviewSection title="Результати проєкту" badge={deliverables.length}>
          <PreviewTable
            headers={["Назва", "Тип", "Дедлайн", "Статус"]}
            rows={deliverables.map(d => [d.title, d.type, fmtDate(d.plannedDate), d.status])}
          />
        </PreviewSection>
      )}

      {/* Open Science */}
      {openScience.length > 0 && (
        <PreviewSection title="Відкрита наука" badge={openScience.length}>
          <PreviewTable
            headers={["Назва", "Категорія", "Статус"]}
            rows={openScience.map(o => [o.title, o.category, o.status])}
          />
        </PreviewSection>
      )}

      {/* Budget */}
      {(budget.totalPlanned > 0 || budget.byCategory.length > 0) && (
        <PreviewSection title="Бюджет">
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { label: "Заплановано", val: budget.totalPlanned, color: "text-stone-700" },
              { label: "Зафіксовано", val: budget.totalCommitted, color: "text-blue-600" },
              { label: "Витрачено",   val: budget.totalSpent,    color: "text-emerald-600" },
            ].map(({ label, val, color }) => (
              <div key={label} className="rounded border border-stone-100 bg-stone-50 p-2">
                <p className={`text-xs font-bold ${color}`}>{fmtMoney(val, budget.currency)}</p>
                <p className="mt-0.5 text-[10px] text-stone-400">{label}</p>
              </div>
            ))}
          </div>
          {budget.byCategory.length > 0 && (
            <div className="mt-2 space-y-1">
              {budget.byCategory.slice(0, 6).map((c, i) => (
                <div key={i} className="flex items-center gap-2 text-[11px]">
                  <span className="w-28 truncate text-stone-600">{c.category}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-stone-100">
                    <div
                      className="h-full rounded-full bg-emerald-400"
                      style={{ width: c.planned > 0 ? `${Math.min(100, (c.spent / c.planned) * 100)}%` : "0%" }}
                    />
                  </div>
                  <span className="text-stone-500">{fmtMoney(c.spent, budget.currency)}</span>
                </div>
              ))}
            </div>
          )}
          {budget.purchaseRequests.length > 0 && (
            <div className="mt-2">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-stone-400">Закупівлі</p>
              <PreviewTable
                headers={["Назва", "Категорія", "Статус", "Кошторис"]}
                rows={budget.purchaseRequests.map(r => [r.title, r.category, r.status, fmtMoney(r.estimatedAmount, budget.currency)])}
                maxRows={5}
              />
            </div>
          )}
        </PreviewSection>
      )}
    </div>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────

export function ExportPreviewModal({
  open, onClose, initialFormat, projectId, reportId, locale, printHref,
}: Props) {
  const isUk = locale === "uk";
  const [format, setFormat] = useState<ExportFormat>(initialFormat);
  const [config, setConfig] = useState<ExportConfig>(ALL_ON);
  const [data, setData] = useState<ReportExportData | null>(null);
  const [fetching, setFetching] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportGroupOpen, setReportGroupOpen] = useState(true);

  useEffect(() => { if (open) setFormat(initialFormat); }, [open, initialFormat]);

  useEffect(() => {
    if (!open || data) return;
    setFetching(true);
    setError(null);
    const p = new URLSearchParams({ projectId });
    if (reportId) p.set("reportId", reportId);
    fetch(`/api/reports/export-data?${p}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(d => { setData(d); setFetching(false); })
      .catch(() => { setError(isUk ? "Не вдалося завантажити дані" : "Failed to load data"); setFetching(false); });
  }, [open, projectId, reportId, data, isUk]);

  useEffect(() => {
    if (!open) return;
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [open, onClose]);

  const toggle = useCallback((key: keyof ExportConfig) => {
    setConfig(c => ({ ...c, [key]: !c[key] }));
  }, []);

  const previewData = data ? applyConfig(data, config) : null;

  async function handleExport() {
    if (!data) return;
    if (format === "pdf") { if (printHref) window.open(printHref, "_blank"); onClose(); return; }

    setExporting(true);
    setError(null);
    try {
      const slug = (data.project.acronym || projectId.slice(-6)).replace(/\s+/g, "_");
      const date = new Date().toISOString().slice(0, 10);
      const basename = `${slug}-${date}`;

      if (format === "docx" || format === "pptx") {
        const rid = reportId ?? "none";
        const url = `/api/reports/${rid}/${format}?projectId=${projectId}&sections=${sectionsParam(config)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`${res.status}`);
        const blob = await res.blob();
        const href = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = href; a.download = `${basename}.${format}`; a.click();
        URL.revokeObjectURL(href);
      } else {
        const filtered = applyConfig(data, config);
        if (format === "csv")  downloadCsv(filtered,  `${basename}.csv`);
        if (format === "txt")  downloadTxt(filtered,  `${basename}.txt`);
        if (format === "xlsx") downloadXlsx(filtered, `${basename}.xlsx`);
      }
      onClose();
    } catch (e) {
      setError(isUk ? "Помилка при експорті. Спробуйте ще раз." : "Export failed. Please try again.");
      console.error(e);
    } finally {
      setExporting(false);
    }
  }

  const fmt = FORMATS.find(f => f.id === format)!;
  const hasReport = !!data?.report;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-stretch justify-center transition-opacity duration-200 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />

      {/* Panel */}
      <div
        className={`relative z-10 flex w-full max-w-6xl flex-col bg-white shadow-2xl ring-1 ring-black/10 transition-all duration-200 ease-out sm:my-4 sm:rounded-2xl ${open ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`}
        style={{ maxHeight: "calc(100vh - 2rem)" }}
      >
        {/* ── Header ── */}
        <div className="flex shrink-0 items-center gap-3 border-b border-stone-200 px-5 py-3.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
            <FileDown className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold text-stone-900">
              {isUk ? "Попередній перегляд та налаштування експорту" : "Export Preview & Configuration"}
            </h2>
            {data && (
              <p className="truncate text-xs text-stone-400">{data.project.title}</p>
            )}
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-stone-400 transition hover:bg-stone-100 hover:text-stone-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Format tabs ── */}
        <div className="flex shrink-0 items-center gap-1.5 border-b border-stone-100 bg-stone-50/60 px-5 py-2.5">
          <span className="mr-1 text-[10px] font-bold uppercase tracking-wider text-stone-400">
            {isUk ? "Формат:" : "Format:"}
          </span>
          {FORMATS.map(f => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFormat(f.id)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${format === f.id ? `${f.activeBg} text-white shadow-sm` : `${f.bg} ${f.text} hover:opacity-80`}`}
            >
              {f.icon}
              {f.label}
            </button>
          ))}
        </div>

        {/* ── Body ── */}
        <div className="flex min-h-0 flex-1 overflow-hidden">

          {/* Left: section config */}
          <aside className="flex w-60 shrink-0 flex-col overflow-y-auto border-r border-stone-100 bg-stone-50/40 py-3">
            <p className="mb-2 px-4 text-[10px] font-bold uppercase tracking-wider text-stone-400">
              {isUk ? "Розділи" : "Sections"}
            </p>

            <div className="space-y-1 px-1">
              <Toggle checked={config.includeProject} onChange={() => toggle("includeProject")}
                label={isUk ? "Обкладинка проєкту" : "Project cover"} />

              {hasReport && (
                <div>
                  <button
                    type="button"
                    onClick={() => setReportGroupOpen(o => !o)}
                    className="flex w-full items-center gap-1 px-2 py-1.5 text-left"
                  >
                    {reportGroupOpen
                      ? <ChevronDown className="h-3 w-3 text-stone-400" />
                      : <ChevronRight className="h-3 w-3 text-stone-400" />}
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                      {isUk ? "Розділи звіту" : "Report sections"}
                    </span>
                  </button>
                  {reportGroupOpen && (
                    <div className="space-y-0.5">
                      {([
                        ["reportGoals",        "sectionGoals",        isUk ? "Мета та завдання"          : "Goals"],
                        ["reportTimeline",     "sectionTimeline",     isUk ? "Хід виконання"             : "Timeline"],
                        ["reportResults",      "sectionResults",      isUk ? "Результати"                : "Results"],
                        ["reportPublications", "sectionPublications", isUk ? "Публікації та апробація"   : "Publications"],
                        ["reportFinancial",    "sectionFinancial",    isUk ? "Фінансова звітність"       : "Financial"],
                        ["reportProblems",     "sectionProblems",     isUk ? "Проблеми та відхилення"    : "Problems"],
                        ["reportPlans",        "sectionPlans",        isUk ? "Плани на наступний період" : "Plans"],
                      ] as [keyof ExportConfig, keyof Report, string][]).map(([cfgKey, repKey, label]) => {
                        const filled = !!(data?.report?.[repKey]);
                        if (!filled && !config[cfgKey]) return null;
                        return (
                          <Toggle key={cfgKey} checked={config[cfgKey]} onChange={() => toggle(cfgKey)}
                            label={label} indent />
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <div className="pt-1">
                <p className="mb-1 px-2 text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  {isUk ? "Дані проєкту" : "Project data"}
                </p>
                {([
                  ["includeStages",       isUk ? "Етапи"              : "Stages",       data?.stages.length],
                  ["includeExperiments",  isUk ? "Експерименти"       : "Experiments",  data?.experiments.length],
                  ["includeTasks",        isUk ? "Задачі"             : "Tasks",        data?.tasks.length],
                  ["includeMilestones",   isUk ? "Контрольні точки"   : "Milestones",   data?.milestones.length],
                  ["includeEvents",       isUk ? "Заходи"             : "Events",       data?.events.length],
                  ["includePublications", isUk ? "Публікації"         : "Publications", data?.publications.length],
                  ["includeDeliverables", isUk ? "Результати (D)"     : "Deliverables", data?.deliverables.length],
                  ["includeOpenScience",  isUk ? "Відкрита наука"     : "Open Science", data?.openScience.length],
                  ["includeBudget",       isUk ? "Бюджет"             : "Budget",       undefined],
                ] as [keyof ExportConfig, string, number | undefined][]).map(([key, label, count]) => (
                  <Toggle key={key} checked={config[key]} onChange={() => toggle(key)}
                    label={label} count={count} />
                ))}
              </div>
            </div>

            {/* Select all / none */}
            <div className="mt-auto border-t border-stone-100 px-3 pt-3 flex gap-2">
              <button type="button" onClick={() => setConfig(ALL_ON)}
                className="flex-1 rounded border border-stone-200 bg-white px-2 py-1.5 text-[11px] font-semibold text-stone-600 transition hover:bg-stone-50">
                {isUk ? "Усі" : "All"}
              </button>
              <button type="button" onClick={() => setConfig(c => Object.fromEntries(Object.keys(c).map(k => [k, false])) as ExportConfig)}
                className="flex-1 rounded border border-stone-200 bg-white px-2 py-1.5 text-[11px] font-semibold text-stone-600 transition hover:bg-stone-50">
                {isUk ? "Жодного" : "None"}
              </button>
            </div>
          </aside>

          {/* Right: preview */}
          <main className="flex flex-1 flex-col overflow-hidden">
            {/* Preview header bar */}
            <div className="flex shrink-0 items-center gap-2 border-b border-stone-100 bg-white px-5 py-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                {isUk ? "Попередній перегляд" : "Preview"}
              </span>
              <span className={`ml-1 flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-bold ${fmt.bg} ${fmt.text}`}>
                {fmt.icon} {fmt.label}
              </span>
              {data && (
                <span className="ml-auto text-[10px] text-stone-400">
                  {isUk ? "Згенеровано:" : "Generated:"} {new Date(data.generatedAt).toLocaleString("uk-UA")}
                </span>
              )}
            </div>

            {/* Preview body */}
            <div className="flex-1 overflow-y-auto bg-stone-100/50 p-6">
              {fetching && (
                <div className="flex h-full items-center justify-center gap-2 text-stone-400">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm">{isUk ? "Завантаження даних…" : "Loading data…"}</span>
                </div>
              )}
              {error && !fetching && (
                <div className="flex h-full items-center justify-center">
                  <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</p>
                </div>
              )}
              {!fetching && !error && previewData && (
                <div className="mx-auto max-w-2xl rounded-xl border border-stone-200 bg-white px-8 py-8 shadow-sm">
                  {format === "pdf" ? (
                    <div className="mb-4 rounded-lg border border-rose-100 bg-rose-50 px-4 py-3 text-xs text-rose-700">
                      {isUk
                        ? "PDF генерується через вбудований принтер браузера. Розділи нижче відображають дані звіту."
                        : "PDF is generated via browser print. Sections below reflect report data."}
                    </div>
                  ) : format === "pptx" ? (
                    <div className="mb-4 rounded-lg border border-orange-100 bg-orange-50 px-4 py-3 text-xs text-orange-700">
                      {isUk
                        ? "Презентація PPTX міститиме по одному слайду на кожен розділ та таблицю."
                        : "PPTX presentation will have one slide per section and table."}
                    </div>
                  ) : null}
                  <DocumentPreview data={previewData} />
                </div>
              )}
            </div>
          </main>
        </div>

        {/* ── Footer ── */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-stone-200 bg-stone-50/60 px-5 py-3">
          {error && exporting && (
            <p className="text-xs text-rose-600">{error}</p>
          )}
          <div className="ml-auto flex items-center gap-3">
            <button type="button" onClick={onClose}
              className="rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-600 transition hover:bg-stone-50">
              {isUk ? "Скасувати" : "Cancel"}
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting || fetching || !data}
              className={`flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-bold text-white shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed ${fmt.activeBg} hover:opacity-90`}
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                fmt.icon
              )}
              {isUk ? `Експортувати ${fmt.label}` : `Export ${fmt.label}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
