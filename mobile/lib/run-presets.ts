// Швидкі пресети для одиничних аналізів (LabRun)
// Кожен пресет описує тип роботи, рекомендовані вимірювання і характер inputs

export type RunFieldType = "number" | "text" | "select";

export type RunFieldSpec = {
  label: string;
  unit: string;
  type: RunFieldType;
  hint?: string;
  options?: string[];        // для select
};

export type RunPreset = {
  id: string;
  label: string;
  shortLabel: string;
  emoji: string;
  description: string;
  color: string;
  measurements: RunFieldSpec[];  // що користувач буде записувати
  expectInputs: ("reagent" | "equipment" | "sample")[];
  durationHint?: string;
};

export const RUN_PRESETS: RunPreset[] = [
  {
    id: "ph",
    label: "Вимірювання pH",
    shortLabel: "pH",
    emoji: "🧪",
    description: "Контроль кислотності розчину з калібрівкою pH-метра",
    color: "#0f766e",
    expectInputs: ["sample", "equipment"],
    measurements: [
      { label: "pH",          unit: "pH",  type: "number", hint: "0–14" },
      { label: "Температура", unit: "°C",  type: "number", hint: "20–25 типово" },
    ],
    durationHint: "2–5 хв",
  },
  {
    id: "weighing",
    label: "Зважування",
    shortLabel: "Маса",
    emoji: "⚖️",
    description: "Точне зважування реагенту або зразка на аналітичних терезах",
    color: "#0369a1",
    expectInputs: ["reagent", "equipment"],
    measurements: [
      { label: "Тара",      unit: "г",  type: "number", hint: "посуд порожній" },
      { label: "Брутто",    unit: "г",  type: "number", hint: "з вмістом" },
      { label: "Нетто",     unit: "г",  type: "number", hint: "розрахункова" },
    ],
    durationHint: "1–3 хв",
  },
  {
    id: "dilution",
    label: "Розведення",
    shortLabel: "Розв.",
    emoji: "💧",
    description: "Підготовка розчину заданої концентрації з вихідного",
    color: "#0891b2",
    expectInputs: ["reagent", "equipment"],
    measurements: [
      { label: "C₁ (вихідна)",  unit: "M",   type: "number" },
      { label: "V₁ (відібрано)", unit: "мл", type: "number" },
      { label: "C₂ (кінцева)",  unit: "M",   type: "number" },
      { label: "V₂ (підсумок)", unit: "мл", type: "number" },
    ],
    durationHint: "5–10 хв",
  },
  {
    id: "pcr_setup",
    label: "PCR-сетап",
    shortLabel: "PCR",
    emoji: "🧬",
    description: "Підготовка реакційної суміші для ПЛР",
    color: "#7c3aed",
    expectInputs: ["reagent", "equipment", "sample"],
    measurements: [
      { label: "Зразків", unit: "шт",  type: "number" },
      { label: "Об'єм реакції", unit: "мкл", type: "number", hint: "20–50 типово" },
      { label: "Tm праймерів",  unit: "°C",  type: "number" },
      { label: "Циклів",  unit: "×",  type: "number", hint: "25–40" },
    ],
    durationHint: "15–30 хв",
  },
  {
    id: "colour",
    label: "Колориметрія",
    shortLabel: "Колір",
    emoji: "🎨",
    description: "Швидке визначення концентрації за кольором",
    color: "#dc2626",
    expectInputs: ["sample", "reagent", "equipment"],
    measurements: [
      { label: "Поглинання A", unit: "AU",  type: "number" },
      { label: "Довжина хвилі", unit: "нм", type: "number" },
      { label: "Концентрація", unit: "мг/мл", type: "number" },
    ],
    durationHint: "5–15 хв",
  },
  {
    id: "spectrum",
    label: "Спектр",
    shortLabel: "Спектр",
    emoji: "🌈",
    description: "UV/Vis або інше спектральне вимірювання",
    color: "#be123c",
    expectInputs: ["sample", "equipment"],
    measurements: [
      { label: "λ max",  unit: "нм", type: "number" },
      { label: "A при λ max", unit: "AU", type: "number" },
      { label: "Діапазон",  unit: "нм", type: "text", hint: "напр. 200–800" },
    ],
    durationHint: "5–10 хв",
  },
  {
    id: "centrifugation",
    label: "Центрифугування",
    shortLabel: "Центр.",
    emoji: "🌀",
    description: "Розділення фракцій за швидкістю осідання",
    color: "#d97706",
    expectInputs: ["sample", "equipment"],
    measurements: [
      { label: "Швидкість",   unit: "g",   type: "number", hint: "або rpm" },
      { label: "Час",         unit: "хв", type: "number" },
      { label: "Температура", unit: "°C",  type: "number" },
    ],
    durationHint: "5–30 хв",
  },
  {
    id: "microscopy",
    label: "Мікроскопія",
    shortLabel: "Мікр.",
    emoji: "🔬",
    description: "Огляд препарату під мікроскопом",
    color: "#059669",
    expectInputs: ["sample", "equipment"],
    measurements: [
      { label: "Збільшення",  unit: "×",    type: "number" },
      { label: "Об'єктів у полі", unit: "шт", type: "number" },
      { label: "Опис",        unit: "",     type: "text" },
    ],
    durationHint: "10–20 хв",
  },
  {
    id: "incubation",
    label: "Інкубація",
    shortLabel: "Інкуб.",
    emoji: "🌡️",
    description: "Витримування зразків при заданій температурі",
    color: "#ea580c",
    expectInputs: ["sample", "equipment"],
    measurements: [
      { label: "Температура", unit: "°C",  type: "number" },
      { label: "Час",         unit: "хв", type: "number" },
      { label: "Атмосфера",   unit: "",    type: "text", hint: "напр. CO₂ 5%" },
    ],
    durationHint: "30 хв – 24 год",
  },
  {
    id: "custom",
    label: "Інше",
    shortLabel: "Інше",
    emoji: "✏️",
    description: "Довільний аналіз — задайте поля самостійно",
    color: "#64748b",
    expectInputs: ["reagent", "equipment", "sample"],
    measurements: [],
    durationHint: "—",
  },
];

export function getRunPreset(id: string): RunPreset | undefined {
  return RUN_PRESETS.find(p => p.id === id);
}
