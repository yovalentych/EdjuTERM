import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";
import { getCurrentUser } from "@/lib/current-user";
import { getDictionary, isLocale } from "@/lib/i18n";

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const { locale: localeParam } = await params;

  if (!isLocale(localeParam)) notFound();

  const user = await getCurrentUser();
  if (user) redirect(`/${localeParam}/app`);

  const dictionary = getDictionary(localeParam);
  const { error, notice } = await searchParams;
  const isUk = localeParam === "uk";

  return (
    <div className="flex min-h-screen">
      {/* Left branding panel — hidden on mobile */}
      <div className="relative hidden w-[42%] flex-col justify-between bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 p-10 text-white lg:flex">
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
            {isUk
              ? "Керуйте науковими грантами ефективно"
              : "Manage scientific grants effectively"}
          </h1>
          <p className="mt-3 text-sm leading-6 text-blue-100">
            {isUk
              ? "Єдина платформа для команди, документів, бюджету і звітності"
              : "One platform for your team, documents, budget, and reporting"}
          </p>
        </div>

        <p className="text-xs text-blue-200">
          © {new Date().getFullYear()} {dictionary.shell.appName}
        </p>

        {/* Decorative circles */}
        <div className="pointer-events-none absolute bottom-0 right-0 h-64 w-64 translate-x-1/4 translate-y-1/4 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute right-0 top-1/4 h-32 w-32 translate-x-1/2 rounded-full bg-white/5" />
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 items-center justify-center bg-background px-5 py-10">
        <div className="w-full max-w-sm">
          {/* Mobile brand mark */}
          <div className="mb-8 flex items-center justify-center gap-3 lg:hidden">
            <Image src="/logo.svg" alt="Logo" width={40} height={40} />
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900">
              {dictionary.auth.loginTitle}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {isUk
                ? "Увійдіть до свого акаунту"
                : "Sign in to your account"}
            </p>
          </div>

          <AuthForm
            mode="login"
            dictionary={dictionary}
            locale={localeParam}
            error={error}
            notice={notice}
          />

          <div className="mt-6 text-center">
            <Link
              href={`/${localeParam === "uk" ? "en" : "uk"}/login`}
              className="text-xs text-slate-400 hover:text-blue-600"
            >
              {localeParam === "uk" ? "English" : "Українська"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
