"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import type { InstitutionMember } from "@/lib/schemas";

// ── Module-level cache shared across all picker instances ─────────────────────

let _cached: InstitutionMember[] | null = null;
let _promise: Promise<InstitutionMember[]> | null = null;

async function loadMembers(): Promise<InstitutionMember[]> {
  if (_cached) return _cached;
  if (!_promise) {
    _promise = fetch("/api/institution/members")
      .then((r) => r.json())
      .then((d) => { _cached = d.members ?? []; return _cached!; })
      .catch(() => []);
  }
  return _promise;
}

export function invalidatePersonCache() {
  _cached = null;
  _promise = null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

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

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : parts[0].slice(0, 2).toUpperCase();
}

const ROLE_UK: Partial<Record<string, string>> = {
  rector: "Ректор", vice_rector: "Проректор", dean: "Декан", vice_dean: "Заст. декана",
  head: "Зав. кафедри", professor: "Професор", associate: "Доцент",
  lecturer: "Викладач", assistant: "Асистент", researcher: "Науковець",
  staff: "Персонал", admin: "Адмін",
};

// ── PersonPicker ──────────────────────────────────────────────────────────────

/**
 * Combobox для поля ПІБ — підтягує всіх Members закладу, фільтрує на льоту.
 * При виборі: викликає onChange(name) і onSelectMember(member).
 * Якщо введено нове ім'я без вибору — просто free-text.
 */
export function PersonPicker({
  value,
  onChange,
  onSelectMember,
  placeholder,
  className,
  autoFocus,
  id,
}: {
  value: string;
  onChange: (value: string) => void;
  onSelectMember?: (m: InstitutionMember) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  id?: string;
}) {
  const [members, setMembers] = useState<InstitutionMember[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadMembers().then(setMembers); }, []);

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  const query = value.trim().toLowerCase();
  const matches = query.length >= 1
    ? members.filter((m) => m.fullName.toLowerCase().includes(query)).slice(0, 8)
    : [];

  function select(m: InstitutionMember) {
    onChange(m.fullName);
    onSelectMember?.(m);
    setOpen(false);
    setActiveIdx(-1);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") { setOpen(false); return; }
    if (!open || matches.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, matches.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, -1)); }
    else if (e.key === "Enter" && activeIdx >= 0) { e.preventDefault(); select(matches[activeIdx]); }
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        id={id}
        value={value}
        placeholder={placeholder}
        className={className}
        autoFocus={autoFocus}
        autoComplete="off"
        onChange={(e) => { onChange(e.target.value); setOpen(true); setActiveIdx(-1); }}
        onFocus={() => { if (value.trim().length >= 1) setOpen(true); }}
        onKeyDown={handleKeyDown}
      />
      {open && matches.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-[60] mt-1 max-h-56 overflow-auto rounded-xl border border-slate-200 bg-white shadow-xl">
          {matches.map((m, idx) => {
            const [bg, text] = avatarColor(m.fullName);
            return (
              <button
                key={m._id}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); select(m); }}
                className={`flex w-full items-center gap-2.5 px-3 py-2 text-left transition
                  ${idx === 0 ? "rounded-t-xl" : ""}
                  ${idx === matches.length - 1 ? "rounded-b-xl" : "border-b border-slate-100"}
                  ${idx === activeIdx ? "bg-violet-50" : "hover:bg-slate-50"}`}
              >
                <span className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${bg} ${text}`}>
                  {initials(m.fullName)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-slate-800">{m.fullName}</span>
                  {m.title && <span className="block truncate text-[10px] text-slate-400">{m.title}</span>}
                </span>
                <span className="flex-shrink-0 text-[10px] text-slate-400">
                  {ROLE_UK[m.role] ?? m.role}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── MemberPicker ──────────────────────────────────────────────────────────────

/**
 * Combobox що показує ім'я, але зберігає _id.
 * Використовується для полів типу instructorMemberId — де потрібен зв'язок по id.
 * members — вже завантажений список (передається з батьківського компонента).
 */
export function MemberPicker({
  value,
  onChange,
  members,
  placeholder,
  className,
}: {
  value: string;
  onChange: (id: string) => void;
  members: InstitutionMember[];
  placeholder?: string;
  className?: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = members.find((m) => m._id === value) ?? null;
  const activeMembers = members.filter((m) => m.isActive !== false);

  const matches = query.trim().length >= 1
    ? activeMembers.filter((m) => m.fullName.toLowerCase().includes(query.toLowerCase()))
    : activeMembers;

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  function handleFocus() {
    setQuery("");
    setOpen(true);
    setActiveIdx(-1);
  }

  function select(m: InstitutionMember) {
    onChange(m._id!);
    setQuery("");
    setOpen(false);
    setActiveIdx(-1);
  }

  function clear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange("");
    setQuery("");
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") { setOpen(false); setQuery(""); return; }
    if (!open || matches.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, matches.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, -1)); }
    else if (e.key === "Enter" && activeIdx >= 0) { e.preventDefault(); select(matches[activeIdx]); }
  }

  const displayValue = open ? query : (selected?.fullName ?? "");

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          value={displayValue}
          onChange={(e) => { setQuery(e.target.value); setActiveIdx(-1); }}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={selected ? undefined : placeholder}
          autoComplete="off"
          className={className}
        />
        {selected && !open && (
          <button
            type="button"
            onMouseDown={clear}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-300 hover:text-slate-600"
            tabIndex={-1}
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
      {open && (
        <div className="absolute left-0 right-0 top-full z-[60] mt-1 max-h-56 overflow-auto rounded-xl border border-slate-200 bg-white shadow-xl">
          {matches.length === 0 ? (
            <p className="px-3 py-2 text-xs text-slate-400 italic">
              {query.trim() ? "Нікого не знайдено" : "Введіть ім'я для пошуку"}
            </p>
          ) : (
            matches.slice(0, 8).map((m, idx) => {
              const [bg, text] = avatarColor(m.fullName);
              return (
                <button
                  key={m._id}
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); select(m); }}
                  className={`flex w-full items-center gap-2.5 px-3 py-2 text-left transition
                    ${idx === 0 ? "rounded-t-xl" : ""}
                    ${idx === matches.length - 1 ? "rounded-b-xl" : "border-b border-slate-100"}
                    ${idx === activeIdx ? "bg-violet-50" : "hover:bg-slate-50"}`}
                >
                  <span className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${bg} ${text}`}>
                    {initials(m.fullName)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-slate-800">{m.fullName}</span>
                    {m.title && <span className="block truncate text-[10px] text-slate-400">{m.title}</span>}
                  </span>
                  <span className="flex-shrink-0 text-[10px] text-slate-400">
                    {ROLE_UK[m.role] ?? m.role}
                  </span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
