import type { ReportExportData } from "@/lib/report-export-data";
import * as XLSX from "xlsx";

function fmtDate(d: string | null | undefined | Date): string {
  if (!d) return "";
  const dt = new Date(d as string);
  return isNaN(dt.getTime()) ? String(d) : dt.toLocaleDateString("uk-UA");
}

export function buildXlsx(data: ReportExportData): Blob {
  const { project, stages, experiments, tasks, milestones, events, publications, deliverables, openScience, budget } = data;

  const wb = XLSX.utils.book_new();

  // Sheet: Project info
  const projectSheet = XLSX.utils.aoa_to_sheet([
    ["Поле", "Значення"],
    ["Назва", project.title],
    ["Абревіатура", project.acronym],
    ["Програма", project.grantProgram],
    ["Початок", fmtDate(project.startDate)],
    ["Кінець", fmtDate(project.endDate)],
    ["Статус", project.status],
    ["Згенеровано", fmtDate(data.generatedAt)],
  ]);
  XLSX.utils.book_append_sheet(wb, projectSheet, "Проєкт");

  // Sheet: Stages
  if (stages.length) {
    const rows = [["#", "Назва", "Початок", "Кінець", "Статус", "Прогрес %", "Бюджет"]];
    for (const s of stages) {
      rows.push([String(s.stageNumber), s.title, fmtDate(s.startDate), fmtDate(s.endDate), s.status, String(s.progress), String(s.budget)]);
    }
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), "Етапи");
  }

  // Sheet: Experiments
  if (experiments.length) {
    const rows = [["Назва", "Тип", "Статус", "Початок", "Кінець", "Гіпотеза", "Методи", "Результати", "Висновок"]];
    for (const e of experiments) {
      rows.push([
        e.title, e.type, e.status,
        fmtDate(e.startDate), fmtDate(e.endDate),
        e.hypothesis ?? "", e.methods ?? "", e.results ?? "", e.conclusion ?? "",
      ]);
    }
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), "Експерименти");
  }

  // Sheet: Tasks
  if (tasks.length) {
    const rows = [["Назва", "Статус", "Пріоритет", "Дедлайн", "Категорія", "Год. (план)"]];
    for (const t of tasks) {
      rows.push([t.title, t.status, t.priority, fmtDate(t.dueDate), t.category ?? "", String(t.estimatedHours ?? 0)]);
    }
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), "Задачі");
  }

  // Sheet: Milestones
  if (milestones.length) {
    const rows = [["Назва", "Дата", "Статус"]];
    for (const m of milestones) {
      rows.push([m.title, fmtDate(m.dueDate), m.status]);
    }
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), "Контрольні точки");
  }

  // Sheet: Events
  if (events.length) {
    const rows = [["Назва", "Тип", "Дата", "Місце", "Статус", "URL"]];
    for (const e of events) {
      rows.push([e.title, e.type, fmtDate(e.startDate), e.location ?? "", e.status, e.url ?? ""]);
    }
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), "Заходи");
  }

  // Sheet: Publications
  if (publications.length) {
    const rows = [["Назва", "Тип", "Автори", "Рік", "DOI", "Статус", "Журнал"]];
    for (const p of publications) {
      rows.push([p.title, p.type, p.authors ?? "", String(p.expectedYear ?? ""), p.doi ?? "", p.status, p.journal ?? ""]);
    }
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), "Публікації");
  }

  // Sheet: Deliverables
  if (deliverables.length) {
    const rows = [["Назва", "Тип", "Дедлайн", "Статус"]];
    for (const d of deliverables) {
      rows.push([d.title, d.type, fmtDate(d.plannedDate), d.status]);
    }
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), "Результати");
  }

  // Sheet: Open Science
  if (openScience.length) {
    const rows = [["Назва", "Категорія", "Статус", "Опубліковано", "Опис"]];
    for (const o of openScience) {
      rows.push([o.title, o.category, o.status, fmtDate(o.publishedAt), o.summary ?? ""]);
    }
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), "Відкрита наука");
  }

  // Sheet: Budget summary
  const budgetRows = [
    ["Показник", "Значення", "Валюта"],
    ["Заплановано", budget.totalPlanned, budget.currency],
    ["Зафіксовано", budget.totalCommitted, budget.currency],
    ["Витрачено", budget.totalSpent, budget.currency],
    [],
    ["Категорія", "Заплановано", "Витрачено"],
    ...budget.byCategory.map((c) => [c.category, c.planned, c.spent]),
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(budgetRows), "Бюджет");

  // Sheet: Line items
  if (budget.lineItems.length) {
    const rows = [["Категорія", "Опис", "Сума (план)", "Валюта"]];
    for (const li of budget.lineItems) {
      rows.push([li.category, li.description, String(li.plannedAmount), li.currency]);
    }
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), "Статті бюджету");
  }

  // Sheet: Purchase requests
  if (budget.purchaseRequests.length) {
    const rows = [["Назва", "Категорія", "Статус", "Кошторис", "Факт"]];
    for (const r of budget.purchaseRequests) {
      rows.push([r.title, r.category, r.status, String(r.estimatedAmount), String(r.actualAmount ?? "")]);
    }
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), "Закупівлі");
  }

  const arrayBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  return new Blob([arrayBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

export function downloadXlsx(data: ReportExportData, filename: string): void {
  const blob = buildXlsx(data);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
