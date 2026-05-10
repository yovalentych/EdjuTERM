// ── Research license registry ──────────────────────────────────────────────────
// Used across open-science updates, project records, and public display.

export interface License {
  id: string;
  /** Short label shown in badges */
  name: string;
  /** Full formal name */
  fullName: string;
  /** Human-readable summary in Ukrainian */
  summary: string;
  /** URL to the official license text */
  url: string;
  /** Tailwind classes for the badge */
  badgeClass: string;
  /** What is permitted */
  allows: ("share" | "adapt" | "commercial")[];
  /** What is required */
  requires: ("attribution" | "share_alike")[];
  /** What is forbidden */
  forbids: ("commercial" | "derivatives")[];
  /** Family grouping */
  family: "cc" | "odc" | "software" | "proprietary";
}

export const LICENSES: License[] = [
  // ── Creative Commons ──────────────────────────────────────────────────────
  {
    id: "cc0-1.0",
    name: "CC0 1.0",
    fullName: "Creative Commons Zero 1.0 Universal",
    summary: "Повна відмова від авторських прав. Будь-яке використання без обмежень.",
    url: "https://creativecommons.org/publicdomain/zero/1.0/",
    badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
    allows: ["share", "adapt", "commercial"],
    requires: [],
    forbids: [],
    family: "cc",
  },
  {
    id: "cc-by-4.0",
    name: "CC BY 4.0",
    fullName: "Creative Commons Attribution 4.0 International",
    summary: "Будь-яке використання дозволено за умови зазначення авторства.",
    url: "https://creativecommons.org/licenses/by/4.0/",
    badgeClass: "bg-blue-50 text-blue-800 border-blue-200",
    allows: ["share", "adapt", "commercial"],
    requires: ["attribution"],
    forbids: [],
    family: "cc",
  },
  {
    id: "cc-by-sa-4.0",
    name: "CC BY-SA 4.0",
    fullName: "Creative Commons Attribution-ShareAlike 4.0 International",
    summary: "Використання з авторством та розповсюдженням на тих самих умовах.",
    url: "https://creativecommons.org/licenses/by-sa/4.0/",
    badgeClass: "bg-blue-50 text-blue-800 border-blue-200",
    allows: ["share", "adapt", "commercial"],
    requires: ["attribution", "share_alike"],
    forbids: [],
    family: "cc",
  },
  {
    id: "cc-by-nc-4.0",
    name: "CC BY-NC 4.0",
    fullName: "Creative Commons Attribution-NonCommercial 4.0 International",
    summary: "Дозволено некомерційне використання з зазначенням авторства.",
    url: "https://creativecommons.org/licenses/by-nc/4.0/",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
    allows: ["share", "adapt"],
    requires: ["attribution"],
    forbids: ["commercial"],
    family: "cc",
  },
  {
    id: "cc-by-nd-4.0",
    name: "CC BY-ND 4.0",
    fullName: "Creative Commons Attribution-NoDerivatives 4.0 International",
    summary: "Поширення без змін з обов'язковим авторством. Похідні роботи заборонені.",
    url: "https://creativecommons.org/licenses/by-nd/4.0/",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
    allows: ["share", "commercial"],
    requires: ["attribution"],
    forbids: ["derivatives"],
    family: "cc",
  },
  {
    id: "cc-by-nc-sa-4.0",
    name: "CC BY-NC-SA 4.0",
    fullName: "Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International",
    summary: "Некомерційне використання з авторством і тими самими умовами поширення.",
    url: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
    badgeClass: "bg-orange-50 text-orange-800 border-orange-200",
    allows: ["share", "adapt"],
    requires: ["attribution", "share_alike"],
    forbids: ["commercial"],
    family: "cc",
  },
  {
    id: "cc-by-nc-nd-4.0",
    name: "CC BY-NC-ND 4.0",
    fullName: "Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International",
    summary: "Лише поширення без змін і в некомерційних цілях з авторством.",
    url: "https://creativecommons.org/licenses/by-nc-nd/4.0/",
    badgeClass: "bg-rose-50 text-rose-800 border-rose-200",
    allows: ["share"],
    requires: ["attribution"],
    forbids: ["commercial", "derivatives"],
    family: "cc",
  },
  // ── Open Data Commons ─────────────────────────────────────────────────────
  {
    id: "odbl-1.0",
    name: "ODbL 1.0",
    fullName: "Open Database License 1.0",
    summary: "Відкрита ліцензія для баз даних: атрибуція, поширення на тих самих умовах.",
    url: "https://opendatacommons.org/licenses/odbl/1-0/",
    badgeClass: "bg-teal-50 text-teal-800 border-teal-200",
    allows: ["share", "adapt", "commercial"],
    requires: ["attribution", "share_alike"],
    forbids: [],
    family: "odc",
  },
  {
    id: "odc-by-1.0",
    name: "ODC-BY 1.0",
    fullName: "Open Data Commons Attribution License 1.0",
    summary: "Відкрита база даних з обов'язковим зазначенням джерела.",
    url: "https://opendatacommons.org/licenses/by/1-0/",
    badgeClass: "bg-teal-50 text-teal-800 border-teal-200",
    allows: ["share", "adapt", "commercial"],
    requires: ["attribution"],
    forbids: [],
    family: "odc",
  },
  // ── Software ─────────────────────────────────────────────────────────────
  {
    id: "mit",
    name: "MIT",
    fullName: "MIT License",
    summary: "Дозвільна ліцензія для програмного коду. Зазначення авторства обов'язкове.",
    url: "https://opensource.org/licenses/MIT",
    badgeClass: "bg-violet-50 text-violet-800 border-violet-200",
    allows: ["share", "adapt", "commercial"],
    requires: ["attribution"],
    forbids: [],
    family: "software",
  },
  {
    id: "apache-2.0",
    name: "Apache 2.0",
    fullName: "Apache License 2.0",
    summary: "Дозвільна ліцензія для ПЗ з патентним захистом.",
    url: "https://www.apache.org/licenses/LICENSE-2.0",
    badgeClass: "bg-violet-50 text-violet-800 border-violet-200",
    allows: ["share", "adapt", "commercial"],
    requires: ["attribution"],
    forbids: [],
    family: "software",
  },
  // ── Proprietary ──────────────────────────────────────────────────────────
  {
    id: "all-rights-reserved",
    name: "All Rights Reserved",
    fullName: "Всі права захищені",
    summary: "Усі права захищені. Використання без письмового дозволу забороняється.",
    url: "",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-300",
    allows: [],
    requires: [],
    forbids: ["commercial", "derivatives"],
    family: "proprietary",
  },
];

export const LICENSE_MAP = Object.fromEntries(LICENSES.map((l) => [l.id, l]));

export function getLicense(id: string | null | undefined): License | null {
  if (!id) return null;
  return LICENSE_MAP[id] ?? null;
}

// Icons for allow/require/forbid attributes
export const ATTR_LABELS: Record<string, string> = {
  share: "Поширення",
  adapt: "Адаптація",
  commercial: "Комерційне",
  attribution: "Авторство",
  share_alike: "ShareAlike",
  derivatives: "Похідні",
};

export const LICENSE_FAMILIES: Record<License["family"], string> = {
  cc: "Creative Commons",
  odc: "Open Data Commons",
  software: "Ліцензії ПЗ",
  proprietary: "Всі права захищені",
};
