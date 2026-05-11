"use client";

import { AlertCircle, ChevronDown, ChevronUp, Copy, Dna, FlaskConical, Loader2, RotateCcw, Save, Zap } from "lucide-react";
import { useId, useReducer, useRef, useState } from "react";

// ── Pure bioinformatics functions (ported from kpi_PrimersReport) ─────────────

function sanitizeSequence(raw: string): string {
  return raw
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith(">"))
    .join("")
    .replace(/\s+/g, "")
    .toUpperCase();
}

function getGcCount(seq: string): number {
  return [...seq].filter((b) => b === "G" || b === "C").length;
}

function getGcPercent(seq: string): number {
  return seq.length ? (getGcCount(seq) / seq.length) * 100 : 0;
}

function getTm(seq: string): number {
  const gc = getGcCount(seq);
  return gc * 4 + (seq.length - gc) * 2;
}

function complement(seq: string): string {
  const map: Record<string, string> = { A: "T", T: "A", C: "G", G: "C" };
  return [...seq].map((b) => map[b] ?? "N").join("");
}

function reverseComplement(seq: string): string {
  return complement(seq).split("").reverse().join("");
}

function validateSequence(seq: string): string {
  if (!seq) return "Вставте ДНК-послідовність або FASTA.";
  if (/[^ACGT]/.test(seq)) return "Послідовність має містити тільки A, C, G, T.";
  if (seq.length < 45) return "Мінімум 45 bp для підбору пари праймерів.";
  return "";
}

function getEndGcCount(seq: string): number {
  return getGcCount(seq.slice(-5));
}

function getMaxHomopolymerRun(seq: string): number {
  let max = 1, cur = 1;
  for (let i = 1; i < seq.length; i++) {
    cur = seq[i] === seq[i - 1] ? cur + 1 : 1;
    max = Math.max(max, cur);
  }
  return max;
}

function getMaxDinucleotideRun(seq: string): number {
  let max = 1;
  for (let i = 0; i <= seq.length - 4; i++) {
    const motif = seq.slice(i, i + 2);
    let run = 1, cursor = i + 2;
    while (seq.slice(cursor, cursor + 2) === motif) { run++; cursor += 2; }
    max = Math.max(max, run);
  }
  return max;
}

function getSelfComplementarityScore(seq: string): number {
  const rc = reverseComplement(seq);
  let best = 0;
  for (let l = 0; l < seq.length; l++)
    for (let r = 0; r < rc.length; r++) {
      let len = 0;
      while (seq[l + len] && seq[l + len] === rc[r + len]) len++;
      best = Math.max(best, len);
    }
  return best;
}

function getPairComplementarityScore(fwd: string, rev: string): number {
  const rcRev = reverseComplement(rev);
  let best = 0;
  for (let l = 0; l < fwd.length; l++)
    for (let r = 0; r < rcRev.length; r++) {
      let len = 0;
      while (fwd[l + len] && fwd[l + len] === rcRev[r + len]) len++;
      best = Math.max(best, len);
    }
  return best;
}

function getThreePrimeComplementarityScore(fwd: string, rev: string): number {
  const ft = fwd.slice(-5);
  const rtRc = reverseComplement(rev.slice(-5));
  let best = 0;
  for (let l = 0; l < ft.length; l++)
    for (let r = 0; r < rtRc.length; r++) {
      let len = 0;
      while (ft[l + len] && ft[l + len] === rtRc[r + len]) len++;
      best = Math.max(best, len);
    }
  return best;
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface PrimerSettings {
  minLength: number; optLength: number; maxLength: number;
  minGc: number; maxGc: number;
  minTm: number; optTm: number; maxTm: number;
  maxDeltaTm: number;
  minProduct: number; maxProduct: number;
  maxRun: number; candidateLimit: number;
}

interface Primer {
  name: string; sequence: string; direction: "forward" | "reverse";
  start: number; end: number; length: number;
  gcCount: number; gcPercent: number; tm: number;
  endGcCount: number; maxRun: number; maxDinucleotideRun: number;
  selfComplementarity: number; score: number;
}

interface PrimerPair {
  forward: Primer; reverse: Primer;
  deltaTm: number; deltaGc: number; ampliconSize: number;
  pairComplementarity: number; threePrimeComplementarity: number;
  pairScore: number;
}

const DEFAULT_SETTINGS: PrimerSettings = {
  minLength: 18, optLength: 20, maxLength: 25,
  minGc: 40, maxGc: 60,
  minTm: 50, optTm: 60, maxTm: 72,
  maxDeltaTm: 5,
  minProduct: 80, maxProduct: 1200,
  maxRun: 4, candidateLimit: 10,
};

// ── Algorithm ─────────────────────────────────────────────────────────────────

function analyzePrimer(name: string, sequence: string, start: number, end: number, direction: "forward" | "reverse"): Primer {
  return {
    name, sequence, direction, start, end,
    length: sequence.length,
    gcCount: getGcCount(sequence),
    gcPercent: getGcPercent(sequence),
    tm: getTm(sequence),
    endGcCount: getEndGcCount(sequence),
    maxRun: getMaxHomopolymerRun(sequence),
    maxDinucleotideRun: getMaxDinucleotideRun(sequence),
    selfComplementarity: getSelfComplementarityScore(sequence),
    score: 0,
  };
}

function scorePrimer(p: Primer, s: PrimerSettings): number {
  const gcTarget = (s.minGc + s.maxGc) / 2;
  const gcPenalty    = Math.abs(p.gcPercent - gcTarget) * 1.35;
  const tmPenalty    = Math.abs(p.tm - s.optTm) * 2.2;
  const lenPenalty   = Math.abs(p.length - s.optLength) * 1.4;
  const clampPenalty = /[GC]$/.test(p.sequence) ? 0 : 12;
  const endGcPenalty = p.endGcCount > 3 ? (p.endGcCount - 3) * 4 : 0;
  const runPenalty   = p.maxRun > s.maxRun ? (p.maxRun - s.maxRun) * 8 : 0;
  const repeatPenalty= p.maxDinucleotideRun >= 4 ? (p.maxDinucleotideRun - 3) * 5 : 0;
  const selfPenalty  = p.selfComplementarity > 3 ? (p.selfComplementarity - 3) * 4 : 0;
  return 100 - gcPenalty - tmPenalty - lenPenalty - clampPenalty - endGcPenalty - runPenalty - repeatPenalty - selfPenalty;
}

function findCandidates(sequence: string, side: "forward" | "reverse", s: PrimerSettings): Primer[] {
  const out: Primer[] = [];
  for (let start = 0; start <= sequence.length - s.minLength; start++) {
    for (let len = s.minLength; len <= s.maxLength; len++) {
      const end = start + len;
      const raw = sequence.slice(start, end);
      if (raw.length !== len) continue;
      const seq = side === "forward" ? raw : reverseComplement(raw);
      const p = analyzePrimer(side === "forward" ? "Forward" : "Reverse", seq, start + 1, end, side);
      const gcOk  = p.gcPercent >= s.minGc && p.gcPercent <= s.maxGc;
      const tmOk  = p.tm >= s.minTm && p.tm <= s.maxTm;
      if (gcOk && tmOk && /[GC]$/.test(p.sequence) && p.endGcCount <= 3 && p.maxRun <= s.maxRun && p.maxDinucleotideRun < 4) {
        out.push({ ...p, score: scorePrimer(p, s) });
      }
    }
  }
  return out.sort((a, b) => b.score - a.score);
}

function findPrimerPairs(sequence: string, s: PrimerSettings): PrimerPair[] {
  const fwdCandidates = findCandidates(sequence, "forward", s);
  const revCandidates = findCandidates(sequence, "reverse", s);
  if (!fwdCandidates.length || !revCandidates.length)
    throw new Error("Не вдалося знайти праймери. Розширте параметри (довжину, GC або Tm).");

  const pairs: PrimerPair[] = [];
  const topF = fwdCandidates.slice(0, 350);
  const topR = revCandidates.slice(0, 350);
  const productTarget = (s.minProduct + s.maxProduct) / 2;

  for (const f of topF) {
    for (const r of topR) {
      if (r.start <= f.end) continue;
      const ampliconSize = r.end - f.start + 1;
      if (ampliconSize < s.minProduct || ampliconSize > s.maxProduct) continue;
      const deltaTm = Math.abs(f.tm - r.tm);
      if (deltaTm > s.maxDeltaTm) continue;
      const deltaGc = Math.abs(f.gcPercent - r.gcPercent);
      const pc  = getPairComplementarityScore(f.sequence, r.sequence);
      const tp  = getThreePrimeComplementarityScore(f.sequence, r.sequence);
      const productPenalty = Math.abs(ampliconSize - productTarget) / Math.max(productTarget, 1) * 12;
      const pairPenalty = pc > 4 ? (pc - 4) * 5 : 0;
      const tailPenalty = tp > 2 ? (tp - 2) * 10 : 0;
      pairs.push({ forward: f, reverse: r, deltaTm, deltaGc, ampliconSize, pairComplementarity: pc, threePrimeComplementarity: tp,
        pairScore: f.score + r.score - deltaTm * 4 - deltaGc * 0.7 - productPenalty - pairPenalty - tailPenalty });
    }
  }

  const seen = new Set<string>();
  const unique: PrimerPair[] = [];
  pairs.sort((a, b) => b.pairScore - a.pairScore).forEach((p) => {
    const key = `${p.forward.start}-${p.forward.end}-${p.reverse.start}-${p.reverse.end}`;
    if (!seen.has(key)) { unique.push(p); seen.add(key); }
  });

  if (!unique.length) throw new Error("Немає пар у заданому діапазоні продукту або ΔTm.");
  return unique.slice(0, s.candidateLimit);
}

function fmtScore(n: number): number { return Math.min(100, Math.max(0, Math.round(n))); }

// ── Sample sequence ───────────────────────────────────────────────────────────

const SAMPLE = `>Mycobacterium tuberculosis rpoB target
GTGGACACGTACGCGGGTGCTTACGACCGTCAGTCGCGCGAGCGCGAGAATTCGAGCGCAGCAAGCCCAGCGACACAGCGTAGCGCCAACGAAGACAAGGCGGCCGACCTTCAGCGCGAAGTCGAGCGCGACGGGGGCCGGTTCAGGTTCGTCGGGCATTTCAGCGAAGCGCCGGGCACGTCGGCGTTCGGGACGGCGGAGCGCCCGGAGTTCGAACGCATCCTGAACGAATGCCGCGCCGGGCGGCTCAACATGATCATTGTCTATGACGTGTCGCGCTTCTCGCGCCTGAAGGTCATGGACGCGATTCCGATTGTCTCGGAATTGCTCGCCCTGGGCGTGACGATTGTTTCCACTCAGGAAGGCGTCTTCCGGCAGGGAAACGTCATGGACCTGATTCACCTGATTATGCGGCTCGACGCGTCGCACAAAGAATCTTCGCTGAAGTCGGCGAAGATTCTCGACACGAAGAACCTTCAGCGCGAATTGGGCGGGTACGTCGGCGGGAAGGCGCCTTACGGCTTCGAGCTTGTTTCGGAGACGAAGGAGATCACGCGCAACGGCCGAATGGTCAATGTCGTCATCAACAAGCTTGCGCACTCGACCACTCCCCTTACCGGACCCTTCGAGTTCGAGCCCGACGTAATCCGGTGG`;

// ── Component ─────────────────────────────────────────────────────────────────

export function PCRPrimerTool({
  onSaveToExperiment,
}: {
  onSaveToExperiment?: (text: string) => void;
}) {
  const [sequence, setSequence] = useState("");
  const [settings, setSettings] = useState<PrimerSettings>(DEFAULT_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pairs, setPairs] = useState<PrimerPair[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [copied, setCopied] = useState(false);
  const seqId = useId();

  const baseCount = sanitizeSequence(sequence).length;
  const gcPercent = baseCount ? getGcPercent(sanitizeSequence(sequence)).toFixed(1) : "—";

  function handleAnalyze() {
    const clean = sanitizeSequence(sequence);
    const err = validateSequence(clean);
    if (err) { setError(err); setPairs([]); return; }
    setError("");
    setLoading(true);
    setTimeout(() => {
      try {
        const result = findPrimerPairs(clean, settings);
        setPairs(result);
        setSelectedIdx(0);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        setPairs([]);
      } finally {
        setLoading(false);
      }
    }, 10);
  }

  function buildReport(pair: PrimerPair): string {
    return [
      `=== ПЛР Звіт праймерів ===`,
      ``,
      `Прямий праймер (Forward):`,
      `  Послідовність: 5'-${pair.forward.sequence}-3'`,
      `  Позиція: ${pair.forward.start}–${pair.forward.end} bp`,
      `  Довжина: ${pair.forward.length} bp`,
      `  GC: ${pair.forward.gcPercent.toFixed(1)}%  |  Tm: ${pair.forward.tm}°C`,
      `  Оцінка: ${fmtScore(pair.forward.score)}/100`,
      ``,
      `Зворотний праймер (Reverse):`,
      `  Послідовність: 5'-${pair.reverse.sequence}-3'`,
      `  Позиція: ${pair.reverse.start}–${pair.reverse.end} bp`,
      `  Довжина: ${pair.reverse.length} bp`,
      `  GC: ${pair.reverse.gcPercent.toFixed(1)}%  |  Tm: ${pair.reverse.tm}°C`,
      `  Оцінка: ${fmtScore(pair.reverse.score)}/100`,
      ``,
      `Ампліконовий продукт: ${pair.ampliconSize} bp`,
      `ΔTm: ${pair.deltaTm.toFixed(1)}°C`,
      `Оцінка пари: ${fmtScore(pair.pairScore)}/100`,
    ].join("\n");
  }

  async function handleCopy(text: string) {
    await navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const bestPair = pairs[selectedIdx];

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
          <Dna className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">ПЛР Дизайнер Праймерів</p>
          <p className="text-[10px] text-slate-500">PCR Primer Design Tool</p>
        </div>
      </div>

      {/* ── Sequence input ──────────────────────────────────────────────── */}
      <div>
        <div className="mb-1 flex items-center justify-between">
          <label htmlFor={seqId} className="text-xs font-semibold text-slate-600">
            ДНК-послідовність або FASTA
          </label>
          <div className="flex items-center gap-2">
            {baseCount > 0 && (
              <span className="font-mono text-[10px] text-slate-400">
                {baseCount} bp · GC {gcPercent}%
              </span>
            )}
            <button
              type="button"
              onClick={() => setSequence(SAMPLE)}
              className="rounded border border-slate-200 px-2 py-0.5 text-[10px] text-slate-500 transition hover:border-violet-300 hover:text-violet-600"
            >
              Зразок
            </button>
            {sequence && (
              <button
                type="button"
                onClick={() => { setSequence(""); setPairs([]); setError(""); }}
                className="rounded border border-slate-200 px-2 py-0.5 text-[10px] text-slate-500 transition hover:border-rose-300 hover:text-rose-600"
              >
                <RotateCcw className="inline h-2.5 w-2.5" /> Очистити
              </button>
            )}
          </div>
        </div>
        <textarea
          id={seqId}
          value={sequence}
          onChange={(e) => setSequence(e.target.value)}
          placeholder=">Gene_name&#10;ATCGATCGATCG..."
          rows={5}
          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-800 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-1 focus:ring-violet-200"
        />
      </div>

      {/* ── Settings (collapsible) ──────────────────────────────────────── */}
      <div className="rounded-lg border border-slate-200">
        <button
          type="button"
          onClick={() => setShowSettings((p) => !p)}
          className="flex w-full items-center justify-between px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          <span>⚙️ Параметри підбору</span>
          {showSettings ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
        {showSettings && (
          <div className="border-t border-slate-100 p-3">
            <div className="grid grid-cols-3 gap-3 text-xs">
              <SettingGroup label="Довжина праймера (bp)">
                <SettingRow label="Min" value={settings.minLength} onChange={(v) => setSettings((p) => ({ ...p, minLength: v }))} min={10} max={40} />
                <SettingRow label="Opt" value={settings.optLength} onChange={(v) => setSettings((p) => ({ ...p, optLength: v }))} min={10} max={40} />
                <SettingRow label="Max" value={settings.maxLength} onChange={(v) => setSettings((p) => ({ ...p, maxLength: v }))} min={10} max={40} />
              </SettingGroup>
              <SettingGroup label="GC%">
                <SettingRow label="Min" value={settings.minGc} onChange={(v) => setSettings((p) => ({ ...p, minGc: v }))} min={0} max={100} />
                <SettingRow label="Max" value={settings.maxGc} onChange={(v) => setSettings((p) => ({ ...p, maxGc: v }))} min={0} max={100} />
              </SettingGroup>
              <SettingGroup label="Tm (°C)">
                <SettingRow label="Min" value={settings.minTm} onChange={(v) => setSettings((p) => ({ ...p, minTm: v }))} min={30} max={90} />
                <SettingRow label="Opt" value={settings.optTm} onChange={(v) => setSettings((p) => ({ ...p, optTm: v }))} min={30} max={90} />
                <SettingRow label="Max" value={settings.maxTm} onChange={(v) => setSettings((p) => ({ ...p, maxTm: v }))} min={30} max={90} />
              </SettingGroup>
              <SettingGroup label="Продукт (bp)">
                <SettingRow label="Min" value={settings.minProduct} onChange={(v) => setSettings((p) => ({ ...p, minProduct: v }))} min={50} max={5000} />
                <SettingRow label="Max" value={settings.maxProduct} onChange={(v) => setSettings((p) => ({ ...p, maxProduct: v }))} min={50} max={5000} />
              </SettingGroup>
              <SettingGroup label="Обмеження">
                <SettingRow label="ΔTm max" value={settings.maxDeltaTm} onChange={(v) => setSettings((p) => ({ ...p, maxDeltaTm: v }))} min={0} max={20} />
                <SettingRow label="Run max" value={settings.maxRun} onChange={(v) => setSettings((p) => ({ ...p, maxRun: v }))} min={2} max={8} />
              </SettingGroup>
              <SettingGroup label="Результати">
                <SettingRow label="Кількість пар" value={settings.candidateLimit} onChange={(v) => setSettings((p) => ({ ...p, candidateLimit: v }))} min={1} max={50} />
              </SettingGroup>
            </div>
            <button
              type="button"
              onClick={() => setSettings(DEFAULT_SETTINGS)}
              className="mt-2 text-[10px] text-slate-400 transition hover:text-violet-600"
            >
              ↺ Скинути до стандартних
            </button>
          </div>
        )}
      </div>

      {/* ── Analyze button ──────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={handleAnalyze}
        disabled={loading || !sequence.trim()}
        className="flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
        {loading ? "Аналізую…" : "Підібрати праймери"}
      </button>

      {/* ── Error ───────────────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {error}
        </div>
      )}

      {/* ── Results ─────────────────────────────────────────────────────── */}
      {pairs.length > 0 && (
        <div className="space-y-3">
          {/* Pair selector */}
          {pairs.length > 1 && (
            <div className="flex flex-wrap gap-1.5">
              {pairs.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedIdx(i)}
                  className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition ${
                    selectedIdx === i
                      ? "border-violet-400 bg-violet-600 text-white"
                      : "border-slate-200 text-slate-600 hover:border-violet-300"
                  }`}
                >
                  Пара {i + 1} · {fmtScore(pairs[i].pairScore)}/100
                </button>
              ))}
            </div>
          )}

          {bestPair && (
            <>
              {/* Pair stats */}
              <div className="grid grid-cols-3 gap-2 rounded-xl border border-violet-100 bg-violet-50/60 p-3">
                <StatCell label="Ампліkon" value={`${bestPair.ampliconSize} bp`} />
                <StatCell label="ΔTm" value={`${bestPair.deltaTm.toFixed(1)}°C`} accent={bestPair.deltaTm > 4} />
                <StatCell label="Оцінка пари" value={`${fmtScore(bestPair.pairScore)}/100`} />
              </div>

              {/* Primer cards */}
              <div className="grid gap-2 sm:grid-cols-2">
                <PrimerCard primer={bestPair.forward} onCopy={handleCopy} />
                <PrimerCard primer={bestPair.reverse} onCopy={handleCopy} />
              </div>

              {/* Amplicon map */}
              <AmpliconMap sequence={sanitizeSequence(sequence)} pair={bestPair} />

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleCopy(buildReport(bestPair))}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <Copy className="h-3 w-3" />
                  {copied ? "Скопійовано!" : "Копіювати звіт"}
                </button>
                {onSaveToExperiment && (
                  <button
                    type="button"
                    onClick={() => onSaveToExperiment(buildReport(bestPair))}
                    className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                  >
                    <Save className="h-3 w-3" />
                    Зберегти в журнал
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SettingGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      {children}
    </div>
  );
}

function SettingRow({ label, value, onChange, min, max }: {
  label: string; value: number; onChange: (v: number) => void; min: number; max: number;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[10px] text-slate-500">{label}</span>
      <input
        type="number"
        value={value}
        min={min} max={max}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-16 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-right font-mono text-[11px] text-slate-800 outline-none focus:border-violet-300"
      />
    </div>
  );
}

function StatCell({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="text-center">
      <p className="text-[10px] text-violet-500">{label}</p>
      <p className={`font-mono text-sm font-bold ${accent ? "text-amber-600" : "text-violet-900"}`}>{value}</p>
    </div>
  );
}

function PrimerCard({ primer, onCopy }: { primer: Primer; onCopy: (t: string) => void }) {
  const isForward = primer.direction === "forward";
  const color = isForward
    ? "border-blue-200 bg-blue-50/50"
    : "border-rose-200 bg-rose-50/50";
  const label = isForward ? "Forward →" : "← Reverse";
  const scoreColor = primer.score >= 75 ? "text-emerald-600" : primer.score >= 50 ? "text-amber-600" : "text-rose-600";

  return (
    <div className={`rounded-xl border p-3 ${color}`}>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
        <span className={`font-mono text-xs font-bold ${scoreColor}`}>{fmtScore(primer.score)}/100</span>
      </div>
      <div
        className="mb-2 cursor-pointer rounded bg-white/70 px-2 py-1.5 font-mono text-xs text-slate-800 transition hover:bg-white"
        title="Клік → копіювати"
        onClick={() => onCopy(`5'-${primer.sequence}-3'`)}
      >
        5'-<span className={isForward ? "text-blue-700" : "text-rose-700"}>{primer.sequence}</span>-3'
      </div>
      <div className="grid grid-cols-3 gap-1 text-[10px]">
        <MetaCell label="Довж." value={`${primer.length} bp`} />
        <MetaCell label="GC" value={`${primer.gcPercent.toFixed(0)}%`} />
        <MetaCell label="Tm" value={`${primer.tm}°C`} />
        <MetaCell label="Позиція" value={`${primer.start}–${primer.end}`} />
        <MetaCell label="GC-кінець" value={`${primer.endGcCount}/5`} accent={primer.endGcCount > 3} />
        <MetaCell label="Самодопов." value={`${primer.selfComplementarity}`} accent={primer.selfComplementarity > 4} />
      </div>
    </div>
  );
}

function MetaCell({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className="text-[9px] text-slate-400">{label}</p>
      <p className={`font-mono font-semibold ${accent ? "text-amber-600" : "text-slate-700"}`}>{value}</p>
    </div>
  );
}

function AmpliconMap({ sequence, pair }: { sequence: string; pair: PrimerPair }) {
  if (!sequence) return null;
  const total = sequence.length;
  const fStart = (pair.forward.start - 1) / total * 100;
  const fEnd   = pair.forward.end / total * 100;
  const rStart = (pair.reverse.start - 1) / total * 100;
  const rEnd   = pair.reverse.end / total * 100;
  const ampStart = fStart;
  const ampEnd   = rEnd;

  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        Карта ампліkону · {total} bp
      </p>
      <div className="relative h-6 rounded-full bg-slate-200">
        {/* Amplicon */}
        <div
          className="absolute inset-y-0 rounded-full bg-violet-200"
          style={{ left: `${ampStart}%`, width: `${ampEnd - ampStart}%` }}
        />
        {/* Forward */}
        <div
          className="absolute inset-y-1 rounded bg-blue-500"
          style={{ left: `${fStart}%`, width: `${fEnd - fStart}%` }}
        />
        {/* Reverse */}
        <div
          className="absolute inset-y-1 rounded bg-rose-500"
          style={{ left: `${rStart}%`, width: `${rEnd - rStart}%` }}
        />
      </div>
      <div className="mt-1.5 flex justify-between text-[9px] text-slate-400">
        <span>1</span>
        <span className="flex gap-3">
          <span className="flex items-center gap-1"><span className="inline-block h-2 w-3 rounded-sm bg-blue-500" /> Fwd</span>
          <span className="flex items-center gap-1"><span className="inline-block h-2 w-3 rounded-sm bg-violet-200" /> Ампліkон</span>
          <span className="flex items-center gap-1"><span className="inline-block h-2 w-3 rounded-sm bg-rose-500" /> Rev</span>
        </span>
        <span>{total}</span>
      </div>
    </div>
  );
}
