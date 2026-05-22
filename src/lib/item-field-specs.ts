// Спільна специфікація type-specific полів для items.
// Використовується generic-fields-block (рендер) + ItemEditor (форма).

import type { ComponentType } from "react";
import {
  Award,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Coins,
  Compass,
  FileBadge,
  FileText,
  Globe,
  GraduationCap,
  Handshake,
  Lightbulb,
  Link as LinkIcon,
  MapPin,
  Mic,
  Sparkles,
  Target,
  User,
  Users,
} from "lucide-react";

export type FieldType = "text" | "longtext" | "date" | "url" | "list" | "number" | "money" | "enum";
export type FieldSpec = {
  key: string;
  label: { uk: string; en: string };
  icon: ComponentType<{ className?: string }>;
  type?: FieldType;
  enum?: { value: string; label: { uk: string; en: string } }[];
  placeholder?: string;
};

export type GroupSpec = {
  titleUk: string;
  titleEn: string;
  tint: "emerald" | "blue" | "violet" | "amber" | "rose" | "teal";
  fields: FieldSpec[];
};

export type BlockSpec = {
  itemType: string;
  tint: "emerald" | "blue" | "violet" | "amber" | "rose" | "teal";
  heroIcon: ComponentType<{ className?: string }>;
  groups: GroupSpec[];
};

export const ITEM_FIELD_SPECS: Record<string, BlockSpec> = {
  grant: {
    itemType: "grant",
    tint: "amber",
    heroIcon: Coins,
    groups: [
      {
        titleUk: "Фінансування", titleEn: "Funding", tint: "amber",
        fields: [
          { key: "funderName",  label: { uk: "Фандер",  en: "Funder" },  icon: Award },
          {
            key: "funderType", label: { uk: "Тип", en: "Type" }, icon: FileBadge, type: "enum",
            enum: [
              { value: "state",         label: { uk: "Державний",       en: "State" } },
              { value: "private",       label: { uk: "Приватний",       en: "Private" } },
              { value: "international", label: { uk: "Міжнародний",     en: "International" } },
            ],
          },
          { key: "amount",   label: { uk: "Сума",    en: "Amount" },   icon: Coins, type: "money" },
          { key: "currency", label: { uk: "Валюта",  en: "Currency" }, icon: Coins, placeholder: "UAH" },
        ],
      },
      {
        titleUk: "Команда й терміни", titleEn: "Team & dates", tint: "emerald",
        fields: [
          { key: "principalInvestigator", label: { uk: "Головний дослідник", en: "PI" }, icon: Award },
          { key: "coInvestigators", label: { uk: "Спів-дослідники", en: "Co-investigators" }, icon: Users, type: "list" },
          { key: "startDate", label: { uk: "Старт",      en: "Start" }, icon: CalendarDays, type: "date" },
          { key: "endDate",   label: { uk: "Завершення", en: "End" },   icon: CalendarDays, type: "date" },
        ],
      },
      {
        titleUk: "Цілі та результати", titleEn: "Goals & deliverables", tint: "violet",
        fields: [
          { key: "objectives",   label: { uk: "Цілі",         en: "Objectives" },   icon: Target, type: "longtext" },
          { key: "deliverables", label: { uk: "Deliverables", en: "Deliverables" }, icon: CheckCircle2, type: "list" },
        ],
      },
    ],
  },
  seminar: {
    itemType: "seminar",
    tint: "rose",
    heroIcon: Mic,
    groups: [
      {
        titleUk: "Подія", titleEn: "Event", tint: "rose",
        fields: [
          {
            key: "format", label: { uk: "Формат", en: "Format" }, icon: FileBadge, type: "enum",
            enum: [
              { value: "lecture",   label: { uk: "Лекція",    en: "Lecture" } },
              { value: "workshop",  label: { uk: "Воркшоп",   en: "Workshop" } },
              { value: "panel",     label: { uk: "Панель",    en: "Panel" } },
              { value: "symposium", label: { uk: "Симпозіум", en: "Symposium" } },
            ],
          },
          { key: "date",       label: { uk: "Дата",            en: "Date" },          icon: CalendarDays, type: "date" },
          { key: "duration",   label: { uk: "Тривалість",      en: "Duration" },      icon: CalendarDays, placeholder: "2 год" },
          { key: "location",   label: { uk: "Місце",           en: "Location" },      icon: MapPin },
          { key: "meetingUrl", label: { uk: "Лінк зустрічі",   en: "Meeting link" },  icon: LinkIcon, type: "url" },
        ],
      },
      {
        titleUk: "Спікер", titleEn: "Speaker", tint: "violet",
        fields: [
          { key: "speaker",    label: { uk: "Спікер", en: "Speaker" }, icon: Mic },
          { key: "speakerBio", label: { uk: "Біо",    en: "Bio" },     icon: FileText, type: "longtext" },
          { key: "topic",      label: { uk: "Тема",   en: "Topic" },   icon: Target },
        ],
      },
      {
        titleUk: "Матеріали", titleEn: "Materials", tint: "amber",
        fields: [
          { key: "registrationUrl", label: { uk: "Реєстрація",      en: "Registration" }, icon: LinkIcon, type: "url" },
          { key: "recordingUrl",    label: { uk: "Запис",           en: "Recording" },    icon: LinkIcon, type: "url" },
          { key: "slidesUrl",       label: { uk: "Слайди",          en: "Slides" },       icon: LinkIcon, type: "url" },
          { key: "maxAttendees",    label: { uk: "Макс. учасників", en: "Max attendees" }, icon: Users, type: "number" },
        ],
      },
    ],
  },
  open_science: {
    itemType: "open_science",
    tint: "emerald",
    heroIcon: Globe,
    groups: [
      {
        titleUk: "Публікація", titleEn: "Publication", tint: "emerald",
        fields: [
          {
            key: "license", label: { uk: "Ліцензія", en: "License" }, icon: FileBadge, type: "enum",
            enum: [
              { value: "CC-BY",      label: { uk: "CC-BY",      en: "CC-BY" } },
              { value: "CC-BY-SA",   label: { uk: "CC-BY-SA",   en: "CC-BY-SA" } },
              { value: "MIT",        label: { uk: "MIT",        en: "MIT" } },
              { value: "Apache-2.0", label: { uk: "Apache-2.0", en: "Apache-2.0" } },
              { value: "GPL-3.0",    label: { uk: "GPL-3.0",    en: "GPL-3.0" } },
              { value: "other",      label: { uk: "Інша",       en: "Other" } },
            ],
          },
          { key: "doi",            label: { uk: "DOI",          en: "DOI" },         icon: LinkIcon },
          { key: "dataRepository", label: { uk: "Репозиторій",  en: "Repository" }, icon: LinkIcon, type: "url" },
        ],
      },
      {
        titleUk: "Методологія", titleEn: "Methodology", tint: "violet",
        fields: [
          { key: "topic",                label: { uk: "Тема",         en: "Topic" },                  icon: Target },
          { key: "methodology",          label: { uk: "Методологія",  en: "Methodology" },             icon: FileText, type: "longtext" },
          { key: "reproducibilityNotes", label: { uk: "Нотатки про відтворюваність", en: "Reproducibility notes" }, icon: FileText, type: "longtext" },
        ],
      },
    ],
  },
  collaboration: {
    itemType: "collaboration",
    tint: "violet",
    heroIcon: Handshake,
    groups: [
      {
        titleUk: "Партнери", titleEn: "Partners", tint: "violet",
        fields: [
          { key: "partnerInstitutions", label: { uk: "Інституції-партнери", en: "Partner institutions" }, icon: Users, type: "list" },
          { key: "coordinator",         label: { uk: "Координатор",         en: "Coordinator" },         icon: Award },
          { key: "mouUrl",              label: { uk: "MoU",                 en: "MoU" },                 icon: LinkIcon, type: "url" },
        ],
      },
      {
        titleUk: "Спрямованість", titleEn: "Scope", tint: "blue",
        fields: [
          { key: "scope", label: { uk: "Опис", en: "Scope" }, icon: Compass, type: "longtext" },
        ],
      },
    ],
  },
  study_group: {
    itemType: "study_group",
    tint: "blue",
    heroIcon: BookOpen,
    groups: [
      {
        titleUk: "Група", titleEn: "Group", tint: "blue",
        fields: [
          { key: "topic",       label: { uk: "Тема",            en: "Topic" },         icon: Target },
          { key: "facilitator", label: { uk: "Фасилітатор",     en: "Facilitator" },   icon: Award },
          { key: "maxMembers",  label: { uk: "Макс. учасників", en: "Max members" },   icon: Users, type: "number" },
        ],
      },
      {
        titleUk: "Розклад і місце", titleEn: "Schedule & venue", tint: "amber",
        fields: [
          { key: "meetingSchedule", label: { uk: "Розклад", en: "Schedule" }, icon: CalendarDays },
          { key: "meetingLocation", label: { uk: "Місце",   en: "Location" }, icon: MapPin },
        ],
      },
    ],
  },
  idea: {
    itemType: "idea",
    tint: "amber",
    heroIcon: Lightbulb,
    groups: [
      {
        titleUk: "Концепція", titleEn: "Concept", tint: "amber",
        fields: [
          { key: "pitch",            label: { uk: "Pitch",     en: "Pitch" },             icon: Sparkles, type: "longtext" },
          { key: "problemStatement", label: { uk: "Проблема",  en: "Problem statement" }, icon: Target, type: "longtext" },
          { key: "targetAudience",   label: { uk: "Аудиторія", en: "Target audience" },   icon: Users },
          {
            key: "stage", label: { uk: "Стадія", en: "Stage" }, icon: FileBadge, type: "enum",
            enum: [
              { value: "raw",       label: { uk: "Сира",       en: "Raw" } },
              { value: "forming",   label: { uk: "Формується", en: "Forming" } },
              { value: "validated", label: { uk: "Перевірена", en: "Validated" } },
            ],
          },
          { key: "voteCount", label: { uk: "Голоси", en: "Votes" }, icon: Award, type: "number" },
        ],
      },
    ],
  },
  research: {
    itemType: "research",
    tint: "teal",
    heroIcon: Compass,
    groups: [
      {
        titleUk: "Дослідження", titleEn: "Research", tint: "teal",
        fields: [
          {
            key: "researchType", label: { uk: "Тип", en: "Type" }, icon: FileBadge, type: "enum",
            enum: [
              { value: "fundamental", label: { uk: "Фундаментальне", en: "Fundamental" } },
              { value: "applied",     label: { uk: "Прикладне",      en: "Applied" } },
              { value: "review",      label: { uk: "Огляд",          en: "Review" } },
            ],
          },
          { key: "hypothesis",    label: { uk: "Гіпотеза",            en: "Hypothesis" },     icon: Target, type: "longtext" },
          { key: "methodology",   label: { uk: "Методологія",         en: "Methodology" },    icon: FileText, type: "longtext" },
          { key: "deliverables",  label: { uk: "Результати",          en: "Deliverables" },   icon: CheckCircle2, type: "list" },
          { key: "fundingSource", label: { uk: "Джерело фінансування", en: "Funding source" }, icon: Coins },
        ],
      },
    ],
  },
  thesis: {
    itemType: "thesis",
    tint: "blue",
    heroIcon: GraduationCap,
    groups: [
      {
        titleUk: "Дисертація", titleEn: "Thesis", tint: "blue",
        fields: [
          { key: "programName",      label: { uk: "Програма",        en: "Program" },        icon: GraduationCap },
          { key: "university",       label: { uk: "Університет",     en: "University" },     icon: Award },
          { key: "faculty",          label: { uk: "Факультет",       en: "Faculty" },        icon: BookOpen },
          { key: "defenseDate",      label: { uk: "Дата захисту",    en: "Defense date" },   icon: CalendarDays, type: "date" },
          { key: "supervisor",       label: { uk: "Керівник",        en: "Supervisor" },     icon: User },
          { key: "opponent",         label: { uk: "Опонент",         en: "Opponent" },       icon: User },
          { key: "reviewer",         label: { uk: "Рецензент",       en: "Reviewer" },       icon: User },
          { key: "finalGrade",       label: { uk: "Підсумкова оцінка", en: "Final grade" },  icon: Award },
          { key: "thesisFile",       label: { uk: "Файл роботи (URL)", en: "Thesis file (URL)" }, icon: LinkIcon, type: "url" },
          { key: "abstract",         label: { uk: "Анотація",        en: "Abstract" },       icon: FileText, type: "longtext" },
        ],
      },
    ],
  },
};

/** Резолвить spec, нормалізуючи bachelor/master/individual_research до базових. */
export function resolveItemFieldSpec(itemType: string | undefined): BlockSpec | undefined {
  if (!itemType) return undefined;
  if (itemType === "bachelor" || itemType === "master") return ITEM_FIELD_SPECS.thesis;
  if (itemType === "individual_research") return ITEM_FIELD_SPECS.research;
  return ITEM_FIELD_SPECS[itemType];
}
