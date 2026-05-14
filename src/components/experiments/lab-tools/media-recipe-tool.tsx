"use client";

import { Copy, FlaskConical, Save, Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { ProjectRecord } from "@/lib/schemas";

type ComponentLine = {
  name: string;
  amount: number;
  unit: string;
  notes: string;
};

type MediumRecipe = {
  id: string;
  title: string;
  source: string;
  family: string;
  baseVolumeMl: number;
  format: string;
  targetPh: string;
  sterilization: string;
  components: ComponentLine[];
  supplements: ComponentLine[];
};

const BUILT_IN_RECIPES: MediumRecipe[] = [
  {
    id: "lb-broth",
    title: "LB broth",
    source: "template",
    family: "bacterial",
    baseVolumeMl: 1000,
    format: "liquid",
    targetPh: "7.0",
    sterilization: "autoclave",
    components: [
      { name: "Tryptone", amount: 10, unit: "g", notes: "" },
      { name: "Yeast extract", amount: 5, unit: "g", notes: "" },
      { name: "NaCl", amount: 10, unit: "g", notes: "" },
    ],
    supplements: [],
  },
  {
    id: "lb-agar",
    title: "LB agar",
    source: "template",
    family: "bacterial",
    baseVolumeMl: 1000,
    format: "solid_agar",
    targetPh: "7.0",
    sterilization: "autoclave",
    components: [
      { name: "Tryptone", amount: 10, unit: "g", notes: "" },
      { name: "Yeast extract", amount: 5, unit: "g", notes: "" },
      { name: "NaCl", amount: 10, unit: "g", notes: "" },
      { name: "Agar", amount: 15, unit: "g", notes: "solid medium" },
    ],
    supplements: [],
  },
  {
    id: "ypd-broth",
    title: "YPD broth",
    source: "template",
    family: "yeast",
    baseVolumeMl: 1000,
    format: "liquid",
    targetPh: "",
    sterilization: "autoclave",
    components: [
      { name: "Yeast extract", amount: 10, unit: "g", notes: "" },
      { name: "Peptone", amount: 20, unit: "g", notes: "" },
      { name: "Glucose", amount: 20, unit: "g", notes: "sterilize separately if needed" },
    ],
    supplements: [],
  },
  {
    id: "pda",
    title: "Potato dextrose agar",
    source: "template",
    family: "fungal",
    baseVolumeMl: 1000,
    format: "solid_agar",
    targetPh: "5.6",
    sterilization: "autoclave",
    components: [
      { name: "Potato infusion solids", amount: 4, unit: "g", notes: "or commercial PDA base" },
      { name: "Dextrose", amount: 20, unit: "g", notes: "" },
      { name: "Agar", amount: 15, unit: "g", notes: "" },
    ],
    supplements: [],
  },
  {
    id: "dmem-complete",
    title: "DMEM complete medium",
    source: "template",
    family: "mammalian_cell",
    baseVolumeMl: 500,
    format: "liquid",
    targetPh: "7.2-7.4",
    sterilization: "filter_0_22_um",
    components: [
      { name: "DMEM base", amount: 445, unit: "mL", notes: "" },
      { name: "FBS", amount: 50, unit: "mL", notes: "10% v/v" },
      { name: "Penicillin-streptomycin", amount: 5, unit: "mL", notes: "1x final" },
    ],
    supplements: [],
  },
];

function parseLines(raw: unknown): ComponentLine[] {
  if (typeof raw !== "string") return [];
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name = "", amount = "", unit = "", notes = ""] = line.split("|").map((part) => part.trim());
      return { name, amount: Number(amount.replace(",", ".")), unit, notes };
    })
    .filter((item) => item.name && Number.isFinite(item.amount));
}

function recordsToRecipes(records: ProjectRecord[]): MediumRecipe[] {
  return records
    .filter((record) => record.kind === "culture_medium_recipe")
    .map((record) => {
      const data = record.typedData ?? {};
      return {
        id: record._id ?? record.localId,
        title: record.title,
        source: record.localId,
        family: String(data.medium_family ?? ""),
        baseVolumeMl: Number(data.base_volume_ml) || 1000,
        format: String(data.format ?? ""),
        targetPh: String(data.target_ph ?? ""),
        sterilization: String(data.sterilization ?? ""),
        components: parseLines(data.components),
        supplements: parseLines(data.supplements),
      };
    })
    .filter((recipe) => recipe.components.length > 0);
}

function fmt(n: number): string {
  if (!Number.isFinite(n)) return "-";
  if (Math.abs(n) >= 1000 || Math.abs(n) < 0.01) return n.toExponential(3);
  return Number(n.toFixed(4)).toString();
}

function recipeReport(recipe: MediumRecipe, targetVolumeMl: number): string {
  const factor = targetVolumeMl / recipe.baseVolumeMl;
  const rows = recipe.components.map((c) => `- ${c.name}: ${fmt(c.amount * factor)} ${c.unit}${c.notes ? ` (${c.notes})` : ""}`);
  const supplements = recipe.supplements.map((c) => `- ${c.name}: ${fmt(c.amount * factor)} ${c.unit}${c.notes ? ` (${c.notes})` : ""}`);
  return [
    `🧫 Розрахунок поживного середовища: ${recipe.title}`,
    `Об'єм: ${fmt(targetVolumeMl)} mL; масштаб: ${fmt(factor)}x від ${recipe.baseVolumeMl} mL`,
    recipe.family ? `Тип: ${recipe.family}` : "",
    recipe.targetPh ? `pH: ${recipe.targetPh}` : "",
    recipe.sterilization ? `Стерилізація: ${recipe.sterilization.replace(/_/g, " ")}` : "",
    "Компоненти:",
    ...rows,
    supplements.length ? "Добавки після стерилізації:" : "",
    ...supplements,
  ].filter(Boolean).join("\n");
}

export function MediaRecipeTool({
  records,
  onSaveToExperiment,
}: {
  records: ProjectRecord[];
  onSaveToExperiment?: (text: string) => void;
}) {
  const recipes = useMemo(() => [...recordsToRecipes(records), ...BUILT_IN_RECIPES], [records]);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(recipes[0]?.id ?? "");
  const [targetVolume, setTargetVolume] = useState("250");
  const [copied, setCopied] = useState(false);

  const filtered = recipes.filter((recipe) => {
    const q = query.toLowerCase();
    return recipe.title.toLowerCase().includes(q) || recipe.family.toLowerCase().includes(q) || recipe.source.toLowerCase().includes(q);
  });
  const selected = recipes.find((recipe) => recipe.id === selectedId) ?? recipes[0];
  const targetVolumeMl = Number(targetVolume.replace(",", ".")) || 0;
  const factor = selected && targetVolumeMl > 0 ? targetVolumeMl / selected.baseVolumeMl : 0;
  const report = selected && targetVolumeMl > 0 ? recipeReport(selected, targetVolumeMl) : "";

  async function copyReport() {
    if (!report) return;
    await navigator.clipboard?.writeText(report);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div className="flex flex-col gap-5 p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-600 text-white shadow-sm">
          <FlaskConical className="h-5 w-5" />
        </div>
        <div>
          <p className="font-semibold text-slate-900">Поживні середовища</p>
          <p className="text-[11px] text-slate-500">Рецепти з записів проєкту + базові шаблони · масштабування компонентів</p>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              className="input-control w-full pl-8 text-sm"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Пошук за назвою або типом..."
            />
          </div>
          <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
            {filtered.map((recipe) => (
              <button
                key={recipe.id}
                type="button"
                onClick={() => setSelectedId(recipe.id)}
                className={`w-full rounded-lg border px-3 py-2.5 text-left transition ${
                  selected?.id === recipe.id ? "border-sky-300 bg-sky-50" : "border-slate-200 bg-white hover:border-sky-200"
                }`}
              >
                <div className="flex items-start gap-2">
                  <span className="text-lg">🧫</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800">{recipe.title}</p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      {recipe.family.replace(/_/g, " ") || "custom"} · {recipe.baseVolumeMl} mL · {recipe.source}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          {selected ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-900">{selected.title}</p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {selected.format.replace(/_/g, " ") || "format not set"} · base {selected.baseVolumeMl} mL
                    {selected.targetPh ? ` · pH ${selected.targetPh}` : ""}
                  </p>
                </div>
                <label className="w-36">
                  <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">Об&apos;єм, mL</span>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    className="input-control w-full font-mono text-sm"
                    value={targetVolume}
                    onChange={(e) => setTargetVolume(e.target.value)}
                  />
                </label>
              </div>

              <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                Масштаб: <span className="font-mono font-semibold text-sky-700">{fmt(factor)}x</span>
                {selected.sterilization ? <span> · стерилізація: {selected.sterilization.replace(/_/g, " ")}</span> : null}
              </div>

              <div className="overflow-hidden rounded-lg border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-400">
                    <tr>
                      <th className="px-3 py-2">Компонент</th>
                      <th className="px-3 py-2">Кількість</th>
                      <th className="px-3 py-2">Нотатки</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selected.components.map((item) => (
                      <tr key={`${item.name}-${item.unit}`}>
                        <td className="px-3 py-2 font-medium text-slate-800">{item.name}</td>
                        <td className="px-3 py-2 font-mono text-sky-700">{fmt(item.amount * factor)} {item.unit}</td>
                        <td className="px-3 py-2 text-slate-500">{item.notes || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {selected.supplements.length > 0 && (
                <div>
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">Добавки після стерилізації</p>
                  <div className="space-y-1.5">
                    {selected.supplements.map((item) => (
                      <div key={`${item.name}-${item.unit}`} className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs">
                        <span className="font-medium text-slate-800">{item.name}</span>
                        <span className="ml-2 font-mono text-amber-700">{fmt(item.amount * factor)} {item.unit}</span>
                        {item.notes ? <span className="ml-2 text-slate-500">{item.notes}</span> : null}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={copyReport} className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50">
                  <Copy className="h-3.5 w-3.5" />
                  {copied ? "Скопійовано" : "Копіювати"}
                </button>
                {onSaveToExperiment && (
                  <button type="button" onClick={() => onSaveToExperiment(report)} className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-2 text-xs font-semibold text-white hover:bg-sky-700">
                    <Save className="h-3.5 w-3.5" />
                    Зберегти в журнал
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-200 px-5 py-10 text-center text-xs text-slate-400">
              Немає рецептів. Створіть запис типу &quot;Рецепт поживного середовища&quot;.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
