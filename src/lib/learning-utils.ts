export function scoreToGrade(score: number | null): string {
  if (score === null) return "—";
  if (score >= 90) return "A";
  if (score >= 75) return "B";
  if (score >= 60) return "C";
  if (score >= 40) return "D";
  return "F";
}

export function gradeColor(grade: string): string {
  if (grade === "A") return "text-emerald-700 bg-emerald-50 border-emerald-200";
  if (grade === "B") return "text-blue-700 bg-blue-50 border-blue-200";
  if (grade === "C") return "text-amber-700 bg-amber-50 border-amber-200";
  if (grade === "D") return "text-orange-700 bg-orange-50 border-orange-200";
  if (grade === "F") return "text-rose-700 bg-rose-50 border-rose-200";
  return "text-stone-500 bg-stone-50 border-stone-200";
}
