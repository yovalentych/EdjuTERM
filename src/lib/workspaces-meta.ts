// Spectrum: 12 типів проєктів + 2 концепції + метадані для UI
// Shared between web pages/components and (optionally) backend

export type ItemKind = "learning" | "project";
export type ItemCategory = "personal" | "institutional" | "initiative";

export const ITEM_TYPES = [
  "bachelor", "master", "phd", "individual_research",
  "laboratory", "course", "grant",
  "collaboration", "study_group", "seminar", "open_science", "idea",
] as const;
export type ItemType = (typeof ITEM_TYPES)[number];

export const LEARNING_TYPES: ItemType[] = ["bachelor", "master", "phd"];
export const PROJECT_TYPES: ItemType[] = [
  "individual_research", "laboratory", "course", "grant",
  "collaboration", "study_group", "seminar", "open_science", "idea",
];

export const ITEM_TYPE_META: Record<ItemType, {
  label: string; emoji: string; category: ItemCategory;
  kind: ItemKind; color: string; description: string;
}> = {
  bachelor:            { label: "Бакалаврат",    emoji: "🎓", kind: "learning",  category: "personal",      color: "#059669", description: "Навчання на першому (бакалаврському) рівні" },
  master:              { label: "Магістратура",   emoji: "🎓", kind: "learning",  category: "personal",      color: "#0369a1", description: "Навчання на другому (магістерському) рівні" },
  phd:                 { label: "Аспірантура",    emoji: "🎓", kind: "learning",  category: "personal",      color: "#7c3aed", description: "Навчання в аспірантурі (PhD)" },
  individual_research: { label: "Дослідження",    emoji: "🔬", kind: "project",   category: "personal",      color: "#0f766e", description: "Самостійна наукова або творча робота" },
  laboratory:          { label: "Лабораторія",    emoji: "🧪", kind: "project",   category: "institutional", color: "#0f766e", description: "Наукова або навчальна лабораторія" },
  course:              { label: "Курс",           emoji: "📚", kind: "project",   category: "institutional", color: "#0369a1", description: "Навчальний курс із записами студентів" },
  grant:               { label: "Грант",          emoji: "💰", kind: "project",   category: "institutional", color: "#d97706", description: "Грантовий проєкт із фінансуванням" },
  collaboration:       { label: "Колаборація",    emoji: "🤝", kind: "project",   category: "initiative",    color: "#7c3aed", description: "Міжуніверситетський або міжлабораторний проєкт" },
  study_group:         { label: "Навч. група",    emoji: "📖", kind: "project",   category: "initiative",    color: "#0891b2", description: "Reading club, hackathon, спільне навчання" },
  seminar:             { label: "Семінар",        emoji: "🎙", kind: "project",   category: "initiative",    color: "#be123c", description: "Одноразовий захід: лекція, воркшоп" },
  open_science:        { label: "Open Science",   emoji: "🌐", kind: "project",   category: "initiative",    color: "#059669", description: "Відкрита наука з DOI, license, repo" },
  idea:                { label: "Ідея",           emoji: "💡", kind: "project",   category: "initiative",    color: "#eab308", description: "Концепт, ще не оформлений як проєкт" },
};

export const KIND_META: Record<ItemKind, { label: string; emoji: string; color: string; description: string; hint: string }> = {
  learning: {
    label: "Навчання",
    emoji: "🎓",
    color: "#0369a1",
    description: "Бакалаврат, Магістратура, Аспірантура",
    hint: "Управляйте навчальним процесом: курси, оцінки, розклад, індивідуальний план",
  },
  project: {
    label: "Проєкт",
    emoji: "🔬",
    color: "#0f766e",
    description: "Гранти, дослідження, лабораторії, ініціативи",
    hint: "Наукові та творчі проєкти — індивідуальні або колективні. Можна пов'язати з навчанням",
  },
};

export const CATEGORY_META: Record<ItemCategory, { label: string; emoji: string; color: string; description: string }> = {
  personal:      { label: "Особисті",     emoji: "🎓", color: "#0f766e", description: "Дипломні, дисертація, індивідуальні дослідження" },
  institutional: { label: "Інституційні", emoji: "🏛", color: "#0369a1", description: "Лабораторії, курси, гранти" },
  initiative:    { label: "Ініціативи",   emoji: "🚀", color: "#7c3aed", description: "Колаборації, групи, відкриті ініціативи" },
};

export const WORKSPACE_TEMPLATES = {
  education: { label: "Освітній період", emoji: "🎓", color: "#0369a1", description: "Бакалаврат / магістратура / аспірантура. Готова структура для дипломної та курсів." },
  work:      { label: "Робочий",         emoji: "🔬", color: "#0f766e", description: "Лабораторії, гранти, дослідження. Для активної професійної діяльності." },
  personal:  { label: "Особистий",       emoji: "🏠", color: "#7c3aed", description: "Ваші ідеї, дослідження, навчальні групи. Без обмежень." },
  empty:     { label: "Порожній",        emoji: "📋", color: "#64748b", description: "Чистий простір — додасте проєкти самі." },
} as const;
export type WorkspaceTemplate = keyof typeof WORKSPACE_TEMPLATES;

export function getTypesByCategory(cat: ItemCategory): { id: ItemType; meta: typeof ITEM_TYPE_META[ItemType] }[] {
  return ITEM_TYPES
    .filter((t) => ITEM_TYPE_META[t].category === cat)
    .map((t) => ({ id: t, meta: ITEM_TYPE_META[t] }));
}

export function getTypesByKind(kind: ItemKind): { id: ItemType; meta: typeof ITEM_TYPE_META[ItemType] }[] {
  return ITEM_TYPES
    .filter((t) => ITEM_TYPE_META[t].kind === kind)
    .map((t) => ({ id: t, meta: ITEM_TYPE_META[t] }));
}

export function getItemKind(type: ItemType): ItemKind {
  return ITEM_TYPE_META[type].kind;
}
