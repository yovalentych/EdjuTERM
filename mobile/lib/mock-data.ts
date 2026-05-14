export type MobileProject = {
  id: string;
  acronym: string;
  title: string;
  status: "active" | "review" | "archived";
  budget: {
    planned: number;
    committed: number;
    spent: number;
    remaining: number;
  };
  counters: {
    records: number;
    tasks: number;
    events: number;
    warnings: number;
  };
};

export type ActivityItem = {
  id: string;
  title: string;
  meta: string;
  tone: "blue" | "teal" | "amber";
};

export type LearningSession = {
  id: string;
  title: string;
  time: string;
  location: string;
  type: "lecture" | "seminar" | "workshop";
  status: "scheduled" | "completed" | "cancelled" | "absent";
  notes?: string;
};

export type LearningAssignment = {
  id: string;
  title: string;
  dueDate: string;
  course: string;
  priority: "high" | "medium" | "low";
};

export const mockProjects: MobileProject[] = [
  {
    id: "phd-2025",
    acronym: "PHD2025",
    title: "Дисертаційне дослідження",
    status: "active",
    budget: { planned: 120000, committed: 15000, spent: 45000, remaining: 60000 },
    counters: { records: 12, tasks: 8, events: 3, warnings: 1 },
  },
  {
    id: "grant-alpha",
    acronym: "ALPHA",
    title: "Грант: Штучний інтелект у біомедицині",
    status: "active",
    budget: { planned: 500000, committed: 50000, spent: 120000, remaining: 330000 },
    counters: { records: 45, tasks: 24, events: 12, warnings: 0 },
  },
  {
    id: "learning-mode",
    acronym: "LEARN",
    title: "Навчальний план: Аспірантура",
    status: "active",
    budget: { planned: 0, committed: 0, spent: 0, remaining: 0 },
    counters: { records: 0, tasks: 15, events: 5, warnings: 2 },
  },
];

export const mockSessions: LearningSession[] = [
  {
    id: "s1",
    title: "Філософія науки",
    time: "10:00 - 11:30",
    location: "Ауд. 402 / Zoom",
    type: "lecture",
    status: "scheduled",
  },
  {
    id: "s2",
    title: "Методологія досліджень",
    time: "12:00 - 13:30",
    location: "Лабораторія 12",
    type: "seminar",
    status: "completed",
    notes: "Обговорили типи наукових методів: індукція та дедукція.",
  },
  {
    id: "s3",
    title: "Англійська для академічних цілей",
    time: "15:00 - 16:30",
    location: "Кафедра мов",
    type: "workshop",
    status: "scheduled",
  },
];

export const mockAssignments: LearningAssignment[] = [
  {
    id: "a1",
    title: "Огляд літератури (Розділ 1)",
    dueDate: "2025-05-20",
    course: "Методологія досліджень",
    priority: "high",
  },
  {
    id: "a2",
    title: "Есе: Етика в ШІ",
    dueDate: "2025-05-25",
    course: "Філософія науки",
    priority: "medium",
  },
  {
    id: "a3",
    title: "Звіт про патентний пошук",
    dueDate: "2025-06-05",
    course: "Інтелектуальна власність",
    priority: "low",
  },
];

export const recentActivity: ActivityItem[] = [
  {
    id: "diary",
    title: "Записати активність дня",
    meta: "Швидкий щоденник для синхронізації з вебверсією",
    tone: "teal",
  },
  {
    id: "budget",
    title: "Додати заявку на закупівлю",
    meta: "Чернетка заявки з мобільного",
    tone: "amber",
  },
  {
    id: "record",
    title: "Створити польову нотатку",
    meta: "Текст, фото або файл буде додано пізніше",
    tone: "blue",
  },
];
