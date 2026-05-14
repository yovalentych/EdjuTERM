import { NextResponse } from "next/server";
import pptxgen from "pptxgenjs";
import { collectReportExportData } from "@/lib/report-export-data";

function fmtDate(d: string | null | undefined | Date): string {
  if (!d) return "—";
  const dt = new Date(d as string);
  return isNaN(dt.getTime()) ? "—" : dt.toLocaleDateString("uk-UA");
}

function fmtMoney(n: number, currency: string): string {
  return `${n.toLocaleString("uk-UA")} ${currency}`;
}

const COLOR_EMERALD = "059669";
const COLOR_STONE = "78716C";
const COLOR_WHITE = "FFFFFF";
const COLOR_DARK = "1C1917";
const COLOR_GRAY = "6B7280";

function addTitleSlide(pptx: pptxgen, project: { title: string; acronym: string; grantProgram: string; startDate: string; endDate: string }) {
  const slide = pptx.addSlide();
  slide.background = { color: "F7F7F5" };

  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: "100%", h: 0.08, fill: { color: COLOR_EMERALD } });

  slide.addText(project.grantProgram, {
    x: 0.8, y: 1.0, w: 8.4, h: 0.4,
    fontSize: 11, color: COLOR_STONE, bold: false, align: "center",
  });

  slide.addText(project.title, {
    x: 0.8, y: 1.5, w: 8.4, h: 1.8,
    fontSize: 28, color: COLOR_DARK, bold: true, align: "center", wrap: true,
  });

  if (project.acronym) {
    slide.addText(project.acronym, {
      x: 0.8, y: 3.4, w: 8.4, h: 0.5,
      fontSize: 18, color: COLOR_EMERALD, bold: true, align: "center",
    });
  }

  slide.addText(`${fmtDate(project.startDate)} — ${fmtDate(project.endDate)}`, {
    x: 0.8, y: 4.0, w: 8.4, h: 0.4,
    fontSize: 13, color: COLOR_GRAY, align: "center",
  });

  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 7.42, w: "100%", h: 0.08, fill: { color: COLOR_EMERALD } });
}

function addSectionSlide(pptx: pptxgen, title: string, bullets: string[]) {
  const slide = pptx.addSlide();
  slide.background = { color: "FFFFFF" };
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: "100%", h: 0.08, fill: { color: COLOR_EMERALD } });

  slide.addText(title, {
    x: 0.5, y: 0.3, w: 9.0, h: 0.7,
    fontSize: 20, bold: true, color: COLOR_DARK,
  });

  slide.addShape(pptx.ShapeType.rect, { x: 0.5, y: 1.0, w: 9.0, h: 0.04, fill: { color: "E7E5E4" } });

  const items = bullets.slice(0, 12);
  slide.addText(
    items.map((b) => ({ text: b, options: { bullet: { type: "bullet" } } })),
    {
      x: 0.5, y: 1.2, w: 9.0, h: 5.8,
      fontSize: 14, color: COLOR_STONE, wrap: true, valign: "top",
    }
  );
}

function addTableSlide(pptx: pptxgen, title: string, headers: string[], rows: string[][]) {
  const CHUNK = 15;
  const chunks: string[][][] = [];
  for (let i = 0; i < rows.length; i += CHUNK) {
    chunks.push(rows.slice(i, i + CHUNK));
  }

  chunks.forEach((chunk, idx) => {
    const slide = pptx.addSlide();
    slide.background = { color: "FFFFFF" };
    slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: "100%", h: 0.08, fill: { color: COLOR_EMERALD } });

    const slideTitle = chunks.length > 1 ? `${title} (${idx + 1}/${chunks.length})` : title;
    slide.addText(slideTitle, {
      x: 0.5, y: 0.15, w: 9.0, h: 0.6,
      fontSize: 18, bold: true, color: COLOR_DARK,
    });

    const colW = 9.0 / headers.length;
    const tableRows = [
      headers.map((h) => ({
        text: h,
        options: { bold: true, color: COLOR_WHITE, fill: { color: COLOR_EMERALD }, fontSize: 11 },
      })),
      ...chunk.map((r) =>
        r.map((cell) => ({ text: cell, options: { fontSize: 10, color: COLOR_DARK } }))
      ),
    ];

    slide.addTable(tableRows, {
      x: 0.5, y: 0.9, w: 9.0,
      colW: headers.map(() => colW),
      border: { pt: 0.5, color: "E7E5E4" },
      rowH: 0.32,
    });
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ reportId: string }> },
) {
  const { reportId } = await params;
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");
  const sectionsParam = searchParams.get("sections") ?? "";
  const inc = sectionsParam ? new Set(sectionsParam.split(",")) : null;
  const has = (s: string) => !inc || inc.has(s);

  if (!projectId) return NextResponse.json({ error: "projectId required" }, { status: 400 });

  const raw = await collectReportExportData(projectId, reportId === "none" ? null : reportId);
  if (!raw) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data = {
    ...raw,
    report: raw.report ? {
      ...raw.report,
      sectionGoals:        has("sectionGoals")        ? raw.report.sectionGoals        : "",
      sectionTimeline:     has("sectionTimeline")     ? raw.report.sectionTimeline     : "",
      sectionResults:      has("sectionResults")      ? raw.report.sectionResults      : "",
      sectionPublications: has("sectionPublications") ? raw.report.sectionPublications : "",
      sectionFinancial:    has("sectionFinancial")    ? raw.report.sectionFinancial    : "",
      sectionProblems:     has("sectionProblems")     ? raw.report.sectionProblems     : "",
      sectionPlans:        has("sectionPlans")        ? raw.report.sectionPlans        : "",
    } : null,
    stages:       has("stages")       ? raw.stages       : [],
    experiments:  has("experiments")  ? raw.experiments  : [],
    tasks:        has("tasks")        ? raw.tasks        : [],
    milestones:   has("milestones")   ? raw.milestones   : [],
    events:       has("events")       ? raw.events       : [],
    publications: has("publications") ? raw.publications : [],
    deliverables: has("deliverables") ? raw.deliverables : [],
    openScience:  has("openScience")  ? raw.openScience  : [],
    budget:       has("budget")       ? raw.budget       : { ...raw.budget, totalPlanned: 0, totalCommitted: 0, totalSpent: 0, byCategory: [], lineItems: [], purchaseRequests: [], periods: [] },
  };

  const { project, report, stages, experiments, tasks, milestones, events, publications, deliverables, openScience, budget } = data;

  const pptx = new pptxgen();
  pptx.layout = "LAYOUT_WIDE";
  pptx.title = project.title;
  pptx.author = "Research Navigator";

  addTitleSlide(pptx, project);

  // Agenda slide
  const agendaItems: string[] = [];
  if (report) agendaItems.push("Зміст звіту");
  if (stages.length) agendaItems.push(`Етапи дослідження (${stages.length})`);
  if (experiments.length) agendaItems.push(`Експерименти (${experiments.length})`);
  if (tasks.length) agendaItems.push(`Задачі (${tasks.length})`);
  if (milestones.length) agendaItems.push(`Контрольні точки (${milestones.length})`);
  if (events.length) agendaItems.push(`Заходи (${events.length})`);
  if (publications.length) agendaItems.push(`Публікації (${publications.length})`);
  if (deliverables.length) agendaItems.push(`Результати проєкту (${deliverables.length})`);
  if (openScience.length) agendaItems.push(`Відкрита наука (${openScience.length})`);
  agendaItems.push("Бюджет");

  if (agendaItems.length) {
    addSectionSlide(pptx, "Зміст презентації", agendaItems);
  }

  // Report sections
  if (report) {
    const sections: Array<{ key: keyof typeof report; label: string }> = [
      { key: "sectionGoals", label: "Мета та завдання" },
      { key: "sectionTimeline", label: "Хід виконання" },
      { key: "sectionResults", label: "Результати" },
      { key: "sectionPublications", label: "Публікації та апробація" },
      { key: "sectionFinancial", label: "Фінансова звітність" },
      { key: "sectionProblems", label: "Проблеми та відхилення" },
      { key: "sectionPlans", label: "Плани на наступний період" },
    ];

    for (const { key, label } of sections) {
      const text = report[key] as string | undefined;
      if (text && text.trim()) {
        const lines = text.split("\n").filter((l) => l.trim()).slice(0, 12);
        addSectionSlide(pptx, label, lines);
      }
    }
  }

  // Stages table
  if (stages.length) {
    addTableSlide(pptx, "Етапи дослідження",
      ["#", "Назва", "Початок", "Кінець", "Статус", "%"],
      stages.map((s) => [String(s.stageNumber), s.title.slice(0, 40), fmtDate(s.startDate), fmtDate(s.endDate), s.status, `${s.progress}%`])
    );
  }

  // Experiments
  if (experiments.length) {
    addTableSlide(pptx, "Експерименти",
      ["Назва", "Тип", "Статус", "Початок", "Кінець"],
      experiments.map((e) => [e.title.slice(0, 40), e.type, e.status, fmtDate(e.startDate), fmtDate(e.endDate)])
    );
  }

  // Tasks
  if (tasks.length) {
    addTableSlide(pptx, "Задачі",
      ["Назва", "Статус", "Пріоритет", "Дедлайн"],
      tasks.map((t) => [t.title.slice(0, 50), t.status, t.priority, fmtDate(t.dueDate)])
    );
  }

  // Milestones
  if (milestones.length) {
    addTableSlide(pptx, "Контрольні точки",
      ["Назва", "Дата", "Статус"],
      milestones.map((m) => [m.title.slice(0, 60), fmtDate(m.dueDate), m.status])
    );
  }

  // Events
  if (events.length) {
    addTableSlide(pptx, "Заходи / Конференції",
      ["Назва", "Тип", "Дата", "Місце"],
      events.map((e) => [e.title.slice(0, 40), e.type, fmtDate(e.startDate), (e.location ?? "").slice(0, 30)])
    );
  }

  // Publications
  if (publications.length) {
    addTableSlide(pptx, "Публікації",
      ["Назва", "Тип", "Автори", "Рік"],
      publications.map((p) => [p.title.slice(0, 40), p.type, (p.authors ?? "").slice(0, 30), String(p.expectedYear ?? "")])
    );
  }

  // Deliverables
  if (deliverables.length) {
    addTableSlide(pptx, "Результати проєкту",
      ["Назва", "Тип", "Дедлайн", "Статус"],
      deliverables.map((d) => [d.title.slice(0, 50), d.type, fmtDate(d.plannedDate), d.status])
    );
  }

  // Open Science
  if (openScience.length) {
    addTableSlide(pptx, "Відкрита наука",
      ["Назва", "Категорія", "Статус"],
      openScience.map((o) => [o.title.slice(0, 50), o.category, o.status])
    );
  }

  // Budget slide
  {
    const slide = pptx.addSlide();
    slide.background = { color: "FFFFFF" };
    slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: "100%", h: 0.08, fill: { color: COLOR_EMERALD } });
    slide.addText("Бюджет", { x: 0.5, y: 0.2, w: 9.0, h: 0.6, fontSize: 20, bold: true, color: COLOR_DARK });

    const budgetLines = [
      `Заплановано:   ${fmtMoney(budget.totalPlanned, budget.currency)}`,
      `Зафіксовано:   ${fmtMoney(budget.totalCommitted, budget.currency)}`,
      `Витрачено:     ${fmtMoney(budget.totalSpent, budget.currency)}`,
    ];

    if (budget.byCategory.length) {
      budgetLines.push("");
      for (const c of budget.byCategory.slice(0, 6)) {
        budgetLines.push(`${c.category}: ${fmtMoney(c.planned, budget.currency)} → ${fmtMoney(c.spent, budget.currency)}`);
      }
    }

    slide.addText(
      budgetLines.map((l) => ({ text: l, options: {} })),
      { x: 0.5, y: 1.0, w: 9.0, h: 6.0, fontSize: 15, color: COLOR_STONE, wrap: true, valign: "top" }
    );
  }

  // Closing slide
  {
    const slide = pptx.addSlide();
    slide.background = { color: "F7F7F5" };
    slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: "100%", h: 0.08, fill: { color: COLOR_EMERALD } });
    slide.addText("Дякуємо за увагу", {
      x: 0.8, y: 2.5, w: 8.4, h: 1.5,
      fontSize: 36, bold: true, color: COLOR_DARK, align: "center",
    });
    slide.addText(project.acronym, {
      x: 0.8, y: 4.0, w: 8.4, h: 0.6,
      fontSize: 20, color: COLOR_EMERALD, align: "center",
    });
    slide.addText(`Research Navigator · ${fmtDate(data.generatedAt)}`, {
      x: 0.8, y: 6.8, w: 8.4, h: 0.4,
      fontSize: 11, color: COLOR_GRAY, align: "center",
    });
    slide.addShape(pptx.ShapeType.rect, { x: 0, y: 7.42, w: "100%", h: 0.08, fill: { color: COLOR_EMERALD } });
  }

  const output = await pptx.write({ outputType: "uint8array" }) as Uint8Array;
  const slug = project.acronym || "report";
  const filename = `${slug}-${new Date().toISOString().slice(0, 10)}.pptx`;

  return new NextResponse(output as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
