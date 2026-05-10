"use client";

import {
  Hash,
  MessageSquareText,
  Pin,
  Plus,
  Send,
  Star,
  X,
} from "lucide-react";
import { useState } from "react";
import { postTeamMessage, toggleStarMessage, pinTeamMessage } from "@/app/actions";
import type { Dictionary, Locale } from "@/lib/i18n";
import type { Project, SafeUser, TeamMessage, TeamMessageLabel } from "@/lib/schemas";

// ── Label config ──────────────────────────────────────────────────────────────

const LABELS: Record<
  TeamMessageLabel,
  { uk: string; en: string; icon: string; chip: string; bg: string }
> = {
  urgent: {
    uk: "Терміново",
    en: "Urgent",
    icon: "🔴",
    chip: "border-rose-200 bg-rose-50 text-rose-700",
    bg: "bg-rose-50 border-l-rose-400",
  },
  question: {
    uk: "Питання",
    en: "Question",
    icon: "❓",
    chip: "border-amber-200 bg-amber-50 text-amber-700",
    bg: "bg-amber-50 border-l-amber-400",
  },
  decision: {
    uk: "Рішення",
    en: "Decision",
    icon: "✅",
    chip: "border-emerald-200 bg-emerald-50 text-emerald-700",
    bg: "bg-emerald-50 border-l-emerald-400",
  },
  info: {
    uk: "Інфо",
    en: "Info",
    icon: "ℹ️",
    chip: "border-blue-200 bg-blue-50 text-blue-700",
    bg: "bg-blue-50 border-l-blue-400",
  },
  note: {
    uk: "Нотатка",
    en: "Note",
    icon: "📌",
    chip: "border-violet-200 bg-violet-50 text-violet-700",
    bg: "bg-violet-50 border-l-violet-400",
  },
};

const ALL_LABELS = Object.keys(LABELS) as TeamMessageLabel[];

// ── Helpers ───────────────────────────────────────────────────────────────────

function authorColor(id: string): string {
  const palette = [
    "from-blue-500 to-indigo-600",
    "from-emerald-500 to-teal-600",
    "from-violet-500 to-purple-600",
    "from-rose-500 to-pink-600",
    "from-amber-500 to-orange-500",
    "from-cyan-500 to-sky-600",
    "from-slate-500 to-slate-600",
  ];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return palette[hash % palette.length];
}

function getInitials(user: SafeUser) {
  return `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() || "?";
}

function formatDate(date: Date, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "uk" ? "uk-UA" : "en-US", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

// ── Main component ────────────────────────────────────────────────────────────

export function TeamChat({
  dictionary,
  locale,
  messages,
  projects,
  usersById,
  currentUserId,
  returnTo,
}: {
  dictionary: Dictionary;
  locale: Locale;
  messages: TeamMessage[];
  projects: Project[];
  usersById: Map<string, SafeUser>;
  currentUserId: string;
  returnTo?: string;
}) {
  const isUk = locale === "uk";
  const d = dictionary.team;

  // ── State ──
  const [selectedTopic, setSelectedTopic] = useState("general");
  const [showStarred, setShowStarred] = useState(false);
  const [labelFilter, setLabelFilter] = useState<TeamMessageLabel | null>(null);
  const [selectedLabel, setSelectedLabel] = useState<TeamMessageLabel | null>(null);
  const [showNewTopicInput, setShowNewTopicInput] = useState(false);
  const [newTopicInput, setNewTopicInput] = useState("");
  const [composingTopic, setComposingTopic] = useState("general");

  // ── Derive topics ──
  const topicSet = new Set<string>(["general"]);
  for (const m of messages) topicSet.add(m.topic ?? "general");
  const topics = Array.from(topicSet);

  // ── Filtered messages ──
  const starredMessages = messages.filter((m) =>
    m.starredBy?.includes(currentUserId),
  );
  const displayed = messages.filter((m) => {
    if (showStarred) return m.starredBy?.includes(currentUserId);
    if ((m.topic ?? "general") !== selectedTopic) return false;
    if (labelFilter && m.label !== labelFilter) return false;
    return true;
  });
  const pinnedInTopic = displayed.filter((m) => m.pinned);

  const projectsById = new Map(projects.map((p) => [p._id, p]));

  // ── Topic badge count ──
  function topicCount(topic: string) {
    return messages.filter((m) => (m.topic ?? "general") === topic).length;
  }

  function handleNewTopic() {
    const name = newTopicInput.trim().toLowerCase().replace(/\s+/g, "-");
    if (!name) return;
    setComposingTopic(name);
    setSelectedTopic(name);
    setShowNewTopicInput(false);
    setNewTopicInput("");
    setShowStarred(false);
  }

  return (
    <section className="surface flex min-h-[540px] flex-col overflow-hidden">
      {/* ── Header ── */}
      <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50 text-emerald-600">
            <MessageSquareText className="h-4 w-4" />
          </div>
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-blue-600">
              Chat
            </p>
            <h2 className="text-base font-bold text-stone-950">{d.chat}</h2>
          </div>
          {starredMessages.length > 0 && (
            <button
              onClick={() => {
                setShowStarred(!showStarred);
                setLabelFilter(null);
              }}
              className={`ml-auto inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition ${showStarred ? "border-amber-300 bg-amber-100 text-amber-700" : "border-stone-200 bg-white text-stone-500 hover:border-amber-200 hover:bg-amber-50 hover:text-amber-600"}`}
            >
              <Star className={`h-3 w-3 ${showStarred ? "fill-amber-500 text-amber-500" : ""}`} />
              {starredMessages.length}
            </button>
          )}
          {messages.length > 0 && (
            <span className="ml-auto rounded-full border border-stone-200 bg-white px-2.5 py-0.5 font-mono text-xs text-stone-400">
              {messages.length}
            </span>
          )}
        </div>
      </div>

      {/* ── Topic tabs ── */}
      <div className="border-b border-slate-100 bg-slate-50/60 px-4 py-2">
        <div className="flex items-center gap-1 overflow-x-auto">
          {topics.map((topic) => {
            const isActive = !showStarred && selectedTopic === topic;
            return (
              <button
                key={topic}
                onClick={() => {
                  setSelectedTopic(topic);
                  setShowStarred(false);
                  setLabelFilter(null);
                }}
                className={`inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition ${isActive ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:bg-slate-200 hover:text-slate-700"}`}
              >
                <Hash className="h-3 w-3" />
                {topic}
                {topicCount(topic) > 0 && (
                  <span className={`rounded-full px-1.5 text-[10px] font-bold ${isActive ? "bg-white/20" : "bg-slate-200 text-slate-500"}`}>
                    {topicCount(topic)}
                  </span>
                )}
              </button>
            );
          })}

          {/* New topic */}
          {showNewTopicInput ? (
            <div className="flex items-center gap-1">
              <input
                autoFocus
                value={newTopicInput}
                onChange={(e) => setNewTopicInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleNewTopic();
                  if (e.key === "Escape") {
                    setShowNewTopicInput(false);
                    setNewTopicInput("");
                  }
                }}
                placeholder={isUk ? "назва-теми" : "topic-name"}
                className="w-28 rounded-full border border-blue-300 bg-white px-2 py-1 text-xs outline-none"
              />
              <button
                onClick={handleNewTopic}
                className="rounded-full bg-blue-600 px-2 py-1 text-xs text-white"
              >
                {isUk ? "ОК" : "OK"}
              </button>
              <button
                onClick={() => { setShowNewTopicInput(false); setNewTopicInput(""); }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowNewTopicInput(true)}
              className="ml-1 inline-flex shrink-0 items-center gap-1 rounded-full border border-dashed border-slate-300 px-3 py-1 text-xs text-slate-400 transition hover:border-blue-300 hover:text-blue-600"
            >
              <Plus className="h-3 w-3" />
              {isUk ? "Нова тема" : "New topic"}
            </button>
          )}
        </div>
      </div>

      {/* ── Label filters ── */}
      <div className="flex items-center gap-1.5 border-b border-slate-100 bg-white/60 px-4 py-1.5 overflow-x-auto">
        <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-stone-400">
          {isUk ? "Фільтр:" : "Filter:"}
        </span>
        <button
          onClick={() => setLabelFilter(null)}
          className={`shrink-0 rounded px-2 py-0.5 text-[11px] font-semibold transition ${!labelFilter ? "bg-slate-200 text-slate-700" : "text-slate-400 hover:bg-slate-100"}`}
        >
          {isUk ? "Всі" : "All"}
        </button>
        {ALL_LABELS.map((lbl) => {
          const cfg = LABELS[lbl];
          return (
            <button
              key={lbl}
              onClick={() => setLabelFilter(labelFilter === lbl ? null : lbl)}
              className={`shrink-0 rounded border px-2 py-0.5 text-[11px] font-semibold transition ${labelFilter === lbl ? cfg.chip : "border-transparent text-slate-400 hover:bg-slate-100"}`}
            >
              {cfg.icon} {isUk ? cfg.uk : cfg.en}
            </button>
          );
        })}
      </div>

      {/* ── Pinned messages ── */}
      {pinnedInTopic.length > 0 && !showStarred && (
        <div className="border-b border-amber-100 bg-amber-50/60 px-4 py-2">
          <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-600">
            <Pin className="h-3 w-3" />
            {isUk ? "Закріплені" : "Pinned"}
          </p>
          <div className="space-y-1">
            {pinnedInTopic.map((m) => {
              const author = usersById.get(m.authorId);
              return (
                <p key={m._id} className="text-xs text-amber-800">
                  <span className="font-semibold">
                    {author ? `${author.firstName} ${author.lastName}` : "—"}:
                  </span>{" "}
                  {m.body.slice(0, 80)}{m.body.length > 80 ? "…" : ""}
                </p>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Message list ── */}
      <div className="flex-1 overflow-y-auto">
        {displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <MessageSquareText className="h-8 w-8 text-slate-200" />
            <p className="text-sm font-medium text-slate-400">
              {showStarred
                ? isUk ? "Немає вибраних повідомлень" : "No starred messages"
                : isUk ? "Немає повідомлень у цій темі" : "No messages in this topic"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {displayed.map((message) => {
              const author = usersById.get(message.authorId);
              const project = projectsById.get(message.projectId);
              const initials = author ? getInitials(author) : "?";
              const gradient = authorColor(message.authorId);
              const authorName = author
                ? `${author.firstName} ${author.lastName}`
                : message.authorId;
              const isStarred = message.starredBy?.includes(currentUserId);
              const labelCfg = message.label ? LABELS[message.label] : null;

              return (
                <article
                  key={message._id}
                  className={`px-4 py-3.5 transition hover:bg-slate-50/80 ${message.pinned ? "border-l-4 border-l-amber-400 bg-amber-50/30" : labelCfg ? `border-l-4 ${labelCfg.bg}` : ""}`}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold text-white ${gradient}`}
                    >
                      {initials}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      {/* Author row */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-stone-950">
                          {authorName}
                        </span>
                        {message.topic && message.topic !== "general" && !showStarred && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                            <Hash className="h-2.5 w-2.5" />{message.topic}
                          </span>
                        )}
                        {showStarred && message.topic && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-500">
                            <Hash className="h-2.5 w-2.5" />{message.topic}
                          </span>
                        )}
                        {project && (
                          <span className="rounded border border-blue-100 bg-blue-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-blue-600">
                            {project.acronym}
                          </span>
                        )}
                        {labelCfg && (
                          <span className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold ${labelCfg.chip}`}>
                            {labelCfg.icon} {isUk ? labelCfg.uk : labelCfg.en}
                          </span>
                        )}
                        <span className="ml-auto text-[11px] text-stone-400">
                          {formatDate(message.createdAt, locale)}
                        </span>
                      </div>

                      {/* Body */}
                      <p className="mt-1.5 whitespace-pre-wrap text-sm leading-6 text-stone-700">
                        {message.body}
                      </p>

                      {/* Actions */}
                      {message._id && (
                        <div className="mt-2 flex items-center gap-2">
                          {/* Star */}
                          <form action={toggleStarMessage}>
                            <input type="hidden" name="messageId" value={message._id} />
                            <input type="hidden" name="locale" value={locale} />
                            {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}
                            <button
                              type="submit"
                              title={isStarred ? (isUk ? "Зняти зірочку" : "Unstar") : (isUk ? "Додати до вибраних" : "Star")}
                              className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] transition ${isStarred ? "text-amber-500 hover:text-amber-300" : "text-slate-300 hover:text-amber-400"}`}
                            >
                              <Star className={`h-3.5 w-3.5 ${isStarred ? "fill-amber-400" : ""}`} />
                              {isStarred
                                ? (isUk ? "Вибране" : "Starred")
                                : (isUk ? "До вибраних" : "Star")}
                            </button>
                          </form>

                          {/* Pin (any member can pin for now) */}
                          <form action={pinTeamMessage}>
                            <input type="hidden" name="messageId" value={message._id} />
                            <input type="hidden" name="pinned" value={message.pinned ? "false" : "true"} />
                            <input type="hidden" name="locale" value={locale} />
                            {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}
                            <button
                              type="submit"
                              title={message.pinned ? (isUk ? "Відкріпити" : "Unpin") : (isUk ? "Закріпити" : "Pin")}
                              className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] transition ${message.pinned ? "text-amber-600 hover:text-amber-400" : "text-slate-300 hover:text-amber-500"}`}
                            >
                              <Pin className={`h-3 w-3 ${message.pinned ? "fill-amber-400" : ""}`} />
                              {message.pinned
                                ? (isUk ? "Закріплено" : "Pinned")
                                : (isUk ? "Закріпити" : "Pin")}
                            </button>
                          </form>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Compose form ── */}
      {!showStarred && (
        <div className="border-t border-slate-200 bg-slate-50/80 px-4 py-3">
          <form action={postTeamMessage} className="space-y-2">
            <input type="hidden" name="locale" value={locale} />
            {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}
            <input type="hidden" name="topic" value={composingTopic !== selectedTopic ? selectedTopic : composingTopic} />
            {selectedLabel && <input type="hidden" name="label" value={selectedLabel} />}

            {/* Project selector (multi-project context) */}
            {projects.length > 1 && (
              <select
                name="projectId"
                required
                className="input-control w-full py-1.5 text-xs"
              >
                {projects.map((p) => (
                  <option key={p._id} value={p._id ?? ""}>
                    {p.acronym} · {p.title.slice(0, 40)}
                  </option>
                ))}
              </select>
            )}
            {projects.length === 1 && (
              <input type="hidden" name="projectId" value={projects[0]._id ?? ""} />
            )}

            {/* Label selector */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                {isUk ? "Мітка:" : "Label:"}
              </span>
              <button
                type="button"
                onClick={() => setSelectedLabel(null)}
                className={`rounded px-2 py-0.5 text-[11px] font-semibold transition ${!selectedLabel ? "bg-slate-200 text-slate-700" : "text-slate-400 hover:bg-slate-100"}`}
              >
                {isUk ? "Без мітки" : "None"}
              </button>
              {ALL_LABELS.map((lbl) => {
                const cfg = LABELS[lbl];
                return (
                  <button
                    key={lbl}
                    type="button"
                    onClick={() => setSelectedLabel(selectedLabel === lbl ? null : lbl)}
                    className={`rounded border px-2 py-0.5 text-[11px] font-semibold transition ${selectedLabel === lbl ? cfg.chip : "border-transparent text-slate-400 hover:bg-slate-100"}`}
                  >
                    {cfg.icon} {isUk ? cfg.uk : cfg.en}
                  </button>
                );
              })}
            </div>

            {/* Textarea + send */}
            <div className="flex items-end gap-2">
              <div className="relative min-w-0 flex-1">
                <textarea
                  name="body"
                  required
                  rows={2}
                  maxLength={2000}
                  placeholder={
                    isUk
                      ? `Написати у #${selectedTopic}…`
                      : `Write in #${selectedTopic}…`
                  }
                  className="input-control w-full resize-none py-2 pl-3 pr-10 text-sm placeholder:text-stone-400"
                />
              </div>
              <button
                type="submit"
                className="control-primary flex h-10 w-10 shrink-0 items-center justify-center"
                title={d.send}
              >
                <Send className="h-4 w-4" />
              </button>
            </div>

            {/* Active topic indicator */}
            <p className="text-[10px] text-stone-400">
              <Hash className="inline h-2.5 w-2.5" />
              {selectedTopic}
              {selectedLabel && (
                <span className={`ml-2 rounded border px-1.5 py-0.5 ${LABELS[selectedLabel].chip}`}>
                  {LABELS[selectedLabel].icon} {isUk ? LABELS[selectedLabel].uk : LABELS[selectedLabel].en}
                </span>
              )}
            </p>
          </form>
        </div>
      )}
    </section>
  );
}
