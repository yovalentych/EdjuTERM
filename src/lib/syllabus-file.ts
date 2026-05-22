import "server-only";

import { createRequire } from "module";
import * as XLSX from "xlsx";

const MAX_TEXT_CHARS = 180_000;

function truncateText(text: string) {
  return text.replace(/\u0000/g, "").slice(0, MAX_TEXT_CHARS);
}

export async function extractTextFromSyllabusFile(file: File): Promise<string> {
  if (file.size > 20 * 1024 * 1024) {
    throw new Error("file_too_large");
  }

  const name = file.name.toLowerCase();
  const type = file.type;
  const buffer = Buffer.from(await file.arrayBuffer());

  if (type === "application/pdf" || name.endsWith(".pdf")) {
    const require = createRequire(import.meta.url);
    const pdfParse = require("pdf-parse/lib/pdf-parse.js") as (data: Buffer) => Promise<{ text: string }>;
    const result = await pdfParse(buffer);
    return truncateText(result.text);
  }

  if (
    type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    name.endsWith(".docx")
  ) {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return truncateText(result.value);
  }

  if (
    type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    name.endsWith(".xlsx") ||
    name.endsWith(".xls") ||
    name.endsWith(".csv")
  ) {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const text = workbook.SheetNames.map((sheetName) => {
      const sheet = workbook.Sheets[sheetName];
      return [`# ${sheetName}`, XLSX.utils.sheet_to_csv(sheet)].join("\n");
    }).join("\n\n");
    return truncateText(text);
  }

  if (type.startsWith("text/") || /\.(txt|md|rtf)$/i.test(name)) {
    return truncateText(buffer.toString("utf8"));
  }

  throw new Error("unsupported_file");
}
