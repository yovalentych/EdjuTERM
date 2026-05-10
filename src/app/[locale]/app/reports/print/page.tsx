import { notFound, redirect } from "next/navigation";
import { PrintButton } from "@/components/reports/print-button";
import { getReport } from "@/lib/reports";
import { getCurrentUser } from "@/lib/current-user";
import { getProjectForUser } from "@/lib/projects";
import { getDictionary, isLocale } from "@/lib/i18n";

function fmtDate(dateStr: string | undefined | null, locale: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString(locale === "uk" ? "uk-UA" : "en-US", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

const typeLabelsUk: Record<string, string> = {
  intermediate: "Проміжний звіт",
  annual: "Річний звіт",
  final: "Підсумковий звіт",
  financial: "Фінансовий звіт",
  conference: "Конференційний звіт",
  custom: "Звіт",
};
const typeLabelsEn: Record<string, string> = {
  intermediate: "Interim Report",
  annual: "Annual Report",
  final: "Final Report",
  financial: "Financial Report",
  conference: "Conference Report",
  custom: "Report",
};

export default async function ReportPrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ projectId?: string; reportId?: string }>;
}) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();

  const user = await getCurrentUser();
  if (!user) redirect(`/${localeParam}/login`);

  const { projectId, reportId } = await searchParams;
  if (!projectId || !reportId) redirect(`/${localeParam}/app`);

  const project = await getProjectForUser(projectId, user);
  if (!project?._id) notFound();

  const report = await getReport(reportId, projectId);
  if (!report) notFound();

  const isUk = localeParam === "uk";
  const typeLabel = (isUk ? typeLabelsUk : typeLabelsEn)[report.type] ?? "Звіт";

  const sections: Array<{ key: keyof typeof report; heading: string }> = [
    { key: "sectionGoals", heading: isUk ? "1. Мета та завдання" : "1. Goals and Objectives" },
    { key: "sectionTimeline", heading: isUk ? "2. Хід виконання" : "2. Progress" },
    { key: "sectionResults", heading: isUk ? "3. Результати" : "3. Results" },
    { key: "sectionPublications", heading: isUk ? "4. Публікації та апробація" : "4. Publications and Dissemination" },
    { key: "sectionFinancial", heading: isUk ? "5. Фінансова звітність" : "5. Financial Report" },
    { key: "sectionProblems", heading: isUk ? "6. Проблеми та відхилення" : "6. Problems and Deviations" },
    { key: "sectionPlans", heading: isUk ? "7. Плани на наступний період" : "7. Plans for Next Period" },
  ];

  const filledSections = sections.filter((s) => !!report[s.key as keyof typeof report]);

  const dictionary = getDictionary(localeParam);

  return (
    <>
      {/* Print toolbar — hidden in print */}
      <div className="print:hidden sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-stone-200 bg-white px-6 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <a
            href={`/${localeParam}/app/reports?projectId=${projectId}&tab=editor&reportId=${reportId}`}
            className="text-sm text-stone-500 hover:text-stone-800"
          >
            ← {isUk ? "Назад до редактора" : "Back to editor"}
          </a>
          <span className="text-stone-300">|</span>
          <span className="text-sm font-medium text-stone-700">{report.title}</span>
        </div>
        <PrintButton label={isUk ? "Друкувати / Зберегти PDF" : "Print / Save as PDF"} />
      </div>

      {/* Print document */}
      <div className="mx-auto max-w-3xl px-10 py-12 print:px-0 print:py-0 print:max-w-none font-serif">

        {/* Cover / header */}
        <header className="mb-10 border-b-2 border-stone-900 pb-8 print:mb-8">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <p className="font-sans text-xs font-bold uppercase tracking-widest text-stone-400">
                {project.grantProgram}
              </p>
              <h1 className="mt-1 font-sans text-xl font-bold leading-snug text-stone-900">
                {project.title}
              </h1>
              <p className="font-sans text-sm font-semibold text-stone-600">
                {project.acronym}
                {project.startDate || project.endDate
                  ? ` · ${fmtDate(project.startDate, localeParam)}${project.endDate ? ` — ${fmtDate(project.endDate, localeParam)}` : ""}`
                  : ""}
              </p>
            </div>
            <div className="shrink-0 rounded border border-stone-200 bg-stone-50 px-4 py-2 text-center font-sans print:border-stone-400">
              <p className="text-xs font-bold uppercase tracking-wider text-stone-500">{typeLabel}</p>
              {report.period && (
                <p className="mt-0.5 text-xs text-stone-600">{report.period}</p>
              )}
            </div>
          </div>

          <h2 className="mt-4 text-2xl font-bold leading-snug text-stone-900">
            {report.title}
          </h2>

          <div className="mt-3 flex flex-wrap gap-4 font-sans text-xs text-stone-500">
            <span>
              {isUk ? "Підготовлено" : "Prepared"}:{" "}
              {new Date().toLocaleDateString(isUk ? "uk-UA" : "en-US", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </span>
            <span>
              {isUk ? "Статус" : "Status"}: {report.status}
            </span>
            {report.submittedAt && (
              <span>
                {isUk ? "Подано" : "Submitted"}: {fmtDate(report.submittedAt.toISOString(), localeParam)}
              </span>
            )}
          </div>
        </header>

        {/* Sections */}
        {filledSections.length === 0 ? (
          <p className="font-sans text-sm text-stone-400 italic">
            {isUk
              ? "Розділи звіту порожні. Скористайтесь кнопкою «Заповнити автоматично» в редакторі."
              : "Report sections are empty. Use the «Auto-fill from DB» button in the editor."}
          </p>
        ) : (
          <div className="space-y-8">
            {filledSections.map((section) => {
              const content = report[section.key as keyof typeof report] as string;
              return (
                <section key={section.key} className="break-inside-avoid-page">
                  <h2 className="mb-3 font-sans text-base font-bold text-stone-800 border-b border-stone-200 pb-1">
                    {section.heading}
                  </h2>
                  <div className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-stone-700">
                    {content}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <footer className="mt-16 border-t border-stone-200 pt-4 font-sans text-xs text-stone-400 print:mt-12">
          <div className="flex justify-between">
            <span>{project.acronym} · {project.grantProgram}</span>
            <span>
              {isUk ? "Згенеровано" : "Generated by"} Grant Project Manager ·{" "}
              {new Date().toLocaleDateString()}
            </span>
          </div>
        </footer>
      </div>

      {/* Print-only CSS */}
      <style>{`
        @media print {
          @page { margin: 2cm; }
          body { font-size: 11pt; }
        }
      `}</style>
    </>
  );
}
