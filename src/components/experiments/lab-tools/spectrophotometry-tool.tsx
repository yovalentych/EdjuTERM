"use client";

import { Copy, Save, Sigma, Waves } from "lucide-react";
import { useMemo, useState } from "react";

type SpectroscopyMode = "uv" | "visible" | "fluorescence" | "cd" | "od";

const MODES: Array<{ id: SpectroscopyMode; label: string; hint: string; defaultWavelength: string }> = [
  { id: "uv", label: "UV absorbance", hint: "A260/A280, білки, нуклеїнові кислоти", defaultWavelength: "260" },
  { id: "visible", label: "Visible", hint: "колориметрія, Bradford, BCA, ELISA", defaultWavelength: "595" },
  { id: "fluorescence", label: "Fluorescence", hint: "збудження/емісія, RFU, ratiometric", defaultWavelength: "485" },
  { id: "cd", label: "Circular dichroism", hint: "CD, mdeg, ellipticity", defaultWavelength: "222" },
  { id: "od", label: "OD / turbidity", hint: "OD600, ріст бактерій/дріжджів", defaultWavelength: "600" },
];

function fmt(n: number, digits = 4): string {
  if (!Number.isFinite(n)) return "-";
  if (n === 0) return "0";
  if (Math.abs(n) >= 10000 || Math.abs(n) < 0.001) return n.toExponential(digits - 1);
  return Number(n.toPrecision(digits)).toString();
}

function parseNumber(v: string): number {
  return Number(v.replace(",", "."));
}

function linearRegression(points: Array<{ x: number; y: number }>) {
  const n = points.length;
  if (n < 2) return null;
  const sx = points.reduce((sum, p) => sum + p.x, 0);
  const sy = points.reduce((sum, p) => sum + p.y, 0);
  const sxx = points.reduce((sum, p) => sum + p.x * p.x, 0);
  const sxy = points.reduce((sum, p) => sum + p.x * p.y, 0);
  const denom = n * sxx - sx * sx;
  if (denom === 0) return null;
  const slope = (n * sxy - sx * sy) / denom;
  const intercept = (sy - slope * sx) / n;
  const meanY = sy / n;
  const ssTot = points.reduce((sum, p) => sum + (p.y - meanY) ** 2, 0);
  const ssRes = points.reduce((sum, p) => sum + (p.y - (slope * p.x + intercept)) ** 2, 0);
  const r2 = ssTot === 0 ? 1 : 1 - ssRes / ssTot;
  return { slope, intercept, r2 };
}

function parseCurve(raw: string): Array<{ x: number; y: number }> {
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [xRaw = "", yRaw = ""] = line.split(/[|,;\t ]+/).filter(Boolean);
      return { x: parseNumber(xRaw), y: parseNumber(yRaw) };
    })
    .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y));
}

function classifyWavelength(nm: number): string {
  if (!Number.isFinite(nm)) return "";
  if (nm < 200) return "vacuum UV";
  if (nm < 400) return "UV";
  if (nm <= 700) return "visible";
  return "near IR";
}

export function SpectrophotometryTool({
  onSaveToExperiment,
}: {
  onSaveToExperiment?: (text: string) => void;
}) {
  const [mode, setMode] = useState<SpectroscopyMode>("uv");
  const currentMode = MODES.find((item) => item.id === mode) ?? MODES[0];
  const [wavelength, setWavelength] = useState(currentMode.defaultWavelength);
  const [emissionWavelength, setEmissionWavelength] = useState("520");
  const [signal, setSignal] = useState("0.25");
  const [blank, setBlank] = useState("0");
  const [dilution, setDilution] = useState("1");
  const [pathLength, setPathLength] = useState("1");
  const [extinction, setExtinction] = useState("50000");
  const [curveText, setCurveText] = useState("0 | 0.000\n1 | 0.120\n2 | 0.245\n4 | 0.492");
  const [odFactor, setOdFactor] = useState("8e8");
  const [copied, setCopied] = useState(false);

  const correctedSignal = parseNumber(signal) - parseNumber(blank);
  const dilutionFactor = parseNumber(dilution) || 1;
  const path = parseNumber(pathLength) || 1;
  const epsilon = parseNumber(extinction);
  const wavelengthNm = parseNumber(wavelength);
  const emissionNm = parseNumber(emissionWavelength);
  const curvePoints = useMemo(() => parseCurve(curveText), [curveText]);
  const regression = useMemo(() => linearRegression(curvePoints), [curvePoints]);

  const beerConcentrationM = epsilon > 0 && path > 0 ? (correctedSignal / (epsilon * path)) * dilutionFactor : NaN;
  const standardCurveX = regression && regression.slope !== 0
    ? ((correctedSignal - regression.intercept) / regression.slope) * dilutionFactor
    : NaN;
  const odCells = correctedSignal * (parseNumber(odFactor) || 0) * dilutionFactor;
  const cdMeanResidueEllipticity = path > 0 ? (correctedSignal * 100) / path : NaN;

  const report = [
    `🌈 Спектрофотометрія: ${currentMode.label}`,
    `Довжина хвилі: ${fmt(wavelengthNm)} nm (${classifyWavelength(wavelengthNm)})`,
    mode === "fluorescence" ? `Емісія: ${fmt(emissionNm)} nm (${classifyWavelength(emissionNm)})` : "",
    `Сигнал: ${signal}; бланк: ${blank}; скориговано: ${fmt(correctedSignal)}`,
    `Розведення: ${fmt(dilutionFactor)}x; оптичний шлях: ${fmt(path)} cm`,
    mode === "od" ? `Оцінка клітинності: ${fmt(odCells)} cells/mL` : "",
    mode === "cd" ? `Нормалізований CD показник: ${fmt(cdMeanResidueEllipticity)} умовн. од.` : "",
    mode !== "fluorescence" && mode !== "od" && mode !== "cd" ? `Beer-Lambert: ${fmt(beerConcentrationM)} M` : "",
    regression ? `Стандартна крива: y = ${fmt(regression.slope)}x + ${fmt(regression.intercept)}, R² = ${fmt(regression.r2)}` : "",
    regression ? `Концентрація за кривою: ${fmt(standardCurveX)} у введених одиницях стандарту` : "",
  ].filter(Boolean).join("\n");

  function selectMode(nextMode: SpectroscopyMode) {
    setMode(nextMode);
    setWavelength(MODES.find((item) => item.id === nextMode)?.defaultWavelength ?? wavelength);
  }

  async function copyReport() {
    await navigator.clipboard?.writeText(report);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div className="flex flex-col gap-5 p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-white shadow-sm">
          <Waves className="h-5 w-5" />
        </div>
        <div>
          <p className="font-semibold text-slate-900">Спектрофотометрія</p>
          <p className="text-[11px] text-slate-500">UV · visible · fluorescence · circular dichroism · OD</p>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-5">
        {MODES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => selectMode(item.id)}
            className={`rounded-lg border px-3 py-2 text-left transition ${
              mode === item.id ? "border-violet-300 bg-violet-50 text-violet-800" : "border-slate-200 bg-white text-slate-600 hover:border-violet-200"
            }`}
          >
            <p className="text-xs font-bold">{item.label}</p>
            <p className="mt-1 text-[10px] leading-4 text-slate-500">{item.hint}</p>
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-2 gap-3">
            <label>
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">λ, nm</span>
              <input type="number" step="any" className="input-control w-full font-mono text-sm" value={wavelength} onChange={(e) => setWavelength(e.target.value)} />
            </label>
            {mode === "fluorescence" && (
              <label>
                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">Emission, nm</span>
                <input type="number" step="any" className="input-control w-full font-mono text-sm" value={emissionWavelength} onChange={(e) => setEmissionWavelength(e.target.value)} />
              </label>
            )}
            <label>
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">Сигнал</span>
              <input type="number" step="any" className="input-control w-full font-mono text-sm" value={signal} onChange={(e) => setSignal(e.target.value)} />
            </label>
            <label>
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">Бланк</span>
              <input type="number" step="any" className="input-control w-full font-mono text-sm" value={blank} onChange={(e) => setBlank(e.target.value)} />
            </label>
            <label>
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">Розведення</span>
              <input type="number" step="any" min={0} className="input-control w-full font-mono text-sm" value={dilution} onChange={(e) => setDilution(e.target.value)} />
            </label>
            <label>
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">Шлях, cm</span>
              <input type="number" step="any" min={0} className="input-control w-full font-mono text-sm" value={pathLength} onChange={(e) => setPathLength(e.target.value)} />
            </label>
          </div>

          {mode !== "fluorescence" && mode !== "od" && mode !== "cd" && (
            <label className="block">
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">Extinction coefficient</span>
              <input type="number" step="any" min={0} className="input-control w-full font-mono text-sm" value={extinction} onChange={(e) => setExtinction(e.target.value)} />
            </label>
          )}

          {mode === "od" && (
            <label className="block">
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">OD conversion factor, cells/mL per OD</span>
              <input type="number" step="any" min={0} className="input-control w-full font-mono text-sm" value={odFactor} onChange={(e) => setOdFactor(e.target.value)} />
            </label>
          )}

          <label className="block">
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">Стандартна крива: concentration | signal</span>
            <textarea className="input-control w-full resize-y font-mono text-xs" rows={5} value={curveText} onChange={(e) => setCurveText(e.target.value)} />
          </label>
        </div>

        <div className="space-y-4 rounded-xl border border-violet-100 bg-violet-50/40 p-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-white p-3 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Скоригований сигнал</p>
              <p className="mt-1 font-mono text-lg font-bold text-violet-700">{fmt(correctedSignal)}</p>
            </div>
            <div className="rounded-lg bg-white p-3 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Діапазон</p>
              <p className="mt-1 text-lg font-bold text-violet-700">{classifyWavelength(wavelengthNm) || "-"}</p>
            </div>
            {mode !== "fluorescence" && mode !== "od" && mode !== "cd" && (
              <div className="rounded-lg bg-white p-3 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Beer-Lambert</p>
                <p className="mt-1 font-mono text-lg font-bold text-violet-700">{fmt(beerConcentrationM)} M</p>
              </div>
            )}
            {mode === "od" && (
              <div className="rounded-lg bg-white p-3 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Клітинність</p>
                <p className="mt-1 font-mono text-lg font-bold text-violet-700">{fmt(odCells)} cells/mL</p>
              </div>
            )}
            {mode === "cd" && (
              <div className="rounded-lg bg-white p-3 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">CD нормалізація</p>
                <p className="mt-1 font-mono text-lg font-bold text-violet-700">{fmt(cdMeanResidueEllipticity)}</p>
              </div>
            )}
            <div className="rounded-lg bg-white p-3 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">За стандартною кривою</p>
              <p className="mt-1 font-mono text-lg font-bold text-violet-700">{fmt(standardCurveX)}</p>
            </div>
          </div>

          {regression && (
            <div className="rounded-lg border border-violet-100 bg-white px-3 py-2 text-xs text-slate-600">
              <Sigma className="mr-1 inline h-3.5 w-3.5 text-violet-500" />
              y = {fmt(regression.slope)}x + {fmt(regression.intercept)}; R² = {fmt(regression.r2)}
            </div>
          )}

          <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-900 p-3 text-[11px] leading-5 text-slate-100">{report}</pre>

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={copyReport} className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50">
              <Copy className="h-3.5 w-3.5" />
              {copied ? "Скопійовано" : "Копіювати"}
            </button>
            {onSaveToExperiment && (
              <button type="button" onClick={() => onSaveToExperiment(report)} className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-700">
                <Save className="h-3.5 w-3.5" />
                Зберегти в журнал
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
