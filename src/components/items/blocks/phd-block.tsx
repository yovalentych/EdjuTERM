import Link from "next/link";
import {
  Award,
  BookOpen,
  CalendarDays,
  ExternalLink,
  Flag,
  GraduationCap,
  Sparkles,
  Target,
  User,
} from "lucide-react";
import { LiquidCard, LiquidStatTile } from "@/components/ui/liquid";
import { getPhdPlan } from "@/lib/phd-plan";

/**
 * PhD-блок для item.type = "phd".
 *
 * Серверний компонент. Тягне існуючий phdPlan за projectId і показує:
 *   • Стипендія прогресу (credits earned / target);
 *   • Дисертаційна шапка (тема, керівник, спеціальність);
 *   • Milestones (timeline);
 *   • Курси curriculum (топ-5).
 */
export async function PhdBlock({
  projectId,
  locale,
  legacyProjectId,
}: {
  projectId: string;
  locale: string;
  legacyProjectId?: string;
}) {
  const isUk = locale === "uk";

  if (!projectId) return <EmptyPhd locale={locale} />;

  const plan = await getPhdPlan(projectId).catch(() => null);

  if (!plan) {
    return (
      <NewPhdHint
        locale={locale}
        legacyProjectId={legacyProjectId}
      />
    );
  }

  const earnedCredits = (plan.curriculumCourses || [])
    .filter((c) => c.credited)
    .reduce((sum, c) => sum + (Number(c.credits) || 0), 0);
  const targetCredits = plan.totalCredits || 60;
  const progress = Math.min(100, Math.round((earnedCredits / targetCredits) * 100));

  const milestones = (plan.milestones || [])
    .slice()
    .sort((a, b) => (a.period || "").localeCompare(b.period || ""));
  const completedMs = milestones.filter((m) => (m as any).completed).length;
  const totalMs = milestones.length;

  const topCourses = (plan.curriculumCourses || []).slice(0, 5);

  return (
    <div className="flex flex-col gap-5">
      {/* ── Hero progress ─────────────────────────────────── */}
      <LiquidCard tint="violet" accent className="overflow-hidden p-0">
        <div className="relative bg-gradient-to-br from-violet-50/80 via-white to-blue-50/60 p-6">
          <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-violet-400/15 blur-3xl" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="liquid-eyebrow inline-flex items-center gap-1.5 text-violet-700">
                <GraduationCap className="h-3 w-3" />
                {isUk ? "Прогрес дисертації" : "Dissertation progress"}
              </span>
              <p className="mt-1 text-4xl font-bold leading-none tracking-tight text-slate-900">
                {progress}%
              </p>
              <p className="mt-1 text-xs text-slate-600">
                {earnedCredits} / {targetCredits} {isUk ? "кредитів ECTS" : "ECTS credits"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {isUk ? "Етапи" : "Milestones"}
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
                {completedMs}<span className="text-base text-slate-400">/{totalMs}</span>
              </p>
            </div>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200/70">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </LiquidCard>

      {/* ── Dissertation meta ─────────────────────────────── */}
      <LiquidCard tint="blue" className="p-0 overflow-hidden">
        <div className="flex items-center gap-3 border-b border-slate-200/60 bg-gradient-to-br from-blue-50/60 via-white to-slate-50/60 px-5 py-3.5">
          <span className="liquid-eyebrow inline-flex items-center gap-1.5">
            <Sparkles className="h-3 w-3" />
            {isUk ? "Дисертація" : "Dissertation"}
          </span>
        </div>
        <div className="divide-y divide-slate-100/70">
          {plan.dissertationTitle && (
            <MetaRow icon={<Target />} label={isUk ? "Тема" : "Topic"} value={plan.dissertationTitle} />
          )}
          {plan.supervisor && (
            <MetaRow
              icon={<User />}
              label={isUk ? "Керівник" : "Supervisor"}
              value={`${plan.supervisor}${plan.supervisorTitle ? ` · ${plan.supervisorTitle}` : ""}`}
            />
          )}
          {plan.specialty && (
            <MetaRow icon={<BookOpen />} label={isUk ? "Спеціальність" : "Specialty"} value={plan.specialty} />
          )}
          {plan.enrollmentDate && (
            <MetaRow icon={<CalendarDays />} label={isUk ? "Зарахування" : "Enrolled"} value={plan.enrollmentDate} />
          )}
          {plan.institution && (
            <MetaRow icon={<Award />} label={isUk ? "Інституція" : "Institution"} value={plan.institution} />
          )}
        </div>
      </LiquidCard>

      {/* ── Two-column: Milestones + Curriculum ───────────── */}
      <div className="grid gap-4 xl:grid-cols-[1.1fr_1fr]">
        <LiquidCard tint="emerald" className="p-0 overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200/60 bg-gradient-to-br from-emerald-50/60 via-white to-slate-50/60 px-5 py-3.5">
            <span className="liquid-eyebrow inline-flex items-center gap-1.5">
              <Flag className="h-3 w-3" />
              {isUk ? "Етапи (milestones)" : "Milestones"}
            </span>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
              {totalMs}
            </span>
          </div>
          {milestones.length === 0 ? (
            <EmptyRow text={isUk ? "Етапів ще немає" : "No milestones yet"} />
          ) : (
            <div className="p-4">
              <ol className="relative space-y-3 border-l-2 border-emerald-200 pl-4">
                {milestones.slice(0, 6).map((m: any) => (
                  <li key={m.mid} className="relative">
                    <span className={`absolute -left-[21px] top-1 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 ${m.completed ? "border-emerald-500 bg-emerald-500" : "border-emerald-200 bg-white"}`}>
                      {m.completed && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </span>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">{m.period}</p>
                    <p className="mt-0.5 text-sm font-bold text-slate-900">{m.title}</p>
                    {m.description && (
                      <p className="mt-0.5 line-clamp-2 text-[11px] text-slate-500">{m.description}</p>
                    )}
                  </li>
                ))}
              </ol>
              {milestones.length > 6 && (
                <p className="mt-3 pl-4 text-[10px] text-slate-400">
                  +{milestones.length - 6} {isUk ? "ще" : "more"}
                </p>
              )}
            </div>
          )}
        </LiquidCard>

        <LiquidCard tint="amber" className="p-0 overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200/60 bg-gradient-to-br from-amber-50/60 via-white to-slate-50/60 px-5 py-3.5">
            <span className="liquid-eyebrow inline-flex items-center gap-1.5">
              <BookOpen className="h-3 w-3" />
              {isUk ? "Освітні курси" : "Curriculum"}
            </span>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
              {plan.curriculumCourses?.length ?? 0}
            </span>
          </div>
          {topCourses.length === 0 ? (
            <EmptyRow text={isUk ? "Курсів ще немає" : "No courses yet"} />
          ) : (
            <div className="divide-y divide-slate-100/70">
              {topCourses.map((c) => (
                <div key={(c as any).cid ?? c.title} className="flex items-center gap-3 px-4 py-2.5">
                  <span className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold ${c.credited ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                    {c.credits || 0}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-900">{c.title}</p>
                    <p className="truncate text-[11px] text-slate-500">
                      {(c as any).semester || "—"}
                      {(c as any).grade ? ` · ${isUk ? "оцінка" : "grade"} ${(c as any).grade}` : ""}
                    </p>
                  </div>
                  {c.credited && (
                    <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-700">
                      {isUk ? "Зарах." : "OK"}
                    </span>
                  )}
                </div>
              ))}
              {(plan.curriculumCourses?.length ?? 0) > 5 && (
                <p className="px-4 py-2 text-center text-[10px] text-slate-400">
                  +{(plan.curriculumCourses!.length - 5)} {isUk ? "ще" : "more"}
                </p>
              )}
            </div>
          )}
        </LiquidCard>
      </div>

      {/* ── Quick stats ───────────────────────────────────── */}
      <section className="grid gap-3 sm:grid-cols-3">
        <LiquidStatTile
          icon={<Award className="h-4 w-4" />}
          label={isUk ? "ECTS зараховано" : "ECTS earned"}
          value={String(earnedCredits)}
          sub={`${isUk ? "ціль" : "target"}: ${targetCredits}`}
          tint="violet"
        />
        <LiquidStatTile
          icon={<Flag className="h-4 w-4" />}
          label={isUk ? "Етапів зроблено" : "Milestones done"}
          value={`${completedMs}/${totalMs || 0}`}
          tint="emerald"
        />
        <LiquidStatTile
          icon={<CalendarDays className="h-4 w-4" />}
          label={isUk ? "Рік" : "Year"}
          value={plan.enrollmentDate ? plan.enrollmentDate.slice(0, 4) : "—"}
          sub={plan.studyForm === "part_time" ? (isUk ? "заочна" : "part-time") : (isUk ? "очна" : "full-time")}
          tint="blue"
        />
      </section>

      {/* ── CTA: open full PhD plan ──────────────────────── */}
      {legacyProjectId && (
        <Link
          href={`/${locale}/app/phd-plan?projectId=${legacyProjectId}`}
          className="liquid-cta self-start inline-flex"
        >
          <ExternalLink className="h-4 w-4" />
          {isUk ? "Відкрити повний PhD-план" : "Open full PhD plan"}
        </Link>
      )}
    </div>
  );
}

function MetaRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
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

function EmptyRow({ text }: { text: string }) {
  return (
    <div className="px-4 py-6 text-center text-xs text-slate-400">{text}</div>
  );
}

function EmptyPhd({ locale }: { locale: string }) {
  const isUk = locale === "uk";
  return (
    <LiquidCard tint="amber" className="text-center">
      <h3 className="text-sm font-bold text-slate-900">{isUk ? "PhD-план без даних" : "PhD plan without data"}</h3>
      <p className="mt-1 text-xs text-slate-500">
        {isUk ? "Заповніть мета та етапи через legacy робочий простір." : "Fill meta & milestones via legacy workspace."}
      </p>
    </LiquidCard>
  );
}

function NewPhdHint({ locale, legacyProjectId }: { locale: string; legacyProjectId?: string }) {
  const isUk = locale === "uk";
  return (
    <LiquidCard tint="violet" className="text-center" accent>
      <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
        <GraduationCap className="h-6 w-6" />
      </div>
      <h3 className="text-base font-bold text-slate-900">
        {isUk ? "Початок PhD" : "Start your PhD"}
      </h3>
      <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-slate-500">
        {isUk
          ? "Складіть науковий план: тема, керівник, milestone, курси ECTS. Усе синхронізується між веб- і мобільним застосунком."
          : "Set up your research plan: topic, supervisor, milestones, ECTS courses. Synced between web and mobile."}
      </p>
      {legacyProjectId && (
        <Link
          href={`/${locale}/app/phd-plan?projectId=${legacyProjectId}`}
          className="liquid-cta mt-4 inline-flex"
        >
          <ExternalLink className="h-4 w-4" />
          {isUk ? "Перейти до PhD-плану" : "Go to PhD plan"}
        </Link>
      )}
    </LiquidCard>
  );
}
