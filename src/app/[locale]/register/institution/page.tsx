import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Building2, Sparkles } from "lucide-react";
import { getCurrentUser } from "@/lib/current-user";
import { getDictionary, isLocale } from "@/lib/i18n";
import { RegisterInstitutionForm } from "@/components/auth/register-institution-form";

export default async function RegisterInstitutionPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();

  const user = await getCurrentUser();
  if (user) redirect(`/${localeParam}/app`);

  const { error } = await searchParams;
  const dictionary = getDictionary(localeParam);
  const isUk = localeParam === "uk";

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 px-5 py-8 text-stone-950">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            href={`/${localeParam}/register`}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {isUk ? "Звичайна реєстрація" : "Personal registration"}
          </Link>
          <Link
            href={`/${localeParam}/login`}
            className="text-xs font-bold text-emerald-700 hover:underline"
          >
            {isUk ? "Вже маєте акаунт? Увійти →" : "Have an account? Sign in →"}
          </Link>
        </div>

        {/* Hero */}
        <div className="mb-6 rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-blue-50/50 p-6 md:p-8">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <Building2 className="h-6 w-6" />
            </span>
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-white/80 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">
                <Sparkles className="h-3 w-3" />
                {isUk ? "Для навчальних закладів" : "For institutions"}
              </span>
              <h1 className="mt-2 text-2xl font-bold leading-tight tracking-tight text-slate-950 md:text-3xl">
                {isUk
                  ? "Зареєструйте свій навчальний заклад"
                  : "Register your educational institution"}
              </h1>
            </div>
          </div>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            {isUk
              ? "Створіть простір для свого ЗВО: керуйте структурою (факультети, кафедри), додавайте викладачів, формуйте освітні програми. Студенти зможуть приєднатися до вашого закладу при створенні особистого простору."
              : "Set up a workspace for your higher-education institution: manage structure (faculties, departments), add teachers, create degree programs. Students can join your institution when setting up their personal workspace."}
          </p>
        </div>

        {error && <ErrorBanner error={error} isUk={isUk} />}

        <RegisterInstitutionForm locale={localeParam} />
      </div>
    </main>
  );
}

function ErrorBanner({ error, isUk }: { error: string; isUk: boolean }) {
  const map: Record<string, { uk: string; en: string }> = {
    exists:  { uk: "Цей email уже зареєстрований у системі.",            en: "This email is already registered." },
    invalid: { uk: "Заповніть усі обов'язкові поля коректно.",            en: "Please fill required fields correctly." },
    terms:   { uk: "Потрібно прийняти умови використання.",               en: "You must accept the terms of use." },
    server:  { uk: "Помилка сервера. Спробуйте пізніше.",                  en: "Server error. Please try again later." },
  };
  const msg = map[error] ?? { uk: "Помилка реєстрації.", en: "Registration failed." };
  return (
    <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
      {isUk ? msg.uk : msg.en}
    </div>
  );
}
