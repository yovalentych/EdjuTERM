"use client";

import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  TableProperties,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface ColStat {
  min: number;
  max: number;
  avg: number;
  count: number;
}

interface CsvData {
  headers: string[];
  rows: string[][];
  rowCount: number;
  truncated: boolean;
  delimiter: string;
  numericCols: boolean[];
  stats: (ColStat | null)[];
  fileName: string;
}

const PAGE_SIZE = 50;

function fmt(n: number): string {
  if (Number.isInteger(n)) return n.toLocaleString();
  return n.toLocaleString(undefined, { maximumFractionDigits: 4 });
}

// ── Main viewer panel ──────────────────────────────────────────────────────────

function CsvViewerPanel({
  recordId,
  fileIndex,
  fileName,
  onClose,
}: {
  recordId: string;
  fileIndex: number;
  fileName: string;
  onClose: () => void;
}) {
  const [data, setData] = useState<CsvData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState("");
  const [sortCol, setSortCol] = useState<number | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(0);
  const [activeCol, setActiveCol] = useState<number | null>(null);

  const filterRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`/api/records/${recordId}/files/${fileIndex}/preview`)
      .then((r) => r.json())
      .then((d: CsvData & { error?: string }) => {
        if (d.error) { setError(d.error); return; }
        setData(d);
      })
      .catch(() => setError("Не вдалося завантажити файл."))
      .finally(() => setLoading(false));
  }, [recordId, fileIndex]);

  useEffect(() => {
    filterRef.current?.focus();
  }, []);

  const filtered = data
    ? data.rows.filter((row) =>
        filter === "" ||
        row.some((cell) => cell.toLowerCase().includes(filter.toLowerCase())),
      )
    : [];

  const sorted = sortCol !== null
    ? [...filtered].sort((a, b) => {
        const av = a[sortCol] ?? "";
        const bv = b[sortCol] ?? "";
        const numeric = data?.numericCols[sortCol];
        const cmp = numeric
          ? Number(av) - Number(bv)
          : av.localeCompare(bv, undefined, { numeric: true });
        return sortDir === "asc" ? cmp : -cmp;
      })
    : filtered;

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageRows = sorted.slice(
    safePage * PAGE_SIZE,
    (safePage + 1) * PAGE_SIZE,
  );

  const handleSort = useCallback(
    (ci: number) => {
      if (sortCol === ci) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortCol(ci);
        setSortDir("asc");
      }
    },
    [sortCol],
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      {/* ── Toolbar ──────────────────────────────────────────────────── */}
      <div className="flex shrink-0 items-center gap-3 border-b border-stone-200 bg-stone-950 px-4 py-3 text-white">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-indigo-600">
          <TableProperties className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-mono text-sm font-semibold text-white">
            {fileName}
          </p>
          {data && (
            <p className="font-mono text-[10px] text-stone-400">
              {data.rowCount.toLocaleString()} рядків · {data.headers.length} колонок
              {data.truncated && " · показано перші 2000"}
              {" · delimiter: "}{data.delimiter === "\t" ? "TAB" : data.delimiter}
            </p>
          )}
        </div>

        {/* Filter */}
        <div className="relative hidden sm:block">
          <input
            ref={filterRef}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Пошук по всіх колонках..."
            className="w-64 border border-stone-700 bg-stone-900 px-3 py-1.5 font-mono text-xs text-white placeholder:text-stone-500 focus:border-indigo-500 focus:outline-none"
          />
          {filter && (
            <button
              onClick={() => setFilter("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Download link */}
        <a
          href={`/api/records/${recordId}/files/${fileIndex}`}
          className="flex items-center gap-1.5 border border-stone-700 bg-stone-900 px-2.5 py-1.5 font-mono text-xs text-stone-300 transition hover:border-stone-500 hover:text-white"
        >
          <Download className="h-3.5 w-3.5" />
          CSV
        </a>

        <button
          onClick={onClose}
          className="flex h-8 w-8 shrink-0 items-center justify-center border border-stone-700 text-stone-400 transition hover:border-stone-500 hover:text-white"
          aria-label="Закрити перегляд"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* ── Active column stat bar ────────────────────────────────────── */}
      {data && activeCol !== null && data.stats[activeCol] && (
        <div className="flex shrink-0 items-center gap-6 border-b border-indigo-100 bg-indigo-50 px-4 py-2 font-mono text-xs text-indigo-800">
          <span className="font-semibold text-indigo-900">
            {data.headers[activeCol]}
          </span>
          <span>min: <b>{fmt(data.stats[activeCol]!.min)}</b></span>
          <span>max: <b>{fmt(data.stats[activeCol]!.max)}</b></span>
          <span>avg: <b>{fmt(data.stats[activeCol]!.avg)}</b></span>
          <span>n: <b>{data.stats[activeCol]!.count}</b></span>
          <button
            onClick={() => setActiveCol(null)}
            className="ml-auto text-indigo-400 hover:text-indigo-700"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* ── States ───────────────────────────────────────────────────── */}
      {loading && (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          <span className="ml-3 font-mono text-sm text-stone-500">Читаємо файл…</span>
        </div>
      )}

      {error && (
        <div className="flex flex-1 items-center justify-center">
          <p className="border border-rose-200 bg-rose-50 px-6 py-4 text-sm text-rose-700">
            {error}
          </p>
        </div>
      )}

      {/* ── Table ────────────────────────────────────────────────────── */}
      {data && !loading && (
        <div className="flex min-h-0 flex-1 flex-col">
          {/* Mobile filter */}
          <div className="shrink-0 px-4 py-2 sm:hidden">
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Пошук..."
              className="w-full border border-stone-300 bg-white px-3 py-1.5 text-xs focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Empty state */}
          {sorted.length === 0 ? (
            <div className="flex flex-1 items-center justify-center">
              <p className="font-mono text-sm text-stone-400">
                Нічого не знайдено за запитом «{filter}»
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-auto">
              <table className="w-full min-w-max border-collapse text-xs">
                {/* Row number + headers */}
                <thead className="sticky top-0 z-10">
                  <tr>
                    <th className="border-b-2 border-stone-800 bg-stone-950 px-3 py-2.5 text-left font-mono text-[10px] text-stone-500 select-none">
                      #
                    </th>
                    {data.headers.map((h, ci) => {
                      const isSort = sortCol === ci;
                      const isNumeric = data.numericCols[ci];
                      const hasStat = Boolean(data.stats[ci]);
                      return (
                        <th
                          key={ci}
                          className={`border-b-2 border-stone-800 bg-stone-950 px-3 py-2.5 text-left font-mono text-[11px] text-stone-200 select-none whitespace-nowrap ${
                            isSort ? "bg-indigo-900 text-indigo-200" : ""
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleSort(ci)}
                              className="flex items-center gap-1 hover:text-white"
                            >
                              <span>{h || `Col ${ci + 1}`}</span>
                              {isSort ? (
                                sortDir === "asc" ? (
                                  <ArrowUp className="h-3 w-3 text-indigo-400" />
                                ) : (
                                  <ArrowDown className="h-3 w-3 text-indigo-400" />
                                )
                              ) : (
                                <ArrowUpDown className="h-3 w-3 opacity-30" />
                              )}
                            </button>
                            {hasStat && (
                              <button
                                onClick={() =>
                                  setActiveCol(activeCol === ci ? null : ci)
                                }
                                className={`ml-0.5 border px-1 py-0 text-[9px] transition ${
                                  activeCol === ci
                                    ? "border-indigo-400 bg-indigo-500 text-white"
                                    : "border-stone-600 text-stone-400 hover:border-indigo-400 hover:text-indigo-300"
                                }`}
                                title="Статистика колонки"
                              >
                                ∑
                              </button>
                            )}
                            {isNumeric && (
                              <span className="border border-stone-700 px-1 text-[9px] text-stone-500">
                                123
                              </span>
                            )}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>

                <tbody>
                  {pageRows.map((row, ri) => {
                    const globalRow = safePage * PAGE_SIZE + ri;
                    return (
                      <tr
                        key={ri}
                        className={`transition ${
                          ri % 2 === 0
                            ? "bg-white hover:bg-indigo-50/60"
                            : "bg-stone-50 hover:bg-indigo-50/60"
                        }`}
                      >
                        <td className="border-b border-stone-100 px-3 py-1.5 font-mono text-[10px] text-stone-400 select-none">
                          {globalRow + 1}
                        </td>
                        {data.headers.map((_, ci) => {
                          const val = row[ci] ?? "";
                          const isNum = data.numericCols[ci];
                          return (
                            <td
                              key={ci}
                              className={`border-b border-stone-100 px-3 py-1.5 ${
                                isNum
                                  ? "text-right font-mono text-stone-700"
                                  : "text-stone-800"
                              } ${sortCol === ci ? "bg-indigo-50/40" : ""}`}
                            >
                              {isNum && val !== "" ? (
                                <span className="tabular-nums">{val}</span>
                              ) : (
                                val
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Pagination ─────────────────────────────────────────── */}
          {totalPages > 1 && (
            <div className="flex shrink-0 items-center justify-between gap-4 border-t border-stone-200 bg-white px-4 py-2.5">
              <span className="font-mono text-xs text-stone-500">
                {sorted.length.toLocaleString()} рядків
                {filter && ` (фільтр: «${filter}»)`}
                {" · "} сторінка {safePage + 1} з {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(0)}
                  disabled={safePage === 0}
                  className="border border-stone-300 px-2 py-1 font-mono text-xs text-stone-600 transition hover:border-indigo-400 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  «
                </button>
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={safePage === 0}
                  className="border border-stone-300 p-1 text-stone-600 transition hover:border-indigo-400 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                  const p = totalPages <= 7
                    ? i
                    : safePage < 4
                    ? i
                    : safePage > totalPages - 5
                    ? totalPages - 7 + i
                    : safePage - 3 + i;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`min-w-[28px] border px-2 py-1 font-mono text-xs transition ${
                        p === safePage
                          ? "border-indigo-600 bg-indigo-600 text-white"
                          : "border-stone-300 text-stone-600 hover:border-indigo-400 hover:text-indigo-700"
                      }`}
                    >
                      {p + 1}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={safePage === totalPages - 1}
                  className="border border-stone-300 p-1 text-stone-600 transition hover:border-indigo-400 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setPage(totalPages - 1)}
                  disabled={safePage === totalPages - 1}
                  className="border border-stone-300 px-2 py-1 font-mono text-xs text-stone-600 transition hover:border-indigo-400 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  »
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Trigger button (used from server component) ────────────────────────────────

export function CsvPreviewButton({
  recordId,
  fileIndex,
  fileName,
}: {
  recordId: string;
  fileIndex: number;
  fileName: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 font-mono text-[11px] font-semibold text-indigo-700 transition hover:border-indigo-400 hover:bg-indigo-100"
        title="Переглянути як таблицю"
      >
        <TableProperties className="h-3 w-3" />
        Таблиця
      </button>

      {open && (
        <CsvViewerPanel
          recordId={recordId}
          fileIndex={fileIndex}
          fileName={fileName}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
