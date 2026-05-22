"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AtSign, CheckCircle2, Clock, FlaskConical, GraduationCap,
  Info, Loader2, Mail, Pencil, Phone, Plus, Send, Shield,
  Trash2, UserCircle, Users, X,
} from "lucide-react";
import { LiquidCard } from "@/components/ui/liquid";
import { PersonPicker, invalidatePersonCache } from "@/components/institution/person-picker";
import type {
  InstitutionMember, InstitutionMemberRole, InstitutionUnit, StaffCategory,
} from "@/lib/schemas";

// ── Category metadata ─────────────────────────────────────────────────────────

type CategoryId = "all" | StaffCategory;

const CATEGORY_META: Record<CategoryId, {
  uk: string; en: string;
  bg: string; text: string; activeBg: string; icon: React.ReactNode;
}> = {
  all:        { uk: "Всі",            en: "All",          bg: "bg-slate-100",   text: "text-slate-700", activeBg: "bg-slate-800 text-white",   icon: <Users className="h-3.5 w-3.5" /> },
  leadership: { uk: "Керівництво",    en: "Leadership",   bg: "bg-violet-50",   text: "text-violet-700",activeBg: "bg-violet-700 text-white",   icon: <Shield className="h-3.5 w-3.5" /> },
  teaching:   { uk: "Викладачі",      en: "Teaching",     bg: "bg-emerald-50",  text: "text-emerald-700",activeBg:"bg-emerald-700 text-white",  icon: <GraduationCap className="h-3.5 w-3.5" /> },
  research:   { uk: "Науковці",       en: "Research",     bg: "bg-blue-50",     text: "text-blue-700",  activeBg: "bg-blue-700 text-white",    icon: <FlaskConical className="h-3.5 w-3.5" /> },
  admin:      { uk: "Адміністрація",  en: "Admin staff",  bg: "bg-amber-50",    text: "text-amber-700", activeBg: "bg-amber-600 text-white",   icon: <Shield className="h-3.5 w-3.5" /> },
  other:      { uk: "Інші",           en: "Other",        bg: "bg-slate-50",    text: "text-slate-600", activeBg: "bg-slate-600 text-white",   icon: <UserCircle className="h-3.5 w-3.5" /> },
};

const ROLE_LABELS: Record<InstitutionMemberRole, { uk: string; en: string }> = {
  rector:      { uk: "Ректор",             en: "Rector" },
  vice_rector: { uk: "Проректор",          en: "Vice-Rector" },
  dean:        { uk: "Декан",              en: "Dean" },
  vice_dean:   { uk: "Заст. декана",       en: "Vice-Dean" },
  head:        { uk: "Зав. кафедри",       en: "Dept. Head" },
  professor:   { uk: "Професор",           en: "Professor" },
  associate:   { uk: "Доцент",             en: "Assoc. Prof." },
  lecturer:    { uk: "Викладач",           en: "Lecturer" },
  assistant:   { uk: "Асистент",           en: "Assistant" },
  researcher:  { uk: "Наук. співробітник", en: "Researcher" },
  staff:       { uk: "Персонал",           en: "Staff" },
  admin:       { uk: "Адмін",             en: "Admin" },
};

function effectiveCategory(m: InstitutionMember): StaffCategory {
  if (m.staffCategory && m.staffCategory !== "other") return m.staffCategory as StaffCategory;
  if (["rector","vice_rector","dean","vice_dean","head"].includes(m.role)) return "leadership";
  if (["professor","associate","lecturer","assistant"].includes(m.role)) return "teaching";
  if (m.role === "researcher") return "research";
  if (m.role === "admin" || m.role === "staff") return "admin";
  return "other";
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0].slice(0, 2).toUpperCase();
}

const AVATAR_COLORS: [string, string][] = [
  ["bg-violet-100", "text-violet-700"],
  ["bg-emerald-100", "text-emerald-700"],
  ["bg-blue-100", "text-blue-700"],
  ["bg-amber-100", "text-amber-700"],
  ["bg-rose-100", "text-rose-700"],
  ["bg-teal-100", "text-teal-700"],
];

function avatarColor(name: string): [string, string] {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

// ── Main component ────────────────────────────────────────────────────────────

export function StaffClient({
  locale, institutionName, initialMembers, units, autoSyncedCount,
}: {
  locale: "uk" | "en";
  institutionName: string;
  initialMembers: InstitutionMember[];
  units: InstitutionUnit[];
  autoSyncedCount: number;
}) {
  const isUk = locale === "uk";
  const router = useRouter();
  const [members, setMembers] = useState<InstitutionMember[]>(initialMembers);
  const [activeCategory, setActiveCategory] = useState<CategoryId>("all");
  const [filterUnitId, setFilterUnitId] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState<InstitutionMember | null>(null);
  const [invitingId, setInvitingId] = useState<string | null>(null);
  const [syncBanner, setSyncBanner] = useState(autoSyncedCount > 0);

  const categoryOrder: CategoryId[] = ["all", "leadership", "teaching", "research", "admin", "other"];

  function countForCategory(cat: CategoryId) {
    if (cat === "all") return members.length;
    return members.filter((m) => effectiveCategory(m) === cat).length;
  }

  const filtered = members
    .filter((m) => activeCategory === "all" || effectiveCategory(m) === activeCategory)
    .filter((m) => !filterUnitId || m.unitId === filterUnitId)
    .sort((a, b) => a.fullName.localeCompare(b.fullName, locale));

  return (
    <div className="space-y-4">
      {/* Header */}
      <LiquidCard className="overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-br from-violet-50/70 via-white to-blue-50/40 px-5 py-4">
          <div>
            <p className="liquid-eyebrow text-violet-700">
              {isUk ? "Працівники" : "Staff registry"}
            </p>
            <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-900">{institutionName}</h1>
            <p className="mt-1 text-xs text-slate-500">
              {members.length} {isUk ? "осіб у реєстрі" : "people in the registry"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => { setShowForm(true); setEditingMember(null); }}
            className="liquid-cta text-sm"
          >
            <Plus className="h-4 w-4" />
            {isUk ? "Додати працівника" : "Add person"}
          </button>
        </div>
      </LiquidCard>

      {/* Auto-sync banner */}
      {syncBanner && (
        <div className="flex items-start gap-3 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3">
          <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-violet-600" />
          <p className="flex-1 text-xs text-violet-800">
            {isUk
              ? `Автоматично створено ${autoSyncedCount} ${autoSyncedCount === 1 ? "картку" : "карток"} — знайдено імена керівників підрозділів та адміністрації, яких не було у реєстрі.`
              : `Auto-created ${autoSyncedCount} ${autoSyncedCount === 1 ? "record" : "records"} — found unit heads and admins not yet in the registry.`}
          </p>
          <button type="button" onClick={() => setSyncBanner(false)} className="text-violet-400 hover:text-violet-700">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Category tabs */}
      <div className="flex flex-wrap gap-1.5">
        {categoryOrder.map((cat) => {
          const count = countForCategory(cat);
          if (cat !== "all" && count === 0) return null;
          const meta = CATEGORY_META[cat];
          const active = activeCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition ${
                active ? meta.activeBg : `${meta.bg} ${meta.text} hover:opacity-80`
              }`}
            >
              {meta.icon}
              {isUk ? meta.uk : meta.en}
              <span className={`rounded-full px-1.5 py-0 text-[10px] ${active ? "bg-white/25" : "bg-white/60"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Unit filter */}
      {units.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {isUk ? "Підрозділ" : "Unit"}:
          </span>
          <select
            value={filterUnitId}
            onChange={(e) => setFilterUnitId(e.target.value)}
            className="input-control rounded-lg px-2 py-1 text-xs"
          >
            <option value="">— {isUk ? "всі підрозділи" : "all units"} —</option>
            {units.map((u) => (
              <option key={u._id} value={u._id}>{u.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Add / Edit form */}
      {(showForm || editingMember) && (
        <StaffForm
          locale={locale}
          units={units}
          existing={editingMember ?? undefined}
          onCancel={() => { setShowForm(false); setEditingMember(null); }}
          onSaved={(m) => {
            if (editingMember) {
              setMembers((p) => p.map((x) => x._id === m._id ? m : x));
            } else {
              setMembers((p) => [...p, m]);
              invalidatePersonCache();
              router.refresh();
            }
            setShowForm(false);
            setEditingMember(null);
          }}
          onPickExisting={(m) => {
            setShowForm(false);
            setEditingMember(m);
          }}
        />
      )}

      {/* Empty state */}
      {filtered.length === 0 && !showForm && !editingMember && (
        <LiquidCard tint="amber" className="text-center" accent>
          <Users className="mx-auto mb-3 h-10 w-10 text-amber-600" />
          <h2 className="text-base font-bold text-slate-900">
            {activeCategory === "all"
              ? (isUk ? "Реєстр працівників порожній" : "Staff registry is empty")
              : (isUk ? "У цій категорії немає записів" : "No records in this category")}
          </h2>
          <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-500">
            {isUk
              ? "Додайте першого працівника або заповніть імена керівників підрозділів — вони потраплять сюди автоматично."
              : "Add your first person or fill unit head names — they will sync here automatically."}
          </p>
        </LiquidCard>
      )}

      {/* Cards grid */}
      {filtered.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((m) => (
            <StaffCard
              key={m._id}
              member={m}
              locale={locale}
              units={units}
              invitingId={invitingId}
              onEdit={() => { setEditingMember(m); setShowForm(false); }}
              onDelete={async () => {
                if (!confirm(isUk ? "Видалити запис про працівника?" : "Delete this person?")) return;
                setMembers((p) => p.filter((x) => x._id !== m._id));
                await fetch(`/api/institution/members/${m._id}`, { method: "DELETE" }).catch(() => {});
              }}
              onInvite={async () => {
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
                    x._id === m._id ? { ...x, inviteStatus: "pending" } as InstitutionMember : x
                  ));
                } finally { setInvitingId(null); }
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Staff card ────────────────────────────────────────────────────────────────

function StaffCard({
  member: m, locale, units, invitingId, onEdit, onDelete, onInvite,
}: {
  member: InstitutionMember;
  locale: "uk" | "en";
  units: InstitutionUnit[];
  invitingId: string | null;
  onEdit: () => void;
  onDelete: () => void;
  onInvite: () => void;
}) {
  const isUk = locale === "uk";
  const cat = effectiveCategory(m);
  const catMeta = CATEGORY_META[cat];
  const [avatarBg, avatarText] = avatarColor(m.fullName);
  const unit = units.find((u) => u._id === m.unitId);
  const invite = (m as any).inviteStatus as string | undefined;
  const role = ROLE_LABELS[m.role] ?? ROLE_LABELS.staff;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm transition hover:shadow-md">
      {/* Top row: avatar + name + actions */}
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold ${avatarBg} ${avatarText}`}>
          {initials(m.fullName)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold text-slate-900">{m.fullName}</p>
          {m.title && <p className="truncate text-[11px] text-slate-400">{m.title}</p>}
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={onEdit} title={isUk ? "Редагувати" : "Edit"} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={onDelete} title={isUk ? "Видалити" : "Delete"} className="rounded-md p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${catMeta.bg} ${catMeta.text}`}>
          {isUk ? catMeta.uk : catMeta.en}
        </span>
        <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
          {isUk ? role.uk : role.en}
        </span>
        {unit && (
          <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-[10px] text-slate-500 ring-1 ring-slate-200">
            {unit.shortName || unit.name}
          </span>
        )}
      </div>

      {/* Contact */}
      {(m.email || m.phone || m.orcid) && (
        <div className="flex flex-col gap-0.5 text-[11px]">
          {m.email && (
            <a href={`mailto:${m.email}`} className="inline-flex items-center gap-1 truncate text-emerald-700 hover:underline">
              <Mail className="h-3 w-3 flex-shrink-0" />{m.email}
            </a>
          )}
          {m.phone && (
            <span className="inline-flex items-center gap-1 text-slate-500">
              <Phone className="h-3 w-3 flex-shrink-0" />{m.phone}
            </span>
          )}
          {m.orcid && (
            <span className="inline-flex items-center gap-1 font-mono text-[10px] text-slate-400">
              <AtSign className="h-3 w-3 flex-shrink-0" />{m.orcid}
            </span>
          )}
        </div>
      )}

      {/* Invite */}
      <div className="mt-auto pt-1">
        {invite === "accepted" && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
            <CheckCircle2 className="h-3 w-3" />{isUk ? "У системі" : "Joined"}
          </span>
        )}
        {invite === "pending" && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
            <Clock className="h-3 w-3" />{isUk ? "Запрошення надіслано" : "Invite pending"}
          </span>
        )}
        {(!invite || invite === "none") && m.email && (
          <button
            type="button"
            disabled={invitingId === m._id}
            onClick={onInvite}
            className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-700 hover:bg-blue-100 disabled:opacity-60"
          >
            {invitingId === m._id
              ? <Loader2 className="h-3 w-3 animate-spin" />
              : <Send className="h-3 w-3" />}
            {isUk ? "Запросити до системи" : "Send invite"}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Add / Edit form ───────────────────────────────────────────────────────────

const STAFF_CATEGORIES_ORDER: StaffCategory[] = ["leadership", "teaching", "research", "admin", "other"];

const CATEGORY_UK: Record<StaffCategory, string> = {
  leadership: "Керівництво",
  teaching:   "Викладачі",
  research:   "Науковці",
  admin:      "Адміністрація",
  other:      "Інші",
};

const ROLE_ORDER: InstitutionMemberRole[] = [
  "rector","vice_rector","dean","vice_dean","head",
  "professor","associate","lecturer","assistant",
  "researcher","staff","admin",
];

function StaffForm({
  locale, units, existing, onCancel, onSaved, onPickExisting,
}: {
  locale: "uk" | "en";
  units: InstitutionUnit[];
  existing?: InstitutionMember;
  onCancel: () => void;
  onSaved: (m: InstitutionMember) => void;
  onPickExisting?: (m: InstitutionMember) => void;
}) {
  const isUk = locale === "uk";
  const [fullName, setFullName] = useState(existing?.fullName ?? "");
  const [email, setEmail] = useState(existing?.email ?? "");
  const [phone, setPhone] = useState(existing?.phone ?? "");
  const [role, setRole] = useState<InstitutionMemberRole>(existing?.role ?? "lecturer");
  const [title, setTitle] = useState(existing?.title ?? "");
  const [position, setPosition] = useState(existing?.position ?? "");
  const [unitId, setUnitId] = useState(existing?.unitId ?? (units[0]?._id ?? ""));
  const [staffCategory, setStaffCategory] = useState<StaffCategory>(
    (existing?.staffCategory as StaffCategory) ?? "other"
  );
  const [hiredAt, setHiredAt] = useState(existing?.hiredAt ?? "");
  const [orcid, setOrcid] = useState(existing?.orcid ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    if (!fullName.trim()) return;
    setBusy(true); setErr(null);
    try {
      const payload = { fullName: fullName.trim(), email, phone, role, title, position, unitId, staffCategory, hiredAt, orcid };
      let res: Response;
      if (existing) {
        res = await fetch(`/api/institution/members/${existing._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error((await res.json())?.error || "save_failed");
        onSaved({ ...existing, ...payload } as InstitutionMember);
      } else {
        res = await fetch("/api/institution/members", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "save_failed");
        onSaved(data.member);
      }
    } catch (e: any) {
      setErr(e?.message || "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <LiquidCard tint="emerald" className="overflow-hidden p-0" accent>
      <div className="flex items-center justify-between border-b border-slate-200/60 bg-violet-50/50 px-4 py-2.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-violet-700">
          {existing ? (isUk ? "Редагувати працівника" : "Edit person") : (isUk ? "Новий працівник" : "New person")}
        </span>
        <button type="button" onClick={onCancel} className="rounded p-1 text-slate-400 hover:bg-slate-100">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="grid gap-2 p-3 sm:grid-cols-2">
        <PersonPicker
          value={fullName}
          onChange={setFullName}
          onSelectMember={(m) => {
            if (!existing && onPickExisting) {
              // Switch to edit mode for that existing record instead of creating a duplicate
              onPickExisting(m);
            } else {
              // Editing: auto-fill fields from the selected member
              setFullName(m.fullName);
              if (m.email) setEmail(m.email);
              if (m.phone) setPhone(m.phone);
              if (m.title) setTitle(m.title);
              if (m.position) setPosition(m.position);
              if (m.role) setRole(m.role);
              if (m.staffCategory) setStaffCategory(m.staffCategory as StaffCategory);
              if (m.unitId) setUnitId(m.unitId);
            }
          }}
          placeholder={isUk ? "ПІБ *" : "Full name *"}
          className="input-control rounded-lg px-3 py-1.5 text-sm sm:col-span-2"
          autoFocus
        />
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="email@..." className="input-control rounded-lg px-3 py-1.5 text-sm" />
        <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" placeholder="+380..." className="input-control rounded-lg px-3 py-1.5 text-sm" />

        {/* Category */}
        <label className="block">
          <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
            {isUk ? "Категорія" : "Category"}
          </span>
          <select value={staffCategory} onChange={(e) => setStaffCategory(e.target.value as StaffCategory)} className="input-control w-full rounded-lg px-3 py-1.5 text-sm">
            {STAFF_CATEGORIES_ORDER.map((c) => (
              <option key={c} value={c}>{isUk ? CATEGORY_UK[c] : CATEGORY_META[c].en}</option>
            ))}
          </select>
        </label>

        {/* Role */}
        <label className="block">
          <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
            {isUk ? "Роль" : "Role"}
          </span>
          <select value={role} onChange={(e) => setRole(e.target.value as InstitutionMemberRole)} className="input-control w-full rounded-lg px-3 py-1.5 text-sm">
            {ROLE_ORDER.map((r) => (
              <option key={r} value={r}>{isUk ? ROLE_LABELS[r].uk : ROLE_LABELS[r].en}</option>
            ))}
          </select>
        </label>

        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={isUk ? "Вчений ступінь (к.б.н., PhD…)" : "Academic title (PhD, DSc…)"} className="input-control rounded-lg px-3 py-1.5 text-sm sm:col-span-2" />
        <input value={position} onChange={(e) => setPosition(e.target.value)} placeholder={isUk ? "Повна посада" : "Full position"} className="input-control rounded-lg px-3 py-1.5 text-sm sm:col-span-2" />

        <select value={unitId} onChange={(e) => setUnitId(e.target.value)} className="input-control rounded-lg px-3 py-1.5 text-sm">
          <option value="">— {isUk ? "без підрозділу" : "no unit"} —</option>
          {units.map((u) => (
            <option key={u._id} value={u._id}>{u.name}</option>
          ))}
        </select>

        <label className="block">
          <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
            {isUk ? "Дата прийому" : "Hired date"}
          </span>
          <input type="date" value={hiredAt} onChange={(e) => setHiredAt(e.target.value)} className="input-control w-full rounded-lg px-3 py-1.5 text-sm" />
        </label>

        <input
          value={orcid} onChange={(e) => setOrcid(e.target.value)}
          placeholder="ORCID: 0000-0000-0000-0000"
          className="input-control rounded-lg px-3 py-1.5 text-sm font-mono sm:col-span-2"
          maxLength={19}
        />
      </div>

      <div className="flex items-center gap-3 border-t border-slate-200/60 bg-slate-50/30 px-3 py-2">
        <button
          type="button"
          onClick={submit}
          disabled={busy || !fullName.trim()}
          className="liquid-cta text-xs disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserCircle className="h-3.5 w-3.5" />}
          {existing ? (isUk ? "Зберегти" : "Save") : (isUk ? "Додати" : "Add")}
        </button>
        {err && <p className="text-xs text-rose-700">{err}</p>}
      </div>
    </LiquidCard>
  );
}
