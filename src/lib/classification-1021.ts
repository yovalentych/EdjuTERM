/**
 * Classification of higher and vocational education specialties of Ukraine
 * Cabinet of Ministers Resolution No. 1021, 30 August 2024 (effective 1 November 2024)
 * Aligned with ISCED-F 2013
 */

export type FieldCode = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K";

export type Specialty = {
  code: string;       // e.g. "E1"
  fieldCode: FieldCode;
  name: string;       // Ukrainian
};

export type Field = {
  code: FieldCode;
  name: string;       // Ukrainian
  specialties: Specialty[];
};

export const CLASSIFICATION_1021: Field[] = [
  {
    code: "A",
    name: "Освіта",
    specialties: [
      { code: "A1",  fieldCode: "A", name: "Освітні науки" },
      { code: "A2",  fieldCode: "A", name: "Дошкільна освіта" },
      { code: "A3",  fieldCode: "A", name: "Початкова освіта" },
      { code: "A4",  fieldCode: "A", name: "Середня освіта (за предметними спеціальностями)" },
      { code: "A5",  fieldCode: "A", name: "Професійна освіта (за спеціалізаціями)" },
      { code: "A6",  fieldCode: "A", name: "Спеціальна освіта (за спеціалізаціями)" },
      { code: "A7",  fieldCode: "A", name: "Фізична культура і спорт" },
    ],
  },
  {
    code: "B",
    name: "Культура, мистецтво та гуманітарні науки",
    specialties: [
      { code: "B1",  fieldCode: "B", name: "Аудіовізуальне мистецтво та медіавиробництво" },
      { code: "B2",  fieldCode: "B", name: "Дизайн" },
      { code: "B3",  fieldCode: "B", name: "Декоративне мистецтво та ремесла" },
      { code: "B4",  fieldCode: "B", name: "Образотворче мистецтво та реставрація" },
      { code: "B5",  fieldCode: "B", name: "Музичне мистецтво" },
      { code: "B6",  fieldCode: "B", name: "Перформативні мистецтва" },
      { code: "B7",  fieldCode: "B", name: "Релігієзнавство" },
      { code: "B8",  fieldCode: "B", name: "Богослов'я" },
      { code: "B9",  fieldCode: "B", name: "Історія та археологія" },
      { code: "B10", fieldCode: "B", name: "Філософія" },
      { code: "B11", fieldCode: "B", name: "Філологія (за спеціалізаціями)" },
      { code: "B12", fieldCode: "B", name: "Культурологія та музеєзнавство" },
      { code: "B13", fieldCode: "B", name: "Бібліотечна, інформаційна та архівна справа" },
      { code: "B14", fieldCode: "B", name: "Організація соціокультурної діяльності" },
    ],
  },
  {
    code: "C",
    name: "Соціальні науки, журналістика та інформація",
    specialties: [
      { code: "C1",  fieldCode: "C", name: "Економіка" },
      { code: "C2",  fieldCode: "C", name: "Політологія" },
      { code: "C3",  fieldCode: "C", name: "Міжнародні відносини" },
      { code: "C4",  fieldCode: "C", name: "Психологія" },
      { code: "C5",  fieldCode: "C", name: "Соціологія" },
      { code: "C6",  fieldCode: "C", name: "Географія та регіональні студії" },
      { code: "C7",  fieldCode: "C", name: "Журналістика" },
    ],
  },
  {
    code: "D",
    name: "Бізнес, адміністрування та право",
    specialties: [
      { code: "D1",  fieldCode: "D", name: "Облік і оподаткування" },
      { code: "D2",  fieldCode: "D", name: "Фінанси, банківська справа, страхування та фондовий ринок" },
      { code: "D3",  fieldCode: "D", name: "Менеджмент" },
      { code: "D4",  fieldCode: "D", name: "Публічне управління та адміністрування" },
      { code: "D5",  fieldCode: "D", name: "Маркетинг" },
      { code: "D6",  fieldCode: "D", name: "Секретарська та офісна справа" },
      { code: "D7",  fieldCode: "D", name: "Торгівля" },
      { code: "D8",  fieldCode: "D", name: "Право" },
      { code: "D9",  fieldCode: "D", name: "Міжнародне право" },
    ],
  },
  {
    code: "E",
    name: "Природничі науки, математика та статистика",
    specialties: [
      { code: "E1",  fieldCode: "E", name: "Біологія та біохімія" },
      { code: "E2",  fieldCode: "E", name: "Екологія" },
      { code: "E3",  fieldCode: "E", name: "Хімія" },
      { code: "E4",  fieldCode: "E", name: "Науки про Землю" },
      { code: "E5",  fieldCode: "E", name: "Фізика та астрономія" },
      { code: "E6",  fieldCode: "E", name: "Прикладна фізика та наноматеріали" },
      { code: "E7",  fieldCode: "E", name: "Математика" },
      { code: "E8",  fieldCode: "E", name: "Статистика" },
    ],
  },
  {
    code: "F",
    name: "Інформаційні технології",
    specialties: [
      { code: "F1",  fieldCode: "F", name: "Прикладна математика" },
      { code: "F2",  fieldCode: "F", name: "Інженерія програмного забезпечення" },
      { code: "F3",  fieldCode: "F", name: "Комп'ютерні науки" },
      { code: "F4",  fieldCode: "F", name: "Системний аналіз та наука про дані" },
      { code: "F5",  fieldCode: "F", name: "Кібербезпека та захист інформації" },
      { code: "F6",  fieldCode: "F", name: "Інформаційні системи і технології" },
      { code: "F7",  fieldCode: "F", name: "Комп'ютерна інженерія" },
    ],
  },
  {
    code: "G",
    name: "Інженерія, виробництво та будівництво",
    specialties: [
      { code: "G1",  fieldCode: "G", name: "Хімічні технології та інженерія" },
      { code: "G2",  fieldCode: "G", name: "Технології захисту навколишнього середовища" },
      { code: "G3",  fieldCode: "G", name: "Електрична інженерія" },
      { code: "G4",  fieldCode: "G", name: "Енерговиробництво (за спеціалізацією)" },
      { code: "G5",  fieldCode: "G", name: "Електроніка, електронні комунікації, приладобудування та радіотехніка" },
      { code: "G6",  fieldCode: "G", name: "Інформаційно-вимірювальні технології" },
      { code: "G7",  fieldCode: "G", name: "Автоматизація, комп'ютерно-інтегровані технології та робототехніка" },
      { code: "G8",  fieldCode: "G", name: "Матеріалознавство" },
      { code: "G9",  fieldCode: "G", name: "Прикладна механіка" },
      { code: "G10", fieldCode: "G", name: "Металургія" },
      { code: "G11", fieldCode: "G", name: "Машинобудування (за спеціалізаціями)" },
      { code: "G12", fieldCode: "G", name: "Авіаційна та ракетно-космічна техніка" },
      { code: "G13", fieldCode: "G", name: "Харчові технології" },
      { code: "G14", fieldCode: "G", name: "Деревообробні та меблеві технології" },
      { code: "G15", fieldCode: "G", name: "Технології легкої промисловості" },
      { code: "G16", fieldCode: "G", name: "Гірництво та нафтогазові технології" },
      { code: "G17", fieldCode: "G", name: "Архітектура та містобудування" },
      { code: "G18", fieldCode: "G", name: "Геодезія та землеустрій" },
      { code: "G19", fieldCode: "G", name: "Будівництво та цивільна інженерія" },
      { code: "G20", fieldCode: "G", name: "Видавництво та поліграфія" },
      { code: "G21", fieldCode: "G", name: "Біотехнології та біоінженерія" },
      { code: "G22", fieldCode: "G", name: "Біомедична інженерія" },
    ],
  },
  {
    code: "H",
    name: "Сільське, лісове, рибне господарство та ветеринарна медицина",
    specialties: [
      { code: "H1",  fieldCode: "H", name: "Агрономія" },
      { code: "H2",  fieldCode: "H", name: "Тваринництво" },
      { code: "H3",  fieldCode: "H", name: "Садово-паркове господарство" },
      { code: "H4",  fieldCode: "H", name: "Лісове господарство" },
      { code: "H5",  fieldCode: "H", name: "Водні біоресурси та аквакультура" },
      { code: "H6",  fieldCode: "H", name: "Ветеринарна медицина" },
      { code: "H7",  fieldCode: "H", name: "Агроінженерія" },
    ],
  },
  {
    code: "I",
    name: "Охорона здоров'я та соціальне забезпечення",
    specialties: [
      { code: "I1",  fieldCode: "I", name: "Стоматологія" },
      { code: "I2",  fieldCode: "I", name: "Медицина" },
      { code: "I3",  fieldCode: "I", name: "Педіатрія" },
      { code: "I4",  fieldCode: "I", name: "Медична психологія" },
      { code: "I5",  fieldCode: "I", name: "Медсестринство (за спеціалізаціями)" },
      { code: "I6",  fieldCode: "I", name: "Технології медичної діагностики та лікування (за спеціалізаціями)" },
      { code: "I7",  fieldCode: "I", name: "Терапія та реабілітація (за спеціалізаціями)" },
      { code: "I8",  fieldCode: "I", name: "Фармація (за спеціалізаціями)" },
      { code: "I9",  fieldCode: "I", name: "Громадське здоров'я" },
      { code: "I10", fieldCode: "I", name: "Соціальна робота та консультування" },
      { code: "I11", fieldCode: "I", name: "Дитячі та молодіжні служби" },
    ],
  },
  {
    code: "J",
    name: "Транспорт та послуги",
    specialties: [
      { code: "J1",  fieldCode: "J", name: "Послуги краси" },
      { code: "J2",  fieldCode: "J", name: "Готельно-ресторанна справа та кейтеринг" },
      { code: "J3",  fieldCode: "J", name: "Туризм та рекреація" },
      { code: "J4",  fieldCode: "J", name: "Охорона праці" },
      { code: "J5",  fieldCode: "J", name: "Морський та внутрішній водний транспорт" },
      { code: "J6",  fieldCode: "J", name: "Авіаційний транспорт" },
      { code: "J7",  fieldCode: "J", name: "Залізничний транспорт" },
      { code: "J8",  fieldCode: "J", name: "Автомобільний транспорт" },
    ],
  },
  {
    code: "K",
    name: "Безпека та оборона",
    specialties: [
      { code: "K1",  fieldCode: "K", name: "Державна безпека" },
      { code: "K2",  fieldCode: "K", name: "Безпека державного кордону" },
      { code: "K3",  fieldCode: "K", name: "Національна безпека (за окремими сферами забезпечення і видами діяльності)" },
      { code: "K4",  fieldCode: "K", name: "Управління інформаційною безпекою" },
      { code: "K5",  fieldCode: "K", name: "Військове управління (за видами збройних сил)" },
      { code: "K6",  fieldCode: "K", name: "Забезпечення військ (сил)" },
      { code: "K7",  fieldCode: "K", name: "Озброєння та військова техніка" },
      { code: "K8",  fieldCode: "K", name: "Пожежна безпека" },
      { code: "K9",  fieldCode: "K", name: "Правоохоронна діяльність" },
      { code: "K10", fieldCode: "K", name: "Цивільна безпека" },
    ],
  },
];

// Flat lists for lookup
export const ALL_SPECIALTIES: Specialty[] = CLASSIFICATION_1021.flatMap((f) => f.specialties);
export const FIELD_BY_CODE = Object.fromEntries(CLASSIFICATION_1021.map((f) => [f.code, f])) as Record<FieldCode, Field>;
export const SPECIALTY_BY_CODE = Object.fromEntries(ALL_SPECIALTIES.map((s) => [s.code, s]));

// ── Legacy numeric classification (Resolution 266, 2015–2024) ────────────────

export type LegacyField = {
  code: string;   // e.g. "09"
  name: string;
  specialties: { code: string; name: string }[];
};

export const LEGACY_CLASSIFICATION: LegacyField[] = [
  { code: "01", name: "Освіта/Педагогіка", specialties: [
    { code: "011", name: "Освітні, педагогічні науки" },
    { code: "012", name: "Дошкільна освіта" },
    { code: "013", name: "Початкова освіта" },
    { code: "014", name: "Середня освіта (за предметними спеціальностями)" },
    { code: "015", name: "Професійна освіта (за спеціалізаціями)" },
    { code: "016", name: "Спеціальна освіта" },
    { code: "017", name: "Фізична культура і спорт" },
  ]},
  { code: "02", name: "Культура і мистецтво", specialties: [
    { code: "021", name: "Аудіовізуальне мистецтво та виробництво" },
    { code: "022", name: "Дизайн" },
    { code: "023", name: "Образотворче мистецтво, декоративне мистецтво, реставрація" },
    { code: "024", name: "Хореографія" },
    { code: "025", name: "Музичне мистецтво" },
    { code: "026", name: "Сценічне мистецтво" },
    { code: "027", name: "Музеєзнавство, пам'яткознавство" },
    { code: "028", name: "Менеджмент соціокультурної діяльності" },
    { code: "029", name: "Інформаційна, бібліотечна та архівна справа" },
  ]},
  { code: "03", name: "Гуманітарні науки", specialties: [
    { code: "031", name: "Релігієзнавство" },
    { code: "032", name: "Історія та археологія" },
    { code: "033", name: "Філософія" },
    { code: "034", name: "Культурологія" },
    { code: "035", name: "Філологія" },
  ]},
  { code: "05", name: "Соціальні та поведінкові науки", specialties: [
    { code: "051", name: "Економіка" },
    { code: "052", name: "Політологія" },
    { code: "053", name: "Психологія" },
    { code: "054", name: "Соціологія" },
  ]},
  { code: "06", name: "Журналістика", specialties: [
    { code: "061", name: "Журналістика" },
    { code: "062", name: "Реклама та зв'язки з громадськістю" },
  ]},
  { code: "07", name: "Управління та адміністрування", specialties: [
    { code: "071", name: "Облік і оподаткування" },
    { code: "072", name: "Фінанси, банківська справа та страхування" },
    { code: "073", name: "Менеджмент" },
    { code: "074", name: "Публічне управління та адміністрування" },
    { code: "075", name: "Маркетинг" },
    { code: "076", name: "Підприємництво, торгівля та біржова діяльність" },
  ]},
  { code: "08", name: "Право", specialties: [
    { code: "081", name: "Право" },
    { code: "082", name: "Міжнародне право" },
  ]},
  { code: "09", name: "Біологія", specialties: [
    { code: "091", name: "Біологія" },
    { code: "092", name: "Біохімія" },
    { code: "093", name: "Мікробіологія" },
    { code: "094", name: "Генетика та молекулярна біологія" },
  ]},
  { code: "10", name: "Природничі науки", specialties: [
    { code: "101", name: "Екологія" },
    { code: "102", name: "Хімія" },
    { code: "103", name: "Науки про Землю" },
    { code: "104", name: "Фізика та астрономія" },
    { code: "105", name: "Прикладна фізика та наноматеріали" },
    { code: "106", name: "Географія" },
  ]},
  { code: "11", name: "Математика та статистика", specialties: [
    { code: "111", name: "Математика" },
    { code: "112", name: "Статистика" },
    { code: "113", name: "Прикладна математика" },
  ]},
  { code: "12", name: "Інформаційні технології", specialties: [
    { code: "121", name: "Інженерія програмного забезпечення" },
    { code: "122", name: "Комп'ютерні науки" },
    { code: "123", name: "Комп'ютерна інженерія" },
    { code: "124", name: "Системний аналіз" },
    { code: "125", name: "Кібербезпека" },
    { code: "126", name: "Інформаційні системи та технології" },
  ]},
  { code: "13", name: "Механічна інженерія", specialties: [
    { code: "131", name: "Прикладна механіка" },
    { code: "132", name: "Матеріалознавство" },
    { code: "133", name: "Галузеве машинобудування" },
    { code: "134", name: "Авіаційна та ракетно-космічна техніка" },
    { code: "135", name: "Суднобудування" },
    { code: "136", name: "Металургія" },
  ]},
  { code: "14", name: "Електрична інженерія", specialties: [
    { code: "141", name: "Електроенергетика, електротехніка та електромеханіка" },
    { code: "142", name: "Енергетичне машинобудування" },
    { code: "143", name: "Атомна енергетика" },
  ]},
  { code: "15", name: "Автоматизація та приладобудування", specialties: [
    { code: "151", name: "Автоматизація та комп'ютерно-інтегровані технології" },
    { code: "152", name: "Метрологія та інформаційно-вимірювальна техніка" },
    { code: "153", name: "Мікро- та наносистемна техніка" },
  ]},
  { code: "16", name: "Хімічна та біоінженерія", specialties: [
    { code: "161", name: "Хімічні технології та інженерія" },
    { code: "162", name: "Біотехнології та біоінженерія" },
    { code: "163", name: "Біомедична інженерія" },
  ]},
  { code: "17", name: "Електроніка та телекомунікації", specialties: [
    { code: "171", name: "Електроніка" },
    { code: "172", name: "Телекомунікації та радіотехніка" },
    { code: "173", name: "Авіоніка" },
  ]},
  { code: "18", name: "Виробництво та технології", specialties: [
    { code: "181", name: "Харчові технології" },
    { code: "182", name: "Технології легкої промисловості" },
    { code: "183", name: "Технології захисту навколишнього середовища" },
    { code: "184", name: "Гірництво" },
    { code: "185", name: "Нафтогазова інженерія та технології" },
    { code: "186", name: "Видавництво та поліграфія" },
    { code: "187", name: "Деревообробні та меблеві технології" },
  ]},
  { code: "19", name: "Архітектура та будівництво", specialties: [
    { code: "191", name: "Архітектура та містобудування" },
    { code: "192", name: "Будівництво та цивільна інженерія" },
    { code: "193", name: "Геодезія та землеустрій" },
  ]},
  { code: "20", name: "Аграрні науки та продовольство", specialties: [
    { code: "201", name: "Агрономія" },
    { code: "202", name: "Захист і карантин рослин" },
    { code: "203", name: "Садівництво та виноградарство" },
    { code: "204", name: "Технологія виробництва і переробки продукції тваринництва" },
    { code: "205", name: "Лісове господарство" },
    { code: "206", name: "Садово-паркове господарство" },
    { code: "207", name: "Водні біоресурси та аквакультура" },
    { code: "208", name: "Агроінженерія" },
  ]},
  { code: "21", name: "Ветеринарна медицина", specialties: [
    { code: "211", name: "Ветеринарна медицина" },
    { code: "212", name: "Ветеринарна гігієна, санітарія і експертиза" },
  ]},
  { code: "22", name: "Охорона здоров'я", specialties: [
    { code: "221", name: "Стоматологія" },
    { code: "222", name: "Медицина" },
    { code: "223", name: "Медсестринство" },
    { code: "224", name: "Технології медичної діагностики та лікування" },
    { code: "225", name: "Медична психологія" },
    { code: "226", name: "Фармація, промислова фармація" },
    { code: "227", name: "Фізична терапія, ерготерапія" },
    { code: "228", name: "Педіатрія" },
    { code: "229", name: "Громадське здоров'я" },
  ]},
  { code: "23", name: "Соціальна робота", specialties: [
    { code: "231", name: "Соціальна робота" },
    { code: "232", name: "Соціальне забезпечення" },
  ]},
  { code: "24", name: "Сфера обслуговування", specialties: [
    { code: "241", name: "Готельно-ресторанна справа" },
    { code: "242", name: "Туризм та рекреація" },
  ]},
  { code: "26", name: "Цивільна безпека", specialties: [
    { code: "261", name: "Пожежна безпека" },
    { code: "262", name: "Правоохоронна діяльність" },
    { code: "263", name: "Цивільна безпека" },
  ]},
  { code: "27", name: "Транспорт", specialties: [
    { code: "271", name: "Річковий та морський транспорт" },
    { code: "272", name: "Авіаційний транспорт" },
    { code: "273", name: "Залізничний транспорт" },
    { code: "274", name: "Автомобільний транспорт" },
    { code: "275", name: "Транспортні технології (за видами)" },
    { code: "276", name: "Логістика" },
  ]},
  { code: "28", name: "Публічне управління та адміністрування", specialties: [
    { code: "281", name: "Публічне управління та адміністрування" },
    { code: "282", name: "Міжнародні відносини, суспільні комунікації та регіональні студії" },
  ]},
  { code: "29", name: "Міжнародні відносини", specialties: [
    { code: "291", name: "Міжнародні відносини, суспільні комунікації та регіональні студії" },
    { code: "292", name: "Міжнародні економічні відносини" },
    { code: "293", name: "Міжнародне право" },
  ]},
];

export const ALL_LEGACY_SPECIALTIES = LEGACY_CLASSIFICATION.flatMap((f) => f.specialties);
export const LEGACY_SPECIALTY_BY_CODE = Object.fromEntries(ALL_LEGACY_SPECIALTIES.map((s) => [s.code, s]));

/** Legacy codes used before the 1021-2024 classification */
const LEGACY_LABELS: Record<string, string> = {
  physiology: "Фізіологія",
  neuroscience: "Нейронаука",
  molecular_biology: "Молекулярна біологія",
  bioinformatics: "Біоінформатика",
  biomedicine: "Біомедицина",
};

export function getSpecialtyLabel(code: string): string {
  const s = SPECIALTY_BY_CODE[code];
  if (s) return `${s.code} — ${s.name}`;
  const f = FIELD_BY_CODE[code as FieldCode];
  if (f) return `${f.code} — ${f.name}`;
  const ls = LEGACY_SPECIALTY_BY_CODE[code];
  if (ls) return `${ls.code} ${ls.name}`;
  return LEGACY_LABELS[code] ?? code;
}

export function getFieldForCode(code: string): Field | undefined {
  const s = SPECIALTY_BY_CODE[code];
  if (s) return FIELD_BY_CODE[s.fieldCode];
  return FIELD_BY_CODE[code as FieldCode];
}
