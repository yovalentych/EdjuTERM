"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AtSign, ChevronDown, ChevronUp, Layers, LayoutGrid, List, Loader2,
  Pencil, Phone, Plus, Sparkles, Trash2, X,
} from "lucide-react";
import { LiquidCard } from "@/components/ui/liquid";
import { PersonPicker, invalidatePersonCache } from "@/components/institution/person-picker";
import type { InstitutionAdmin, InstitutionUnit, InstitutionUnitType } from "@/lib/schemas";

// ── Type metadata ─────────────────────────────────────────────────────────────

export const UNIT_TYPE_LABELS: Record<InstitutionUnitType, { uk: string; en: string; emoji: string }> = {
  faculty:    { uk: "Факультет",        en: "Faculty",        emoji: "🏛" },
  institute:  { uk: "Інститут",         en: "Institute",      emoji: "🏫" },
  department: { uk: "Кафедра",          en: "Department",     emoji: "📚" },
  division:   { uk: "Відділ",           en: "Division",       emoji: "🔬" },
  lab:        { uk: "Лабораторія",      en: "Laboratory",     emoji: "🧪" },
  sector:     { uk: "Сектор",           en: "Sector",         emoji: "🔭" },
  group:      { uk: "Наукова група",    en: "Research group", emoji: "👥" },
  center:     { uk: "Центр",            en: "Center",         emoji: "🌐" },
  council:    { uk: "Рада",             en: "Council",        emoji: "⚖️" },
  office:     { uk: "Адмін. підрозділ", en: "Office",         emoji: "🏢" },
  other:      { uk: "Інше",             en: "Other",          emoji: "📁" },
};

// ── Board sections config ─────────────────────────────────────────────────────

type SectionConfig = {
  id: string;
  label: { uk: string; en: string };
  types: InstitutionUnitType[];
  headerBg: string;
  ring: string;
  cardAccent: string;
  childPill: string;
};

const BOARD_SECTIONS: SectionConfig[] = [
  {
    id: "academic",
    label: { uk: "Академічні підрозділи", en: "Academic units" },
    types: ["faculty", "institute", "department"],
    headerBg: "bg-emerald-600",
    ring:      "ring-1 ring-emerald-200",
    cardAccent: "border-l-4 border-emerald-400",
    childPill: "bg-emerald-100 text-emerald-800",
  },
  {
    id: "research",
    label: { uk: "Наукові підрозділи", en: "Research units" },
    types: ["division", "lab", "sector", "group"],
    headerBg: "bg-blue-600",
    ring:      "ring-1 ring-blue-200",
    cardAccent: "border-l-4 border-blue-400",
    childPill: "bg-blue-100 text-blue-800",
  },
  {
    id: "governance",
    label: { uk: "Ради, центри та комісії", en: "Councils, centers & committees" },
    types: ["council", "center"],
    headerBg: "bg-violet-600",
    ring:      "ring-1 ring-violet-200",
    cardAccent: "border-l-4 border-violet-400",
    childPill: "bg-violet-100 text-violet-800",
  },
  {
    id: "admin",
    label: { uk: "Адміністративні та допоміжні", en: "Administrative & support" },
    types: ["office", "other"],
    headerBg: "bg-slate-500",
    ring:      "ring-1 ring-slate-200",
    cardAccent: "border-l-4 border-slate-400",
    childPill: "bg-slate-100 text-slate-700",
  },
];

// ── Tree builder ──────────────────────────────────────────────────────────────

type UnitNode = InstitutionUnit & { children: UnitNode[] };

function buildTree(units: InstitutionUnit[]): UnitNode[] {
  const map = new Map<string, UnitNode>();
  units.forEach((u) => map.set(u._id!, { ...u, children: [] }));
  const roots: UnitNode[] = [];
  for (const node of map.values()) {
    if (node.parentId && map.has(node.parentId)) {
      map.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  const sort = (a: UnitNode, b: UnitNode) => a.orderIndex - b.orderIndex || a.name.localeCompare(b.name);
  roots.sort(sort);
  for (const n of map.values()) n.children.sort(sort);
  return roots;
}

function collectDescendants(rootId: string, units: InstitutionUnit[]): string[] {
  const ids = [rootId];
  let i = 0;
  while (i < ids.length) {
    const current = ids[i++];
    for (const u of units) if (u.parentId === current) ids.push(u._id!);
  }
  return ids;
}

// ── Main component ────────────────────────────────────────────────────────────

export function StructureClient({
  locale,
  institutionName,
  initialUnits,
  initialAdmins,
}: {
  locale: "uk" | "en";
  institutionName: string;
  initialUnits: InstitutionUnit[];
  initialAdmins: InstitutionAdmin[];
}) {
  const isUk = locale === "uk";
  const router = useRouter();
  const [units, setUnits] = useState<InstitutionUnit[]>(initialUnits);
  const [admins, setAdmins] = useState<InstitutionAdmin[]>(initialAdmins);
  const [view, setView] = useState<"board" | "tree">("board");
  const [adding, setAdding] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const tree = useMemo(() => buildTree(units), [units]);

  const actions = {
    update: (u: InstitutionUnit) => setUnits((prev) => prev.map((x) => x._id === u._id ? u : x)),
    create: (u: InstitutionUnit) => { setUnits((prev) => [...prev, u]); router.refresh(); },
    delete: async (id: string) => {
      if (!confirm(isUk ? "Видалити підрозділ і всі вкладені?" : "Delete unit and all descendants?")) return;
      const ids = collectDescendants(id, units);
      for (const x of ids) await fetch(`/api/institution/units/${x}`, { method: "DELETE" }).catch(() => {});
      setUnits((prev) => prev.filter((u) => !ids.includes(u._id!)));
    },
  };

  return (
    <div className="space-y-4">
      {/* ── Administration block ─────────────────────────────── */}
      <AdminPanel
        locale={locale}
        admins={admins}
        onCreated={(a) => setAdmins((prev) => [...prev, a].sort((x, y) => x.orderIndex - y.orderIndex))}
        onUpdated={(a) => setAdmins((prev) => prev.map((x) => x._id === a._id ? a : x))}
        onDeleted={(id) => setAdmins((prev) => prev.filter((x) => x._id !== id))}
      />

      {/* ── Header ──────────────────────────────────────────── */}
      <LiquidCard className="overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-br from-emerald-50/70 via-white to-blue-50/40 px-5 py-4">
          <div>
            <p className="liquid-eyebrow text-emerald-700">
              {isUk ? "Структура закладу" : "Institution structure"}
            </p>
            <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-900">{institutionName}</h1>
            <p className="mt-1 text-xs text-slate-500">
              {units.length} {isUk ? "підрозділів" : "units"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex rounded-xl border border-slate-200 bg-white p-0.5">
              <button
                type="button"
                onClick={() => setView("board")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  view === "board" ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                {isUk ? "Карта" : "Map"}
              </button>
              <button
                type="button"
                onClick={() => setView("tree")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  view === "tree" ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <List className="h-3.5 w-3.5" />
                {isUk ? "Дерево" : "Tree"}
              </button>
            </div>
            <button
              type="button"
              onClick={() => { setAdding(""); setView("tree"); }}
              className="liquid-cta text-sm"
            >
              <Plus className="h-4 w-4" />
              {isUk ? "Додати" : "Add unit"}
            </button>
          </div>
        </div>
      </LiquidCard>

      {units.length === 0 && !adding && (
        <LiquidCard tint="amber" className="text-center" accent>
          <Layers className="mx-auto mb-3 h-10 w-10 text-amber-600" />
          <h2 className="text-base font-bold text-slate-900">
            {isUk ? "Структура порожня" : "Structure is empty"}
          </h2>
          <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-500">
            {isUk
              ? "Почніть з факультетів / інститутів, потім додавайте кафедри і лабораторії."
              : "Start with faculties / institutes, then add departments and labs."}
          </p>
        </LiquidCard>
      )}

      {view === "board" ? (
        <BoardView
          tree={tree}
          units={units}
          locale={locale}
          institutionName={institutionName}
          editingId={editingId}
          addingId={adding}
          setEditingId={setEditingId}
          setAddingId={setAdding}
          onUpdate={actions.update}
          onCreate={actions.create}
          onDelete={actions.delete}
        />
      ) : (
        <TreeView
          tree={tree}
          units={units}
          locale={locale}
          adding={adding}
          setAdding={setAdding}
          onUpdate={actions.update}
          onCreate={actions.create}
          onDelete={actions.delete}
        />
      )}
    </div>
  );
}

// ── Admin Panel ───────────────────────────────────────────────────────────────

function AdminPanel({
  locale, admins, onCreated, onUpdated, onDeleted,
}: {
  locale: "uk" | "en";
  admins: InstitutionAdmin[];
  onCreated: (a: InstitutionAdmin) => void;
  onUpdated: (a: InstitutionAdmin) => void;
  onDeleted: (id: string) => void;
}) {
  const isUk = locale === "uk";
  const [open, setOpen] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const sorted = [...admins].sort((a, b) => a.orderIndex - b.orderIndex);
  const featured = sorted[0] ?? null;
  const rest = sorted.slice(1);

  return (
    <div className="overflow-hidden rounded-2xl ring-1 ring-amber-200 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between bg-gradient-to-r from-amber-600 to-orange-600 px-5 py-3">
        <button
          type="button"
          onClick={() => setOpen((s) => !s)}
          className="flex flex-1 items-center gap-2 text-left"
        >
          <span className="text-sm font-bold uppercase tracking-wide text-white">
            {isUk ? "Адміністративний склад" : "Administration"}
          </span>
          {admins.length > 0 && (
            <span className="rounded-full bg-white/25 px-2 py-0.5 text-[10px] text-white">
              {admins.length}
            </span>
          )}
          {open
            ? <ChevronUp className="ml-1 h-4 w-4 text-white/70" />
            : <ChevronDown className="ml-1 h-4 w-4 text-white/70" />}
        </button>
        <button
          type="button"
          onClick={() => { setShowForm(true); setOpen(true); }}
          className="rounded-lg bg-white/20 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-white/30"
        >
          + {isUk ? "Додати" : "Add"}
        </button>
      </div>

      {open && (
        <div className="bg-gradient-to-br from-amber-50/60 via-white to-orange-50/30 p-4">
          {/* Add form */}
          {showForm && (
            <div className="mb-4">
              <AdminForm
                locale={locale}
                onCancel={() => setShowForm(false)}
                onSaved={(a) => { onCreated(a); setShowForm(false); invalidatePersonCache(); }}
              />
            </div>
          )}

          {admins.length === 0 && !showForm && (
            <p className="py-4 text-center text-xs text-slate-400">
              {isUk
                ? "Додайте директора, заступників та вченого секретаря"
                : "Add director, deputies and scientific secretary"}
            </p>
          )}

          {/* Featured card (first by orderIndex = director) */}
          {featured && (
            <div className="mb-4 flex justify-center">
              {editingId === featured._id ? (
                <div className="w-full max-w-lg">
                  <AdminForm locale={locale} admin={featured}
                    onCancel={() => setEditingId(null)}
                    onSaved={(a) => { onUpdated(a); setEditingId(null); }} />
                </div>
              ) : (
                <AdminFeaturedCard admin={featured} locale={locale}
                  onEdit={() => setEditingId(featured._id!)}
                  onDelete={() => onDeleted(featured._id!)} />
              )}
            </div>
          )}

          {/* Connector line from featured to rest */}
          {featured && rest.length > 0 && (
            <div className="mx-auto mb-2 h-6 w-px bg-amber-200" />
          )}

          {/* Rest in a grid */}
          {rest.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((a) =>
                editingId === a._id ? (
                  <AdminForm key={a._id} locale={locale} admin={a}
                    onCancel={() => setEditingId(null)}
                    onSaved={(u) => { onUpdated(u); setEditingId(null); }} />
                ) : (
                  <AdminCard key={a._id} admin={a} locale={locale}
                    onEdit={() => setEditingId(a._id!)}
                    onDelete={() => onDeleted(a._id!)} />
                )
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AdminFeaturedCard({
  admin, locale, onEdit, onDelete,
}: {
  admin: InstitutionAdmin;
  locale: "uk" | "en";
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isUk = locale === "uk";
  const initials = admin.fullName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="group relative w-full max-w-sm overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 p-5 text-center shadow-lg ring-1 ring-amber-300/50">
      {/* Actions */}
      <div className="absolute right-3 top-3 hidden gap-1 group-hover:flex">
        <button type="button" onClick={onEdit}
          className="rounded-md p-1.5 text-slate-400 hover:bg-white/10 hover:text-white">
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button type="button" onClick={() => { if (confirm(isUk ? "Видалити?" : "Delete?")) onDelete(); }}
          className="rounded-md p-1.5 text-slate-400 hover:bg-rose-900/40 hover:text-rose-400">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Avatar */}
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/20 ring-2 ring-amber-400/40">
        <span className="text-xl font-bold text-amber-300">{initials}</span>
      </div>

      <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-amber-400">
        {admin.position}
      </p>
      <h3 className="mt-1 text-base font-bold leading-tight text-white">{admin.fullName}</h3>
      {admin.title && (
        <p className="mt-1 text-xs leading-relaxed text-slate-400">{admin.title}</p>
      )}
      <div className="mt-3 flex flex-wrap justify-center gap-3 text-[11px] text-slate-400">
        {admin.phone && (
          <span className="flex items-center gap-1">
            <Phone className="h-3 w-3 text-amber-500/60" />
            {admin.phone}
          </span>
        )}
        {admin.email && (
          <a href={`mailto:${admin.email}`} className="flex items-center gap-1 hover:text-amber-300">
            <AtSign className="h-3 w-3 text-amber-500/60" />
            {admin.email}
          </a>
        )}
      </div>
    </div>
  );
}

function AdminCard({
  admin, locale, onEdit, onDelete,
}: {
  admin: InstitutionAdmin;
  locale: "uk" | "en";
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isUk = locale === "uk";
  const initials = admin.fullName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="group relative flex items-start gap-3 rounded-xl border border-amber-100 bg-white p-3.5 shadow-sm transition hover:shadow-md hover:border-amber-200">
      {/* Actions */}
      <div className="absolute right-2 top-2 hidden gap-0.5 group-hover:flex">
        <button type="button" onClick={onEdit}
          className="rounded p-1 text-slate-300 hover:bg-blue-50 hover:text-blue-600">
          <Pencil className="h-3 w-3" />
        </button>
        <button type="button" onClick={() => { if (confirm(isUk ? "Видалити?" : "Delete?")) onDelete(); }}
          className="rounded p-1 text-slate-300 hover:bg-rose-50 hover:text-rose-600">
          <Trash2 className="h-3 w-3" />
        </button>
      </div>

      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-700">
        {initials}
      </div>
      <div className="min-w-0 flex-1 pr-10">
        <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600">{admin.position}</p>
        <h3 className="mt-0.5 text-sm font-bold leading-snug text-slate-900">{admin.fullName}</h3>
        {admin.title && <p className="mt-0.5 text-[10px] text-slate-500">{admin.title}</p>}
        <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-slate-400">
          {admin.phone && (
            <span className="flex items-center gap-0.5">
              <Phone className="h-2.5 w-2.5" /> {admin.phone}
            </span>
          )}
          {admin.email && (
            <a href={`mailto:${admin.email}`} className="flex items-center gap-0.5 hover:text-amber-600">
              <AtSign className="h-2.5 w-2.5" /> {admin.email}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function AdminForm({
  locale, admin, onCancel, onSaved,
}: {
  locale: "uk" | "en";
  admin?: InstitutionAdmin;
  onCancel: () => void;
  onSaved: (a: InstitutionAdmin) => void;
}) {
  const isUk = locale === "uk";
  const [position, setPosition] = useState(admin?.position ?? "");
  const [fullName, setFullName] = useState(admin?.fullName ?? "");
  const [title, setTitle] = useState(admin?.title ?? "");
  const [phone, setPhone] = useState(admin?.phone ?? "");
  const [email, setEmail] = useState(admin?.email ?? "");
  const [orderIndex, setOrderIndex] = useState(admin?.orderIndex ?? 99);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!position.trim() || !fullName.trim()) return;
    setBusy(true);
    try {
      const body = { position: position.trim(), fullName: fullName.trim(), title, phone, email, orderIndex };
      let res: Response;
      if (admin?._id) {
        res = await fetch(`/api/institution/admins/${admin._id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
        });
        if (res.ok) onSaved({ ...admin, ...body });
      } else {
        res = await fetch("/api/institution/admins", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
        });
        const data = await res.json();
        if (res.ok && data.admin) onSaved(data.admin);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
          {admin ? (isUk ? "Редагування" : "Edit") : (isUk ? "Новий запис" : "New entry")}
        </span>
        <button type="button" onClick={onCancel} className="rounded p-0.5 text-slate-400 hover:text-slate-600">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <input value={position} onChange={(e) => setPosition(e.target.value)}
          placeholder={isUk ? "Посада *" : "Position *"}
          className="input-control col-span-full rounded-lg px-3 py-1.5 text-sm" autoFocus />
        <PersonPicker
          value={fullName}
          onChange={setFullName}
          onSelectMember={(m) => {
            setFullName(m.fullName);
            if (m.title) setTitle(m.title);
            if (m.phone) setPhone(m.phone);
            if (m.email) setEmail(m.email);
          }}
          placeholder={isUk ? "ПІБ *" : "Full name *"}
          className="input-control rounded-lg px-3 py-1.5 text-sm"
        />
        <input value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder={isUk ? "Ступінь / звання" : "Degree / title"}
          className="input-control rounded-lg px-3 py-1.5 text-sm" />
        <input value={phone} onChange={(e) => setPhone(e.target.value)}
          placeholder={isUk ? "Телефон" : "Phone"}
          className="input-control rounded-lg px-3 py-1.5 text-sm" />
        <input value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="input-control rounded-lg px-3 py-1.5 text-sm" />
        <div className="flex items-center gap-2">
          <label className="text-[11px] text-slate-500 whitespace-nowrap">
            {isUk ? "Порядок:" : "Order:"}
          </label>
          <input type="number" value={orderIndex} onChange={(e) => setOrderIndex(Number(e.target.value))}
            className="input-control w-20 rounded-lg px-2 py-1.5 text-sm" />
          <span className="text-[10px] text-slate-400">{isUk ? "(0 = директор)" : "(0 = director)"}</span>
        </div>
      </div>
      <div className="mt-2 flex justify-end">
        <button type="button" onClick={submit} disabled={busy || !position.trim() || !fullName.trim()}
          className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700 disabled:opacity-60">
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          {isUk ? "Зберегти" : "Save"}
        </button>
      </div>
    </div>
  );
}

// ── Board view (org-chart) ────────────────────────────────────────────────────

function BoardView({
  tree, units, locale, institutionName, editingId, addingId,
  setEditingId, setAddingId, onUpdate, onCreate, onDelete,
}: {
  tree: UnitNode[];
  units: InstitutionUnit[];
  locale: "uk" | "en";
  institutionName: string;
  editingId: string | null;
  addingId: string | null;
  setEditingId: (id: string | null) => void;
  setAddingId: (id: string | null) => void;
  onUpdate: (u: InstitutionUnit) => void;
  onCreate: (u: InstitutionUnit) => void;
  onDelete: (id: string) => void;
}) {
  const isUk = locale === "uk";

  const typesInSections = BOARD_SECTIONS.flatMap((s) => s.types);
  const allSections = [
    ...BOARD_SECTIONS.map((s) => ({
      ...s,
      nodes: tree.filter((n) => s.types.includes(n.type as InstitutionUnitType)),
    })),
    {
      id: "other",
      label: { uk: "Інші підрозділи", en: "Other units" },
      types: [] as InstitutionUnitType[],
      headerBg: "bg-slate-500",
      ring: "ring-1 ring-slate-200",
      cardAccent: "border-l-4 border-slate-400",
      childPill: "bg-slate-100 text-slate-700",
      nodes: tree.filter((n) => !typesInSections.includes(n.type as InstitutionUnitType)),
    },
  ].filter((s) => s.nodes.length > 0);

  if (tree.length === 0) return null;

  const N = allSections.length;

  return (
    <div className="flex flex-col items-center">

      {/* ── Root: institution ──────────────────────────────── */}
      <div className="w-full max-w-xl rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 px-6 py-4 text-center shadow-lg ring-1 ring-slate-700">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          {isUk ? "Заклад" : "Institution"}
        </p>
        <h2 className="mt-1 text-base font-bold leading-snug text-white">{institutionName}</h2>
        <p className="mt-1 text-[11px] text-slate-400">
          {units.length} {isUk ? "підрозділів" : "units"}
        </p>
      </div>

      {/* ── Stem from root ─────────────────────────────────── */}
      <div className="h-10 w-px bg-slate-300" />

      {/* ── Sections with connectors ───────────────────────── */}
      {N === 1 ? (
        // single section: straight drop
        <SectionBlock
          section={allSections[0]}
          locale={locale}
          editingId={editingId}
          addingId={addingId}
          setEditingId={setEditingId}
          setAddingId={setAddingId}
          onUpdate={onUpdate}
          onCreate={onCreate}
          onDelete={onDelete}
        />
      ) : (
        // multiple sections: horizontal spread with connector bar
        <div className="relative w-full">
          {/* Horizontal bar spanning centres of first→last section */}
          <div
            className="absolute top-0 h-px bg-slate-300"
            style={{
              left: `${50 / N}%`,
              right: `${50 / N}%`,
            }}
          />

          <div className="flex w-full gap-3">
            {allSections.map((section, i) => (
              <div key={section.id} className="relative flex flex-1 flex-col items-center">
                {/* Horizontal half-bar for first / last to avoid overshoot */}
                {i === 0 && N > 1 && (
                  <div className="absolute left-1/2 right-0 top-0 h-px bg-slate-300" />
                )}
                {i === N - 1 && N > 1 && (
                  <div className="absolute left-0 right-1/2 top-0 h-px bg-slate-300" />
                )}
                {i > 0 && i < N - 1 && (
                  <div className="absolute inset-x-0 top-0 h-px bg-slate-300" />
                )}
                {/* Vertical drop */}
                <div className="h-10 w-px bg-slate-300" />
                {/* Section block */}
                <SectionBlock
                  section={section}
                  locale={locale}
                  editingId={editingId}
                  addingId={addingId}
                  setEditingId={setEditingId}
                  setAddingId={setAddingId}
                  onUpdate={onUpdate}
                  onCreate={onCreate}
                  onDelete={onDelete}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Section block ─────────────────────────────────────────────────────────────

function SectionBlock({
  section, locale, editingId, addingId,
  setEditingId, setAddingId, onUpdate, onCreate, onDelete,
}: {
  section: typeof BOARD_SECTIONS[number] & { nodes: UnitNode[] };
  locale: "uk" | "en";
  editingId: string | null;
  addingId: string | null;
  setEditingId: (id: string | null) => void;
  setAddingId: (id: string | null) => void;
  onUpdate: (u: InstitutionUnit) => void;
  onCreate: (u: InstitutionUnit) => void;
  onDelete: (id: string) => void;
}) {
  const isUk = locale === "uk";
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`w-full overflow-hidden rounded-2xl shadow-sm ${section.ring}`}>
      {/* Section header */}
      <button
        type="button"
        onClick={() => setCollapsed((s) => !s)}
        className={`flex w-full items-center justify-between px-4 py-2.5 ${section.headerBg}`}
      >
        <span className="text-xs font-bold uppercase tracking-wide text-white">
          {isUk ? section.label.uk : section.label.en}
        </span>
        <span className="flex items-center gap-2">
          <span className="rounded-full bg-white/25 px-2 py-0.5 text-[10px] text-white">
            {section.nodes.length}
          </span>
          <ChevronDown className={`h-3.5 w-3.5 text-white/70 transition-transform ${collapsed ? "-rotate-90" : ""}`} />
        </span>
      </button>

      {!collapsed && (
        <div className="bg-white/95 p-3">
          {/* Vertical stem from section header to units row */}
          <div className="mx-auto mb-2 h-5 w-px bg-slate-200" />

          {/* Units: horizontal org-chart if ≤ 6, else compact grid */}
          {section.nodes.length <= 6 ? (
            <OrgRow
              nodes={section.nodes}
              section={section}
              locale={locale}
              editingId={editingId}
              addingId={addingId}
              setEditingId={setEditingId}
              setAddingId={setAddingId}
              onUpdate={onUpdate}
              onCreate={onCreate}
              onDelete={onDelete}
            />
          ) : (
            <CompactGrid
              nodes={section.nodes}
              section={section}
              locale={locale}
              editingId={editingId}
              addingId={addingId}
              setEditingId={setEditingId}
              setAddingId={setAddingId}
              onUpdate={onUpdate}
              onCreate={onCreate}
              onDelete={onDelete}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ── Org-chart row (≤ 6 nodes, shows connectors) ───────────────────────────────

function OrgRow({
  nodes, section, locale, editingId, addingId,
  setEditingId, setAddingId, onUpdate, onCreate, onDelete,
}: {
  nodes: UnitNode[];
  section: typeof BOARD_SECTIONS[number];
  locale: "uk" | "en";
  editingId: string | null;
  addingId: string | null;
  setEditingId: (id: string | null) => void;
  setAddingId: (id: string | null) => void;
  onUpdate: (u: InstitutionUnit) => void;
  onCreate: (u: InstitutionUnit) => void;
  onDelete: (id: string) => void;
}) {
  const N = nodes.length;

  return (
    <div className="relative flex gap-2">
      {/* Horizontal connector bar spanning all node centres */}
      {N > 1 && (
        <div
          className="absolute top-0 h-px bg-slate-200"
          style={{ left: `${50 / N}%`, right: `${50 / N}%` }}
        />
      )}

      {nodes.map((node, i) => (
        <div key={node._id} className="relative flex flex-1 flex-col items-center">
          {/* half-bar overrides for first/last */}
          {N > 1 && i === 0 && (
            <div className="absolute left-1/2 right-0 top-0 h-px bg-slate-200" />
          )}
          {N > 1 && i === N - 1 && (
            <div className="absolute left-0 right-1/2 top-0 h-px bg-slate-200" />
          )}
          {N > 1 && i > 0 && i < N - 1 && (
            <div className="absolute inset-x-0 top-0 h-px bg-slate-200" />
          )}
          {/* Vertical drop to card */}
          <div className="h-5 w-px bg-slate-200" />

          <OrgUnitCard
            node={node}
            section={section}
            locale={locale}
            isEditing={editingId === node._id}
            isAddingChild={addingId === node._id}
            onEdit={() => setEditingId(node._id!)}
            onEditCancel={() => setEditingId(null)}
            onAddChild={() => setAddingId(node._id!)}
            onAddCancel={() => setAddingId(null)}
            onSaved={(u) => { onUpdate(u); setEditingId(null); }}
            onCreated={(u) => { onCreate(u); setAddingId(null); }}
            onDelete={() => onDelete(node._id!)}
          />
        </div>
      ))}
    </div>
  );
}

// ── Compact grid (> 6 nodes) ──────────────────────────────────────────────────

function CompactGrid({
  nodes, section, locale, editingId, addingId,
  setEditingId, setAddingId, onUpdate, onCreate, onDelete,
}: {
  nodes: UnitNode[];
  section: typeof BOARD_SECTIONS[number];
  locale: "uk" | "en";
  editingId: string | null;
  addingId: string | null;
  setEditingId: (id: string | null) => void;
  setAddingId: (id: string | null) => void;
  onUpdate: (u: InstitutionUnit) => void;
  onCreate: (u: InstitutionUnit) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {nodes.map((node) => (
        <OrgUnitCard
          key={node._id}
          node={node}
          section={section}
          locale={locale}
          isEditing={editingId === node._id}
          isAddingChild={addingId === node._id}
          onEdit={() => setEditingId(node._id!)}
          onEditCancel={() => setEditingId(null)}
          onAddChild={() => setAddingId(node._id!)}
          onAddCancel={() => setAddingId(null)}
          onSaved={(u) => { onUpdate(u); setEditingId(null); }}
          onCreated={(u) => { onCreate(u); setAddingId(null); }}
          onDelete={() => onDelete(node._id!)}
        />
      ))}
    </div>
  );
}

// ── Individual unit card ──────────────────────────────────────────────────────

function OrgUnitCard({
  node, section, locale, isEditing, isAddingChild,
  onEdit, onEditCancel, onAddChild, onAddCancel,
  onSaved, onCreated, onDelete,
}: {
  node: UnitNode;
  section: typeof BOARD_SECTIONS[number];
  locale: "uk" | "en";
  isEditing: boolean;
  isAddingChild: boolean;
  onEdit: () => void;
  onEditCancel: () => void;
  onAddChild: () => void;
  onAddCancel: () => void;
  onSaved: (u: InstitutionUnit) => void;
  onCreated: (u: InstitutionUnit) => void;
  onDelete: () => void;
}) {
  const isUk = locale === "uk";
  const meta = UNIT_TYPE_LABELS[node.type as InstitutionUnitType] ?? UNIT_TYPE_LABELS.other;

  if (isEditing) {
    return <EditUnitForm locale={locale} unit={node} onCancel={onEditCancel} onSaved={onSaved} />;
  }

  return (
    <div className="flex w-full flex-col">
      <div className={`group relative w-full rounded-xl border border-slate-200 bg-white p-3 transition hover:shadow-sm ${section.cardAccent}`}>
        {/* Hover actions */}
        <div className="absolute right-1.5 top-1.5 hidden gap-0.5 group-hover:flex">
          <button type="button" onClick={onAddChild} title={isUk ? "Додати дочірній" : "Add child"}
            className="rounded p-1 text-slate-300 hover:bg-emerald-50 hover:text-emerald-700">
            <Plus className="h-3 w-3" />
          </button>
          <button type="button" onClick={onEdit} title={isUk ? "Редагувати" : "Edit"}
            className="rounded p-1 text-slate-300 hover:bg-blue-50 hover:text-blue-700">
            <Pencil className="h-3 w-3" />
          </button>
          <button type="button" onClick={onDelete} title={isUk ? "Видалити" : "Delete"}
            className="rounded p-1 text-slate-300 hover:bg-rose-50 hover:text-rose-700">
            <Trash2 className="h-3 w-3" />
          </button>
        </div>

        <div className="pr-14">
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
            {meta.emoji} {isUk ? meta.uk : meta.en}
            {node.shortName && <span className="ml-1 font-mono font-normal text-slate-300">{node.shortName}</span>}
          </p>
          <h3 className="mt-0.5 text-xs font-bold leading-snug text-slate-900">{node.name}</h3>
          {node.head && (
            <p className="mt-0.5 text-[10px] leading-tight text-slate-500">{node.head}</p>
          )}
        </div>

        {/* Children sub-tree */}
        {node.children.length > 0 && (
          <div className="mt-2 border-t border-slate-100 pt-2">
            <div className="space-y-1.5">
              {node.children.map((child) => {
                const cm = UNIT_TYPE_LABELS[child.type as InstitutionUnitType] ?? UNIT_TYPE_LABELS.other;
                return (
                  <div key={child._id} className="flex items-start gap-1.5">
                    {/* L-shaped connector */}
                    <div className="mt-1.5 flex flex-col items-center">
                      <div className="h-2 w-px bg-slate-200" />
                      <div className="h-px w-3 bg-slate-200" />
                    </div>
                    <div className={`flex-1 rounded-lg px-2 py-1 text-[10px] ${section.childPill}`}>
                      <span className="font-semibold">{cm.emoji} {child.name}</span>
                      {child.head && <span className="ml-1 opacity-70">· {child.head}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {isAddingChild && (
        <div className="mt-1.5">
          <AddUnitForm locale={locale} parentId={node._id!} onCancel={onAddCancel} onCreated={onCreated} />
        </div>
      )}
    </div>
  );
}

// ── Tree view ─────────────────────────────────────────────────────────────────

function TreeView({
  tree, units, locale, adding, setAdding, onUpdate, onCreate, onDelete,
}: {
  tree: UnitNode[];
  units: InstitutionUnit[];
  locale: "uk" | "en";
  adding: string | null;
  setAdding: (v: string | null) => void;
  onUpdate: (u: InstitutionUnit) => void;
  onCreate: (u: InstitutionUnit) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="space-y-2">
      {adding === "" && (
        <AddUnitForm
          locale={locale}
          parentId=""
          onCancel={() => setAdding(null)}
          onCreated={(u) => { onCreate(u); setAdding(null); }}
        />
      )}
      {tree.map((node) => (
        <TreeNode
          key={node._id}
          node={node}
          level={0}
          locale={locale}
          units={units}
          adding={adding}
          setAdding={setAdding}
          onUpdate={onUpdate}
          onCreate={onCreate}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

function TreeNode({
  node, level, locale, units, adding, setAdding, onUpdate, onCreate, onDelete,
}: {
  node: UnitNode;
  level: number;
  locale: "uk" | "en";
  units: InstitutionUnit[];
  adding: string | null;
  setAdding: (v: string | null) => void;
  onUpdate: (u: InstitutionUnit) => void;
  onCreate: (u: InstitutionUnit) => void;
  onDelete: (id: string) => void;
}) {
  const isUk = locale === "uk";
  const meta = UNIT_TYPE_LABELS[node.type as InstitutionUnitType] ?? UNIT_TYPE_LABELS.other;
  const [editing, setEditing] = useState(false);

  return (
    <div>
      <div
        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 transition hover:border-emerald-300 hover:shadow-sm"
        style={{ marginLeft: level * 24 }}
      >
        <span className="text-lg">{meta.emoji}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">
              {isUk ? meta.uk : meta.en}
            </span>
            <h3 className="truncate text-sm font-bold text-slate-900">{node.name}</h3>
            {node.shortName && <span className="font-mono text-[10px] text-slate-400">{node.shortName}</span>}
          </div>
          {node.head && (
            <p className="mt-0.5 text-[11px] text-slate-500">
              {isUk ? "Керівник" : "Head"}: <span className="font-semibold">{node.head}</span>
            </p>
          )}
        </div>
        <button type="button" onClick={() => setAdding(node._id!)}
          className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-emerald-700"
          title={isUk ? "Додати дочірній" : "Add child"}>
          <Plus className="h-3.5 w-3.5" />
        </button>
        <button type="button" onClick={() => setEditing(true)}
          className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-700"
          title={isUk ? "Редагувати" : "Edit"}>
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button type="button" onClick={() => onDelete(node._id!)}
          className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-700"
          title={isUk ? "Видалити" : "Delete"}>
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {editing && (
        <div style={{ marginLeft: (level + 1) * 24 }} className="mt-2">
          <EditUnitForm locale={locale} unit={node} onCancel={() => setEditing(false)}
            onSaved={(u) => { onUpdate(u); setEditing(false); }} />
        </div>
      )}

      {node.children.length > 0 && (
        <div className="mt-2 space-y-2">
          {node.children.map((child) => (
            <TreeNode key={child._id} node={child} level={level + 1} locale={locale} units={units}
              adding={adding} setAdding={setAdding} onUpdate={onUpdate} onCreate={onCreate} onDelete={onDelete} />
          ))}
        </div>
      )}

      {adding === node._id && (
        <div style={{ marginLeft: (level + 1) * 24 }} className="mt-2">
          <AddUnitForm locale={locale} parentId={node._id!} onCancel={() => setAdding(null)}
            onCreated={(u) => { onCreate(u); setAdding(null); }} />
        </div>
      )}
    </div>
  );
}

// ── Forms ─────────────────────────────────────────────────────────────────────

function AddUnitForm({
  locale, parentId, onCancel, onCreated,
}: {
  locale: "uk" | "en";
  parentId: string;
  onCancel: () => void;
  onCreated: (u: InstitutionUnit) => void;
}) {
  const isUk = locale === "uk";
  const [name, setName] = useState("");
  const [shortName, setShortName] = useState("");
  const [type, setType] = useState<InstitutionUnitType>(parentId ? "department" : "faculty");
  const [head, setHead] = useState("");
  const [headEmail, setHeadEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    if (!name.trim()) return;
    setBusy(true); setErr(null);
    try {
      const res = await fetch("/api/institution/units", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), shortName, type, head, headEmail, parentId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "save_failed");
      onCreated(data.unit);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <LiquidCard tint="emerald" className="overflow-hidden p-0" accent>
      <div className="flex items-center justify-between border-b border-slate-200/60 bg-emerald-50/40 px-4 py-2">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-emerald-700" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
            {parentId ? (isUk ? "Новий дочірній підрозділ" : "New child unit") : (isUk ? "Новий підрозділ" : "New unit")}
          </span>
        </div>
        <button type="button" onClick={onCancel} className="rounded p-1 text-slate-400 hover:bg-slate-100">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="grid gap-2 p-3 sm:grid-cols-[160px_1fr_120px]">
        <select value={type} onChange={(e) => setType(e.target.value as InstitutionUnitType)}
          className="input-control rounded-lg px-2 py-1.5 text-xs">
          {Object.entries(UNIT_TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v.emoji} {isUk ? v.uk : v.en}</option>
          ))}
        </select>
        <input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder={isUk ? "Назва підрозділу *" : "Unit name *"}
          className="input-control rounded-lg px-3 py-1.5 text-sm" autoFocus />
        <input value={shortName} onChange={(e) => setShortName(e.target.value)}
          placeholder={isUk ? "Скорочення" : "Short name"}
          className="input-control rounded-lg px-3 py-1.5 text-xs font-mono" />
      </div>
      <div className="grid gap-2 px-3 pb-3 sm:grid-cols-[1fr_120px]">
        <PersonPicker
          value={head}
          onChange={setHead}
          onSelectMember={(m) => { setHead(m.fullName); setHeadEmail(m.email || ""); }}
          placeholder={isUk ? "Керівник (ПІБ)" : "Head (name)"}
          className="input-control rounded-lg px-3 py-1.5 text-sm"
        />
        <button type="button" onClick={submit} disabled={busy || !name.trim()}
          className="liquid-cta text-xs disabled:opacity-60">
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          {isUk ? "Створити" : "Create"}
        </button>
      </div>
      {err && <p className="px-3 pb-3 text-xs text-rose-700">{err}</p>}
    </LiquidCard>
  );
}

function EditUnitForm({
  locale, unit, onCancel, onSaved,
}: {
  locale: "uk" | "en";
  unit: InstitutionUnit;
  onCancel: () => void;
  onSaved: (u: InstitutionUnit) => void;
}) {
  const isUk = locale === "uk";
  const [name, setName] = useState(unit.name);
  const [shortName, setShortName] = useState(unit.shortName);
  const [type, setType] = useState<InstitutionUnitType>(unit.type as InstitutionUnitType);
  const [head, setHead] = useState(unit.head);
  const [headEmail, setHeadEmail] = useState(unit.headEmail ?? "");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await fetch(`/api/institution/units/${unit._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), shortName, type, head, headEmail }),
      });
      onSaved({ ...unit, name: name.trim(), shortName, type, head, headEmail });
    } finally {
      setBusy(false);
    }
  }

  return (
    <LiquidCard tint="blue" className="overflow-hidden p-0">
      <div className="flex items-center justify-between border-b border-slate-200/60 bg-blue-50/40 px-4 py-2">
        <div className="flex items-center gap-1.5">
          <Pencil className="h-3.5 w-3.5 text-blue-700" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
            {isUk ? "Редагування підрозділу" : "Edit unit"}
          </span>
        </div>
        <button type="button" onClick={onCancel} className="rounded p-1 text-slate-400 hover:bg-slate-100">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="grid gap-2 p-3 sm:grid-cols-[160px_1fr_120px]">
        <select value={type} onChange={(e) => setType(e.target.value as InstitutionUnitType)}
          className="input-control rounded-lg px-2 py-1.5 text-xs">
          {Object.entries(UNIT_TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v.emoji} {isUk ? v.uk : v.en}</option>
          ))}
        </select>
        <input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()}
          className="input-control rounded-lg px-3 py-1.5 text-sm" autoFocus />
        <input value={shortName} onChange={(e) => setShortName(e.target.value)}
          className="input-control rounded-lg px-3 py-1.5 text-xs font-mono" />
      </div>
      <div className="grid gap-2 px-3 pb-3 sm:grid-cols-[1fr_100px]">
        <PersonPicker
          value={head}
          onChange={setHead}
          onSelectMember={(m) => { setHead(m.fullName); setHeadEmail(m.email || ""); }}
          placeholder={isUk ? "Керівник (ПІБ)" : "Head (name)"}
          className="input-control rounded-lg px-3 py-1.5 text-sm"
        />
        <button type="button" onClick={submit} disabled={busy}
          className="rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-60">
          {busy ? <Loader2 className="mx-auto h-3.5 w-3.5 animate-spin" /> : (isUk ? "Зберегти" : "Save")}
        </button>
      </div>
    </LiquidCard>
  );
}
