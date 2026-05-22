"use client";

import Link from "next/link";
import { useFormStatus } from "react-dom";
import { useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, Check, Eye, EyeOff, KeyRound, Loader2, Mail } from "lucide-react";
import { login, register } from "@/app/actions";
import { RegisterNameFields } from "@/components/auth/register-name-fields";
import type { Dictionary, Locale } from "@/lib/i18n";

// Без horizontal padding — задаємо явно (`pl-9 pr-3` / `px-9` тощо)
// у кожному місці, щоб іконки не перекривалися з текстом.
const fieldBase =
  "input-control w-full py-2.5 text-sm text-stone-950 outline-none";
const fieldClass = `${fieldBase} px-3`;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

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
  const isUk = locale === "uk";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [capsOn, setCapsOn] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const emailValid = email.length > 0 && EMAIL_RE.test(email);
  const strength = useMemo(() => passwordStrength(password), [password]);
  const canSubmit = isRegister
    ? emailValid && strength.score >= 2 && agreed
    : true;

  return (
    <form action={action} className="grid gap-3">
      <input type="hidden" name="locale" value={locale} />

      {notice === "password_reset" && (
        <div className="border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {isUk
            ? "Пароль успішно змінено. Увійдіть з новим паролем."
            : "Password changed successfully. Sign in with your new password."}
        </div>
      )}
      {error ? (
        <div className="flex items-start gap-2 border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{errorMessage(error, dictionary)}</span>
        </div>
      ) : null}

      {isRegister ? <RegisterNameFields dictionary={dictionary} /> : null}

      {/* ── Email ─────────────────────────────────────────────────── */}
      <label className="space-y-1">
        <span className="text-sm font-medium text-stone-700">
          {dictionary.auth.email}
        </span>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`${fieldBase} pl-9 ${emailValid ? "pr-9" : "pr-3"}`}
            required
            autoComplete="email"
            inputMode="email"
            spellCheck={false}
          />
          {emailValid && (
            <Check className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-600" />
          )}
        </div>
        {email.length > 3 && !emailValid && (
          <p className="text-xs text-rose-600">
            {isUk ? "Перевірте формат пошти" : "Check email format"}
          </p>
        )}
      </label>

      {/* ── Password ──────────────────────────────────────────────── */}
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
              {isUk ? "Забули пароль?" : "Forgot password?"}
            </Link>
          )}
        </div>
        <div className="relative">
          <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            name="password"
            type={showPwd ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyUp={(e) => setCapsOn(e.getModifierState && e.getModifierState("CapsLock"))}
            onKeyDown={(e) => setCapsOn(e.getModifierState && e.getModifierState("CapsLock"))}
            className={`${fieldBase} pl-9 pr-9`}
            required
            minLength={isRegister ? 8 : undefined}
            autoComplete={isRegister ? "new-password" : "current-password"}
          />
          <button
            type="button"
            onClick={() => setShowPwd((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-stone-500 hover:text-stone-800"
            aria-label={showPwd
              ? (isUk ? "Сховати пароль" : "Hide password")
              : (isUk ? "Показати пароль" : "Show password")}
          >
            {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        {capsOn && (
          <p className="flex items-center gap-1.5 text-xs text-amber-700">
            <AlertTriangle className="h-3 w-3" />
            {isUk ? "Caps Lock увімкнено" : "Caps Lock is on"}
          </p>
        )}

        {isRegister && password.length > 0 && (
          <div className="space-y-1 pt-1">
            <div className="flex gap-1">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded ${
                    i < strength.score
                      ? strength.color
                      : "bg-stone-200"
                  }`}
                />
              ))}
            </div>
            <p className={`text-xs ${strength.textColor}`}>{strength.label[isUk ? 0 : 1]}</p>
            {strength.hints[isUk ? 0 : 1] && (
              <p className="text-[11px] text-stone-500">{strength.hints[isUk ? 0 : 1]}</p>
            )}
          </div>
        )}
      </label>

      {/* ── Remember me (login) / Terms (register) ───────────────── */}
      {!isRegister ? (
        <label className="flex cursor-pointer items-center gap-2.5">
          <input
            type="checkbox"
            name="rememberMe"
            className="h-4 w-4 accent-emerald-700"
          />
          <span className="text-sm text-stone-600">
            {isUk ? "Запам'ятати мене на 30 днів" : "Remember me for 30 days"}
          </span>
        </label>
      ) : (
        <label className="flex cursor-pointer items-start gap-2.5">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-emerald-700"
          />
          <span className="text-xs text-stone-600 leading-5">
            {isUk ? (
              <>
                Погоджуюсь із{" "}
                <Link href={`/${locale}/terms`} className="font-semibold text-emerald-700 hover:underline">
                  умовами використання
                </Link>{" "}
                та{" "}
                <Link href={`/${locale}/privacy`} className="font-semibold text-emerald-700 hover:underline">
                  політикою конфіденційності
                </Link>
              </>
            ) : (
              <>
                I agree with{" "}
                <Link href={`/${locale}/terms`} className="font-semibold text-emerald-700 hover:underline">
                  terms of service
                </Link>{" "}
                and{" "}
                <Link href={`/${locale}/privacy`} className="font-semibold text-emerald-700 hover:underline">
                  privacy policy
                </Link>
              </>
            )}
          </span>
        </label>
      )}

      <SubmitButton
        disabled={!canSubmit}
        label={isRegister ? dictionary.auth.registerSubmit : dictionary.auth.loginSubmit}
      />

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

function SubmitButton({ disabled, label }: { disabled: boolean; label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="control-primary inline-flex w-full items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <ArrowRight className="h-4 w-4" />
      )}
      {label}
    </button>
  );
}

type Strength = {
  score: 0 | 1 | 2 | 3 | 4;
  label: [string, string]; // [uk, en]
  hints: [string, string];
  color: string;
  textColor: string;
};

function passwordStrength(pwd: string): Strength {
  if (pwd.length === 0) {
    return {
      score: 0,
      label: ["", ""],
      hints: ["", ""],
      color: "bg-stone-200",
      textColor: "text-stone-500",
    };
  }
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
  if (/\d/.test(pwd) && /[^A-Za-z0-9]/.test(pwd)) score++;
  const final = (Math.min(score, 4) || 1) as 1 | 2 | 3 | 4;

  if (final <= 1) {
    return {
      score: final,
      label: ["Слабкий пароль", "Weak password"],
      hints: [
        "Додайте 8+ символів, велику літеру і цифру",
        "Add 8+ chars, uppercase letter and digit",
      ],
      color: "bg-rose-500",
      textColor: "text-rose-600",
    };
  }
  if (final === 2) {
    return {
      score: final,
      label: ["Прийнятний", "Acceptable"],
      hints: [
        "Додайте 12+ символів або спецсимвол",
        "Add 12+ chars or a special character",
      ],
      color: "bg-amber-500",
      textColor: "text-amber-700",
    };
  }
  if (final === 3) {
    return {
      score: final,
      label: ["Хороший", "Good"],
      hints: ["", ""],
      color: "bg-emerald-500",
      textColor: "text-emerald-700",
    };
  }
  return {
    score: 4,
    label: ["Дуже надійний", "Excellent"],
    hints: ["", ""],
    color: "bg-emerald-600",
    textColor: "text-emerald-700",
  };
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
