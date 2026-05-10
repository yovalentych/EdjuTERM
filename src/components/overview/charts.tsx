"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// ── Color palette ─────────────────────────────────────────────────────────────

const BLUE    = "#206bc4";
const SKY     = "#4dabf7";
const EMERALD = "#2fb344";
const AMBER   = "#f59f00";
const ROSE    = "#d63939";
const VIOLET  = "#7048e8";
const SLATE   = "#94a3b8";
const ORANGE  = "#e8590c";

const CATEGORY_COLORS: Record<string, string> = {
  personnel:      BLUE,
  equipment:      VIOLET,
  reagents:       EMERALD,
  consumables:    SKY,
  travel:         AMBER,
  services:       ORANGE,
  subcontracting: ROSE,
  overhead:       SLATE,
  software:       "#0ca678",
  publications:   "#ae3ec9",
  other:          "#868e96",
};

const STATUS_TASK: Record<string, string> = {
  done:        EMERALD,
  in_progress: BLUE,
  review:      AMBER,
  todo:        SLATE,
  cancelled:   ROSE,
};

const STATUS_MILESTONE: Record<string, string> = {
  reached:  EMERALD,
  upcoming: BLUE,
  missed:   ROSE,
};

const STATUS_STAGE: Record<string, string> = {
  completed:   EMERALD,
  in_progress: BLUE,
  planned:     SLATE,
  paused:      AMBER,
};

const STATUS_PUB: Record<string, string> = {
  published:    EMERALD,
  in_review:    AMBER,
  in_progress:  BLUE,
  planned:      SLATE,
};

// ── Shared tooltip style ──────────────────────────────────────────────────────

const tooltipStyle = {
  borderRadius: "8px",
  border: "1px solid rgba(226, 232, 240, 0.8)",
  backgroundColor: "rgba(255, 255, 255, 0.95)",
  backdropFilter: "blur(12px)",
  boxShadow: "0 10px 25px -5px rgba(24,36,51,0.1), 0 8px 10px -6px rgba(24,36,51,0.05)",
  fontSize: "12px",
  fontFamily: "var(--font-sans), sans-serif",
  padding: "8px 12px",
  color: "#334155",
};

// ── Budget radial gauge ───────────────────────────────────────────────────────

export function BudgetGauge({ spent, total }: { spent: number; total: number }) {
  const pct = total > 0 ? Math.min(100, Math.round((spent / total) * 100)) : 0;
  const color = pct > 90 ? ROSE : pct > 70 ? AMBER : BLUE;
  const data = [{ value: pct, fill: color }, { value: 100 - pct, fill: "#f1f5f9" }];
  return (
    <div className="relative flex items-center justify-center">
      <ResponsiveContainer width={96} height={96}>
        <PieChart>
          <Pie data={data} innerRadius={32} outerRadius={44} startAngle={90} endAngle={-270} dataKey="value" strokeWidth={0}>
            {data.map((_, i) => <Cell key={i} fill={data[i].fill} />)}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <span className="absolute text-xl font-bold text-slate-900">{pct}%</span>
    </div>
  );
}

// ── Task status donut ─────────────────────────────────────────────────────────

export function TaskDonut({ data }: { data: { status: string; count: number; label: string }[] }) {
  const filtered = data.filter((d) => d.count > 0);
  if (filtered.length === 0) return <div className="flex h-24 items-center justify-center text-xs text-slate-400">Завдань ще немає</div>;
  const total = filtered.reduce((s, d) => s + d.count, 0);
  return (
    <div className="relative flex items-center justify-center">
      <ResponsiveContainer width={96} height={96}>
        <PieChart>
          <Pie data={filtered} innerRadius={28} outerRadius={44} dataKey="count" startAngle={90} endAngle={-270} strokeWidth={2} stroke="#fff">
            {filtered.map((d) => <Cell key={d.status} fill={STATUS_TASK[d.status] ?? SLATE} />)}
          </Pie>
          <Tooltip
            contentStyle={tooltipStyle}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(v: any, _: unknown, p: any) => [`${v} (${Math.round(((v as number)/total)*100)}%)`, p?.payload?.label ?? ""]}
            labelFormatter={() => ""}
          />
        </PieChart>
      </ResponsiveContainer>
      <span className="absolute text-base font-bold text-slate-900">{total}</span>
    </div>
  );
}

// ── Monthly hours area chart ──────────────────────────────────────────────────

export function HoursAreaChart({ data }: { data: { month: string; hours: number }[] }) {
  if (data.length === 0) return <div className="flex h-24 items-center justify-center text-xs text-slate-400">Немає записів часу</div>;
  return (
    <ResponsiveContainer width="100%" height={80}>
      <AreaChart data={data} margin={{ top: 4, right: 0, left: -28, bottom: 0 }}>
        <defs>
          <linearGradient id="hoursGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={BLUE} stopOpacity={0.25} />
            <stop offset="95%" stopColor={BLUE} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v: unknown) => [`${v} год`, "Час"]} />
        <Area type="monotone" dataKey="hours" stroke={BLUE} strokeWidth={2} fill="url(#hoursGrad)" dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ── Budget by category bar chart ──────────────────────────────────────────────

export function BudgetCategoryChart({ data }: { data: { category: string; label: string; allocated: number; spent: number }[] }) {
  if (data.length === 0) return <div className="flex h-32 items-center justify-center text-xs text-slate-400">Рядки бюджету ще не додані</div>;
  const fmt = (v: number) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : String(v);
  return (
    <ResponsiveContainer width="100%" height={Math.max(140, data.length * 36)}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 8, left: 4, bottom: 20 }} barCategoryGap="25%">
        <XAxis type="number" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={fmt} />
        <YAxis type="category" dataKey="label" tick={{ fontSize: 11, fill: "#64748b", fontWeight: 500 }} axisLine={false} tickLine={false} width={96} />
        <Tooltip cursor={{ fill: "rgba(241, 245, 249, 0.5)" }} contentStyle={tooltipStyle} formatter={(v: unknown, name: unknown) => [`${Number(v).toLocaleString()} ₴`, name === "allocated" ? "Заплановано" : "Витрачено"]} />
        <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px", color: "#64748b" }} iconType="circle" iconSize={8} />
        <Bar name="Заплановано" dataKey="allocated" fill="#e2e8f0" radius={[0, 4, 4, 0]} />
        <Bar name="Витрачено" dataKey="spent" radius={[0, 4, 4, 0]}>
          {data.map((d) => <Cell key={d.category} fill={CATEGORY_COLORS[d.category] ?? SLATE} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Research stage progress radial bars ───────────────────────────────────────

export function StageRadialChart({ data }: { data: { name: string; progress: number; status: string }[] }) {
  if (data.length === 0) return <div className="flex h-32 items-center justify-center text-xs text-slate-400">Етапів ще немає</div>;
  const chartData = data.map((s) => ({ ...s, fill: STATUS_STAGE[s.status] ?? SLATE }));
  return (
    <ResponsiveContainer width="100%" height={Math.max(80, data.length * 22)}>
      <RadialBarChart innerRadius={16} outerRadius={72} data={chartData} startAngle={90} endAngle={-270} barSize={10} cx="50%">
        <RadialBar dataKey="progress" cornerRadius={4} background={{ fill: "#f1f5f9" }}>
          {chartData.map((d, i) => <Cell key={i} fill={d.fill} />)}
        </RadialBar>
        <Tooltip contentStyle={tooltipStyle} formatter={(v: unknown) => [`${v}%`, "Прогрес"]} />
      </RadialBarChart>
    </ResponsiveContainer>
  );
}

// ── Records by kind mini bar ───────────────────────────────────────────────────

export function RecordsBarChart({ data }: { data: { kind: string; label: string; count: number }[] }) {
  if (data.length === 0) return <div className="flex h-16 items-center justify-center text-xs text-slate-400">Записів ще немає</div>;
  const colors = [BLUE, VIOLET, EMERALD, AMBER, ORANGE, ROSE];
  return (
    <ResponsiveContainer width="100%" height={64}>
      <BarChart data={data} margin={{ top: 2, right: 4, left: -28, bottom: 2 }}>
        <XAxis dataKey="label" tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v: unknown) => [String(v), "Записів"]} />
        <Bar dataKey="count" radius={[3, 3, 0, 0]}>
          {data.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Publication status mini donut ──────────────────────────────────────────────

export function PublicationsDonut({ data }: { data: { status: string; count: number; label: string }[] }) {
  const filtered = data.filter((d) => d.count > 0);
  if (filtered.length === 0) return <div className="flex h-16 items-center justify-center text-xs text-slate-400">Публікацій ще немає</div>;
  return (
    <ResponsiveContainer width="100%" height={64}>
      <PieChart>
        <Pie data={filtered} innerRadius={18} outerRadius={28} dataKey="count" startAngle={90} endAngle={-270} strokeWidth={2} stroke="#fff" cx="50%">
          {filtered.map((d) => <Cell key={d.status} fill={STATUS_PUB[d.status] ?? SLATE} />)}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} formatter={(v: unknown, _: unknown, p: unknown) => [String(v), (p as { payload?: { label?: string } })?.payload?.label ?? ""]} labelFormatter={() => ""} />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ── Milestone status bar ───────────────────────────────────────────────────────

export function MilestoneStatusBar({ reached, upcoming, missed }: { reached: number; upcoming: number; missed: number }) {
  const total = reached + upcoming + missed;
  if (total === 0) return <div className="h-3 w-full rounded-full bg-slate-100" />;
  return (
    <div className="flex h-3 w-full overflow-hidden rounded-full">
      {reached > 0 && <div style={{ width: `${(reached/total)*100}%` }} className="bg-emerald-500" title={`Досягнуто: ${reached}`} />}
      {upcoming > 0 && <div style={{ width: `${(upcoming/total)*100}%` }} className="bg-blue-500" title={`Заплановано: ${upcoming}`} />}
      {missed > 0 && <div style={{ width: `${(missed/total)*100}%` }} className="bg-rose-500" title={`Пропущено: ${missed}`} />}
    </div>
  );
}

// ── Activity heatmap (SVG) ────────────────────────────────────────────────────

export function ActivityHeatmap({
  data,
}: {
  data: { date: string; value: number }[];
}) {
  const weeks = 26; // ~6 months
  const daysPerWeek = 7;
  const cellSize = 10;
  const gap = 2;

  // Map data to a fast lookup
  const dataMap = new Map(data.map((d) => [d.date, d.value]));

  // Generate grid for the last 26 weeks
  const grid = [];
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(now.getDate() - weeks * 7 + (7 - now.getDay()));

  for (let w = 0; w < weeks; w++) {
    const week = [];
    for (let d = 0; d < daysPerWeek; d++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + w * 7 + d);
      const dateStr = date.toISOString().split("T")[0];
      const val = dataMap.get(dateStr) ?? 0;
      week.push({ date: dateStr, val });
    }
    grid.push(week);
  }

  const getColor = (val: number) => {
    if (val === 0) return "rgba(148, 163, 184, 0.1)";
    if (val < 3) return "rgba(32, 107, 196, 0.25)";
    if (val < 6) return "rgba(32, 107, 196, 0.5)";
    if (val < 10) return "rgba(32, 107, 196, 0.75)";
    return "rgba(32, 107, 196, 1)";
  };

  return (
    <div className="overflow-x-auto shell-scrollbar pb-2">
      <svg
        width={weeks * (cellSize + gap)}
        height={daysPerWeek * (cellSize + gap)}
        className="min-w-full"
      >
        {grid.map((week, wi) =>
          week.map((day, di) => (
            <rect
              key={day.date}
              x={wi * (cellSize + gap)}
              y={di * (cellSize + gap)}
              width={cellSize}
              height={cellSize}
              fill={getColor(day.val)}
              rx={1.5}
            >
              <title>{`${day.date}: ${day.val} активностей`}</title>
            </rect>
          )),
        )}
      </svg>
    </div>
  );
}

// ── Re-export status colors for server component ──────────────────────────────
export { STATUS_TASK, STATUS_MILESTONE, STATUS_STAGE, STATUS_PUB };
