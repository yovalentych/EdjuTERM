import type { ReportExportData } from "@/lib/report-export-data";

function esc(v: unknown): string {
  const s = v == null ? "" : String(v);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function row(...cells: unknown[]): string {
  return cells.map(esc).join(",");
}

function sheet(heading: string, headers: string[], rows: string[][]): string {
  const lines = [
    `### ${heading}`,
    headers.join(","),
    ...rows.map((r) => r.join(",")),
    "",
  ];
  return lines.join("\n");
}

export function buildCsv(data: ReportExportData): string {
  const { project, stages, experiments, tasks, milestones, events, publications, deliverables, openScience, budget } = data;

  const parts: string[] = [];

  // Project info
  parts.push(sheet(
    "Project",
    ["Field", "Value"],
    [
      ["Title", esc(project.title)],
      ["Acronym", esc(project.acronym)],
      ["Grant Program", esc(project.grantProgram)],
      ["Start Date", esc(project.startDate)],
      ["End Date", esc(project.endDate)],
      ["Status", esc(project.status)],
    ]
  ));

  // Stages
  if (stages.length) {
    parts.push(sheet(
      "Research Stages",
      ["#", "Title", "Start", "End", "Status", "Progress %", "Budget"],
      stages.map((s) => [
        row(s.stageNumber),
        esc(s.title),
        esc(s.startDate),
        esc(s.endDate),
        esc(s.status),
        row(s.progress),
        row(s.budget),
      ])
    ));
  }

  // Experiments
  if (experiments.length) {
    parts.push(sheet(
      "Experiments",
      ["Title", "Type", "Status", "Start", "End", "Hypothesis"],
      experiments.map((e) => [
        esc(e.title),
        esc(e.type),
        esc(e.status),
        esc(e.startDate ?? ""),
        esc(e.endDate ?? ""),
        esc(e.hypothesis ?? ""),
      ])
    ));
  }

  // Tasks
  if (tasks.length) {
    parts.push(sheet(
      "Tasks",
      ["Title", "Status", "Priority", "Due Date", "Category", "Est. Hours"],
      tasks.map((t) => [
        esc(t.title),
        esc(t.status),
        esc(t.priority),
        esc(t.dueDate ?? ""),
        esc(t.category ?? ""),
        row(t.estimatedHours ?? 0),
      ])
    ));
  }

  // Milestones
  if (milestones.length) {
    parts.push(sheet(
      "Milestones",
      ["Title", "Due Date", "Status"],
      milestones.map((m) => [esc(m.title), esc(m.dueDate), esc(m.status)])
    ));
  }

  // Events
  if (events.length) {
    parts.push(sheet(
      "Events",
      ["Title", "Type", "Date", "Location", "Status"],
      events.map((e) => [
        esc(e.title),
        esc(e.type),
        esc(e.startDate ?? ""),
        esc(e.location ?? ""),
        esc(e.status),
      ])
    ));
  }

  // Publications
  if (publications.length) {
    parts.push(sheet(
      "Publications",
      ["Title", "Type", "Authors", "Year", "DOI", "Status"],
      publications.map((p) => [
        esc(p.title),
        esc(p.type),
        esc(p.authors ?? ""),
        esc(p.expectedYear ?? ""),
        esc(p.doi ?? ""),
        esc(p.status),
      ])
    ));
  }

  // Deliverables
  if (deliverables.length) {
    parts.push(sheet(
      "Deliverables",
      ["Title", "Type", "Due Date", "Status"],
      deliverables.map((d) => [
        esc(d.title),
        esc(d.type),
        esc(d.plannedDate ?? ""),
        esc(d.status),
      ])
    ));
  }

  // Open Science
  if (openScience.length) {
    parts.push(sheet(
      "Open Science",
      ["Title", "Category", "Status", "Published At"],
      openScience.map((o) => [
        esc(o.title),
        esc(o.category),
        esc(o.status),
        esc(o.publishedAt ? new Date(o.publishedAt).toISOString().slice(0, 10) : ""),
      ])
    ));
  }

  // Budget summary
  parts.push(sheet(
    "Budget Summary",
    ["Field", "Value"],
    [
      ["Total Planned", row(budget.totalPlanned), budget.currency],
      ["Total Committed", row(budget.totalCommitted), budget.currency],
      ["Total Spent", row(budget.totalSpent), budget.currency],
    ]
  ));

  if (budget.lineItems.length) {
    parts.push(sheet(
      "Budget Line Items",
      ["Category", "Description", "Planned Amount", "Currency"],
      budget.lineItems.map((li) => [
        esc(li.category),
        esc(li.description),
        row(li.plannedAmount),
        esc(li.currency),
      ])
    ));
  }

  if (budget.purchaseRequests.length) {
    parts.push(sheet(
      "Purchase Requests",
      ["Title", "Category", "Status", "Estimated", "Actual"],
      budget.purchaseRequests.map((r) => [
        esc(r.title),
        esc(r.category),
        esc(r.status),
        row(r.estimatedAmount),
        row(r.actualAmount ?? ""),
      ])
    ));
  }

  return parts.join("\n");
}

export function downloadCsv(data: ReportExportData, filename: string): void {
  const csv = buildCsv(data);
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  triggerDownload(blob, filename);
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
