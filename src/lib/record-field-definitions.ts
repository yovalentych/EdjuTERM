export type FieldType = "text" | "textarea" | "date" | "number" | "select" | "steps" | "risk_items" | "repeatable" | "reagents" | "qc_points" | "troubleshooting";

export type FieldDef = {
  key: string;
  en: string;
  uk: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
  rows?: number;
  placeholder?: string;
};

export type KindConfig = {
  group: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  groupEn: string;
  groupUk: string;
  icon: string;
  color: string;
  labelEn: string;
  labelUk: string;
  supportsFiles: boolean;
  supportsZenodo: boolean;
  prefix: string;
  fields: FieldDef[];
};

export const GROUPS: Array<{ id: number; en: string; uk: string }> = [
  { id: 1, en: "Planning & Strategy",       uk: "Планування та стратегія" },
  { id: 2, en: "Methodology & Protocols",   uk: "Методологія та протоколи" },
  { id: 3, en: "Data & Measurements",       uk: "Дані та вимірювання" },
  { id: 4, en: "Samples & Materials",       uk: "Зразки та матеріали" },
  { id: 5, en: "Team & Communication",      uk: "Команда та комунікація" },
  { id: 6, en: "Risk, Safety & Ethics",     uk: "Ризики, безпека та етика" },
  { id: 7, en: "Outputs & Publications",    uk: "Результати та публікації" },
  { id: 8, en: "Knowledge & Standards",     uk: "Знання та стандарти" },
  { id: 9, en: "Finance & Resources",       uk: "Фінанси та ресурси" },
];

export const KIND_CONFIGS: Record<string, KindConfig> = {
  // ── Group 1: Planning & Strategy ─────────────────────────────────────────────

  research_question: {
    group: 1, groupEn: "Planning & Strategy", groupUk: "Планування та стратегія",
    icon: "❓", color: "indigo", prefix: "RQ",
    labelEn: "Research Question", labelUk: "Дослідницьке запитання",
    supportsFiles: false, supportsZenodo: false,
    fields: [
      { key: "question", en: "Research question", uk: "Дослідницьке запитання", type: "textarea", required: true, rows: 3, placeholder: "What is the effect of X on Y in population Z?" },
      { key: "type", en: "Question type", uk: "Тип запитання", type: "select", options: ["descriptive", "exploratory", "explanatory", "predictive", "evaluative"] },
      { key: "priority", en: "Priority", uk: "Пріоритет", type: "select", options: ["low", "medium", "high", "critical"] },
      { key: "status", en: "Status", uk: "Статус", type: "select", options: ["draft", "active", "answered", "dropped"] },
      { key: "hypothesis", en: "Related hypothesis", uk: "Пов'язана гіпотеза", type: "textarea", rows: 2 },
      { key: "related_stage", en: "Related project stage", uk: "Пов'язаний етап", type: "text", placeholder: "Stage 1, Stage 2..." },
    ],
  },

  literature_review: {
    group: 1, groupEn: "Planning & Strategy", groupUk: "Планування та стратегія",
    icon: "📚", color: "indigo", prefix: "LR",
    labelEn: "Literature Review", labelUk: "Огляд літератури",
    supportsFiles: true, supportsZenodo: false,
    fields: [
      { key: "scope", en: "Scope / domain", uk: "Охоплення / область", type: "text", required: true, placeholder: "e.g. PTSD biomarkers in military veterans" },
      { key: "search_strategy", en: "Search strategy (databases, terms)", uk: "Стратегія пошуку", type: "textarea", rows: 3, placeholder: "PubMed, Scopus, Web of Science; terms: ..." },
      { key: "date_range", en: "Date range of sources", uk: "Діапазон дат джерел", type: "text", placeholder: "2015–2025" },
      { key: "sources_count", en: "Number of sources reviewed", uk: "Кількість переглянутих джерел", type: "number" },
      { key: "key_findings", en: "Key findings / synthesis", uk: "Ключові висновки / синтез", type: "textarea", rows: 4 },
      { key: "gap_analysis", en: "Research gap analysis", uk: "Аналіз прогалин", type: "textarea", rows: 3 },
      { key: "conclusion", en: "Conclusion", uk: "Висновок", type: "textarea", rows: 2 },
    ],
  },

  theoretical_framework: {
    group: 1, groupEn: "Planning & Strategy", groupUk: "Планування та стратегія",
    icon: "🧠", color: "indigo", prefix: "TF",
    labelEn: "Theoretical Framework", labelUk: "Теоретична рамка",
    supportsFiles: false, supportsZenodo: false,
    fields: [
      { key: "paradigm", en: "Research paradigm", uk: "Дослідницька парадигма", type: "select", options: ["positivist", "interpretivist", "critical", "pragmatic", "constructivist", "post-positivist"] },
      { key: "key_theories", en: "Key theories & concepts", uk: "Ключові теорії та концепції", type: "textarea", required: true, rows: 4, placeholder: "List the main theories, models, or frameworks used..." },
      { key: "conceptual_model", en: "Conceptual model description", uk: "Опис концептуальної моделі", type: "textarea", rows: 3 },
      { key: "assumptions", en: "Underlying assumptions", uk: "Базові припущення", type: "textarea", rows: 2 },
      { key: "limitations", en: "Framework limitations", uk: "Обмеження рамки", type: "textarea", rows: 2 },
    ],
  },

  hypothesis: {
    group: 1, groupEn: "Planning & Strategy", groupUk: "Планування та стратегія",
    icon: "💡", color: "indigo", prefix: "HYP",
    labelEn: "Hypothesis", labelUk: "Гіпотеза",
    supportsFiles: false, supportsZenodo: false,
    fields: [
      { key: "statement", en: "Hypothesis statement", uk: "Формулювання гіпотези", type: "textarea", required: true, rows: 3, placeholder: "H1: X is significantly associated with Y in group Z..." },
      { key: "type", en: "Hypothesis type", uk: "Тип гіпотези", type: "select", options: ["null (H0)", "directional (H1)", "non-directional", "causal", "associative"] },
      { key: "variables", en: "Key variables (IV / DV)", uk: "Ключові змінні (НЗ / ЗЗ)", type: "text", placeholder: "IV: treatment dosage; DV: cortisol level" },
      { key: "expected_outcome", en: "Expected outcome", uk: "Очікуваний результат", type: "textarea", rows: 2 },
      { key: "test_method", en: "Statistical / analytical test", uk: "Статистичний / аналітичний тест", type: "text", placeholder: "t-test, ANOVA, regression, thematic analysis..." },
      { key: "status", en: "Status", uk: "Статус", type: "select", options: ["proposed", "testing", "supported", "rejected", "inconclusive"] },
    ],
  },

  project_charter: {
    group: 1, groupEn: "Planning & Strategy", groupUk: "Планування та стратегія",
    icon: "📋", color: "indigo", prefix: "CHR",
    labelEn: "Project Charter", labelUk: "Статутний документ",
    supportsFiles: false, supportsZenodo: false,
    fields: [
      { key: "purpose", en: "Project purpose / objective", uk: "Мета проєкту", type: "textarea", required: true, rows: 3 },
      { key: "scope_in", en: "Scope (in scope)", uk: "У рамках проєкту", type: "textarea", rows: 2 },
      { key: "scope_out", en: "Out of scope", uk: "Поза рамками проєкту", type: "textarea", rows: 2 },
      { key: "stakeholders", en: "Key stakeholders", uk: "Ключові стейкхолдери", type: "textarea", rows: 2 },
      { key: "constraints", en: "Constraints (time, budget, resources)", uk: "Обмеження", type: "textarea", rows: 2 },
      { key: "success_criteria", en: "Success criteria", uk: "Критерії успіху", type: "textarea", rows: 2 },
      { key: "assumptions", en: "Assumptions", uk: "Припущення", type: "textarea", rows: 2 },
    ],
  },

  // ── Group 2: Methodology & Protocols ─────────────────────────────────────────

  methodology: {
    group: 2, groupEn: "Methodology & Protocols", groupUk: "Методологія та протоколи",
    icon: "⚗️", color: "purple", prefix: "METH",
    labelEn: "Methodology", labelUk: "Методологія",
    supportsFiles: true, supportsZenodo: true,
    fields: [
      // ── Scientific scope ──────────────────────────────────────────────────────
      { key: "approval_status", en: "Approval status", uk: "Статус затвердження", type: "select", required: true, options: ["draft", "under_review", "approved", "deprecated", "archived"] },
      { key: "method_family", en: "Method family", uk: "Родина методів", type: "select", required: true, options: ["silica_spin_column", "organic_phenol_chloroform", "magnetic_beads", "automated_platform", "salting_out", "ctab", "cell_culture", "molecular_biology", "bioinformatics", "microscopy", "spectroscopy", "statistics", "machine_learning", "other"] },
      { key: "target_molecule", en: "Target molecule", uk: "Цільова молекула", type: "select", options: ["genomic_dna", "hmw_dna", "pathogen_dna", "total_dna", "rna", "total_rna", "mrna", "protein", "lipid", "metabolite", "total_nucleic_acids", "other"] },
      { key: "automation_mode", en: "Automation mode", uk: "Режим автоматизації", type: "select", options: ["manual", "semi_automated", "fully_automated"] },
      { key: "throughput_mode", en: "Throughput mode", uk: "Режим пропускної здатності", type: "select", options: ["single_sample", "batch", "plate_based", "high_throughput"] },
      { key: "method_variant", en: "Method variant / subtype", uk: "Варіант методу / підтип", type: "text", placeholder: "fresh_frozen_tissue, FFPE, bacterial_pellet…" },
      { key: "principle_of_isolation", en: "Principle of isolation / working mechanism", uk: "Принцип виділення / механізм дії", type: "textarea", required: true, rows: 3, placeholder: "Describe the chemistry or biological principle underlying the method…" },
      { key: "scientific_purpose", en: "Scientific purpose in this project", uk: "Наукова мета застосування у проєкті", type: "textarea", required: true, rows: 3, placeholder: "Why is this method used? What question does it answer?" },
      { key: "downstream_applications", en: "Supported downstream applications", uk: "Підтримувані подальші застосування", type: "repeatable" },
      { key: "major_limitations", en: "Known limitations", uk: "Відомі обмеження", type: "repeatable" },
      { key: "estimated_total_time_min", en: "Estimated total time (min)", uk: "Орієнтовний загальний час (хв)", type: "number" },
      // ── Sample scope ──────────────────────────────────────────────────────────
      { key: "sample_origin_categories", en: "Sample origin categories", uk: "Категорії походження зразків", type: "repeatable" },
      { key: "supported_sample_types", en: "Supported sample types", uk: "Підтримувані типи зразків", type: "repeatable" },
      { key: "preservation_states", en: "Supported preservation states", uk: "Підтримувані стани збереження", type: "repeatable" },
      { key: "inhibitors_of_concern", en: "Inhibitors / interferants of concern", uk: "Інгібітори / інтерференти, що мають значення", type: "repeatable" },
      { key: "pre_analytics_requirements", en: "Pre-analytics requirements", uk: "Переданалітичні вимоги", type: "repeatable" },
      { key: "required_sample_metadata", en: "Required sample metadata fields", uk: "Обов'язкові поля метаданих зразка", type: "repeatable" },
      // ── Materials ─────────────────────────────────────────────────────────────
      { key: "reagents", en: "Reagents", uk: "Реагенти", type: "reagents", required: true },
      { key: "equipment_notes", en: "Equipment (name | category | calibration required | notes)", uk: "Обладнання (назва | категорія | потрібне калібрування | нотатки)", type: "textarea", rows: 3, placeholder: "Microcentrifuge | centrifugation | yes | 14000×g capable\nHeat block | heating | yes | 56 °C\nNanoDrop | quantification | yes |" },
      { key: "controls_required", en: "Controls required per batch", uk: "Обов'язкові контролі на партію", type: "repeatable" },
      { key: "stop_points", en: "Safe stop points (where you can pause)", uk: "Безпечні зупинки (місця паузи)", type: "repeatable" },
      // ── Procedure ─────────────────────────────────────────────────────────────
      { key: "procedure_overview", en: "Procedure overview", uk: "Огляд процедури", type: "textarea", required: true, rows: 3 },
      { key: "procedure_steps", en: "Procedure steps", uk: "Кроки процедури", type: "steps", required: true },
      // ── QC plan ───────────────────────────────────────────────────────────────
      { key: "qc_points", en: "QC checkpoints", uk: "Контрольні точки якості", type: "qc_points", required: true },
      { key: "release_rule", en: "Release rule (when is the result accepted?)", uk: "Правило видачі результату (коли результат прийнятний?)", type: "textarea", rows: 2, required: true, placeholder: "Release if blank passes AND eluate meets purity AND dsDNA ≥ 10 ng/µL…" },
      // ── Safety ───────────────────────────────────────────────────────────────
      { key: "biosafety_level", en: "Biosafety level", uk: "Рівень біологічної безпеки", type: "select", options: ["not_applicable", "bsl_1", "bsl_2", "bsl_2_enhanced", "bsl_3", "institution_defined"] },
      { key: "ppe_required", en: "PPE required", uk: "Необхідні ЗІЗ", type: "repeatable" },
      { key: "engineering_controls", en: "Engineering controls", uk: "Інженерні засоби контролю", type: "repeatable" },
      { key: "hazard_warnings", en: "Hazard warnings", uk: "Попередження про небезпеки", type: "repeatable" },
      { key: "chemical_incompatibilities", en: "Chemical incompatibilities", uk: "Хімічна несумісність", type: "repeatable" },
      { key: "waste_streams", en: "Waste streams (type | container | autoclave OK?)", uk: "Відходи (тип | контейнер | автоклавування?)", type: "textarea", rows: 3, placeholder: "biohazard_solid | biohazard bin | yes\nhazardous_chemical_liquid | labeled guanidine waste | no" },
      { key: "requires_animal_approval", en: "Requires animal use approval", uk: "Потребує затвердження використання тварин", type: "select", options: ["yes", "no", "not_applicable"] },
      { key: "requires_human_subjects_review", en: "Requires human subjects review", uk: "Потребує огляду щодо людей-учасників", type: "select", options: ["yes", "no", "not_applicable"] },
      { key: "requires_biosafety_review", en: "Requires biosafety committee review", uk: "Потребує огляду комітету біобезпеки", type: "select", options: ["yes", "no", "not_applicable"] },
      { key: "troubleshooting", en: "Troubleshooting guide", uk: "Посібник з усунення неполадок", type: "troubleshooting" },
      // ── Outputs & governance ─────────────────────────────────────────────────
      { key: "output_form", en: "Primary output form", uk: "Основна форма виходу", type: "select", options: ["eluate", "precipitated_pellet", "purified_fraction", "lysate", "other"] },
      { key: "elution_buffer", en: "Elution / resuspension buffer", uk: "Буфер елюції / ресуспензії", type: "text", placeholder: "Buffer AE, nuclease-free water, TE…" },
      { key: "expected_yield_notes", en: "Expected yield / output notes", uk: "Очікуваний вихід / нотатки", type: "textarea", rows: 2, placeholder: "Typical: 10–30 µg from 25 mg liver tissue; A260/A280 ≈ 1.7–1.9…" },
      { key: "storage_short_term", en: "Short-term storage", uk: "Короткострокове зберігання", type: "text", placeholder: "-20 °C for up to 1 year" },
      { key: "storage_long_term", en: "Long-term storage", uk: "Довгострокове зберігання", type: "text", placeholder: "-80 °C" },
      { key: "freeze_thaw_limit", en: "Recommended max freeze-thaw cycles", uk: "Рекомендована максимальна кількість циклів замор./відт.", type: "number" },
      { key: "deviation_policy", en: "Deviation / change control policy", uk: "Політика відхилень / контролю змін", type: "textarea", rows: 2, placeholder: "Log and review any deviation before data release…" },
      { key: "review_cycle_days", en: "Review cycle (days)", uk: "Цикл перегляду (днів)", type: "number" },
      { key: "training_required", en: "Training required before use", uk: "Потрібне навчання перед використанням", type: "select", options: ["yes", "no"] },
      { key: "references", en: "Key references (citation or DOI)", uk: "Ключові посилання (цитата або DOI)", type: "textarea", rows: 2 },
    ],
  },

  sop: {
    group: 2, groupEn: "Methodology & Protocols", groupUk: "Методологія та протоколи",
    icon: "📐", color: "purple", prefix: "SOP",
    labelEn: "SOP", labelUk: "СОП",
    supportsFiles: true, supportsZenodo: false,
    fields: [
      { key: "sop_type", en: "SOP type", uk: "Тип СОП", type: "select", required: true, options: ["laboratory_procedure", "bioinformatics_workflow", "data_management", "sample_handling", "equipment_use", "safety", "quality_control", "documentation", "publication_workflow", "repository_deposit", "team_management", "other"] },
      { key: "sop_number", en: "SOP number", uk: "Номер СОП", type: "text", required: true, placeholder: "SOP-LAB-001" },
      { key: "approval_status", en: "Approval status", uk: "Статус затвердження", type: "select", options: ["draft", "under_review", "approved", "obsolete"] },
      { key: "sop_scope", en: "Scope and applicability", uk: "Область застосування", type: "textarea", required: true, rows: 2 },
      { key: "applicable_roles", en: "Applicable roles", uk: "Ролі, яких стосується", type: "text", placeholder: "phd_student, lab_member, technician…" },
      { key: "procedure_steps", en: "Procedure steps", uk: "Кроки процедури", type: "steps", required: true },
      { key: "safety_hazards", en: "Safety hazards", uk: "Небезпеки", type: "textarea", rows: 2 },
      { key: "ppe_required", en: "PPE required", uk: "Необхідні ЗІЗ", type: "text", placeholder: "Lab coat, nitrile gloves, safety goggles…" },
      { key: "biosafety_level", en: "Biosafety level", uk: "Рівень біологічної безпеки", type: "select", options: ["not_applicable", "bsl_1", "bsl_2", "bsl_3", "bsl_4", "institution_specific"] },
      { key: "quality_control", en: "Quality control checks (check | criteria | action)", uk: "Контроль якості (перевірка | критерій | дія)", type: "textarea", rows: 2, placeholder: "Baseline reading | <5% CV | repeat measurement" },
      { key: "deviation_management", en: "Deviations allowed", uk: "Відхилення дозволені", type: "select", options: ["yes", "no", "requires_supervisor_approval"] },
      { key: "review_interval_months", en: "Review interval (months)", uk: "Інтервал перегляду (місяці)", type: "number" },
      { key: "next_review_date", en: "Next review date", uk: "Дата наступного перегляду", type: "date" },
    ],
  },

  protocol: {
    group: 2, groupEn: "Methodology & Protocols", groupUk: "Методологія та протоколи",
    icon: "🔬", color: "purple", prefix: "PROT",
    labelEn: "Research Protocol", labelUk: "Протокол дослідження",
    supportsFiles: true, supportsZenodo: true,
    fields: [
      { key: "protocol_type", en: "Protocol type", uk: "Тип протоколу", type: "select", required: true, options: ["bioinformatics_analysis", "cell_culture_experiment", "animal_experiment", "molecular_biology_experiment", "qPCR", "cloning", "RNA_interference", "microscopy", "spectroscopy", "data_collection", "statistical_analysis", "machine_learning_analysis", "repository_deposit", "other"] },
      { key: "approval_status", en: "Approval status", uk: "Статус затвердження", type: "select", options: ["draft", "approved", "deprecated"] },
      { key: "linked_methodology", en: "Linked methodology (ID or title)", uk: "Пов'язана методологія (ID або назва)", type: "text", required: true },
      { key: "hypothesis_or_question", en: "Hypothesis / research question", uk: "Гіпотеза / дослідницьке запитання", type: "textarea", required: true, rows: 3 },
      { key: "design_type", en: "Experimental design type", uk: "Тип дизайну", type: "select", options: ["exploratory", "confirmatory", "validation", "pilot", "comparative", "time_series", "case_control", "computational_pipeline", "other"] },
      { key: "biological_replicates", en: "Biological replicates", uk: "Біологічних реплікатів", type: "number" },
      { key: "technical_replicates", en: "Technical replicates", uk: "Технічних реплікатів", type: "number" },
      { key: "randomization_required", en: "Randomization required", uk: "Потрібна рандомізація", type: "select", options: ["yes", "no"] },
      { key: "blinding_required", en: "Blinding", uk: "Засліплення", type: "select", options: ["none", "single-blind", "double-blind", "triple-blind"] },
      { key: "execution_steps", en: "Execution steps", uk: "Кроки виконання", type: "steps" },
      { key: "acceptance_criteria", en: "Acceptance criteria", uk: "Критерії прийнятності", type: "repeatable" },
      { key: "failure_conditions", en: "Failure conditions", uk: "Умови невдачі", type: "repeatable" },
      { key: "ethics_ref", en: "Ethics approval reference", uk: "Посилання на етичний дозвіл", type: "text" },
    ],
  },

  data_collection_protocol: {
    group: 2, groupEn: "Methodology & Protocols", groupUk: "Методологія та протоколи",
    icon: "📝", color: "purple", prefix: "DCP",
    labelEn: "Data Collection Protocol", labelUk: "Протокол збору даних",
    supportsFiles: true, supportsZenodo: false,
    fields: [
      { key: "instrument", en: "Data collection instrument / tool", uk: "Інструмент збору даних", type: "text", required: true, placeholder: "Questionnaire, sensor, interview guide..." },
      { key: "collection_method", en: "Collection method", uk: "Метод збору", type: "select", options: ["survey", "interview", "observation", "experiment", "secondary_data", "wearable_sensor", "lab_assay", "other"] },
      { key: "inclusion_criteria", en: "Inclusion criteria", uk: "Критерії включення", type: "textarea", rows: 2 },
      { key: "exclusion_criteria", en: "Exclusion criteria", uk: "Критерії виключення", type: "textarea", rows: 2 },
      { key: "sampling_method", en: "Sampling method", uk: "Метод вибірки", type: "select", options: ["random", "stratified", "cluster", "purposive", "convenience", "snowball", "other"] },
      { key: "sample_size", en: "Planned sample size (n)", uk: "Запланований розмір вибірки (n)", type: "number" },
      { key: "data_format", en: "Data format / output", uk: "Формат даних / вихід", type: "text", placeholder: "CSV, SPSS .sav, video recordings..." },
    ],
  },

  analysis_protocol: {
    group: 2, groupEn: "Methodology & Protocols", groupUk: "Методологія та протоколи",
    icon: "📊", color: "purple", prefix: "ANP",
    labelEn: "Analysis Protocol", labelUk: "Протокол аналізу",
    supportsFiles: true, supportsZenodo: false,
    fields: [
      { key: "analysis_type", en: "Analysis type", uk: "Тип аналізу", type: "select", options: ["descriptive", "inferential", "regression", "ANOVA", "survival", "machine_learning", "qualitative_thematic", "network_analysis", "mixed", "other"] },
      { key: "software", en: "Statistical software", uk: "Статистичне ПЗ", type: "text", placeholder: "R 4.3, Python (scipy), SPSS 27, GraphPad Prism..." },
      { key: "preprocessing_steps", en: "Preprocessing / cleaning steps", uk: "Передобробка / очищення даних", type: "textarea", rows: 3 },
      { key: "primary_analysis", en: "Primary analysis plan", uk: "Основний план аналізу", type: "textarea", rows: 3 },
      { key: "secondary_analysis", en: "Secondary analyses", uk: "Вторинні аналізи", type: "textarea", rows: 2 },
      { key: "correction", en: "Multiple testing correction", uk: "Поправка на множинні порівняння", type: "text", placeholder: "Bonferroni, FDR (Benjamini-Hochberg)..." },
      { key: "effect_size", en: "Effect size measure", uk: "Показник розміру ефекту", type: "text", placeholder: "Cohen's d, η², OR, RR..." },
    ],
  },

  safety_protocol: {
    group: 2, groupEn: "Methodology & Protocols", groupUk: "Методологія та протоколи",
    icon: "🦺", color: "purple", prefix: "SAF",
    labelEn: "Safety Protocol", labelUk: "Протокол безпеки",
    supportsFiles: true, supportsZenodo: false,
    fields: [
      { key: "hazard_category", en: "Hazard category", uk: "Категорія небезпеки", type: "select", options: ["chemical", "biological", "physical", "radiation", "electrical", "fire", "ergonomic", "psychosocial", "other"] },
      { key: "hazards_description", en: "Specific hazards", uk: "Конкретні небезпеки", type: "textarea", required: true, rows: 3 },
      { key: "ppe_required", en: "Required PPE", uk: "Необхідні ЗІЗ", type: "textarea", rows: 2, placeholder: "Lab coat, nitrile gloves, safety goggles..." },
      { key: "emergency_procedures", en: "Emergency procedures", uk: "Дії у надзвичайних ситуаціях", type: "textarea", rows: 3 },
      { key: "responsible_person", en: "Safety officer / responsible", uk: "Відповідальний з безпеки", type: "text" },
      { key: "last_reviewed", en: "Last reviewed date", uk: "Дата останнього перегляду", type: "date" },
    ],
  },

  measurement_method: {
    group: 2, groupEn: "Methodology & Protocols", groupUk: "Методологія та протоколи",
    icon: "📏", color: "purple", prefix: "MM",
    labelEn: "Measurement Method", labelUk: "Метод вимірювання",
    supportsFiles: false, supportsZenodo: false,
    fields: [
      { key: "equipment_used", en: "Equipment / instrument", uk: "Обладнання / інструмент", type: "text", required: true },
      { key: "measurement_unit", en: "Unit of measurement", uk: "Одиниця вимірювання", type: "text", placeholder: "pg/mL, mmHg, arbitrary units..." },
      { key: "measurement_range", en: "Measurement range", uk: "Діапазон вимірювання", type: "text", placeholder: "0–1000 pg/mL" },
      { key: "uncertainty", en: "Uncertainty / accuracy", uk: "Похибка / точність", type: "text", placeholder: "±5%, CV < 10%..." },
      { key: "calibration_frequency", en: "Calibration frequency", uk: "Частота калібрування", type: "text", placeholder: "Daily, before each batch..." },
      { key: "procedure", en: "Step-by-step procedure", uk: "Покрокова процедура", type: "textarea", rows: 5 },
      { key: "validation_notes", en: "Method validation notes", uk: "Нотатки з валідації методу", type: "textarea", rows: 2 },
    ],
  },

  // ── Group 3: Data & Measurements ─────────────────────────────────────────────

  dataset: {
    group: 3, groupEn: "Data & Measurements", groupUk: "Дані та вимірювання",
    icon: "🗄️", color: "blue", prefix: "DATA",
    labelEn: "Dataset", labelUk: "Набір даних",
    supportsFiles: true, supportsZenodo: true,
    fields: [
      { key: "dataset_class", en: "Dataset class", uk: "Клас набору даних", type: "select", required: true, options: ["raw", "processed", "analysis_ready", "derived", "metadata_only", "external_reused", "synthetic", "supplementary"] },
      { key: "dataset_domain", en: "Scientific domain", uk: "Наукова область", type: "select", required: true, options: ["rna_seq", "qpcr", "microscopy", "spectroscopy", "hemodynamics", "cell_culture", "animal_experiment", "bioinformatics_annotation", "literature_review", "survey", "other"] },
      { key: "data_origin", en: "Data origin", uk: "Походження даних", type: "select", required: true, options: ["generated_in_project", "reused_public_dataset", "received_from_collaborator", "generated_by_instrument", "generated_by_software", "manually_curated", "other"] },
      { key: "metadata_standard", en: "Metadata standard", uk: "Стандарт метаданих", type: "select", options: ["internal", "datacite", "dublin_core", "bioschemas", "geo_sra_related", "domain_specific", "custom"] },
      { key: "fair_access_level", en: "FAIR – Access level", uk: "FAIR – Рівень доступу", type: "select", options: ["open", "embargoed", "restricted", "closed"] },
      { key: "fair_license", en: "FAIR – License", uk: "FAIR – Ліцензія", type: "select", options: ["CC0", "CC-BY-4.0", "CC-BY-NC-4.0", "MIT", "GPL-3.0", "restricted_custom", "not_selected"] },
      { key: "organism", en: "Organism / model system", uk: "Організм / модельна система", type: "text", placeholder: "Rattus norvegicus, H9c2 cells…" },
      { key: "source_protocols", en: "Source protocol IDs", uk: "ID вихідних протоколів", type: "text" },
      { key: "keywords_list", en: "Keywords", uk: "Ключові слова", type: "repeatable" },
      { key: "contains_personal_data", en: "Contains personal data", uk: "Містить персональні дані", type: "select", options: ["yes", "no"] },
      { key: "anonymization_status", en: "Anonymization status", uk: "Статус анонімізації", type: "select", options: ["not_applicable", "not_anonymized", "pseudonymized", "anonymized", "aggregated"] },
      { key: "quality_control_summary", en: "QC summary (metric | result | passed — one per line)", uk: "Резюме QC (метрика | результат | пройшов — по одному на рядок)", type: "textarea", rows: 3, placeholder: "RIN score | 8.5 | yes\nmapping_rate | 91.2% | yes\nduplicate_rate | 12% | yes" },
      { key: "deposit_status", en: "Repository deposit status", uk: "Статус депонування", type: "select", options: ["not_planned", "planned", "metadata_ready", "submitted", "published", "embargoed", "rejected"] },
      { key: "deposit_repository", en: "Target repository", uk: "Цільовий репозиторій", type: "text", placeholder: "Zenodo, GEO, OSF, figshare…" },
      { key: "deposit_doi", en: "Deposit DOI", uk: "DOI депозиту", type: "text" },
    ],
  },

  data_dictionary: {
    group: 3, groupEn: "Data & Measurements", groupUk: "Дані та вимірювання",
    icon: "📖", color: "blue", prefix: "DD",
    labelEn: "Data Dictionary", labelUk: "Словник даних",
    supportsFiles: false, supportsZenodo: false,
    fields: [
      { key: "dataset_reference", en: "Describes dataset (localId)", uk: "Описує набір даних (localId)", type: "text", placeholder: "PRJ-DATA-2025-S1-001" },
      { key: "total_variables", en: "Total number of variables", uk: "Загальна кількість змінних", type: "number" },
      { key: "primary_key", en: "Primary key / ID column", uk: "Первинний ключ / ID колонка", type: "text", placeholder: "subject_id" },
      { key: "missing_value_code", en: "Missing value code", uk: "Код відсутніх значень", type: "text", placeholder: "NA, -999, ." },
      { key: "encoding", en: "File encoding", uk: "Кодування файлу", type: "text", placeholder: "UTF-8, Windows-1251..." },
      { key: "variables_description", en: "Variables (name | type | unit | description — one per line)", uk: "Змінні (назва | тип | одиниця | опис — по одній на рядок)", type: "textarea", rows: 8, placeholder: "subject_id | integer | — | Unique participant identifier\nage | integer | years | Age at enrollment\ncortisol_t0 | float | pg/mL | Cortisol at baseline" },
    ],
  },

  data_collection_form: {
    group: 3, groupEn: "Data & Measurements", groupUk: "Дані та вимірювання",
    icon: "📋", color: "blue", prefix: "DCF",
    labelEn: "Data Collection Form", labelUk: "Форма збору даних",
    supportsFiles: false, supportsZenodo: false,
    fields: [
      { key: "form_type", en: "Form type", uk: "Тип форми", type: "select", options: ["questionnaire", "interview_guide", "observation_sheet", "lab_entry_form", "CRF", "checklist", "other"] },
      { key: "language", en: "Language", uk: "Мова", type: "text", placeholder: "Ukrainian, English..." },
      { key: "sections", en: "Number of sections", uk: "Кількість розділів", type: "number" },
      { key: "total_items", en: "Total number of items / questions", uk: "Загальна кількість питань", type: "number" },
      { key: "form_content", en: "Form content / questions", uk: "Зміст форми / питання", type: "textarea", rows: 8, placeholder: "SECTION 1: Demographics\n1. Age: ___\n2. Sex: M / F\n..." },
      { key: "validation_rules", en: "Validation rules", uk: "Правила валідації", type: "textarea", rows: 2, placeholder: "Age must be 18-65; cortisol must be > 0..." },
    ],
  },

  measurement_log: {
    group: 3, groupEn: "Data & Measurements", groupUk: "Дані та вимірювання",
    icon: "📉", color: "blue", prefix: "ML",
    labelEn: "Measurement Log", labelUk: "Журнал вимірювань",
    supportsFiles: true, supportsZenodo: false,
    fields: [
      { key: "measurement_type", en: "What is being measured", uk: "Що вимірюється", type: "text", required: true, placeholder: "Blood pressure, cortisol, temperature..." },
      { key: "equipment_id", en: "Equipment ID / name", uk: "ID / назва обладнання", type: "text" },
      { key: "operator", en: "Operator name", uk: "Ім'я оператора", type: "text" },
      { key: "units", en: "Measurement units", uk: "Одиниці вимірювання", type: "text" },
      { key: "conditions", en: "Environmental / experimental conditions", uk: "Умови вимірювання", type: "textarea", rows: 2 },
      { key: "log_entries", en: "Log entries (date | value | notes — one per line)", uk: "Записи журналу (дата | значення | нотатки — по одній на рядок)", type: "textarea", rows: 8, placeholder: "2025-03-01 | 145.2 | baseline\n2025-03-02 | 148.7 | post-treatment" },
    ],
  },

  calibration_record: {
    group: 3, groupEn: "Data & Measurements", groupUk: "Дані та вимірювання",
    icon: "⚖️", color: "blue", prefix: "CAL",
    labelEn: "Calibration Record", labelUk: "Запис калібрування",
    supportsFiles: false, supportsZenodo: false,
    fields: [
      { key: "equipment_name", en: "Equipment name", uk: "Назва обладнання", type: "text", required: true },
      { key: "equipment_id", en: "Equipment serial / ID", uk: "Серійний номер / ID", type: "text" },
      { key: "calibration_standard", en: "Standard / reference used", uk: "Еталон / стандарт", type: "text" },
      { key: "calibration_date", en: "Calibration date", uk: "Дата калібрування", type: "date", required: true },
      { key: "result", en: "Result", uk: "Результат", type: "select", options: ["passed", "adjusted", "failed", "out_of_tolerance"] },
      { key: "uncertainty", en: "Measurement uncertainty", uk: "Похибка вимірювання", type: "text" },
      { key: "next_calibration_due", en: "Next calibration due", uk: "Наступне калібрування", type: "date" },
      { key: "performed_by", en: "Performed by", uk: "Виконано", type: "text" },
    ],
  },

  experiment_log: {
    group: 3, groupEn: "Data & Measurements", groupUk: "Дані та вимірювання",
    icon: "🧫", color: "blue", prefix: "EXP",
    labelEn: "Experiment Log", labelUk: "Журнал експерименту",
    supportsFiles: true, supportsZenodo: false,
    fields: [
      { key: "experiment_type", en: "Experiment type", uk: "Тип експерименту", type: "select", required: true, options: ["bioinformatics_analysis", "cell_culture_experiment", "animal_experiment", "molecular_biology_experiment", "qPCR", "cloning", "RNA_interference", "overexpression", "microscopy", "spectroscopy", "hemodynamic_measurement", "biochemical_assay", "pilot_experiment", "validation_experiment", "other"] },
      { key: "execution_mode", en: "Execution mode", uk: "Режим виконання", type: "select", required: true, options: ["planned", "performed_as_planned", "performed_with_deviations", "failed", "cancelled", "repeated"] },
      { key: "protocol_used", en: "Protocol (ID or title)", uk: "Протокол (ID або назва)", type: "text", required: true },
      { key: "protocol_version", en: "Protocol version", uk: "Версія протоколу", type: "text" },
      { key: "planned_start_date", en: "Planned start date", uk: "Запланована дата початку", type: "date" },
      { key: "actual_start_date", en: "Actual start date", uk: "Фактична дата початку", type: "date" },
      { key: "actual_end_date", en: "Actual end date", uk: "Фактична дата закінчення", type: "date" },
      { key: "operator", en: "Operator / experimenter", uk: "Оператор / дослідник", type: "text", required: true },
      { key: "location", en: "Location / lab", uk: "Місце / лабораторія", type: "text" },
      { key: "design_type", en: "Design type", uk: "Тип дизайну", type: "select", options: ["exploratory", "confirmatory", "pilot", "validation", "comparative", "time_series", "dose_response", "computational_pipeline", "other"] },
      { key: "biological_replicates", en: "Biological replicates", uk: "Біологічних реплікатів", type: "number" },
      { key: "technical_replicates", en: "Technical replicates", uk: "Технічних реплікатів", type: "number" },
      { key: "randomization_used", en: "Randomization used", uk: "Рандомізація застосована", type: "select", options: ["yes", "no"] },
      { key: "controls_used", en: "Controls used", uk: "Використані контролі", type: "text", placeholder: "negative control, positive control, sham…" },
      { key: "execution_steps_log", en: "Execution steps log", uk: "Журнал кроків виконання", type: "steps" },
      { key: "deviations", en: "Deviations from protocol", uk: "Відхилення від протоколу", type: "textarea", rows: 2, placeholder: "Describe any deviations, their type and impact…" },
      { key: "quality_control_results", en: "QC results (check | result | passed — one per line)", uk: "Результати QC (перевірка | результат | пройшов — по одному рядку)", type: "repeatable" },
      { key: "result_summary", en: "Result summary", uk: "Резюме результату", type: "textarea", required: true, rows: 3 },
      { key: "hypothesis_supported", en: "Hypothesis supported", uk: "Гіпотеза підтримана", type: "select", options: ["yes", "partially", "no", "inconclusive", "not_applicable"] },
      { key: "usable_for_publication", en: "Usable for publication", uk: "Придатний для публікації", type: "select", options: ["yes", "no", "potentially"] },
      { key: "usable_for_dissertation", en: "Usable for dissertation", uk: "Придатний для дисертації", type: "select", options: ["yes", "no", "potentially"] },
      { key: "limitations", en: "Limitations", uk: "Обмеження", type: "repeatable" },
      { key: "next_steps", en: "Next steps", uk: "Наступні кроки", type: "repeatable" },
      { key: "output_datasets", en: "Created dataset / result IDs", uk: "ID створених наборів даних / результатів", type: "text" },
    ],
  },

  // ── Group 4: Samples & Materials ─────────────────────────────────────────────

  sample: {
    group: 4, groupEn: "Samples & Materials", groupUk: "Зразки та матеріали",
    icon: "🧪", color: "sky", prefix: "SMP",
    labelEn: "Sample", labelUk: "Зразок",
    supportsFiles: true, supportsZenodo: false,
    fields: [
      { key: "sample_type", en: "Sample type", uk: "Тип зразка", type: "select", required: true, options: ["animal_tissue", "cell_culture", "primary_cells", "RNA", "DNA", "cDNA", "protein_extract", "plasmid", "bacterial_culture", "serum", "plasma", "buffer", "reagent_mix", "aliquot", "other"] },
      { key: "storage_status", en: "Storage status", uk: "Статус зберігання", type: "select", options: ["in_use", "stored", "transferred", "consumed", "destroyed", "lost", "unknown"] },
      { key: "sample_code", en: "Sample code", uk: "Код зразка", type: "text", required: true, placeholder: "SMP-RAT-MYO-2026-001" },
      { key: "collection_date", en: "Collected / created date", uk: "Дата збору / створення", type: "date" },
      { key: "organism", en: "Organism", uk: "Організм", type: "text", placeholder: "Rattus norvegicus" },
      { key: "strain_or_line", en: "Strain / cell line", uk: "Штам / клітинна лінія", type: "text", placeholder: "Wistar, H9c2…" },
      { key: "sex", en: "Sex", uk: "Стать", type: "select", options: ["male", "female", "mixed", "unknown", "not_applicable"] },
      { key: "tissue", en: "Tissue / cell type", uk: "Тканина / тип клітин", type: "text", placeholder: "myocardium, hepatocyte…" },
      { key: "disease_or_model", en: "Disease model / condition", uk: "Модель / умова досліду", type: "text", placeholder: "ischemia-reperfusion, anoxia-reoxygenation…" },
      { key: "concentration", en: "Concentration", uk: "Концентрація", type: "number" },
      { key: "concentration_unit", en: "Concentration unit", uk: "Одиниця концентрації", type: "text", placeholder: "ng/µL, µg/mL…" },
      { key: "purity_260_280", en: "Purity A260/A280", uk: "Чистота A260/A280", type: "number" },
      { key: "rin_score", en: "RIN / quality score", uk: "RIN / показник якості", type: "number" },
      { key: "storage_location", en: "Storage location", uk: "Місце зберігання", type: "text", placeholder: "Freezer B2-Rack3-Box5-A1" },
      { key: "temperature", en: "Storage temperature", uk: "Температура зберігання", type: "text", placeholder: "-80°C, -20°C, 4°C…" },
      { key: "expiration_date", en: "Expiration date", uk: "Термін придатності", type: "date" },
      { key: "biosafety_level", en: "Biosafety level", uk: "Рівень біобезпеки", type: "select", options: ["not_applicable", "bsl_1", "bsl_2", "bsl_3", "bsl_4", "institution_specific"] },
      { key: "ethics_approval_ref", en: "Ethics approval reference", uk: "Посилання на дозвіл", type: "text" },
    ],
  },

  reagent: {
    group: 4, groupEn: "Samples & Materials", groupUk: "Зразки та матеріали",
    icon: "🧴", color: "sky", prefix: "REA",
    labelEn: "Reagent / Material", labelUk: "Реагент / матеріал",
    supportsFiles: false, supportsZenodo: false,
    fields: [
      { key: "catalog_number", en: "Catalog / CAS number", uk: "Каталожний / CAS номер", type: "text", required: true },
      { key: "supplier", en: "Supplier", uk: "Постачальник", type: "text", required: true },
      { key: "batch_number", en: "Batch / lot number", uk: "Номер партії / лоту", type: "text" },
      { key: "expiry_date", en: "Expiry date", uk: "Термін придатності", type: "date" },
      { key: "storage_conditions", en: "Storage conditions", uk: "Умови зберігання", type: "text", placeholder: "-20°C, protected from light..." },
      { key: "quantity_available", en: "Quantity available", uk: "Доступна кількість", type: "text", placeholder: "2 vials × 1 mL" },
      { key: "location", en: "Storage location", uk: "Місце зберігання", type: "text", placeholder: "Freezer B2, shelf 3" },
      { key: "hazard_class", en: "Hazard class", uk: "Клас небезпеки", type: "select", options: ["none", "irritant", "corrosive", "flammable", "toxic", "biohazard", "radioactive", "oxidiser"] },
    ],
  },

  equipment: {
    group: 4, groupEn: "Samples & Materials", groupUk: "Зразки та матеріали",
    icon: "🔧", color: "sky", prefix: "EQP",
    labelEn: "Equipment", labelUk: "Обладнання",
    supportsFiles: false, supportsZenodo: false,
    fields: [
      { key: "model", en: "Make and model", uk: "Виробник та модель", type: "text", required: true, placeholder: "Thermo Fisher Scientific iCE 3300" },
      { key: "serial_number", en: "Serial number", uk: "Серійний номер", type: "text" },
      { key: "location", en: "Physical location", uk: "Фізичне розташування", type: "text", placeholder: "Lab 204, Building A" },
      { key: "status", en: "Status", uk: "Статус", type: "select", options: ["operational", "in_service", "calibration_needed", "repair", "decommissioned"] },
      { key: "last_calibrated", en: "Last calibration date", uk: "Дата останнього калібрування", type: "date" },
      { key: "next_service_due", en: "Next service / maintenance due", uk: "Наступне обслуговування", type: "date" },
      { key: "responsible_person", en: "Responsible person", uk: "Відповідальна особа", type: "text" },
      { key: "purchase_date", en: "Purchase date", uk: "Дата придбання", type: "date" },
    ],
  },

  consumable: {
    group: 4, groupEn: "Samples & Materials", groupUk: "Зразки та матеріали",
    icon: "📦", color: "sky", prefix: "CON",
    labelEn: "Consumable", labelUk: "Витратний матеріал",
    supportsFiles: false, supportsZenodo: false,
    fields: [
      { key: "category", en: "Category", uk: "Категорія", type: "select", options: ["pipette_tips", "tubes_vials", "plates_dishes", "filters_membranes", "syringes_needles", "reagents", "kits", "glassware", "PPE", "other"] },
      { key: "supplier", en: "Supplier", uk: "Постачальник", type: "text" },
      { key: "catalog_number", en: "Catalog number", uk: "Каталожний номер", type: "text" },
      { key: "quantity_in_stock", en: "Quantity in stock", uk: "Залишок на складі", type: "number" },
      { key: "unit", en: "Unit", uk: "Одиниця", type: "text", placeholder: "box, pack, pcs" },
      { key: "minimum_stock_level", en: "Reorder threshold", uk: "Мінімальний рівень запасу", type: "number" },
      { key: "last_ordered", en: "Last ordered date", uk: "Дата останнього замовлення", type: "date" },
      { key: "location", en: "Storage location", uk: "Місце зберігання", type: "text" },
    ],
  },

  // ── Group 5: Team & Communication ────────────────────────────────────────────

  task: {
    group: 5, groupEn: "Team & Communication", groupUk: "Команда та комунікація",
    icon: "✅", color: "amber", prefix: "TASK",
    labelEn: "Team Task", labelUk: "Задача команди",
    supportsFiles: false, supportsZenodo: false,
    fields: [],
  },

  task_set: {
    group: 5, groupEn: "Team & Communication", groupUk: "Команда та комунікація",
    icon: "📋", color: "amber", prefix: "TSET",
    labelEn: "Task Set", labelUk: "Набір завдань",
    supportsFiles: false, supportsZenodo: false,
    fields: [
      { key: "task_set_type", en: "Task set type", uk: "Тип набору завдань", type: "select", required: true, options: ["dissertation_stage", "work_package", "experiment_workflow", "bioinformatics_pipeline", "publication_workflow", "conference_workflow", "dataset_deposit_workflow", "ethics_approval_workflow", "supervisor_reporting_workflow", "grant_reporting_workflow", "custom"] },
      { key: "template_or_instance", en: "Template or project instance", uk: "Шаблон або екземпляр проєкту", type: "select", required: true, options: ["template", "project_instance"] },
      { key: "start_date", en: "Start date", uk: "Дата початку", type: "date" },
      { key: "end_date", en: "End date", uk: "Дата кінця", type: "date" },
      { key: "duration_days", en: "Total duration (days)", uk: "Загальна тривалість (днів)", type: "number" },
      { key: "auto_schedule", en: "Auto-schedule from start", uk: "Автопланування від дати початку", type: "select", options: ["yes", "no"] },
      { key: "scope_description", en: "Scope description", uk: "Опис охоплення", type: "textarea", rows: 2 },
      { key: "tasks", en: "Task items (title | category | duration days | priority)", uk: "Завдання (назва | категорія | тривалість днів | пріоритет)", type: "steps" },
      { key: "milestones", en: "Milestones", uk: "Ключові дати", type: "repeatable" },
    ],
  },

  meeting_minutes: {
    group: 5, groupEn: "Team & Communication", groupUk: "Команда та комунікація",
    icon: "🗣️", color: "amber", prefix: "MTG",
    labelEn: "Meeting Minutes", labelUk: "Протокол зустрічі",
    supportsFiles: false, supportsZenodo: false,
    fields: [
      { key: "meeting_date", en: "Meeting date", uk: "Дата зустрічі", type: "date", required: true },
      { key: "participants", en: "Participants", uk: "Учасники", type: "text", required: true, placeholder: "Іваненко І., Петренко О., supervisor@univ.edu" },
      { key: "location", en: "Location / platform", uk: "Місце / платформа", type: "text", placeholder: "Zoom, Lab 204, Google Meet..." },
      { key: "agenda", en: "Agenda items", uk: "Порядок денний", type: "textarea", rows: 3, placeholder: "1. Progress update\n2. Data review\n3. Next steps" },
      { key: "decisions", en: "Decisions made", uk: "Прийняті рішення", type: "textarea", rows: 3 },
      { key: "action_items", en: "Action items (person: task: deadline)", uk: "Дії (особа: задача: термін)", type: "textarea", rows: 3, placeholder: "Іваненко: підготувати звіт: 2025-04-10\nПетренко: аналіз даних: 2025-04-15" },
      { key: "next_meeting", en: "Next meeting date", uk: "Дата наступної зустрічі", type: "date" },
    ],
  },

  decision_log: {
    group: 5, groupEn: "Team & Communication", groupUk: "Команда та комунікація",
    icon: "⚖️", color: "amber", prefix: "DEC",
    labelEn: "Decision Log", labelUk: "Журнал рішень",
    supportsFiles: false, supportsZenodo: false,
    fields: [
      { key: "decision_date", en: "Decision date", uk: "Дата рішення", type: "date", required: true },
      { key: "decision", en: "Decision statement", uk: "Формулювання рішення", type: "textarea", required: true, rows: 3 },
      { key: "alternatives", en: "Alternatives considered", uk: "Розглянуті альтернативи", type: "textarea", rows: 2 },
      { key: "rationale", en: "Rationale / justification", uk: "Обґрунтування", type: "textarea", rows: 2 },
      { key: "made_by", en: "Decision maker(s)", uk: "Відповідальні за рішення", type: "text" },
      { key: "impact", en: "Impact level", uk: "Рівень впливу", type: "select", options: ["low", "medium", "high", "critical"] },
      { key: "review_date", en: "Revisit / review date", uk: "Дата повторного розгляду", type: "date" },
    ],
  },

  raci: {
    group: 5, groupEn: "Team & Communication", groupUk: "Команда та комунікація",
    icon: "👥", color: "amber", prefix: "RACI",
    labelEn: "RACI / Roles", labelUk: "Матриця відповідальності",
    supportsFiles: false, supportsZenodo: false,
    fields: [
      { key: "team_members", en: "Team members", uk: "Члени команди", type: "text", placeholder: "PI, postdoc, PhD student, lab tech..." },
      { key: "activities", en: "Activities & RACI assignments (activity | R | A | C | I)", uk: "Активності та RACI (активність | В | П | К | І)", type: "textarea", rows: 8, placeholder: "Data collection | PhD student | PI | lab tech | supervisor\nData analysis | postdoc | PI | statistician | —\nReport writing | PI | PI | supervisor | funder" },
      { key: "approval_date", en: "Date approved", uk: "Дата затвердження", type: "date" },
    ],
  },

  training_record: {
    group: 5, groupEn: "Team & Communication", groupUk: "Команда та комунікація",
    icon: "🎓", color: "amber", prefix: "TRN",
    labelEn: "Training Record", labelUk: "Запис навчання",
    supportsFiles: false, supportsZenodo: false,
    fields: [
      { key: "participant", en: "Trainee name", uk: "Слухач", type: "text", required: true },
      { key: "trainer", en: "Trainer / instructor", uk: "Тренер / інструктор", type: "text" },
      { key: "training_topic", en: "Training topic", uk: "Тема навчання", type: "text", required: true, placeholder: "Lab safety, PCR technique, SPSS basics..." },
      { key: "training_date", en: "Training date", uk: "Дата навчання", type: "date", required: true },
      { key: "duration_hours", en: "Duration (hours)", uk: "Тривалість (годин)", type: "number" },
      { key: "outcome", en: "Outcome", uk: "Результат", type: "select", options: ["passed", "failed", "in_progress", "pending_assessment"] },
      { key: "certificate_reference", en: "Certificate / reference number", uk: "Номер сертифіката / посилання", type: "text" },
      { key: "expiry_date", en: "Certification expiry date", uk: "Термін дії сертифіката", type: "date" },
    ],
  },

  supervision_log: {
    group: 5, groupEn: "Team & Communication", groupUk: "Команда та комунікація",
    icon: "📓", color: "amber", prefix: "SUP",
    labelEn: "Supervision Meeting Minutes", labelUk: "Протокол наукового керівника",
    supportsFiles: false, supportsZenodo: false,
    fields: [
      { key: "meeting_type", en: "Meeting type", uk: "Тип зустрічі", type: "select", required: true, options: ["regular_supervision", "project_progress_review", "experiment_planning", "data_review", "publication_review", "grant_review", "attestation_preparation", "dissertation_chapter_review", "team_meeting", "urgent_issue_meeting", "other"] },
      { key: "meeting_date", en: "Meeting date", uk: "Дата зустрічі", type: "date", required: true },
      { key: "duration_minutes", en: "Duration (minutes)", uk: "Тривалість (хв)", type: "number" },
      { key: "location_or_platform", en: "Location / platform", uk: "Місце / платформа", type: "text", placeholder: "Zoom, Lab 204, Google Meet…" },
      { key: "participants", en: "Participants (name | role | attendance — one per line)", uk: "Учасники (ім'я | роль | присутність — по одному на рядок)", type: "textarea", rows: 2, placeholder: "Іваненко І. | phd_student | present\nПетренко О. | supervisor | present" },
      { key: "agenda_items", en: "Agenda items", uk: "Порядок денний", type: "repeatable" },
      { key: "completed_tasks_summary", en: "Completed since last meeting", uk: "Виконано з останньої зустрічі", type: "textarea", rows: 2 },
      { key: "delayed_items", en: "Delayed items / blockers", uk: "Затримані пункти / блокери", type: "textarea", rows: 2 },
      { key: "decisions", en: "Decisions made", uk: "Прийняті рішення", type: "repeatable" },
      { key: "action_items", en: "Action items (person | task | due date — one per line)", uk: "Дії (особа | завдання | термін — по одному на рядок)", type: "textarea", rows: 3, placeholder: "Іваненко: підготувати звіт: 2026-06-01\nПетренко: аналіз даних: 2026-06-07" },
      { key: "risks_identified", en: "Risks / issues raised", uk: "Виявлені ризики / проблеми", type: "textarea", rows: 2 },
      { key: "supervisor_assessment", en: "Supervisor overall assessment", uk: "Загальна оцінка керівника", type: "select", options: ["excellent_progress", "good_progress", "satisfactory_progress", "progress_with_concerns", "insufficient_progress", "not_assessed"] },
      { key: "supervisor_feedback_summary", en: "Supervisor feedback summary", uk: "Резюме зворотного зв'язку", type: "textarea", rows: 2 },
      { key: "required_corrections", en: "Required corrections", uk: "Необхідні виправлення", type: "repeatable" },
      { key: "recommended_next_steps", en: "Recommended next steps", uk: "Рекомендовані наступні кроки", type: "repeatable" },
      { key: "next_meeting_date", en: "Next meeting date", uk: "Дата наступної зустрічі", type: "date" },
    ],
  },

  // ── Group 6: Risk, Safety & Ethics ───────────────────────────────────────────

  risk: {
    group: 6, groupEn: "Risk, Safety & Ethics", groupUk: "Ризики, безпека та етика",
    icon: "⚠️", color: "rose", prefix: "RISK",
    labelEn: "Risk Register", labelUk: "Реєстр ризиків",
    supportsFiles: false, supportsZenodo: false,
    fields: [
      { key: "register_scope", en: "Register scope", uk: "Область реєстру", type: "select", required: true, options: ["whole_project", "work_package", "experiment", "protocol", "dataset", "publication", "grant", "defense", "team_management"] },
      { key: "risk_items", en: "Risk items", uk: "Елементи ризиків", type: "risk_items", required: true },
    ],
  },

  ethics_approval: {
    group: 6, groupEn: "Risk, Safety & Ethics", groupUk: "Ризики, безпека та етика",
    icon: "✅", color: "rose", prefix: "ETH",
    labelEn: "Ethics Approval", labelUk: "Етичний дозвіл",
    supportsFiles: true, supportsZenodo: false,
    fields: [
      { key: "committee_name", en: "Ethics committee name", uk: "Назва комітету", type: "text", required: true },
      { key: "approval_number", en: "Approval / reference number", uk: "Номер дозволу", type: "text", required: true },
      { key: "approval_date", en: "Date of approval", uk: "Дата дозволу", type: "date", required: true },
      { key: "valid_until", en: "Valid until", uk: "Дійсний до", type: "date" },
      { key: "conditions", en: "Conditions attached", uk: "Прикладені умови", type: "textarea", rows: 3 },
      { key: "amendment_history", en: "Amendments / renewals", uk: "Поправки / поновлення", type: "textarea", rows: 2 },
      { key: "scope_description", en: "Scope of approval", uk: "Обсяг дозволу", type: "textarea", rows: 2 },
    ],
  },

  dpia: {
    group: 6, groupEn: "Risk, Safety & Ethics", groupUk: "Ризики, безпека та етика",
    icon: "🔒", color: "rose", prefix: "DPIA",
    labelEn: "DPIA", labelUk: "Оцінка впливу на дані",
    supportsFiles: false, supportsZenodo: false,
    fields: [
      { key: "data_controller", en: "Data controller", uk: "Оператор персональних даних", type: "text", required: true },
      { key: "personal_data_types", en: "Types of personal data processed", uk: "Типи персональних даних", type: "textarea", required: true, rows: 2, placeholder: "Health data, genetic data, biometric data..." },
      { key: "processing_purposes", en: "Purposes of data processing", uk: "Мета обробки даних", type: "textarea", rows: 2 },
      { key: "legal_basis", en: "Legal basis (GDPR)", uk: "Правова підстава", type: "select", options: ["consent", "contract", "legal_obligation", "vital_interests", "public_task", "legitimate_interests"] },
      { key: "risks_identified", en: "Privacy risks identified", uk: "Виявлені ризики конфіденційності", type: "textarea", rows: 3 },
      { key: "protective_measures", en: "Protective measures", uk: "Заходи захисту", type: "textarea", rows: 3 },
      { key: "dpo_consultation_date", en: "DPO consultation date", uk: "Дата консультації з DPO", type: "date" },
      { key: "review_date", en: "Review date", uk: "Дата перегляду", type: "date" },
    ],
  },

  coi_declaration: {
    group: 6, groupEn: "Risk, Safety & Ethics", groupUk: "Ризики, безпека та етика",
    icon: "📜", color: "rose", prefix: "COI",
    labelEn: "COI Declaration", labelUk: "Декларація конфлікту інтересів",
    supportsFiles: false, supportsZenodo: false,
    fields: [
      { key: "declarant", en: "Declarant (person making declaration)", uk: "Особа, що декларує", type: "text", required: true },
      { key: "declaration_date", en: "Declaration date", uk: "Дата декларації", type: "date", required: true },
      { key: "relationships", en: "Financial / personal relationships declared", uk: "Задекларовані зв'язки", type: "textarea", required: true, rows: 3 },
      { key: "decision", en: "Decision", uk: "Рішення", type: "select", options: ["no_conflict", "managed_conflict", "withdrawal_required"] },
      { key: "management_measures", en: "Conflict management measures", uk: "Заходи управління конфліктом", type: "textarea", rows: 2 },
      { key: "reviewed_by", en: "Reviewed by", uk: "Перевірено", type: "text" },
    ],
  },

  safety_assessment: {
    group: 6, groupEn: "Risk, Safety & Ethics", groupUk: "Ризики, безпека та етика",
    icon: "🛡️", color: "rose", prefix: "SA",
    labelEn: "Safety Assessment", labelUk: "Оцінка безпеки",
    supportsFiles: false, supportsZenodo: false,
    fields: [
      { key: "assessment_scope", en: "Assessment scope (activity / process)", uk: "Область оцінки (активність / процес)", type: "textarea", required: true, rows: 2 },
      { key: "hazards_identified", en: "Hazards identified", uk: "Виявлені небезпеки", type: "textarea", rows: 3 },
      { key: "current_controls", en: "Existing control measures", uk: "Наявні заходи контролю", type: "textarea", rows: 2 },
      { key: "residual_risk_level", en: "Residual risk level", uk: "Залишковий рівень ризику", type: "select", options: ["low", "medium", "high", "unacceptable"] },
      { key: "additional_controls", en: "Additional controls recommended", uk: "Рекомендовані додаткові заходи", type: "textarea", rows: 2 },
      { key: "assessment_date", en: "Assessment date", uk: "Дата оцінки", type: "date" },
      { key: "next_review", en: "Next review date", uk: "Дата наступного перегляду", type: "date" },
      { key: "assessor", en: "Assessor name", uk: "Ім'я оцінювача", type: "text" },
    ],
  },

  // ── Group 7: Outputs & Publications ──────────────────────────────────────────

  output: {
    group: 7, groupEn: "Outputs & Publications", groupUk: "Результати та публікації",
    icon: "📤", color: "emerald", prefix: "OUT",
    labelEn: "Output", labelUk: "Результат",
    supportsFiles: true, supportsZenodo: true,
    fields: [],
  },

  conference_abstract: {
    group: 7, groupEn: "Outputs & Publications", groupUk: "Результати та публікації",
    icon: "🎤", color: "emerald", prefix: "ABS",
    labelEn: "Conference Abstract", labelUk: "Тезисний виступ",
    supportsFiles: true, supportsZenodo: false,
    fields: [
      { key: "conference_name", en: "Conference name", uk: "Назва конференції", type: "text", required: true },
      { key: "conference_date", en: "Conference date", uk: "Дата конференції", type: "date" },
      { key: "location", en: "Location", uk: "Місце", type: "text", placeholder: "Kyiv, Ukraine / Online" },
      { key: "presentation_type", en: "Presentation type", uk: "Тип виступу", type: "select", options: ["oral", "poster", "invited_talk", "workshop", "symposium", "lightning_talk"] },
      { key: "submission_deadline", en: "Abstract submission deadline", uk: "Дедлайн подачі тез", type: "date" },
      { key: "status", en: "Status", uk: "Статус", type: "select", options: ["draft", "submitted", "accepted", "rejected", "presented"] },
      { key: "abstract_text", en: "Abstract text", uk: "Текст тез", type: "textarea", rows: 6 },
    ],
  },

  dissertation_chapter: {
    group: 7, groupEn: "Outputs & Publications", groupUk: "Результати та публікації",
    icon: "📖", color: "emerald", prefix: "DCH",
    labelEn: "Dissertation Chapter", labelUk: "Розділ дисертації",
    supportsFiles: true, supportsZenodo: false,
    fields: [
      { key: "chapter_number", en: "Chapter number", uk: "Номер розділу", type: "number", required: true },
      { key: "chapter_type", en: "Chapter type", uk: "Тип розділу", type: "select", options: ["introduction", "literature_review", "methodology", "results", "discussion", "conclusion", "appendix"] },
      { key: "word_count", en: "Current word count", uk: "Поточна кількість слів", type: "number" },
      { key: "target_word_count", en: "Target word count", uk: "Цільова кількість слів", type: "number" },
      { key: "status", en: "Status", uk: "Статус", type: "select", options: ["outline", "first_draft", "revision", "submitted_to_supervisor", "approved"] },
      { key: "supervisor_feedback", en: "Latest supervisor feedback", uk: "Остання рецензія керівника", type: "textarea", rows: 3 },
      { key: "submission_date", en: "Submitted to supervisor date", uk: "Дата подачі керівнику", type: "date" },
    ],
  },

  patent: {
    group: 7, groupEn: "Outputs & Publications", groupUk: "Результати та публікації",
    icon: "💼", color: "emerald", prefix: "PAT",
    labelEn: "Patent / IP", labelUk: "Патент / ОІВ",
    supportsFiles: true, supportsZenodo: false,
    fields: [
      { key: "invention_title", en: "Invention title", uk: "Назва винаходу", type: "text", required: true },
      { key: "inventors", en: "Inventors (comma-separated)", uk: "Винахідники (через кому)", type: "text", required: true },
      { key: "patent_type", en: "Patent type", uk: "Тип патенту", type: "select", options: ["utility", "design", "plant", "provisional", "PCT", "European"] },
      { key: "jurisdiction", en: "Jurisdiction / country", uk: "Юрисдикція / країна", type: "text" },
      { key: "filing_date", en: "Filing date", uk: "Дата подачі", type: "date" },
      { key: "application_number", en: "Application number", uk: "Номер заявки", type: "text" },
      { key: "status", en: "Status", uk: "Статус", type: "select", options: ["drafting", "filed", "under_examination", "granted", "abandoned", "licensed"] },
      { key: "priority_date", en: "Priority date", uk: "Дата пріоритету", type: "date" },
    ],
  },

  report: {
    group: 7, groupEn: "Outputs & Publications", groupUk: "Результати та публікації",
    icon: "📑", color: "emerald", prefix: "RPT",
    labelEn: "Report", labelUk: "Звіт",
    supportsFiles: true, supportsZenodo: false,
    fields: [
      { key: "report_type", en: "Report type", uk: "Тип звіту", type: "select", required: true, options: ["interim", "annual", "final", "technical", "financial", "progress", "deliverable"] },
      { key: "reporting_period_start", en: "Reporting period start", uk: "Початок звітного періоду", type: "date" },
      { key: "reporting_period_end", en: "Reporting period end", uk: "Кінець звітного періоду", type: "date" },
      { key: "recipient", en: "Recipient (funder / institution)", uk: "Одержувач (грантодавець / установа)", type: "text" },
      { key: "submission_date", en: "Submission deadline", uk: "Дедлайн подачі", type: "date" },
      { key: "status", en: "Status", uk: "Статус", type: "select", options: ["draft", "submitted", "accepted", "revision_required", "approved"] },
      { key: "key_findings", en: "Key findings / executive summary", uk: "Ключові висновки / резюме", type: "textarea", rows: 3 },
    ],
  },

  outreach: {
    group: 7, groupEn: "Outputs & Publications", groupUk: "Результати та публікації",
    icon: "📢", color: "emerald", prefix: "OUT2",
    labelEn: "Outreach / Science Communication", labelUk: "Популяризація науки",
    supportsFiles: true, supportsZenodo: false,
    fields: [
      { key: "outreach_type", en: "Type", uk: "Тип", type: "select", required: true, options: ["blog_post", "press_release", "social_media", "public_lecture", "media_interview", "video", "podcast", "infographic", "exhibition", "other"] },
      { key: "platform", en: "Platform / venue", uk: "Платформа / майданчик", type: "text" },
      { key: "target_audience", en: "Target audience", uk: "Цільова аудиторія", type: "text", placeholder: "General public, school students, policy makers..." },
      { key: "published_date", en: "Published / scheduled date", uk: "Дата публікації / запланована", type: "date" },
      { key: "url", en: "URL / link", uk: "Посилання", type: "text", placeholder: "https://..." },
      { key: "reach", en: "Estimated reach / views", uk: "Охоплення / перегляди", type: "number" },
      { key: "language", en: "Language", uk: "Мова", type: "text", placeholder: "Ukrainian, English..." },
    ],
  },

  // ── Group 8: Knowledge & Standards ───────────────────────────────────────────

  literature_note: {
    group: 8, groupEn: "Knowledge & Standards", groupUk: "Знання та стандарти",
    icon: "📌", color: "violet", prefix: "LN",
    labelEn: "Literature Note", labelUk: "Анотація джерела",
    supportsFiles: false, supportsZenodo: false,
    fields: [
      { key: "doi_or_reference", en: "DOI or full citation", uk: "DOI або повне цитування", type: "text", required: true, placeholder: "10.1016/j.xxx or Author et al. (2024). Journal. DOI..." },
      { key: "publication_year", en: "Publication year", uk: "Рік публікації", type: "number" },
      { key: "authors", en: "Authors", uk: "Автори", type: "text" },
      { key: "journal_or_venue", en: "Journal / conference", uk: "Журнал / конференція", type: "text" },
      { key: "key_points", en: "Key points / main contributions", uk: "Ключові тези / головний внесок", type: "textarea", rows: 4 },
      { key: "methodology_notes", en: "Methodology notes", uk: "Нотатки про методологію", type: "textarea", rows: 2 },
      { key: "relevance", en: "Relevance to project", uk: "Релевантність для проєкту", type: "select", options: ["core", "supporting", "tangential", "contradictory", "background"] },
      { key: "quote_for_use", en: "Direct quotes / paraphrases to use", uk: "Цитати / перефразування для використання", type: "textarea", rows: 2 },
    ],
  },

  glossary: {
    group: 8, groupEn: "Knowledge & Standards", groupUk: "Знання та стандарти",
    icon: "🔤", color: "violet", prefix: "GLO",
    labelEn: "Glossary", labelUk: "Глосарій",
    supportsFiles: false, supportsZenodo: false,
    fields: [
      { key: "scope", en: "Domain / scope", uk: "Область / сфера застосування", type: "text", placeholder: "Molecular biology, statistics, regulatory..." },
      { key: "language", en: "Language", uk: "Мова", type: "select", options: ["uk", "en", "uk+en", "other"] },
      { key: "terms_count", en: "Number of terms", uk: "Кількість термінів", type: "number" },
      { key: "terms", en: "Terms (term | definition | source — one per line)", uk: "Терміни (термін | визначення | джерело — по одному на рядок)", type: "textarea", rows: 10, placeholder: "апоптоз | програмована загибель клітин | IUPAC\ncortisol | glucocorticoid hormone | MeSH" },
    ],
  },

  standard: {
    group: 8, groupEn: "Knowledge & Standards", groupUk: "Знання та стандарти",
    icon: "📏", color: "violet", prefix: "STD",
    labelEn: "Standard", labelUk: "Стандарт",
    supportsFiles: false, supportsZenodo: false,
    fields: [
      { key: "standard_number", en: "Standard number", uk: "Номер стандарту", type: "text", required: true, placeholder: "ISO 9001:2015, DSTU 4163:2020..." },
      { key: "issuing_organization", en: "Issuing organization", uk: "Організація-видавець", type: "text", placeholder: "ISO, IEC, ДСТУ, EN, DIN..." },
      { key: "version", en: "Version / year", uk: "Версія / рік", type: "text" },
      { key: "scope", en: "Scope of standard", uk: "Область застосування стандарту", type: "textarea", rows: 2 },
      { key: "applicable_to", en: "Applies to in this project", uk: "Застосовується до (у проєкті)", type: "textarea", rows: 2 },
      { key: "compliance_status", en: "Compliance status", uk: "Статус відповідності", type: "select", options: ["compliant", "partial", "non_compliant", "not_applicable", "pending_review"] },
      { key: "review_date", en: "Compliance review date", uk: "Дата перевірки відповідності", type: "date" },
    ],
  },

  regulatory_requirement: {
    group: 8, groupEn: "Knowledge & Standards", groupUk: "Знання та стандарти",
    icon: "⚖️", color: "violet", prefix: "REG",
    labelEn: "Regulatory Requirement", labelUk: "Нормативна вимога",
    supportsFiles: false, supportsZenodo: false,
    fields: [
      { key: "regulation_name", en: "Regulation / law name", uk: "Назва нормативного акту / закону", type: "text", required: true },
      { key: "article_section", en: "Article / section", uk: "Стаття / розділ", type: "text" },
      { key: "requirement_text", en: "Requirement description", uk: "Опис вимоги", type: "textarea", required: true, rows: 3 },
      { key: "applicable_to", en: "Applies to (in this project)", uk: "Застосовується до (у проєкті)", type: "text" },
      { key: "compliance_status", en: "Compliance status", uk: "Статус відповідності", type: "select", options: ["compliant", "partial", "non_compliant", "pending"] },
      { key: "responsible_person", en: "Compliance owner", uk: "Відповідальний за відповідність", type: "text" },
      { key: "review_date", en: "Next compliance review", uk: "Наступна перевірка відповідності", type: "date" },
    ],
  },

  // ── Group 9: Finance & Resources ─────────────────────────────────────────────

  purchase_request: {
    group: 9, groupEn: "Finance & Resources", groupUk: "Фінанси та ресурси",
    icon: "🛒", color: "orange", prefix: "PR",
    labelEn: "Purchase Request", labelUk: "Запит на закупівлю",
    supportsFiles: false, supportsZenodo: false,
    fields: [
      { key: "items_description", en: "Items to purchase (name | qty | unit price | supplier)", uk: "Перелік товарів (найменування | кіл. | ціна за од. | постачальник)", type: "textarea", required: true, rows: 4, placeholder: "Reagent Kit X | 2 | 3500 UAH | Sigma-Aldrich\nNitrile gloves M | 10 boxes | 120 UAH | local supplier" },
      { key: "total_estimated_cost", en: "Total estimated cost", uk: "Загальна орієнтовна вартість", type: "number" },
      { key: "currency", en: "Currency", uk: "Валюта", type: "select", options: ["UAH", "EUR", "USD", "GBP"] },
      { key: "justification", en: "Scientific justification", uk: "Наукове обґрунтування", type: "textarea", rows: 2 },
      { key: "priority", en: "Priority", uk: "Пріоритет", type: "select", options: ["low", "medium", "high", "urgent"] },
      { key: "budget_category", en: "Budget category / line", uk: "Бюджетна категорія / стаття", type: "text", placeholder: "Consumables, Equipment, Services..." },
      { key: "status", en: "Status", uk: "Статус", type: "select", options: ["draft", "submitted", "approved", "rejected", "ordered", "delivered"] },
      { key: "required_by", en: "Required by date", uk: "Потрібно до", type: "date" },
    ],
  },

  expense_record: {
    group: 9, groupEn: "Finance & Resources", groupUk: "Фінанси та ресурси",
    icon: "🧾", color: "orange", prefix: "EXP",
    labelEn: "Expense Record", labelUk: "Витратний запис",
    supportsFiles: false, supportsZenodo: false,
    fields: [
      { key: "expense_category", en: "Expense category", uk: "Категорія витрат", type: "select", required: true, options: ["equipment", "consumables", "travel", "publication_fees", "services", "personnel", "software", "other"] },
      { key: "description", en: "Description", uk: "Опис", type: "text", required: true },
      { key: "amount", en: "Amount", uk: "Сума", type: "number", required: true },
      { key: "currency", en: "Currency", uk: "Валюта", type: "select", options: ["UAH", "EUR", "USD", "GBP"] },
      { key: "expense_date", en: "Date of expense", uk: "Дата витрат", type: "date", required: true },
      { key: "receipt_reference", en: "Receipt / invoice reference", uk: "Чек / номер рахунку", type: "text" },
      { key: "budget_category", en: "Budget category / line", uk: "Бюджетна категорія / стаття", type: "text" },
      { key: "approved_by", en: "Approved by", uk: "Затверджено", type: "text" },
      { key: "reimbursement_status", en: "Reimbursement status", uk: "Статус відшкодування", type: "select", options: ["pending", "reimbursed", "not_applicable"] },
    ],
  },
};

export function getKindsByGroup(): Array<{ group: { id: number; en: string; uk: string }; kinds: string[] }> {
  const grouped = new Map<number, string[]>();
  for (const [kind, cfg] of Object.entries(KIND_CONFIGS)) {
    const list = grouped.get(cfg.group) ?? [];
    list.push(kind);
    grouped.set(cfg.group, list);
  }
  return GROUPS.map((g) => ({ group: g, kinds: grouped.get(g.id) ?? [] }));
}
