// ECTS grade thresholds (Bologna system)
export function scoreToGrade(score: number | null): string {
  if (score === null) return "—";
  if (score >= 90) return "A";
  if (score >= 82) return "B";
  if (score >= 74) return "C";
  if (score >= 64) return "D";
  if (score >= 60) return "E";
  if (score >= 35) return "FX";
  return "F";
}

export function gradeToNational(grade: string): string {
  if (grade === "A") return "Відмінно";
  if (grade === "B" || grade === "C") return "Добре";
  if (grade === "D" || grade === "E") return "Задовільно";
  return "Незадовільно";
}

export function gradeColor(grade: string): string {
  if (grade === "A")  return "text-emerald-700 bg-emerald-50 border-emerald-200";
  if (grade === "B")  return "text-blue-700 bg-blue-50 border-blue-200";
  if (grade === "C")  return "text-sky-700 bg-sky-50 border-sky-200";
  if (grade === "D")  return "text-amber-700 bg-amber-50 border-amber-200";
  if (grade === "E")  return "text-orange-700 bg-orange-50 border-orange-200";
  if (grade === "FX") return "text-rose-600 bg-rose-50 border-rose-200";
  if (grade === "F")  return "text-red-800 bg-red-50 border-red-300";
  return "text-stone-500 bg-stone-50 border-stone-200";
}
