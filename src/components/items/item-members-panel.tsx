"use client";

import { useState, useTransition } from "react";
import { UserPlus, X, Loader2, Users, Crown, Shield, User } from "lucide-react";
import { addItemMemberAction, removeItemMemberAction } from "@/app/item-member-actions";

type Member = { userId: string; userName: string; role: string; joinedAt: string };

const ROLES = [
  { value: "member",      label: "Учасник",    icon: User },
  { value: "editor",      label: "Редактор",   icon: Shield },
  { value: "admin",       label: "Адмін",      icon: Crown },
];

function roleLabel(role: string) {
  return ROLES.find((r) => r.value === role)?.label ?? role;
}

export function ItemMembersPanel({
  itemId,
  wsId,
  locale,
  initialMembers,
  ownerName,
}: {
  itemId: string;
  wsId: string;
  locale: string;
  initialMembers: Member[];
  ownerName: string;
}) {
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setError(null);

    startTransition(async () => {
      const res = await addItemMemberAction(itemId, email.trim(), role, locale, wsId);
      if (!res.ok) {
        setError(res.error ?? "Помилка");
        return;
      }
      setMembers((prev) => [
        ...prev.filter((m) => m.userName !== res.userName),
        { userId: "", userName: res.userName ?? email, role, joinedAt: new Date().toISOString() },
      ]);
      setEmail("");
    });
  }

  function handleRemove(userId: string) {
    startTransition(async () => {
      const res = await removeItemMemberAction(itemId, userId, locale, wsId);
      if (res.ok) setMembers((prev) => prev.filter((m) => m.userId !== userId));
    });
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Users className="h-4 w-4 text-indigo-500" />
        <h2 className="liquid-eyebrow">УЧАСНИКИ</h2>
        <span className="ml-auto rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-600">
          {members.length + 1}
        </span>
      </div>

      {/* Owner row */}
      <div className="flex items-center gap-2 rounded-lg bg-indigo-50/60 px-3 py-2 mb-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-200 text-indigo-700 text-xs font-bold">
          {ownerName[0]?.toUpperCase() ?? "?"}
        </span>
        <span className="flex-1 text-xs font-semibold text-slate-800 truncate">{ownerName}</span>
        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">Власник</span>
      </div>

      {/* Members list */}
      {members.map((m) => (
        <div key={m.userId || m.userName} className="flex items-center gap-2 rounded-lg bg-white/70 px-3 py-2 mb-1.5 border border-slate-100">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-slate-600 text-xs font-bold">
            {m.userName[0]?.toUpperCase() ?? "?"}
          </span>
          <span className="flex-1 text-xs font-semibold text-slate-800 truncate">{m.userName}</span>
          <span className="text-[10px] font-medium text-slate-500 mr-1">{roleLabel(m.role)}</span>
          {m.userId && (
            <button
              onClick={() => handleRemove(m.userId)}
              disabled={isPending}
              className="rounded-md p-1 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ))}

      {/* Add member form */}
      <form onSubmit={handleAdd} className="mt-3 flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email користувача"
          className="flex-1 rounded-lg border border-slate-200 bg-white/80 px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white/80 px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        >
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
        <button
          type="submit"
          disabled={isPending || !email.trim()}
          className="flex items-center gap-1 rounded-lg bg-indigo-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-600 disabled:opacity-50 transition-colors"
        >
          {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <UserPlus className="h-3 w-3" />}
          Додати
        </button>
      </form>

      {error && (
        <p className="mt-1.5 text-[11px] font-medium text-red-600">{error}</p>
      )}
    </div>
  );
}
