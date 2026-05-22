import type { ComponentType } from "react";
import {
  Award,
  BookOpen,
  Briefcase,
  CalendarDays,
  ClipboardList,
  Coins,
  Compass,
  FileBadge,
  FileText,
  Flag,
  GraduationCap,
  Home,
  LayoutGrid,
  Lightbulb,
  ListChecks,
  Microscope,
  Mic,
  Rocket,
  Settings,
  Target,
  Trophy,
  User,
  Users,
} from "lucide-react";
import type { ItemType } from "@/lib/workspaces-meta";

export type TemplateId =
  | "bachelor" | "master" | "phd"
  | "grant" | "research"
  | "work" | "personal" | "empty"
  | "education";   // back-compat

export type HubTab =
  | "overview"      // grid items простору
  | "journal"       // електронний журнал (gradebook)
  | "calendar"      // зведений календар (sessions, deadlines, milestones)
  | "members"       // учасники простору
  | "thesis"        // кваліфікаційна робота (для bachelor/master)
  | "dissertation"  // дисертація (для phd)
  | "deliverables"  // результати гранту
  | "budget"        // бюджет (grant/work)
  | "timeline"      // хронологія дослідження
  | "publications"  // публікації
  | "settings";     // налаштування

export type WorkspaceFieldSpec = {
  key: string;
  label: { uk: string; en: string };
  type: "text" | "longtext" | "date" | "url" | "list" | "number" | "money" | "enum";
  enum?: { value: string; label: { uk: string; en: string } }[];
  placeholder?: string;
  icon?: ComponentType<{ className?: string }>;
};

export type WorkspaceFieldGroup = {
  titleUk: string;
  titleEn: string;
  fields: WorkspaceFieldSpec[];
};

export type TemplateConfig = {
  id: TemplateId;
  emoji: string;
  color: string;
  label: { uk: string; en: string };
  description: { uk: string; en: string };
  /** Вкладки, які hub показує (у порядку відображення). */
  tabs: HubTab[];
  /** Item-типи, які пропонувати як перші кроки в порожньому просторі. */
  suggestedItemTypes: ItemType[];
  /** Структуровані метаполя для самого простору (Workspace.fields). */
  fieldGroups: WorkspaceFieldGroup[];
};

const ACADEMIC_BASE_TABS: HubTab[] = ["overview", "journal", "calendar", "members"];

const ACADEMIC_FIELDS_INSTITUTION: WorkspaceFieldGroup = {
  titleUk: "Установа",
  titleEn: "Institution",
  fields: [
    { key: "university", label: { uk: "Університет",  en: "University" },  type: "text", icon: GraduationCap },
    { key: "faculty",    label: { uk: "Факультет",    en: "Faculty" },    type: "text", icon: Briefcase },
    { key: "department", label: { uk: "Кафедра",      en: "Department" }, type: "text", icon: Home },
    { key: "programName",label: { uk: "Програма",     en: "Program" },    type: "text", icon: FileBadge },
  ],
};

const ACADEMIC_FIELDS_PERIOD: WorkspaceFieldGroup = {
  titleUk: "Період навчання",
  titleEn: "Study period",
  fields: [
    { key: "studyForm", label: { uk: "Форма",     en: "Study form" }, type: "enum", icon: BookOpen,
      enum: [
        { value: "full_time", label: { uk: "Очна",    en: "Full-time" } },
        { value: "part_time", label: { uk: "Заочна",  en: "Part-time" } },
        { value: "distance",  label: { uk: "Дистанційна", en: "Distance" } },
      ],
    },
    { key: "studyStart", label: { uk: "Початок",     en: "Start" }, type: "date", icon: CalendarDays },
    { key: "studyEnd",   label: { uk: "Завершення",  en: "End" },   type: "date", icon: CalendarDays },
    { key: "groupName",  label: { uk: "Група",        en: "Group" }, type: "text", icon: Users },
  ],
};

const SUPERVISOR_FIELDS: WorkspaceFieldGroup = {
  titleUk: "Керівництво",
  titleEn: "Supervision",
  fields: [
    { key: "supervisor",      label: { uk: "Керівник",         en: "Supervisor" },      type: "text", icon: User },
    { key: "supervisorTitle", label: { uk: "Посада керівника", en: "Supervisor title" }, type: "text", icon: Award },
    { key: "supervisorOrcid", label: { uk: "ORCID керівника",  en: "Supervisor ORCID" }, type: "text", icon: FileBadge },
  ],
};

export const TEMPLATE_CONFIGS: Record<TemplateId, TemplateConfig> = {
  bachelor: {
    id: "bachelor",
    emoji: "🎓",
    color: "#059669",
    label: { uk: "Бакалаврат",      en: "Bachelor's" },
    description: {
      uk: "Простір для бакалаврського періоду навчання: курси, оцінки, кваліфікаційна робота.",
      en: "Bachelor's degree workspace: courses, grades, qualification paper.",
    },
    tabs: [...ACADEMIC_BASE_TABS, "thesis", "settings"],
    suggestedItemTypes: ["course", "bachelor", "individual_research"],
    fieldGroups: [
      ACADEMIC_FIELDS_INSTITUTION,
      ACADEMIC_FIELDS_PERIOD,
      SUPERVISOR_FIELDS,
      {
        titleUk: "Кваліфікаційна робота",
        titleEn: "Qualification paper",
        fields: [
          { key: "thesisTopic",    label: { uk: "Тема роботи",      en: "Topic" },          type: "text", icon: Target },
          { key: "defenseDate",    label: { uk: "Дата захисту",     en: "Defense date" },   type: "date", icon: CalendarDays },
          { key: "thesisAbstract", label: { uk: "Анотація",          en: "Abstract" },       type: "longtext", icon: FileText },
        ],
      },
    ],
  },
  master: {
    id: "master",
    emoji: "🎓",
    color: "#0369a1",
    label: { uk: "Магістратура",    en: "Master's" },
    description: {
      uk: "Магістерська програма: курси, дисертаційна робота, наукові публікації.",
      en: "Master's program: courses, thesis, scientific publications.",
    },
    tabs: [...ACADEMIC_BASE_TABS, "thesis", "publications", "settings"],
    suggestedItemTypes: ["course", "master", "individual_research", "open_science"],
    fieldGroups: [
      ACADEMIC_FIELDS_INSTITUTION,
      ACADEMIC_FIELDS_PERIOD,
      SUPERVISOR_FIELDS,
      {
        titleUk: "Магістерська робота",
        titleEn: "Master's thesis",
        fields: [
          { key: "thesisTopic",    label: { uk: "Тема",         en: "Topic" },         type: "text", icon: Target },
          { key: "defenseDate",    label: { uk: "Захист",       en: "Defense" },       type: "date", icon: CalendarDays },
          { key: "opponent",       label: { uk: "Опонент",      en: "Opponent" },      type: "text", icon: User },
          { key: "thesisAbstract", label: { uk: "Анотація",      en: "Abstract" },      type: "longtext", icon: FileText },
        ],
      },
    ],
  },
  phd: {
    id: "phd",
    emoji: "🎓",
    color: "#7c3aed",
    label: { uk: "Аспірантура",     en: "PhD program" },
    description: {
      uk: "PhD-програма: освітня частина (ECTS), дисертація, milestone, публікації.",
      en: "PhD program: coursework (ECTS), dissertation, milestones, publications.",
    },
    tabs: [...ACADEMIC_BASE_TABS, "dissertation", "publications", "timeline", "settings"],
    suggestedItemTypes: ["phd", "course", "laboratory", "open_science", "grant"],
    fieldGroups: [
      ACADEMIC_FIELDS_INSTITUTION,
      ACADEMIC_FIELDS_PERIOD,
      SUPERVISOR_FIELDS,
      {
        titleUk: "Дисертація",
        titleEn: "Dissertation",
        fields: [
          { key: "specialty",                  label: { uk: "Спеціальність",         en: "Specialty" },                type: "text",     icon: BookOpen, placeholder: "091, 222 …" },
          { key: "dissertationTitle",          label: { uk: "Тема дисертації",       en: "Dissertation title" },       type: "text",     icon: Target },
          { key: "dissertationApprovalDate",   label: { uk: "Затверджено",           en: "Approved on" },              type: "date",     icon: CalendarDays },
          { key: "dissertationApprovalProtocol", label: { uk: "№ протоколу",         en: "Protocol №" },               type: "text",     icon: FileBadge },
          { key: "totalCredits",                label: { uk: "Всього кредитів ECTS", en: "Total ECTS" },               type: "number",   icon: Award },
        ],
      },
    ],
  },
  grant: {
    id: "grant",
    emoji: "💰",
    color: "#d97706",
    label: { uk: "Грантовий проєкт", en: "Grant project" },
    description: {
      uk: "Грант: фінансування, дедлайни, deliverables, команда, бюджет.",
      en: "Grant: funding, deadlines, deliverables, team, budget.",
    },
    tabs: ["overview", "calendar", "deliverables", "budget", "members", "publications", "settings"],
    suggestedItemTypes: ["grant", "open_science", "laboratory"],
    fieldGroups: [
      {
        titleUk: "Фінансування",
        titleEn: "Funding",
        fields: [
          { key: "funderName",  label: { uk: "Фандер",        en: "Funder" },        type: "text",  icon: Award },
          { key: "funderType",  label: { uk: "Тип",           en: "Type" },          type: "enum",  icon: FileBadge,
            enum: [
              { value: "state",         label: { uk: "Державний",   en: "State" } },
              { value: "private",       label: { uk: "Приватний",   en: "Private" } },
              { value: "international", label: { uk: "Міжнародний", en: "International" } },
            ],
          },
          { key: "amount",      label: { uk: "Сума",     en: "Amount" },   type: "money", icon: Coins },
          { key: "currency",    label: { uk: "Валюта",   en: "Currency" }, type: "text",  icon: Coins, placeholder: "UAH" },
          { key: "grantNumber", label: { uk: "№ гранту", en: "Grant №" },  type: "text",  icon: FileBadge },
        ],
      },
      {
        titleUk: "Команда й терміни",
        titleEn: "Team & dates",
        fields: [
          { key: "principalInvestigator", label: { uk: "Головний дослідник", en: "Principal Investigator" }, type: "text", icon: Award },
          { key: "coInvestigators",       label: { uk: "Спів-дослідники",    en: "Co-investigators" },       type: "list", icon: Users },
          { key: "startDate",             label: { uk: "Старт",              en: "Start" },                   type: "date", icon: CalendarDays },
          { key: "endDate",               label: { uk: "Завершення",         en: "End" },                     type: "date", icon: CalendarDays },
        ],
      },
      {
        titleUk: "Цілі та результати",
        titleEn: "Goals & deliverables",
        fields: [
          { key: "objectives",   label: { uk: "Цілі",         en: "Objectives" }, type: "longtext", icon: Target },
          { key: "deliverables", label: { uk: "Deliverables", en: "Deliverables" }, type: "list",   icon: ListChecks },
        ],
      },
    ],
  },
  research: {
    id: "research",
    emoji: "🔬",
    color: "#0f766e",
    label: { uk: "Індивідуальне дослідження", en: "Individual research" },
    description: {
      uk: "Незалежний дослідник: ваші гіпотези, методологія, результати, публікації.",
      en: "Independent researcher: your hypotheses, methods, results, publications.",
    },
    tabs: ["overview", "timeline", "publications", "members", "settings"],
    suggestedItemTypes: ["individual_research", "open_science", "collaboration", "idea"],
    fieldGroups: [
      {
        titleUk: "Напрям",
        titleEn: "Field",
        fields: [
          { key: "researchField", label: { uk: "Галузь",      en: "Field" },         type: "text",   icon: Compass },
          { key: "researchType",  label: { uk: "Тип",          en: "Type" },         type: "enum",   icon: FileBadge,
            enum: [
              { value: "fundamental", label: { uk: "Фундаментальне", en: "Fundamental" } },
              { value: "applied",     label: { uk: "Прикладне",      en: "Applied" } },
              { value: "review",      label: { uk: "Огляд",          en: "Review" } },
            ],
          },
          { key: "hypothesis",   label: { uk: "Гіпотеза",     en: "Hypothesis" },    type: "longtext", icon: Lightbulb },
          { key: "methodology",  label: { uk: "Методологія",  en: "Methodology" },   type: "longtext", icon: FileText },
        ],
      },
    ],
  },
  work: {
    id: "work",
    emoji: "🏢",
    color: "#0369a1",
    label: { uk: "Робота", en: "Work" },
    description: {
      uk: "Професійна діяльність: лабораторії, проєкти, команда, бюджет.",
      en: "Professional work: labs, projects, team, budget.",
    },
    tabs: ["overview", "calendar", "members", "budget", "settings"],
    suggestedItemTypes: ["laboratory", "grant", "collaboration"],
    fieldGroups: [
      {
        titleUk: "Організація",
        titleEn: "Organization",
        fields: [
          { key: "employer",   label: { uk: "Роботодавець",  en: "Employer" },  type: "text", icon: Briefcase },
          { key: "position",   label: { uk: "Посада",         en: "Position" },  type: "text", icon: Award },
          { key: "department", label: { uk: "Підрозділ",      en: "Department" }, type: "text", icon: Home },
        ],
      },
    ],
  },
  personal: {
    id: "personal",
    emoji: "🏠",
    color: "#64748b",
    label: { uk: "Особистий", en: "Personal" },
    description: {
      uk: "Ваші особисті ідеї, читання, проєкти без чіткого контексту.",
      en: "Your personal ideas, reading, side projects.",
    },
    tabs: ["overview", "settings"],
    suggestedItemTypes: ["idea", "individual_research", "study_group"],
    fieldGroups: [],
  },
  empty: {
    id: "empty",
    emoji: "📋",
    color: "#64748b",
    label: { uk: "Порожній", en: "Empty" },
    description: {
      uk: "Чистий простір без шаблону. Налаштуйте під свій кейс.",
      en: "Empty workspace. Configure it your way.",
    },
    tabs: ["overview", "settings"],
    suggestedItemTypes: [],
    fieldGroups: [],
  },

  // Back-compat: старий "education" → працює як phd за замовч.
  education: {
    id: "education",
    emoji: "🎓",
    color: "#0369a1",
    label: { uk: "Освіта (legacy)", en: "Education (legacy)" },
    description: {
      uk: "Старий шаблон — спадщина. Створюйте окремі простори: bachelor / master / phd.",
      en: "Legacy template. Use bachelor / master / phd instead.",
    },
    tabs: [...ACADEMIC_BASE_TABS, "settings"],
    suggestedItemTypes: ["course", "phd", "master", "bachelor"],
    fieldGroups: [ACADEMIC_FIELDS_INSTITUTION, ACADEMIC_FIELDS_PERIOD],
  },
};

export function resolveTemplate(id: string | undefined): TemplateConfig {
  return TEMPLATE_CONFIGS[(id as TemplateId)] ?? TEMPLATE_CONFIGS.empty;
}

export function templateTabIcon(tab: HubTab): ComponentType<{ className?: string }> {
  const map: Record<HubTab, ComponentType<{ className?: string }>> = {
    overview: LayoutGrid,
    journal: ClipboardList,
    calendar: CalendarDays,
    members: Users,
    thesis: GraduationCap,
    dissertation: Trophy,
    deliverables: ListChecks,
    budget: Coins,
    timeline: Flag,
    publications: FileText,
    settings: Settings,
  };
  return map[tab];
}

export function templateTabLabel(tab: HubTab, locale: "uk" | "en"): string {
  const map: Record<HubTab, { uk: string; en: string }> = {
    overview:     { uk: "Огляд",            en: "Overview" },
    journal:      { uk: "Журнал",           en: "Journal" },
    calendar:     { uk: "Календар",         en: "Calendar" },
    members:      { uk: "Учасники",         en: "Members" },
    thesis:       { uk: "Кваліф. робота",   en: "Qual. paper" },
    dissertation: { uk: "Дисертація",       en: "Dissertation" },
    deliverables: { uk: "Результати",       en: "Deliverables" },
    budget:       { uk: "Бюджет",           en: "Budget" },
    timeline:     { uk: "Хронологія",       en: "Timeline" },
    publications: { uk: "Публікації",       en: "Publications" },
    settings:     { uk: "Налаштування",     en: "Settings" },
  };
  return map[tab][locale];
}
