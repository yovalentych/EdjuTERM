"use client";

import { ChevronDown, Copy, FlaskConical, Save, Search, X } from "lucide-react";
import { useMemo, useState } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

type MolarUnit = "M" | "mM" | "µM" | "nM" | "pM";
type MassUnit  = "kg" | "g" | "mg" | "µg" | "ng";
type VolumeUnit = "L" | "mL" | "µL" | "nL";

// For dilution / serial / calibration we also accept mass-concentration units
type ConcUnit = MolarUnit | "g/mL" | "mg/mL" | "µg/mL" | "ng/mL";

const MOLAR_UNITS: MolarUnit[] = ["M", "mM", "µM", "nM", "pM"];
const CONC_UNITS: ConcUnit[]   = ["M", "mM", "µM", "nM", "pM", "mg/mL", "µg/mL", "ng/mL"];
const MASS_UNITS: MassUnit[]   = ["kg", "g", "mg", "µg", "ng"];
const VOL_UNITS: VolumeUnit[]  = ["L", "mL", "µL", "nL"];

const MOLAR_SCALE: Record<MolarUnit, number>    = { M: 1, mM: 1e-3, µM: 1e-6, nM: 1e-9, pM: 1e-12 };
const MASS_SCALE: Record<MassUnit, number>       = { kg: 1e3, g: 1, mg: 1e-3, µg: 1e-6, ng: 1e-9 };
const VOL_SCALE: Record<VolumeUnit, number>      = { L: 1, mL: 1e-3, µL: 1e-6, nL: 1e-9 };
// mass-conc SI = mg/mL
const MASS_C_SCALE: Record<string, number>       = { "g/mL": 1e3, "mg/mL": 1, "µg/mL": 1e-3, "ng/mL": 1e-6 };
const ALL_C_SCALE: Record<string, number>        = { ...MOLAR_SCALE, ...MASS_C_SCALE };

function toSI(v: number, u: string, scale: Record<string, number>) { return v * (scale[u] ?? 1); }
function fromSI(si: number, u: string, scale: Record<string, number>) { return si / (scale[u] ?? 1); }

function fmt(n: number, sig = 4): string {
  if (!isFinite(n) || isNaN(n)) return "—";
  if (n === 0) return "0";
  const abs = Math.abs(n);
  if (abs >= 10000 || abs < 0.001) return n.toExponential(sig - 1);
  return parseFloat(n.toPrecision(sig)).toString();
}

// ── Substance database ────────────────────────────────────────────────────────

interface Substance {
  name: string;
  mw: number;       // g/mol
  cat: string;
  hint?: string;    // common stock / note
}

const SUBSTANCES: Substance[] = [
  // Antibiotics
  { name: "Ampicillin",              mw: 371.4,   cat: "Антибіотики",    hint: "Сток: 100 mg/mL у H₂O; робоча: 100 µg/mL" },
  { name: "Kanamycin sulfate",        mw: 582.6,   cat: "Антибіотики",    hint: "Сток: 50 mg/mL у H₂O; робоча: 50 µg/mL" },
  { name: "Carbenicillin",            mw: 378.4,   cat: "Антибіотики",    hint: "Сток: 50 mg/mL у H₂O; робоча: 50–100 µg/mL" },
  { name: "Chloramphenicol",          mw: 323.1,   cat: "Антибіотики",    hint: "Сток: 34 mg/mL у EtOH; робоча: 34 µg/mL" },
  { name: "Streptomycin sulfate",     mw: 728.7,   cat: "Антибіотики",    hint: "Сток: 50 mg/mL у H₂O; робоча: 50 µg/mL" },
  { name: "Tetracycline HCl",         mw: 480.9,   cat: "Антибіотики",    hint: "Сток: 5 mg/mL у EtOH 70%; зберігати в темряві" },
  { name: "Gentamicin sulfate",       mw: 477.6,   cat: "Антибіотики",    hint: "Сток: 50 mg/mL у H₂O; робоча: 10 µg/mL" },
  { name: "Hygromycin B",             mw: 527.5,   cat: "Антибіотики",    hint: "Готовий сток 50 mg/mL; робоча: 200–500 µg/mL" },
  { name: "Puromycin diHCl",          mw: 544.5,   cat: "Антибіотики",    hint: "Сток: 2 mg/mL у H₂O; робоча: 1–10 µg/mL" },
  { name: "Blasticidin S HCl",        mw: 422.3,   cat: "Антибіотики",    hint: "Сток: 10 mg/mL у H₂O; робоча: 5–10 µg/mL" },
  { name: "G418 (Geneticin)",         mw: 692.7,   cat: "Антибіотики",    hint: "Сток: 50 mg/mL у H₂O; робоча: 200–500 µg/mL" },
  { name: "Zeocin",                   mw: 1600,    cat: "Антибіотики",    hint: "Готовий сток 100 mg/mL; робоча: 25–100 µg/mL" },
  // Buffer components
  { name: "Tris base",                mw: 121.14,  cat: "Буфери",         hint: "pH 7.4–9.0; типово 1 M сток" },
  { name: "Tris-HCl",                 mw: 157.60,  cat: "Буфери",         hint: "Сток з відомим pH для точних буферів" },
  { name: "HEPES (вільна кислота)",   mw: 238.30,  cat: "Буфери",         hint: "pH 6.8–8.2; для клітинних культур" },
  { name: "EDTA × 2Na × 2H₂O",       mw: 372.24,  cat: "Буфери",         hint: "Сток: 0.5 M, pH 8.0 (розчиняється лише при pH ≥8)" },
  { name: "NaCl",                     mw: 58.44,   cat: "Буфери",         hint: "Сток: 5 M або 1 M" },
  { name: "KCl",                      mw: 74.55,   cat: "Буфери",         hint: "Сток: 3 M" },
  { name: "Na₂HPO₄ (безводний)",      mw: 141.96,  cat: "Буфери",         hint: "Компонент PBS, фосфатних буферів" },
  { name: "NaH₂PO₄ × H₂O",           mw: 137.99,  cat: "Буфери",         hint: "Компонент PBS pH 5.5–7.5" },
  { name: "K₂HPO₄",                   mw: 174.18,  cat: "Буфери",         hint: "Фосфатний буфер, pH ~9.2" },
  { name: "KH₂PO₄",                   mw: 136.09,  cat: "Буфери",         hint: "Фосфатний буфер, pH ~4.5" },
  { name: "MgCl₂ × 6H₂O",            mw: 203.30,  cat: "Буфери",         hint: "Сток: 1 M; для ферментних реакцій, PCR" },
  { name: "CaCl₂ (безводний)",        mw: 110.98,  cat: "Буфери",         hint: "Сток: 1 M; для клітинних культур, компетентних клітин" },
  { name: "Imidazole",                mw: 68.08,   cat: "Буфери",         hint: "Для елюції His-tag білків з Ni-NTA колонок" },
  { name: "Glycine",                  mw: 75.03,   cat: "Буфери",         hint: "SDS-PAGE, стоп-буфер для WB" },
  { name: "SDS (додецилсульфат Na)",  mw: 288.38,  cat: "Буфери",         hint: "Сток: 10% або 20% (w/v)" },
  { name: "Sodium azide (NaN₃)",      mw: 65.01,   cat: "Буфери",         hint: "⚠ ТОКСИЧНО. Консервант антитіл; 0.02–0.1%" },
  { name: "Boric acid",               mw: 61.83,   cat: "Буфери",         hint: "TBE, TBE-Urea буфери для гелів" },
  // Reducing agents
  { name: "DTT (дитіотреітол)",       mw: 154.25,  cat: "Відновники",     hint: "Сток: 1 M; не автоклавувати; зберігати -20°C" },
  { name: "β-Меркаптоетанол (BME)",   mw: 78.13,   cat: "Відновники",     hint: "⚠ летючий! Використовувати у витяжці" },
  { name: "TCEP-HCl",                 mw: 286.65,  cat: "Відновники",     hint: "Кращий замінник DTT; стабільніший" },
  { name: "PMSF",                     mw: 174.19,  cat: "Відновники",     hint: "Інгібітор протеаз; сток: 0.1 M в DMSO або IPA; напівперіод 30 хв у воді" },
  { name: "Ascorbic acid",            mw: 176.12,  cat: "Відновники",     hint: "Антиоксидант; сток: 100 mM" },
  // Dyes & indicators
  { name: "Ethidium bromide (EtBr)",  mw: 394.31,  cat: "Барвники",       hint: "⚠ МУТАГЕН! Сток: 10 mg/mL; робоча: 0.5 µg/mL" },
  { name: "DAPI",                     mw: 350.25,  cat: "Барвники",       hint: "Сток: 1 mg/mL у H₂O або DMSO; робоча: 0.1–1 µg/mL" },
  { name: "Propidium iodide (PI)",    mw: 668.39,  cat: "Барвники",       hint: "Сток: 1 mg/mL; для проточної цитометрії; виявляє мертві клітини" },
  { name: "MTT",                      mw: 414.32,  cat: "Барвники",       hint: "Сток: 5 mg/mL у PBS; тест на віабельність клітин" },
  { name: "Resazurin (Alamar Blue)",  mw: 229.19,  cat: "Барвники",       hint: "Сток: 1 mM у PBS; флуоресцентний тест віабельності" },
  { name: "Coomassie Blue R-250",     mw: 825.97,  cat: "Барвники",       hint: "Фарбування гелів; розчин у MeOH/AcOH/H₂O" },
  { name: "Crystal violet",           mw: 407.98,  cat: "Барвники",       hint: "Фарбування колоній, клітин; 0.1–1% в MeOH" },
  { name: "Bromophenol blue",         mw: 669.96,  cat: "Барвники",       hint: "Барвник для трекінгу електрофорезу" },
  // Sugars & inducers
  { name: "D-Glucose",                mw: 180.16,  cat: "Цукри/Індуктори", hint: "Джерело вуглецю; сток: 20% або 40% (w/v)" },
  { name: "Sucrose",                  mw: 342.30,  cat: "Цукри/Індуктори", hint: "Для осмотичного балансу; щільнісний градієнт" },
  { name: "Lactose",                  mw: 360.31,  cat: "Цукри/Індуктори", hint: "Природний індуктор lac-опероно у кишковій паличці" },
  { name: "IPTG",                     mw: 238.31,  cat: "Цукри/Індуктори", hint: "Сток: 1 M у H₂O; робоча: 0.1–1 mM для індукції" },
  { name: "X-gal",                    mw: 408.63,  cat: "Цукри/Індуктори", hint: "Сток: 20 mg/mL у DMF; blue/white screening" },
  { name: "Sorbitol",                 mw: 182.17,  cat: "Цукри/Індуктори", hint: "Осмопротектор; 1 M для ізоляції органел" },
  { name: "Arabinose (L-)",           mw: 150.13,  cat: "Цукри/Індуктори", hint: "Сток: 20% у H₂O; індуктор araBAD" },
  // Proteins (for standards)
  { name: "BSA (бичачий сироватковий альбумін)", mw: 66430, cat: "Білки-стандарти", hint: "Еталон для BCA/Bradford; сток: 10 mg/mL" },
  { name: "Lysozyme",                 mw: 14313,   cat: "Білки-стандарти", hint: "MW стандарт; SDS-PAGE 14.3 kDa" },
  { name: "Ovalbumin (яєчний альбумін)", mw: 45000, cat: "Білки-стандарти", hint: "MW стандарт 45 kDa" },
  { name: "Cytochrome c",             mw: 12327,   cat: "Білки-стандарти", hint: "MW стандарт ~12 kDa" },
  { name: "Myoglobin",                mw: 17600,   cat: "Білки-стандарти", hint: "MW стандарт ~17 kDa" },
  { name: "IgG (людський)",           mw: 150000,  cat: "Білки-стандарти", hint: "~150 kDa; важкий + легкий ланцюг" },
  // Denaturants & solvents
  { name: "Urea",                     mw: 60.06,   cat: "Денатуранти",    hint: "8 M для денатурації; готувати свіжим або деіонізувати" },
  { name: "Guanidine HCl",            mw: 95.53,   cat: "Денатуранти",    hint: "6 M для денатурації; сильніший від сечовини" },
  { name: "Guanidine isothiocyanate", mw: 118.16,  cat: "Денатуранти",    hint: "4 M для лізису клітин (ізоляція РНК — TRIzol)" },
  { name: "Formaldehyde (37%)",       mw: 30.03,   cat: "Денатуранти",    hint: "⚠ Токсично/канцерогенно! Фіксатор для ІГХ" },
  { name: "DMSO",                     mw: 78.13,   cat: "Денатуранти",    hint: "Кріопротектор; розчинник ліпофільних сполук" },
  { name: "Glycerol",                 mw: 92.09,   cat: "Денатуранти",    hint: "Зберігання ферментів (-20°C); 50% для стокових белків" },
  // Acids & bases
  { name: "NaOH",                     mw: 40.00,   cat: "Кислоти/Луги",   hint: "Сток: 1 M або 10 M для pH коригування" },
  { name: "HCl",                      mw: 36.46,   cat: "Кислоти/Луги",   hint: "Сток: 1 M для pH коригування" },
  { name: "Acetic acid (льодяна)",     mw: 60.05,   cat: "Кислоти/Луги",   hint: "pH <4.5; розчинник для барвників" },
  { name: "H₂SO₄",                    mw: 98.08,   cat: "Кислоти/Луги",   hint: "⚠ НЕБЕЗПЕЧНО! Стоп-реагент для ELISA (2 N)" },
];

const CATEGORIES = Array.from(new Set(SUBSTANCES.map((s) => s.cat)));

// ── Substance picker ──────────────────────────────────────────────────────────

interface PickedSubstance { name: string; mw: number; hint?: string }

function SubstancePicker({
  value, onChange,
}: {
  value: PickedSubstance | null;
  onChange: (s: PickedSubstance | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");

  const filtered = useMemo(() => {
    let list = SUBSTANCES;
    if (cat) list = list.filter((s) => s.cat === cat);
    if (q.trim()) {
      const lq = q.toLowerCase();
      list = list.filter((s) => s.name.toLowerCase().includes(lq));
    }
    return list;
  }, [q, cat]);

  return (
    <div className="relative">
      {/* Trigger row */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen((p) => !p)}
          className={`flex min-w-0 flex-1 items-center gap-2 rounded-xl border px-3 py-2 text-xs transition ${
            value
              ? "border-emerald-300 bg-emerald-50 text-emerald-900"
              : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
          }`}
        >
          <FlaskConical className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
          <span className="min-w-0 truncate font-medium">
            {value ? value.name : "Обрати речовину зі списку (необов'язково)"}
          </span>
          {value && (
            <span className="ml-auto shrink-0 font-mono text-[10px] text-emerald-600">
              MW = {fmt(value.mw)} г/моль
            </span>
          )}
          <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition ${open ? "rotate-180" : ""}`} />
        </button>
        {value && (
          <button type="button" onClick={() => onChange(null)}
            className="rounded-lg border border-slate-200 p-2 text-slate-400 hover:bg-slate-50 hover:text-rose-500">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Hint */}
      {value?.hint && (
        <p className="mt-1 px-1 text-[10px] leading-4 text-slate-500">💡 {value.hint}</p>
      )}

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          {/* Search + category */}
          <div className="flex gap-2 border-b border-slate-100 p-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)}
                className="w-full rounded-lg border border-slate-200 py-1.5 pl-8 pr-3 text-xs outline-none focus:border-emerald-400"
                placeholder="Пошук за назвою…" />
            </div>
            <select value={cat} onChange={(e) => setCat(e.target.value)}
              className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs outline-none focus:border-emerald-400">
              <option value="">Всі</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* List */}
          <div className="max-h-64 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">Нічого не знайдено</p>
            ) : (
              <div>
                {filtered.map((s) => (
                  <button key={s.name} type="button"
                    onClick={() => { onChange({ name: s.name, mw: s.mw, hint: s.hint }); setOpen(false); setQ(""); }}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-xs transition hover:bg-emerald-50 ${value?.name === s.name ? "bg-emerald-50" : ""}`}>
                    <span className="min-w-0 flex-1 font-medium text-slate-800">{s.name}</span>
                    <span className="shrink-0 font-mono text-[10px] text-emerald-600">{fmt(s.mw)}</span>
                    <span className="shrink-0 rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] text-slate-500">{s.cat}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Shared UI atoms ───────────────────────────────────────────────────────────

function Num({ value, onChange, disabled, placeholder }: {
  value: string; onChange: (v: string) => void; disabled?: boolean; placeholder?: string;
}) {
  return (
    <input type="number" step="any" value={value} onChange={(e) => onChange(e.target.value)}
      disabled={disabled} placeholder={placeholder ?? ""}
      className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-50 disabled:text-slate-400" />
  );
}

function UnitSel<T extends string>({ value, options, onChange, w }: {
  value: T; options: readonly T[]; onChange: (v: T) => void; w?: string;
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value as T)}
      className={`${w ?? "w-24"} shrink-0 rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-emerald-400`}>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function FieldRow({ label, isSolve, onSolve, children }: {
  label: string; isSolve: boolean; onSolve: () => void; children: React.ReactNode;
}) {
  return (
    <div className={`rounded-xl border p-3 transition ${isSolve ? "border-emerald-300 bg-emerald-50/60" : "border-slate-200 bg-white"}`}>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-semibold text-slate-600">{label}</span>
        <button type="button" onClick={onSolve}
          className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold transition ${
            isSolve ? "border-emerald-500 bg-emerald-600 text-white" : "border-slate-200 text-slate-400 hover:border-emerald-300 hover:text-emerald-600"
          }`}>
          {isSolve ? "← розрахунок" : "розрахувати"}
        </button>
      </div>
      <div className="flex gap-2">{children}</div>
    </div>
  );
}

function LRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-semibold text-slate-500">{label}</p>
      <div className="flex gap-2">{children}</div>
    </div>
  );
}

function ResultCard({ label, value, sub, report, onSave }: {
  label: string; value: string; sub?: string; report: string; onSave?: (t: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  function copy() { navigator.clipboard.writeText(report).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 1500); }
  return (
    <div className="overflow-hidden rounded-xl border-2 border-emerald-300 bg-gradient-to-br from-emerald-50 to-white">
      <div className="px-4 pt-4 pb-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">{label}</p>
        <p className="my-1.5 font-mono text-2xl font-bold text-emerald-900">{value}</p>
        {sub && <p className="text-[11px] text-emerald-600">{sub}</p>}
      </div>
      <div className="flex gap-2 border-t border-emerald-100 bg-emerald-50/60 px-4 py-2.5">
        <button type="button" onClick={copy}
          className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50">
          <Copy className="h-3 w-3" />{copied ? "Скопійовано!" : "Копіювати"}
        </button>
        {onSave && (
          <button type="button" onClick={() => onSave(report)}
            className="flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-100 px-3 py-1.5 text-[11px] font-semibold text-emerald-800 transition hover:bg-emerald-200">
            <Save className="h-3 w-3" /> В журнал
          </button>
        )}
      </div>
    </div>
  );
}

function Protocol({ title, steps, extra, report, onSave }: {
  title: string; steps: string[]; extra?: string; report: string; onSave?: (t: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  function copy() { navigator.clipboard.writeText(report).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 1500); }
  return (
    <div className="overflow-hidden rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
      <div className="border-b border-emerald-100 px-4 py-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">{title}</p>
      </div>
      <div className="space-y-2 px-4 py-3">
        {steps.map((step, i) => (
          <div key={i} className="flex items-start gap-3">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-200 text-[10px] font-bold text-emerald-800">{i + 1}</span>
            <p className="text-xs leading-5 text-slate-700">{step}</p>
          </div>
        ))}
        {extra && <p className="pt-1 font-mono text-[10px] text-emerald-600">{extra}</p>}
      </div>
      <div className="flex gap-2 border-t border-emerald-100 bg-emerald-50/60 px-4 py-2.5">
        <button type="button" onClick={copy}
          className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50">
          <Copy className="h-3 w-3" />{copied ? "Скопійовано!" : "Копіювати"}
        </button>
        {onSave && (
          <button type="button" onClick={() => onSave(report)}
            className="flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-100 px-3 py-1.5 text-[11px] font-semibold text-emerald-800 transition hover:bg-emerald-200">
            <Save className="h-3 w-3" /> В журнал
          </button>
        )}
      </div>
    </div>
  );
}

function DataTable({ cols, rows }: { cols: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            {cols.map((c) => (
              <th key={c} className="px-3 py-2 text-left font-semibold text-slate-600">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/60"}>
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2 font-mono text-slate-700">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Tab 1: Dilution (C₁V₁ = C₂V₂) ───────────────────────────────────────────

type DField = "c1" | "v1" | "c2" | "v2";

function DilutionCalc({ onSave }: { onSave?: (t: string) => void }) {
  const [c1, setC1] = useState("100");   const [c1u, setC1u] = useState<ConcUnit>("mM");
  const [v1, setV1] = useState("");      const [v1u, setV1u] = useState<VolumeUnit>("µL");
  const [c2, setC2] = useState("10");    const [c2u, setC2u] = useState<ConcUnit>("mM");
  const [v2, setV2] = useState("1000");  const [v2u, setV2u] = useState<VolumeUnit>("µL");
  const [solve, setSolve] = useState<DField>("v1");

  function compute() {
    const n: Record<DField, number | null> = {
      c1: c1 ? +c1 : null, v1: v1 ? +v1 : null, c2: c2 ? +c2 : null, v2: v2 ? +v2 : null,
    };
    const C1 = n.c1 != null ? toSI(n.c1, c1u, ALL_C_SCALE) : null;
    const V1 = n.v1 != null ? toSI(n.v1, v1u, VOL_SCALE) : null;
    const C2 = n.c2 != null ? toSI(n.c2, c2u, ALL_C_SCALE) : null;
    const V2 = n.v2 != null ? toSI(n.v2, v2u, VOL_SCALE) : null;
    if (solve === "v1" && C1 && C2 && V2 && C1 > 0) return fromSI((C2 * V2) / C1, v1u, VOL_SCALE);
    if (solve === "c1" && V1 && C2 && V2 && V1 > 0) return fromSI((C2 * V2) / V1, c1u, ALL_C_SCALE);
    if (solve === "c2" && C1 && V1 && V2 && V2 > 0) return fromSI((C1 * V1) / V2, c2u, ALL_C_SCALE);
    if (solve === "v2" && C1 && V1 && C2 && C2 > 0) return fromSI((C1 * V1) / C2, v2u, VOL_SCALE);
    return null;
  }

  const res = compute();
  const solveUnit = solve === "v1" ? v1u : solve === "v2" ? v2u : solve === "c1" ? c1u : c2u;

  const dilFactor = (() => {
    try { const a = toSI(+c1, c1u, ALL_C_SCALE), b = toSI(+c2, c2u, ALL_C_SCALE); return a > 0 && b > 0 ? a / b : null; } catch { return null; }
  })();

  const getVal = (f: DField): string => {
    if (f === solve && res !== null) return fmt(res);
    return f === "c1" ? c1 : f === "v1" ? v1 : f === "c2" ? c2 : v2;
  };
  const getUnit = (f: DField): string =>
    f === "c1" ? c1u : f === "v1" ? v1u : f === "c2" ? c2u : v2u;

  const report = res != null ? [
    "=== Розрахунок розведення (C₁V₁ = C₂V₂) ===",
    "",
    `C₁ = ${getVal("c1")} ${getUnit("c1")}   (початкова концентрація)`,
    `V₁ = ${getVal("v1")} ${getUnit("v1")}   (відібрати стоку)`,
    `C₂ = ${getVal("c2")} ${getUnit("c2")}   (кінцева концентрація)`,
    `V₂ = ${getVal("v2")} ${getUnit("v2")}   (кінцевий об'єм)`,
    dilFactor ? `\nКратність розведення: 1:${fmt(dilFactor)} (${fmt(dilFactor)}×)` : "",
    `\nПротокол: відібрати ${getVal("v1")} ${getUnit("v1")}, довести до ${getVal("v2")} ${getUnit("v2")} розчинником.`,
  ].filter(Boolean).join("\n") : "";

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-center font-mono text-sm font-semibold text-slate-700">
        C₁ · V₁ = C₂ · V₂
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2">
        <FieldRow label="C₁ — початкова концентрація" isSolve={solve === "c1"} onSolve={() => setSolve("c1")}>
          <Num value={c1} onChange={setC1} disabled={solve === "c1"} placeholder="100" />
          <UnitSel value={c1u} options={CONC_UNITS} onChange={setC1u} />
        </FieldRow>
        <FieldRow label="V₁ — об'єм стоку (відібрати)" isSolve={solve === "v1"} onSolve={() => setSolve("v1")}>
          <Num value={v1} onChange={setV1} disabled={solve === "v1"} placeholder={solve === "v1" ? "← авто" : ""} />
          <UnitSel value={v1u} options={VOL_UNITS} onChange={setV1u} />
        </FieldRow>
        <FieldRow label="C₂ — кінцева концентрація" isSolve={solve === "c2"} onSolve={() => setSolve("c2")}>
          <Num value={c2} onChange={setC2} disabled={solve === "c2"} placeholder="10" />
          <UnitSel value={c2u} options={CONC_UNITS} onChange={setC2u} />
        </FieldRow>
        <FieldRow label="V₂ — кінцевий об'єм" isSolve={solve === "v2"} onSolve={() => setSolve("v2")}>
          <Num value={v2} onChange={setV2} disabled={solve === "v2"} placeholder="1000" />
          <UnitSel value={v2u} options={VOL_UNITS} onChange={setV2u} />
        </FieldRow>
      </div>

      {res != null && (
        <ResultCard
          label={`Результат — ${solve === "c1" ? "C₁" : solve === "v1" ? "V₁ (об'єм стоку)" : solve === "c2" ? "C₂" : "V₂ (кінцевий об'єм)"}`}
          value={`${fmt(res)} ${solveUnit}`}
          sub={dilFactor ? `Кратність: 1:${fmt(dilFactor)} · Об'єм розчинника: ${fmt(fromSI(toSI(+(getVal("v2")), v2u, VOL_SCALE) - toSI(+(getVal("v1")), v1u, VOL_SCALE), v2u, VOL_SCALE))} ${v2u}` : undefined}
          report={report}
          onSave={onSave}
        />
      )}
    </div>
  );
}

// ── Tab 2: Molarity ───────────────────────────────────────────────────────────

function MolarCalc({ sub, onSave }: { sub: PickedSubstance | null; onSave?: (t: string) => void }) {
  const [mass, setMass] = useState("");       const [massU, setMassU] = useState<MassUnit>("mg");
  const [mw, setMw]     = useState(sub?.mw?.toString() ?? "");
  const [vol, setVol]   = useState("");       const [volU, setVolU]   = useState<VolumeUnit>("mL");
  const [outU, setOutU] = useState<MolarUnit>("mM");
  const [mode, setMode] = useState<"c" | "m">("c"); // molarity or molality

  // sync MW from substance picker
  if (sub && sub.mw.toString() !== mw && mw === "") setMw(sub.mw.toString());

  const massG   = mass ? toSI(+mass, massU, MASS_SCALE) : null;
  const mwNum   = mw ? +mw : null;
  const volSI   = vol ? toSI(+vol, volU, VOL_SCALE) : null; // liters

  const molarity = (massG && mwNum && volSI && mwNum > 0 && volSI > 0)
    ? fromSI(massG / mwNum / volSI, outU, MOLAR_SCALE) : null;
  const molality = (massG && mwNum && volSI && mwNum > 0 && volSI > 0)
    ? (massG / mwNum) / (volSI * (mode === "m" ? 1 : 1)) : null; // mol/kg (assume density ~1 g/mL for water)

  const massFromConc = (molarity !== null && mwNum && volSI)
    ? `${fmt(toSI(molarity, outU, MOLAR_SCALE) * mwNum * volSI * 1e3)} mg в ${vol} ${volU}`
    : null;

  const report = molarity !== null ? [
    `=== Розрахунок молярності ===${sub ? ` [${sub.name}]` : ""}`,
    "",
    `Маса:             ${mass} ${massU} = ${fmt(massG! * 1e3)} mg = ${fmt(massG!)} g`,
    `Молярна маса:     ${mw} г/моль`,
    `Об'єм розчину:    ${vol} ${volU}`,
    "",
    `Молярна концентрація (M): ${fmt(fromSI(massG! / mwNum! / volSI!, "M", MOLAR_SCALE))} M`,
    `                   (mM): ${fmt(fromSI(massG! / mwNum! / volSI!, "mM", MOLAR_SCALE))} mM`,
    `                   (µM): ${fmt(fromSI(massG! / mwNum! / volSI!, "µM", MOLAR_SCALE))} µM`,
    `Молярність у ${outU}:    ${fmt(molarity)} ${outU}`,
    `Масова концентрація:  ${fmt(massG! / volSI! * 1e3)} mg/mL`,
  ].join("\n") : "";

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-center font-mono text-sm font-semibold text-slate-700">
        C = m / (M<sub>W</sub> · V)
      </div>

      {sub && (
        <div className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-xs text-violet-800">
          <span className="font-semibold">{sub.name}</span>
          <span className="ml-2 font-mono text-violet-600">MW = {fmt(sub.mw)} г/моль</span>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <LRow label="Маса речовини">
          <Num value={mass} onChange={setMass} placeholder="напр. 5" />
          <UnitSel value={massU} options={MASS_UNITS} onChange={setMassU} />
        </LRow>
        <LRow label="Молярна маса (г/моль)">
          <Num value={mw} onChange={setMw} placeholder="напр. 121.14" />
          <span className="flex shrink-0 items-center rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs font-semibold text-slate-500">г/моль</span>
        </LRow>
        <LRow label="Об'єм розчину">
          <Num value={vol} onChange={setVol} placeholder="напр. 10" />
          <UnitSel value={volU} options={VOL_UNITS} onChange={setVolU} />
        </LRow>
        <LRow label="Одиниця результату">
          <UnitSel value={outU} options={MOLAR_UNITS} onChange={setOutU} w="flex-1" />
        </LRow>
      </div>

      {molarity !== null && (
        <>
          <ResultCard
            label="Молярна концентрація"
            value={`${fmt(molarity)} ${outU}`}
            sub={`Масова концентрація: ${fmt(massG! / volSI! * 1e3)} mg/mL · ${massFromConc ?? ""}`}
            report={report}
            onSave={onSave}
          />
          {/* Multi-unit breakdown */}
          <div className="grid grid-cols-5 gap-1.5">
            {MOLAR_UNITS.map((u) => {
              const v = fromSI(massG! / mwNum! / volSI!, u, MOLAR_SCALE);
              return (
                <div key={u} className={`rounded-lg border px-2 py-2 text-center ${u === outU ? "border-emerald-300 bg-emerald-50" : "border-slate-100 bg-slate-50"}`}>
                  <p className="font-mono text-sm font-bold text-slate-800">{fmt(v, 3)}</p>
                  <p className="text-[10px] text-slate-500">{u}</p>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ── Tab 3: Serial dilutions ───────────────────────────────────────────────────

function SerialCalc({ onSave }: { onSave?: (t: string) => void }) {
  const [c0, setC0]     = useState("1");          const [c0u, setC0u]   = useState<ConcUnit>("mM");
  const [factor, setFactor] = useState("2");        // dilution factor (e.g. 2 = 1:2)
  const [steps, setSteps]   = useState("8");
  const [volTube, setVolTube] = useState("500");    const [volU, setVolU] = useState<VolumeUnit>("µL");
  const [includeBlank, setIncludeBlank] = useState(true);

  const nSteps  = Math.min(Math.max(1, parseInt(steps) || 0), 16);
  const fac     = parseFloat(factor) || 2;
  const vTube   = parseFloat(volTube) || 0;
  const vTransfer = fac > 0 ? vTube / fac : 0;
  const vDiluent  = vTube - vTransfer;
  const c0SI    = c0 ? toSI(+c0, c0u, ALL_C_SCALE) : 0;

  const tableRows: string[][] = [];
  if (includeBlank) tableRows.push(["0 (Blank)", "0", "—", fmt(vTube), volU]);
  for (let i = 0; i <= nSteps; i++) {
    const cSI = c0SI / Math.pow(fac, i);
    const cDisp = fmt(fromSI(cSI, c0u, ALL_C_SCALE));
    const from  = i === 0 ? "Стоку" : `Пробірки ${i}`;
    tableRows.push([
      `${i + 1}${i === 0 ? " (Стоку)" : ""}`,
      `${cDisp} ${c0u}`,
      `${i === 0 ? `${fmt(vTransfer)} ${volU} зі стоку` : `${fmt(vTransfer)} ${volU} з поб. ${i}`}`,
      `${fmt(vDiluent)} ${volU}`,
    ]);
  }

  const report = c0SI > 0 ? [
    `=== Серійні розведення 1:${fmt(fac)} ===`,
    "",
    `Початкова концентрація: ${c0} ${c0u}`,
    `Фактор розведення:      1:${fmt(fac)} (переносити ${fmt(vTransfer)} ${volU})`,
    `Кількість кроків:       ${nSteps}`,
    `Об'єм пробірки:         ${volTube} ${volU}`,
    "",
    `# | Концентрація | Перенести | Буфер`,
    ...tableRows.map((r) => r.join(" | ")),
  ].join("\n") : "";

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <LRow label="Початкова концентрація (C₀)">
          <Num value={c0} onChange={setC0} placeholder="1" />
          <UnitSel value={c0u} options={CONC_UNITS} onChange={setC0u} />
        </LRow>
        <LRow label="Фактор розведення (1:X)">
          <div className="flex flex-1 items-center gap-1.5">
            <span className="shrink-0 text-xs text-slate-400">1:</span>
            <Num value={factor} onChange={setFactor} placeholder="2" />
          </div>
          <div className="flex gap-1">
            {["2","3","5","10"].map((f) => (
              <button key={f} type="button" onClick={() => setFactor(f)}
                className={`rounded-md border px-2 py-2 text-[11px] font-bold transition ${factor === f ? "border-emerald-400 bg-emerald-100 text-emerald-700" : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"}`}>
                1:{f}
              </button>
            ))}
          </div>
        </LRow>
        <LRow label="Кількість кроків">
          <Num value={steps} onChange={(v) => setSteps(v)} placeholder="8" />
          <span className="flex shrink-0 items-center rounded-lg border border-slate-100 bg-slate-50 px-3 text-xs text-slate-500">кроків</span>
        </LRow>
        <LRow label="Об'єм кожної пробірки">
          <Num value={volTube} onChange={setVolTube} placeholder="500" />
          <UnitSel value={volU} options={VOL_UNITS} onChange={setVolU} />
        </LRow>
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-600">
        <input type="checkbox" checked={includeBlank} onChange={(e) => setIncludeBlank(e.target.checked)} className="accent-emerald-600" />
        Включити Blank (0-концентрація)
      </label>

      {c0SI > 0 && vTube > 0 && fac > 1 && (
        <div className="space-y-3">
          {/* Summary chips */}
          <div className="flex flex-wrap gap-2 text-[11px]">
            <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 font-semibold text-blue-700">
              Переносити: {fmt(vTransfer)} {volU}
            </span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-semibold text-slate-600">
              Додавати буфер: {fmt(vDiluent)} {volU}
            </span>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700">
              Кін. конц.: {fmt(fromSI(c0SI / Math.pow(fac, nSteps), c0u, ALL_C_SCALE))} {c0u}
            </span>
          </div>

          <DataTable
            cols={["Пробірка", `Концентрація (${c0u})`, "Перенести", "Додати буфер"]}
            rows={tableRows}
          />

          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => navigator.clipboard.writeText(report).catch(() => {})}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-50">
              <Copy className="h-3 w-3" /> Копіювати
            </button>
            {onSave && (
              <button type="button" onClick={() => onSave(report)}
                className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100">
                <Save className="h-3 w-3" /> В журнал
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tab 4: Calibration standards ──────────────────────────────────────────────

const PRESET_SERIES: Record<string, number[]> = {
  "0.1–10":   [0, 0.1, 0.25, 0.5, 1, 2, 5, 10],
  "BSA BCA":  [0, 0.125, 0.25, 0.5, 1, 2],
  "Bradford": [0, 0.1, 0.2, 0.3, 0.5, 0.75, 1.0, 1.5],
  "1–100 µg": [0, 1, 5, 10, 25, 50, 75, 100],
  "DNA/RNA":  [0, 10, 25, 50, 100, 200, 500, 1000],
  "Custom":   [],
};

function CalibrationCalc({ sub, onSave }: { sub: PickedSubstance | null; onSave?: (t: string) => void }) {
  const [cStock, setCStock]   = useState("1");      const [cStockU, setCStockU] = useState<ConcUnit>("mg/mL");
  const [vTotal, setVTotal]   = useState("1000");   const [vTotalU, setVTotalU] = useState<VolumeUnit>("µL");
  const [preset, setPreset]   = useState("BSA BCA");
  const [custom, setCustom]   = useState("0, 0.1, 0.25, 0.5, 1, 2");
  const [concU, setConcU]     = useState<ConcUnit>("mg/mL");

  const targets: number[] = useMemo(() => {
    if (preset === "Custom") {
      return custom.split(/[,;\s]+/).map(Number).filter((n) => isFinite(n) && n >= 0);
    }
    return PRESET_SERIES[preset] ?? [];
  }, [preset, custom]);

  const cStockSI = cStock ? toSI(+cStock, cStockU, ALL_C_SCALE) : 0;
  const vTotalSI = vTotal ? toSI(+vTotal, vTotalU, VOL_SCALE) : 0;

  const rows: string[][] = targets.map((cT, i) => {
    const cTSI    = toSI(cT, concU, ALL_C_SCALE);
    const vStockSI = cStockSI > 0 ? (cTSI * vTotalSI) / cStockSI : 0;
    const vDilSI   = vTotalSI - vStockSI;
    const vSt  = fromSI(vStockSI, vTotalU, VOL_SCALE);
    const vDil = fromSI(vDilSI, vTotalU, VOL_SCALE);
    const ok = vStockSI >= 0 && vDilSI >= 0;
    return [
      `S${i}`,
      cT === 0 ? "Blank (0)" : `${cT} ${concU}`,
      ok ? `${fmt(vSt)} ${vTotalU}` : "⚠",
      ok ? `${fmt(vDil)} ${vTotalU}` : "⚠",
      `${vTotal} ${vTotalU}`,
    ];
  });

  const report = [
    `=== Калібраційні стандарти ===${sub ? ` [${sub.name}]` : ""}`,
    "",
    `Стоковий розчин: ${cStock} ${cStockU}`,
    `Об'єм стандарту: ${vTotal} ${vTotalU}`,
    `Концентрації:    ${targets.join(", ")} ${concU}`,
    "",
    `Ст.# | Концентрація | Стоку | Розчинника | Всього`,
    ...rows.map((r) => r.join(" | ")),
  ].join("\n");

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <LRow label="Стоковий розчин (концентрація)">
          <Num value={cStock} onChange={setCStock} placeholder="1" />
          <UnitSel value={cStockU} options={CONC_UNITS} onChange={setCStockU} />
        </LRow>
        <LRow label="Об'єм кожного стандарту">
          <Num value={vTotal} onChange={setVTotal} placeholder="1000" />
          <UnitSel value={vTotalU} options={VOL_UNITS} onChange={setVTotalU} />
        </LRow>
        <LRow label="Одиниця цільових концентрацій">
          <UnitSel value={concU} options={CONC_UNITS} onChange={setConcU} w="flex-1" />
        </LRow>
      </div>

      {/* Preset selector */}
      <div>
        <p className="mb-1.5 text-[11px] font-semibold text-slate-500">Серія концентрацій</p>
        <div className="flex flex-wrap gap-1.5">
          {Object.keys(PRESET_SERIES).map((p) => (
            <button key={p} type="button" onClick={() => setPreset(p)}
              className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition ${preset === p ? "border-emerald-400 bg-emerald-100 text-emerald-700" : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"}`}>
              {p}
            </button>
          ))}
        </div>
        {preset === "Custom" && (
          <input value={custom} onChange={(e) => setCustom(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-emerald-400"
            placeholder="0, 0.1, 0.5, 1, 2, 5, 10" />
        )}
      </div>

      {targets.length > 0 && cStockSI > 0 && vTotalSI > 0 && (
        <div className="space-y-3">
          <DataTable
            cols={["Стандарт", "Концентрація", "Об'єм стоку", "Об'єм буфера", "Загальний об'єм"]}
            rows={rows}
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => navigator.clipboard.writeText(report).catch(() => {})}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-50">
              <Copy className="h-3 w-3" /> Копіювати
            </button>
            {onSave && (
              <button type="button" onClick={() => onSave(report)}
                className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100">
                <Save className="h-3 w-3" /> В журнал
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tab 5: Stock solution ─────────────────────────────────────────────────────

function StockCalc({ sub, onSave }: { sub: PickedSubstance | null; onSave?: (t: string) => void }) {
  const [mode, setMode] = useState<"dilute" | "mass">("dilute");
  // Dilute mode (C₁→C₂)
  const [cStock, setCStock] = useState("100"); const [cStockU, setCStockU] = useState<ConcUnit>("mM");
  const [cFinal, setCFinal] = useState("10");  const [cFinalU, setCFinalU] = useState<ConcUnit>("µM");
  const [vFinal, setVFinal] = useState("10");  const [vFinalU, setVFinalU] = useState<VolumeUnit>("mL");
  // Mass mode (dissolve powder)
  const [targetC, setTargetC] = useState("1");  const [targetCU, setTargetCU] = useState<MolarUnit>("M");
  const [targetV, setTargetV] = useState("100"); const [targetVU, setTargetVU] = useState<VolumeUnit>("mL");
  const [mw, setMw]           = useState(sub?.mw?.toString() ?? "");
  if (sub && mw === "") setMw(sub.mw.toString());

  // Dilute mode
  const cStockSI  = cStock ? toSI(+cStock, cStockU, ALL_C_SCALE) : 0;
  const cFinalSI  = cFinal ? toSI(+cFinal, cFinalU, ALL_C_SCALE) : 0;
  const vFinalSI  = vFinal ? toSI(+vFinal, vFinalU, VOL_SCALE) : 0;
  const vStockSI  = cStockSI > 0 ? (cFinalSI * vFinalSI) / cStockSI : 0;
  const vDilSI    = vFinalSI - vStockSI;
  const vSt   = fromSI(vStockSI, vFinalU, VOL_SCALE);
  const vDil  = fromSI(vDilSI, vFinalU, VOL_SCALE);
  const dilFac = cStockSI > 0 && cFinalSI > 0 ? cStockSI / cFinalSI : 0;

  // Mass mode
  const targetCSI = targetC ? toSI(+targetC, targetCU, MOLAR_SCALE) : 0;
  const targetVSI = targetV ? toSI(+targetV, targetVU, VOL_SCALE) : 0;
  const mwNum     = mw ? +mw : 0;
  const massNeeded = (targetCSI && targetVSI && mwNum) ? targetCSI * mwNum * targetVSI : 0; // g
  const massMg    = massNeeded * 1e3;

  const reportDilute = vStockSI > 0 ? [
    "=== Приготування робочого розчину з стоку ===",
    "",
    `Стоковий розчин: ${cStock} ${cStockU}`,
    `Кінцева конц.:   ${cFinal} ${cFinalU}`,
    `Кінцевий об'єм:  ${vFinal} ${vFinalU}`,
    `Кратність:       1:${fmt(dilFac)}`,
    "",
    `→ Відібрати стоку:   ${fmt(vSt)} ${vFinalU}`,
    `→ Додати розчинника: ${fmt(vDil)} ${vFinalU}`,
    `→ Перемішати. Фінальний об'єм: ${vFinal} ${vFinalU}`,
  ].join("\n") : "";

  const reportMass = massNeeded > 0 ? [
    `=== Приготування стокового розчину зважуванням ===${sub ? ` [${sub.name}]` : ""}`,
    "",
    `Цільова концентрація: ${targetC} ${targetCU}`,
    `Об'єм розчину:        ${targetV} ${targetVU}`,
    `Молярна маса:         ${mw} г/моль`,
    "",
    `→ Зважити: ${fmt(massMg)} mg (= ${fmt(massNeeded)} g)`,
    `→ Розчинити в ~80% об'єму розчинника (${fmt(fromSI(targetVSI * 0.8, targetVU, VOL_SCALE))} ${targetVU})`,
    `→ Довести до ${targetV} ${targetVU}`,
    `→ Перевірити pH за потреби`,
  ].join("\n") : "";

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
        {([["dilute", "💧 Розведення стоку"], ["mass", "⚖️ З порошку (за масою)"]] as const).map(([m, lbl]) => (
          <button key={m} type="button" onClick={() => setMode(m)}
            className={`flex-1 rounded-md py-1.5 text-[11px] font-semibold transition ${mode === m ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            {lbl}
          </button>
        ))}
      </div>

      {mode === "dilute" ? (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <LRow label="Стоковий (C₁)">
              <div className="space-y-1.5 w-full">
                <Num value={cStock} onChange={setCStock} placeholder="100" />
                <UnitSel value={cStockU} options={CONC_UNITS} onChange={setCStockU} w="w-full" />
              </div>
            </LRow>
            <LRow label="Кінцева конц. (C₂)">
              <div className="space-y-1.5 w-full">
                <Num value={cFinal} onChange={setCFinal} placeholder="10" />
                <UnitSel value={cFinalU} options={CONC_UNITS} onChange={setCFinalU} w="w-full" />
              </div>
            </LRow>
            <LRow label="Кінцевий об'єм (V₂)">
              <div className="space-y-1.5 w-full">
                <Num value={vFinal} onChange={setVFinal} placeholder="10" />
                <UnitSel value={vFinalU} options={VOL_UNITS} onChange={setVFinalU} w="w-full" />
              </div>
            </LRow>
          </div>
          {vStockSI > 0 && vDilSI >= 0 && (
            <Protocol
              title="Протокол приготування"
              steps={[
                `Відібрати ${fmt(vSt)} ${vFinalU} стокового розчину (${cStock} ${cStockU})`,
                `Додати ${fmt(vDil)} ${vFinalU} розчинника (буфер / H₂O)`,
                `Перемішати. Кінцевий об'єм: ${vFinal} ${vFinalU}, конц.: ${cFinal} ${cFinalU}`,
              ]}
              extra={`Кратність розведення: 1:${fmt(dilFac)}`}
              report={reportDilute}
              onSave={onSave}
            />
          )}
        </>
      ) : (
        <>
          {sub && (
            <div className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-xs text-violet-800">
              <span className="font-semibold">{sub.name}</span>
              <span className="ml-2 font-mono">MW = {fmt(sub.mw)} г/моль</span>
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-3">
            <LRow label="Цільова концентрація">
              <div className="space-y-1.5 w-full">
                <Num value={targetC} onChange={setTargetC} placeholder="1" />
                <UnitSel value={targetCU} options={MOLAR_UNITS} onChange={setTargetCU} w="w-full" />
              </div>
            </LRow>
            <LRow label="Кінцевий об'єм">
              <div className="space-y-1.5 w-full">
                <Num value={targetV} onChange={setTargetV} placeholder="100" />
                <UnitSel value={targetVU} options={VOL_UNITS} onChange={setTargetVU} w="w-full" />
              </div>
            </LRow>
            <LRow label="Молярна маса (г/моль)">
              <Num value={mw} onChange={setMw} placeholder="121.14" />
            </LRow>
          </div>
          {massNeeded > 0 && (
            <Protocol
              title="Протокол приготування"
              steps={[
                `Зважити ${fmt(massMg)} mg речовини (= ${fmt(massNeeded * 1e6)} µg = ${fmt(massNeeded)} g)`,
                `Розчинити у ~${fmt(fromSI(targetVSI * 0.8, targetVU, VOL_SCALE))} ${targetVU} розчинника`,
                `За потреби скоригувати pH`,
                `Довести до ${targetV} ${targetVU}. Перемішати, профільтрувати (0.22 µm)`,
              ]}
              extra={`Контроль: ${targetC} ${targetCU} = ${fmt(toSI(+targetC, targetCU, MOLAR_SCALE) * mwNum * 1e3)} mg/mL`}
              report={reportMass}
              onSave={onSave}
            />
          )}
        </>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

type Tab = "dilution" | "molar" | "serial" | "calibration" | "stock";

const TABS: { id: Tab; emoji: string; label: string }[] = [
  { id: "dilution",     emoji: "🧪", label: "Розведення" },
  { id: "molar",        emoji: "⚗️", label: "Молярність" },
  { id: "serial",       emoji: "🔢", label: "Серійні" },
  { id: "calibration",  emoji: "📊", label: "Калібрування" },
  { id: "stock",        emoji: "📦", label: "Стоки" },
];

export function ConcentrationTool({
  onSaveToExperiment,
}: {
  onSaveToExperiment?: (text: string) => void;
}) {
  const [tab, setTab] = useState<Tab>("dilution");
  const [substance, setSubstance] = useState<PickedSubstance | null>(null);

  return (
    <div className="flex flex-col gap-5 p-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-sm">
          <FlaskConical className="h-5 w-5" />
        </div>
        <div>
          <p className="font-semibold text-slate-900">Калькулятор концентрацій</p>
          <p className="text-[11px] text-slate-500">Розведення · Молярність · Серійні · Калібрування · Стоки</p>
        </div>
      </div>

      {/* Substance picker (global) */}
      <SubstancePicker value={substance} onChange={setSubstance} />

      {/* Tab bar */}
      <div className="flex overflow-x-auto rounded-xl border border-slate-200 bg-slate-50/80 p-1 gap-0.5">
        {TABS.map((t) => (
          <button key={t.id} type="button" onClick={() => setTab(t.id)}
            className={`flex flex-1 min-w-max items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-semibold transition ${
              tab === t.id ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}>
            <span>{t.emoji}</span>
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="min-h-[280px]">
        {tab === "dilution"    && <DilutionCalc    onSave={onSaveToExperiment} />}
        {tab === "molar"       && <MolarCalc        sub={substance} onSave={onSaveToExperiment} />}
        {tab === "serial"      && <SerialCalc       onSave={onSaveToExperiment} />}
        {tab === "calibration" && <CalibrationCalc  sub={substance} onSave={onSaveToExperiment} />}
        {tab === "stock"       && <StockCalc        sub={substance} onSave={onSaveToExperiment} />}
      </div>
    </div>
  );
}
