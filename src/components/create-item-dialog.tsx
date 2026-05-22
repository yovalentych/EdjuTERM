"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronRight, Plus, X, ArrowLeft, Check,
  GraduationCap, FlaskConical, Link as LinkIcon,
  Building2, CalendarDays, User, BookOpen,
} from "lucide-react";
import {
  KIND_META, ITEM_TYPE_META, getTypesByKind,
  type ItemKind, type ItemType,
} from "@/lib/workspaces-meta";
import { SpecialtySelect } from "@/components/ui/specialty-select";
import {
  SPECIALTY_BY_CODE, LEGACY_SPECIALTY_BY_CODE, getSpecialtyLabel,
} from "@/lib/classification-1021";

// ── InstitutionAutocomplete — uses fixed-position dropdown to avoid overflow clip ─

function InstitutionAutocomplete({
  value, onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen]         = useState(false);
  const [loading, setLoading]   = useState(false);
  const [dropStyle, setDropStyle] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 });
  const [results, setResults]   = useState<{ name: string; city?: string; isVerified?: boolean }[]>([]);
  const blurTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fetchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortCtrl  = useRef<AbortController | null>(null);

  function updateDropStyle() {
    if (inputRef.current) {
      const r = inputRef.current.getBoundingClientRect();
      setDropStyle({ top: r.bottom + 4, left: r.left, width: r.width });
    }
  }

  function fetchSuggestions(q: string) {
    if (fetchTimer.current) clearTimeout(fetchTimer.current);
    abortCtrl.current?.abort();
    if (q.trim().length < 2) { setResults([]); setLoading(false); return; }
    setLoading(true);
    fetchTimer.current = setTimeout(async () => {
      const ctrl = new AbortController();
      abortCtrl.current = ctrl;
      try {
        const res = await fetch(`/api/institutions/search?q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
        if (!res.ok) return;
        const data = await res.json();
        const reg  = (data.registered ?? []) as { name: string; city?: string; isVerified?: boolean }[];
        const edbo = (data.edbo ?? []) as { name: string; city?: string }[];
        setResults([...reg, ...edbo].slice(0, 7));
        setOpen(true);
      } catch (e: any) {
        if (e?.name !== "AbortError") setResults([]);
      } finally {
        setLoading(false);
      }
    }, 220);
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        autoFocus
        autoComplete="off"
        placeholder="КПІ ім. Ігоря Сікорського, Інститут фізіології…"
        onChange={(e) => { onChange(e.target.value); fetchSuggestions(e.target.value); }}
        onFocus={() => { updateDropStyle(); if (value.trim().length >= 2) fetchSuggestions(value); }}
        onBlur={() => { blurTimer.current = setTimeout(() => setOpen(false), 200); }}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 pr-8 text-sm shadow-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
      />
      {loading && (
        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2">
          <svg className="h-4 w-4 animate-spin text-slate-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        </span>
      )}
      {open && results.length > 0 && (
        <div
          style={{
            position: "fixed",
            top: dropStyle.top,
            left: dropStyle.left,
            width: dropStyle.width,
            zIndex: 9999,
          }}
          className="max-h-52 overflow-auto rounded-xl border border-slate-200 bg-white shadow-2xl"
        >
          {results.map((r, i) => (
            <button
              key={i}
              type="button"
              onMouseDown={() => {
                if (blurTimer.current) clearTimeout(blurTimer.current);
                onChange(r.name);
                setResults([]);
                setOpen(false);
              }}
              className="flex w-full items-start gap-2.5 border-b border-slate-100 px-3 py-2.5 text-left last:border-0 hover:bg-blue-50"
            >
              <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900 leading-tight">{r.name}</p>
                {r.city && (
                  <p className="mt-0.5 text-[10px] text-slate-400">
                    {r.city}{r.isVerified ? " · ✓ верифіковано" : ""}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────

type Workspace = {
  id: string; name: string; emoji: string;
  color: string; isDefault: boolean; itemCount: number;
};

type LearningItem = { id: string; title: string; type: ItemType };

// ── Learning wizard steps ─────────────────────────────────────────────────────

const LEARNING_STEPS = ["institution", "program", "details"] as const;
type LearningStep = typeof LEARNING_STEPS[number];

const LEARNING_STEP_LABELS: Record<LearningStep, string> = {
  institution: "Заклад",
  program:     "Програма",
  details:     "Деталі",
};

const DEGREE_LABELS: Record<string, { duration: string; hint: string }> = {
  bachelor: { duration: "3–4 роки", hint: "Перший ступінь вищої освіти" },
  master:   { duration: "1–2 роки", hint: "Другий ступінь вищої освіти" },
  phd:      { duration: "3–4 роки", hint: "Третій (освітньо-науковий) ступінь" },
};

type Step = "kind" | "type" | "form";

// ── CreateItemDialog ──────────────────────────────────────────────────────────

export function CreateItemDialog({
  open, onClose, workspaces, defaultWorkspaceId, defaultKind, onCreated,
  learningItems, locale, activeWorkspaceId, currentInstitution,
}: {
  open: boolean;
  onClose: () => void;
  workspaces: Workspace[];
  defaultWorkspaceId: string;
  defaultKind?: ItemKind;
  onCreated?: (itemId: string) => void;
  learningItems?: LearningItem[];
  locale?: string;
  activeWorkspaceId?: string;
  currentInstitution?: string;
}) {
  const router = useRouter();

  const [step, setStep] = useState<Step>(defaultKind ? "type" : "kind");
  const [kind, setKind] = useState<ItemKind | null>(defaultKind ?? null);
  const [type, setType] = useState<ItemType | null>(null);

  // Generic project form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [supervisor, setSupervisor] = useState("");
  const [plannedEndDate, setPlannedEndDate] = useState("");
  const [linkedLearningId, setLinkedLearningId] = useState("");
  const [selectedWsIds, setSelectedWsIds] = useState<string[]>([defaultWorkspaceId]);

  // Learning wizard state
  const [learningStep, setLearningStep] = useState<LearningStep>("institution");
  const [institution, setInstitution] = useState(currentInstitution ?? "");
  const [specialtyCode, setSpecialtyCode] = useState("");
  const [programName, setProgramName] = useState("");
  const [learningSupervisor, setLearningSupervisor] = useState("");
  const [startYear, setStartYear] = useState("");
  const [defenseYear, setDefenseYear] = useState("");

  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  function reset() {
    setStep(defaultKind ? "type" : "kind");
    setKind(defaultKind ?? null); setType(null);
    setTitle(""); setDescription(""); setSupervisor(""); setPlannedEndDate("");
    setLinkedLearningId(""); setSelectedWsIds([defaultWorkspaceId]);
    setLearningStep("institution");
    setInstitution(currentInstitution ?? "");
    setSpecialtyCode(""); setProgramName(""); setLearningSupervisor("");
    setStartYear(""); setDefenseYear("");
  }

  function closeAll() { reset(); onClose(); }

  function pickKind(k: ItemKind) { setKind(k); setStep("type"); }
  function pickType(t: ItemType) { setType(t); setStep("form"); }

  function handleBack() {
    if (step === "form") {
      if (kind === "learning") {
        const idx = LEARNING_STEPS.indexOf(learningStep);
        if (idx > 0) { setLearningStep(LEARNING_STEPS[idx - 1]); return; }
      }
      setStep("type"); setType(null);
    } else if (step === "type") {
      if (defaultKind) { closeAll(); }
      else { setStep("kind"); setKind(null); }
    } else closeAll();
  }

  // Build auto-title for learning records
  function buildLearningTitle(): string {
    const typeMeta = type ? ITEM_TYPE_META[type] : null;
    const base = typeMeta?.label ?? "";
    const specialty = specialtyCode
      ? (SPECIALTY_BY_CODE[specialtyCode]?.name ?? LEGACY_SPECIALTY_BY_CODE[specialtyCode]?.name ?? specialtyCode)
      : programName;
    if (specialty && institution) return `${base} — ${specialty} @ ${institution.split(/«|"|,/)[0].trim()}`;
    if (specialty) return `${base} — ${specialty}`;
    if (institution) return `${base} @ ${institution.split(/«|"|,/)[0].trim()}`;
    return base;
  }

  // ── Learning wizard can proceed? ──
  function learningCanNext(): boolean {
    if (learningStep === "institution") return institution.trim().length >= 2;
    if (learningStep === "program") return Boolean(specialtyCode || programName.trim());
    return true;
  }

  function advanceLearningStep() {
    const idx = LEARNING_STEPS.indexOf(learningStep);
    if (idx < LEARNING_STEPS.length - 1) setLearningStep(LEARNING_STEPS[idx + 1]);
    else submitLearning();
  }

  async function submitLearning() {
    if (!type) return;
    setSubmitting(true);
    const autoTitle = buildLearningTitle();
    const wsIds = selectedWsIds.length > 0 ? selectedWsIds : [defaultWorkspaceId];
    const defenseDate = defenseYear ? `${defenseYear}-06-30` : undefined;
    const startDate  = startYear   ? `${startYear}-09-01`   : undefined;
    try {
      const res = await fetch("/api/workspace-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          title: autoTitle || ITEM_TYPE_META[type].label,
          description: [institution, specialtyCode ? getSpecialtyLabel(specialtyCode) : programName].filter(Boolean).join(" · ") || undefined,
          supervisor: learningSupervisor.trim() || undefined,
          plannedEndDate: defenseDate,
          startDate,
          status: "active",
          visibility: "private",
          workspaceIds: wsIds,
          tags: [],
          fields: {
            institution: institution.trim() || undefined,
            specialtyCode: specialtyCode || undefined,
            programName: programName.trim() || undefined,
            startYear: startYear ? parseInt(startYear) : undefined,
            defenseYear: defenseYear ? parseInt(defenseYear) : undefined,
          },
        }),
      });
      const data = await res.json();
      if (res.ok && data.item) {
        reset();
        const itemId = data.item._id;
        const navigateWsId = (data.item.workspaceIds as string[] | undefined)?.[0] || wsIds[0] || workspaces[0]?.id || activeWorkspaceId;
        if (locale && navigateWsId) {
          router.push(`/${locale}/app/space/${navigateWsId}/items/${itemId}`);
        } else {
          onCreated?.(itemId);
        }
      } else {
        alert(data.error || "Помилка створення");
      }
    } catch {
      alert("Помилка мережі");
    } finally {
      setSubmitting(false);
    }
  }

  async function submitProject() {
    if (!type || !title.trim()) return;
    setSubmitting(true);
    try {
      const wsIds = selectedWsIds.length > 0 ? selectedWsIds : [defaultWorkspaceId];
      const body: Record<string, unknown> = {
        type, title: title.trim(),
        description: description.trim() || undefined,
        supervisor: supervisor.trim() || undefined,
        plannedEndDate: plannedEndDate.trim() || undefined,
        status: "active", visibility: "private",
        workspaceIds: wsIds, tags: [], fields: {},
      };
      if (linkedLearningId) body.learningItemId = linkedLearningId;
      const res = await fetch("/api/workspace-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok && data.item) {
        reset();
        onCreated?.(data.item._id);
      } else {
        alert(data.error || "Помилка створення");
      }
    } catch {
      alert("Помилка мережі");
    } finally {
      setSubmitting(false);
    }
  }

  const meta = type ? ITEM_TYPE_META[type] : null;
  const kindMeta = kind ? KIND_META[kind] : null;
  const isLearning = kind === "learning";
  const isProject = kind === "project";
  const hasLearningItems = (learningItems?.length ?? 0) > 0;
  const currentYear = new Date().getFullYear();

  // Step label for header
  const headerTitle = step === "kind"
    ? "Новий запис"
    : step === "type"
      ? (kindMeta?.label ?? "Тип")
      : isLearning
        ? LEARNING_STEP_LABELS[learningStep]
        : (meta?.label ?? "Деталі");

  const headerSub = step === "kind"
    ? "Оберіть концепцію"
    : step === "type"
      ? "Оберіть тип"
      : isLearning
        ? { institution: "Де ти навчаєшся?", program: "Твоя спеціальність", details: "Керівник та терміни" }[learningStep]
        : "Заповніть основне";

  // Progress for learning wizard: 3 sub-steps within "form"
  const progressSteps = defaultKind
    ? (isLearning ? ["type", ...LEARNING_STEPS] : ["type", "form"])
    : (isLearning ? ["kind", "type", ...LEARNING_STEPS] : ["kind", "type", "form"]);

  const currentProgressStep = step === "form"
    ? (isLearning ? learningStep : "form")
    : step;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/55 px-3 pb-3 sm:items-center sm:p-6"
      onClick={closeAll}
    >
      <div
        className="liquid-card flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden p-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-100/80 px-4 py-3">
          <button onClick={handleBack} className="rounded-full bg-slate-100 p-2 text-slate-600 hover:bg-slate-200">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex-1 text-center">
            <h2 className="text-base font-bold tracking-tight text-slate-900">{headerTitle}</h2>
            <p className="text-[11px] text-slate-500">{headerSub}</p>
          </div>
          <button onClick={closeAll} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 py-3">
          {progressSteps.map((s) => {
            const cur = progressSteps.indexOf(currentProgressStep as string);
            const idx = progressSteps.indexOf(s);
            return (
              <span
                key={s}
                className="block h-1 rounded-full transition-all"
                style={{
                  width: s === currentProgressStep ? 28 : 16,
                  background: s === currentProgressStep
                    ? (meta?.color ?? kindMeta?.color ?? "#0f766e")
                    : idx < cur
                      ? (meta?.color ?? kindMeta?.color ?? "#0f766e") + "80"
                      : "#e2e8f0",
                }}
              />
            );
          })}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">

          {/* ── Step: kind ── */}
          {step === "kind" && (
            <div className="flex flex-col gap-3">
              {(Object.keys(KIND_META) as ItemKind[]).map((k) => {
                const km = KIND_META[k];
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => pickKind(k)}
                    className="flex items-start gap-3 rounded-xl border p-4 text-left transition hover:scale-[1.01] hover:shadow-md"
                    style={{ borderColor: km.color + "30", backgroundColor: km.color + "08" }}
                  >
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl"
                      style={{ backgroundColor: km.color + "18" }}
                    >
                      {k === "learning"
                        ? <GraduationCap className="h-6 w-6" style={{ color: km.color }} />
                        : <FlaskConical className="h-6 w-6" style={{ color: km.color }} />}
                    </div>
                    <div className="flex-1">
                      <div className="text-base font-bold text-slate-900">{km.label}</div>
                      <div className="mt-0.5 text-xs font-medium text-slate-500">{km.description}</div>
                      <div className="mt-1 text-[11px] leading-snug text-slate-400">{km.hint}</div>
                    </div>
                    <ChevronRight className="mt-1 h-5 w-5 shrink-0" style={{ color: km.color }} />
                  </button>
                );
              })}
            </div>
          )}

          {/* ── Step: type ── */}
          {step === "type" && kind && (
            <div className="flex flex-col gap-2">
              {getTypesByKind(kind).map(({ id, meta: m }) => {
                const deg = DEGREE_LABELS[id];
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => pickType(id)}
                    className="flex items-center gap-3 rounded-xl bg-white/70 p-3 text-left transition hover:bg-white hover:shadow-sm"
                  >
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-2xl"
                      style={{ backgroundColor: m.color + "15" }}
                    >
                      {m.emoji}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-bold text-slate-900">{m.label}</div>
                      {deg ? (
                        <div className="mt-0.5 text-[11px] leading-tight text-slate-500">
                          {deg.hint} · <span className="font-semibold">{deg.duration}</span>
                        </div>
                      ) : (
                        <div className="mt-0.5 text-[11px] leading-tight text-slate-500 line-clamp-2">{m.description}</div>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </button>
                );
              })}
            </div>
          )}

          {/* ── Step: form (project) ── */}
          {step === "form" && meta && isProject && (
            <div className="flex flex-col gap-3">
              <div
                className="flex items-center gap-3 rounded-xl p-3"
                style={{ backgroundColor: meta.color + "12" }}
              >
                <span className="text-3xl">{meta.emoji}</span>
                <div>
                  <div className="text-sm font-bold" style={{ color: meta.color }}>{meta.label}</div>
                  <div className="text-[11px] text-slate-500">{meta.description}</div>
                </div>
              </div>

              <Field label="Назва *">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Назва проєкту…"
                  className="w-full rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm shadow-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  autoFocus
                />
              </Field>

              <Field label="Опис">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Коротко про проєкт…"
                  className="min-h-14 w-full resize-y rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm shadow-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                />
              </Field>

              <Field label="Науковий керівник">
                <input
                  type="text"
                  value={supervisor}
                  onChange={(e) => setSupervisor(e.target.value)}
                  placeholder="ПІБ керівника"
                  className="w-full rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm shadow-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                />
              </Field>

              <Field label="Плановане завершення">
                <input
                  type="date"
                  value={plannedEndDate}
                  onChange={(e) => setPlannedEndDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm shadow-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                />
              </Field>

              {hasLearningItems && (
                <Field label="Пов'язати з навчанням (необов'язково)">
                  <div className="flex flex-col gap-1.5">
                    <button
                      type="button"
                      onClick={() => setLinkedLearningId("")}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition ${
                        !linkedLearningId ? "border-teal-400 bg-teal-50 font-semibold text-teal-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <span className="text-base">🚀</span>
                      <span>Самостійний проєкт</span>
                    </button>
                    {learningItems!.map((li) => {
                      const lm = ITEM_TYPE_META[li.type];
                      return (
                        <button
                          key={li.id}
                          type="button"
                          onClick={() => setLinkedLearningId(li.id)}
                          className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition ${
                            linkedLearningId === li.id ? "border-blue-400 bg-blue-50 font-semibold text-blue-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          <span className="text-base">{lm?.emoji ?? "🎓"}</span>
                          <div className="flex-1 min-w-0">
                            <span className="truncate">{li.title}</span>
                            <span className="ml-2 text-[10px] text-slate-400">{lm?.label}</span>
                          </div>
                          {linkedLearningId === li.id && <LinkIcon className="h-3.5 w-3.5 shrink-0 text-blue-500" />}
                        </button>
                      );
                    })}
                  </div>
                </Field>
              )}

              <Field label={`Простори (${selectedWsIds.length} обрано)`}>
                <div className="flex flex-wrap gap-1.5">
                  {workspaces.map((ws) => {
                    const isPicked = selectedWsIds.includes(ws.id);
                    return (
                      <button
                        key={ws.id}
                        type="button"
                        onClick={() => setSelectedWsIds((prev) =>
                          prev.includes(ws.id) ? prev.filter((x) => x !== ws.id) : [...prev, ws.id]
                        )}
                        className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                          isPicked ? "" : "border-slate-200 bg-white/70 text-slate-700 hover:bg-white"
                        }`}
                        style={isPicked ? { borderColor: ws.color, backgroundColor: ws.color + "20", color: ws.color } : {}}
                      >
                        <span>{ws.emoji}</span>
                        <span>{ws.name}</span>
                        {isPicked && <Check className="h-3 w-3" strokeWidth={3} />}
                      </button>
                    );
                  })}
                </div>
              </Field>
            </div>
          )}

          {/* ── Step: form (learning wizard) ── */}
          {step === "form" && meta && isLearning && (
            <div className="flex flex-col gap-4">
              {/* Type badge */}
              <div
                className="flex items-center gap-3 rounded-xl p-3"
                style={{ backgroundColor: meta.color + "12" }}
              >
                <span className="text-2xl">{meta.emoji}</span>
                <div>
                  <div className="text-sm font-bold" style={{ color: meta.color }}>{meta.label}</div>
                  <div className="text-[11px] text-slate-500">
                    {DEGREE_LABELS[type!]?.hint} · {DEGREE_LABELS[type!]?.duration}
                  </div>
                </div>
              </div>

              {/* Sub-step: institution */}
              {learningStep === "institution" && (
                <>
                  <Field label={<><Building2 className="inline h-3.5 w-3.5 mr-1" />Навчальний заклад</>}>
                    <InstitutionAutocomplete
                      value={institution}
                      onChange={setInstitution}
                    />
                    {currentInstitution && institution !== currentInstitution && (
                      <button
                        type="button"
                        onClick={() => setInstitution(currentInstitution)}
                        className="mt-1.5 flex items-center gap-1 text-[11px] text-blue-600 hover:underline"
                      >
                        <Building2 className="h-3 w-3" />
                        Використати з профілю: {currentInstitution}
                      </button>
                    )}
                  </Field>
                  <p className="text-[11px] text-slate-400 -mt-2">
                    Введіть скорочену або повну назву університету / інституту
                  </p>
                </>
              )}

              {/* Sub-step: program */}
              {learningStep === "program" && (
                <>
                  <Field label={<><BookOpen className="inline h-3.5 w-3.5 mr-1" />Спеціальність</>}>
                    <SpecialtySelect
                      value={specialtyCode}
                      onChange={setSpecialtyCode}
                    />
                  </Field>

                  <Field label="Або вкажіть назву програми вручну">
                    <input
                      type="text"
                      value={programName}
                      onChange={(e) => { setProgramName(e.target.value); if (e.target.value) setSpecialtyCode(""); }}
                      placeholder="162 Біотехнології, Нейронаука, Клінічна медицина…"
                      className="w-full rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </Field>

                  {/* Preview of selected */}
                  {(specialtyCode || programName) && (
                    <div className="rounded-lg bg-blue-50 px-3 py-2 text-[12px] text-blue-800">
                      <span className="font-bold">Програма: </span>
                      {specialtyCode
                        ? `${specialtyCode} — ${SPECIALTY_BY_CODE[specialtyCode]?.name ?? LEGACY_SPECIALTY_BY_CODE[specialtyCode]?.name ?? specialtyCode}`
                        : programName}
                    </div>
                  )}
                </>
              )}

              {/* Sub-step: details */}
              {learningStep === "details" && (
                <>
                  <Field label={<><User className="inline h-3.5 w-3.5 mr-1" />Науковий керівник</>}>
                    <input
                      type="text"
                      value={learningSupervisor}
                      onChange={(e) => setLearningSupervisor(e.target.value)}
                      placeholder="ПІБ наукового керівника (необов'язково)"
                      className="w-full rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      autoFocus
                    />
                  </Field>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label={<><CalendarDays className="inline h-3.5 w-3.5 mr-1" />Рік вступу</>}>
                      <input
                        type="number"
                        min={2000}
                        max={currentYear + 1}
                        value={startYear}
                        onChange={(e) => setStartYear(e.target.value)}
                        placeholder={String(currentYear)}
                        className="w-full rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </Field>
                    <Field label="Рік захисту (план)">
                      <input
                        type="number"
                        min={currentYear}
                        max={currentYear + 10}
                        value={defenseYear}
                        onChange={(e) => setDefenseYear(e.target.value)}
                        placeholder={String(currentYear + (type === "phd" ? 4 : type === "master" ? 2 : 4))}
                        className="w-full rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </Field>
                  </div>

                  {/* Summary preview */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1.5 text-xs text-slate-600">
                    <p className="font-bold text-slate-800 text-sm">Підсумок запису</p>
                    <p><span className="text-slate-400">Тип:</span> {meta.label}</p>
                    {institution && <p><span className="text-slate-400">Заклад:</span> {institution}</p>}
                    {(specialtyCode || programName) && (
                      <p><span className="text-slate-400">Спеціальність:</span> {
                        specialtyCode
                          ? `${specialtyCode} — ${SPECIALTY_BY_CODE[specialtyCode]?.name ?? LEGACY_SPECIALTY_BY_CODE[specialtyCode]?.name ?? specialtyCode}`
                          : programName
                      }</p>
                    )}
                    {learningSupervisor && <p><span className="text-slate-400">Керівник:</span> {learningSupervisor}</p>}
                    {startYear && <p><span className="text-slate-400">Роки:</span> {startYear}–{defenseYear || "…"}</p>}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {step === "form" && meta && (
          <div className="border-t border-slate-100/80 p-4">
            {isLearning ? (
              <button
                type="button"
                disabled={!learningCanNext() || submitting}
                onClick={advanceLearningStep}
                className="liquid-cta w-full"
                style={{
                  background: meta.color,
                  opacity: (!learningCanNext() || submitting) ? 0.5 : 1,
                }}
              >
                {submitting ? (
                  "Створення…"
                ) : learningStep === "details" ? (
                  <><Plus className="h-4 w-4" /> Створити {meta.label}</>
                ) : (
                  <>Далі <ChevronRight className="h-4 w-4" /></>
                )}
              </button>
            ) : (
              <button
                type="button"
                disabled={!title.trim() || submitting}
                onClick={submitProject}
                className="liquid-cta w-full"
                style={{ background: meta.color, opacity: !title.trim() || submitting ? 0.5 : 1 }}
              >
                <Plus className="h-4 w-4" />
                {submitting ? "Створення…" : "Створити проєкт"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
        {label}
      </label>
      {children}
    </div>
  );
}
