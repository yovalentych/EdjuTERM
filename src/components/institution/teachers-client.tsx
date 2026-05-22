"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2, Clock, GraduationCap, Loader2, Mail, Phone, Plus, Send, Trash2, UserCircle, Users, X,
} from "lucide-react";
import { LiquidCard } from "@/components/ui/liquid";
import type {
  InstitutionMember,
  InstitutionMemberRole,
  InstitutionUnit,
} from "@/lib/schemas";

const ROLE_META: Record<InstitutionMemberRole, { uk: string; en: string; color: string }> = {
  rector:       { uk: "Ректор",                   en: "Rector",         color: "rose" },
  vice_rector:  { uk: "Проректор",                en: "Vice-Rector",    color: "rose" },
  dean:         { uk: "Декан",                    en: "Dean",           color: "amber" },
  vice_dean:    { uk: "Заст. декана",             en: "Vice-Dean",      color: "amber" },
  head:         { uk: "Зав. кафедри",             en: "Head",           color: "violet" },
  professor:    { uk: "Професор",                 en: "Professor",      color: "blue" },
  associate:    { uk: "Доцент",                   en: "Assoc. Prof.",   color: "blue" },
  lecturer:     { uk: "Викладач",                 en: "Lecturer",       color: "emerald" },
  assistant:    { uk: "Асистент",                 en: "Assistant",      color: "emerald" },
  researcher:   { uk: "Наук. співробітник",       en: "Researcher",     color: "teal" },
  staff:        { uk: "Допоміжний",               en: "Staff",          color: "slate" },
  admin:        { uk: "Адмін",                    en: "Admin",          color: "rose" },
};

export function TeachersClient({
  locale,
  institutionName,
  initialMembers,
  units,
}: {
  locale: "uk" | "en";
  institutionName: string;
  initialMembers: InstitutionMember[];
  units: InstitutionUnit[];
}) {
  const isUk = locale === "uk";
  const router = useRouter();
  const [members, setMembers] = useState<InstitutionMember[]>(initialMembers);
  const [showForm, setShowForm] = useState(false);
  const [invitingId, setInvitingId] = useState<string | null>(null);
  const [filterUnit, setFilterUnit] = useState<string>("");

  const filtered = filterUnit
    ? members.filter((m) => m.unitId === filterUnit)
    : members;

  return (
    <div className="space-y-4">
      <LiquidCard className="overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-br from-blue-50/70 via-white to-emerald-50/40 px-5 py-4">
          <div>
            <p className="liquid-eyebrow text-blue-700">
              {isUk ? "Викладачі та персонал" : "Teachers & staff"}
            </p>
            <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-900">
              {institutionName}
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              {members.length} {isUk ? "осіб у системі" : "people in the system"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowForm((s) => !s)}
            className="liquid-cta text-sm"
          >
            <Plus className="h-4 w-4" />
            {showForm ? (isUk ? "Сховати" : "Hide") : (isUk ? "Додати викладача" : "Add teacher")}
          </button>
        </div>
      </LiquidCard>

      {showForm && (
        <AddMemberForm
          locale={locale}
          units={units}
          onCancel={() => setShowForm(false)}
          onCreated={(m) => { setMembers((p) => [...p, m]); setShowForm(false); router.refresh(); }}
        />
      )}

      {/* Filter by unit */}
      {units.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            {isUk ? "Підрозділ" : "Unit"}:
          </span>
          <button
            type="button"
            onClick={() => setFilterUnit("")}
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              filterUnit === "" ? "bg-blue-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {isUk ? "Усі" : "All"} ({members.length})
          </button>
          {units.map((u) => {
            const count = members.filter((m) => m.unitId === u._id).length;
            return (
              <button
                key={u._id}
                type="button"
                onClick={() => setFilterUnit(u._id!)}
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  filterUnit === u._id ? "bg-blue-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {u.name} ({count})
              </button>
            );
          })}
        </div>
      )}

      {filtered.length === 0 ? (
        <LiquidCard tint="amber" className="text-center" accent>
          <Users className="mx-auto mb-3 h-10 w-10 text-amber-600" />
          <h2 className="text-base font-bold text-slate-900">
            {isUk ? "Викладачів ще немає" : "No teachers yet"}
          </h2>
          <p className="mt-1 max-w-md text-xs leading-5 text-slate-500 mx-auto">
            {isUk ? "Додайте перших викладачів і персонал — вони з'являться у каталозі курсів." : "Add the first teachers — they'll appear in the course catalog."}
          </p>
        </LiquidCard>
      ) : (
        <LiquidCard tint="blue" className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200/60 bg-slate-50/40">
                  <Th>{isUk ? "ПІБ / звання" : "Name / title"}</Th>
                  <Th>{isUk ? "Роль" : "Role"}</Th>
                  <Th>{isUk ? "Підрозділ" : "Unit"}</Th>
                  <Th>{isUk ? "Контакти" : "Contact"}</Th>
                  <Th>{isUk ? "Запрошення" : "Invite"}</Th>
                  <Th align="right">{isUk ? "Дії" : "Actions"}</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => {
                  const role = ROLE_META[m.role] ?? ROLE_META.lecturer;
                  const unit = units.find((u) => u._id === m.unitId);
                  const invite = (m as any).inviteStatus as string | undefined;
                  return (
                    <tr key={m._id} className="border-b border-slate-100/70 hover:bg-slate-50/30">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                            <UserCircle className="h-4 w-4" />
                          </span>
                          <div>
                            <p className="font-bold text-slate-900">{m.fullName}</p>
                            {m.title && <p className="text-[10px] text-slate-400">{m.title}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold bg-${role.color}-50 text-${role.color}-700`}>
                          {isUk ? role.uk : role.en}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-slate-500">{unit?.name || "—"}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex flex-col gap-0.5 text-[11px]">
                          {m.email && (
                            <a href={`mailto:${m.email}`} className="inline-flex items-center gap-1 text-emerald-700 hover:underline">
                              <Mail className="h-3 w-3" />{m.email}
                            </a>
                          )}
                          {m.phone && (
                            <span className="inline-flex items-center gap-1 text-slate-500">
                              <Phone className="h-3 w-3" />{m.phone}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        {invite === "accepted" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                            <CheckCircle2 className="h-3 w-3" />{isUk ? "прийнято" : "accepted"}
                          </span>
                        )}
                        {invite === "pending" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                            <Clock className="h-3 w-3" />{isUk ? "очікує" : "pending"}
                          </span>
                        )}
                        {(!invite || invite === "none") && m.email && (
                          <button
                            type="button"
                            disabled={invitingId === m._id}
                            onClick={async () => {
                              setInvitingId(m._id!);
                              try {
                                await fetch("/api/institution/invites", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({
                                    fullName: m.fullName, email: m.email,
                                    role: m.role, unitId: m.unitId,
                                    title: m.title, locale,
                                  }),
                                });
                                setMembers((p) => p.map((x) =>
                                  x._id === m._id ? { ...x, inviteStatus: "pending" } as any : x
                                ));
                              } finally { setInvitingId(null); }
                            }}
                            className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 hover:bg-blue-100 disabled:opacity-60"
                          >
                            {invitingId === m._id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                            {isUk ? "запросити" : "invite"}
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <button
                          type="button"
                          onClick={async () => {
                            if (!confirm(isUk ? "Видалити?" : "Delete?")) return;
                            setMembers((p) => p.filter((x) => x._id !== m._id));
                            await fetch(`/api/institution/members/${m._id}`, { method: "DELETE" }).catch(() => {});
                          }}
                          className="rounded-md p-1.5 text-rose-500 hover:bg-rose-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
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

function AddMemberForm({
  locale, units, onCancel, onCreated,
}: {
  locale: "uk" | "en";
  units: InstitutionUnit[];
  onCancel: () => void;
  onCreated: (m: InstitutionMember) => void;
}) {
  const isUk = locale === "uk";
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<InstitutionMemberRole>("lecturer");
  const [title, setTitle] = useState("");
  const [unitId, setUnitId] = useState(units[0]?._id ?? "");
  const [hiredAt, setHiredAt] = useState("");
  const [orcid, setOrcid] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    if (!fullName.trim()) return;
    setBusy(true); setErr(null);
    try {
      const res = await fetch("/api/institution/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: fullName.trim(), email, phone, role, title, unitId, hiredAt, orcid }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "save_failed");
      onCreated(data.member);
    } catch (e: any) {
      setErr(e?.message || "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <LiquidCard tint="emerald" className="overflow-hidden p-0" accent>
      <div className="flex items-center justify-between border-b border-slate-200/60 bg-emerald-50/40 px-4 py-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
          {isUk ? "Новий викладач" : "New teacher"}
        </span>
        <button type="button" onClick={onCancel} className="rounded p-1 text-slate-400 hover:bg-slate-100">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="grid gap-2 p-3 sm:grid-cols-2">
        <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder={isUk ? "ПІБ *" : "Full name *"} className="input-control rounded-lg px-3 py-1.5 text-sm sm:col-span-2" autoFocus />
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="email@..." className="input-control rounded-lg px-3 py-1.5 text-sm" />
        <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" placeholder="+380..." className="input-control rounded-lg px-3 py-1.5 text-sm" />
        <select value={role} onChange={(e) => setRole(e.target.value as InstitutionMemberRole)} className="input-control rounded-lg px-3 py-1.5 text-sm">
          {Object.entries(ROLE_META).map(([k, v]) => (
            <option key={k} value={k}>{isUk ? v.uk : v.en}</option>
          ))}
        </select>
        <select value={unitId} onChange={(e) => setUnitId(e.target.value)} className="input-control rounded-lg px-3 py-1.5 text-sm">
          <option value="">— {isUk ? "без підрозділу" : "no unit"} —</option>
          {units.map((u) => (
            <option key={u._id} value={u._id}>{u.name}</option>
          ))}
        </select>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={isUk ? "Звання (к.б.н., PhD)" : "Title (PhD, DSc)"} className="input-control rounded-lg px-3 py-1.5 text-sm sm:col-span-2" />
      </div>
      <div className="grid gap-2 px-3 pb-3 sm:grid-cols-2">
        <label className="block">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
            {isUk ? "Дата прийому" : "Hired date"}
          </span>
          <input
            type="date"
            value={hiredAt}
            onChange={(e) => setHiredAt(e.target.value)}
            className="input-control mt-1 rounded-lg px-3 py-1.5 text-sm"
          />
        </label>
        <label className="block">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
            ORCID
          </span>
          <input
            value={orcid}
            onChange={(e) => setOrcid(e.target.value)}
            placeholder="0000-0000-0000-0000"
            className="input-control mt-1 rounded-lg px-3 py-1.5 text-sm font-mono"
            pattern="\d{4}-\d{4}-\d{4}-\d{3}[\dX]"
            maxLength={19}
          />
        </label>
      </div>
      <div className="border-t border-slate-200/60 bg-slate-50/30 px-3 py-2">
        <button
          type="button"
          onClick={submit}
          disabled={busy || !fullName.trim()}
          className="liquid-cta text-xs disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <GraduationCap className="h-3.5 w-3.5" />}
          {isUk ? "Додати" : "Add"}
        </button>
        {err && <p className="mt-2 text-xs text-rose-700">{err}</p>}
      </div>
    </LiquidCard>
  );
}

function Th({ children, align }: { children: React.ReactNode; align?: "right" }) {
  return (
    <th className={`px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 ${align === "right" ? "text-right" : "text-left"}`}>
      {children}
    </th>
  );
}
