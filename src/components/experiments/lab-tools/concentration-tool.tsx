"use client";

import { ArrowRight, Copy, FlaskConical, RefreshCw, Save } from "lucide-react";
import { useState } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

type ConcentrationUnit = "M" | "mM" | "µM" | "nM" | "pM";
type VolumeUnit = "L" | "mL" | "µL" | "nL";
type MassUnit = "g" | "mg" | "µg" | "ng";

const C_SCALE: Record<ConcentrationUnit, number> = { M: 1, mM: 1e-3, µM: 1e-6, nM: 1e-9, pM: 1e-12 };
const V_SCALE: Record<VolumeUnit, number>         = { L: 1, mL: 1e-3, µL: 1e-6, nL: 1e-9 };
const M_SCALE: Record<MassUnit, number>           = { g: 1, mg: 1e-3, µg: 1e-6, ng: 1e-9 };

function toSI(value: number, unit: ConcentrationUnit | VolumeUnit | MassUnit, scales: Record<string, number>): number {
  return value * (scales[unit] ?? 1);
}

function fromSI(si: number, unit: ConcentrationUnit | VolumeUnit | MassUnit, scales: Record<string, number>): number {
  return si / (scales[unit] ?? 1);
}

function formatNum(n: number): string {
  if (!isFinite(n) || isNaN(n)) return "—";
  if (n === 0) return "0";
  if (Math.abs(n) >= 1000 || (Math.abs(n) < 0.01 && n !== 0)) return n.toExponential(3);
  return parseFloat(n.toPrecision(4)).toString();
}

// ── Tab definitions ───────────────────────────────────────────────────────────

type Tab = "dilution" | "molar" | "stock";

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: "dilution", label: "Розведення", emoji: "🧪" },
  { id: "molar",    label: "Молярність", emoji: "⚗️" },
  { id: "stock",    label: "Стокові розчини", emoji: "📦" },
];

// ── Main component ────────────────────────────────────────────────────────────

export function ConcentrationTool({
  onSaveToExperiment,
}: {
  onSaveToExperiment?: (text: string) => void;
}) {
  const [tab, setTab] = useState<Tab>("dilution");

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
          <FlaskConical className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">Калькулятор концентрацій</p>
          <p className="text-[10px] text-slate-500">Розведення · Молярність · Стокові розчини</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition ${
              tab === t.id
                ? "bg-white text-emerald-700 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "dilution" && <DilutionCalc onSave={onSaveToExperiment} />}
      {tab === "molar"    && <MolarCalc onSave={onSaveToExperiment} />}
      {tab === "stock"    && <StockCalc onSave={onSaveToExperiment} />}
    </div>
  );
}

// ── Dilution calculator (C1V1 = C2V2) ────────────────────────────────────────

type DilutionField = "c1" | "v1" | "c2" | "v2";

function DilutionCalc({ onSave }: { onSave?: (t: string) => void }) {
  const [c1, setC1] = useState("100");  const [c1u, setC1u] = useState<ConcentrationUnit>("mM");
  const [v1, setV1] = useState("");     const [v1u, setV1u] = useState<VolumeUnit>("µL");
  const [c2, setC2] = useState("10");   const [c2u, setC2u] = useState<ConcentrationUnit>("mM");
  const [v2, setV2] = useState("500");  const [v2u, setV2u] = useState<VolumeUnit>("µL");
  const [solve, setSolve] = useState<DilutionField>("v1");

  function compute() {
    const vals: Record<DilutionField, number | null> = {
      c1: c1 ? parseFloat(c1) : null,
      v1: v1 ? parseFloat(v1) : null,
      c2: c2 ? parseFloat(c2) : null,
      v2: v2 ? parseFloat(v2) : null,
    };
    if (solve === "v1" && vals.c1 && vals.c2 && vals.v2) {
      const c1Si = toSI(vals.c1, c1u, C_SCALE);
      const c2Si = toSI(vals.c2, c2u, C_SCALE);
      const v2Si = toSI(vals.v2, v2u, V_SCALE);
      return { field: "v1", result: fromSI((c2Si * v2Si) / c1Si, v1u, V_SCALE), unit: v1u };
    }
    if (solve === "c1" && vals.v1 && vals.c2 && vals.v2) {
      const v1Si = toSI(vals.v1, v1u, V_SCALE);
      const c2Si = toSI(vals.c2, c2u, C_SCALE);
      const v2Si = toSI(vals.v2, v2u, V_SCALE);
      return { field: "c1", result: fromSI((c2Si * v2Si) / v1Si, c1u, C_SCALE), unit: c1u };
    }
    if (solve === "c2" && vals.c1 && vals.v1 && vals.v2) {
      const c1Si = toSI(vals.c1, c1u, C_SCALE);
      const v1Si = toSI(vals.v1, v1u, V_SCALE);
      const v2Si = toSI(vals.v2, v2u, V_SCALE);
      return { field: "c2", result: fromSI((c1Si * v1Si) / v2Si, c2u, C_SCALE), unit: c2u };
    }
    if (solve === "v2" && vals.c1 && vals.v1 && vals.c2) {
      const c1Si = toSI(vals.c1, c1u, C_SCALE);
      const v1Si = toSI(vals.v1, v1u, V_SCALE);
      const c2Si = toSI(vals.c2, c2u, C_SCALE);
      return { field: "v2", result: fromSI((c1Si * v1Si) / c2Si, v2u, V_SCALE), unit: v2u };
    }
    return null;
  }

  const res = compute();
  const df = (solve === "v1" ? v1u : solve === "v2" ? v2u : solve === "c1" ? c1u : c2u);
  const dilutionFactor = (() => {
    try {
      const c1Si = toSI(parseFloat(c1), c1u, C_SCALE);
      const c2Si = toSI(parseFloat(c2), c2u, C_SCALE);
      return c1Si > 0 ? c1Si / c2Si : null;
    } catch { return null; }
  })();

  const report = res ? [
    `=== Розрахунок розведення (C₁V₁ = C₂V₂) ===`,
    ``,
    `C₁ = ${solve === "c1" ? formatNum(res.result) : c1} ${c1u}`,
    `V₁ = ${solve === "v1" ? formatNum(res.result) : v1} ${v1u}  ← відбираємо стоку`,
    `C₂ = ${solve === "c2" ? formatNum(res.result) : c2} ${c2u}`,
    `V₂ = ${solve === "v2" ? formatNum(res.result) : v2} ${v2u}  ← кінцевий об'єм`,
    dilutionFactor ? `Коефіцієнт розведення: 1:${formatNum(dilutionFactor)}` : "",
  ].filter(Boolean).join("\n") : "";

  return (
    <div className="space-y-4">
      <p className="font-mono text-xs font-semibold text-emerald-700">C₁ · V₁ = C₂ · V₂</p>

      <div className="grid gap-3">
        <Row label="C₁ — початкова концентрація" field="c1" solve={solve} onSolveChange={setSolve}>
          <NumInput value={c1} onChange={setC1} disabled={solve === "c1"} placeholder="напр. 100" />
          <UnitSelect value={c1u} options={Object.keys(C_SCALE) as ConcentrationUnit[]} onChange={setC1u} />
        </Row>
        <Row label="V₁ — об'єм стоку (що відібрати)" field="v1" solve={solve} onSolveChange={setSolve}>
          <NumInput value={v1} onChange={setV1} disabled={solve === "v1"} placeholder={solve === "v1" ? "← розрахується" : ""} />
          <UnitSelect value={v1u} options={Object.keys(V_SCALE) as VolumeUnit[]} onChange={setV1u} />
        </Row>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <div className="flex-1 border-t border-dashed border-slate-200" />
          <ArrowRight className="h-3 w-3" />
          <div className="flex-1 border-t border-dashed border-slate-200" />
        </div>
        <Row label="C₂ — кінцева концентрація" field="c2" solve={solve} onSolveChange={setSolve}>
          <NumInput value={c2} onChange={setC2} disabled={solve === "c2"} placeholder="напр. 10" />
          <UnitSelect value={c2u} options={Object.keys(C_SCALE) as ConcentrationUnit[]} onChange={setC2u} />
        </Row>
        <Row label="V₂ — кінцевий об'єм" field="v2" solve={solve} onSolveChange={setSolve}>
          <NumInput value={v2} onChange={setV2} disabled={solve === "v2"} placeholder="напр. 500" />
          <UnitSelect value={v2u} options={Object.keys(V_SCALE) as VolumeUnit[]} onChange={setV2u} />
        </Row>
      </div>

      {res && (
        <ResultBox
          label={`Результат (${solve === "c1" ? "C₁" : solve === "v1" ? "V₁" : solve === "c2" ? "C₂" : "V₂"})`}
          value={`${formatNum(res.result)} ${res.unit}`}
          sub={dilutionFactor ? `Кратність розведення: 1:${formatNum(dilutionFactor)}` : undefined}
          report={report}
          onSave={onSave}
        />
      )}
    </div>
  );
}

// ── Molar concentration ───────────────────────────────────────────────────────

function MolarCalc({ onSave }: { onSave?: (t: string) => void }) {
  const [mass, setMass] = useState(""); const [massU, setMassU] = useState<MassUnit>("mg");
  const [mw, setMw] = useState("");     // g/mol
  const [vol, setVol] = useState("");   const [volU, setVolU] = useState<VolumeUnit>("mL");
  const [outU, setOutU] = useState<ConcentrationUnit>("mM");

  const massG  = mass ? toSI(parseFloat(mass), massU, M_SCALE) : null;
  const mwNum  = mw ? parseFloat(mw) : null;
  const volL   = vol ? toSI(parseFloat(vol), volU, V_SCALE) : null;

  const molarity = (massG && mwNum && volL && mwNum > 0 && volL > 0)
    ? fromSI(massG / mwNum / volL, outU, C_SCALE)
    : null;

  const report = molarity !== null ? [
    `=== Розрахунок молярності ===`,
    ``,
    `Маса:             ${mass} ${massU} (= ${formatNum(massG!)} г)`,
    `Молярна маса:     ${mw} г/моль`,
    `Об'єм розчину:    ${vol} ${volU}`,
    ``,
    `Молярна концентрація: ${formatNum(molarity)} ${outU}`,
  ].join("\n") : "";

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500">C = m / (M · V)</p>

      <LabeledRow label="Маса речовини">
        <NumInput value={mass} onChange={setMass} placeholder="напр. 5" />
        <UnitSelect value={massU} options={["g","mg","µg","ng"] as MassUnit[]} onChange={setMassU} />
      </LabeledRow>
      <LabeledRow label="Молярна маса (г/моль)">
        <NumInput value={mw} onChange={setMw} placeholder="напр. 342.3" />
        <span className="shrink-0 rounded border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-500">г/моль</span>
      </LabeledRow>
      <LabeledRow label="Об'єм розчину">
        <NumInput value={vol} onChange={setVol} placeholder="напр. 10" />
        <UnitSelect value={volU} options={["L","mL","µL","nL"] as VolumeUnit[]} onChange={setVolU} />
      </LabeledRow>
      <LabeledRow label="Одиниця результату">
        <UnitSelect value={outU} options={Object.keys(C_SCALE) as ConcentrationUnit[]} onChange={setOutU} fullWidth />
      </LabeledRow>

      {molarity !== null && (
        <ResultBox
          label="Молярна концентрація"
          value={`${formatNum(molarity)} ${outU}`}
          report={report}
          onSave={onSave}
        />
      )}
    </div>
  );
}

// ── Stock solution preparation ────────────────────────────────────────────────

function StockCalc({ onSave }: { onSave?: (t: string) => void }) {
  const [cStock, setCStock] = useState(""); const [cStockU, setCStockU] = useState<ConcentrationUnit>("mM");
  const [cFinal, setCFinal] = useState(""); const [cFinalU, setCFinalU] = useState<ConcentrationUnit>("µM");
  const [vFinal, setVFinal] = useState(""); const [vFinalU, setVFinalU] = useState<VolumeUnit>("mL");

  const cStockSI = cStock ? toSI(parseFloat(cStock), cStockU, C_SCALE) : null;
  const cFinalSI = cFinal ? toSI(parseFloat(cFinal), cFinalU, C_SCALE) : null;
  const vFinalSI = vFinal ? toSI(parseFloat(vFinal), vFinalU, V_SCALE) : null;

  const vStockSI  = (cStockSI && cFinalSI && vFinalSI && cStockSI > 0)
    ? (cFinalSI * vFinalSI) / cStockSI : null;
  const vDiluentSI = vStockSI !== null && vFinalSI !== null ? vFinalSI - vStockSI : null;

  const vStockDisp   = vStockSI   !== null ? fromSI(vStockSI,   vFinalU, V_SCALE) : null;
  const vDiluentDisp = vDiluentSI !== null ? fromSI(vDiluentSI, vFinalU, V_SCALE) : null;
  const dilFactor    = (cStockSI && cFinalSI && cFinalSI > 0) ? cStockSI / cFinalSI : null;

  const report = vStockDisp !== null ? [
    `=== Приготування робочого розчину із стоку ===`,
    ``,
    `Стоковий розчин:  ${cStock} ${cStockU}`,
    `Кінцева конц.:    ${cFinal} ${cFinalU}`,
    `Кінцевий об'єм:   ${vFinal} ${vFinalU}`,
    ``,
    `→ Відібрати стоку:      ${formatNum(vStockDisp!)} ${vFinalU}`,
    `→ Додати розчинника:    ${formatNum(vDiluentDisp!)} ${vFinalU}`,
    dilFactor ? `Кратність розведення: 1:${formatNum(dilFactor)}` : "",
  ].filter(Boolean).join("\n") : "";

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500">
        Відібрати V₁ зі стоку та довести до V₂ розчинником.
      </p>
      <LabeledRow label="Концентрація стоку (C₁)">
        <NumInput value={cStock} onChange={setCStock} placeholder="напр. 10" />
        <UnitSelect value={cStockU} options={Object.keys(C_SCALE) as ConcentrationUnit[]} onChange={setCStockU} />
      </LabeledRow>
      <LabeledRow label="Кінцева концентрація (C₂)">
        <NumInput value={cFinal} onChange={setCFinal} placeholder="напр. 100" />
        <UnitSelect value={cFinalU} options={Object.keys(C_SCALE) as ConcentrationUnit[]} onChange={setCFinalU} />
      </LabeledRow>
      <LabeledRow label="Кінцевий об'єм (V₂)">
        <NumInput value={vFinal} onChange={setVFinal} placeholder="напр. 1" />
        <UnitSelect value={vFinalU} options={Object.keys(V_SCALE) as VolumeUnit[]} onChange={setVFinalU} />
      </LabeledRow>

      {vStockDisp !== null && vDiluentDisp !== null && (
        <div className="space-y-2">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-emerald-600">Протокол приготування</p>
            <div className="space-y-2">
              <StepRow n={1} text={`Відібрати ${formatNum(vStockDisp)} ${vFinalU} стокового розчину (${cStock} ${cStockU})`} />
              <StepRow n={2} text={`Додати ${formatNum(vDiluentDisp)} ${vFinalU} розчинника (буфер/H₂O)`} />
              <StepRow n={3} text={`Перемішати. Кінцевий об'єм: ${vFinal} ${vFinalU}, концентрація: ${cFinal} ${cFinalU}`} />
            </div>
            {dilFactor && (
              <p className="mt-2 font-mono text-[10px] text-emerald-600">
                Кратність розведення: 1:{formatNum(dilFactor)}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(report).catch(() => {})}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              <Copy className="h-3 w-3" /> Копіювати
            </button>
            {onSave && (
              <button
                type="button"
                onClick={() => onSave(report)}
                className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
              >
                <Save className="h-3 w-3" /> Зберегти в журнал
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Shared sub-components ─────────────────────────────────────────────────────

function Row({ label, field, solve, onSolveChange, children }: {
  label: string; field: DilutionField; solve: DilutionField;
  onSolveChange: (f: DilutionField) => void; children: React.ReactNode;
}) {
  const active = solve === field;
  return (
    <div className={`rounded-lg border p-2.5 transition ${active ? "border-emerald-300 bg-emerald-50/50" : "border-slate-200"}`}>
      <div className="mb-1.5 flex items-center justify-between">
        <p className="text-[10px] font-semibold text-slate-600">{label}</p>
        <button
          type="button"
          onClick={() => onSolveChange(field)}
          className={`rounded-full border px-2 py-0.5 text-[9px] font-bold transition ${
            active ? "border-emerald-400 bg-emerald-600 text-white" : "border-slate-200 text-slate-400 hover:border-emerald-300 hover:text-emerald-600"
          }`}
        >
          {active ? "← знайти" : "знайти"}
        </button>
      </div>
      <div className="flex gap-2">{children}</div>
    </div>
  );
}

function LabeledRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-[10px] font-semibold text-slate-500">{label}</p>
      <div className="flex gap-2">{children}</div>
    </div>
  );
}

function NumInput({ value, onChange, disabled, placeholder }: {
  value: string; onChange: (v: string) => void; disabled?: boolean; placeholder?: string;
}) {
  return (
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      placeholder={placeholder ?? ""}
      className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-mono text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-1 focus:ring-emerald-200 disabled:bg-slate-50 disabled:text-slate-400"
    />
  );
}

function UnitSelect<T extends string>({ value, options, onChange, fullWidth }: {
  value: T; options: T[]; onChange: (v: T) => void; fullWidth?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className={`${fullWidth ? "flex-1" : "w-20 shrink-0"} rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-emerald-400`}
    >
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function ResultBox({ label, value, sub, report, onSave }: {
  label: string; value: string; sub?: string; report: string; onSave?: (t: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600">{label}</p>
      <p className="my-1 font-mono text-xl font-bold text-emerald-900">{value}</p>
      {sub && <p className="text-[10px] text-emerald-600">{sub}</p>}
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={() => { navigator.clipboard.writeText(report).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
          className="flex items-center gap-1 rounded-lg border border-emerald-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          <Copy className="h-3 w-3" />{copied ? "Скопійовано!" : "Копіювати"}
        </button>
        {onSave && (
          <button
            type="button"
            onClick={() => onSave(report)}
            className="flex items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 transition hover:bg-emerald-200"
          >
            <Save className="h-3 w-3" /> Зберегти в журнал
          </button>
        )}
      </div>
    </div>
  );
}

function StepRow({ n, text }: { n: number; text: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-200 text-[10px] font-bold text-emerald-800">{n}</span>
      <p className="text-xs text-emerald-900">{text}</p>
    </div>
  );
}
