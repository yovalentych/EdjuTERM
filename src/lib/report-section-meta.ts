// ── Types ─────────────────────────────────────────────────────────────────────

export type GoalItem = { id: string; type: "goal" | "objective"; text: string };

export type OverallStatus = "on_track" | "minor_delays" | "significant_delays" | "ahead";
export type StageComplianceStatus = "on_track" | "delayed" | "completed" | "not_started";

export type TimelineMeta = {
  overallStatus: OverallStatus;
  stageStatuses: Record<string, StageComplianceStatus>;
  manualNote: string;
};

export const RESULT_TYPES = [
  "theoretical", "methodological", "experimental", "applied",
  "software", "dataset", "patent", "training", "other",
] as const;
export type ResultType = (typeof RESULT_TYPES)[number];

export type ResultItem = {
  id: string;
  resultType: ResultType;
  description: string;
  linkedExperimentId?: string;
};

export type PublicationsMeta = {
  noPublications: boolean;
  linkedPublicationIds: string[];
  linkedEventIds: string[];
  manualEntries: Array<{ id: string; text: string }>;
};

export type FinancialMode = "no_budget" | "open_source" | "standard" | "mixed";

export const FINANCIAL_STANDARD_PHRASES = [
  "Кошти використано відповідно до затвердженого кошторису.",
  "Закупівлю обладнання та витратних матеріалів здійснено відповідно до плану.",
  "Витрати на відрядження використані у межах запланованих.",
  "Оплата праці дослідників відповідає кошторисним показникам.",
  "Непрямі витрати відповідають встановленим нормативам.",
  "Залишок коштів планується використати у наступному звітному перiоді.",
] as const;

export type FinancialMeta = {
  mode: FinancialMode;
  selectedPhrases: string[];
  customNote: string;
};

export const PROBLEM_SEVERITIES = ["low", "medium", "high", "critical"] as const;
export type ProblemSeverity = (typeof PROBLEM_SEVERITIES)[number];

export const PROBLEM_CATEGORIES = [
  "technical", "organizational", "financial", "personnel", "external", "other",
] as const;
export type ProblemCategory = (typeof PROBLEM_CATEGORIES)[number];

export const SOLUTION_STATUSES = ["planned", "in_progress", "resolved", "deferred"] as const;
export type SolutionStatus = (typeof SOLUTION_STATUSES)[number];

export type SolutionItem = {
  id: string;
  description: string;
  status: SolutionStatus;
  deadline?: string;
};

export type ProblemItem = {
  id: string;
  title: string;
  description: string;
  severity: ProblemSeverity;
  category: ProblemCategory;
  solutions: SolutionItem[];
};

export type PlanItemSource = "task" | "milestone" | "custom";

export type PlanItem = {
  id: string;
  source: PlanItemSource;
  activity: string;
  deadline: string;
  responsible?: string;
  expectedResult?: string;
  linkedId?: string;
};

export type ReportSectionMeta = {
  goals?: { items: GoalItem[] };
  timeline?: TimelineMeta;
  results?: { items: ResultItem[] };
  publications?: PublicationsMeta;
  financial?: FinancialMeta;
  problems?: { items: ProblemItem[] };
  plans?: { items: PlanItem[] };
};

// ── Parsing ───────────────────────────────────────────────────────────────────

export function parseSectionMeta(json: string): ReportSectionMeta {
  try { return JSON.parse(json) as ReportSectionMeta; } catch { return {}; }
}

// ── Label maps ────────────────────────────────────────────────────────────────

export const OVERALL_STATUS_LABELS: Record<OverallStatus, string> = {
  on_track:              "Виконується відповідно до плану",
  minor_delays:          "Виконується з незначними відхиленнями",
  significant_delays:    "Виконується зі значними відхиленнями",
  ahead:                 "Виконується з випередженням графіку",
};

export const STAGE_STATUS_LABELS: Record<StageComplianceStatus, string> = {
  on_track:    "Відповідно до плану",
  delayed:     "З відхиленнями",
  completed:   "Завершено",
  not_started: "Не розпочато",
};

export const RESULT_TYPE_LABELS: Record<ResultType, string> = {
  theoretical:    "Теоретичний",
  methodological: "Методологічний",
  experimental:   "Експериментальний",
  applied:        "Прикладний",
  software:       "Програмний продукт",
  dataset:        "База даних / датасет",
  patent:         "Патент / авт. свідоцтво",
  training:       "Освітній результат",
  other:          "Інше",
};

export const SEVERITY_LABELS: Record<ProblemSeverity, string> = {
  low: "Низький", medium: "Середній", high: "Високий", critical: "Критичний",
};

export const CATEGORY_LABELS: Record<ProblemCategory, string> = {
  technical: "Технічна", organizational: "Організаційна", financial: "Фінансова",
  personnel: "Кадрова", external: "Зовнішня", other: "Інша",
};

export const SOLUTION_STATUS_LABELS: Record<SolutionStatus, string> = {
  planned: "Заплановано", in_progress: "В процесі", resolved: "Вирішено", deferred: "Відкладено",
};

export const FINANCIAL_MODE_LABELS: Record<FinancialMode, string> = {
  no_budget:   "Фінансування не передбачено",
  open_source: "Відкриті ресурси (open-source)",
  standard:    "Стандартне бюджетне фінансування",
  mixed:       "Змішане / опис вручну",
};

// ── Serializers: meta → human-readable text ───────────────────────────────────

function fmtDate(s: string | undefined): string {
  if (!s) return "";
  const d = new Date(s);
  return isNaN(d.getTime()) ? s : d.toLocaleDateString("uk-UA", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function serializeGoals(items: GoalItem[]): string {
  const goals = items.filter(i => i.type === "goal" && i.text.trim());
  const objectives = items.filter(i => i.type === "objective" && i.text.trim());
  const parts: string[] = [];
  if (goals.length) {
    parts.push("Мета дослідження:");
    goals.forEach((g, i) => parts.push(`${i + 1}. ${g.text.trim()}`));
  }
  if (objectives.length) {
    if (parts.length) parts.push("");
    parts.push("Завдання:");
    objectives.forEach((o, i) => parts.push(`${i + 1}. ${o.text.trim()}`));
  }
  return parts.join("\n");
}

export function serializeTimeline(
  meta: TimelineMeta,
  stages: Array<{ _id?: string; stageNumber: number; title: string }>,
): string {
  const parts: string[] = [];
  parts.push(`Загальний стан виконання: ${OVERALL_STATUS_LABELS[meta.overallStatus]}`);

  const stageLines = stages.filter(s => s._id && meta.stageStatuses[s._id]);
  if (stageLines.length) {
    parts.push("");
    parts.push("Стан виконання за етапами:");
    stageLines.forEach(s => {
      const st = meta.stageStatuses[s._id!];
      parts.push(`• Етап ${s.stageNumber}. ${s.title} — ${STAGE_STATUS_LABELS[st]}`);
    });
  }
  if (meta.manualNote?.trim()) {
    parts.push("");
    parts.push(meta.manualNote.trim());
  }
  return parts.join("\n");
}

export function serializeResults(items: ResultItem[]): string {
  const filled = items.filter(i => i.description.trim());
  if (!filled.length) return "";
  const parts = ["Наукові результати дослідження:", ""];
  filled.forEach((item, i) => {
    parts.push(`${i + 1}. ${RESULT_TYPE_LABELS[item.resultType]}`);
    parts.push(`   ${item.description.trim()}`);
    if (i < filled.length - 1) parts.push("");
  });
  return parts.join("\n");
}

export function serializePublications(
  meta: PublicationsMeta,
  publications: Array<{ _id?: string; title: string; type: string; authors?: string; expectedYear?: number | null; doi?: string }>,
  events: Array<{ _id?: string; title: string; type: string; startDate?: string; location?: string }>,
): string {
  if (meta.noPublications) {
    return "У звітному периоді публікацій та апробацій не було.";
  }
  const lines: string[] = ["Результати дослідження представлено у таких публікаціях та на наукових заходах:", ""];
  let idx = 1;

  const linkedPubs = publications.filter(p => p._id && meta.linkedPublicationIds.includes(p._id));
  linkedPubs.forEach(p => {
    const yearPart = p.expectedYear ? `, ${p.expectedYear}` : "";
    const doiPart = p.doi ? `. DOI: ${p.doi}` : "";
    lines.push(`${idx++}. ${p.authors ? p.authors + ". " : ""}«${p.title}»${yearPart}${doiPart}`);
  });

  const linkedEvents = events.filter(e => e._id && meta.linkedEventIds.includes(e._id));
  linkedEvents.forEach(e => {
    const datePart = e.startDate ? `, ${fmtDate(e.startDate)}` : "";
    const locPart = e.location ? `, ${e.location}` : "";
    lines.push(`${idx++}. Доповідь на ${e.title}${datePart}${locPart}`);
  });

  meta.manualEntries.filter(m => m.text.trim()).forEach(m => {
    lines.push(`${idx++}. ${m.text.trim()}`);
  });

  if (idx === 1) return "У звітному периоді публікацій та апробацій не було.";
  return lines.join("\n");
}

export function serializeFinancial(
  meta: FinancialMeta,
  budget: { totalPlanned: number; totalSpent: number; currency: string } | null,
): string {
  if (meta.mode === "no_budget") {
    return "Використання коштів не передбачено умовами проєкту.";
  }
  if (meta.mode === "open_source") {
    return "Всі роботи виконуються з використанням відкритих ресурсів (open-source програмне забезпечення та бази даних). Фінансових витрат у поточному периоді не здійснювалося.";
  }

  const parts: string[] = [];
  if (budget && (budget.totalPlanned > 0 || budget.totalSpent > 0)) {
    parts.push("Фінансування проєкту:");
    parts.push(`• Заплановано: ${budget.totalPlanned.toLocaleString("uk-UA")} ${budget.currency}`);
    parts.push(`• Використано: ${budget.totalSpent.toLocaleString("uk-UA")} ${budget.currency}`);
  }

  if (meta.selectedPhrases.length) {
    if (parts.length) parts.push("");
    meta.selectedPhrases.forEach(p => parts.push(p));
  }
  if (meta.customNote?.trim()) {
    if (parts.length) parts.push("");
    parts.push(meta.customNote.trim());
  }
  return parts.join("\n");
}

const SEVERITY_ICONS: Record<ProblemSeverity, string> = {
  low: "🔵", medium: "🟡", high: "🟠", critical: "🔴",
};
const SOLUTION_ICONS: Record<SolutionStatus, string> = {
  planned: "○", in_progress: "◑", resolved: "●", deferred: "⊘",
};

export function serializeProblems(items: ProblemItem[]): string {
  const filled = items.filter(i => i.title.trim());
  if (!filled.length) return "";
  const parts: string[] = [];
  filled.forEach((prob, pi) => {
    parts.push(`Проблема ${pi + 1}: ${prob.title.trim()}`);
    parts.push(`Рівень: ${SEVERITY_LABELS[prob.severity]} ${SEVERITY_ICONS[prob.severity]} | Категорія: ${CATEGORY_LABELS[prob.category]}`);
    if (prob.description.trim()) parts.push(`Опис: ${prob.description.trim()}`);
    if (prob.solutions.length) {
      parts.push("Шляхи вирішення:");
      prob.solutions.filter(s => s.description.trim()).forEach(sol => {
        const deadline = sol.deadline ? ` (до ${fmtDate(sol.deadline)})` : "";
        parts.push(`  ${SOLUTION_ICONS[sol.status]} ${sol.description.trim()}${deadline} — ${SOLUTION_STATUS_LABELS[sol.status]}`);
      });
    }
    if (pi < filled.length - 1) parts.push("");
  });
  return parts.join("\n");
}

export function serializePlans(items: PlanItem[]): string {
  const filled = items.filter(i => i.activity.trim());
  if (!filled.length) return "";
  const parts = ["Заходи, заплановані на наступний звітний период:", ""];
  filled.forEach((item, i) => {
    const deadline = item.deadline ? ` — до ${fmtDate(item.deadline)}` : "";
    const result = item.expectedResult?.trim() ? `\n   Очікуваний результат: ${item.expectedResult.trim()}` : "";
    parts.push(`${i + 1}. ${item.activity.trim()}${deadline}${result}`);
  });
  return parts.join("\n");
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}
