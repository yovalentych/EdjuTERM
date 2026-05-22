"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, UserPlus } from "lucide-react";

export function AcceptInviteForm({
  locale,
  token,
  memberId,
  prefillEmail,
  prefillName,
}: {
  locale: string;
  token: string;
  memberId: string;
  prefillEmail: string;
  prefillName: string;
}) {
  const isUk = locale === "uk";
  const router = useRouter();

  const [firstName, setFirstName] = useState(() => prefillName.split(" ")[1] ?? "");
  const [lastName, setLastName] = useState(() => prefillName.split(" ")[0] ?? "");
  const [email, setEmail] = useState(prefillEmail);
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName || !lastName || !email || password.length < 8) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/invite/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, memberId, firstName, lastName, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "accept_failed");
      router.replace(`/${locale}/app/space?welcome_institution=1`);
    } catch (e: any) {
      setErr(isUk
        ? (e.message === "email_taken" ? "Ця email-адреса вже зареєстрована. Увійдіть у свій акаунт." : "Помилка. Спробуйте ще раз.")
        : (e.message === "email_taken" ? "This email is already registered. Sign in instead." : "Something went wrong. Try again."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur space-y-3">
      <h2 className="text-sm font-bold text-slate-900">
        {isUk ? "Створити акаунт і приєднатися" : "Create account and join"}
      </h2>

      <div className="grid gap-2 sm:grid-cols-2">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            {isUk ? "Прізвище" : "Last name"}
          </label>
          <input
            required
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="input-control w-full rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            {isUk ? "Ім'я" : "First name"}
          </label>
          <input
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="input-control w-full rounded-lg px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
          Email
        </label>
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input-control w-full rounded-lg px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
          {isUk ? "Пароль (мін. 8 символів)" : "Password (min 8 chars)"}
        </label>
        <div className="relative">
          <input
            required
            type={showPw ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            className="input-control w-full rounded-lg px-3 py-2 pr-9 text-sm"
          />
          <button
            type="button"
            onClick={() => setShowPw((s) => !s)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
          >
            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {err && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{err}</p>}

      <button
        type="submit"
        disabled={busy || !firstName || !lastName || !email || password.length < 8}
        className="w-full rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow hover:bg-emerald-700 disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
        {isUk ? "Прийняти запрошення" : "Accept invitation"}
      </button>
    </form>
  );
}
