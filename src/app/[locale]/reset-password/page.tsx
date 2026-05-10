import { notFound, redirect } from "next/navigation";
import { resetPassword } from "@/app/actions";
import { findValidToken } from "@/lib/password-reset";
import { getCurrentUser } from "@/lib/current-user";
import { getDictionary, isLocale } from "@/lib/i18n";
import Link from "next/link";

export default async function ResetPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const user = await getCurrentUser();
  if (user) redirect(`/${locale}/app`);

  const { token, error } = await searchParams;
  const d = getDictionary(locale).auth;
  const isUk = locale === "uk";

  // Validate token server-side before rendering form
  const validToken = token ? await findValidToken(token) : null;

  return (
    <main className="min-h-screen bg-background px-5 py-10 text-stone-950">
      <section className="surface mx-auto max-w-md p-6">
        <h1 className="text-2xl font-semibold">
          {isUk ? "Новий пароль" : "Set new password"}
        </h1>

        <div className="mt-5 space-y-3">
          {/* Token expired / invalid */}
          {(error === "expired" || (!validToken && token)) && (
            <div className="rounded border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-800">
              {isUk
                ? "Токен недійсний або вже використаний. Запросіть новий."
                : "Token is invalid or already used. Request a new one."}
            </div>
          )}

          {/* No token at all */}
          {!token && (
            <div className="rounded border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-700">
              {isUk
                ? "Токен відсутній. Перейдіть за посиланням із терміналу."
                : "No token provided. Follow the link from the terminal."}
            </div>
          )}

          {error === "invalid" && (
            <div className="rounded border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
              {isUk
                ? "Пароль має містити щонайменше 8 символів."
                : "Password must be at least 8 characters."}
            </div>
          )}

          {error === "server" && (
            <div className="rounded border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
              {d.serverError}
            </div>
          )}

          {/* Form — only show when token is valid */}
          {validToken && (
            <form action={resetPassword} className="space-y-3">
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="token" value={token} />

              <div className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                {isUk
                  ? `Скидання пароля для: ${validToken.email}`
                  : `Resetting password for: ${validToken.email}`}
              </div>

              <label className="block space-y-1">
                <span className="text-sm font-medium text-stone-700">
                  {isUk ? "Новий пароль" : "New password"}
                </span>
                <input
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  autoFocus
                  className="input-control w-full px-3 py-2 text-sm"
                  placeholder={isUk ? "Мінімум 8 символів" : "At least 8 characters"}
                />
              </label>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-emerald-700 to-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:from-emerald-800 hover:to-teal-800"
              >
                {isUk ? "Зберегти новий пароль" : "Save new password"}
              </button>
            </form>
          )}

          <p className="text-center text-sm text-stone-500">
            {isUk ? "Повернутися до " : "Back to "}
            <Link href={`/${locale}/forgot-password`} className="font-medium text-emerald-800">
              {isUk ? "запиту токену" : "token request"}
            </Link>
            {" · "}
            <Link href={`/${locale}/login`} className="font-medium text-emerald-800">
              {d.loginSubmit}
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
