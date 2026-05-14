import { NextResponse } from "next/server";
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  Table, TableRow, TableCell, WidthType,
  AlignmentType, ShadingType,
} from "docx";
import { collectReportExportData } from "@/lib/report-export-data";

function fmtDate(d: string | null | undefined | Date): string {
  if (!d) return "—";
  const dt = new Date(d as string);
  return isNaN(dt.getTime()) ? "—" : dt.toLocaleDateString("uk-UA");
}

function fmtMoney(n: number, currency: string): string {
  return `${n.toLocaleString("uk-UA")} ${currency}`;
}

function sectionHeading(text: string): Paragraph {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 200 },
  });
}

function subHeading(text: string): Paragraph {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 120 },
  });
}

function bodyParagraph(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, size: 22 })],
    spacing: { after: 160 },
  });
}

function labelValue(label: string, value: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({ text: `${label}: `, bold: true, size: 22 }),
      new TextRun({ text: value, size: 22 }),
    ],
    spacing: { after: 100 },
  });
}


function dataTable(headers: string[], rows: string[][]): Table {
  const headerCells = headers.map((h, i) =>
    new TableCell({
      children: [new Paragraph({
        children: [new TextRun({ text: h, bold: true, size: 18, color: "FFFFFF" })],
      })],
      shading: { type: ShadingType.SOLID, color: "059669" },
      width: { size: i === 0 ? 2000 : Math.floor(7500 / (headers.length - 1)), type: WidthType.DXA },
    })
  );

  const dataRows = rows.map((row, ri) =>
    new TableRow({
      children: row.map((cell, ci) =>
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: cell, size: 18 })] })],
          shading: ri % 2 === 0 ? undefined : { type: ShadingType.SOLID, color: "F5F5F4" },
          width: { size: ci === 0 ? 2000 : Math.floor(7500 / (row.length - 1)), type: WidthType.DXA },
        })
      ),
    })
  );

  return new Table({
    rows: [new TableRow({ children: headerCells, tableHeader: true }), ...dataRows],
    width: { size: 9500, type: WidthType.DXA },
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

  const children: (Paragraph | Table)[] = [];

  // Cover
  children.push(new Paragraph({
    children: [new TextRun({ text: project.grantProgram, size: 18, color: "6B7280", allCaps: true })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 120 },
  }));
  children.push(new Paragraph({
    children: [new TextRun({ text: project.title, size: 36, bold: true })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 120 },
  }));
  if (project.acronym) {
    children.push(new Paragraph({
      children: [new TextRun({ text: project.acronym, size: 24, color: "059669" })],
      alignment: AlignmentType.CENTER,
    }));
  }
  children.push(new Paragraph({
    children: [new TextRun({ text: `${fmtDate(project.startDate)} — ${fmtDate(project.endDate)}`, size: 20, color: "6B7280" })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 480 },
  }));

  // Report sections
  if (report) {
    children.push(sectionHeading(report.title));
    if (report.period) children.push(labelValue("Період", report.period));
    children.push(labelValue("Тип", report.type));
    children.push(labelValue("Статус", report.status));
    children.push(new Paragraph({ text: "", spacing: { after: 200 } }));

    const sections: Array<{ key: keyof typeof report; label: string }> = [
      { key: "sectionGoals", label: "1. Мета та завдання" },
      { key: "sectionTimeline", label: "2. Хід виконання" },
      { key: "sectionResults", label: "3. Результати" },
      { key: "sectionPublications", label: "4. Публікації та апробація" },
      { key: "sectionFinancial", label: "5. Фінансова звітність" },
      { key: "sectionProblems", label: "6. Проблеми та відхилення" },
      { key: "sectionPlans", label: "7. Плани на наступний період" },
    ];

    for (const { key, label } of sections) {
      const text = report[key] as string | undefined;
      if (text) {
        children.push(subHeading(label));
        for (const para of text.split("\n\n")) {
          if (para.trim()) children.push(bodyParagraph(para.trim()));
        }
      }
    }
  }

  // Stages table
  if (stages.length) {
    children.push(sectionHeading("Етапи дослідження"));
    children.push(dataTable(
      ["#", "Назва", "Початок", "Кінець", "Статус", "%"],
      stages.map((s) => [String(s.stageNumber), s.title, fmtDate(s.startDate), fmtDate(s.endDate), s.status, String(s.progress)])
    ));
  }

  // Experiments table
  if (experiments.length) {
    children.push(sectionHeading("Експерименти"));
    children.push(dataTable(
      ["Назва", "Тип", "Статус", "Початок", "Кінець"],
      experiments.map((e) => [e.title, e.type, e.status, fmtDate(e.startDate), fmtDate(e.endDate)])
    ));
  }

  // Tasks table
  if (tasks.length) {
    children.push(sectionHeading("Задачі"));
    children.push(dataTable(
      ["Назва", "Статус", "Пріоритет", "Дедлайн"],
      tasks.map((t) => [t.title, t.status, t.priority, fmtDate(t.dueDate)])
    ));
  }

  // Milestones table
  if (milestones.length) {
    children.push(sectionHeading("Контрольні точки"));
    children.push(dataTable(
      ["Назва", "Дата", "Статус"],
      milestones.map((m) => [m.title, fmtDate(m.dueDate), m.status])
    ));
  }

  // Events table
  if (events.length) {
    children.push(sectionHeading("Заходи / Конференції"));
    children.push(dataTable(
      ["Назва", "Тип", "Дата", "Місце"],
      events.map((e) => [e.title, e.type, fmtDate(e.startDate), e.location ?? ""])
    ));
  }

  // Publications table
  if (publications.length) {
    children.push(sectionHeading("Публікації"));
    children.push(dataTable(
      ["Назва", "Тип", "Автори", "Рік", "DOI"],
      publications.map((p) => [p.title, p.type, p.authors ?? "", String(p.expectedYear ?? ""), p.doi ?? ""])
    ));
  }

  // Deliverables table
  if (deliverables.length) {
    children.push(sectionHeading("Результати проєкту"));
    children.push(dataTable(
      ["Назва", "Тип", "Дедлайн", "Статус"],
      deliverables.map((d) => [d.title, d.type, fmtDate(d.plannedDate), d.status])
    ));
  }

  // Open Science
  if (openScience.length) {
    children.push(sectionHeading("Відкрита наука"));
    children.push(dataTable(
      ["Назва", "Категорія", "Статус", "Опубліковано"],
      openScience.map((o) => [o.title, o.category, o.status, fmtDate(o.publishedAt)])
    ));
  }

  // Budget
  children.push(sectionHeading("Бюджет"));
  children.push(labelValue("Заплановано", fmtMoney(budget.totalPlanned, budget.currency)));
  children.push(labelValue("Зафіксовано", fmtMoney(budget.totalCommitted, budget.currency)));
  children.push(labelValue("Витрачено", fmtMoney(budget.totalSpent, budget.currency)));

  if (budget.byCategory.length) {
    children.push(subHeading("За категоріями"));
    children.push(dataTable(
      ["Категорія", "Заплановано", "Витрачено"],
      budget.byCategory.map((c) => [c.category, fmtMoney(c.planned, budget.currency), fmtMoney(c.spent, budget.currency)])
    ));
  }

  if (budget.purchaseRequests.length) {
    children.push(subHeading("Запити на закупівлю"));
    children.push(dataTable(
      ["Назва", "Категорія", "Статус", "Кошторис", "Факт"],
      budget.purchaseRequests.map((r) => [
        r.title, r.category, r.status,
        fmtMoney(r.estimatedAmount, budget.currency),
        r.actualAmount != null ? fmtMoney(r.actualAmount, budget.currency) : "—",
      ])
    ));
  }

  // Footer paragraph
  children.push(new Paragraph({
    children: [new TextRun({ text: `Research Navigator · ${fmtDate(data.generatedAt)}`, size: 16, color: "9CA3AF" })],
    alignment: AlignmentType.RIGHT,
    spacing: { before: 600 },
  }));

  const doc = new Document({
    styles: {
      paragraphStyles: [
        {
          id: "Normal",
          name: "Normal",
          run: { font: "Calibri", size: 22 },
        },
      ],
    },
    sections: [{
      properties: {
        page: {
          margin: { top: 1440, bottom: 1440, left: 1800, right: 1440 },
        },
      },
      children,
    }],
  });

  const buffer = await Packer.toBuffer(doc);
  const slug = project.acronym || "report";
  const filename = `${slug}-${new Date().toISOString().slice(0, 10)}.docx`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
