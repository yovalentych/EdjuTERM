"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const CHART_COLORS = {
  actual: "#0f766e",
  committed: "#2563eb",
  planned: "#e8ecf3",
  remaining: "#10b981",
  muted: "#edf1f7",
};

const CATEGORY_COLORS = [
  "#0f766e",
  "#2563eb",
  "#10b981",
  "#f59e0b",
  "#7c3aed",
  "#64748b",
];

const tooltipStyle = {
  borderRadius: "10px",
  border: "1px solid rgba(226, 232, 240, 0.9)",
  backgroundColor: "rgba(255, 255, 255, 0.96)",
  boxShadow: "0 18px 34px -18px rgba(15,23,42,0.35)",
  color: "#334155",
  fontSize: "12px",
};

function compactCurrency(value: number) {
  return new Intl.NumberFormat("uk-UA", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function currency(value: unknown) {
  return new Intl.NumberFormat("uk-UA", {
    style: "currency",
    currency: "UAH",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

export function FinanceStackedBars({
  data,
}: {
  data: { label: string; actual: number; committed: number }[];
}) {
  const hasValues = data.some((item) => item.actual > 0 || item.committed > 0);

  if (data.length === 0 || !hasValues) {
    return (
      <div className="grid h-64 place-items-center rounded-lg border border-dashed border-slate-300 bg-[linear-gradient(0deg,rgba(226,232,240,0.48)_1px,transparent_1px),linear-gradient(90deg,rgba(226,232,240,0.48)_1px,transparent_1px)] bg-[size:28px_28px]">
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-center shadow-sm">
          <p className="text-sm font-bold text-slate-800">Фінансовий рух ще не сформовано</p>
          <p className="mt-1 text-xs text-slate-500">Додайте позиції кошторису або заявки, щоб побачити план/факт.</p>
        </div>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 4, left: -18, bottom: 0 }} barGap={2}>
        <CartesianGrid stroke="#edf1f7" vertical={false} />
        <XAxis
          dataKey="label"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 10, fill: "#94a3b8" }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 10, fill: "#94a3b8" }}
          tickFormatter={compactCurrency}
        />
        <Tooltip
          cursor={{ fill: "rgba(226, 232, 240, 0.3)" }}
          contentStyle={tooltipStyle}
          formatter={(value, name) => [
            currency(value),
            name === "actual" ? "Факт" : "Зобов'язання",
          ]}
        />
        <Bar dataKey="committed" stackId="budget" fill={CHART_COLORS.committed} radius={[6, 6, 0, 0]} />
        <Bar dataKey="actual" stackId="budget" fill={CHART_COLORS.actual} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function FinanceDonut({
  data,
  total,
}: {
  data: { label: string; value: number }[];
  total: number;
}) {
  const chartData = data.filter((item) => item.value > 0).slice(0, 6);

  if (chartData.length === 0) {
    return (
      <div className="relative flex h-40 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-400">
        Немає категорій
      </div>
    );
  }

  return (
    <div className="relative h-44">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            innerRadius={50}
            outerRadius={76}
            paddingAngle={3}
            startAngle={90}
            endAngle={-270}
            stroke="#fff"
            strokeWidth={3}
          >
            {chartData.map((_, index) => (
              <Cell key={index} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value, _name, payload) => [
              currency(value),
              payload.payload?.label ?? "",
            ]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Used</span>
        <span className="font-mono text-xl font-bold text-slate-950">
          {total > 0 ? `${Math.round((chartData.reduce((sum, item) => sum + item.value, 0) / total) * 100)}%` : "0%"}
        </span>
      </div>
    </div>
  );
}
