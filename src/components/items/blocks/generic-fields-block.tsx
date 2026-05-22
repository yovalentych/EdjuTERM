import Link from "next/link";
import {
  Award,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Coins,
  Compass,
  DollarSign,
  ExternalLink,
  FileBadge,
  FileText,
  Globe,
  Handshake,
  Lightbulb,
  Link as LinkIcon,
  MapPin,
  Mic,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { LiquidCard, LiquidPill } from "@/components/ui/liquid";

/**
 * Універсальний блок для items, у яких немає окремої БД-колекції — просто
 * рендерить структуровані item.fields у красиві картки.
 *
 * Покриває: grant, seminar, open_science, collaboration, study_group, idea, research.
 */
type FieldType = "text" | "longtext" | "date" | "url" | "list" | "number" | "money";
type FieldSpec = {
  key: string;
  label: { uk: string; en: string };
  icon: React.ComponentType<{ className?: string }>;
  type?: FieldType;
};

type BlockSpec = {
  itemType: string;
  tint: "emerald" | "blue" | "violet" | "amber" | "rose" | "teal";
  heroIcon: React.ComponentType<{ className?: string }>;
  groups: { titleUk: string; titleEn: string; tint: "emerald" | "blue" | "violet" | "amber" | "rose" | "teal"; fields: FieldSpec[] }[];
};

const SPECS: Record<string, BlockSpec> = {
  grant: {
    itemType: "grant",
    tint: "amber",
    heroIcon: Coins,
    groups: [
      {
        titleUk: "Фінансування", titleEn: "Funding", tint: "amber",
        fields: [
          { key: "funderName",  label: { uk: "Фандер",    en: "Funder" },    icon: Award },
          { key: "funderType",  label: { uk: "Тип",       en: "Type" },      icon: FileBadge },
          { key: "amount",      label: { uk: "Сума",      en: "Amount" },    icon: Coins, type: "money" },
          { key: "currency",    label: { uk: "Валюта",    en: "Currency" },  icon: Coins },
        ],
      },
      {
        titleUk: "Команда й терміни", titleEn: "Team & dates", tint: "emerald",
        fields: [
          { key: "principalInvestigator", label: { uk: "Головний дослідник", en: "PI" }, icon: Award },
          { key: "coInvestigators", label: { uk: "Спів-дослідники", en: "Co-investigators" }, icon: Users, type: "list" },
          { key: "startDate", label: { uk: "Старт",    en: "Start" }, icon: CalendarDays, type: "date" },
          { key: "endDate",   label: { uk: "Завершення", en: "End" }, icon: CalendarDays, type: "date" },
        ],
      },
      {
        titleUk: "Цілі та результати", titleEn: "Goals & deliverables", tint: "violet",
        fields: [
          { key: "objectives",   label: { uk: "Цілі",         en: "Objectives" }, icon: Target, type: "longtext" },
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
          { key: "format",   label: { uk: "Формат",     en: "Format" },     icon: FileBadge },
          { key: "date",     label: { uk: "Дата",       en: "Date" },       icon: CalendarDays, type: "date" },
          { key: "duration", label: { uk: "Тривалість", en: "Duration" },   icon: CalendarDays },
          { key: "location", label: { uk: "Місце",      en: "Location" },   icon: MapPin },
          { key: "meetingUrl", label: { uk: "Лінк зустрічі", en: "Meeting link" }, icon: LinkIcon, type: "url" },
        ],
      },
      {
        titleUk: "Спікер", titleEn: "Speaker", tint: "violet",
        fields: [
          { key: "speaker",    label: { uk: "Спікер",  en: "Speaker" }, icon: Mic },
          { key: "speakerBio", label: { uk: "Біо",     en: "Bio" },     icon: FileText, type: "longtext" },
          { key: "topic",      label: { uk: "Тема",    en: "Topic" },   icon: Target },
        ],
      },
      {
        titleUk: "Матеріали", titleEn: "Materials", tint: "amber",
        fields: [
          { key: "registrationUrl", label: { uk: "Реєстрація", en: "Registration" }, icon: LinkIcon, type: "url" },
          { key: "recordingUrl",    label: { uk: "Запис",      en: "Recording" },    icon: LinkIcon, type: "url" },
          { key: "slidesUrl",       label: { uk: "Слайди",     en: "Slides" },       icon: LinkIcon, type: "url" },
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
          { key: "license", label: { uk: "Ліцензія", en: "License" }, icon: FileBadge },
          { key: "doi",     label: { uk: "DOI",      en: "DOI" },     icon: LinkIcon },
          { key: "dataRepository", label: { uk: "Репозиторій", en: "Repository" }, icon: LinkIcon, type: "url" },
        ],
      },
      {
        titleUk: "Методологія", titleEn: "Methodology", tint: "violet",
        fields: [
          { key: "topic",                label: { uk: "Тема",        en: "Topic" },               icon: Target },
          { key: "methodology",          label: { uk: "Методологія", en: "Methodology" },          icon: FileText, type: "longtext" },
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
          { key: "topic",             label: { uk: "Тема",            en: "Topic" },            icon: Target },
          { key: "facilitator",       label: { uk: "Фасилітатор",     en: "Facilitator" },      icon: Award },
          { key: "maxMembers",        label: { uk: "Макс. учасників", en: "Max members" },     icon: Users, type: "number" },
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
          { key: "pitch",            label: { uk: "Pitch",            en: "Pitch" },             icon: Sparkles, type: "longtext" },
          { key: "problemStatement", label: { uk: "Проблема",         en: "Problem statement" }, icon: Target, type: "longtext" },
          { key: "targetAudience",   label: { uk: "Аудиторія",        en: "Target audience" },   icon: Users },
          { key: "stage",            label: { uk: "Стадія",           en: "Stage" },             icon: FileBadge },
          { key: "voteCount",        label: { uk: "Голоси",           en: "Votes" },             icon: Award, type: "number" },
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
          { key: "researchType",  label: { uk: "Тип",           en: "Type" },           icon: FileBadge },
          { key: "hypothesis",    label: { uk: "Гіпотеза",      en: "Hypothesis" },     icon: Target, type: "longtext" },
          { key: "methodology",   label: { uk: "Методологія",   en: "Methodology" },    icon: FileText, type: "longtext" },
          { key: "deliverables",  label: { uk: "Результати",    en: "Deliverables" },   icon: CheckCircle2, type: "list" },
          { key: "fundingSource", label: { uk: "Джерело фінансування", en: "Funding source" }, icon: Coins },
        ],
      },
    ],
  },
};

// Item types that have a /project sub-page
const HAS_PROJECT_PAGE = new Set([
  "individual_research", "grant", "collaboration", "study_group", "seminar", "open_science", "idea",
]);

const PROJECT_NAV: Record<string, { tabs: string[]; colorsKey: string }> = {
  individual_research: { tabs: ["stages", "tasks", "budget"], colorsKey: "teal" },
  grant:               { tabs: ["stages", "tasks", "budget"], colorsKey: "amber" },
  collaboration:       { tabs: ["tasks", "stages"],           colorsKey: "violet" },
  study_group:         { tabs: ["tasks"],                     colorsKey: "blue" },
  seminar:             { tabs: ["tasks"],                     colorsKey: "rose" },
  open_science:        { tabs: ["tasks"],                     colorsKey: "emerald" },
  idea:                { tabs: ["tasks"],                     colorsKey: "amber" },
};

const TAB_NAV_META: Record<string, { labelUk: string; labelEn: string; Icon: typeof Target }> = {
  stages: { labelUk: "Етапи",  labelEn: "Stages",  Icon: ClipboardList },
  tasks:  { labelUk: "Задачі", labelEn: "Tasks",   Icon: Target        },
  budget: { labelUk: "Бюджет", labelEn: "Budget",  Icon: DollarSign    },
};

export function GenericFieldsBlock({
  item,
  locale,
  legacyProjectId,
  wsId,
  itemId,
}: {
  item: { type?: string; fields?: Record<string, any> };
  locale: string;
  legacyProjectId?: string;
  wsId?: string;
  itemId?: string;
}) {
  const isUk = locale === "uk";
  const fallbackType = item.type === "individual_research" ? "research" : item.type;
  const spec = SPECS[fallbackType ?? ""] ?? SPECS.research;
  const f = item.fields || {};
  const HeroIcon = spec.heroIcon;
  const hasProjectPage = HAS_PROJECT_PAGE.has(item.type ?? "");
  const navCfg = PROJECT_NAV[item.type ?? ""];

  // Чи є хоч одне заповнене поле?
  const hasAny = spec.groups.some((g) => g.fields.some((fs) => isNonEmpty(f[fs.key])));

  // Navigation tiles for project sub-page
  const navTiles = hasProjectPage && wsId && itemId && navCfg ? (
    <div className="grid grid-cols-3 gap-2">
      {navCfg.tabs.map((tabId) => {
        const tabMeta = TAB_NAV_META[tabId];
        if (!tabMeta) return null;
        const Icon = tabMeta.Icon;
        return (
          <Link
            key={tabId}
            href={`/${locale}/app/space/${wsId}/items/${itemId}/project?tab=${tabId}`}
            className="flex flex-col items-center gap-2 rounded-xl border border-slate-200/70 bg-white/70 p-4 text-center shadow-sm backdrop-blur transition hover:bg-white hover:shadow-md"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: tintBg(spec.tint) }}>
              <Icon className="h-4.5 w-4.5" style={{ color: tintColor(spec.tint) }} />
            </div>
            <span className="text-xs font-bold text-slate-700">{isUk ? tabMeta.labelUk : tabMeta.labelEn}</span>
          </Link>
        );
      })}
    </div>
  ) : null;

  if (!hasAny) {
    return (
      <div className="flex flex-col gap-4">
        <LiquidCard tint={spec.tint} className="text-center" accent>
          <div className={`mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl`}
               style={{ backgroundColor: tintBg(spec.tint) }}>
            <HeroIcon className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            {isUk ? "Деталі ще не заповнені" : "Details not filled yet"}
          </h3>
          <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-slate-500">
            {isUk
              ? "Скористайтесь редактором, щоб додати ключові поля. Все буде синхронізовано з мобільним застосунком."
              : "Use the editor to add key fields. Everything will sync with the mobile app."}
          </p>
          {legacyProjectId && (
            <Link href={`/${locale}/app/project?projectId=${legacyProjectId}`} className="liquid-cta mt-4 inline-flex">
              <ExternalLink className="h-4 w-4" />
              {isUk ? "Робочий простір" : "Workbench"}
            </Link>
          )}
        </LiquidCard>
        {navTiles}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {spec.groups.map((group, gi) => {
        const filledFields = group.fields.filter((fs) => isNonEmpty(f[fs.key]));
        if (filledFields.length === 0) return null;
        return (
          <LiquidCard key={gi} tint={group.tint} className="p-0 overflow-hidden">
            <div className="border-b border-slate-200/60 bg-gradient-to-br from-white/80 via-white to-slate-50/60 px-5 py-3.5">
              <span className="liquid-eyebrow">{isUk ? group.titleUk : group.titleEn}</span>
            </div>
            <div className="divide-y divide-slate-100/70">
              {filledFields.map((fs) => (
                <FieldRow key={fs.key} spec={fs} value={f[fs.key]} isUk={isUk} />
              ))}
            </div>
          </LiquidCard>
        );
      })}

      {navTiles}

      {legacyProjectId && (
        <Link
          href={`/${locale}/app/project?projectId=${legacyProjectId}`}
          className="liquid-cta self-start inline-flex"
        >
          <ExternalLink className="h-4 w-4" />
          {isUk ? "Відкрити робочий простір" : "Open workbench"}
        </Link>
      )}
    </div>
  );
}

function FieldRow({
  spec,
  value,
  isUk,
}: {
  spec: FieldSpec;
  value: any;
  isUk: boolean;
}) {
  const Icon = spec.icon;
  const t: FieldType = spec.type ?? "text";

  // Long text — рендеримо у власному блоці.
  if (t === "longtext") {
    return (
      <div className="px-5 py-3">
        <p className="mb-1 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
          <Icon className="h-3 w-3" />
          {isUk ? spec.label.uk : spec.label.en}
        </p>
        <p className="text-sm leading-6 text-slate-700">{String(value)}</p>
      </div>
    );
  }

  // List — chips.
  if (t === "list" && Array.isArray(value)) {
    return (
      <div className="px-5 py-3">
        <p className="mb-2 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
          <Icon className="h-3 w-3" />
          {isUk ? spec.label.uk : spec.label.en}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {value.map((v: any, i: number) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700"
            >
              {typeof v === "object" && v?.title ? v.title : String(v)}
              {typeof v === "object" && v?.deadline && (
                <span className="text-[9px] text-slate-400">· {v.deadline}</span>
              )}
              {typeof v === "object" && v?.done && (
                <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600" />
              )}
            </span>
          ))}
        </div>
      </div>
    );
  }

  // URL — link.
  if (t === "url" && typeof value === "string") {
    return (
      <div className="flex items-center gap-3 px-5 py-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
          <Icon className="h-3.5 w-3.5" />
        </span>
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
          {isUk ? spec.label.uk : spec.label.en}
        </span>
        <a
          href={value}
          target="_blank"
          rel="noreferrer"
          className="ml-auto inline-flex items-center gap-1 truncate text-sm font-semibold text-emerald-700 hover:underline"
        >
          {value.replace(/^https?:\/\//, "")}
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    );
  }

  // Money — формат.
  if (t === "money") {
    return (
      <div className="flex items-center gap-3 px-5 py-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
          <Icon className="h-3.5 w-3.5" />
        </span>
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
          {isUk ? spec.label.uk : spec.label.en}
        </span>
        <span className="ml-auto text-sm font-bold tabular-nums text-slate-900">
          {formatMoney(value)}
        </span>
      </div>
    );
  }

  // Default — text / date / number.
  return (
    <div className="flex items-center gap-3 px-5 py-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
        {isUk ? spec.label.uk : spec.label.en}
      </span>
      <span className="ml-auto truncate text-sm font-semibold text-slate-900">{String(value)}</span>
    </div>
  );
}

function isNonEmpty(v: any): boolean {
  if (v == null) return false;
  if (typeof v === "string") return v.trim().length > 0;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "number") return true;
  if (typeof v === "object") return Object.keys(v).length > 0;
  return Boolean(v);
}

function formatMoney(v: any): string {
  const n = Number(v);
  if (Number.isNaN(n)) return String(v);
  return new Intl.NumberFormat("uk-UA").format(n);
}

function tintBg(tint: string): string {
  const map: Record<string, string> = {
    emerald: "rgba(16,185,129,0.12)",
    blue:    "rgba(59,130,246,0.12)",
    violet:  "rgba(139,92,246,0.12)",
    amber:   "rgba(245,158,11,0.12)",
    rose:    "rgba(244,63,94,0.12)",
    teal:    "rgba(20,184,166,0.12)",
  };
  return map[tint] ?? "rgba(15,23,42,0.06)";
}

function tintColor(tint: string): string {
  const map: Record<string, string> = {
    emerald: "#059669",
    blue:    "#2563eb",
    violet:  "#7c3aed",
    amber:   "#d97706",
    rose:    "#be123c",
    teal:    "#0f766e",
  };
  return map[tint] ?? "#64748b";
}
