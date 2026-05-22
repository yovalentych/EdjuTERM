import Link from "next/link";
import {
  Award,
  BookOpen,
  CalendarCheck,
  ExternalLink,
  FileText,
  GraduationCap,
  School,
  User,
  UserCheck,
} from "lucide-react";
import { LiquidCard, LiquidStatTile } from "@/components/ui/liquid";

/**
 * Thesis-блок для item.type = "bachelor" | "master".
 *
 * Простіше за phd-block: немає окремої БД-колекції, читаємо все з item.fields.
 */
export function ThesisBlock({
  item,
  locale,
  legacyProjectId,
}: {
  item: { fields?: Record<string, any>; title?: string; type?: string; supervisor?: string; plannedEndDate?: string };
  locale: string;
  legacyProjectId?: string;
}) {
  const isUk = locale === "uk";
  const f = item.fields || {};
  const isBachelor = item.type === "bachelor";

  const defenseDate = f.defenseDate || item.plannedEndDate;
  const supervisor = f.supervisor || item.supervisor;
  const daysToDefense = defenseDate ? daysBetween(new Date(), new Date(defenseDate)) : null;

  return (
    <div className="flex flex-col gap-5">
      {/* ── Hero ───────────────────────────────────────────── */}
      <LiquidCard tint={isBachelor ? "emerald" : "blue"} accent className="overflow-hidden p-0">
        <div className="relative bg-gradient-to-br from-emerald-50/70 via-white to-blue-50/50 p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <span className={`liquid-eyebrow inline-flex items-center gap-1.5 ${isBachelor ? "text-emerald-700" : "text-blue-700"}`}>
                <GraduationCap className="h-3 w-3" />
                {isBachelor
                  ? (isUk ? "Бакалаврська робота" : "Bachelor's thesis")
                  : (isUk ? "Магістерська робота" : "Master's thesis")}
              </span>
              {f.programName && (
                <p className="mt-1 text-xs text-slate-500">{f.programName}</p>
              )}
            </div>
            {f.finalGrade && (
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl border-2 text-lg font-bold ${gradeBadgeClass(String(f.finalGrade))}`}>
                {f.finalGrade}
              </div>
            )}
          </div>

          {defenseDate && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-xs font-bold text-slate-700">
              <CalendarCheck className="h-3.5 w-3.5" />
              {isUk ? "Захист" : "Defense"}: <span className="font-mono">{defenseDate}</span>
              {daysToDefense != null && (
                <span className={`ml-1 rounded-md px-1.5 py-0.5 text-[10px] ${daysToDefense < 0 ? "bg-slate-100 text-slate-500" : daysToDefense < 30 ? "bg-rose-100 text-rose-700" : daysToDefense < 90 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                  {daysToDefense < 0 ? (isUk ? "пройшов" : "passed") : `${daysToDefense} ${isUk ? "дн" : "d"}`}
                </span>
              )}
            </div>
          )}
        </div>
      </LiquidCard>

      {/* ── Stats ──────────────────────────────────────────── */}
      <section className="grid gap-3 sm:grid-cols-3">
        <LiquidStatTile
          icon={<User className="h-4 w-4" />}
          label={isUk ? "Керівник" : "Supervisor"}
          value={supervisor ? supervisor.split(" ").slice(0, 2).join(" ") : "—"}
          sub={f.opponent ? `${isUk ? "опонент" : "opponent"}: ${String(f.opponent).split(" ")[0]}` : undefined}
          tint="violet"
        />
        <LiquidStatTile
          icon={<School className="h-4 w-4" />}
          label={isUk ? "Інституція" : "Institution"}
          value={f.university ? abbreviate(String(f.university)) : "—"}
          sub={f.faculty || undefined}
          tint="blue"
        />
        <LiquidStatTile
          icon={<Award className="h-4 w-4" />}
          label={isUk ? "Оцінка" : "Grade"}
          value={f.finalGrade ? String(f.finalGrade) : "—"}
          sub={f.finalGrade ? (isUk ? "захищено" : "defended") : (isUk ? "очікується" : "pending")}
          tint="emerald"
        />
      </section>

      {/* ── Meta + Abstract ────────────────────────────────── */}
      <div className="grid gap-4 xl:grid-cols-[1fr_1.2fr]">
        <LiquidCard tint="teal" className="p-0 overflow-hidden">
          <div className="flex items-center gap-2 border-b border-slate-200/60 bg-gradient-to-br from-teal-50/60 via-white to-slate-50/60 px-5 py-3.5">
            <span className="liquid-eyebrow inline-flex items-center gap-1.5">
              <UserCheck className="h-3 w-3" />
              {isUk ? "Учасники й деталі" : "Participants & details"}
            </span>
          </div>
          <div className="divide-y divide-slate-100/70">
            {supervisor && <MetaRow icon={<User />} label={isUk ? "Керівник" : "Supervisor"} value={supervisor} />}
            {f.opponent && <MetaRow icon={<User />} label={isUk ? "Опонент" : "Opponent"} value={String(f.opponent)} />}
            {f.reviewer && <MetaRow icon={<User />} label={isUk ? "Рецензент" : "Reviewer"} value={String(f.reviewer)} />}
            {f.programName && <MetaRow icon={<BookOpen />} label={isUk ? "Програма" : "Program"} value={String(f.programName)} />}
            {f.university && <MetaRow icon={<School />} label={isUk ? "Університет" : "University"} value={String(f.university)} />}
            {f.faculty && <MetaRow icon={<School />} label={isUk ? "Факультет" : "Faculty"} value={String(f.faculty)} />}
            {defenseDate && <MetaRow icon={<CalendarCheck />} label={isUk ? "Дата захисту" : "Defense date"} value={String(defenseDate)} />}
            {!supervisor && !f.opponent && !f.reviewer && !f.programName && !f.university && !f.faculty && !defenseDate && (
              <p className="px-5 py-6 text-center text-xs text-slate-400">
                {isUk ? "Деталей ще немає — заповніть у редакторі." : "No details yet — fill in the editor."}
              </p>
            )}
          </div>
        </LiquidCard>

        <LiquidCard tint="amber" className="p-0 overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200/60 bg-gradient-to-br from-amber-50/60 via-white to-slate-50/60 px-5 py-3.5">
            <span className="liquid-eyebrow inline-flex items-center gap-1.5">
              <FileText className="h-3 w-3" />
              {isUk ? "Анотація" : "Abstract"}
            </span>
            {f.thesisFile && (
              <a
                href={String(f.thesisFile)}
                target="_blank"
                rel="noreferrer"
                className="liquid-pill liquid-pill--tinted text-[10px]"
                data-liquid-tint="amber"
              >
                <ExternalLink className="h-3 w-3" />
                {isUk ? "Файл" : "File"}
              </a>
            )}
          </div>
          <div className="p-5">
            {f.abstract ? (
              <p className="text-sm leading-6 text-slate-700">{String(f.abstract)}</p>
            ) : (
              <p className="text-xs italic text-slate-400">
                {isUk
                  ? "Додайте анотацію у редакторі — короткий опис, мета, методи, висновки."
                  : "Add an abstract in the editor — short summary, goals, methods, conclusions."}
              </p>
            )}
          </div>
        </LiquidCard>
      </div>

      {/* ── CTA ────────────────────────────────────────────── */}
      {legacyProjectId && (
        <Link
          href={`/${locale}/app/project?projectId=${legacyProjectId}`}
          className="liquid-cta self-start inline-flex"
        >
          <ExternalLink className="h-4 w-4" />
          {isUk ? "Відкрити робочий простір" : "Open workbench"}
        </Link>
      )}
    </div>
  );
}

function MetaRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 px-5 py-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 [&>svg]:h-3.5 [&>svg]:w-3.5">
        {icon}
      </span>
      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</span>
      <span className="ml-auto truncate text-sm font-semibold text-slate-900">{value}</span>
    </div>
  );
}

function gradeBadgeClass(grade: string): string {
  const g = grade.trim().toUpperCase();
  if (g === "A" || g === "5") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (["B", "C", "4"].includes(g)) return "border-blue-200 bg-blue-50 text-blue-700";
  if (["D", "E", "3"].includes(g)) return "border-amber-200 bg-amber-50 text-amber-700";
  if (["F", "FX", "2"].includes(g)) return "border-rose-200 bg-rose-50 text-rose-700";
  return "border-slate-200 bg-slate-50 text-slate-500";
}

function daysBetween(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / (24 * 3600 * 1000));
}

function abbreviate(s: string): string {
  if (s.length <= 30) return s;
  // Спроба зробити акронім з великих слів
  const words = s.split(/\s+/).filter((w) => w[0] && w[0] === w[0].toUpperCase());
  if (words.length >= 2) return words.map((w) => w[0]).join("");
  return s.slice(0, 28) + "…";
}
