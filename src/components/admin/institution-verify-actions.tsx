"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

export function InstitutionVerifyActions({
  institutionId,
  isVerified,
  locale,
}: {
  institutionId: string;
  isVerified: boolean;
  locale: string;
}) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const isUk = locale === "uk";

  async function toggle(verified: boolean) {
    if (!confirm(
      isUk
        ? (verified ? "Верифікувати цей заклад?" : "Скасувати верифікацію?")
        : (verified ? "Verify this institution?" : "Revoke verification?")
    )) return;

    setBusy(true);
    try {
      await fetch(`/api/admin/institutions/${institutionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verified }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (busy) return <Loader2 className="h-4 w-4 animate-spin text-slate-400" />;

  if (isVerified) {
    return (
      <button
        type="button"
        onClick={() => toggle(false)}
        title={isUk ? "Скасувати верифікацію" : "Revoke verification"}
        className="rounded p-1 text-emerald-600 hover:bg-rose-50 hover:text-rose-600"
      >
        <XCircle className="h-4 w-4" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => toggle(true)}
      title={isUk ? "Верифікувати заклад" : "Verify institution"}
      className="rounded p-1 text-slate-400 hover:bg-emerald-50 hover:text-emerald-700"
    >
      <CheckCircle2 className="h-4 w-4" />
    </button>
  );
}
