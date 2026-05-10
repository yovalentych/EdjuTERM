"use client";

import {
  BookMarked,
  BookOpen,
  BookText,
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  GraduationCap,
  Layers,
  ScrollText,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import type {
  DissertationMeta,
  ManuscriptAuthor,
  ManuscriptBlock,
  ManuscriptType,
  Manuscript,
  SafeUser,
} from "@/lib/schemas";
import { createManuscriptAction } from "@/app/actions";
import { InstitutionSearch } from "@/components/ui/institution-search";
import { SpecialtySelect } from "@/components/ui/specialty-select";
import { SPECIALTY_BY_CODE, FIELD_BY_CODE } from "@/lib/classification-1021";

// ── helpers ───────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).substr(2, 9);
}

// ── Dissertation template (МОН України, Наказ №40 від 12.01.2017) ─────────────

function makeDissertationBlocks(meta?: DissertationMeta): ManuscriptBlock[] {
  const deg = meta?.degree === "doctor" ? "доктора наук" : "кандидата наук (доктора філософії)";
  const spec = meta?.specialty ? `${meta.specialtyCode} «${meta.specialty}»` : "[шифр] «[назва спеціальності]»";
  const inst = meta?.institution || "[Назва установи підготовки]";
  const defInst = meta?.defenseInstitution || "[Назва установи захисту]";
  const supervisor = meta?.supervisor || "[Прізвище, ім'я, по батькові, науковий ступінь, вчене звання]";
  const city = meta?.city || "[Місто]";
  const year = meta?.year ?? new Date().getFullYear();

  return [
    // ── АНОТАЦІЯ ─────────────────────────────────────────────────────────────
    { id: uid(), type: "h1", content: "АНОТАЦІЯ" },
    { id: uid(), type: "paragraph", content: `[Прізвище та ініціали здобувача]. [Назва дисертації]. – Кваліфікаційна наукова праця на правах рукопису.\n\nДисертація на здобуття наукового ступеня ${deg} за спеціальністю ${spec}. – ${defInst}, ${city}, ${year}.` },
    { id: uid(), type: "paragraph", content: "[Зміст анотації (0,2–0,3 авторських аркуші). Стисло та чітко викласти суть дослідження: мету, методи, отримані результати та їх наукову новизну, практичне значення.]" },
    { id: uid(), type: "paragraph", content: "Ключові слова: [слово 1], [слово 2], [слово 3], [слово 4], [слово 5], [слово 6], [слово 7]. (5–15 ключових слів у називному відмінку через кому)" },
    { id: uid(), type: "paragraph", content: "[Список публікацій здобувача за темою дисертації — вказуються наукові праці, в яких опубліковані основні наукові результати, які засвідчують апробацію матеріалів та які додатково відображають наукові результати дисертації]" },

    { id: uid(), type: "divider", content: "" },

    // ── ABSTRACT ─────────────────────────────────────────────────────────────
    { id: uid(), type: "h1", content: "ABSTRACT" },
    { id: uid(), type: "paragraph", content: `[Surname and initials of the applicant]. [Dissertation title]. – Qualification scholarly work as a manuscript.\n\nThesis for a PhD degree in specialty ${meta?.specialtyCode || "[code]"} «[Specialty name in English]». – ${defInst}, ${city}, ${year}.` },
    { id: uid(), type: "paragraph", content: "[Abstract content in English (0.2–0.3 author's sheets). Briefly and clearly state the purpose, methods, results obtained and their scientific novelty, practical significance.]" },
    { id: uid(), type: "paragraph", content: "Keywords: [keyword 1], [keyword 2], [keyword 3], [keyword 4], [keyword 5], [keyword 6], [keyword 7]." },

    { id: uid(), type: "divider", content: "" },

    // ── ВСТУП ─────────────────────────────────────────────────────────────────
    { id: uid(), type: "h1", content: "ВСТУП" },

    { id: uid(), type: "h2", content: "Актуальність теми" },
    { id: uid(), type: "paragraph", content: "[Обґрунтувати вибір теми дослідження. Висвітлити зв'язок теми дисертації із сучасними дослідженнями у відповідній галузі знань шляхом критичного аналізу з визначенням сутності наукової проблеми чи завдання. Показати актуальність для науки і практики.]" },

    { id: uid(), type: "h2", content: "Зв'язок роботи з науковими програмами, планами, темами, грантами" },
    { id: uid(), type: "paragraph", content: "[Зазначити, в рамках яких програм, тематичних планів, наукових тематик і грантів, зокрема галузевих, державних та/або міжнародних, виконувалося дисертаційне дослідження, із зазначенням номерів державної реєстрації науково-дослідних робіт і найменуванням організації, де виконувалася робота.]" },

    { id: uid(), type: "h2", content: "Мета і завдання дослідження" },
    { id: uid(), type: "paragraph", content: "Мета дослідження: [сформулювати мету відповідно до предмета та об'єкта дослідження].\n\nДля досягнення мети поставлено такі завдання:\n1. [завдання 1 — аналітичне/теоретичне]\n2. [завдання 2 — методологічне]\n3. [завдання 3 — експериментальне]\n4. [завдання 4 — результати]\n5. [завдання 5 — практичне впровадження]" },

    { id: uid(), type: "h2", content: "Об'єкт та предмет дослідження" },
    { id: uid(), type: "paragraph", content: "Об'єкт дослідження: [сформулювати об'єкт — процес або явище, що породжує проблемну ситуацію і обране для вивчення].\n\nПредмет дослідження: [сформулювати предмет — міститься в межах об'єкта; саме на предмет дослідження спрямована увага в дисертації]." },

    { id: uid(), type: "h2", content: "Методи дослідження" },
    { id: uid(), type: "paragraph", content: "[Перерахувати використані наукові методи дослідження та змістовно відзначити, що саме досліджувалось кожним методом. Обґрунтувати вибір методів, що забезпечують достовірність отриманих результатів та висновків.]\n\nТеоретичні методи: [метод 1 — для чого використовувався]; [метод 2 — для чого].\nЕмпіричні методи: [метод 3 — для чого]; [метод 4 — для чого].\nСтатистичні методи: [метод 5 — для чого]." },

    { id: uid(), type: "h2", content: "Наукова новизна отриманих результатів" },
    { id: uid(), type: "paragraph", content: "[Аргументовано, коротко та чітко представити основні наукові положення, які виносяться на захист, із зазначенням відмінності одержаних результатів від відомих раніше.]\n\nВперше:\n– [наукове положення 1, що вперше встановлено/доведено];\n– [наукове положення 2].\n\nУдосконалено:\n– [що удосконалено і в чому полягає удосконалення];\n– [наступне положення].\n\nДістало подальшого розвитку:\n– [що набуло розвитку і в чому];\n– [наступне положення]." },

    { id: uid(), type: "h2", content: "Практичне значення отриманих результатів" },
    { id: uid(), type: "paragraph", content: "[Надати відомості про використання результатів досліджень або рекомендації щодо їх практичного використання. Якщо результати досліджень впроваджено — надати відомості із зазначенням найменувань організацій, в яких здійснено впровадження. У цьому випадку додатки можуть містити копії відповідних документів.]" },

    { id: uid(), type: "h2", content: "Особистий внесок здобувача" },
    { id: uid(), type: "paragraph", content: "[Якщо у дисертації використано ідеї або розробки, що належать співавторам, разом з якими здобувачем опубліковано наукові праці, обов'язково зазначається конкретний особистий внесок здобувача в такі праці або розробки. Здобувач має також додати посилання на дисертації співавторів, у яких було використано результати спільних робіт.]" },

    { id: uid(), type: "h2", content: "Апробація результатів дисертації" },
    { id: uid(), type: "paragraph", content: "[Зазначити назви конференцій, конгресу, симпозіуму, семінару, школи, місце та дату проведення, на яких доповідалися результати досліджень.]\n\n1. [Назва конференції, місто, рік — форма участі (доповідь/тези)];\n2. [Назва конференції, місто, рік — форма участі];\n3. [Назва конференції, місто, рік — форма участі]." },

    { id: uid(), type: "h2", content: "Структура та обсяг дисертації" },
    { id: uid(), type: "paragraph", content: `Дисертаційна робота складається із вступу, [N] розділів, висновків, списку використаних джерел ([N] найменувань на [N] сторінках), [N] додатків. Загальний обсяг дисертації – [N] сторінок, з них основного тексту – [N] сторінок. Робота містить [N] таблиць, [N] рисунків.` },

    { id: uid(), type: "divider", content: "" },

    // ── РОЗДІЛ 1 ──────────────────────────────────────────────────────────────
    { id: uid(), type: "h1", content: "РОЗДІЛ 1\nОГЛЯД НАУКОВИХ ПРАЦЬ ЗА ТЕМОЮ ДОСЛІДЖЕННЯ" },

    { id: uid(), type: "h2", content: "1.1. Стан вивченості проблеми у вітчизняній та зарубіжній літературі" },
    { id: uid(), type: "paragraph", content: "[Критичний аналіз наукових праць із теми дослідження. Посилання на роботи інших авторів обов'язкові. Цитати включаються виключно із посиланням на джерело.]" },

    { id: uid(), type: "h2", content: "1.2. Теоретичні та методологічні засади дослідження" },
    { id: uid(), type: "paragraph", content: "[Теоретична основа, концептуальні підходи, наукові школи та їх представники. Визначення базових понять та категорій дослідження.]" },

    { id: uid(), type: "h2", content: "1.3. Формулювання наукової проблеми та обґрунтування підходів до її вирішення" },
    { id: uid(), type: "paragraph", content: "[На основі огляду літератури визначити незаповнену нішу, сформулювати наукову проблему, обґрунтувати авторський підхід до її вирішення.]" },

    { id: uid(), type: "h2", content: "Висновки до розділу 1" },
    { id: uid(), type: "paragraph", content: "[Стисло підсумувати основні результати аналізу літератури. Обґрунтувати необхідність власного дослідження. Показати, яке місце займає запропонований підхід серед існуючих.]" },

    { id: uid(), type: "divider", content: "" },

    // ── РОЗДІЛ 2 ──────────────────────────────────────────────────────────────
    { id: uid(), type: "h1", content: "РОЗДІЛ 2\nМАТЕРІАЛИ ТА МЕТОДИ ДОСЛІДЖЕННЯ" },

    { id: uid(), type: "h2", content: "2.1. Характеристика об'єктів дослідження" },
    { id: uid(), type: "paragraph", content: "[Детальний опис об'єктів/суб'єктів дослідження, критерії включення та виключення, характеристика вибірки або дослідних груп.]" },

    { id: uid(), type: "h2", content: "2.2. Методи та дизайн дослідження" },
    { id: uid(), type: "paragraph", content: "[Детальний опис застосованих методів дослідження. Обґрунтування вибору методів. Схема дослідження, опис експериментальних умов, перебіг дослідження.]" },

    { id: uid(), type: "h2", content: "2.3. Методи статистичної обробки даних" },
    { id: uid(), type: "paragraph", content: "[Опис статистичних методів, програмного забезпечення (назва, версія, розробник), критерії значущості. Рівень статистичної значущості: p < 0,05.]" },

    { id: uid(), type: "h2", content: "Висновки до розділу 2" },
    { id: uid(), type: "paragraph", content: "[Стисло охарактеризувати матеріал та методи дослідження. Обґрунтувати їх відповідність поставленій меті та завданням.]" },

    { id: uid(), type: "divider", content: "" },

    // ── РОЗДІЛ 3 ──────────────────────────────────────────────────────────────
    { id: uid(), type: "h1", content: "РОЗДІЛ 3\nРЕЗУЛЬТАТИ ВЛАСНИХ ДОСЛІДЖЕНЬ" },

    { id: uid(), type: "h2", content: "3.1. [Назва першого напряму результатів]" },
    { id: uid(), type: "paragraph", content: "[Виклад результатів власних досліджень. Мають бути вичерпно і повно викладений зміст власних досліджень. Зроблені посилання на всі наукові праці здобувача, наведені в анотації. Список цих праць має також міститися у списку використаних джерел. При нумерації формул і рисунків проставляються через крапку номер розділу та номер формули/рисунка.]" },

    { id: uid(), type: "h2", content: "3.2. [Назва другого напряму результатів]" },
    { id: uid(), type: "paragraph", content: "[Продовження викладу результатів. Розділи можуть поділятися на підрозділи (нумерація: номер розділу і порядковий номер підрозділу, відокремлені крапкою).]" },

    { id: uid(), type: "h2", content: "3.3. [Назва третього напряму результатів]" },
    { id: uid(), type: "paragraph", content: "[У разі використання наукових результатів, ідей, публікацій та інших матеріалів інших авторів обов'язково мають бути посилання на публікації цих авторів.]" },

    { id: uid(), type: "h2", content: "Висновки до розділу 3" },
    { id: uid(), type: "paragraph", content: "[Стислий виклад найважливіших власних результатів розділу. Показати їх відповідність поставленим завданням.]" },

    { id: uid(), type: "divider", content: "" },

    // ── РОЗДІЛ 4 ──────────────────────────────────────────────────────────────
    { id: uid(), type: "h1", content: "РОЗДІЛ 4\nАНАЛІЗ ТА ОБГОВОРЕННЯ РЕЗУЛЬТАТІВ" },

    { id: uid(), type: "h2", content: "4.1. Порівняльний аналіз отриманих результатів з даними літератури" },
    { id: uid(), type: "paragraph", content: "[Зіставлення власних результатів з відомими науковими даними. Пояснення збігів та розбіжностей.]" },

    { id: uid(), type: "h2", content: "4.2. Теоретичне обґрунтування встановлених закономірностей" },
    { id: uid(), type: "paragraph", content: "[Теоретична інтерпретація виявлених фактів і закономірностей. Формулювання нових концепцій або положень.]" },

    { id: uid(), type: "h2", content: "4.3. Практичні рекомендації та перспективи застосування" },
    { id: uid(), type: "paragraph", content: "[Рекомендації щодо практичного застосування результатів дослідження. Визначення обмежень дослідження та можливих напрямів їх подолання.]" },

    { id: uid(), type: "h2", content: "Висновки до розділу 4" },
    { id: uid(), type: "paragraph", content: "[Узагальнення результатів аналізу та обговорення. Підтвердження або уточнення заявленої наукової новизни.]" },

    { id: uid(), type: "divider", content: "" },

    // ── ВИСНОВКИ ─────────────────────────────────────────────────────────────
    { id: uid(), type: "h1", content: "ВИСНОВКИ" },
    { id: uid(), type: "paragraph", content: `У дисертаційній роботі наведено теоретичне узагальнення і нове вирішення наукового завдання, що виявляється у наступному:\n\n1. [Перший найважливіший науковий та практичний результат. Конкретний, вимірний, обґрунтований.]\n\n2. [Другий результат.]\n\n3. [Третій результат.]\n\n4. [Четвертий результат.]\n\n5. [П'ятий результат. Практичне значення: результати досліджень використані / рекомендовані до використання в...]\n\n6. [Можливі напрями продовження досліджень. Наукові проблеми, для розв'язання яких можуть бути застосовані результати досліджень.]` },

    { id: uid(), type: "divider", content: "" },

    // ── СПИСОК ВИКОРИСТАНИХ ДЖЕРЕЛ ────────────────────────────────────────────
    { id: uid(), type: "h1", content: "СПИСОК ВИКОРИСТАНИХ ДЖЕРЕЛ" },
    { id: uid(), type: "paragraph", content: "[Бібліографічний опис джерел відповідно до ДСТУ 8302:2015 «Інформація та документація. Бібліографічне посилання. Загальні положення та правила складання» або одного зі стилів: APA, MLA, Chicago/Turabian, Harvard, ACS, AIP, IEEE, Vancouver, OSCOLA, APS, Springer MathPhys (Додаток 3 до Вимог МОН).\n\nСписок формується: у порядку появи посилань у тексті / в алфавітному порядку / у хронологічному порядку.\n\n1. [Прізвище А.Б. Назва монографії. – Місто: Видавництво, Рік. – NNN с.]\n2. [Прізвище А.Б., Прізвище В.Г. Назва статті // Назва журналу. – Рік. – Т. N, № N. – С. XX–XX. DOI: https://doi.org/...]\n3. [...]" },

    { id: uid(), type: "divider", content: "" },

    // ── СПИСОК ПУБЛІКАЦІЙ ЗДОБУВАЧА ───────────────────────────────────────────
    { id: uid(), type: "h1", content: "СПИСОК ПУБЛІКАЦІЙ ЗДОБУВАЧА" },

    { id: uid(), type: "h2", content: "Наукові праці, в яких опубліковані основні наукові результати дисертації" },
    { id: uid(), type: "paragraph", content: "1. [Прізвище А.Б. Назва статті // Назва фахового журналу. – Рік. – Т. N, № N. – С. XX–XX. DOI: https://doi.org/... (Scopus/WoS, IF = N.N)]\n2. [Прізвище А.Б., Прізвище В.Г. Назва статті // Назва журналу. – Рік. – Т. N. – С. XX–XX.]\n3. [...]" },

    { id: uid(), type: "h2", content: "Наукові праці, які засвідчують апробацію матеріалів дисертації" },
    { id: uid(), type: "paragraph", content: "1. [Прізвище А.Б. Назва тез // Матеріали [N]-ї міжнародної науково-практичної конференції «Назва конференції». – Місто, Рік. – С. XX–XX.]\n2. [Прізвище А.Б. Назва тез // Тези доповідей конференції. – Місто, Рік. – С. XX–XX.]\n3. [...]" },

    { id: uid(), type: "h2", content: "Наукові праці, які додатково відображають наукові результати дисертації" },
    { id: uid(), type: "paragraph", content: "1. [Патент на винахід / корисну модель, методичні рекомендації тощо — за наявності]\n[або: Відсутні]" },

    { id: uid(), type: "divider", content: "" },

    // ── ДОДАТКИ ───────────────────────────────────────────────────────────────
    { id: uid(), type: "h1", content: "ДОДАТКИ" },

    { id: uid(), type: "h2", content: "Додаток А\n[Назва додатку]" },
    { id: uid(), type: "paragraph", content: "[Допоміжний матеріал: проміжні формули і розрахунки, таблиці допоміжних цифрових даних, протоколи та акти випробувань, впроваджень, розрахунки економічного ефекту, листи підтримки результатів дисертаційної роботи, інструкції та методики, ілюстрації допоміжного характеру. Додатки нумеруються великими літерами: А, Б, В...]" },

    { id: uid(), type: "h2", content: "Додаток Б\n[Акти впровадження]" },
    { id: uid(), type: "paragraph", content: "[Копії документів, що підтверджують практичне впровадження результатів дисертаційного дослідження]" },
  ];
}

// ── Type config ───────────────────────────────────────────────────────────────

const TYPES: Array<{ value: ManuscriptType; labelUk: string; label: string; icon: React.ReactNode; color: string }> = [
  { value: "dissertation", labelUk: "Дисертація", label: "Dissertation", icon: <GraduationCap className="h-5 w-5" />, color: "text-violet-600 bg-violet-50 border-violet-200" },
  { value: "article", labelUk: "Стаття", label: "Article", icon: <FileText className="h-5 w-5" />, color: "text-blue-600 bg-blue-50 border-blue-200" },
  { value: "monograph", labelUk: "Монографія", label: "Monograph", icon: <BookText className="h-5 w-5" />, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  { value: "thesis", labelUk: "Тези", label: "Thesis", icon: <ScrollText className="h-5 w-5" />, color: "text-amber-600 bg-amber-50 border-amber-200" },
  { value: "guide", labelUk: "Посібник", label: "Guide", icon: <BookMarked className="h-5 w-5" />, color: "text-cyan-600 bg-cyan-50 border-cyan-200" },
  { value: "other", labelUk: "Інше", label: "Other", icon: <Layers className="h-5 w-5" />, color: "text-slate-600 bg-slate-50 border-slate-200" },
];

// ── General templates ─────────────────────────────────────────────────────────

const GENERAL_TEMPLATES = [
  {
    key: "empty",
    labelUk: "Порожній",
    label: "Empty",
    descUk: "Чистий документ без структури",
    desc: "Blank document",
    sections: 0,
    blocks: (): ManuscriptBlock[] => [],
  },
  {
    key: "imrad",
    labelUk: "IMRaD — Наукова стаття",
    label: "IMRaD — Research Article",
    descUk: "Вступ, Методи, Результати, Обговорення",
    desc: "Introduction, Methods, Results, Discussion",
    sections: 6,
    blocks: (): ManuscriptBlock[] => [
      { id: uid(), type: "h1", content: "Abstract" },
      { id: uid(), type: "paragraph", content: "[Background, aim, methods, main results, conclusion — 150–250 words]" },
      { id: uid(), type: "h1", content: "1. Introduction" },
      { id: uid(), type: "paragraph", content: "[Background, research gap, aim and objectives of the study]" },
      { id: uid(), type: "h1", content: "2. Materials and Methods" },
      { id: uid(), type: "paragraph", content: "[Study design, participants/materials, procedures, statistical analysis]" },
      { id: uid(), type: "h1", content: "3. Results" },
      { id: uid(), type: "paragraph", content: "[Present results without interpretation. Use tables and figures.]" },
      { id: uid(), type: "h1", content: "4. Discussion" },
      { id: uid(), type: "paragraph", content: "[Interpretation, comparison with literature, limitations, future directions]" },
      { id: uid(), type: "h1", content: "5. Conclusion" },
      { id: uid(), type: "paragraph", content: "[Key take-away messages]" },
      { id: uid(), type: "h1", content: "References" },
      { id: uid(), type: "paragraph", content: "[1. Author A, Author B. Title. Journal. Year;Vol(N):pages. DOI:]" },
    ],
  },
  {
    key: "review",
    labelUk: "Оглядова стаття",
    label: "Review Article",
    descUk: "Систематичний/наративний огляд літератури",
    desc: "Systematic or narrative literature review",
    sections: 5,
    blocks: (): ManuscriptBlock[] => [
      { id: uid(), type: "h1", content: "Abstract" },
      { id: uid(), type: "paragraph", content: "[Objective, methods of literature search, main findings, conclusion]" },
      { id: uid(), type: "h1", content: "1. Introduction" },
      { id: uid(), type: "paragraph", content: "[Background and rationale for the review]" },
      { id: uid(), type: "h1", content: "2. Literature Search Strategy" },
      { id: uid(), type: "paragraph", content: "[Databases searched, search terms, inclusion/exclusion criteria, PRISMA flow if applicable]" },
      { id: uid(), type: "h1", content: "3. Review of Evidence" },
      { id: uid(), type: "h2", content: "3.1. [First topic area]" },
      { id: uid(), type: "paragraph", content: "[Summary of evidence for this topic]" },
      { id: uid(), type: "h2", content: "3.2. [Second topic area]" },
      { id: uid(), type: "paragraph", content: "[Summary of evidence]" },
      { id: uid(), type: "h1", content: "4. Discussion" },
      { id: uid(), type: "paragraph", content: "[Synthesis of findings, gaps in literature, future directions]" },
      { id: uid(), type: "h1", content: "5. Conclusions" },
      { id: uid(), type: "paragraph", content: "[Main conclusions and recommendations]" },
      { id: uid(), type: "h1", content: "References" },
      { id: uid(), type: "paragraph", content: "[Reference list]" },
    ],
  },
  {
    key: "conference",
    labelUk: "Тези доповіді",
    label: "Conference Abstract",
    descUk: "Короткі тези для конференції",
    desc: "Short abstract for conferences",
    sections: 4,
    blocks: (): ManuscriptBlock[] => [
      { id: uid(), type: "h1", content: "Постановка проблеми" },
      { id: uid(), type: "paragraph", content: "[Актуальність теми, формулювання наукової проблеми]" },
      { id: uid(), type: "h1", content: "Мета та завдання" },
      { id: uid(), type: "paragraph", content: "[Мета доповіді та основні завдання]" },
      { id: uid(), type: "h1", content: "Методи та результати" },
      { id: uid(), type: "paragraph", content: "[Використані методи та основні отримані результати]" },
      { id: uid(), type: "h1", content: "Висновки" },
      { id: uid(), type: "paragraph", content: "[Стислі висновки та перспективи подальших досліджень]" },
      { id: uid(), type: "h1", content: "Список літератури" },
      { id: uid(), type: "paragraph", content: "1. [посилання 1]\n2. [посилання 2]" },
    ],
  },
];

// ── Step indicator ────────────────────────────────────────────────────────────

function StepDot({ n, active, done }: { n: number; active: boolean; done: boolean }) {
  return (
    <div className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-bold transition ${
      done ? "border-blue-500 bg-blue-500 text-white" :
      active ? "border-blue-500 bg-blue-50 text-blue-700" :
      "border-slate-200 text-slate-400"
    }`}>
      {done ? <Check className="h-3.5 w-3.5" /> : n}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function ManuscriptCreateModal({
  projectId,
  members,
  currentUser,
  locale,
  onCreated,
  onClose,
}: {
  projectId: string;
  members: SafeUser[];
  currentUser: SafeUser;
  locale: string;
  onCreated: (manuscript: Manuscript) => void;
  onClose: () => void;
}) {
  const isUk = locale === "uk";
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<ManuscriptType>("dissertation");
  const [templateKey, setTemplateKey] = useState<string>("dissertation_mon");
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([currentUser._id ?? ""]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  // Dissertation-specific fields
  const [degree, setDegree] = useState<"phd" | "doctor">("phd");
  const [specialtyCode, setSpecialtyCode] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [institution, setInstitution] = useState("");
  const [defenseInstitution, setDefenseInstitution] = useState("");
  const [supervisor, setSupervisor] = useState("");
  const [supervisorTitle, setSupervisorTitle] = useState("");
  const [city, setCity] = useState("");

  const totalSteps = type === "dissertation" ? 3 : 2;

  const toggleMember = (id: string) =>
    setSelectedMemberIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const buildAuthors = (): ManuscriptAuthor[] => {
    const result: ManuscriptAuthor[] = [];
    for (const userId of selectedMemberIds) {
      const m = members.find((x) => x._id === userId);
      if (!m) continue;
      result.push({
        name: `${m.firstName} ${m.lastName}`,
        affiliation: m.affiliation ?? "",
        role: userId === (currentUser._id ?? "") ? "first" : "co",
        userId,
      });
    }
    return result;
  };

  const buildBlocks = (): ManuscriptBlock[] => {
    if (type === "dissertation") {
      const dmeta: DissertationMeta = {
        degree, specialtyCode, specialty, institution, defenseInstitution,
        supervisor, supervisorTitle, udc: "", city, year: new Date().getFullYear(),
      };
      return makeDissertationBlocks(dmeta);
    }
    const tpl = GENERAL_TEMPLATES.find((t) => t.key === templateKey);
    return tpl ? tpl.blocks() : [];
  };

  const handleSubmit = async () => {
    if (!title.trim()) { setError(isUk ? "Введіть назву" : "Enter title"); return; }
    setIsSaving(true);
    setError("");

    const dissertationMeta: DissertationMeta | undefined =
      type === "dissertation"
        ? { degree, specialtyCode, specialty, institution, defenseInstitution, supervisor, supervisorTitle, udc: "", city, year: new Date().getFullYear() }
        : undefined;

    const result = await createManuscriptAction(projectId, {
      title: title.trim(),
      type,
      authors: buildAuthors(),
      blocks: buildBlocks(),
      dissertationMeta,
    });

    if (result.ok && result.manuscript) {
      onCreated(result.manuscript);
    } else {
      setError(isUk ? "Помилка створення. Спробуйте ще раз." : "Creation failed.");
      setIsSaving(false);
    }
  };

  const canNext = step === 1 ? title.trim().length >= 2 : true;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="relative flex w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-2xl sm:rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-4">
            {/* Steps */}
            <div className="flex items-center gap-2">
              {Array.from({ length: totalSteps }, (_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <StepDot n={i + 1} active={step === i + 1} done={step > i + 1} />
                  {i < totalSteps - 1 && <div className={`h-px w-6 ${step > i + 1 ? "bg-blue-400" : "bg-slate-200"}`} />}
                </div>
              ))}
            </div>
            <div>
              <p className="text-xs text-slate-400">
                {isUk ? `Крок ${step} з ${totalSteps}` : `Step ${step} of ${totalSteps}`}
              </p>
              <p className="text-sm font-bold text-slate-800">
                {step === 1 && (isUk ? "Тип і назва" : "Type & title")}
                {step === 2 && type === "dissertation" && (isUk ? "Метадані дисертації" : "Dissertation details")}
                {step === 2 && type !== "dissertation" && (isUk ? "Шаблон і автори" : "Template & authors")}
                {step === 3 && (isUk ? "Автори" : "Authors")}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[65vh] overflow-y-auto p-6">

          {/* ── Step 1: Type + Title ────────────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  {isUk ? "Тип документу" : "Document type"}
                </label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => { setType(t.value); if (t.value === "dissertation") setTemplateKey("dissertation_mon"); }}
                      className={`flex items-center gap-3 rounded-xl border-2 p-3 text-left transition ${
                        type === t.value ? `${t.color} border-current` : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <span className={type === t.value ? "" : "text-slate-400"}>{t.icon}</span>
                      <span className={`text-sm font-semibold ${type === t.value ? "" : "text-slate-600"}`}>
                        {isUk ? t.labelUk : t.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  {isUk ? "Назва рукопису" : "Title"} *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && canNext && setStep(2)}
                  placeholder={
                    type === "dissertation"
                      ? isUk ? "Тема дисертаційної роботи..." : "Dissertation topic..."
                      : isUk ? "Назва рукопису..." : "Manuscript title..."
                  }
                  autoFocus
                  className="input-control w-full px-3 py-2.5 text-sm outline-none"
                />
                {type === "dissertation" && (
                  <p className="mt-1.5 text-xs text-slate-400">
                    {isUk
                      ? "Тема дисертації вказується відповідно до рішення вченої ради"
                      : "The dissertation topic is set per the academic council decision"}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ── Step 2 for dissertation: Dissertation metadata ──────────────── */}
          {step === 2 && type === "dissertation" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-violet-100 bg-violet-50 px-4 py-3">
                <p className="text-xs font-semibold text-violet-700">
                  {isUk
                    ? "Наказ МОН України №40 від 12.01.2017 — Вимоги до оформлення дисертацій"
                    : "MES Ukraine Order №40, 12.01.2017 — Dissertation formatting requirements"}
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  {isUk ? "Науковий ступінь" : "Academic degree"}
                </label>
                <div className="flex gap-2">
                  {(["phd", "doctor"] as const).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDegree(d)}
                      className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                        degree === d ? "border-violet-400 bg-violet-50 text-violet-700" : "border-slate-200 text-slate-600 hover:border-violet-200"
                      }`}
                    >
                      {d === "phd"
                        ? isUk ? "Доктор філософії (PhD)" : "Doctor of Philosophy (PhD)"
                        : isUk ? "Доктор наук (Dr.Sc.)" : "Doctor of Science (Dr.Sc.)"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                  {isUk ? "Спеціальність (Постанова КМУ №1021-2024)" : "Specialty (CMU Resolution 1021-2024)"}
                </label>
                <SpecialtySelect
                  value={specialtyCode}
                  onChange={(code) => {
                    setSpecialtyCode(code);
                    const s = SPECIALTY_BY_CODE[code];
                    if (s) { setSpecialty(s.name); return; }
                    const f = FIELD_BY_CODE[code as keyof typeof FIELD_BY_CODE];
                    if (f) setSpecialty(f.name);
                  }}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                  {isUk ? "Установа підготовки здобувача" : "Applicant's training institution"}
                </label>
                <InstitutionSearch
                  value={institution}
                  onChange={setInstitution}
                  placeholder={isUk ? "Назва наукової установи / університету" : "Institution name..."}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                  {isUk ? "Установа, де відбудеться захист" : "Institution where defense will be held"}
                </label>
                <InstitutionSearch
                  value={defenseInstitution}
                  onChange={setDefenseInstitution}
                  placeholder={isUk ? "Назва установи та спеціалізованої вченої ради" : "Institution with specialized council..."}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">
                    {isUk ? "Науковий керівник (ПІБ)" : "Supervisor (full name)"}
                  </label>
                  <input
                    type="text"
                    value={supervisor}
                    onChange={(e) => setSupervisor(e.target.value)}
                    placeholder={isUk ? "Іванов Іван Іванович" : "Full name..."}
                    className="input-control w-full px-2.5 py-2 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">
                    {isUk ? "Вчений ступінь і звання" : "Academic title"}
                  </label>
                  <input
                    type="text"
                    value={supervisorTitle}
                    onChange={(e) => setSupervisorTitle(e.target.value)}
                    placeholder="д.б.н., проф."
                    className="input-control w-full px-2.5 py-2 text-sm outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                  {isUk ? "Місто захисту" : "Defense city"}
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Київ"
                  className="input-control w-full px-2.5 py-2 text-sm outline-none"
                />
              </div>
            </div>
          )}

          {/* ── Step 2 for non-dissertation: Template + Authors ─────────────── */}
          {step === 2 && type !== "dissertation" && (
            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  {isUk ? "Шаблон структури" : "Structure template"}
                </label>
                <div className="space-y-2">
                  {GENERAL_TEMPLATES.map((tpl) => (
                    <button
                      key={tpl.key}
                      type="button"
                      onClick={() => setTemplateKey(tpl.key)}
                      className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
                        templateKey === tpl.key
                          ? "border-blue-400 bg-blue-50"
                          : "border-slate-200 hover:border-blue-200"
                      }`}
                    >
                      <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                        templateKey === tpl.key ? "border-blue-500 bg-blue-500" : "border-slate-300"
                      }`}>
                        {templateKey === tpl.key && <span className="h-2 w-2 rounded-full bg-white" />}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-semibold ${templateKey === tpl.key ? "text-blue-700" : "text-slate-800"}`}>
                          {isUk ? tpl.labelUk : tpl.label}
                        </p>
                        <p className="text-xs text-slate-400">{isUk ? tpl.descUk : tpl.desc}</p>
                      </div>
                      {tpl.sections > 0 && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                          {tpl.sections} {isUk ? "розд." : "sec."}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {members.length > 0 && (
                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <Users className="h-4 w-4" />
                    {isUk ? "Автори" : "Authors"}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {members.map((m) => {
                      const sel = selectedMemberIds.includes(m._id ?? "");
                      return (
                        <button
                          key={m._id}
                          type="button"
                          onClick={() => toggleMember(m._id ?? "")}
                          className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition ${
                            sel ? "border-blue-400 bg-blue-50 font-semibold text-blue-700" : "border-slate-200 text-slate-600 hover:border-blue-200"
                          }`}
                        >
                          <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${sel ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-600"}`}>
                            {m.firstName?.[0]}{m.lastName?.[0]}
                          </span>
                          {m.firstName} {m.lastName}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Step 3 for dissertation: Authors ──────────────────────────── */}
          {step === 3 && type === "dissertation" && members.length > 0 && (
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Users className="h-4 w-4" />
                {isUk ? "Здобувач та співавтори" : "Applicant & co-authors"}
              </label>
              <div className="flex flex-wrap gap-2">
                {members.map((m) => {
                  const sel = selectedMemberIds.includes(m._id ?? "");
                  return (
                    <button
                      key={m._id}
                      type="button"
                      onClick={() => toggleMember(m._id ?? "")}
                      className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition ${
                        sel ? "border-violet-400 bg-violet-50 font-semibold text-violet-700" : "border-slate-200 text-slate-600 hover:border-violet-200"
                      }`}
                    >
                      <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${sel ? "bg-violet-600 text-white" : "bg-slate-200 text-slate-600"}`}>
                        {m.firstName?.[0]}{m.lastName?.[0]}
                      </span>
                      {m.firstName} {m.lastName}
                      {m._id === currentUser._id && (
                        <span className="text-[10px] text-violet-400">{isUk ? "(здобувач)" : "(applicant)"}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {error && (
            <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
          <button
            type="button"
            onClick={step === 1 ? onClose : () => setStep((s) => s - 1)}
            className="control flex items-center gap-1.5 px-4 py-2 text-sm font-semibold"
          >
            {step === 1 ? (isUk ? "Скасувати" : "Cancel") : <><ChevronLeft className="h-4 w-4" />{isUk ? "Назад" : "Back"}</>}
          </button>

          {step < totalSteps ? (
            <button
              type="button"
              disabled={!canNext}
              onClick={() => setStep((s) => s + 1)}
              className="control-primary flex items-center gap-1.5 px-5 py-2 text-sm font-semibold disabled:opacity-50"
            >
              {isUk ? "Далі" : "Next"} <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={isSaving || !title.trim()}
              onClick={handleSubmit}
              className="control-primary px-5 py-2 text-sm font-semibold disabled:opacity-50"
            >
              {isSaving
                ? isUk ? "Створення..." : "Creating..."
                : isUk ? "Створити рукопис" : "Create manuscript"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
