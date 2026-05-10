export type TemplateId = "phd_dissertation" | "grant_nan" | "empty";

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
  const base = new Date(projectStart);
  return template.stages.map((s) => ({
    startDate: addWeeks(base, s.startWeek),
    endDate: addWeeks(base, s.endWeek),
    milestoneDate: addWeeks(base, s.endWeek),
  }));
}

// ── PhD Dissertation template ─────────────────────────────────────────────────
// Universal 4-year doctoral template aligned with:
// - CMU Resolution No. 261 (Ukrainian aspirantura regulations)
// - Salzburg II principles, Vitae RDF 2025, European Charter for Researchers
// - EC Open Science / Horizon Europe DMP guidance
// 6 phases × 208 weeks (4 years)

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
      goals:
        "Оформити зарахування до аспірантури та підтвердити акредитовану освітньо-наукову програму. Призначити наукового керівника, визначити склад наукової групи та розподілити ролі. Сформувати та затвердити індивідуальний навчальний план і індивідуальний план науково-дослідної роботи (у строк до 60 днів від дати зарахування). Провести організаційний семінар з керівником: зафіксувати порядок денний, рішення та наступну дату зустрічі. Визначити первинну тему, мету і завдання дослідження. Налаштувати систему управління проєктом: структуру WBS, канали комунікації та репозиторій документів.",
      goalsEn:
        "Complete enrolment in aspirantura and confirm the accredited educational-scientific programme. Appoint scientific supervisor, define the research team and assign roles. Draft and get approved the individual study plan and individual scientific-work plan (within 60 days of enrolment). Hold a supervisor kickoff meeting: record agenda, decisions and next review date. Define the preliminary topic, research aim and objectives. Configure the project management system: WBS structure, communication channels and document repository.",
      milestoneTitle: "Індивідуальні плани затверджено",
      milestoneTitleEn: "Individual plans approved",
    },
    {
      stageNumber: 2,
      title: "Дослідницький дизайн та методологія",
      titleEn: "Research Design & Methodology",
      startWeek: 14,
      endWeek: 52,
      goals:
        "Виконати систематичне картографування літератури: побудувати матрицю джерел із прогалинами та обґрунтуванням актуальності. Сформулювати дослідницькі питання, гіпотези та очікувані результати. Розробити та затвердити протокол дослідження (версія 1): мета, змінні, інструменти, методи, стандартні операційні процедури. Підготувати і подати пакет документів з етичної експертизи (за потреби). Скласти першу версію плану управління даними (DMP v1): резюме даних, FAIR-поля, доступ, ліцензія, безпека. Провести пілотну роботу або перевірку здійсненності та задокументувати висновки.",
      goalsEn:
        "Conduct systematic literature mapping: build a source matrix with gap statements and relevance rationale. Formulate research questions, hypotheses and expected outcomes. Develop and approve the research protocol (version 1): aim, variables, instruments, methods, SOPs. Prepare and submit the ethics/compliance package (where required). Draft the first data management plan (DMP v1): data summary, FAIR fields, access policy, license, security. Carry out a pilot or feasibility study and document findings.",
      milestoneTitle: "Дослідницький дизайн затверджено",
      milestoneTitleEn: "Research design approved",
    },
    {
      stageNumber: 3,
      title: "Збір даних та проведення досліджень",
      titleEn: "Data Collection & Research Execution",
      startWeek: 39,
      endWeek: 117,
      goals:
        "Виконати основні цикли збору даних, польових або лабораторних досліджень згідно з затвердженим протоколом. Вести журнали проведення досліджень: ідентифікатори серій, оператор, дати, місце, відхилення від протоколу. Реєструвати зразки, випадки або одиниці спостереження: джерело, дата збору, умови зберігання, ланцюг зберігання. Здійснювати систематичний контроль якості та перевірку цілісності даних після кожного циклу збору. Підготувати піврічні та річні звіти про виконання за результатами першого та другого років. Своєчасно повідомляти керівника про відхилення, ризики або зміни в протоколі.",
      goalsEn:
        "Execute the main cycles of data collection, fieldwork or laboratory research according to the approved protocol. Maintain experiment/run logs: run ID, operator, dates, location, deviations. Register samples, cases or observation units: source, collection date, storage conditions, chain of custody. Apply systematic quality control and data integrity checks after each collection cycle. Prepare semiannual and annual progress reports for Year 1 and Year 2. Promptly notify the supervisor of deviations, risks or protocol amendments.",
      milestoneTitle: "Основний масив даних зібрано",
      milestoneTitleEn: "Main data collection complete",
    },
    {
      stageNumber: 4,
      title: "Аналіз, інтерпретація та апробація результатів",
      titleEn: "Analysis, Interpretation & Dissemination",
      startWeek: 91,
      endWeek: 169,
      goals:
        "Виконати очищення, аналіз та інтерпретацію зібраних даних. Підготувати скрипти, блокноти та пакети для відтворюваності: версія набору даних, мітка скрипта, контрольна сума. Представити результати на конференціях, семінарах або внутрішніх наукових зібраннях — зафіксувати як апробацію. Написати, відрецензувати та подати першу наукову статтю або препринт у реферовані видання. Оновити план управління даними (DMP) та підготувати пакет відтворюваності для відкритого архіву. Провести перевірки надійності результатів, альтернативних пояснень та зовнішньої валідності.",
      goalsEn:
        "Perform cleaning, analysis and interpretation of collected data. Prepare reproducibility packages: dataset version, script tag, notebook, checksum. Present results at conferences, seminars or internal research events — record as approbation entries. Write, peer-review and submit the first scientific article or preprint to refereed venues. Update the data management plan (DMP) and prepare a reproducibility bundle for open-archive deposit. Conduct robustness checks, rival-explanation tests and external validity assessments.",
      milestoneTitle: "Перша публікація подана",
      milestoneTitleEn: "First publication submitted",
    },
    {
      stageNumber: 5,
      title: "Написання дисертації та підготовка репозиторію",
      titleEn: "Dissertation Writing & Repository Preparation",
      startWeek: 143,
      endWeek: 195,
      goals:
        "Написати всі розділи дисертації відповідно до вимог наказу МОН № 40: вступ, основні розділи, висновки, анотації (українською та англійською), список ключових слів. Структурувати вступ на підрозділи: проблема, актуальність, мета, завдання, заява про наукову новизну, методи, практичне значення. Пройти внутрішнє рецензування всіх розділів з науковим керівником та врахувати зауваження. Підготувати та опублікувати набори даних і програмний код у відкритих репозиторіях (GitHub, Zenodo або аналогах) із відповідними ідентифікаторами (DOI). Сформувати повний список літератури та додатки (інструменти, форми згоди, протоколи, таблиці). Підготувати заяву про доступність даних і коду для включення в рукопис.",
      goalsEn:
        "Write all dissertation chapters according to MESU Order No. 40: introduction, main chapters, conclusions, annotations in Ukrainian and English, keywords list. Structure the introduction into subsections: problem, relevance, aim, objectives, novelty claim, methods, practical significance. Complete internal chapter review with the supervisor and incorporate feedback. Prepare and publish datasets and code in open repositories (GitHub, Zenodo or equivalent) with DOI identifiers. Compile the full reference list and appendices (instruments, consent forms, protocols, tables). Prepare the data and code availability statement for inclusion in the manuscript.",
      milestoneTitle: "Рукопис дисертації готовий",
      milestoneTitleEn: "Dissertation manuscript complete",
    },
    {
      stageNumber: 6,
      title: "Захист та завершення",
      titleEn: "Defense & Project Closure",
      startWeek: 169,
      endWeek: 208,
      goals:
        "Підготувати та захистити повний рукопис на внутрішньому передзахисті (презентація та обговорення). Отримати висновок кафедри/підрозділу про наукову новизну та теоретично-практичне значення (у строк 2 тижні після передзахисту). Сформувати атестаційну справу: склад спеціалізованої вченої ради, рецензії офіційних опонентів, відзиви провідних організацій. Організувати публічний захист дисертації: підготувати повідомлення, забезпечити трансляцію (за потреби), сформувати протокол ради. Виконати фінальне архівування: здати рукопис у бібліотеку, зареєструвати в державному реєстрі, здійснити депозит у відкриті репозиторії з постійними ідентифікаторами. Закрити проєкт: підготувати підсумковий звіт, оновити ORCID та академічне CV.",
      goalsEn:
        "Prepare and defend the full manuscript at the internal pre-defense (presentation and discussion). Obtain the departmental conclusion on scientific novelty and theoretical-practical significance (within 2 weeks of the pre-defense). Build the attestation package: specialized academic council composition, official opponent reviews, leading organization endorsements. Arrange the public defense: prepare notices, ensure live streaming where required, produce council minutes. Complete final archiving: submit manuscript to the library, register in the state dissertation register, deposit in open repositories with permanent identifiers (DOI). Close the project: prepare the completion report, update ORCID profile and academic CV.",
      milestoneTitle: "Публічний захист пройдено",
      milestoneTitleEn: "Public defense completed",
    },
  ],
};

// ── Grant NAN / MES template ──────────────────────────────────────────────────
// Universal 3-year grant template for NAS of Ukraine / Ministry of Education grants
// 6 stages × 156 weeks (3 years), annual reporting cycle

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
      goals:
        "Провести аналітичний огляд вітчизняної та зарубіжної літератури за темою. Уточнити мету, завдання та очікувані результати гранту. Підготувати деталізований трирічний робочий план з розподілом завдань між виконавцями. Узгодити та затвердити методологію та підходи. Підготувати первинну версію плану управління науковими даними.",
      goalsEn:
        "Conduct an analytical review of domestic and international literature on the topic. Refine the grant aim, tasks and expected results. Prepare a detailed three-year work plan with task assignments among team members. Agree on and approve methodology and approaches. Prepare the initial version of the research data management plan.",
      milestoneTitle: "Огляд затверджено, план підписано",
      milestoneTitleEn: "Review approved, plan signed",
    },
    {
      stageNumber: 2,
      title: "Основні дослідження, Рік 1",
      titleEn: "Core Research, Year 1",
      startWeek: 14,
      endWeek: 52,
      goals:
        "Виконати заплановані дослідження першого року згідно з затвердженим робочим планом. Провести первинний збір та обробку даних. Виконати методологічну апробацію підходів. Підготувати та здати проміжний (піврічний) звіт. Взяти участь у науковій конференції або семінарі. Підготувати перший річний звіт.",
      goalsEn:
        "Execute Year 1 research tasks according to the approved work plan. Conduct primary data collection and processing. Test and validate methodological approaches. Prepare and submit the interim (semiannual) report. Participate in a scientific conference or seminar. Prepare the first annual report.",
      milestoneTitle: "Річний звіт 1 подано",
      milestoneTitleEn: "Annual Report 1 submitted",
    },
    {
      stageNumber: 3,
      title: "Основні дослідження, Рік 2",
      titleEn: "Core Research, Year 2",
      startWeek: 53,
      endWeek: 104,
      goals:
        "Виконати основні дослідження другого року. Провести поглиблений аналіз та інтерпретацію отриманих результатів. Підготувати та подати першу наукову статтю або препринт до реферованого видання. Представити результати на національній або міжнародній конференції. Підготувати та здати другий річний звіт.",
      goalsEn:
        "Execute Year 2 core research tasks. Conduct in-depth analysis and interpretation of results obtained. Prepare and submit the first scientific article or preprint to a refereed journal. Present results at a national or international conference. Prepare and submit the second annual report.",
      milestoneTitle: "Річний звіт 2 подано",
      milestoneTitleEn: "Annual Report 2 submitted",
    },
    {
      stageNumber: 4,
      title: "Завершення досліджень та аналіз",
      titleEn: "Research Completion & Analysis",
      startWeek: 105,
      endWeek: 130,
      goals:
        "Завершити всі заплановані експериментальні та аналітичні роботи. Узагальнити та систематизувати отримані результати. Провести перевірку відтворюваності та надійності ключових результатів. Підготувати набори даних та програмний код для відкритого архівування. Підготувати матеріали для публікацій.",
      goalsEn:
        "Complete all planned experimental and analytical work. Generalize and systematize results obtained. Conduct reproducibility and robustness checks on key findings. Prepare datasets and code for open archiving. Prepare materials for publications.",
      milestoneTitle: "Дослідження завершено",
      milestoneTitleEn: "Research completed",
    },
    {
      stageNumber: 5,
      title: "Публікації та апробація результатів",
      titleEn: "Publications & Results Dissemination",
      startWeek: 131,
      endWeek: 143,
      goals:
        "Підготувати та подати всі заплановані статті у реферовані видання. Виконати вимоги щодо відкритого доступу до публікацій. Опублікувати набори даних у відкритих репозиторіях з DOI-ідентифікаторами. Взяти участь у конференціях та семінарах. Представити результати науковому керівнику та науковій раді підрозділу.",
      goalsEn:
        "Prepare and submit all planned articles to refereed publications. Fulfil open-access requirements for publications. Publish datasets in open repositories with DOI identifiers. Participate in conferences and seminars. Present results to the scientific supervisor and divisional scientific council.",
      milestoneTitle: "Публікаційні вимоги виконано",
      milestoneTitleEn: "Publication requirements met",
    },
    {
      stageNumber: 6,
      title: "Підготовка та здача фінального звіту",
      titleEn: "Final Report Preparation & Submission",
      startWeek: 144,
      endWeek: 156,
      goals:
        "Підготувати фінальний звіт по проєкту: узагальнення всіх результатів, відповідність меті та завданням, практичне значення. Сформувати повний перелік результатів: публікації, виступи, набори даних, програмний код, патенти (за наявності). Виконати архівування вихідних даних та проміжних матеріалів. Передати результати замовнику або у відкритий доступ відповідно до угоди. Закрити грант та підготувати документи про завершення.",
      goalsEn:
        "Prepare the final project report: summarize all results, assess conformance with aim and tasks, state practical significance. Compile a complete list of outputs: publications, talks, datasets, code, patents (if applicable). Archive raw data and intermediate materials. Transfer results to the funder or place in open access as per the grant agreement. Close the grant and prepare completion documents.",
      milestoneTitle: "Фінальний звіт подано",
      milestoneTitleEn: "Final report submitted",
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
  empty: emptyTemplate,
};
