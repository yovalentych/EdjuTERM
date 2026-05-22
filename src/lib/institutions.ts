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

// Fallback — використовується коли ЄДЕБО API недоступне,
// а також як постійне доповнення для закладів що могли бути
// реорганізовані/перейменовані і випасти з ЄДЕБО.
const FALLBACK: Institution[] = [
  // ── Київ ──────────────────────────────────────────────────────────────────
  { name: "Київський національний університет імені Тараса Шевченка", shortName: "КНУ", city: "м. Київ", type: "Заклад вищої освіти" },
  { name: "Національний технічний університет України «Київський політехнічний інститут імені Ігоря Сікорського»", shortName: "КПІ ім. Сікорського", city: "м. Київ", type: "Заклад вищої освіти" },
  { name: "Національний університет «Києво-Могилянська академія»", shortName: "НаУКМА", city: "м. Київ", type: "Заклад вищої освіти" },
  { name: "Український державний університет імені Михайла Драгоманова", shortName: "УДУ ім. Драгоманова", city: "м. Київ", type: "Заклад вищої освіти" },
  { name: "Національний педагогічний університет імені М.П. Драгоманова", shortName: "НПУ ім. Драгоманова", city: "м. Київ", type: "Заклад вищої освіти" },
  { name: "Київський університет імені Бориса Грінченка", shortName: "КУБГ", city: "м. Київ", type: "Заклад вищої освіти" },
  { name: "Київський національний економічний університет імені Вадима Гетьмана", shortName: "КНЕУ", city: "м. Київ", type: "Заклад вищої освіти" },
  { name: "Національний медичний університет імені О. О. Богомольця", shortName: "НМУ ім. Богомольця", city: "м. Київ", type: "Заклад вищої освіти" },
  { name: "Київський національний лінгвістичний університет", shortName: "КНЛУ", city: "м. Київ", type: "Заклад вищої освіти" },
  { name: "Київський національний торговельно-економічний університет", shortName: "КНТЕУ", city: "м. Київ", type: "Заклад вищої освіти" },
  { name: "Національний авіаційний університет", shortName: "НАУ", city: "м. Київ", type: "Заклад вищої освіти" },
  { name: "Київський національний університет будівництва і архітектури", shortName: "КНУБА", city: "м. Київ", type: "Заклад вищої освіти" },
  { name: "Київський національний університет театру, кіно і телебачення імені І.К. Карпенка-Карого", shortName: "КНУТКТТ", city: "м. Київ", type: "Заклад вищої освіти" },
  // ── Харків ────────────────────────────────────────────────────────────────
  { name: "Харківський національний університет імені В. Н. Каразіна", shortName: "ХНУ ім. Каразіна", city: "м. Харків", type: "Заклад вищої освіти" },
  { name: "Національний університет «Харківський політехнічний інститут»", shortName: "НТУ «ХПІ»", city: "м. Харків", type: "Заклад вищої освіти" },
  { name: "Харківський національний медичний університет", shortName: "ХНМУ", city: "м. Харків", type: "Заклад вищої освіти" },
  { name: "Харківський національний університет радіоелектроніки", shortName: "НУРЕ", city: "м. Харків", type: "Заклад вищої освіти" },
  { name: "Харківський національний педагогічний університет імені Г. С. Сковороди", shortName: "ХНПУ ім. Сковороди", city: "м. Харків", type: "Заклад вищої освіти" },
  // ── Львів ─────────────────────────────────────────────────────────────────
  { name: "Національний університет «Львівська політехніка»", shortName: "Львівська політехніка", city: "м. Львів", type: "Заклад вищої освіти" },
  { name: "Львівський національний університет імені Івана Франка", shortName: "ЛНУ ім. Франка", city: "м. Львів", type: "Заклад вищої освіти" },
  { name: "Львівський національний медичний університет імені Данила Галицького", shortName: "ЛНМУ ім. Галицького", city: "м. Львів", type: "Заклад вищої освіти" },
  { name: "Український католицький університет", shortName: "УКУ", city: "м. Львів", type: "Заклад вищої освіти" },
  // ── Дніпро ────────────────────────────────────────────────────────────────
  { name: "Дніпровський національний університет імені Олеся Гончара", shortName: "ДНУ ім. Гончара", city: "м. Дніпро", type: "Заклад вищої освіти" },
  { name: "Дніпровська політехніка", shortName: "ДП", city: "м. Дніпро", type: "Заклад вищої освіти" },
  // ── Одеса ─────────────────────────────────────────────────────────────────
  { name: "Одеський національний університет імені І. І. Мечникова", shortName: "ОНУ ім. Мечникова", city: "м. Одеса", type: "Заклад вищої освіти" },
  { name: "Одеський національний медичний університет", shortName: "ОНМУ", city: "м. Одеса", type: "Заклад вищої освіти" },
  { name: "Одеська національна морська академія", shortName: "ОНМА", city: "м. Одеса", type: "Заклад вищої освіти" },
  // ── Інші регіони ──────────────────────────────────────────────────────────
  { name: "Чернівецький національний університет імені Юрія Федьковича", shortName: "ЧНУ ім. Федьковича", city: "м. Чернівці", type: "Заклад вищої освіти" },
  { name: "Сумський державний університет", shortName: "СумДУ", city: "м. Суми", type: "Заклад вищої освіти" },
  { name: "Ужгородський національний університет", shortName: "УжНУ", city: "м. Ужгород", type: "Заклад вищої освіти" },
  { name: "Запорізький національний університет", shortName: "ЗНУ", city: "м. Запоріжжя", type: "Заклад вищої освіти" },
  { name: "Тернопільський національний технічний університет імені Івана Пулюя", shortName: "ТНТУ ім. Пулюя", city: "м. Тернопіль", type: "Заклад вищої освіти" },
  { name: "Вінницький національний технічний університет", shortName: "ВНТУ", city: "м. Вінниця", type: "Заклад вищої освіти" },
  { name: "Полтавський національний технічний університет імені Юрія Кондратюка", shortName: "ПНТУ ім. Кондратюка", city: "м. Полтава", type: "Заклад вищої освіти" },
  { name: "Житомирський державний університет імені Івана Франка", shortName: "ЖДУ ім. Франка", city: "м. Житомир", type: "Заклад вищої освіти" },
  { name: "Херсонський державний університет", shortName: "ХДУ", city: "м. Херсон", type: "Заклад вищої освіти" },
  { name: "Національний університет «Острозька академія»", shortName: "НаУОА", city: "м. Острог", type: "Заклад вищої освіти" },
  { name: "Прикарпатський національний університет імені Василя Стефаника", shortName: "ПНУ ім. Стефаника", city: "м. Івано-Франківськ", type: "Заклад вищої освіти" },
  { name: "Чернігівський національний технологічний університет", shortName: "ЧНТУ", city: "м. Чернігів", type: "Заклад вищої освіти" },
  // ── Наукові інститути НАН України ─────────────────────────────────────────
  { name: "Інститут фізіології ім. О. О. Богомольця НАН України", shortName: "ІФБ НАНУ", city: "м. Київ", type: "Наукові інститути (установи)" },
  { name: "Інститут молекулярної біології і генетики НАН України", shortName: "ІМБГ НАНУ", city: "м. Київ", type: "Наукові інститути (установи)" },
  { name: "Інститут біохімії ім. О. В. Палладіна НАН України", shortName: "ІБХ НАНУ", city: "м. Київ", type: "Наукові інститути (установи)" },
  { name: "Інститут клітинної біології та генетичної інженерії НАН України", shortName: "ІКБГІ НАНУ", city: "м. Київ", type: "Наукові інститути (установи)" },
  { name: "Інститут мікробіології і вірусології ім. Д. К. Заболотного НАН України", shortName: "ІМВ НАНУ", city: "м. Київ", type: "Наукові інститути (установи)" },
  { name: "Інститут фізики НАН України", shortName: "ІФ НАНУ", city: "м. Київ", type: "Наукові інститути (установи)" },
  { name: "Інститут математики НАН України", shortName: "ІМ НАНУ", city: "м. Київ", type: "Наукові інститути (установи)" },
  { name: "Інститут кібернетики ім. В. М. Глушкова НАН України", shortName: "ІК НАНУ", city: "м. Київ", type: "Наукові інститути (установи)" },
  { name: "Інститут хімії поверхні ім. О. О. Чуйка НАН України", shortName: "ІХП НАНУ", city: "м. Київ", type: "Наукові інститути (установи)" },
  { name: "Фізико-технічний інститут низьких температур ім. Б. І. Вєркіна НАН України", shortName: "ФТІНТ НАНУ", city: "м. Харків", type: "Наукові інститути (установи)" },
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

const CACHE_TTL_MS = 8 * 60 * 60 * 1000; // 8 h

// Use globalThis so the cache survives Next.js HMR module reloads in dev.
const g = globalThis as typeof globalThis & {
  __institutionsCache?: { data: Institution[]; ts: number } | null;
  __institutionsFetching?: Promise<Institution[]> | null;
};
function getMemCache() { return g.__institutionsCache ?? null; }
function setMemCache(c: { data: Institution[]; ts: number }) { g.__institutionsCache = c; }

// Порогова дата: заклади закриті раніше цього року — не показуємо.
// Реорганізовані нещодавно (≤4 роки тому) — лишаємо, бо студенти
// ще навчаються або отримують дипломи від них.
const CLOSE_DATE_THRESHOLD = new Date();
CLOSE_DATE_THRESHOLD.setFullYear(CLOSE_DATE_THRESHOLD.getFullYear() - 4);

function parseEdbo(raw: unknown): Institution[] {
  if (!Array.isArray(raw)) return [];
  return (raw as EdboRow[])
    .filter((r) => {
      if (!r.university_name) return false;
      if (!r.university_type_name || !RELEVANT_TYPES.has(r.university_type_name)) return false;
      // Allow recently reorganized institutions (closed within last 4 years).
      if (r.close_date) {
        const closed = new Date(r.close_date);
        if (!isNaN(closed.getTime()) && closed < CLOSE_DATE_THRESHOLD) return false;
      }
      return true;
    })
    .map((r) => ({
      name: r.university_name!,
      shortName: r.university_short_name || undefined,
      city: r.katottg_name_u || r.region_name_u || undefined,
      type: r.university_type_name || undefined,
    }));
}

export async function getInstitutions(): Promise<Institution[]> {
  const cached = getMemCache();
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) return cached.data;

  // Deduplicate concurrent calls — return the in-flight promise if one exists.
  if (g.__institutionsFetching) return g.__institutionsFetching;

  const promise = (async () => {
    try {
      const res = await fetch(
        "https://registry.edbo.gov.ua/api/universities/?exp=json",
        {
          headers: { Accept: "application/json" },
          signal: AbortSignal.timeout(10_000),
        },
      );
      if (!res.ok) throw new Error(`EDBO HTTP ${res.status}`);
      const raw  = await res.json();
      const edbo = parseEdbo(raw);
      if (edbo.length < 10) throw new Error("EDBO returned too few results");
      // Merge FALLBACK into EDBO — guarantees known institutions are always present
      // even if EDBO filtered them out (renamed, close_date edge cases, etc.)
      const edboNames = new Set(edbo.map((i) => i.name.toLowerCase().trim()));
      const extra = FALLBACK.filter((f) => !edboNames.has(f.name.toLowerCase().trim()));
      const data  = [...edbo, ...extra];
      setMemCache({ data, ts: Date.now() });
      return data;
    } catch {
      // Keep fallback in cache for 5 min before retrying EDBO.
      setMemCache({ data: FALLBACK, ts: Date.now() - CACHE_TTL_MS + 5 * 60_000 });
      return FALLBACK;
    } finally {
      g.__institutionsFetching = null;
    }
  })();

  g.__institutionsFetching = promise;
  return promise;
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
