"use client";

import { useState } from "react";
import { Check, Plus, X, Sparkles } from "lucide-react";
import { LiquidPill } from "@/components/ui/liquid";
import { WORKSPACE_TEMPLATES, type WorkspaceTemplate } from "@/lib/workspaces-meta";
import { useRouter } from "next/navigation";

type Workspace = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  isDefault: boolean;
  itemCount: number;
};

const EMOJI_PALETTE = ["🏠", "🎓", "🔬", "🧪", "📚", "💼", "🎨", "🚀", "🌍", "📖", "💡", "⚡", "🌱", "🔭", "📊"];
const COLOR_PALETTE = ["#0f766e", "#0369a1", "#7c3aed", "#be123c", "#d97706", "#059669", "#0891b2", "#eab308"];

export function WorkspaceSwitcherDialog({
  open, onClose, workspaces, activeId, onPick,
}: {
  open: boolean;
  onClose: () => void;
  workspaces: Workspace[];
  activeId: string;
  onPick: (id: string) => void;
}) {
  const [mode, setMode] = useState<"list" | "create-template" | "create-form">("list");
  const [template, setTemplate] = useState<WorkspaceTemplate | null>(null);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🏠");
  const [color, setColor] = useState("#0f766e");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  if (!open) return null;

  function reset() {
    setMode("list");
    setTemplate(null);
    setName(""); setDescription("");
    setEmoji("🏠"); setColor("#0f766e");
  }

  function closeAll() {
    reset();
    onClose();
  }

  function pickTemplate(t: WorkspaceTemplate) {
    const meta = WORKSPACE_TEMPLATES[t];
    setTemplate(t);
    setEmoji(meta.emoji);
    setColor(meta.color);
    if (t !== "empty") {
      setName(t === "education" ? "Навчання" : t === "work" ? "Робота" : "Особистий");
    }
    setMode("create-form");
  }

  async function submitCreate() {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          emoji,
          color,
          template: template ?? undefined,
          description: description.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.workspace) {
        router.refresh();
        // jump to new ws
        onPick(data.workspace._id);
        reset();
      } else {
        alert(data.error || "Помилка створення");
      }
    } catch (e) {
      alert("Помилка мережі");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/55 px-3 pb-3 sm:items-center sm:p-6"
      onClick={closeAll}
    >
      <div
        className="liquid-card flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden p-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100/80 px-5 py-4">
          <div>
            <h2 className="text-base font-bold tracking-tight text-slate-900">
              {mode === "list" && "Мої простори"}
              {mode === "create-template" && "Новий простір"}
              {mode === "create-form" && (template ? WORKSPACE_TEMPLATES[template].label : "Створення")}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {mode === "list" && `${workspaces.length} ${workspaces.length === 1 ? "простір" : "простори"}`}
              {mode === "create-template" && "Оберіть шаблон"}
              {mode === "create-form" && "Заповніть основне"}
            </p>
          </div>
          <button onClick={closeAll} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4">
          {mode === "list" && (
            <div className="flex flex-col gap-2">
              {workspaces.map((ws) => {
                const isActive = ws.id === activeId;
                return (
                  <button
                    key={ws.id}
                    type="button"
                    onClick={() => onPick(ws.id)}
                    className={`flex items-center gap-3 rounded-xl border-2 p-3 text-left transition hover:bg-white/80 ${
                      isActive ? "" : "border-transparent bg-white/60"
                    }`}
                    style={isActive ? { borderColor: ws.color, backgroundColor: ws.color + "12" } : undefined}
                  >
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-2xl"
                      style={{ backgroundColor: ws.color + "20" }}
                    >
                      {ws.emoji}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900" style={isActive ? { color: ws.color } : {}}>
                          {ws.name}
                        </span>
                        {ws.isDefault && (
                          <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-slate-600">
                            за замовч.
                          </span>
                        )}
                      </div>
                    </div>
                    {isActive && <Check className="h-5 w-5" style={{ color: ws.color }} />}
                  </button>
                );
              })}

              {/* + Новий простір */}
              <button
                type="button"
                onClick={() => setMode("create-template")}
                className="flex items-center gap-3 rounded-xl border-2 border-dashed border-teal-300 bg-teal-50/40 p-3 text-left transition hover:bg-teal-50/70"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-100">
                  <Plus className="h-5 w-5 text-teal-700" strokeWidth={2.4} />
                </div>
                <div>
                  <div className="text-sm font-bold text-teal-700">Новий простір</div>
                  <div className="text-xs text-slate-500">Створити з шаблоном</div>
                </div>
              </button>
            </div>
          )}

          {mode === "create-template" && (
            <div className="flex flex-col gap-2">
              {(Object.keys(WORKSPACE_TEMPLATES) as WorkspaceTemplate[]).map((t) => {
                const meta = WORKSPACE_TEMPLATES[t];
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => pickTemplate(t)}
                    className="flex items-center gap-3 rounded-xl border p-4 text-left transition hover:scale-[1.01] hover:shadow-md"
                    style={{ borderColor: meta.color + "30", backgroundColor: meta.color + "08" }}
                  >
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-3xl"
                      style={{ backgroundColor: meta.color + "20" }}
                    >
                      {meta.emoji}
                    </div>
                    <div className="flex-1">
                      <div className="text-base font-bold text-slate-900">{meta.label}</div>
                      <div className="mt-0.5 text-xs leading-relaxed text-slate-500">{meta.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {mode === "create-form" && (
            <div className="flex flex-col gap-3">
              {/* Preview */}
              <div
                className="flex items-center gap-3 rounded-xl border p-3"
                style={{ borderColor: color + "30", backgroundColor: color + "12" }}
              >
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-3xl"
                  style={{ backgroundColor: color + "20" }}
                >
                  {emoji}
                </div>
                <div>
                  <div className="font-bold" style={{ color }}>{name || "Без назви"}</div>
                  <div className="text-xs text-slate-500">0 проєктів</div>
                </div>
              </div>

              <Field label="Назва *">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Напр., Магістратура 2025-2026"
                  className="w-full rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm shadow-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                />
              </Field>

              <Field label="Опис (опційно)">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Що тут зберігати"
                  className="min-h-16 w-full resize-y rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm shadow-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                />
              </Field>

              <Field label="Емодзі">
                <div className="flex flex-wrap gap-1.5">
                  {EMOJI_PALETTE.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setEmoji(e)}
                      className={`flex h-9 w-9 items-center justify-center rounded-lg border-2 text-xl transition ${
                        emoji === e ? "scale-110" : "border-transparent hover:bg-slate-100"
                      }`}
                      style={emoji === e ? { borderColor: color, backgroundColor: color + "15" } : {}}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Колір акценту">
                <div className="flex flex-wrap gap-2">
                  {COLOR_PALETTE.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition ${
                        color === c ? "scale-110 shadow-md" : "border-transparent"
                      }`}
                      style={{ backgroundColor: c, borderColor: color === c ? "#fff" : "transparent" }}
                    >
                      {color === c && <Check className="h-4 w-4 text-white" strokeWidth={3} />}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
          )}
        </div>

        {/* Footer */}
        {mode === "create-form" && (
          <div className="flex items-center gap-2 border-t border-slate-100/80 p-4">
            <button
              type="button"
              onClick={() => setMode("create-template")}
              className="liquid-pill"
            >
              ← Назад
            </button>
            <button
              type="button"
              disabled={!name.trim() || submitting}
              onClick={submitCreate}
              className="liquid-cta flex-1"
              style={{ background: color, opacity: !name.trim() || submitting ? 0.5 : 1 }}
            >
              <Sparkles className="h-4 w-4" />
              {submitting ? "Створення..." : "Створити простір"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="liquid-eyebrow">{label}</label>
      {children}
    </div>
  );
}
