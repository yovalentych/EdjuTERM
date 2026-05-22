"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Link2, X, Search, Plus, Loader2 } from "lucide-react";
import { ITEM_TYPE_META, type ItemType } from "@/lib/workspaces-meta";
import { linkItemsAction, unlinkItemsAction } from "@/app/item-relation-actions";

type SlimItem = {
  id: string;
  type: string;
  title: string;
  emoji?: string;
  status: string;
  workspaceIds: string[];
};

export function LinkedItemsBlock({
  itemId,
  wsId,
  locale,
  linkedItems,
  allItems,
}: {
  itemId: string;
  wsId: string;
  locale: string;
  linkedItems: SlimItem[];
  allItems: SlimItem[];
}) {
  const isUk = locale === "uk";
  const [query, setQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [pending, startTransition] = useTransition();

  const candidates = allItems.filter(
    (it) =>
      it.id !== itemId &&
      !linkedItems.some((li) => li.id === it.id) &&
      (query.length === 0 ||
        it.title.toLowerCase().includes(query.toLowerCase())),
  );

  function handleLink(targetId: string) {
    startTransition(async () => {
      await linkItemsAction(itemId, targetId, locale, wsId);
      setQuery("");
      setShowSearch(false);
    });
  }

  function handleUnlink(targetId: string) {
    startTransition(() => linkUnlink("unlink", targetId));
  }

  async function linkUnlink(action: "unlink", targetId: string) {
    await unlinkItemsAction(itemId, targetId, locale, wsId);
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="liquid-eyebrow flex items-center gap-1.5">
          <Link2 className="h-3 w-3" />
          {isUk ? "ПОВ'ЯЗАНЕ" : "LINKED"}
        </h2>
        <button
          type="button"
          onClick={() => setShowSearch((s) => !s)}
          className="flex items-center gap-1 rounded-full bg-violet-50 px-3 py-1 text-[11px] font-bold text-violet-700 transition hover:bg-violet-100"
        >
          <Plus className="h-3 w-3" />
          {isUk ? "Зв'язати" : "Link"}
        </button>
      </div>

      {/* Search box */}
      {showSearch && (
        <div className="rounded-xl border border-slate-200/70 bg-white/80 p-3 shadow-sm">
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
            <Search className="h-3.5 w-3.5 text-slate-400" />
            <input
              autoFocus
              type="text"
              placeholder={isUk ? "Пошук за назвою…" : "Search by title…"}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none"
            />
          </div>
          <div className="mt-2 flex flex-col gap-1 max-h-48 overflow-y-auto">
            {candidates.length === 0 ? (
              <p className="py-3 text-center text-xs text-slate-400">
                {query ? (isUk ? "Нічого не знайдено" : "No results") : (isUk ? "Введіть назву для пошуку" : "Type to search")}
              </p>
            ) : (
              candidates.slice(0, 12).map((c) => {
                const cMeta = ITEM_TYPE_META[c.type as ItemType];
                return (
                  <button
                    key={c.id}
                    type="button"
                    disabled={pending}
                    onClick={() => handleLink(c.id)}
                    className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    <span className="text-base">{c.emoji || cMeta?.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-xs font-bold text-slate-800">{c.title}</p>
                      <p className="text-[10px] text-slate-400">{cMeta?.label}</p>
                    </div>
                    <Plus className="h-3 w-3 text-violet-500 shrink-0" />
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Linked items list */}
      {linkedItems.length === 0 ? (
        <p className="text-xs italic text-slate-400">
          {isUk ? "Зв'язаних елементів ще немає." : "No linked items yet."}
        </p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {linkedItems.map((li) => {
            const liMeta = ITEM_TYPE_META[li.type as ItemType];
            const liWsId = li.workspaceIds[0] ?? wsId;
            return (
              <div
                key={li.id}
                className="flex items-center gap-3 rounded-xl border border-slate-200/50 bg-white/70 px-3 py-2.5 shadow-sm"
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-base"
                  style={{ backgroundColor: (liMeta?.color ?? "#64748b") + "18" }}
                >
                  {li.emoji || liMeta?.emoji}
                </span>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/${locale}/app/space/${liWsId}/items/${li.id}`}
                    className="truncate text-xs font-bold text-slate-800 hover:underline block"
                  >
                    {li.title}
                  </Link>
                  <p className="text-[10px] text-slate-400">{liMeta?.label}</p>
                </div>
                <StatusDot status={li.status} />
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => handleUnlink(li.id)}
                  className="ml-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-slate-300 transition hover:bg-slate-100 hover:text-rose-500 disabled:opacity-40"
                >
                  {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const color: Record<string, string> = {
    active:    "#10b981",
    draft:     "#94a3b8",
    paused:    "#d97706",
    completed: "#0369a1",
    archived:  "#64748b",
  };
  return (
    <span
      className="h-2 w-2 shrink-0 rounded-full"
      style={{ backgroundColor: color[status] ?? "#94a3b8" }}
    />
  );
}
