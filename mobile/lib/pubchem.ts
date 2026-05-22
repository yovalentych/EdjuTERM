const PUBCHEM = "https://pubchem.ncbi.nlm.nih.gov/rest/pug";
const PUBCHEM_VIEW = "https://pubchem.ncbi.nlm.nih.gov/rest/pug_view";

export interface PubChemResult {
  cid: number;
  name: string;
  iupacName: string;
  formula: string;
  weightStr: string;
  hazardClass: "none" | "flammable" | "toxic" | "corrosive" | "oxidizing" | "biohazard" | "radioactive";
  hCodes: string[];
}

// ─── H-code → hazard class ────────────────────────────────────────────────────
const TOXIC_H    = new Set(["H300","H301","H302","H310","H311","H312","H330","H331","H332","H340","H341","H350","H351","H360","H361","H370","H371","H372","H373"]);
const FLAMMABLE_H = new Set(["H224","H225","H226","H227","H228","H229","H241","H242","H250","H251","H252"]);
const OXIDIZING_H = new Set(["H270","H271","H272"]);
const CORROSIVE_H = new Set(["H290","H311","H314","H318"]);

function hToHazardClass(hCodes: string[]) {
  if (hCodes.some(h => TOXIC_H.has(h)))    return "toxic"     as const;
  if (hCodes.some(h => FLAMMABLE_H.has(h))) return "flammable" as const;
  if (hCodes.some(h => OXIDIZING_H.has(h))) return "oxidizing" as const;
  if (hCodes.some(h => CORROSIVE_H.has(h))) return "corrosive" as const;
  return "none" as const;
}

// ─── Recursively collect H-codes from any JSON value ─────────────────────────
function collectHCodes(val: unknown, acc: Set<string>) {
  if (typeof val === "string") {
    const m = val.match(/\bH[234]\d{2}\b/g);
    if (m) m.forEach(h => acc.add(h));
  } else if (Array.isArray(val)) {
    val.forEach(v => collectHCodes(v, acc));
  } else if (val && typeof val === "object") {
    Object.values(val).forEach(v => collectHCodes(v, acc));
  }
}

// ─── Main search function ─────────────────────────────────────────────────────
export async function searchByCas(cas: string): Promise<PubChemResult> {
  // 1. Get CID + basic properties
  const propUrl = `${PUBCHEM}/compound/name/${encodeURIComponent(cas.trim())}/property/IUPACName,MolecularFormula,MolecularWeight/JSON`;
  const propRes = await fetch(propUrl);
  if (!propRes.ok) throw new Error("Сполуку не знайдено в PubChem. Перевірте CAS номер.");

  const propData = await propRes.json();
  const prop = propData.PropertyTable?.Properties?.[0];
  if (!prop) throw new Error("Сполуку не знайдено в PubChem.");

  const cid: number = prop.CID;

  // 2. Preferred common name from synonyms
  let name = prop.IUPACName || cas;
  try {
    const synRes = await fetch(`${PUBCHEM}/compound/cid/${cid}/synonyms/JSON`);
    if (synRes.ok) {
      const synData = await synRes.json();
      const synonyms: string[] = synData.InformationList?.Information?.[0]?.Synonym ?? [];
      // pick first synonym that's not a CAS-like number
      const common = synonyms.find(s => !/^\d{2,7}-\d{2}-\d$/.test(s) && s.length < 80);
      if (common) name = common;
    }
  } catch { /* fallback to IUPAC */ }

  // 3. GHS classification for H-codes
  const hCodes: string[] = [];
  try {
    const ghsRes = await fetch(`${PUBCHEM_VIEW}/data/compound/${cid}/JSON?heading=GHS+Classification`);
    if (ghsRes.ok) {
      const ghsData = await ghsRes.json();
      const acc = new Set<string>();
      collectHCodes(ghsData, acc);
      hCodes.push(...acc);
    }
  } catch { /* skip */ }

  const weightStr = prop.MolecularWeight
    ? `${Number(prop.MolecularWeight).toFixed(2)} г/моль`
    : "";

  return {
    cid,
    name,
    iupacName: prop.IUPACName || "",
    formula:   prop.MolecularFormula || "",
    weightStr,
    hazardClass: hToHazardClass(hCodes),
    hCodes,
  };
}
