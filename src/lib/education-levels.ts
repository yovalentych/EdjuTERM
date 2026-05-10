/**
 * Higher Education Levels and Academic Degrees of Ukraine
 * Based on: Law of Ukraine "On Higher Education" (2014, amended 2022)
 * Aligned with National Qualifications Framework (NQF) and EQF
 * Source: https://mon.gov.ua/osvita-2/vishcha-osvita-ta-osvita-doroslikh/rivni-vishchoi-osviti-ta-naukovi-stupeni
 */

export type EducationLevelCode =
  | "junior_bachelor"
  | "bachelor"
  | "master_professional"
  | "master_scientific"
  | "phd"
  | "doctor_arts"
  | "doctor_sciences"
  | "candidate_sciences";

export type EducationLevel = {
  code: EducationLevelCode;
  nqfLevel: number;
  name: string;
  shortName: string;
  ects?: string;
  legacy?: boolean;
};

export const EDUCATION_LEVELS: EducationLevel[] = [
  {
    code: "junior_bachelor",
    nqfLevel: 5,
    name: "Молодший бакалавр",
    shortName: "Молодший бакалавр",
    ects: "120 ЄКТС",
  },
  {
    code: "bachelor",
    nqfLevel: 6,
    name: "Бакалавр",
    shortName: "Бакалавр",
    ects: "180–240 ЄКТС",
  },
  {
    code: "master_professional",
    nqfLevel: 7,
    name: "Магістр (освітньо-професійна програма)",
    shortName: "Магістр (ОПП)",
    ects: "90–120 ЄКТС",
  },
  {
    code: "master_scientific",
    nqfLevel: 7,
    name: "Магістр (освітньо-наукова програма)",
    shortName: "Магістр (ОНП)",
    ects: "120 ЄКТС",
  },
  {
    code: "phd",
    nqfLevel: 8,
    name: "Доктор філософії",
    shortName: "PhD / ДФ",
    ects: "4 роки",
  },
  {
    code: "doctor_arts",
    nqfLevel: 8,
    name: "Доктор мистецтва",
    shortName: "ДМ",
    ects: "4 роки",
  },
  {
    code: "doctor_sciences",
    nqfLevel: 8,
    name: "Доктор наук",
    shortName: "Д.н.",
  },
  {
    code: "candidate_sciences",
    nqfLevel: 8,
    name: "Кандидат наук (до 2019 р.)",
    shortName: "Канд. наук",
    legacy: true,
  },
];

export const EDUCATION_LEVEL_BY_CODE = Object.fromEntries(
  EDUCATION_LEVELS.map((l) => [l.code, l]),
) as Record<EducationLevelCode, EducationLevel>;

export function getEducationLevelLabel(code: string): string {
  return EDUCATION_LEVEL_BY_CODE[code as EducationLevelCode]?.name ?? code;
}
