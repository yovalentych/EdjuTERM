// Workspace / Items concept — universal taxonomy for academic projects.
// 12 типів у 3 категоріях. Кожен тип має емодзі, колір, описи, дефолтну видимість.

export type ItemCategory = "personal" | "institutional" | "initiative";
export type ItemKind = "learning" | "project";

export const LEARNING_TYPES: ItemType[] = ["bachelor", "master", "phd"];
export const PROJECT_TYPES: ItemType[] = [
  "individual_research", "laboratory", "course", "grant",
  "collaboration", "study_group", "seminar", "open_science", "idea",
];

export function getItemKind(type: ItemType): ItemKind {
  return (LEARNING_TYPES as string[]).includes(type) ? "learning" : "project";
}

export type ItemType =
  // Personal (приватні за замовч.)
  | "bachelor"
  | "master"
  | "phd"
  | "individual_research"
  // Institutional (видно інституції)
  | "laboratory"
  | "course"
  | "grant"
  // Private initiatives (public discoverable)
  | "collaboration"
  | "study_group"
  | "seminar"
  | "open_science"
  | "idea";

export type ItemVisibility = "private" | "institutional" | "public";
export type ItemStatus    = "draft" | "active" | "paused" | "completed" | "archived";

export type ItemRelationType =
  | "parent_of"
  | "funded_by"
  | "uses_protocol"
  | "member_of"
  | "references"
  | "derived_from"
  | "contributes_to";

export type ItemTypeMeta = {
  type: ItemType;
  label: string;
  labelPlural: string;
  emoji: string;
  color: string;
  kind: ItemKind;
  category: ItemCategory;
  defaultVisibility: ItemVisibility;
  description: string;
  detailBlock: "lab" | "phd" | "thesis" | "course" | "grant" | "seminar" | "open_science" | "study_group" | "collaboration" | "idea" | "research" | "generic";
};

export const CATEGORY_META: Record<ItemCategory, { label: string; description: string; color: string; emoji: string }> = {
  personal:      { label: "Особисті",      description: "Дипломні, дисертація, індивідуальні дослідження", color: "#0f766e", emoji: "🎓" },
  institutional: { label: "Інституційні",  description: "Лабораторії, курси, гранти",                       color: "#0369a1", emoji: "🏛" },
  initiative:    { label: "Ініціативи",    description: "Колаборації, групи, відкриті ініціативи",          color: "#7c3aed", emoji: "🚀" },
};

export const ITEM_TYPE_REGISTRY: Record<ItemType, ItemTypeMeta> = {
  // ── PERSONAL ─────────────────────────────────────────────────────────────
  bachelor: {
    type: "bachelor",
    label: "Бакалаврська",
    labelPlural: "Бакалаврські",
    emoji: "🎓",
    color: "#059669",
    kind: "learning",
    category: "personal",
    defaultVisibility: "private",
    description: "Дипломна робота бакалавра",
    detailBlock: "thesis",
  },
  master: {
    type: "master",
    label: "Магістерська",
    labelPlural: "Магістерські",
    emoji: "🎓",
    color: "#0369a1",
    kind: "learning",
    category: "personal",
    defaultVisibility: "private",
    description: "Дипломна робота магістра",
    detailBlock: "thesis",
  },
  phd: {
    type: "phd",
    label: "PhD дисертація",
    labelPlural: "PhD дисертації",
    emoji: "🎓",
    color: "#7c3aed",
    kind: "learning",
    category: "personal",
    defaultVisibility: "private",
    description: "Аспірантська дисертаційна робота",
    detailBlock: "phd",
  },
  individual_research: {
    type: "individual_research",
    label: "Індивідуальне дослідження",
    labelPlural: "Індивідуальні дослідження",
    emoji: "🔬",
    color: "#0f766e",
    kind: "project",
    category: "personal",
    defaultVisibility: "private",
    description: "Самостійна наукова робота",
    detailBlock: "research",
  },

  // ── INSTITUTIONAL ───────────────────────────────────────────────────────
  laboratory: {
    type: "laboratory",
    label: "Лабораторія",
    labelPlural: "Лабораторії",
    emoji: "🧪",
    color: "#0f766e",
    kind: "project",
    category: "institutional",
    defaultVisibility: "institutional",
    description: "Наукова або навчальна лабораторія",
    detailBlock: "lab",
  },
  course: {
    type: "course",
    label: "Курс",
    labelPlural: "Курси",
    emoji: "📚",
    color: "#0369a1",
    kind: "project",
    category: "institutional",
    defaultVisibility: "institutional",
    description: "Навчальний курс із записами студентів",
    detailBlock: "course",
  },
  grant: {
    type: "grant",
    label: "Грант",
    labelPlural: "Гранти",
    emoji: "💰",
    color: "#d97706",
    kind: "project",
    category: "institutional",
    defaultVisibility: "institutional",
    description: "Грантовий проєкт із фінансуванням",
    detailBlock: "grant",
  },

  // ── INITIATIVES ─────────────────────────────────────────────────────────
  collaboration: {
    type: "collaboration",
    label: "Колаборація",
    labelPlural: "Колаборації",
    emoji: "🤝",
    color: "#7c3aed",
    kind: "project",
    category: "initiative",
    defaultVisibility: "public",
    description: "Міжуніверситетський або міжлабораторний проєкт",
    detailBlock: "collaboration",
  },
  study_group: {
    type: "study_group",
    label: "Навчальна група",
    labelPlural: "Навчальні групи",
    emoji: "📖",
    color: "#0891b2",
    kind: "project",
    category: "initiative",
    defaultVisibility: "public",
    description: "Reading club, hackathon, спільне навчання",
    detailBlock: "study_group",
  },
  seminar: {
    type: "seminar",
    label: "Семінар",
    labelPlural: "Семінари",
    emoji: "🎙",
    color: "#be123c",
    kind: "project",
    category: "initiative",
    defaultVisibility: "public",
    description: "Одноразовий захід: лекція, воркшоп, панель",
    detailBlock: "seminar",
  },
  open_science: {
    type: "open_science",
    label: "Open Science",
    labelPlural: "Open Science",
    emoji: "🌐",
    color: "#059669",
    kind: "project",
    category: "initiative",
    defaultVisibility: "public",
    description: "Відкрита наука з DOI, license, repo",
    detailBlock: "open_science",
  },
  idea: {
    type: "idea",
    label: "Ідея",
    labelPlural: "Ідеї",
    emoji: "💡",
    color: "#eab308",
    kind: "project",
    category: "initiative",
    defaultVisibility: "public",
    description: "Концепт, ще не оформлений як проєкт",
    detailBlock: "idea",
  },
};

// ── Type-specific field types (для type-safety, не примусово зараз) ─────────
export type ThesisFields = {
  programName?: string;
  university?: string;
  faculty?: string;
  defenseDate?: string;
  abstract?: string;
  finalGrade?: string;
  opponent?: string;
  reviewer?: string;
  thesisFile?: string;
};

export type LabFields = {
  bslLevel?: "BSL-1" | "BSL-2" | "BSL-3" | "BSL-4";
  roomNumber?: string;
  safetyOfficer?: string;
  headOfLab?: string;
};

export type CourseFields = {
  programName?: string;
  semester?: string;     // e.g. "Fall 2025-2026"
  ects?: number;
  hoursTotal?: number;
  lecturer?: string;
  assistants?: string[];
  syllabusUrl?: string;
  syllabusText?: string;
  assessmentScheme?: string;
};

export type GrantFields = {
  funderName?: string;
  funderType?: "state" | "private" | "international";
  amount?: number;
  currency?: string;
  startDate?: string;
  endDate?: string;
  principalInvestigator?: string;
  coInvestigators?: string[];
  objectives?: string;
  deliverables?: { title: string; deadline?: string; done?: boolean }[];
};

export type SeminarFields = {
  format?: "lecture" | "workshop" | "panel" | "symposium";
  date?: string;
  duration?: string;
  location?: string;
  isOnline?: boolean;
  meetingUrl?: string;
  speaker?: string;
  speakerBio?: string;
  topic?: string;
  registrationUrl?: string;
  maxAttendees?: number;
  recordingUrl?: string;
  slidesUrl?: string;
};

export type OpenScienceFields = {
  license?: "CC-BY" | "CC-BY-SA" | "MIT" | "Apache-2.0" | "GPL-3.0" | "other";
  topic?: string;
  dataRepository?: string;
  doi?: string;
  methodology?: string;
  reproducibilityNotes?: string;
};

export type CollaborationFields = {
  partnerInstitutions?: string[];
  mouUrl?: string;
  scope?: string;
  coordinator?: string;
};

export type StudyGroupFields = {
  topic?: string;
  meetingSchedule?: string;
  meetingLocation?: string;
  facilitator?: string;
  maxMembers?: number;
};

export type IdeaFields = {
  pitch?: string;
  problemStatement?: string;
  targetAudience?: string;
  stage?: "raw" | "forming" | "validated";
  voteCount?: number;
};

export type ResearchFields = {
  researchType?: "fundamental" | "applied" | "review";
  hypothesis?: string;
  methodology?: string;
  deliverables?: string[];
  fundingSource?: string;
};

export type PhdFields = {
  // повний існуючий PhdPlan ID:
  phdPlanId?: string;
  specialty?: string;
  dissertationTitle?: string;
};

export type ItemFields =
  | ThesisFields
  | LabFields
  | CourseFields
  | GrantFields
  | SeminarFields
  | OpenScienceFields
  | CollaborationFields
  | StudyGroupFields
  | IdeaFields
  | ResearchFields
  | PhdFields
  | Record<string, any>;

// ── Workspace templates ─────────────────────────────────────────────────────
// Розширений набір шаблонів (синхронізовано з web TEMPLATE_CONFIGS).
export type WorkspaceTemplate =
  | "bachelor" | "master" | "phd"
  | "grant" | "research"
  | "work" | "personal" | "empty"
  | "education"; // legacy back-compat

export type WorkspaceTemplateMeta = {
  id: WorkspaceTemplate;
  label: string;
  emoji: string;
  color: string;
  description: string;
  /** Тип категорії: academic — показує журнал/курси, professional/personal — без них. */
  kind: "academic" | "research" | "professional" | "personal" | "empty";
  /** Item-типи, які пропонувати у порожньому просторі. */
  suggestedItemTypes?: ItemType[];
  // Seed items: типи, які автоматично створюються (deprecated — seed manual)
  seedItems?: { type: ItemType; title: string }[];
};

export const WORKSPACE_TEMPLATES: Record<WorkspaceTemplate, WorkspaceTemplateMeta> = {
  bachelor: {
    id: "bachelor",
    label: "Бакалаврат",
    emoji: "🎓",
    color: "#059669",
    description: "Бакалаврська програма: курси, оцінки, кваліфікаційна робота.",
    kind: "academic",
    suggestedItemTypes: ["course", "bachelor", "individual_research"],
  },
  master: {
    id: "master",
    label: "Магістратура",
    emoji: "🎓",
    color: "#0369a1",
    description: "Магістерська програма: курси, дисертаційна робота, публікації.",
    kind: "academic",
    suggestedItemTypes: ["course", "master", "individual_research", "open_science"],
  },
  phd: {
    id: "phd",
    label: "Аспірантура",
    emoji: "🎓",
    color: "#7c3aed",
    description: "PhD-програма: освітня частина (ECTS), дисертація, milestone, публікації.",
    kind: "academic",
    suggestedItemTypes: ["phd", "course", "laboratory", "open_science", "grant"],
  },
  grant: {
    id: "grant",
    label: "Грантовий проєкт",
    emoji: "💰",
    color: "#d97706",
    description: "Грант: фінансування, дедлайни, deliverables, бюджет.",
    kind: "research",
    suggestedItemTypes: ["grant", "open_science", "laboratory"],
  },
  research: {
    id: "research",
    label: "Індивідуальне дослідження",
    emoji: "🔬",
    color: "#0f766e",
    description: "Незалежний дослідник: гіпотези, методологія, публікації.",
    kind: "research",
    suggestedItemTypes: ["individual_research", "open_science", "collaboration", "idea"],
  },
  work: {
    id: "work",
    label: "Робота",
    emoji: "🏢",
    color: "#0369a1",
    description: "Професійна діяльність: лабораторії, проєкти, команда, бюджет.",
    kind: "professional",
    suggestedItemTypes: ["laboratory", "grant", "collaboration"],
  },
  personal: {
    id: "personal",
    label: "Особистий",
    emoji: "🏠",
    color: "#64748b",
    description: "Ваші особисті ідеї, читання, проєкти без чіткого контексту.",
    kind: "personal",
    suggestedItemTypes: ["idea", "individual_research", "study_group"],
  },
  empty: {
    id: "empty",
    label: "Порожній",
    emoji: "📋",
    color: "#64748b",
    description: "Чистий простір без шаблону — налаштуйте під свій кейс.",
    kind: "empty",
    suggestedItemTypes: [],
  },
  // Legacy back-compat: старі простори зі значенням "education".
  education: {
    id: "education",
    label: "Освіта (legacy)",
    emoji: "🎓",
    color: "#0369a1",
    description: "Старий шаблон. Створюйте окремі: bachelor / master / phd.",
    kind: "academic",
    suggestedItemTypes: ["course", "phd", "master", "bachelor"],
  },
};

// Helpers
export function getTypesByCategory(cat: ItemCategory): ItemTypeMeta[] {
  return (Object.values(ITEM_TYPE_REGISTRY) as ItemTypeMeta[]).filter(t => t.category === cat);
}

export function getCategoryMeta(cat: ItemCategory) {
  return CATEGORY_META[cat];
}

export function getTypeMeta(t: ItemType): ItemTypeMeta {
  return ITEM_TYPE_REGISTRY[t];
}
