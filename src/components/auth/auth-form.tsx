import Link from "next/link";
import { login, register } from "@/app/actions";
import { RegisterNameFields } from "@/components/auth/register-name-fields";
import type { Dictionary, Locale } from "@/lib/i18n";

const fieldClass =
  "w-full border border-stone-300 bg-white px-3 py-2 text-sm text-stone-950 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100";

export function AuthForm({
  mode,
  dictionary,
  locale,
  error,
}: {
  mode: "login" | "register";
  dictionary: Dictionary;
  locale: Locale;
  error?: string;
}) {
  const isRegister = mode === "register";
  const action = isRegister ? register : login;

  return (
    <form action={action} className="grid gap-3">
      <input type="hidden" name="locale" value={locale} />
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
        <input name="email" type="email" className={fieldClass} required />
      </label>
      <label className="space-y-1">
        <span className="text-sm font-medium text-stone-700">
          {dictionary.auth.password}
        </span>
        <input
          name="password"
          type="password"
          className={fieldClass}
          required
          minLength={isRegister ? 8 : undefined}
        />
      </label>
      <button
        type="submit"
        className="bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800"
      >
        {isRegister ? dictionary.auth.registerSubmit : dictionary.auth.loginSubmit}
      </button>
      <p className="text-sm text-stone-600">
        {isRegister ? dictionary.auth.haveAccount : dictionary.auth.needAccount}{" "}
        <Link
          href={`/${locale}/${isRegister ? "login" : "register"}`}
          className="font-medium text-emerald-800"
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
