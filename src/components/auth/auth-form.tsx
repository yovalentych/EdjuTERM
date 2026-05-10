import Link from "next/link";
import { login, register } from "@/app/actions";
import { RegisterNameFields } from "@/components/auth/register-name-fields";
import type { Dictionary, Locale } from "@/lib/i18n";

const fieldClass =
  "input-control w-full px-3 py-2 text-sm text-stone-950 outline-none";

export function AuthForm({
  mode,
  dictionary,
  locale,
  error,
  notice,
}: {
  mode: "login" | "register";
  dictionary: Dictionary;
  locale: Locale;
  error?: string;
  notice?: string;
}) {
  const isRegister = mode === "register";
  const action = isRegister ? register : login;

  return (
    <form action={action} className="grid gap-3">
      <input type="hidden" name="locale" value={locale} />
      {notice === "password_reset" && (
        <div className="border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {locale === "uk"
            ? "Пароль успішно змінено. Увійдіть з новим паролем."
            : "Password changed successfully. Sign in with your new password."}
        </div>
      )}
      {error ? (
        <div className="border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {errorMessage(error, dictionary)}
        </div>
      ) : null}
      {isRegister ? <RegisterNameFields dictionary={dictionary} /> : null}
      <label className="space-y-1">
        <span className="text-sm font-medium text-stone-700">
          {dictionary.auth.email}
        </span>
        <input
          name="email"
          type="email"
          className={fieldClass}
          required
          autoComplete="email"
        />
      </label>
      <label className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-stone-700">
            {dictionary.auth.password}
          </span>
          {!isRegister && (
            <Link
              href={`/${locale}/forgot-password`}
              className="text-xs text-emerald-700 hover:underline"
            >
              {locale === "uk" ? "Забули пароль?" : "Forgot password?"}
            </Link>
          )}
        </div>
        <input
          name="password"
          type="password"
          className={fieldClass}
          required
          minLength={isRegister ? 8 : undefined}
          autoComplete={isRegister ? "new-password" : "current-password"}
        />
      </label>
      {!isRegister && (
        <label className="flex cursor-pointer items-center gap-2.5">
          <input
            type="checkbox"
            name="rememberMe"
            className="h-4 w-4 accent-emerald-700"
          />
          <span className="text-sm text-stone-600">
            {locale === "uk" ? "Запам'ятати мене на 30 днів" : "Remember me for 30 days"}
          </span>
        </label>
      )}
      <button
        type="submit"
        className="control-primary w-full px-4 py-2.5 text-sm font-semibold"
      >
        {isRegister ? dictionary.auth.registerSubmit : dictionary.auth.loginSubmit}
      </button>
      <p className="text-center text-sm text-stone-500">
        {isRegister ? dictionary.auth.haveAccount : dictionary.auth.needAccount}{" "}
        <Link
          href={`/${locale}/${isRegister ? "login" : "register"}`}
          className="font-semibold text-blue-600 hover:text-blue-800"
        >
          {isRegister ? dictionary.auth.loginSubmit : dictionary.auth.registerSubmit}
        </Link>
      </p>
    </form>
  );
}

function errorMessage(error: string, dictionary: Dictionary) {
  if (error === "exists") {
    return dictionary.auth.existsError;
  }

  if (error === "server") {
    return dictionary.auth.serverError;
  }

  return dictionary.auth.invalidError;
}
