import type { ReportExportData } from "@/lib/report-export-data";

function line(text = ""): string { return text + "\n"; }
function heading1(text: string): string { return `\n${"=".repeat(60)}\n${text}\n${"=".repeat(60)}\n`; }
function heading2(text: string): string { return `\n${text}\n${"-".repeat(text.length)}\n`; }
function fmtDate(d: string | null | undefined | Date): string {
  if (!d) return "—";
  const dt = new Date(d as string);
  return isNaN(dt.getTime()) ? String(d) : dt.toLocaleDateString("uk-UA", { day: "2-digit", month: "2-digit", year: "numeric" });
}
function fmtMoney(n: number, currency: string): string {
  return `${n.toLocaleString("uk-UA")} ${currency}`;
}

export function buildTxt(data: ReportExportData): string {
  const { project, report, stages, experiments, tasks, milestones, events, publications, deliverables, openScience, budget } = data;
  const lines: string[] = [];

  // Header
  lines.push(heading1(`ЗВІТ ГРАНТУ / GRANT REPORT`));
  lines.push(line(`Проєкт: ${project.title}`));
  lines.push(line(`Абревіатура: ${project.acronym}`));
  lines.push(line(`Програма: ${project.grantProgram}`));
  lines.push(line(`Виконання: ${fmtDate(project.startDate)} — ${fmtDate(project.endDate)}`));
  lines.push(line(`Статус: ${project.status}`));
  lines.push(line(`Згенеровано: ${fmtDate(data.generatedAt)}`));
  lines.push(line());

  // Report sections
  if (report) {
    lines.push(heading1(report.title));
    if (report.period) lines.push(line(`Період: ${report.period}`));
    lines.push(line(`Тип: ${report.type} | Статус: ${report.status}`));
    lines.push(line());

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
        lines.push(heading2(label));
        lines.push(line(text));
        lines.push(line());
      }
    }
  }

  // Research stages
  if (stages.length) {
    lines.push(heading1("ЕТАПИ ДОСЛІДЖЕННЯ"));
    for (const s of stages) {
      lines.push(line(`Е${s.stageNumber}. ${s.title}`));
      lines.push(line(`   Термін: ${fmtDate(s.startDate)} — ${fmtDate(s.endDate)}`));
      lines.push(line(`   Статус: ${s.status} | Прогрес: ${s.progress}% | Бюджет: ${fmtMoney(s.budget, s.currency)}`));
      lines.push(line());
    }
  }

  // Experiments
  if (experiments.length) {
    lines.push(heading1("ЕКСПЕРИМЕНТИ"));
    for (const e of experiments) {
      lines.push(line(`▸ [${e.type}] ${e.title}`));
      lines.push(line(`  Статус: ${e.status}`));
      if (e.startDate || e.endDate) lines.push(line(`  Термін: ${fmtDate(e.startDate)} — ${fmtDate(e.endDate)}`));
      if (e.hypothesis) lines.push(line(`  Гіпотеза: ${e.hypothesis}`));
      if (e.methods) lines.push(line(`  Методи: ${e.methods}`));
      if (e.results) lines.push(line(`  Результати: ${e.results}`));
      if (e.conclusion) lines.push(line(`  Висновок: ${e.conclusion}`));
      lines.push(line());
    }
  }

  // Tasks
  if (tasks.length) {
    lines.push(heading1("ЗАДАЧІ"));
    const byStatus: Record<string, typeof tasks> = {};
    for (const t of tasks) {
      if (!byStatus[t.status]) byStatus[t.status] = [];
      byStatus[t.status].push(t);
    }
    for (const [status, group] of Object.entries(byStatus)) {
      lines.push(heading2(status.toUpperCase()));
      for (const t of group) {
        lines.push(line(`  [${t.priority}] ${t.title}`));
        if (t.dueDate) lines.push(line(`         Due: ${fmtDate(t.dueDate)}`));
      }
    }
    lines.push(line());
  }

  // Milestones
  if (milestones.length) {
    lines.push(heading1("КОНТРОЛЬНІ ТОЧКИ"));
    for (const m of milestones) {
      const icon = m.status === "reached" ? "✓" : m.status === "missed" ? "✗" : "○";
      lines.push(line(`  ${icon} ${m.title} — ${fmtDate(m.dueDate)} [${m.status}]`));
    }
    lines.push(line());
  }

  // Events
  if (events.length) {
    lines.push(heading1("ЗАХОДИ / КОНФЕРЕНЦІЇ"));
    for (const e of events) {
      lines.push(line(`▸ ${e.title}`));
      lines.push(line(`  Тип: ${e.type} | Дата: ${fmtDate(e.startDate)}`));
      if (e.location) lines.push(line(`  Місце: ${e.location}`));
      lines.push(line());
    }
  }

  // Publications
  if (publications.length) {
    lines.push(heading1("ПУБЛІКАЦІЇ"));
    for (const p of publications) {
      lines.push(line(`▸ ${p.title}`));
      if (p.authors) lines.push(line(`  Автори: ${p.authors}`));
      lines.push(line(`  Тип: ${p.type} | Рік: ${p.expectedYear ?? "—"} | Статус: ${p.status}`));
      if (p.doi) lines.push(line(`  DOI: ${p.doi}`));
      lines.push(line());
    }
  }

  // Deliverables
  if (deliverables.length) {
    lines.push(heading1("РЕЗУЛЬТАТИ ПРОЄКТУ (DELIVERABLES)"));
    for (const d of deliverables) {
      lines.push(line(`▸ ${d.title} [${d.type}] — ${d.status}`));
      if (d.plannedDate) lines.push(line(`  Дедлайн: ${fmtDate(d.plannedDate)}`));
    }
    lines.push(line());
  }

  // Open Science
  if (openScience.length) {
    lines.push(heading1("ВІДКРИТА НАУКА"));
    for (const o of openScience) {
      lines.push(line(`▸ ${o.title} [${o.category}] — ${o.status}`));
      if (o.publishedAt) lines.push(line(`  Опубліковано: ${fmtDate(o.publishedAt)}`));
      if (o.summary) lines.push(line(`  ${o.summary}`));
    }
    lines.push(line());
  }

  // Budget
  lines.push(heading1("БЮДЖЕТ"));
  lines.push(line(`Заплановано:   ${fmtMoney(budget.totalPlanned, budget.currency)}`));
  lines.push(line(`Зафіксовано:   ${fmtMoney(budget.totalCommitted, budget.currency)}`));
  lines.push(line(`Витрачено:     ${fmtMoney(budget.totalSpent, budget.currency)}`));

  if (budget.byCategory.length) {
    lines.push(heading2("За категоріями"));
    for (const cat of budget.byCategory) {
      lines.push(line(`  ${cat.category}: план ${fmtMoney(cat.planned, budget.currency)}, витрачено ${fmtMoney(cat.spent, budget.currency)}`));
    }
  }

  if (budget.purchaseRequests.length) {
    lines.push(heading2("Запити на закупівлю"));
    for (const r of budget.purchaseRequests) {
      lines.push(line(`  ▸ ${r.title} [${r.category}] — ${r.status}`));
      lines.push(line(`    Кошторис: ${fmtMoney(r.estimatedAmount, budget.currency)}${r.actualAmount != null ? `, факт: ${fmtMoney(r.actualAmount, budget.currency)}` : ""}`));
    }
  }

  lines.push(line());
  lines.push(line("—".repeat(60)));
  lines.push(line(`Grant Project Manager · ${fmtDate(data.generatedAt)}`));

  return lines.join("");
}

export function downloadTxt(data: ReportExportData, filename: string): void {
  const text = buildTxt(data);
  const blob = new Blob([text], { type: "text/plain;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
