"use client";

import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Download,
  FileCode,
  FileJson,
  FileSpreadsheet,
  FileText,
  Loader2,
  Paperclip,
  Search,
  Sheet,
  TableProperties,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

// ── Shared types ───────────────────────────────────────────────────────────────

interface ColStat {
  min: number; max: number; avg: number; count: number; missing: number;
}

interface SheetData {
  name: string;
  headers: string[];
  rows: string[][];
  rowCount: number;
  truncated: boolean;
  numericCols: boolean[];
  stats: (ColStat | null)[];
}

type PreviewPayload =
  | { fileType: "csv" | "excel" | "json-table" | "jsonl-table"; fileName: string; delimiter?: string; sheets: SheetData[]; truncated?: boolean; parseErrors?: number }
  | { fileType: "json" | "jsonl"; fileName: string; truncated: boolean; preview: string; parseError?: boolean; parseErrors?: number; lineCount?: number }
  | { fileType: "text"; fileName: string; language: string; truncated: boolean; content: string }
  | { error: string };

const PAGE_SIZE = 50;

function fmt(n: number) {
  if (Number.isInteger(n)) return n.toLocaleString();
  return n.toLocaleString(undefined, { maximumFractionDigits: 4 });
}

// ── File type helpers ─────────────────────────────────────────────────────────

function fileTypeLabel(ft: string) {
  const map: Record<string, string> = {
    csv: "CSV", excel: "Excel", "json-table": "JSON", "jsonl-table": "JSON Lines",
    json: "JSON", jsonl: "JSON Lines", text: "Text",
  };
  return map[ft] ?? ft.toUpperCase();
}

function FileIcon({ fileType, className = "h-4 w-4" }: { fileType: string; className?: string }) {
  if (fileType === "csv") return <TableProperties className={className} />;
  if (fileType === "excel") return <FileSpreadsheet className={className} />;
  if (fileType === "json" || fileType === "json-table" || fileType === "jsonl" || fileType === "jsonl-table")
    return <FileJson className={className} />;
  if (fileType === "text") return <FileCode className={className} />;
  return <FileText className={className} />;
}

function ViewerChip({
  children,
  tone = "slate",
}: {
  children: React.ReactNode;
  tone?: "slate" | "blue" | "amber" | "emerald";
}) {
  const tones = {
    slate: "border-slate-200 bg-white text-slate-600",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
  };

  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 font-mono text-[10px] font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}

// ── Table view (used for CSV / Excel sheets / JSON arrays) ────────────────────

function TableView({ sheet }: { sheet: SheetData }) {
  const [filter, setFilter] = useState("");
  const [sortCol, setSortCol] = useState<number | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(0);
  const [activeCol, setActiveCol] = useState<number | null>(null);
  const filterRef = useRef<HTMLInputElement>(null);

  useEffect(() => { filterRef.current?.focus(); }, []);

  const updateFilter = useCallback((value: string) => {
    setFilter(value);
    setPage(0);
  }, []);

  const filtered = sheet.rows.filter(
    (row) => filter === "" || row.some((c) => c.toLowerCase().includes(filter.toLowerCase()))
  );

  const sorted = sortCol !== null
    ? [...filtered].sort((a, b) => {
        const av = a[sortCol] ?? "", bv = b[sortCol] ?? "";
        const cmp = sheet.numericCols[sortCol]
          ? Number(av) - Number(bv)
          : av.localeCompare(bv, undefined, { numeric: true });
        return sortDir === "asc" ? cmp : -cmp;
      })
    : filtered;

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pageRows = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleSort = useCallback((ci: number) => {
    setPage(0);
    if (sortCol === ci) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortCol(ci); setSortDir("asc"); }
  }, [sortCol]);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white">
      {/* Active column stats */}
      {activeCol !== null && sheet.stats[activeCol] && (
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-blue-100 bg-blue-50/80 px-4 py-2.5 font-mono text-xs text-blue-800">
          <ViewerChip tone="blue">{sheet.headers[activeCol]}</ViewerChip>
          <ViewerChip>min: <b>{fmt(sheet.stats[activeCol]!.min)}</b></ViewerChip>
          <ViewerChip>max: <b>{fmt(sheet.stats[activeCol]!.max)}</b></ViewerChip>
          <ViewerChip>avg: <b>{fmt(sheet.stats[activeCol]!.avg)}</b></ViewerChip>
          <ViewerChip>n: <b>{sheet.stats[activeCol]!.count.toLocaleString()}</b></ViewerChip>
          {sheet.stats[activeCol]!.missing > 0 && (
            <ViewerChip tone="amber">missing: <b>{sheet.stats[activeCol]!.missing}</b></ViewerChip>
          )}
          <button
            onClick={() => setActiveCol(null)}
            className="ml-auto flex h-7 w-7 items-center justify-center rounded-md border border-blue-200 bg-white text-blue-500 transition hover:border-blue-300 hover:text-blue-800"
            title="Закрити статистику"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Filter (inline, above table) */}
      <div className="flex shrink-0 flex-col gap-2 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            ref={filterRef}
            value={filter}
            onChange={(e) => updateFilter(e.target.value)}
            placeholder="Пошук по всіх колонках…"
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-9 font-mono text-xs text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
          />
          {filter && (
            <button onClick={() => updateFilter("")} className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <ViewerChip tone="emerald">{sheet.rowCount.toLocaleString()} рядків</ViewerChip>
          <ViewerChip>{sheet.headers.length.toLocaleString()} колонок</ViewerChip>
          {sheet.truncated && <ViewerChip tone="amber">показано 2 000</ViewerChip>}
        </div>
      </div>

      {/* Empty filter result */}
      {sorted.length === 0 ? (
        <div className="flex flex-1 items-center justify-center bg-slate-50 p-8">
          <div className="rounded-xl border border-dashed border-slate-200 bg-white px-6 py-5 text-center shadow-sm">
            <Search className="mx-auto h-6 w-6 text-slate-300" />
            <p className="mt-2 font-mono text-sm text-slate-500">Нічого не знайдено за «{filter}»</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          <table className="w-full min-w-max border-collapse text-xs">
            <thead className="sticky top-0 z-10">
              <tr>
                <th className="border-b border-slate-200 bg-slate-100 px-3 py-3 text-left font-mono text-[10px] font-semibold text-slate-400 select-none">#</th>
                {sheet.headers.map((h, ci) => {
                  const isSort = sortCol === ci;
                  const hasStat = Boolean(sheet.stats[ci]);
                  return (
                    <th
                      key={ci}
                      className={`border-b border-slate-200 bg-slate-100 px-3 py-3 text-left font-mono text-[11px] font-semibold text-slate-700 select-none whitespace-nowrap ${isSort ? "bg-blue-50 text-blue-800" : ""}`}
                    >
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => handleSort(ci)} className="flex items-center gap-1 transition hover:text-blue-700">
                          <span>{h || `Col ${ci + 1}`}</span>
                          {isSort
                            ? sortDir === "asc"
                              ? <ArrowUp className="h-3 w-3 text-blue-600" />
                              : <ArrowDown className="h-3 w-3 text-blue-600" />
                            : <ArrowUpDown className="h-3 w-3 text-slate-300" />}
                        </button>
                        {hasStat && (
                          <button
                            onClick={() => setActiveCol(activeCol === ci ? null : ci)}
                            className={`ml-0.5 rounded border px-1.5 py-0.5 text-[9px] transition ${activeCol === ci ? "border-blue-500 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-400 hover:border-blue-300 hover:text-blue-600"}`}
                            title="Статистика колонки"
                          >∑</button>
                        )}
                        {sheet.numericCols[ci] && (
                          <span className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[9px] text-slate-400">123</span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row, ri) => (
                <tr key={ri} className={ri % 2 === 0 ? "bg-white hover:bg-blue-50/70" : "bg-slate-50/70 hover:bg-blue-50/70"}>
                  <td className="border-b border-slate-100 px-3 py-2 font-mono text-[10px] text-slate-400 select-none">
                    {page * PAGE_SIZE + ri + 1}
                  </td>
                  {sheet.headers.map((_, ci) => {
                    const val = row[ci] ?? "";
                    const isNum = sheet.numericCols[ci];
                    const isEmpty = val === "";
                    return (
                      <td
                        key={ci}
                        className={`border-b border-slate-100 px-3 py-2 ${isNum ? "text-right font-mono text-slate-700" : "text-slate-800"} ${sortCol === ci ? "bg-blue-50/50" : ""} ${isEmpty ? "text-slate-300" : ""}`}
                      >
                        {isEmpty ? "—" : isNum ? <span className="tabular-nums">{val}</span> : val}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex shrink-0 flex-col gap-3 border-t border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="font-mono text-xs text-slate-500">
            {sorted.length.toLocaleString()} рядків{filter && ` · фільтр: «${filter}»`}
            {" · "} сторінка {page + 1} з {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(0)} disabled={page === 0} className="rounded-md border border-slate-200 bg-white px-2 py-1 font-mono text-xs text-slate-600 transition hover:border-blue-300 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40">«</button>
            <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="rounded-md border border-slate-200 bg-white p-1 text-slate-600 transition hover:border-blue-300 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40">
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
              const p = totalPages <= 7 ? i : page < 4 ? i : page > totalPages - 5 ? totalPages - 7 + i : page - 3 + i;
              return (
                <button key={p} onClick={() => setPage(p)} className={`min-w-[28px] rounded-md border px-2 py-1 font-mono text-xs transition ${p === page ? "border-blue-600 bg-blue-600 text-white shadow-sm shadow-blue-200" : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-700"}`}>
                  {p + 1}
                </button>
              );
            })}
            <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1} className="rounded-md border border-slate-200 bg-white p-1 text-slate-600 transition hover:border-blue-300 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40">
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => setPage(totalPages - 1)} disabled={page === totalPages - 1} className="rounded-md border border-slate-200 bg-white px-2 py-1 font-mono text-xs text-slate-600 transition hover:border-blue-300 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40">»</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── JSON / text viewer ────────────────────────────────────────────────────────

function TextViewer({ content, language = "text", truncated }: { content: string; language?: string; truncated?: boolean }) {
  const langLabel: Record<string, string> = { json: "JSON", py: "Python", r: "R", m: "MATLAB", yaml: "YAML", yml: "YAML", xml: "XML", md: "Markdown", txt: "Text", log: "Log" };
  const label = langLabel[language] ?? language.toUpperCase();
  const lines = content.split("\n");
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-slate-800 bg-slate-900 px-4 py-3">
        <ViewerChip tone="blue">{label}</ViewerChip>
        <ViewerChip>{lines.length.toLocaleString()} рядків</ViewerChip>
        {truncated && <ViewerChip tone="amber">показано перші {(content.length / 1024).toFixed(0)} KB</ViewerChip>}
      </div>
      <div className="flex-1 overflow-auto bg-[radial-gradient(circle_at_top_left,#1e3a5f_0,#0f172a_36%,#0b1120_100%)] p-5">
        <pre className="rounded-xl border border-white/10 bg-slate-950/70 p-4 font-mono text-xs leading-6 text-slate-100 shadow-2xl shadow-slate-950/30 whitespace-pre-wrap break-words">{content}</pre>
      </div>
    </div>
  );
}

// ── Main viewer panel ──────────────────────────────────────────────────────────

function FileViewerPanel({
  recordId, fileIndex, fileName, mimeType, storageUri, onClose,
}: {
  recordId: string;
  fileIndex: number;
  fileName: string;
  mimeType?: string;
  storageUri?: string;
  onClose: () => void;
}) {
  const requestKey = `${recordId}:${fileIndex}`;
  const [previewState, setPreviewState] = useState<{ key: string; payload: PreviewPayload | null }>({
    key: requestKey,
    payload: null,
  });
  const [activeSheet, setActiveSheet] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({
      recordId,
      fileIndex: String(fileIndex),
      fileName,
    });
    if (mimeType) params.set("mimeType", mimeType);
    if (storageUri) params.set("storageUri", storageUri);

    fetch(`/api/record-file-preview?${params.toString()}`)
      .then(async (r) => {
        const data = await r.json().catch(() => ({ error: "Не вдалося прочитати відповідь сервера." }));
        if (!r.ok && !("error" in data)) return { error: `HTTP ${r.status}` };
        return data;
      })
      .then((payload: PreviewPayload) => {
        if (!cancelled) setPreviewState({ key: requestKey, payload });
      })
      .catch(() => {
        if (!cancelled) setPreviewState({ key: requestKey, payload: { error: "Не вдалося завантажити файл." } });
      });
    return () => {
      cancelled = true;
    };
  }, [fileIndex, fileName, mimeType, recordId, requestKey, storageUri]);

  const payload = previewState.key === requestKey ? previewState.payload : null;
  const loading = payload === null;
  const isError = payload && "error" in payload;
  const isTable = payload && !("error" in payload) && "sheets" in payload;
  const isText = payload && !("error" in payload) && payload.fileType === "text";
  const isJson = payload && !("error" in payload) && (payload.fileType === "json" || payload.fileType === "jsonl");

  const tablePayload = isTable ? payload : null;
  const sheets = tablePayload?.sheets ?? [];
  const sheet = sheets[activeSheet];

  const ft = payload && !("error" in payload) ? payload.fileType : "file";
  const fileDisplayName = payload && !("error" in payload) ? payload.fileName : fileName;
  const storageLabel = storageUri?.startsWith("r2://") ? "Cloudflare R2" : storageUri ? "local storage" : "";

  // toolbar subtitle
  let subtitle = "";
  if (tablePayload) {
    if (sheets.length > 1) subtitle = `${sheets.length} аркушів`;
    else if (sheet) subtitle = `${sheet.rowCount.toLocaleString()} рядків · ${sheet.headers.length} колонок${sheet.truncated ? " · показано 2 000" : ""}`;
    if (tablePayload.delimiter) subtitle += ` · delim: ${tablePayload.delimiter}`;
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-100">
      {/* ── Toolbar ────────────────────────────────────────────────────── */}
      <div className="flex shrink-0 flex-col gap-3 border-b border-slate-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur md:flex-row md:items-center">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 text-blue-700 shadow-sm">
          <FileIcon fileType={ft} className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-mono text-sm font-semibold text-slate-950">{fileDisplayName}</p>
            {!isError && !loading && <ViewerChip tone="blue">{fileTypeLabel(ft)}</ViewerChip>}
          </div>
          <div className="mt-1 flex flex-wrap gap-2">
            {subtitle && <ViewerChip>{subtitle}</ViewerChip>}
            {storageLabel && <ViewerChip tone="emerald">{storageLabel}</ViewerChip>}
            {loading && <ViewerChip tone="amber">читання...</ViewerChip>}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <a
            href={`/api/records/${recordId}/files/${fileIndex}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-xs font-semibold text-slate-700 shadow-sm transition hover:border-blue-300 hover:text-blue-700"
          >
            <Download className="h-3.5 w-3.5" />
            Завантажити
          </a>
          <button
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
            aria-label="Закрити"
            title="Закрити"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Sheet tabs (Excel multi-sheet) ─────────────────────────────── */}
      {sheets.length > 1 && (
        <div className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-slate-200 bg-slate-50 px-3 py-2">
          {sheets.map((s, i) => (
            <button
              key={i}
              onClick={() => setActiveSheet(i)}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 font-mono text-xs transition ${
                i === activeSheet
                  ? "border-blue-200 bg-white text-blue-700 font-semibold shadow-sm"
                  : "border-transparent text-slate-500 hover:bg-white hover:text-slate-800"
              }`}
            >
              <Sheet className="h-3 w-3" />
              {s.name}
              {s.rowCount > 0 && (
                <span className="rounded bg-slate-100 px-1 text-[9px] text-slate-500">{s.rowCount.toLocaleString()}</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* ── Loading ─────────────────────────────────────────────────────── */}
      {loading && (
        <div className="flex flex-1 items-center justify-center bg-slate-50 p-8">
          <div className="rounded-2xl border border-slate-200 bg-white px-8 py-7 text-center shadow-sm">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-500" />
            <p className="mt-3 font-mono text-sm font-semibold text-slate-700">Читаємо файл…</p>
            <p className="mt-1 text-xs text-slate-400">Підготовка попереднього перегляду</p>
          </div>
        </div>
      )}

      {/* ── Error ───────────────────────────────────────────────────────── */}
      {isError && (
        <div className="flex flex-1 items-center justify-center bg-slate-50 p-8">
          <div className="max-w-lg rounded-2xl border border-rose-100 bg-white p-6 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-rose-100 bg-rose-50 text-rose-600">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-slate-950">Не вдалося показати preview</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {(payload as { error: string }).error}
            </p>
            <a
              href={`/api/records/${recordId}/files/${fileIndex}`}
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-blue-300 hover:text-blue-700"
            >
              <Download className="h-3.5 w-3.5" />
              Завантажити файл
            </a>
          </div>
        </div>
      )}

      {/* ── Table (CSV / Excel / JSON array) ────────────────────────────── */}
      {!loading && isTable && sheet && sheet.headers.length > 0 && (
        <TableView key={`${activeSheet}`} sheet={sheet} />
      )}
      {!loading && isTable && sheet && sheet.headers.length === 0 && (
        <div className="flex flex-1 items-center justify-center bg-slate-50 p-8">
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-8 py-7 text-center shadow-sm">
            <Sheet className="mx-auto h-7 w-7 text-slate-300" />
            <p className="mt-2 font-mono text-sm text-slate-500">Аркуш порожній.</p>
          </div>
        </div>
      )}

      {/* ── Text / code ─────────────────────────────────────────────────── */}
      {!loading && isText && (
        <TextViewer
          content={(payload as { content: string }).content}
          language={(payload as { language: string }).language}
          truncated={(payload as { truncated: boolean }).truncated}
        />
      )}

      {/* ── JSON blob (non-array) ────────────────────────────────────────── */}
      {!loading && isJson && (
        <TextViewer
          content={(payload as { preview: string }).preview}
          language="json"
          truncated={(payload as { truncated: boolean }).truncated}
        />
      )}
    </div>
  );
}

// ── Public trigger button ──────────────────────────────────────────────────────

export function FilePreviewButton({
  recordId,
  fileIndex,
  fileName,
  fileType,
  mimeType,
  storageUri,
}: {
  recordId: string;
  fileIndex: number;
  fileName: string;
  /** "csv" | "excel" | "json" | "text" — drives icon + label */
  fileType: "csv" | "excel" | "json" | "text";
  mimeType?: string;
  storageUri?: string;
}) {
  const [open, setOpen] = useState(false);

  const labels: Record<string, string> = {
    csv: "Таблиця",
    excel: "Excel",
    json: "JSON",
    text: "Перегляд",
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex shrink-0 items-center gap-1.5 rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50 px-2.5 py-1.5 font-mono text-[11px] font-semibold text-blue-700 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
        title={`Переглянути: ${fileName}`}
      >
        <FileIcon fileType={fileType} className="h-3 w-3" />
        {labels[fileType] ?? "Перегляд"}
      </button>
      {open && (
        <FileViewerPanel
          recordId={recordId}
          fileIndex={fileIndex}
          fileName={fileName}
          mimeType={mimeType}
          storageUri={storageUri}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

// ── Upload files to existing record ───────────────────────────────────────────

export function RecordFileUpload({ recordId, onUploaded }: { recordId: string; onUploaded?: () => void }) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (files: File[]) => {
    if (files.length === 0) return;

    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      for (const f of files) formData.append("files", f);
      const res = await fetch(`/api/records/${recordId}/files`, { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`);
      }
      onUploaded?.();
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }, [recordId, onUploaded]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    handleFiles(Array.from(e.target.files ?? []));
  }

  return (
    <div className="flex flex-col gap-2">
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-all
          ${dragActive ? "border-blue-500 bg-blue-50/50" : "border-slate-200 bg-slate-50/30 hover:border-slate-300 hover:bg-slate-50"}
          ${uploading ? "opacity-50 pointer-events-none" : "cursor-pointer"}`}
        onClick={() => inputRef.current?.click()}
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <div className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${dragActive ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-400"}`}>
            {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Paperclip className="h-5 w-5" />}
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-900">
              {uploading ? "Завантаження..." : dragActive ? "Кидайте файли тут" : "Прикріпити файли"}
            </p>
            <p className="text-xs text-slate-500">
              {dragActive ? "Відпустіть для завантаження" : "Перетягніть файли сюди або натисніть для вибору"}
            </p>
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="sr-only"
          onChange={handleChange}
          disabled={uploading}
        />
      </div>
      {error && (
        <div className="flex items-center gap-1.5 text-xs text-rose-600">
          <AlertCircle className="h-3.5 w-3.5" />
          {error}
        </div>
      )}
    </div>
  );
}
