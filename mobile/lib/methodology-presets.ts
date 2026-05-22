// Базові пресет-методички для лабораторних робіт
// Викладач може створити власну з нуля або взяти за основу

import type { MethodologyStep, MethodologyMaterial, GradingCriterion, BslLevel } from "./mobile-store";

export type MethodologyPreset = {
  id: string;
  title: string;
  emoji: string;
  subject: string;
  level: "school" | "bachelor" | "master";
  durationMinutes: number;
  bslLevel: BslLevel;
  description: string;
  procedureSteps: Omit<MethodologyStep, "id">[];
  materials: Omit<MethodologyMaterial, "id">[];
  safetyNotes: string;
  expectedResults: string;
  gradingCriteria: Omit<GradingCriterion, "id">[];
  maxScore: number;
};

export const METHODOLOGY_PRESETS: MethodologyPreset[] = [
  {
    id: "acid_base_titration",
    title: "Кислотно-основне титрування",
    emoji: "⚗️",
    subject: "Аналітична хімія",
    level: "bachelor",
    durationMinutes: 90,
    bslLevel: "BSL-1",
    description: "Визначення концентрації розчину кислоти титруванням розчином NaOH відомої концентрації з індикатором фенолфталеїном.",
    procedureSteps: [
      { title: "Підготовка робочого місця", description: "Перевірте чистоту бюретки, колб, піпетки. Підготуйте ЗІЗ.", expectedMinutes: 10 },
      { title: "Стандартизація розчину NaOH", description: "Заповніть бюретку розчином NaOH 0.1 M. Запишіть початковий рівень.", expectedMinutes: 10 },
      { title: "Підготовка проби", description: "Відберіть піпеткою 10 мл досліджуваного розчину кислоти у колбу Ерленмеєра. Додайте 2-3 краплі фенолфталеїну.", expectedMinutes: 5 },
      { title: "Титрування", description: "Повільно додавайте NaOH з бюретки, постійно перемішуючи. Зупиніться при появі стійкого рожевого забарвлення.", expectedMinutes: 15 },
      { title: "Повторні вимірювання", description: "Виконайте титрування мінімум 3 рази для статистичної надійності.", expectedMinutes: 30 },
      { title: "Розрахунки", description: "Обчисліть середнє значення та концентрацію кислоти за формулою C₁V₁ = C₂V₂.", expectedMinutes: 15 },
      { title: "Прибирання", description: "Помийте посуд, утилізуйте розчини за GLP, складіть звіт.", expectedMinutes: 5 },
    ],
    materials: [
      { name: "Розчин NaOH 0.1 M", kind: "reagent", quantity: "100 мл" },
      { name: "Досліджуваний розчин HCl", kind: "reagent", quantity: "50 мл" },
      { name: "Фенолфталеїн (індикатор)", kind: "reagent", quantity: "10 мл" },
      { name: "Бюретка 25 мл", kind: "equipment", quantity: "1 шт" },
      { name: "Колба Ерленмеєра 100 мл", kind: "consumable", quantity: "3 шт" },
      { name: "Піпетка 10 мл", kind: "equipment", quantity: "1 шт" },
    ],
    safetyNotes: "Обов'язкові окуляри і рукавички. NaOH їдкий — уникайте контакту зі шкірою. У разі потрапляння — змити великою кількістю води.",
    expectedResults: "Концентрація HCl має бути в межах 0.08-0.12 M. Відносна похибка < 5%.",
    gradingCriteria: [
      { label: "Дотримання техніки безпеки", maxPoints: 20 },
      { label: "Точність вимірювань", maxPoints: 30 },
      { label: "Якість розрахунків", maxPoints: 25 },
      { label: "Оформлення звіту", maxPoints: 15 },
      { label: "Висновки", maxPoints: 10 },
    ],
    maxScore: 100,
  },
  {
    id: "ph_measurement",
    title: "Вимірювання pH буферних розчинів",
    emoji: "🧪",
    subject: "Загальна хімія",
    level: "school",
    durationMinutes: 45,
    bslLevel: "BSL-1",
    description: "Освоєння роботи з pH-метром і дослідження властивостей буферних систем.",
    procedureSteps: [
      { title: "Калібрування pH-метра", description: "Калібруйте по стандартних буферах pH 4.0, 7.0, 10.0.", expectedMinutes: 10 },
      { title: "Підготовка зразків", description: "Налийте 3 невідомі буферні розчини в окремі стакани по 20 мл.", expectedMinutes: 5 },
      { title: "Вимірювання", description: "Виміряйте pH кожного зразка тричі, промивайте електрод дистильованою водою між зразками.", expectedMinutes: 15 },
      { title: "Реєстрація температури", description: "Запишіть температуру кожного зразка — pH від неї залежить.", expectedMinutes: 5 },
      { title: "Висновки", description: "Визначте тип кожного буферу (кислотний/нейтральний/лужний).", expectedMinutes: 10 },
    ],
    materials: [
      { name: "pH-метр з електродом", kind: "equipment", quantity: "1 шт" },
      { name: "Буфер pH 4.0", kind: "reagent", quantity: "50 мл" },
      { name: "Буфер pH 7.0", kind: "reagent", quantity: "50 мл" },
      { name: "Буфер pH 10.0", kind: "reagent", quantity: "50 мл" },
      { name: "Невідомі зразки", kind: "sample", quantity: "3 × 20 мл" },
      { name: "Дистильована вода", kind: "consumable", quantity: "200 мл" },
    ],
    safetyNotes: "Електрод pH-метра крихкий — не торкайтесь мембрани руками. Утилізуйте розчини у нейтралізатор.",
    expectedResults: "Похибка вимірювання < 0.05 pH одиниці. Студент розрізняє типи буферних систем.",
    gradingCriteria: [
      { label: "Калібрування", maxPoints: 25 },
      { label: "Техніка вимірювань", maxPoints: 30 },
      { label: "Розшифровка результатів", maxPoints: 25 },
      { label: "Звіт", maxPoints: 20 },
    ],
    maxScore: 100,
  },
  {
    id: "gram_staining",
    title: "Фарбування за Грамом",
    emoji: "🦠",
    subject: "Мікробіологія",
    level: "bachelor",
    durationMinutes: 120,
    bslLevel: "BSL-2",
    description: "Класична методика диференціальної ідентифікації бактерій на грам-позитивні та грам-негативні.",
    procedureSteps: [
      { title: "Підготовка мазка", description: "Нанесіть петлею культуру бактерій на предметне скло, рівномірно розподіліть у фіксованому колі.", expectedMinutes: 10 },
      { title: "Фіксація", description: "Висушіть мазок на повітрі, потім тричі проведіть над полум'ям для фіксації.", expectedMinutes: 10 },
      { title: "Фарбування генціановим фіолетовим", description: "Нанесіть барвник на 1 хвилину. Промийте водою.", expectedMinutes: 5 },
      { title: "Закріплення розчином Люголя", description: "Нанесіть на 1 хвилину. Промийте водою.", expectedMinutes: 5 },
      { title: "Знебарвлення спиртом", description: "Промивайте 96% етанолом 10-15 секунд до зникнення синього кольору з стоку.", expectedMinutes: 5 },
      { title: "Фарбування фуксином", description: "Нанесіть на 30 секунд. Промийте водою. Висушіть фільтр-папером.", expectedMinutes: 5 },
      { title: "Мікроскопія", description: "Дослідіть препарат при ×1000 з імерсійною олією. Опишіть форму, розташування, забарвлення клітин.", expectedMinutes: 60 },
      { title: "Висновки", description: "Зробіть висновок про грам-приналежність і морфологію.", expectedMinutes: 20 },
    ],
    materials: [
      { name: "Культура бактерій (тест-штам)", kind: "sample", quantity: "1 чашка" },
      { name: "Генціановий фіолетовий", kind: "reagent", quantity: "10 мл" },
      { name: "Розчин Люголя", kind: "reagent", quantity: "10 мл" },
      { name: "Етанол 96%", kind: "reagent", quantity: "20 мл" },
      { name: "Фуксин (Pfeiffer)", kind: "reagent", quantity: "10 мл" },
      { name: "Імерсійна олія", kind: "reagent", quantity: "5 мл" },
      { name: "Мікроскоп", kind: "equipment", quantity: "1 шт" },
      { name: "Предметні скельця", kind: "consumable", quantity: "5 шт" },
    ],
    safetyNotes: "Робота з культурою бактерій — BSL-2. Обов'язково халат, рукавички, маска. Дезінфекція робочого місця до і після роботи. Утилізація культур — автоклавування.",
    expectedResults: "Грам-позитивні: фіолетові; грам-негативні: червоні. Опис морфології відповідає тест-штаму.",
    gradingCriteria: [
      { label: "Асептика", maxPoints: 25 },
      { label: "Якість мазка", maxPoints: 15 },
      { label: "Дотримання етапів фарбування", maxPoints: 20 },
      { label: "Опис під мікроскопом", maxPoints: 25 },
      { label: "Інтерпретація", maxPoints: 15 },
    ],
    maxScore: 100,
  },
  {
    id: "dna_extraction",
    title: "Екстракція ДНК зі щічного епітелію",
    emoji: "🧬",
    subject: "Молекулярна біологія",
    level: "master",
    durationMinutes: 150,
    bslLevel: "BSL-2",
    description: "Виділення геномної ДНК з клітин щічного епітелію методом фенол-хлороформ або колонковим набором.",
    procedureSteps: [
      { title: "Збір зразка", description: "Стерильним аплікатором зберіть епітелій з внутрішньої поверхні щоки.", expectedMinutes: 5 },
      { title: "Лізис клітин", description: "Поміст у пробірку з 500 мкл лізис-буферу + 20 мкл протеїнази K. Інкубація 56°C × 30 хв.", expectedMinutes: 35 },
      { title: "Депротеїнізація", description: "Додайте 250 мкл хлороформу, енергійно струшуйте 15 сек, центрифугуйте 13000 g × 10 хв.", expectedMinutes: 15 },
      { title: "Преципітація ДНК", description: "Відберіть верхню фазу. Додайте 2× об'єм 96% етанолу, інкубація −20°C × 30 хв.", expectedMinutes: 35 },
      { title: "Промивання", description: "Центрифугування 13000 g × 10 хв. Видаліть супернатант. Промивайте 70% етанолом, повторне центрифугування.", expectedMinutes: 15 },
      { title: "Розчинення", description: "Висушіть осад. Розчиніть у 50 мкл TE-буферу.", expectedMinutes: 15 },
      { title: "Контроль якості", description: "Виміряйте концентрацію (Nanodrop) і чистоту (A260/A280, A260/A230).", expectedMinutes: 20 },
      { title: "Звіт", description: "Запишіть концентрацію, чистоту, об'єм. Обчисліть загальний вихід.", expectedMinutes: 10 },
    ],
    materials: [
      { name: "Лізис-буфер", kind: "reagent", quantity: "1 мл" },
      { name: "Протеїназа K (20 мг/мл)", kind: "reagent", quantity: "50 мкл" },
      { name: "Хлороформ", kind: "reagent", quantity: "1 мл" },
      { name: "Етанол 96%", kind: "reagent", quantity: "5 мл" },
      { name: "Етанол 70%", kind: "reagent", quantity: "2 мл" },
      { name: "TE-буфер", kind: "reagent", quantity: "1 мл" },
      { name: "Центрифуга на 13000 g", kind: "equipment", quantity: "1 шт" },
      { name: "Термоблок 56°C", kind: "equipment", quantity: "1 шт" },
      { name: "Спектрофотометр (Nanodrop)", kind: "equipment", quantity: "1 шт" },
      { name: "Пробірки 1.5 мл", kind: "consumable", quantity: "10 шт" },
    ],
    safetyNotes: "Хлороформ токсичний — працюйте під витяжкою. Робота з біоматеріалом — BSL-2 (халат, рукавички, окуляри). Утилізація — у спецконтейнер.",
    expectedResults: "Концентрація ДНК > 20 нг/мкл, A260/A280 = 1.7-1.9 (чиста ДНК).",
    gradingCriteria: [
      { label: "Стерильна техніка", maxPoints: 20 },
      { label: "Якість лізису", maxPoints: 15 },
      { label: "Чистота екстракції", maxPoints: 30 },
      { label: "Інтерпретація A260/A280", maxPoints: 20 },
      { label: "Звіт і висновки", maxPoints: 15 },
    ],
    maxScore: 100,
  },
  {
    id: "cell_microscopy",
    title: "Мікроскопія рослинних клітин",
    emoji: "🌱",
    subject: "Біологія клітини",
    level: "school",
    durationMinutes: 60,
    bslLevel: "BSL-1",
    description: "Підготовка тимчасового препарату цибулі для спостереження клітинної структури.",
    procedureSteps: [
      { title: "Підготовка препарату", description: "Зніміть тонку плівку з внутрішньої сторони луски цибулі. Розправте на предметному склі у краплі води.", expectedMinutes: 10 },
      { title: "Фарбування йодом", description: "Додайте краплю розчину йоду для контрасту ядер.", expectedMinutes: 5 },
      { title: "Накриття скельцем", description: "Обережно опустіть покривне скельце під кутом, видаліть надлишок рідини фільтр-папером.", expectedMinutes: 5 },
      { title: "Огляд при ×40", description: "Знайдіть фокус, оцініть розташування клітин.", expectedMinutes: 10 },
      { title: "Огляд при ×400", description: "Деталізуйте клітинну стінку, ядро, цитоплазму. Замалюйте.", expectedMinutes: 20 },
      { title: "Висновки", description: "Опишіть форму клітин, видимі органели, спостерігайте різницю від тваринних клітин.", expectedMinutes: 10 },
    ],
    materials: [
      { name: "Цибуля ріпчаста", kind: "sample", quantity: "1 шт" },
      { name: "Розчин йоду (Люголь)", kind: "reagent", quantity: "5 мл" },
      { name: "Мікроскоп", kind: "equipment", quantity: "1 шт" },
      { name: "Предметне і покривне скельця", kind: "consumable", quantity: "2 шт" },
      { name: "Пінцет, скальпель", kind: "equipment", quantity: "1 шт" },
    ],
    safetyNotes: "Обережно зі скальпелем. Йод не пийте, мийте руки після роботи.",
    expectedResults: "Видно чіткі прямокутні клітини з клітинною стінкою, ядром і цитоплазмою.",
    gradingCriteria: [
      { label: "Якість препарату", maxPoints: 30 },
      { label: "Робота з мікроскопом", maxPoints: 30 },
      { label: "Малюнок і опис", maxPoints: 25 },
      { label: "Висновки", maxPoints: 15 },
    ],
    maxScore: 100,
  },
  {
    id: "photosynthesis_rate",
    title: "Швидкість фотосинтезу елодеї",
    emoji: "🌿",
    subject: "Фізіологія рослин",
    level: "school",
    durationMinutes: 75,
    bslLevel: "BSL-1",
    description: "Дослідження впливу інтенсивності світла на швидкість виділення кисню водною рослиною.",
    procedureSteps: [
      { title: "Підготовка установки", description: "У стакан з відстояною водою помістіть пагін елодеї стеблом догори.", expectedMinutes: 10 },
      { title: "Початкові умови", description: "Помістіть стакан на 30 см від лампи. Зачекайте 5 хв для адаптації.", expectedMinutes: 10 },
      { title: "Підрахунок (30 см)", description: "Підраховуйте бульбашки кисню за 1 хв, повторіть 3 рази.", expectedMinutes: 15 },
      { title: "Підрахунок (20 см)", description: "Перемістіть лампу на 20 см, повторіть підрахунок.", expectedMinutes: 15 },
      { title: "Підрахунок (10 см)", description: "Перемістіть на 10 см, повторіть підрахунок.", expectedMinutes: 15 },
      { title: "Графік і висновки", description: "Побудуйте графік залежності швидкості від відстані. Зробіть висновок.", expectedMinutes: 10 },
    ],
    materials: [
      { name: "Пагін елодеї", kind: "sample", quantity: "1 шт" },
      { name: "Відстояна вода", kind: "reagent", quantity: "200 мл" },
      { name: "Стакан хімічний 250 мл", kind: "consumable", quantity: "1 шт" },
      { name: "Лампа настільна", kind: "equipment", quantity: "1 шт" },
      { name: "Секундомір", kind: "equipment", quantity: "1 шт" },
      { name: "Лінійка", kind: "equipment", quantity: "1 шт" },
    ],
    safetyNotes: "Обережно з гарячою лампою. Не торкайтесь увімкненої лампи без рукавиць.",
    expectedResults: "Кількість бульбашок збільшується при зменшенні відстані до джерела світла.",
    gradingCriteria: [
      { label: "Методика експерименту", maxPoints: 30 },
      { label: "Точність підрахунку", maxPoints: 25 },
      { label: "Графік", maxPoints: 25 },
      { label: "Інтерпретація", maxPoints: 20 },
    ],
    maxScore: 100,
  },
  {
    id: "boyle_law",
    title: "Закон Бойля-Маріотта",
    emoji: "🎈",
    subject: "Фізика",
    level: "school",
    durationMinutes: 60,
    bslLevel: "BSL-1",
    description: "Експериментальне підтвердження залежності об'єму газу від тиску при постійній температурі.",
    procedureSteps: [
      { title: "Підготовка установки", description: "Зберіть установку з шприцом, манометром і затискачем.", expectedMinutes: 10 },
      { title: "Початкові вимірювання", description: "Запишіть атмосферний тиск і початковий об'єм газу у шприці.", expectedMinutes: 5 },
      { title: "Стиснення (5 точок)", description: "Поступово стискайте поршень, фіксуйте пари (V, P) для 5 значень об'єму.", expectedMinutes: 20 },
      { title: "Розширення (5 точок)", description: "Розтягуйте поршень, фіксуйте пари (V, P).", expectedMinutes: 15 },
      { title: "Графік pV = const", description: "Побудуйте графік V(1/P). Очікувана лінійна залежність.", expectedMinutes: 10 },
    ],
    materials: [
      { name: "Шприц 50 мл", kind: "equipment", quantity: "1 шт" },
      { name: "Манометр", kind: "equipment", quantity: "1 шт" },
      { name: "Штатив з затискачем", kind: "equipment", quantity: "1 шт" },
    ],
    safetyNotes: "Не стискайте шприц до критично малих об'ємів — можливий розлам корпусу.",
    expectedResults: "Графік V(1/P) — пряма лінія через початок координат, що підтверджує pV = const.",
    gradingCriteria: [
      { label: "Складання установки", maxPoints: 20 },
      { label: "Точність вимірювань", maxPoints: 30 },
      { label: "Графік", maxPoints: 30 },
      { label: "Висновки", maxPoints: 20 },
    ],
    maxScore: 100,
  },
];

export function getMethodologyPreset(id: string): MethodologyPreset | undefined {
  return METHODOLOGY_PRESETS.find(p => p.id === id);
}

export function searchMethodologyPresets(query: string): MethodologyPreset[] {
  const q = query.toLowerCase().trim();
  if (!q) return METHODOLOGY_PRESETS;
  return METHODOLOGY_PRESETS.filter(p =>
    p.title.toLowerCase().includes(q) ||
    p.subject.toLowerCase().includes(q) ||
    p.description.toLowerCase().includes(q)
  );
}
