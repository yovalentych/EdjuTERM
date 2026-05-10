export type Institution = {
  name: string;
  shortName?: string;
  city?: string;
  type?: string;
};

// Types relevant for PhD / research contexts
const RELEVANT_TYPES = new Set([
  "Заклад вищої освіти",
  "Наукові інститути (установи)",
  "Заклад фахової передвищої освіти",
  "Заклад після дипломної освіти",
]);

// Minimal static fallback for when ЄДЕБО is unreachable
const FALLBACK: Institution[] = [
  { name: "Київський національний університет імені Тараса Шевченка", shortName: "КНУ", city: "м. Київ", type: "Заклад вищої освіти" },
  { name: "Національний технічний університет України «Київський політехнічний інститут імені Ігоря Сікорського»", shortName: "КПІ ім. Сікорського", city: "м. Київ", type: "Заклад вищої освіти" },
  { name: "Харківський національний університет імені В.Н. Каразіна", shortName: "ХНУ ім. Каразіна", city: "м. Харків", type: "Заклад вищої освіти" },
  { name: "Львівський національний університет імені Івана Франка", shortName: "ЛНУ ім. Франка", city: "м. Львів", type: "Заклад вищої освіти" },
];

type EdboRow = {
  university_name?: string | null;
  university_short_name?: string | null;
  university_name_en?: string | null;
  university_type_name?: string | null;
  katottg_name_u?: string | null;
  region_name_u?: string | null;
  close_date?: string | null;
};

let memCache: { data: Institution[]; ts: number } | null = null;
const CACHE_TTL_MS = 8 * 60 * 60 * 1000; // 8 h

function parseEdbo(raw: unknown): Institution[] {
  if (!Array.isArray(raw)) return [];
  return (raw as EdboRow[])
    .filter(
      (r) =>
        r.university_name &&
        !r.close_date &&
        r.university_type_name &&
        RELEVANT_TYPES.has(r.university_type_name),
    )
    .map((r) => ({
      name: r.university_name!,
      shortName: r.university_short_name || undefined,
      city: r.katottg_name_u || r.region_name_u || undefined,
      type: r.university_type_name || undefined,
    }));
}

export async function getInstitutions(): Promise<Institution[]> {
  if (memCache && Date.now() - memCache.ts < CACHE_TTL_MS) return memCache.data;

  try {
    const res = await fetch(
      "https://registry.edbo.gov.ua/api/universities/?exp=json",
      {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(10_000),
      },
    );
    if (!res.ok) throw new Error(`EDBO HTTP ${res.status}`);
    const raw = await res.json();
    const data = parseEdbo(raw);
    if (data.length < 10) throw new Error("EDBO returned too few results");
    memCache = { data, ts: Date.now() };
    return data;
  } catch {
    memCache = { data: FALLBACK, ts: Date.now() - CACHE_TTL_MS + 60_000 };
    return FALLBACK;
  }
}

export function searchInstitutions(list: Institution[], q: string): Institution[] {
  const lq = q.toLowerCase().trim();
  return list
    .filter(
      (i) =>
        i.name.toLowerCase().includes(lq) ||
        (i.shortName?.toLowerCase().includes(lq) ?? false) ||
        (i.city?.toLowerCase().includes(lq) ?? false),
    )
    .slice(0, 20);
}
