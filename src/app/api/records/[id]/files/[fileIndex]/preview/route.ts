import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { readStoredFile } from "@/lib/file-storage";
import { getProjectForUser } from "@/lib/projects";
import {
  getProjectRecordByFileStorageUri,
  getProjectRecordById,
} from "@/lib/repositories";

const MAX_ROWS = 2_000;
const MAX_JSON_CHARS = 120_000;

// ── CSV / TSV parser ──────────────────────────────────────────────────────────

function detectDelimiter(firstLine: string): string {
  const c: Record<string, number> = { ",": 0, ";": 0, "\t": 0, "|": 0 };
  for (const ch of firstLine) if (ch in c) c[ch]++;
  return Object.entries(c).sort((a, b) => b[1] - a[1])[0][0];
}

function parseCSV(text: string, delim: string): string[][] {
  const content = text.startsWith("\ufeff") ? text.slice(1) : text;
  const rows: string[][] = [];
  let i = 0;
  while (i < content.length) {
    const row: string[] = [];
    while (i < content.length && content[i] !== "\n" && content[i] !== "\r") {
      if (content[i] === '"') {
        i++;
        let f = "";
        while (i < content.length) {
          if (content[i] === '"' && content[i + 1] === '"') { f += '"'; i += 2; }
          else if (content[i] === '"') { i++; break; }
          else f += content[i++];
        }
        row.push(f);
        if (content[i] === delim) i++;
      } else {
        let f = "";
        while (i < content.length && content[i] !== delim && content[i] !== "\n" && content[i] !== "\r")
          f += content[i++];
        row.push(f.trim());
        if (content[i] === delim) i++;
      }
    }
    if (content[i] === "\r") i++;
    if (content[i] === "\n") i++;
    if (row.length > 1 || (row.length === 1 && row[0] !== "")) rows.push(row);
    if (rows.length >= MAX_ROWS + 1) break;
  }
  return rows;
}

// ── Column stats ──────────────────────────────────────────────────────────────

const NULL_TOKENS = new Set(["", "na", "n/a", "null", "none", "nan", "-", "nd", "undefined"]);

function isNullToken(v: string) { return NULL_TOKENS.has(v.toLowerCase().trim()); }

interface ColStat { min: number; max: number; avg: number; count: number; missing: number; }

function colStats(dataRows: string[][], ci: number): ColStat | null {
  let missing = 0;
  const vals: number[] = [];
  for (const row of dataRows) {
    const v = row[ci] ?? "";
    if (isNullToken(v)) { missing++; continue; }
    const n = Number(v);
    if (!Number.isNaN(n)) vals.push(n);
  }
  if (vals.length === 0) return null;
  const sum = vals.reduce((a, b) => a + b, 0);
  return { min: Math.min(...vals), max: Math.max(...vals), avg: sum / vals.length, count: vals.length, missing };
}

function detectNumericCols(headers: string[], dataRows: string[][]): boolean[] {
  return headers.map((_, ci) => {
    const sample = dataRows.slice(0, 100).map(r => r[ci] ?? "").filter(v => !isNullToken(v));
    if (sample.length === 0) return false;
    const numCount = sample.filter(v => !Number.isNaN(Number(v))).length;
    return numCount / sample.length > 0.8;
  });
}

// ── Sheet builder (shared for CSV and XLSX) ───────────────────────────────────

function buildSheet(headers: string[], allRows: string[][], totalDataRows: number) {
  const dataRows = allRows.slice(0, MAX_ROWS);
  const numericCols = detectNumericCols(headers, dataRows);
  const stats = headers.map((_, ci) => numericCols[ci] ? colStats(dataRows, ci) : null);
  return { headers, rows: dataRows, rowCount: totalDataRows, truncated: totalDataRows > MAX_ROWS, numericCols, stats };
}

// ── GET handler ───────────────────────────────────────────────────────────────

export async function GET(
  req: Request,
  { params }: { params: Promise<unknown> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, fileIndex } = await params as { id: string; fileIndex: string };
  const url = new URL(req.url);
  const storageUri = url.searchParams.get("storageUri") ?? "";
  const record =
    (await getProjectRecordById(id)) ??
    (storageUri ? await getProjectRecordByFileStorageUri(storageUri) : null);

  if (!record) {
    return NextResponse.json({
      error: "Запис даних не знайдено. Онови сторінку або перевір, чи запис не був видалений.",
    });
  }

  const project = await getProjectForUser(record.projectId, user);
  if (!project) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const idx = Number.parseInt(fileIndex, 10);
  const fileFromIndex = Number.isInteger(idx) ? record.rawDataFiles[idx] : null;
  const fileFromStorageUri = storageUri
    ? record.rawDataFiles.find((candidate) => candidate.storageUri === storageUri)
    : null;
  const file = fileFromStorageUri ?? fileFromIndex;

  if (!file) {
    return NextResponse.json({
      error: "Файл не знайдено в записі. Ймовірно, список файлів застарів після оновлення запису.",
    });
  }

  let fileBuffer: Buffer;
  try {
    fileBuffer = await readStoredFile(file.storageUri);
  } catch {
    return NextResponse.json({
      error: "Файл є в записі, але об'єкт не вдалося прочитати зі сховища. Перевір R2/local storage або перезавантаж файл.",
    });
  }

  const nameLower = file.name.toLowerCase();
  const mime = file.mimeType ?? "";

  // ── CSV / TSV ─────────────────────────────────────────────────────────────
  const isCSV =
    nameLower.endsWith(".csv") || nameLower.endsWith(".tsv") ||
    mime === "text/csv" || mime === "application/csv" || mime === "text/tab-separated-values";

  if (isCSV) {
    const raw = fileBuffer.toString("utf-8");
    const firstLine = raw.split("\n")[0] ?? "";
    const delim = nameLower.endsWith(".tsv") ? "\t" : detectDelimiter(firstLine);
    const allParsed = parseCSV(raw, delim);
    if (allParsed.length === 0)
      return NextResponse.json({ fileType: "csv", delimiter: delim, fileName: file.name, sheets: [] });
    const headers = allParsed[0];
    const dataRows = allParsed.slice(1);
    const sheet = buildSheet(headers, dataRows, dataRows.length);
    return NextResponse.json({
      fileType: "csv",
      fileName: file.name,
      delimiter: delim === "\t" ? "TAB" : delim,
      sheets: [{ name: "Sheet1", ...sheet }],
    });
  }

  // ── Excel / ODS ───────────────────────────────────────────────────────────
  const isExcel =
    nameLower.endsWith(".xlsx") || nameLower.endsWith(".xls") ||
    nameLower.endsWith(".xlsm") || nameLower.endsWith(".ods") ||
    mime === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    mime === "application/vnd.ms-excel";

  if (isExcel) {
    const { read, utils } = await import("xlsx");
    const wb = read(fileBuffer, { type: "buffer", cellDates: true, dense: false });

    const sheets = wb.SheetNames.map((sheetName) => {
      const ws = wb.Sheets[sheetName];
      if (!ws) return { name: sheetName, headers: [], rows: [], rowCount: 0, truncated: false, numericCols: [], stats: [] };
      const aoa: unknown[][] = utils.sheet_to_json(ws, { header: 1, raw: false, dateNF: "YYYY-MM-DD" });
      if (aoa.length === 0) return { name: sheetName, headers: [], rows: [], rowCount: 0, truncated: false, numericCols: [], stats: [] };
      const headers = (aoa[0] as unknown[]).map((h) => String(h ?? ""));
      const dataRows = (aoa.slice(1) as unknown[][]).map((row) =>
        headers.map((_, ci) => {
          const v = row[ci];
          if (v === null || v === undefined) return "";
          return String(v);
        })
      );
      const s = buildSheet(headers, dataRows, dataRows.length);
      return { name: sheetName, ...s };
    });

    return NextResponse.json({ fileType: "excel", fileName: file.name, sheets });
  }

  // ── JSON ──────────────────────────────────────────────────────────────────
  const isJSON =
    nameLower.endsWith(".json") || nameLower.endsWith(".jsonl") ||
    nameLower.endsWith(".geojson") || mime === "application/json";

  if (isJSON) {
    const raw = fileBuffer.toString("utf-8");
    const isJSONL = nameLower.endsWith(".jsonl");
    const truncated = raw.length > MAX_JSON_CHARS;
    const slice = truncated ? raw.slice(0, MAX_JSON_CHARS) : raw;

    if (isJSONL) {
      const lines = slice.split("\n").filter(Boolean);
      const records: unknown[] = [];
      const errors: number[] = [];
      lines.forEach((line, i) => {
        try { records.push(JSON.parse(line)); }
        catch { errors.push(i + 1); }
      });
      // If all records are flat objects → table mode
      if (records.length > 0 && typeof records[0] === "object" && !Array.isArray(records[0])) {
        const headers = Object.keys(records[0] as object);
        const dataRows = records.map(r => headers.map(h => {
          const v = (r as Record<string, unknown>)[h];
          return v === null || v === undefined ? "" : String(v);
        }));
        const sheet = buildSheet(headers, dataRows, dataRows.length);
        return NextResponse.json({
          fileType: "jsonl-table",
          fileName: file.name,
          truncated,
          parseErrors: errors.length,
          sheets: [{ name: "Records", ...sheet }],
        });
      }
      return NextResponse.json({ fileType: "jsonl", fileName: file.name, truncated, parseErrors: errors.length, lineCount: lines.length, preview: slice });
    }

    try {
      const parsed = JSON.parse(raw);
      // Array of flat objects → table
      if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === "object" && !Array.isArray(parsed[0])) {
        const headers = Object.keys(parsed[0] as object);
        const dataRows = parsed.map((r: Record<string, unknown>) =>
          headers.map(h => { const v = r[h]; return v === null || v === undefined ? "" : String(v); })
        );
        const sheet = buildSheet(headers, dataRows, dataRows.length);
        return NextResponse.json({
          fileType: "json-table",
          fileName: file.name,
          truncated,
          sheets: [{ name: "Array", ...sheet }],
        });
      }
      return NextResponse.json({ fileType: "json", fileName: file.name, truncated, preview: JSON.stringify(parsed, null, 2).slice(0, MAX_JSON_CHARS) });
    } catch {
      return NextResponse.json({ fileType: "json", fileName: file.name, truncated, preview: slice, parseError: true });
    }
  }

  // ── Plain text ────────────────────────────────────────────────────────────
  const isText =
    nameLower.endsWith(".txt") || nameLower.endsWith(".md") ||
    nameLower.endsWith(".r") || nameLower.endsWith(".py") ||
    nameLower.endsWith(".m") || nameLower.endsWith(".log") ||
    nameLower.endsWith(".xml") || nameLower.endsWith(".yaml") ||
    nameLower.endsWith(".yml") || nameLower.endsWith(".ini") ||
    (mime.startsWith("text/") && !isCSV);

  if (isText) {
    const raw = fileBuffer.toString("utf-8");
    const truncated = raw.length > MAX_JSON_CHARS;
    const ext = nameLower.split(".").pop() ?? "txt";
    return NextResponse.json({ fileType: "text", fileName: file.name, language: ext, truncated, content: raw.slice(0, MAX_JSON_CHARS) });
  }

  return NextResponse.json({ error: "Preview not available for this file type" }, { status: 415 });
}
