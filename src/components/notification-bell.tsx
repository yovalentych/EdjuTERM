"use client";

import {
  Archive,
  Bell,
  CheckCheck,
  CircleDot,
  Clock,
  FileText,
  Globe,
  MessageSquareText,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Notification, NotificationType } from "@/lib/notifications";

// ── Config ────────────────────────────────────────────────────────────────────

const POLL_INTERVAL = 30_000; // 30 s

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(date: Date | string): string {
  const ms = Date.now() - new Date(date).getTime();
  const m = Math.floor(ms / 60_000);
  if (m < 1) return "щойно";
  if (m < 60) return `${m} хв тому`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} год тому`;
  const d = Math.floor(h / 24);
  return `${d} дн тому`;
}

function typeIcon(type: NotificationType) {
  const cls = "h-4 w-4 shrink-0";
  switch (type) {
    case "record_created":    return <FileText className={cls} />;
    case "record_archived":   return <Archive className={cls} />;
    case "record_deleted":    return <X className={cls} />;
    case "record_published":
    case "zenodo_published":  return <Globe className={cls} />;
    case "approval_needed":   return <CircleDot className={cls} />;
    case "approved":          return <Zap className={cls} />;
    case "rejected":          return <X className={cls} />;
    case "member_invited":
    case "member_joined":     return <Users className={cls} />;
    case "team_message_posted": return <MessageSquareText className={cls} />;
    default:                  return <Bell className={cls} />;
  }
}

function typeColor(type: NotificationType): string {
  switch (type) {
    case "record_created":    return "text-blue-600 bg-blue-50";
    case "record_archived":   return "text-amber-600 bg-amber-50";
    case "record_deleted":    return "text-rose-600 bg-rose-50";
    case "record_published":
    case "zenodo_published":  return "text-emerald-600 bg-emerald-50";
    case "approval_needed":   return "text-violet-600 bg-violet-50";
    case "approved":          return "text-emerald-600 bg-emerald-50";
    case "rejected":          return "text-rose-600 bg-rose-50";
    case "member_invited":
    case "member_joined":     return "text-indigo-600 bg-indigo-50";
    case "team_message_posted": return "text-violet-600 bg-violet-50";
    default:                  return "text-slate-600 bg-slate-100";
  }
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
}

// ── NotificationItem ──────────────────────────────────────────────────────────

function NotificationItem({
  n,
  onRead,
}: {
  n: Notification;
  onRead: (id: string, link?: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onRead(n._id, n.link)}
      className={`w-full text-left px-4 py-3 flex gap-3 transition hover:bg-slate-50 ${
        n.read ? "opacity-70" : ""
      }`}
    >
      {/* Unread dot */}
      <span className="mt-1.5 shrink-0">
        {n.read ? (
          <span className="block h-2 w-2 rounded-full bg-transparent" />
        ) : (
          <span className="block h-2 w-2 rounded-full bg-blue-500" />
        )}
      </span>

      {/* Actor avatar */}
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[11px] font-bold text-slate-600">
        {initials(n.actorName)}
      </span>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-1.5">
          <span className={`mt-0.5 rounded p-0.5 ${typeColor(n.type)}`}>
            {typeIcon(n.type)}
          </span>
          <p className="text-xs font-semibold text-stone-900 leading-snug">
            {n.title}
          </p>
        </div>
        <p className="mt-0.5 text-[11px] text-stone-500 leading-snug line-clamp-2">
          {n.body}
        </p>
        <div className="mt-1 flex items-center gap-2 text-[10px] text-stone-400">
          <Clock className="h-3 w-3" />
          {timeAgo(n.createdAt)}
          {n.projectName && (
            <>
              <span>·</span>
              <span className="truncate max-w-[120px]">{n.projectName}</span>
            </>
          )}
        </div>
      </div>
    </button>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications ?? []);
      setUnread(data.unread ?? 0);
    } catch {
      // ignore network errors silently
    }
  }, []);

  // Initial fetch + polling
  useEffect(() => {
    fetchNotifications();
    const id = setInterval(fetchNotifications, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  async function handleRead(id: string, link?: string) {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, read: true } : n)),
    );
    setUnread((prev) => Math.max(0, prev - 1));

    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [id] }),
    });

    if (link) {
      window.location.href = link;
      setOpen(false);
    }
  }

  async function handleMarkAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnread(0);
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
  }

  const unreadCapped = Math.min(unread, 99);

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          if (!open) fetchNotifications();
        }}
        className="shell-chip relative border border-stone-300 bg-white/70 px-2 py-1 text-stone-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
        aria-label="Сповіщення"
      >
        <Bell className="h-3.5 w-3.5" />
        {unreadCapped > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white leading-none">
            {unreadCapped}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 w-[360px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-stone-500" />
              <span className="text-sm font-semibold text-stone-800">Сповіщення</span>
              {unread > 0 && (
                <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">
                  {unread} нових
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unread > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1 rounded px-2 py-1 text-[11px] text-stone-500 hover:bg-slate-100 hover:text-stone-800 transition"
                  title="Позначити всі як прочитані"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Всі прочитані
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded p-1 text-stone-400 hover:bg-slate-100 hover:text-stone-700 transition"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[440px] overflow-y-auto divide-y divide-slate-50">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-10 text-center text-stone-400">
                <Bell className="h-8 w-8 opacity-30" />
                <p className="text-sm">Немає сповіщень</p>
              </div>
            ) : (
              notifications.map((n) => (
                <NotificationItem key={n._id} n={n} onRead={handleRead} />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
