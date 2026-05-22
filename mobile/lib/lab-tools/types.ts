// --- Units ---

export type ConcUnit = 'M' | 'mM' | 'uM' | 'nM' | 'pM' | 'mg/mL' | 'ug/mL' | 'ng/uL' | 'g/L' | '%w/v' | '%v/v' | 'x';
export type VolUnit = 'L' | 'mL' | 'uL' | 'nL';
export type MassUnit = 'kg' | 'g' | 'mg' | 'ug' | 'ng';

// --- Database Types ---

export interface Substance {
  id: string;
  name: string;
  aliases?: string[];
  formula?: string;
  mw?: number; // Molecular Weight (g/mol)
  mwUnit?: 'g/mol' | 'kDa';
  category: 'salt' | 'buffer' | 'antibiotic' | 'protein' | 'dye' | 'nucleic_acid' | 'other';
  notes?: string;
}

// --- Calculation Results ---

export interface CalcWarning {
  type: 'danger' | 'warning' | 'info';
  message: string;
}

export interface DilutionResult {
  stockVol: number;
  stockVolUnit: VolUnit;
  diluentVol: number;
  diluentVolUnit: VolUnit;
  instructions: string[];
  warnings: CalcWarning[];
}

export interface PowderResult {
  mass: number;
  massUnit: MassUnit;
  instructions: string[];
  warnings: CalcWarning[];
}
