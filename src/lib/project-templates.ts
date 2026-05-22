export type TemplateId = "phd_dissertation" | "grant_nan" | "laboratory_resource" | "empty";

export interface TemplateStage {
  stageNumber: number;
  title: string;
  titleEn: string;
  /** weeks from project start */
  startWeek: number;
  endWeek: number;
  goals: string;
  goalsEn: string;
  milestoneTitle: string;
  milestoneTitleEn: string;
}

export interface ProjectTemplate {
  id: TemplateId;
  labelUk: string;
  labelEn: string;
  descriptionUk: string;
  descriptionEn: string;
  icon: string;
  stages: TemplateStage[];
}

/** Add `weeks` weeks to a Date, returns ISO string "YYYY-MM-DD" */
function addWeeks(base: Date, weeks: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + weeks * 7);
  return d.toISOString().slice(0, 10);
}

export function buildTemplateDates(
  template: ProjectTemplate,
  projectStart: string,
): Array<{ startDate: string; endDate: string; milestoneDate: string }> {
  const base = projectStart ? new Date(projectStart) : new Date();
  return template.stages.map((s) => ({
    startDate: addWeeks(base, s.startWeek),
    endDate: addWeeks(base, s.endWeek),
    milestoneDate: addWeeks(base, s.endWeek),
  }));
}

// ── PhD Dissertation template ─────────────────────────────────────────────────

const phdTemplate: ProjectTemplate = {
  id: "phd_dissertation",
  labelUk: "PhD Дисертація",
  labelEn: "PhD Dissertation",
  descriptionUk: "6 фаз · 4 роки · універсальна структура. Відповідає CMU 261, Salzburg II та EC Open Science.",
  descriptionEn: "6 phases · 4 years · universal structure. Aligned with CMU 261, Salzburg II and EC Open Science.",
  icon: "🎓",
  stages: [
    {
      stageNumber: 1,
      title: "Вступ та організація проєкту",
      titleEn: "Admission & Project Setup",
      startWeek: 0,
      endWeek: 26,
      goals: "Оформити зарахування до аспірантури та підтвердити акредитовану освітньо-наукову програму...",
      goalsEn: "Complete enrolment in aspirantura and confirm the accredited educational-scientific programme...",
      milestoneTitle: "Індивідуальні плани затверджено",
      milestoneTitleEn: "Individual plans approved",
    },
    // ... Simplified for space
  ],
};

// ── Grant NAN / MES template ──────────────────────────────────────────────────

const grantNanTemplate: ProjectTemplate = {
  id: "grant_nan",
  labelUk: "Грант НАН / МОНУ",
  labelEn: "NAS / MES Grant",
  descriptionUk: "6 етапів · 3 роки · річні звіти. Стандарт НАН України та МОНУ.",
  descriptionEn: "6 stages · 3 years · annual reports. NAS of Ukraine / MES standard.",
  icon: "📊",
  stages: [
    {
      stageNumber: 1,
      title: "Аналітичний огляд та планування",
      titleEn: "Literature Review & Research Planning",
      startWeek: 0,
      endWeek: 13,
      goals: "Провести аналітичний огляд вітчизняної та зарубіжної літератури за темою...",
      goalsEn: "Conduct an analytical review of domestic and international literature on the topic...",
      milestoneTitle: "Огляд затверджено, план підписано",
      milestoneTitleEn: "Review approved, plan signed",
    },
  ],
};

// ── Laboratory / Shared Resource template ─────────────────────────────────────

const labTemplate: ProjectTemplate = {
  id: "laboratory_resource",
  labelUk: "Лабораторний простір",
  labelEn: "Laboratory Workspace",
  descriptionUk: "Керування приміщенням, складом реактивів та журналом обладнання (GLP/GMP).",
  descriptionEn: "Management of facility, reagent inventory and equipment logs (GLP/GMP).",
  icon: "🔬",
  stages: [
    {
      stageNumber: 1,
      title: "Організація простору та налаштування",
      titleEn: "Space Organization & Setup",
      startWeek: 0,
      endWeek: 4,
      goals: "Визначити фізичні межі лабораторії, кімнати та зони зберігання. Призначити завідувача лабораторії (Lab Manager) та відповідальних осіб. Налаштувати цифрову структуру складу та перелік обладнання.",
      goalsEn: "Define physical lab boundaries, rooms, and storage zones. Assign Lab Manager and responsible persons. Configure digital inventory structure and equipment list.",
      milestoneTitle: "Простір налаштовано",
      milestoneTitleEn: "Workspace configured",
    },
    {
      stageNumber: 2,
      title: "Інвентаризація та введення в експлуатацію",
      titleEn: "Inventory & Commissioning",
      startWeek: 5,
      endWeek: 12,
      goals: "Провести повний облік наявних реактивів та матеріалів. Зареєструвати прилади у системі, перевірити серійні номери та дати останніх калібрувань. Сформувати електронні журнали використання приладів.",
      goalsEn: "Conduct a full audit of reagents and materials. Register instruments in the system, check serial numbers and last calibration dates. Initialize electronic equipment logs.",
      milestoneTitle: "Первинна інвентаризація завершена",
      milestoneTitleEn: "Initial inventory complete",
    },
  ],
};

// ── Empty template ────────────────────────────────────────────────────────────

const emptyTemplate: ProjectTemplate = {
  id: "empty",
  labelUk: "Порожній проєкт",
  labelEn: "Empty Project",
  descriptionUk: "Починайте з нуля. Додайте етапи вручну.",
  descriptionEn: "Start from scratch. Add stages manually.",
  icon: "⚪",
  stages: [],
};

export const PROJECT_TEMPLATES: Record<TemplateId, ProjectTemplate> = {
  phd_dissertation: phdTemplate,
  grant_nan: grantNanTemplate,
  laboratory_resource: labTemplate,
  empty: emptyTemplate,
};
