import "server-only";

const STOP_PREFIXES = [
  "анотація",
  "а нотація",
  "аудиторні",
  "всього",
  "галузь",
  "годин",
  "гарант",
  "загальна мета",
  "зав.",
  "змістовий модуль",
  "кількість",
  "курс ",
  "лекції",
  "місце",
  "м ісце",
  "назва теми",
  "н азва теми",
  "національна",
  "необхідні",
  "освітньо",
  "поточна редакція",
  "практичні",
  "профіль",
  "розробник",
  "самостійна робота",
  "семестр",
  "спеціальність",
  "статус",
  "ступінь",
  "теми ",
  "форма навчання",
];

function compactLine(value: string) {
  return value
    .replace(/[•●▪]/g, " ")
    .replace(/[|_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripNumbering(value: string) {
  return compactLine(value)
    .replace(/^\d{1,2}\s*[.)]?\s+/, "")
    .replace(/^(?:тема|topic)\s*\d{1,2}\s*[.):\-–—]?\s*/iu, "")
    .replace(/(?:\s+\d+(?:[.,]\d+)?){1,8}\s*$/u, "")
    .replace(/\s*[.;:,]\s*$/u, "")
    .trim();
}

function isTopicCandidate(value: string) {
  const line = compactLine(value);
  const lower = line.toLowerCase();
  if (line.length < 4 || line.length > 140) return false;
  if (!/[А-ЯІЇЄҐа-яіїєґA-Za-z]/u.test(line)) return false;
  if (/^--\s*\d+\s+of\s+\d+\s*--$/i.test(line)) return false;
  if (/^№|^з\/п$/iu.test(line)) return false;
  if (/https?:|@|www\.|ECTS|EКТС|e-mail/i.test(line)) return false;
  if (/^[А-ЯІЇЄҐA-Z]{1,4}\d+\b/u.test(line)) return false;
  if (STOP_PREFIXES.some((prefix) => lower.startsWith(prefix))) return false;
  if (lower.includes("компетентност") || lower.includes("результат") || lower.includes("літератур")) return false;
  return true;
}

function addTopic(list: string[], seen: Set<string>, raw: string) {
  const topic = stripNumbering(raw);
  const key = topic.toLowerCase();
  if (!isTopicCandidate(topic) || seen.has(key)) return;
  seen.add(key);
  list.push(topic);
}

export function extractSyllabusTopics(text: string, limit = 80): string[] {
  const lines = text
    .split(/\r?\n/)
    .map(compactLine)
    .filter(Boolean);

  const topics: string[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < lines.length && topics.length < limit; i++) {
    const line = lines[i];

    const numberedInline = line.match(/^\d{1,2}\s+(.+)$/u);
    if (numberedInline) {
      addTopic(topics, seen, line);
      continue;
    }

    if (/^\d{1,2}$/u.test(line)) {
      const parts: string[] = [];
      for (let j = i + 1; j < Math.min(lines.length, i + 4); j++) {
        const next = lines[j];
        if (/^\d{1,2}$/u.test(next) || /^[-–—•]/u.test(next)) break;
        if (/^(Л|Пр\/С|СР)\b/u.test(next)) break;
        if (/^(0|[1-9]\d*)(\s+(0|[1-9]\d*)){1,8}$/u.test(next)) break;
        if (!isTopicCandidate(next)) break;
        parts.push(next.replace(/(?:\s+\d+(?:[.,]\d+)?){1,8}\s*$/u, ""));
        const joined = parts.join(" ");
        if (joined.length > 18 || /(?:регрес|метод|даних|навчан|модел|проєкт|проект|кластер|валідац)/iu.test(joined)) break;
      }
      if (parts.length > 0) addTopic(topics, seen, parts.join(" "));
    }
  }

  return topics.slice(0, limit);
}
