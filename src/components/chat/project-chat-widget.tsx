"use client";

import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, Send, X, ChevronDown } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { sendChatMessage } from "@/app/actions";
import type { Dictionary } from "@/lib/i18n";
import type { ChatMessage } from "@/lib/schemas";

// ── helpers ───────────────────────────────────────────────────────────────────

function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDateLabel(date: Date | string, d: Dictionary["chat"]): string {
  const msg = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const msgDay = new Date(msg.getFullYear(), msg.getMonth(), msg.getDate());

  if (msgDay.getTime() === today.getTime()) return d.today;
  if (msgDay.getTime() === yesterday.getTime()) return d.yesterday;
  return msg.toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });
}

function getAvatarColor(userId: string): string {
  const colors = [
    "bg-emerald-600",
    "bg-blue-600",
    "bg-violet-600",
    "bg-amber-600",
    "bg-rose-600",
    "bg-cyan-600",
    "bg-indigo-600",
    "bg-teal-600",
  ];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash << 5) - hash + userId.charCodeAt(i);
    hash |= 0;
  }
  return colors[Math.abs(hash) % colors.length];
}

// ── component ─────────────────────────────────────────────────────────────────

export function ProjectChatWidget({
  projectId,
  currentUserId,
  dictionary,
}: {
  projectId: string;
  currentUserId: string;
  dictionary: Dictionary;
}) {
  const d = dictionary.chat;
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [unread, setUnread] = useState(0);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const lastFetchRef = useRef<string>("");
  const openRef = useRef(false);
  const [bottomOffset, setBottomOffset] = useState(20);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  // Keep widget above footer
  useEffect(() => {
    const update = () => {
      const footer = document.querySelector("footer");
      if (!footer) return;
      const visible = Math.max(0, window.innerHeight - footer.getBoundingClientRect().top);
      setBottomOffset(visible + 20);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  // ── fetch messages ──────────────────────────────────────────────────────────

  const fetchMessages = useCallback(
    async (initial = false) => {
      try {
        const after = initial ? "" : lastFetchRef.current;
        const url = `/api/chat?projectId=${encodeURIComponent(projectId)}${after ? `&after=${encodeURIComponent(after)}` : ""}`;
        const res = await fetch(url);
        if (!res.ok) return;
        const data = (await res.json()) as { messages: ChatMessage[] };
        if (!data.messages?.length) return;

        // Update last fetch timestamp
        const latest = data.messages[data.messages.length - 1];
        if (latest?.createdAt) {
          lastFetchRef.current = new Date(latest.createdAt).toISOString();
        }

        setMessages((prev) => {
          if (initial) return data.messages;
          const ids = new Set(prev.map((m) => String(m._id)));
          const newOnes = data.messages.filter((m) => !ids.has(String(m._id)));
          if (!newOnes.length) return prev;
          if (!openRef.current) setUnread((u) => u + newOnes.length);
          return [...prev, ...newOnes];
        });
      } catch {
        // network error — ignore
      }
    },
    [projectId],
  );

  // Initial load + polling
  useEffect(() => {
    fetchMessages(true);
    const interval = setInterval(() => fetchMessages(false), 3000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  // Scroll to bottom when messages arrive and widget is open
  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  // Focus input when opening
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "instant" }), 50);
    }
  }, [open]);

  // ── send message ────────────────────────────────────────────────────────────

  const handleSend = () => {
    const content = draft.trim();
    if (!content || isPending) return;
    setDraft("");
    setError("");

    startTransition(async () => {
      const result = await sendChatMessage(projectId, content);
      if (!result.ok) {
        setError(d.errorSend);
        return;
      }
      await fetchMessages(false);
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── group messages by date ──────────────────────────────────────────────────

  type GroupedMsg = ChatMessage & { showDate: boolean; showName: boolean };
  const grouped: GroupedMsg[] = messages.map((msg, i) => {
    const prev = messages[i - 1];
    const msgDate = new Date(msg.createdAt);
    const prevDate = prev ? new Date(prev.createdAt) : null;
    const showDate =
      !prevDate ||
      msgDate.getFullYear() !== prevDate.getFullYear() ||
      msgDate.getMonth() !== prevDate.getMonth() ||
      msgDate.getDate() !== prevDate.getDate();
    const showName =
      showDate || !prev || prev.userId !== msg.userId;
    return { ...msg, showDate, showName };
  });

  // ── render ──────────────────────────────────────────────────────────────────

  return (
    <div className="fixed right-5 z-50 flex flex-col items-end gap-3" style={{ bottom: `${bottomOffset}px` }}>
      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="chat-panel"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="flex w-[360px] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden border border-emerald-100 bg-white shadow-[0_24px_60px_rgba(15,118,110,0.18)]"
            style={{ height: "520px" }}
          >
            {/* Header */}
            <div className="flex shrink-0 items-center gap-3 border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-cyan-50 px-4 py-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-emerald-700 shadow-sm">
                <MessageCircle className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-stone-950">{d.title}</p>
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                  <span className="text-xs text-stone-500">{d.online}</span>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-stone-500 transition hover:bg-white hover:text-emerald-800"
                aria-label="Close chat"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1 scroll-smooth">
              {grouped.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <p className="text-center text-sm text-stone-400">{d.noMessages}</p>
                </div>
              ) : (
                grouped.map((msg) => {
                  const isOwn = msg.userId === currentUserId;
                  const avatarColor = getAvatarColor(msg.userId);
                  return (
                    <div key={String(msg._id)}>
                      {/* Date divider */}
                      {msg.showDate && (
                        <div className="my-3 flex items-center gap-3">
                          <div className="h-px flex-1 bg-stone-100" />
                          <span className="text-xs font-medium text-stone-400">
                            {formatDateLabel(msg.createdAt, d)}
                          </span>
                          <div className="h-px flex-1 bg-stone-100" />
                        </div>
                      )}
                      {/* Message */}
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.18 }}
                        className={`flex gap-2 ${isOwn ? "flex-row-reverse" : "flex-row"} ${msg.showName ? "mt-3" : "mt-0.5"}`}
                      >
                        {/* Avatar */}
                        {msg.showName ? (
                          <div
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${avatarColor}`}
                          >
                            {msg.initials}
                          </div>
                        ) : (
                          <div className="w-7 shrink-0" />
                        )}

                        {/* Bubble */}
                        <div
                          className={`max-w-[75%] ${isOwn ? "items-end" : "items-start"} flex flex-col`}
                        >
                          {msg.showName && !isOwn && (
                            <span className="mb-0.5 text-xs font-semibold text-stone-600">
                              {msg.displayName}
                            </span>
                          )}
                          <div
                            className={`relative rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                              isOwn
                                ? "rounded-tr-sm bg-gradient-to-br from-emerald-600 to-cyan-600 text-white"
                                : "rounded-tl-sm bg-stone-100 text-stone-900"
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                          </div>
                          <span className="mt-0.5 text-xs text-stone-400">
                            {formatTime(msg.createdAt)}
                          </span>
                        </div>
                      </motion.div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            {/* Error */}
            {error && (
              <p className="shrink-0 border-t border-rose-100 bg-rose-50 px-4 py-2 text-xs text-rose-700">
                {error}
              </p>
            )}

            {/* Input */}
            <div className="shrink-0 border-t border-stone-200 bg-white px-3 py-3">
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={d.placeholder}
                  rows={1}
                  disabled={isPending}
                  className="flex-1 resize-none rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-900 outline-none placeholder:text-stone-400 focus:border-emerald-400 focus:bg-white transition disabled:opacity-50"
                  style={{ maxHeight: "120px", overflowY: "auto" }}
                  onInput={(e) => {
                    const el = e.currentTarget;
                    el.style.height = "auto";
                    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
                  }}
                />
                <button
                  onClick={handleSend}
                  disabled={!draft.trim() || isPending}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-600 to-cyan-600 text-white transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label={d.send}
                >
                  {isPending ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="mt-1.5 text-center text-xs text-stone-400">
                Enter ↵ — надіслати · Shift+Enter — новий рядок
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle button */}
      <motion.button
        whileTap={{ scale: 0.93 }}
        onClick={() => {
          const next = !open;
          if (next) setUnread(0);
          setOpen(next);
        }}
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-600 to-cyan-600 text-white shadow-[0_14px_34px_rgba(5,150,105,0.30)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(8,145,178,0.32)]"
        aria-label={d.title}
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.span
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="h-6 w-6" />
            </motion.span>
          ) : (
            <motion.span
              key="chat"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <MessageCircle className="h-6 w-6" />
            </motion.span>
          )}
        </AnimatePresence>

        {/* Unread badge */}
        <AnimatePresence>
          {!open && unread > 0 && (
            <motion.span
              key="badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-xs font-bold text-white"
            >
              {unread > 99 ? "99+" : unread}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
