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
      projectShortName: "Grant Manager",
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
    public: {
      eyebrow: "Публічна сторінка дослідницького проєкту",
      title: "Платформа для менеджменту гранту та відкритої науки",
      summary:
        "Публічна частина показує опис проєкту, а робочі дані, протоколи, задачі й сирі експериментальні матеріали доступні тільки зареєстрованим користувачам.",
      login: "Увійти",
      register: "Зареєструватися",
      privateArea: "Приватний робочий простір",
      privateText:
        "Після входу команда працює з наборами даних, протоколами, зразками, результатами, рішеннями та репозиторними релізами.",
      rolesTitle: "Ролі",
      admin: "Адмін: повний доступ для розробника.",
      supervisor:
        "Керівник проєкту: створює власний проєкт або призначається адміном.",
      member: "Член проєкту: працює всередині призначених проєктів.",
      user: "Користувач: базова роль після реєстрації.",
    },
    auth: {
      loginTitle: "Вхід",
      registerTitle: "Реєстрація",
      firstName: "Ім'я",
      lastName: "Прізвище",
      firstNameLatin: "Ім'я латинкою",
      lastNameLatin: "Прізвище латинкою",
      email: "Ел. пошта",
      password: "Пароль",
      loginSubmit: "Увійти",
      registerSubmit: "Створити акаунт",
      haveAccount: "Вже маєте акаунт?",
      needAccount: "Потрібен акаунт?",
      invalidError: "Перевірте введені дані.",
      existsError: "Користувач із таким email вже існує.",
      serverError: "Не вдалося виконати дію. Спробуйте ще раз.",
      logout: "Вийти",
    },
    projects: {
      newTitle: "Створити проєкт",
      title: "Назва проєкту",
      acronym: "Акронім",
      summary: "Опис",
      submit: "Створити проєкт",
      current: "Мої проєкти",
      none: "Проєктів ще немає",
      createHint:
        "Звичайний користувач стане керівником проєкту після створення власного проєкту.",
      newProject: "Новий проєкт",
    },
    roles: {
      admin: "Адмін",
      supervisor: "Керівник проєкту",
      member: "Член проєкту",
      user: "Користувач",
    },
    hero: {
      eyebrow: "Приватний робочий простір",
      title: "Менеджмент проєктів, даних, протоколів і результатів",
      git: "Git-репозиторій активний",
    },
    sections: {
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
      titlePlaceholder: "Назва запису",
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
  },
  en: {
    localeName: "English",
    alternateLocaleName: "Українська",
    alternateLocale: "uk",
    shell: {
      appName: "Grant manager",
      projectShortName: "Grant Manager",
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
    public: {
      eyebrow: "Public research project page",
      title: "Platform for grant management and open science",
      summary:
        "The public area presents the project, while working data, protocols, tasks, and raw experimental materials are available only to registered users.",
      login: "Log in",
      register: "Register",
      privateArea: "Private workspace",
      privateText:
        "After login, the team works with datasets, protocols, samples, outputs, decisions, and repository releases.",
      rolesTitle: "Roles",
      admin: "Admin: full developer access.",
      supervisor:
        "Project supervisor: creates an own project or is assigned by an admin.",
      member: "Project member: works inside assigned projects.",
      user: "User: default role after registration.",
    },
    auth: {
      loginTitle: "Log in",
      registerTitle: "Register",
      firstName: "First name",
      lastName: "Last name",
      firstNameLatin: "First name in Latin script",
      lastNameLatin: "Last name in Latin script",
      email: "Email",
      password: "Password",
      loginSubmit: "Log in",
      registerSubmit: "Create account",
      haveAccount: "Already have an account?",
      needAccount: "Need an account?",
      invalidError: "Check the entered data.",
      existsError: "A user with this email already exists.",
      serverError: "The action failed. Try again.",
      logout: "Log out",
    },
    projects: {
      newTitle: "Create project",
      title: "Project title",
      acronym: "Acronym",
      summary: "Summary",
      submit: "Create project",
      current: "My projects",
      none: "No projects yet",
      createHint:
        "A regular user becomes project supervisor after creating an own project.",
      newProject: "New project",
    },
    roles: {
      admin: "Admin",
      supervisor: "Project supervisor",
      member: "Project member",
      user: "User",
    },
    hero: {
      eyebrow: "Private workspace",
      title: "Project, data, protocol, and output management",
      git: "Git repository active",
    },
    sections: {
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
      titlePlaceholder: "Record title",
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
  },
} as const;

export type Dictionary = ReturnType<typeof getDictionary>;

export function localizeStageLabel(stage: string, dictionary: Dictionary) {
  const labels = dictionary.stageLabels as Record<string, string>;
  return labels[stage] ?? stage;
}
