"use client";

import { useMemo } from "react";
import type { PhdPlan, PhdWorkStatus } from "@/lib/schemas";

// ── Layout constants ──────────────────────────────────────────────────────────

const UK_MONTHS = ["Січ", "Лют", "Бер", "Кві", "Тра", "Чер", "Лип", "Сер", "Вер", "Жов", "Лис", "Гру"];
const MONTH_W = 56;  // px per month
const ROW_H = 32;
const GROUP_H = 24;
const HEADER_H = 48;
const LABEL_W = 240;
const BAR_H = 18;

// ── Colors ────────────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<PhdWorkStatus, string> = {
  pending: "#94a3b8",
  completed: "#10b981",
  not_completed: "#ef4444",
  partial: "#f59e0b",
};

// ── Types ─────────────────────────────────────────────────────────────────────

type Bar = {
  id: string;
  label: string;
  badge?: string;
  from: Date;
  to: Date;
  color: string;
  estimated?: boolean;
};

type Group = {
  id: string;
  title: string;
  bgColor: string;
  titleColor: string;
  bars: Bar[];
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function parsePeriod(s: string): [Date, Date] | null {
  if (!s) return null;
  const parts = s.trim().split(/\s*—\s*/);
  const p = (str: string) => { const d = new Date(str ?? ""); return isNaN(d.getTime()) ? null : d; };
  if (parts.length >= 2) {
    const a = p(parts[0] ?? ""), b = p(parts[1] ?? "");
    if (a && b) return a <= b ? [a, b] : [b, a];
    if (a) return [a, new Date(a.getTime() + 30 * 86_400_000)];
  }
  const d = p(parts[0] ?? "");
  return d ? [d, new Date(d.getTime() + 14 * 86_400_000)] : null;
}

function studyYearRange(enrollDate: Date | null, year: number): [Date, Date] {
  // Default: September-based academic year
  const refYear = enrollDate
    ? enrollDate.getFullYear()
    : new Date().getFullYear() - year + 1;
  const refMonth = enrollDate ? enrollDate.getMonth() : 8; // 8 = September
  const from = new Date(refYear + year - 1, refMonth, 1);
  // End = same month next year, last day before anniversary
  const to = new Date(refYear + year, refMonth - 1, 28);
  return [from, to];
}

// ── Main component ─────────────────────────────────────────────────────────────

export function PhdGanttChart({ plan }: { plan: PhdPlan | null }) {
  const { groups, startDate, totalMonths } = useMemo(() => {
    if (!plan) return { groups: [], startDate: new Date(), totalMonths: 0 };

    const enrollDate =
      plan.enrollmentDate && /^\d{4}-\d{2}-\d{2}$/.test(plan.enrollmentDate)
        ? new Date(plan.enrollmentDate)
        : null;

    const groups: Group[] = [];
    const allDates: Date[] = [];

    // ── Educational courses ────────────────────────────────────────────────
    for (const yp of [...plan.yearlyPlans].sort((a, b) => a.year - b.year)) {
      const fallback = studyYearRange(enrollDate, yp.year);

      // Обов'язкові (ОК)
      const okBars: Bar[] = yp.educationalCourses
        .filter((c) => c.subgroup === "mandatory")
        .map((c) => {
          const r = parsePeriod(c.period ?? "") ?? fallback;
          allDates.push(r[0], r[1]);
          return { id: c.ycid, label: c.title, badge: "ОК", from: r[0], to: r[1], color: "#3b82f6", estimated: !c.period };
        });
      if (okBars.length > 0)
        groups.push({ id: `ok${yp.year}`, title: `${yp.year}-й рік · ОК`, bgColor: "#eff6ff", titleColor: "#1d4ed8", bars: okBars });

      // Вибіркові (ВК)
      const vkBars: Bar[] = yp.educationalCourses
        .filter((c) => c.subgroup === "elective")
        .map((c) => {
          const r = parsePeriod(c.period ?? "") ?? fallback;
          allDates.push(r[0], r[1]);
          return { id: c.ycid, label: c.title, badge: "ВК", from: r[0], to: r[1], color: "#7c3aed", estimated: !c.period };
        });
      if (vkBars.length > 0)
        groups.push({ id: `vk${yp.year}`, title: `${yp.year}-й рік · ВК`, bgColor: "#f5f3ff", titleColor: "#5b21b6", bars: vkBars });

      // Наукова робота
      const sciBars: Bar[] = yp.scientificWorkItems.map((item) => {
        const r = parsePeriod(item.period ?? "") ?? fallback;
        allDates.push(r[0], r[1]);
        return { id: item.wsid, label: item.title, from: r[0], to: r[1], color: STATUS_COLOR[item.status], estimated: !item.period };
      });
      if (sciBars.length > 0)
        groups.push({ id: `sci${yp.year}`, title: `${yp.year}-й рік · Наукова робота`, bgColor: "#f0fdf4", titleColor: "#166534", bars: sciBars });
    }

    // ── Milestones ─────────────────────────────────────────────────────────
    const msBars: Bar[] = plan.milestones
      .map((m) => {
        const r = parsePeriod(m.period ?? "");
        if (!r) return null;
        allDates.push(r[0], r[1]);
        return { id: m.mid, label: m.title, from: r[0], to: r[1], color: "#0ea5e9" };
      })
      .filter(Boolean) as Bar[];
    if (msBars.length > 0)
      groups.push({ id: "ms", title: "Вежові точки", bgColor: "#e0f2fe", titleColor: "#075985", bars: msBars });

    if (allDates.length === 0) return { groups: [], startDate: new Date(), totalMonths: 0 };

    const minTs = Math.min(...allDates.map((d) => d.getTime()));
    const maxTs = Math.max(...allDates.map((d) => d.getTime()));
    const minD = new Date(minTs);
    const maxD = new Date(maxTs);
    const startDate = new Date(minD.getFullYear(), minD.getMonth() - 1, 1);
    const endDate = new Date(maxD.getFullYear(), maxD.getMonth() + 2, 1);
    const totalMonths =
      (endDate.getFullYear() - startDate.getFullYear()) * 12 +
      (endDate.getMonth() - startDate.getMonth());

    return { groups, startDate, totalMonths };
  }, [plan]);

  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="text-slate-300">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18M7 14h2M11 14h2M15 14h2M7 18h2M11 18h2" />
        </svg>
        <p className="text-sm font-medium text-slate-500">Діаграма Ганта згенерується автоматично</p>
        <p className="max-w-xs text-xs text-slate-400">
          Додайте курси та наукові роботи з термінами виконання у річних планах.
        </p>
      </div>
    );
  }

  const totalWidth = totalMonths * MONTH_W;

  function xOf(d: Date): number {
    const ms = (d.getFullYear() - startDate.getFullYear()) * 12 + (d.getMonth() - startDate.getMonth());
    return ms * MONTH_W + (d.getDate() / 30) * MONTH_W;
  }

  const months = Array.from({ length: totalMonths }, (_, i) => {
    const d = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
    return { i, month: d.getMonth(), year: d.getFullYear(), label: UK_MONTHS[d.getMonth()] ?? "" };
  });

  const today = new Date();
  const todayX = xOf(today);
  const showToday = todayX >= 0 && todayX <= totalWidth;

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div
        className="flex border-b border-slate-200 bg-slate-50"
        style={{ height: HEADER_H, minWidth: LABEL_W + totalWidth }}
      >
        {/* Corner */}
        <div
          className="sticky left-0 z-20 shrink-0 border-r border-slate-200 bg-slate-50"
          style={{ width: LABEL_W }}
        />
        {/* Month axis */}
        <div className="relative overflow-hidden" style={{ width: totalWidth }}>
          {/* Year markers */}
          {months
            .filter((m) => m.month === 0 || m.i === 0)
            .map((m) => (
              <div
                key={`yr-${m.i}`}
                className="absolute top-1.5 text-[10px] font-bold text-slate-700"
                style={{ left: m.i * MONTH_W + 4 }}
              >
                {m.year}
              </div>
            ))}
          {/* Month labels */}
          {months.map((m) => (
            <div
              key={`mo-${m.i}`}
              className="absolute bottom-1.5 text-[10px] text-slate-400"
              style={{ left: m.i * MONTH_W, width: MONTH_W, textAlign: "center" }}
            >
              {m.label}
            </div>
          ))}
          {/* Grid lines in header */}
          {months.map((m) => (
            <div
              key={`gl-${m.i}`}
              className="absolute bottom-0 top-0 border-l border-slate-200"
              style={{ left: m.i * MONTH_W }}
            />
          ))}
          {/* Today in header */}
          {showToday && (
            <div
              className="pointer-events-none absolute bottom-0 top-0 w-px bg-red-400"
              style={{ left: todayX, opacity: 0.6 }}
            />
          )}
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <div style={{ minWidth: LABEL_W + totalWidth }}>
        {groups.map((group) => (
          <div key={group.id}>
            {/* Group header */}
            <div
              className="flex border-b border-slate-100"
              style={{ height: GROUP_H, background: group.bgColor }}
            >
              <div
                className="sticky left-0 z-10 flex items-center gap-1.5 px-2.5 text-[10px] font-bold uppercase tracking-wide"
                style={{
                  width: LABEL_W,
                  background: group.bgColor,
                  borderRight: "1px solid #e2e8f0",
                  color: group.titleColor,
                }}
              >
                {group.title}
              </div>
              <div className="relative flex-1">
                {months.map((m) => (
                  <div
                    key={m.i}
                    className="absolute top-0 bottom-0 border-l border-slate-100"
                    style={{ left: m.i * MONTH_W }}
                  />
                ))}
                {showToday && (
                  <div
                    className="pointer-events-none absolute top-0 bottom-0 w-px"
                    style={{ left: todayX, background: "#ef4444", opacity: 0.25 }}
                  />
                )}
              </div>
            </div>

            {/* Bar rows */}
            {group.bars.map((bar, bi) => {
              const x1 = xOf(bar.from);
              const x2 = xOf(bar.to);
              const barW = Math.max(x2 - x1, 8);
              const rowBg = bi % 2 === 0 ? "#fff" : "#fafafa";
              const tooltip = `${bar.label}\n${bar.from.toLocaleDateString("uk-UA")} — ${bar.to.toLocaleDateString("uk-UA")}${bar.estimated ? "\n(орієнтовно)" : ""}`;

              return (
                <div
                  key={bar.id}
                  className="flex border-b border-slate-50"
                  style={{ height: ROW_H, background: rowBg }}
                >
                  {/* Label */}
                  <div
                    className="sticky left-0 z-10 flex items-center gap-1.5 px-2.5"
                    style={{ width: LABEL_W, background: rowBg, borderRight: "1px solid #f1f5f9" }}
                  >
                    {bar.badge && (
                      <span
                        className="shrink-0 rounded px-1 text-[8px] font-bold leading-none text-white"
                        style={{ background: bar.color, padding: "2px 4px" }}
                      >
                        {bar.badge}
                      </span>
                    )}
                    <span
                      className="truncate text-[11px] text-slate-700"
                      title={bar.label}
                    >
                      {bar.label}
                    </span>
                  </div>

                  {/* Bar area */}
                  <div className="relative flex-1">
                    {/* Grid lines */}
                    {months.map((m) => (
                      <div
                        key={m.i}
                        className="absolute top-0 bottom-0 border-l"
                        style={{
                          left: m.i * MONTH_W,
                          borderColor: m.month === 0 ? "#e2e8f0" : "#f1f5f9",
                        }}
                      />
                    ))}

                    {/* Gantt bar */}
                    <div
                      className="absolute rounded-sm"
                      style={{
                        left: x1,
                        width: barW,
                        top: (ROW_H - BAR_H) / 2,
                        height: BAR_H,
                        background: bar.color,
                        opacity: bar.estimated ? 0.45 : 0.82,
                        boxShadow: bar.estimated ? "none" : "0 1px 3px rgba(0,0,0,0.18)",
                        borderLeft: bar.estimated ? `2px dashed ${bar.color}` : "none",
                      }}
                      title={tooltip}
                    />

                    {/* Today line */}
                    {showToday && (
                      <div
                        className="pointer-events-none absolute top-0 bottom-0 w-px"
                        style={{ left: todayX, background: "#ef4444", opacity: 0.35 }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* ── Legend ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-slate-100 bg-slate-50 px-4 py-2.5">
        {[
          { color: "#3b82f6", label: "ОК" },
          { color: "#7c3aed", label: "ВК" },
          { color: "#10b981", label: "Виконано" },
          { color: "#f59e0b", label: "Частково" },
          { color: "#ef4444", label: "Не виконано" },
          { color: "#94a3b8", label: "Очікується" },
          { color: "#0ea5e9", label: "Вежові точки" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="h-2 w-5 rounded-sm" style={{ background: color, opacity: 0.82 }} />
            <span className="text-[11px] text-slate-500">{label}</span>
          </div>
        ))}
        <div className="ml-auto flex items-center gap-1.5">
          <div className="h-2 w-5 rounded-sm bg-slate-400 opacity-40" />
          <span className="text-[11px] text-slate-400">Орієнт. дата</span>
        </div>
        {showToday && (
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-px bg-red-400 opacity-60" />
            <span className="text-[11px] text-slate-400">Сьогодні</span>
          </div>
        )}
      </div>
    </div>
  );
}
