import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  Building2, ExternalLink, GraduationCap, Layers, Mail,
  MapPin, Sparkles, Users,
} from "lucide-react";
import { LiquidCard, LiquidStatTile } from "@/components/ui/liquid";
import { getCurrentUser } from "@/lib/current-user";
import { isLocale } from "@/lib/i18n";
import {
  getInstitution,
  listInstitutionCourses,
  listMembers,
  listPrograms,
  listUnits,
} from "@/lib/institutions-db";
import { type InstitutionType } from "@/lib/schemas";

const INSTITUTION_TYPE_LABELS: Record<InstitutionType, { uk: string; en: string }> = {
  university: { uk: "Університет",              en: "University" },
  institute:  { uk: "Інститут",                  en: "Institute" },
  academy:    { uk: "Академія",                  en: "Academy" },
  college:    { uk: "Коледж",                    en: "College" },
  school:     { uk: "Школа / гімназія",          en: "School" },
  research:   { uk: "Науково-дослідна установа", en: "Research org" },
  other:      { uk: "Інше",                      en: "Other" },
};

export default async function InstitutionDashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ welcome?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);
  // Layout вже гарантує institution account + наявність institution, тут — рефетч для свіжих даних.
  const institutionId = (user as any).institutionId as string;
  const institution = await getInstitution(institutionId);
  if (!institution) redirect(`/${locale}/register/institution`);

  const { welcome } = await searchParams;
  const isUk = locale === "uk";

  // Реальні counts.
  const [units, members, programs, courses] = await Promise.all([
    listUnits(institutionId).catch(() => []),
    listMembers(institutionId).catch(() => []),
    listPrograms(institutionId).catch(() => []),
    listInstitutionCourses(institutionId).catch(() => []),
  ]);

  const typeLabel = INSTITUTION_TYPE_LABELS[institution.type as InstitutionType] ?? INSTITUTION_TYPE_LABELS.other;
  const isEmpty = units.length === 0 && members.length === 0 && programs.length === 0;

  return (
    <div className="space-y-4">
      {welcome === "1" && (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-blue-50/40 px-5 py-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
            <Sparkles className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-emerald-900">
              {isUk ? "Заклад успішно зареєстровано!" : "Institution registered successfully!"}
            </p>
            <p className="mt-0.5 text-xs leading-5 text-emerald-800/80">
              {isUk
                ? "Почніть з налаштування структури — додайте факультети, кафедри або лабораторії."
                : "Start by configuring your structure — add faculties, departments or labs."}
            </p>
          </div>
        </div>
      )}

      {/* ── Hero card ─────────────────────────────────────── */}
      <LiquidCard className="overflow-hidden p-0">
        <div className="relative bg-gradient-to-br from-emerald-50/70 via-white to-blue-50/40 p-6 md:p-7">
          <div className="flex items-start gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <Building2 className="h-7 w-7" />
            </span>
            <div className="min-w-0 flex-1">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-white/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">
                {isUk ? typeLabel.uk : typeLabel.en}
                {institution.isVerified && (
                  <span className="rounded bg-emerald-700/10 px-1 text-[9px]">{isUk ? "верифіковано" : "verified"}</span>
                )}
              </span>
              <h1 className="mt-2 text-xl font-bold leading-tight tracking-tight text-slate-950 md:text-2xl">
                {institution.name}
              </h1>
              {institution.shortName && (
                <p className="mt-1 font-mono text-xs text-slate-500">{institution.shortName}</p>
              )}
              <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-500">
                {(institution.city || institution.country) && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {[institution.city, institution.country].filter(Boolean).join(", ")}
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {institution.email}
                </span>
                {institution.website && (
                  <a
                    href={institution.website}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-emerald-700 hover:underline"
                  >
                    {institution.website.replace(/^https?:\/\//, "")}
                    <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                )}
              </div>
              {institution.description && (
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">{institution.description}</p>
              )}
            </div>
          </div>
        </div>
      </LiquidCard>

      {/* ── Stats ─────────────────────────────────────────── */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <LiquidStatTile
          icon={<Layers className="h-4 w-4" />}
          label={isUk ? "Підрозділів" : "Units"}
          value={units.length}
          sub={isUk ? "факультети, кафедри" : "faculties, depts"}
          tint="emerald"
        />
        <LiquidStatTile
          icon={<Users className="h-4 w-4" />}
          label={isUk ? "Викладачів" : "Teachers"}
          value={members.length}
          sub={isUk ? "у системі" : "in system"}
          tint="blue"
        />
        <LiquidStatTile
          icon={<GraduationCap className="h-4 w-4" />}
          label={isUk ? "Програм" : "Programs"}
          value={programs.length}
          sub={isUk ? "освітні" : "academic"}
          tint="violet"
        />
        <LiquidStatTile
          icon={<Sparkles className="h-4 w-4" />}
          label={isUk ? "Курсів" : "Courses"}
          value={courses.length}
          sub={isUk ? "опубліковано" : "published"}
          tint="amber"
        />
      </section>

      {/* ── Empty-state checklist (тільки якщо нічого не створено) ── */}
      {isEmpty && (
        <LiquidCard tint="amber" className="p-5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-700" />
            <h2 className="liquid-eyebrow">
              {isUk ? "З чого почати" : "Get started"}
            </h2>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            {isUk
              ? "Закладу потрібен мінімум структури, щоб запрошувати викладачів та публікувати програми."
              : "Your institution needs minimal structure before you can invite teachers and publish programs."}
          </p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-3">
            <ChecklistItem
              n={1}
              href={`/${locale}/app/institution/structure`}
              title={isUk ? "Створити підрозділи" : "Create units"}
              desc={isUk ? "Факультети, кафедри, лабораторії" : "Faculties, depts, labs"}
              done={units.length > 0}
            />
            <ChecklistItem
              n={2}
              href={`/${locale}/app/institution/teachers`}
              title={isUk ? "Додати викладачів" : "Add teachers"}
              desc={isUk ? "Команда вашого закладу" : "Your institution's staff"}
              done={members.length > 0}
            />
            <ChecklistItem
              n={3}
              href={`/${locale}/app/institution/programs`}
              title={isUk ? "Освітні програми" : "Programs"}
              desc={isUk ? "Бакалаврат / магістр / PhD" : "BSc / MSc / PhD"}
              done={programs.length > 0}
            />
          </ul>
        </LiquidCard>
      )}
    </div>
  );
}

function ChecklistItem({
  n, href, title, desc, done,
}: {
  n: number;
  href: string;
  title: string;
  desc: string;
  done: boolean;
}) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-2.5 rounded-xl border border-slate-200 bg-white/70 px-3 py-2.5 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50/40 hover:shadow-sm"
    >
      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
        done ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-500"
      }`}>
        {done ? "✓" : n}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-bold text-slate-900 group-hover:text-emerald-700">{title}</p>
        <p className="mt-0.5 text-[11px] leading-4 text-slate-500">{desc}</p>
      </div>
    </Link>
  );
}
