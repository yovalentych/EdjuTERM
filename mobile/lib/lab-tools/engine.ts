import { ConcUnit, VolUnit, MassUnit, CalcWarning, DilutionResult, PowderResult } from './types';

// --- Multipliers ---

const M_TO_BASE = { 'M': 1, 'mM': 1e-3, 'uM': 1e-6, 'nM': 1e-9, 'pM': 1e-12 };
const G_TO_BASE = { 'g/L': 1, 'mg/mL': 1, 'ug/mL': 1e-3, 'ng/uL': 1 }; // all map to g/L
const VOL_TO_BASE = { 'L': 1, 'mL': 1e-3, 'uL': 1e-6, 'nL': 1e-9 };
const MASS_TO_BASE = { 'kg': 1000, 'g': 1, 'mg': 1e-3, 'ug': 1e-6, 'ng': 1e-9 };

// --- Conversion Engine ---

export function getMolarBase(val: number, unit: ConcUnit): number {
  if (unit in M_TO_BASE) return val * (M_TO_BASE[unit as keyof typeof M_TO_BASE]);
  return 0; // Not a molar unit
}

export function getMassConcBase(val: number, unit: ConcUnit): number {
  if (unit === 'g/L' || unit === 'mg/mL') return val;
  if (unit === 'ug/mL') return val * 1e-3;
  if (unit === 'ng/uL') return val;
  return 0;
}

export function getVolBase(val: number, unit: VolUnit): number {
  return val * VOL_TO_BASE[unit];
}

export function formatVol(baseVal: number): { val: number; unit: VolUnit } {
  if (baseVal >= 1) return { val: baseVal, unit: 'L' };
  if (baseVal >= 1e-3) return { val: baseVal * 1e3, unit: 'mL' };
  if (baseVal >= 1e-6) return { val: baseVal * 1e6, unit: 'uL' };
  return { val: baseVal * 1e9, unit: 'nL' };
}

export function formatMass(baseVal: number): { val: number; unit: MassUnit } {
  if (baseVal >= 1000) return { val: baseVal / 1000, unit: 'kg' };
  if (baseVal >= 1) return { val: baseVal, unit: 'g' };
  if (baseVal >= 1e-3) return { val: baseVal * 1e3, unit: 'mg' };
  if (baseVal >= 1e-6) return { val: baseVal * 1e6, unit: 'ug' };
  return { val: baseVal * 1e9, unit: 'ng' };
}

// --- Calculators ---

/**
 * Dilution: C1V1 = C2V2
 */
export function calculateDilution(
  c1: number, u1: ConcUnit, 
  c2: number, u2: ConcUnit, 
  v2: number, vu2: VolUnit
): DilutionResult {
  const warnings: CalcWarning[] = [];
  
  // Basic sanity check: both must be same type (molar or mass) or one is 'x'
  // For now, let's assume molar for simplicity in MVP
  const c1Base = getMolarBase(c1, u1);
  const c2Base = getMolarBase(c2, u2);
  const v2Base = getVolBase(v2, vu2);

  if (c2Base > c1Base) {
    warnings.push({ type: 'danger', message: 'Цільова концентрація вища за сток!' });
  }

  const v1Base = (c2Base * v2Base) / c1Base;
  const { val: sVal, unit: sUnit } = formatVol(v1Base);
  const diluentBase = v2Base - v1Base;
  const { val: dVal, unit: dUnit } = formatVol(diluentBase);

  if (sVal < 0.5 && sUnit === 'uL') {
    warnings.push({ type: 'warning', message: 'Об\'єм стоку занадто малий для точного піпетування (<0.5 мкл).' });
  }

  return {
    stockVol: sVal,
    stockVolUnit: sUnit,
    diluentVol: dVal,
    diluentVolUnit: dUnit,
    instructions: [
      `Візьміть ${sVal.toFixed(2)} ${sUnit} стокового розчину.`,
      `Додайте ${dVal.toFixed(2)} ${dUnit} розчинника (води або буфера).`,
      `Перемішайте до однорідності.`
    ],
    warnings
  };
}

/**
 * m = C * V * MW
 */
export function calculatePowder(
  targetC: number, u: ConcUnit,
  volume: number, vu: VolUnit,
  mw: number
): PowderResult {
  const cBase = getMolarBase(targetC, u);
  const vBase = getVolBase(volume, vu);
  
  const massBase = cBase * vBase * mw; // m = (mol/L) * L * (g/mol) = g
  const { val, unit } = formatMass(massBase);

  return {
    mass: val,
    massUnit: unit,
    instructions: [
      `Зважте ${val.toFixed(4)} ${unit} речовини.`,
      `Розчиніть у меншому об'ємі розчинника (~80% від кінцевого).`,
      `Доведіть розчин до кінцевого об'єму ${volume} ${vu}.`
    ],
    warnings: val < 0.001 && unit === 'mg' ? [{ type: 'warning', message: 'Маса занадто мала для стандартних ваг.' }] : []
  };
}
