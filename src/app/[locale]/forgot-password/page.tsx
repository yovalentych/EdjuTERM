import { notFound, redirect } from "next/navigation";
import { requestPasswordReset } from "@/app/actions";
import { getCurrentUser } from "@/lib/current-user";
import { getDictionary, isLocale } from "@/lib/i18n";
import Link from "next/link";

export default async function ForgotPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const user = await getCurrentUser();
  if (user) redirect(`/${locale}/app`);

  const { error, sent } = await searchParams;
  const d = getDictionary(locale).auth;
  const isUk = locale === "uk";

  return (
    <main className="min-h-screen bg-background px-5 py-10 text-stone-950">
      <section className="surface mx-auto max-w-md p-6">
        <h1 className="text-2xl font-semibold">
          {isUk ? "Забули пароль?" : "Forgot password?"}
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          {isUk
            ? "Введіть email — токен для скидання з'явиться в терміналі (dev mode)."
            : "Enter your email — a reset token will appear in the terminal (dev mode)."}
        </p>

        <div className="mt-5 space-y-3">
          {sent === "1" && (
            <div className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800">
              {isUk
                ? "Якщо цей email зареєстрований — токен виведено в термінал сервера."
                : "If this email is registered, the token has been printed to the server terminal."}
            </div>
          )}

          {error === "invalid" && (
            <div className="rounded border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
              {d.invalidError}
            </div>
          )}

          {/* Dev-mode notice */}
          <div className="flex items-start gap-2 rounded border border-amber-200 bg-amber-50 px-3 py-2">
            <span className="mt-0.5 text-amber-500">⚠</span>
            <p className="text-xs text-amber-700">
              {isUk
                ? "DEV MODE: email не надсилається. Скопіюйте посилання з терміналу."
                : "DEV MODE: no email is sent. Copy the link from the server terminal."}
            </p>
          </div>

          <form action={requestPasswordReset} className="space-y-3">
            <input type="hidden" name="locale" value={locale} />
            <label className="block space-y-1">
              <span className="text-sm font-medium text-stone-700">{d.email}</span>
              <input
                name="email"
                type="email"
                required
                autoFocus
                className="input-control w-full px-3 py-2 text-sm"
              />
            </label>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-emerald-700 to-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:from-emerald-800 hover:to-teal-800"
            >
              {isUk ? "Надіслати токен" : "Send reset token"}
            </button>
          </form>

          <p className="text-center text-sm text-stone-500">
            <Link href={`/${locale}/login`} className="font-medium text-emerald-800">
              ← {d.loginSubmit}
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
