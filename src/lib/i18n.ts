import type { ProjectRecord } from "@/lib/schemas";

export const locales = ["uk", "en"] as const;
export type Locale = (typeof locales)[number];

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function getDictionary(locale: Locale) {
  return dictionaries[locale];
}

export const dictionaries = {
  uk: {
    localeName: "Українська",
    alternateLocaleName: "English",
    alternateLocale: "en",
    shell: {
      appName: "Менеджер гранту",
      projectShortName: "OpenLab 2027",
      eyebrow: "Операційна робота проєкту та докази відкритої науки",
      title: "Інформаційний проєкт грантової команди",
      databaseTarget: "Цільова база даних",
      databaseCollections:
        "MongoDB: записи, сирі файли, зразки, рішення, журнал змін",
      languageSwitch: "EN",
    },
    nav: {
      dashboard: "Панель",
      datasets: "Дані",
      protocols: "Протоколи",
      experiments: "Експерименти",
      outputs: "Результати",
      team: "Команда",
    },
    hero: {
      eyebrow: "Фундаментальна наука 2027-2029",
      title:
        "Коморбідна патологія, мієлоїдні клітини, RAGE та некодуючі РНК",
      git: "Git-репозиторій активний",
    },
    readiness: {
      title: "Готовність до відкритої науки",
      subtitle: "FAIR, DMP, протоколи, результати з DOI",
      items: {
        dmp: "План управління даними",
        protocols: "Реєстр протоколів",
        metadata: "Метадані наборів даних",
        repository: "Шлях до репозиторного релізу",
      },
    },
    sections: {
      stages: "Етапи дослідження",
      newRecord: "Новий запис проєкту",
      datasets: "Набори даних",
      protocols: "Протоколи",
      teamWork: "Робота команди",
      evidenceMatrix: "Матриця доказів",
      evidenceSubtitle:
        "Об'єкти проєкту, пов'язані з етапом, репозиторієм, доступом і відповідальним.",
      noRecords: "Записів ще немає",
    },
    metrics: {
      records: "Записи проєкту",
      recordsDetail: "дані, протоколи, задачі, результати",
      datasets: "Набори даних",
      datasetsDetail: "сирі та оброблені об'єкти даних",
      protocols: "Протоколи",
      protocolsDetail: "записи, готові до protocols.io",
      openReady: "Готові до відкриття",
      openReadyDetail: "відкриті або ембарговані записи",
    },
    form: {
      kind: "Тип",
      localId: "Локальний ID",
      title: "Назва",
      stage: "Етап",
      access: "Доступ",
      owner: "Відповідальний",
      repository: "Репозиторій",
      summary: "Опис",
      submit: "Додати запис",
      titlePlaceholder: "Набір даних qPCR експресії RAGE",
      ownerPlaceholder: "Відповідальний за дані",
      repositoryPlaceholder: "Zenodo",
      summaryPlaceholder:
        "Метадані, розташування сирих даних, зв'язок із протоколом, стан контролю якості.",
    },
    table: {
      id: "ID",
      title: "Назва",
      kind: "Тип",
      stage: "Етап",
      access: "Доступ",
      owner: "Відповідальний",
    },
    kinds: {
      dataset: "Набір даних",
      protocol: "Протокол",
      task: "Задача команди",
      output: "Результат",
      sample: "Набір зразків",
      risk: "Ризик",
    },
    access: {
      internal: "Внутрішній",
      open: "Відкритий",
      embargoed: "Під ембарго",
      restricted: "Обмежений",
    },
    statuses: {
      active: "Активний",
      planned: "Запланований",
      review: "На перегляді",
      released: "Опублікований",
      blocked: "Заблокований",
    },
    stageLabels: {
      "Stage 1": "Етап 1",
      "Stage 2": "Етап 2",
      "Stage 3": "Етап 3",
      Proposal: "Заявка",
    },
    stages: [
      {
        year: "2027",
        title: "Модель, клітинні системи, пошук кандидатів",
        focus:
          "Створення моделі, характеристика клітинних ліній, вплив глікозильованого альбуміну, RAGE і скринінг кандидатних некодуючих РНК.",
        status: "active",
      },
      {
        year: "2028",
        title: "Механізми та валідація",
        focus:
          "Мієлоїдні супресороподібні фенотипи, запальні функції, валідація експресії та набори даних, готові до аналізу.",
        status: "planned",
      },
      {
        year: "2029",
        title: "Втручання та релізи",
        focus:
          "Модуляція in vivo, фінальний аналіз, публікації, відкриті релізи даних/коду та підсумкова звітність.",
        status: "planned",
      },
    ],
    seedRecords: {
      "DATA-2027-001": {
        title: "Фізіологічні показники мишачої моделі коморбідності",
        owner: "Керівник експериментального блоку",
        repository: "Чернетка Zenodo",
        summary:
          "Артеріальний тиск, глюкоза, рандомізація, групи втручання та основні метадані моделі тварин.",
      },
      "DATA-2027-002": {
        title:
          "Характеристика клітинних ліній за впливу глікозильованого альбуміну",
        owner: "Керівник блоку клітинних культур",
        repository: "Чернетка Zenodo",
        summary:
          "Умови експозиції U-937 і RAW, експресія RAGE, функціональні показники та метадані контролю якості.",
      },
      "PROT-2027-001": {
        title:
          "Модель коморбідної артеріальної гіпертензії та цукрового діабету в мишей",
        owner: "Науковий керівник",
        repository: "protocols.io",
        summary:
          "Відтворення моделі, графік втручань, вікна вимірювань, гуманні кінцеві точки та зв'язок з етичним дозволом.",
      },
      "PROT-2027-003": {
        title: "Біоінформатичний скринінг кандидатних некодуючих РНК",
        owner: "Керівник аналізу",
        repository: "protocols.io",
        summary:
          "Джерела пошуку, критерії включення, пріоритизація мішеней, оцінювання доказів і відтворюваний журнал запитів.",
      },
      "TASK-2026-001": {
        title: "Затвердити акронім проєкту та правила найменування",
        owner: "Відповідальний за дані",
        repository: "Внутрішній простір",
        summary:
          "Обрати стабільний префікс для ID зразків, наборів даних, протоколів, релізів коду та репозиторних записів.",
      },
      "OUT-2029-002": {
        title: "Фінальний реліз даних і коду",
        owner: "Науковий керівник і відповідальний за дані",
        repository: "Zenodo",
        summary:
          "Фінальні валідовані набори даних, архів коду аналізу, метадані, протоколи, версія DMP і DOI-посилання.",
      },
    },
  },
  en: {
    localeName: "English",
    alternateLocaleName: "Українська",
    alternateLocale: "uk",
    shell: {
      appName: "Grant manager",
      projectShortName: "OpenLab 2027",
      eyebrow: "Project operations and open science evidence",
      title: "Information workspace for the grant team",
      databaseTarget: "Database target",
      databaseCollections:
        "MongoDB: records, raw files, samples, decisions, audit log",
      languageSwitch: "UK",
    },
    nav: {
      dashboard: "Dashboard",
      datasets: "Datasets",
      protocols: "Protocols",
      experiments: "Experiments",
      outputs: "Outputs",
      team: "Team",
    },
    hero: {
      eyebrow: "Fundamental science 2027-2029",
      title:
        "Comorbid pathology, myeloid cells, RAGE, and non-coding RNAs",
      git: "Git repository active",
    },
    readiness: {
      title: "Open science readiness",
      subtitle: "FAIR, DMP, protocols, DOI-ready outputs",
      items: {
        dmp: "Data management plan",
        protocols: "Protocol registry",
        metadata: "Dataset metadata",
        repository: "Repository release path",
      },
    },
    sections: {
      stages: "Research stages",
      newRecord: "New project record",
      datasets: "Datasets",
      protocols: "Protocols",
      teamWork: "Team work",
      evidenceMatrix: "Evidence matrix",
      evidenceSubtitle:
        "Project objects linked to stage, repository, access, and owner.",
      noRecords: "No records yet",
    },
    metrics: {
      records: "Project records",
      recordsDetail: "datasets, protocols, tasks, outputs",
      datasets: "Datasets",
      datasetsDetail: "raw and processed data objects",
      protocols: "Protocols",
      protocolsDetail: "protocols.io-ready records",
      openReady: "Open-ready",
      openReadyDetail: "open or embargoed records",
    },
    form: {
      kind: "Kind",
      localId: "Local ID",
      title: "Title",
      stage: "Stage",
      access: "Access",
      owner: "Owner",
      repository: "Repository",
      summary: "Summary",
      submit: "Add record",
      titlePlaceholder: "qPCR RAGE expression dataset",
      ownerPlaceholder: "Data steward",
      repositoryPlaceholder: "Zenodo",
      summaryPlaceholder:
        "Metadata, raw data location, protocol relation, quality-control status.",
    },
    table: {
      id: "ID",
      title: "Title",
      kind: "Kind",
      stage: "Stage",
      access: "Access",
      owner: "Owner",
    },
    kinds: {
      dataset: "Dataset",
      protocol: "Protocol",
      task: "Team task",
      output: "Output",
      sample: "Sample set",
      risk: "Risk",
    },
    access: {
      internal: "Internal",
      open: "Open",
      embargoed: "Embargoed",
      restricted: "Restricted",
    },
    statuses: {
      active: "Active",
      planned: "Planned",
      review: "In review",
      released: "Released",
      blocked: "Blocked",
    },
    stageLabels: {
      "Stage 1": "Stage 1",
      "Stage 2": "Stage 2",
      "Stage 3": "Stage 3",
      Proposal: "Proposal",
    },
    stages: [
      {
        year: "2027",
        title: "Model, cell systems, candidate search",
        focus:
          "Animal model setup, cell line characterization, glycated albumin exposure, RAGE and candidate non-coding RNA screening.",
        status: "active",
      },
      {
        year: "2028",
        title: "Mechanisms and validation",
        focus:
          "Myeloid suppressor-like phenotypes, inflammatory functions, expression validation, and analysis-ready datasets.",
        status: "planned",
      },
      {
        year: "2029",
        title: "Intervention and release",
        focus:
          "In vivo modulation, final analysis, publications, public dataset/code releases, and final reporting.",
        status: "planned",
      },
    ],
    seedRecords: {},
  },
} as const;

export type Dictionary = ReturnType<typeof getDictionary>;

export function localizeRecord(record: ProjectRecord, locale: Locale) {
  const seedRecords = dictionaries[locale].seedRecords as Record<
    string,
    Partial<
      Pick<ProjectRecord, "title" | "owner" | "repository" | "summary">
    >
  >;
  const localized = seedRecords[record.localId];

  return {
    ...record,
    title: localized?.title ?? record.title,
    owner: localized?.owner ?? record.owner,
    repository: localized?.repository ?? record.repository,
    summary: localized?.summary ?? record.summary,
  };
}

export function localizeStageLabel(stage: string, dictionary: Dictionary) {
  const labels = dictionary.stageLabels as Record<string, string>;
  return labels[stage] ?? stage;
}
