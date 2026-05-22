"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2, Clock, Loader2, Mail, Plus, RefreshCw,
  Trash2, UserPlus, Users, XCircle,
} from "lucide-react";
import { LiquidCard } from "@/components/ui/liquid";
import type { InstitutionMember, InstitutionMemberRole } from "@/lib/schemas";

type InviteMember = InstitutionMember & {
  inviteStatus: "pending" | "accepted" | "expired";
};

const ROLE_LABELS: Record<InstitutionMemberRole, { uk: string; en: string }> = {
  rector:      { uk: "Ректор",              en: "Rector" },
  vice_rector: { uk: "Проректор",           en: "Vice-Rector" },
  dean:        { uk: "Декан",               en: "Dean" },
  vice_dean:   { uk: "Заст. декана",        en: "Vice-Dean" },
  head:        { uk: "Зав. кафедри",        en: "Head" },
  professor:   { uk: "Професор",            en: "Professor" },
  associate:   { uk: "Доцент",             en: "Assoc. Prof." },
  lecturer:    { uk: "Викладач",            en: "Lecturer" },
  assistant:   { uk: "Асистент",            en: "Assistant" },
  researcher:  { uk: "Наук. співробітник", en: "Researcher" },
  staff:       { uk: "Персонал",           en: "Staff" },
  admin:       { uk: "Адмін",              en: "Admin" },
};

const STATUS_META = {
  pending:  { uk: "очікує",  en: "pending",  color: "amber",   Icon: Clock },
  accepted: { uk: "прийнято", en: "accepted", color: "emerald", Icon: CheckCircle2 },
  expired:  { uk: "прострочено", en: "expired", color: "rose", Icon: XCircle },
};

export function InvitesClient({
  locale,
  institutionName,
  initialInvites,
}: {
  locale: "uk" | "en";
  institutionName: string;
  initialInvites: InviteMember[];
}) {
  const isUk = locale === "uk";
  const router = useRouter();
  const [invites, setInvites] = useState(initialInvites);
  const [filter, setFilter] = useState<"all" | "pending" | "accepted" | "expired">("all");
  const [resendingId, setResendingId] = useState<string | null>(null);

  const filtered = filter === "all" ? invites : invites.filter((i) => i.inviteStatus === filter);

  const counts = {
    all: invites.length,
    pending: invites.filter((i) => i.inviteStatus === "pending").length,
    accepted: invites.filter((i) => i.inviteStatus === "accepted").length,
    expired: invites.filter((i) => i.inviteStatus === "expired").length,
  };

  async function resend(m: InviteMember) {
    setResendingId(m._id!);
    try {
      const res = await fetch("/api/institution/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: m.fullName, email: m.email, role: m.role,
          unitId: m.unitId, title: m.title, locale,
        }),
      });
      if (res.ok) {
        setInvites((prev) => prev.map((x) =>
          x._id === m._id ? { ...x, inviteStatus: "pending" as const } : x
        ));
      }
    } finally {
      setResendingId(null);
    }
  }

  async function remove(m: InviteMember) {
    if (!confirm(isUk ? "Видалити запрошення?" : "Delete invitation?")) return;
    setInvites((prev) => prev.filter((x) => x._id !== m._id));
    await fetch(`/api/institution/members/${m._id}`, { method: "DELETE" }).catch(() => {});
  }

  return (
    <div className="space-y-4">
      {/* ── Header ──────────────────────────────────────────── */}
      <LiquidCard className="overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-br from-blue-50/70 via-white to-emerald-50/40 px-5 py-4">
          <div>
            <p className="liquid-eyebrow text-blue-700">
              {isUk ? "Запрошення викладачів" : "Teacher invitations"}
            </p>
            <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-900">
              {institutionName}
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              {invites.length} {isUk ? "відправлено всього" : "sent total"}
              {counts.pending > 0 && (
                <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                  <Clock className="h-3 w-3" />
                  {counts.pending} {isUk ? "очікує" : "pending"}
                </span>
              )}
            </p>
          </div>
          <a
            href="../teachers"
            className="liquid-pill text-blue-600"
          >
            <UserPlus className="h-3.5 w-3.5" />
            {isUk ? "Додати викладача" : "Add teacher"}
          </a>
        </div>
      </LiquidCard>

      {/* ── Filter tabs ─────────────────────────────────────── */}
      <div className="flex flex-wrap gap-1.5">
        {(["all", "pending", "accepted", "expired"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
              filter === s
                ? "bg-blue-600 text-white shadow"
                : "bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {s === "all"
              ? (isUk ? `Всі (${counts.all})` : `All (${counts.all})`)
              : `${isUk ? STATUS_META[s].uk : STATUS_META[s].en} (${counts[s]})`}
          </button>
        ))}
      </div>

      {/* ── List ─────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <LiquidCard tint="amber" className="text-center" accent>
          <Mail className="mx-auto mb-3 h-10 w-10 text-amber-500" />
          <h2 className="text-base font-bold text-slate-900">
            {filter === "all"
              ? (isUk ? "Запрошень ще немає" : "No invitations yet")
              : (isUk ? `Немає запрошень зі статусом «${STATUS_META[filter].uk}»` : `No ${filter} invitations`)}
          </h2>
          <p className="mt-1 max-w-md text-xs leading-5 text-slate-500 mx-auto">
            {isUk
              ? "Перейдіть до Викладачі та натисніть «запросити» поряд з email."
              : "Go to Teachers and click «invite» next to the email."}
          </p>
        </LiquidCard>
      ) : (
        <LiquidCard className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200/60 bg-slate-50/40">
                  <Th>{isUk ? "ПІБ" : "Name"}</Th>
                  <Th>{isUk ? "Email" : "Email"}</Th>
                  <Th>{isUk ? "Роль" : "Role"}</Th>
                  <Th>{isUk ? "Статус" : "Status"}</Th>
                  <Th>{isUk ? "Надіслано" : "Sent"}</Th>
                  <Th align="right">{isUk ? "Дії" : "Actions"}</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => {
                  const st = STATUS_META[m.inviteStatus];
                  const role = ROLE_LABELS[m.role];
                  return (
                    <tr key={m._id} className="border-b border-slate-100/70 hover:bg-slate-50/30">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-500">
                            {m.fullName.charAt(0)}
                          </span>
                          <p className="font-semibold text-slate-900">{m.fullName}</p>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-slate-600">{m.email}</td>
                      <td className="px-4 py-2.5 text-xs text-slate-500">
                        {isUk ? role?.uk : role?.en}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex items-center gap-1 rounded-full bg-${st.color}-100 px-2 py-0.5 text-[10px] font-bold text-${st.color}-700`}>
                          <st.Icon className="h-3 w-3" />
                          {isUk ? st.uk : st.en}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-[11px] text-slate-400">
                        {m.createdAt
                          ? new Date(m.createdAt).toLocaleDateString(isUk ? "uk-UA" : "en-US", { day: "numeric", month: "short" })
                          : "—"}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {m.inviteStatus !== "accepted" && m.email && (
                            <button
                              type="button"
                              onClick={() => resend(m)}
                              disabled={resendingId === m._id}
                              title={isUk ? "Надіслати повторно" : "Resend"}
                              className="rounded-md p-1.5 text-blue-500 hover:bg-blue-50 disabled:opacity-50"
                            >
                              {resendingId === m._id
                                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                : <RefreshCw className="h-3.5 w-3.5" />}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => remove(m)}
                            title={isUk ? "Видалити" : "Delete"}
                            className="rounded-md p-1.5 text-rose-500 hover:bg-rose-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </LiquidCard>
      )}
    </div>
  );
}

function Th({ children, align }: { children: React.ReactNode; align?: "right" }) {
  return (
    <th className={`px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 ${align === "right" ? "text-right" : "text-left"}`}>
      {children}
    </th>
  );
}
