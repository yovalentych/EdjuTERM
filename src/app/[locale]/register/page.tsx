import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Building2, ChevronRight } from "lucide-react";
import { AuthForm } from "@/components/auth/auth-form";
import { getCurrentUser } from "@/lib/current-user";
import { getDictionary, isLocale } from "@/lib/i18n";

export default async function RegisterPage({
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

  const dictionary = getDictionary(localeParam);
  const { error } = await searchParams;
  const isUk = localeParam === "uk";

  return (
    <div className="flex min-h-screen">
      {/* Left branding panel */}
      <div className="relative hidden w-[42%] flex-col justify-between bg-gradient-to-br from-indigo-700 via-blue-600 to-blue-700 p-10 text-white lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/10 p-1.5">
            <Image src="/logo.svg" alt="Logo" width={28} height={28} />
          </div>
          <span className="text-sm font-semibold tracking-wide opacity-90">
            {dictionary.shell.appName}
          </span>
        </div>

        <div>
          <h1 className="text-3xl font-bold leading-tight">
            {isUk ? "Приєднуйтесь до команди" : "Join the team"}
          </h1>
          <p className="mt-3 text-sm leading-6 text-blue-100">
            {isUk
              ? "Створіть акаунт, щоб почати роботу над науковими проєктами"
              : "Create an account to start working on scientific projects"}
          </p>
        </div>

        <p className="text-xs text-blue-200">
          © {new Date().getFullYear()} {dictionary.shell.appName}
        </p>

        <div className="pointer-events-none absolute bottom-0 right-0 h-64 w-64 translate-x-1/4 translate-y-1/4 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute right-0 top-1/4 h-32 w-32 translate-x-1/2 rounded-full bg-white/5" />
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 items-center justify-center bg-background px-5 py-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center justify-center gap-3 lg:hidden">
            <Image src="/logo.svg" alt="Logo" width={40} height={40} />
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900">
              {dictionary.auth.registerTitle}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {isUk ? "Заповніть дані для реєстрації" : "Fill in your details to register"}
            </p>
          </div>

          <AuthForm
            mode="register"
            dictionary={dictionary}
            locale={localeParam}
            error={error}
          />

          {/* ── Institution registration link ─────────────── */}
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-blue-50/40 p-4">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <Building2 className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">
                  {isUk ? "Для навчальних закладів" : "For institutions"}
                </p>
                <p className="mt-1 text-sm font-bold text-slate-900">
                  {isUk
                    ? "Ви представник ЗВО?"
                    : "Representing an institution?"}
                </p>
                <p className="mt-0.5 text-xs leading-5 text-slate-600">
                  {isUk
                    ? "Зареєструйте університет, інститут чи академію та керуйте структурою."
                    : "Register a university, institute or academy and manage its structure."}
                </p>
              </div>
            </div>
            <Link
              href={`/${localeParam}/register/institution`}
              className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-emerald-300 bg-white px-4 py-2 text-sm font-bold text-emerald-700 transition hover:bg-emerald-50"
            >
              {isUk ? "Реєстрація навчального закладу" : "Register an institution"}
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
