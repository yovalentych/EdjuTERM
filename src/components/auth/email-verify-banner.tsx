"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Mail, X } from "lucide-react";
import type { Locale } from "@/lib/i18n";

const DISMISS_KEY = "rn.email_verify_dismissed.v1";

export function EmailVerifyBanner({ locale }: { locale: Locale }) {
  const isUk = locale === "uk";
  // Спочатку завжди `false` — інакше hydration mismatch між сервером і клієнтом
  // (sessionStorage недоступний на сервері). Після mount читаємо з sessionStorage.
  const [hidden, setHidden] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    try {
      if (window.sessionStorage.getItem(DISMISS_KEY) === "1") {
        queueMicrotask(() => setHidden(true));
      }
    } catch {
      // ignore
    }
  }, []);

  if (hidden) return null;

  function dismiss() {
    try {
      window.sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // ignore
    }
    setHidden(true);
  }

  async function resend() {
    setBusy(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/auth/verify-email?locale=${locale}`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "send_failed");
      }
      setSent(true);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "";
      setErrorMsg(message === "send_failed"
        ? (isUk ? "Не вдалося надіслати лист — спробуйте пізніше." : "Could not send — try again later.")
        : (isUk ? "Помилка мережі" : "Network error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border-b border-amber-200/70 bg-gradient-to-r from-amber-50 via-amber-50/70 to-white px-5 py-3">
      <div className="mx-auto flex max-w-6xl items-start gap-3 sm:items-center">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
          <Mail className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          {sent ? (
            <p className="flex items-center gap-1.5 text-sm font-semibold text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              {isUk ? "Лист надіслано — перевірте пошту (та папку Спам)." : "Email sent — check your inbox (and Spam)."}
            </p>
          ) : (
            <>
              <p className="text-sm font-bold text-amber-900">
                {isUk ? "Підтвердіть електронну адресу" : "Verify your email address"}
              </p>
              <p className="text-xs text-amber-800/80">
                {isUk
                  ? "Ми надіслали лист із посиланням. Підтвердження потрібне для повного доступу до функцій."
                  : "We sent a confirmation link. Verification unlocks full access to features."}
              </p>
              {errorMsg && (
                <p className="mt-1 text-xs font-semibold text-rose-700">{errorMsg}</p>
              )}
            </>
          )}
        </div>

        {!sent && (
          <button
            type="button"
            onClick={resend}
            disabled={busy}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-amber-300 bg-white px-3 py-1.5 text-xs font-bold text-amber-800 transition hover:bg-amber-50 disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Mail className="h-3 w-3" />}
            {isUk ? "Надіслати знову" : "Resend"}
          </button>
        )}

        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="shrink-0 rounded-md p-1 text-amber-700/70 hover:bg-amber-100 hover:text-amber-900"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
