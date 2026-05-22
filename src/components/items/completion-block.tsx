"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Award, BookOpen, Calendar, Check, CheckCircle2, ChevronDown, ChevronUp,
  Clipboard, ClipboardCheck, GraduationCap, Loader2, Medal, Pencil, Sparkles, X,
} from "lucide-react";
import { LiquidCard } from "@/components/ui/liquid";

// ── Types ─────────────────────────────────────────────────────────────────────

type LearningType = "bachelor" | "master" | "phd";

interface CompletionData {
  completedAt?: string;
  degreeTitle?: string;
  thesisTitle?: string;
  thesisScore?: number | null;
  thesisGrade?: string;
  diplomaNumber?: string;
  institution?: string;
  notes?: string;
  cvVisible?: boolean;
}

interface ItemSnap {
  _id: string;
  type: string;
  status: string;
  title: string;
  supervisor?: string | null;
  startDate?: string | null;
  plannedEndDate?: string | null;
  fields?: Record<string, any>;
  workspaceIds: string[];
  visibility: string;
  tags: string[];
  description?: string | null;
  emoji?: string | null;
  parentItemId?: string | null;
  learningItemId?: string | null;
}

// ── Label maps ────────────────────────────────────────────────────────────────

const TYPE_INFO: Record<LearningType, {
  degreeLabel: string; thesisLabel: string; icon: string; color: string;
}> = {
  bachelor: { degreeLabel: "Бакалавр",           thesisLabel: "Кваліфікаційна робота", icon: "🎓", color: "#059669" },
  master:   { degreeLabel: "Магістр",             thesisLabel: "Магістерська робота",   icon: "🎓", color: "#0369a1" },
  phd:      { degreeLabel: "Доктор філософії",    thesisLabel: "Дисертація",            icon: "🎓", color: "#7c3aed" },
};

function scoreToGrade(s: number): string {
  if (s >= 90) return "A";
  if (s >= 82) return "B";
  if (s >= 74) return "C";
  if (s >= 64) return "D";
  if (s >= 60) return "E";
  if (s >= 35) return "FX";
  return "F";
}
function gradeNational(g: string): string {
  if (g === "A") return "Відмінно";
  if (g === "B" || g === "C") return "Добре";
  if (g === "D" || g === "E") return "Задовільно";
  return "Незадовільно";
}

// ── Main component ────────────────────────────────────────────────────────────

export function CompletionBlock({
  item,
  locale,
}: {
  item: ItemSnap;
  locale: string;
}) {
  const isUk = locale === "uk";
  const learningType = (item.type as LearningType) ?? "bachelor";
  const typeInfo = TYPE_INFO[learningType] ?? TYPE_INFO.bachelor;
  const completion: CompletionData = (item.fields?.completion as CompletionData) ?? {};
  const isCompleted = item.status === "completed" || Boolean(completion.completedAt);

  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      {isCompleted ? (
        <CompletionCard
          item={item}
          completion={completion}
          typeInfo={typeInfo}
          isUk={isUk}
          onEdit={() => setModalOpen(true)}
        />
      ) : (
        <CompletionCta
          typeInfo={typeInfo}
          isUk={isUk}
          onStart={() => setModalOpen(true)}
        />
      )}

      {modalOpen && (
        <CompletionModal
          item={item}
          completion={completion}
          typeInfo={typeInfo}
          isUk={isUk}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}

// ── CTA (not yet completed) ───────────────────────────────────────────────────

function CompletionCta({
  typeInfo, isUk, onStart,
}: { typeInfo: typeof TYPE_INFO.bachelor; isUk: boolean; onStart: () => void }) {
  return (
    <LiquidCard tint="emerald" className="overflow-hidden p-0">
      <div className="flex items-center justify-between gap-4 px-5 py-4">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl"
            style={{ backgroundColor: typeInfo.color + "18" }}
          >
            <GraduationCap className="h-5 w-5" style={{ color: typeInfo.color }} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">
              {isUk ? "Завершення навчання" : "Completion"}
            </p>
            <p className="text-xs text-slate-500">
              {isUk
                ? "Оформіть диплом, оцінку та запис для Життєпису"
                : "Record your degree, grade, and CV entry"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onStart}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white transition"
          style={{ backgroundColor: typeInfo.color }}
        >
          <Sparkles className="h-3.5 w-3.5" />
          {isUk ? "Завершити" : "Complete"}
        </button>
      </div>
    </LiquidCard>
  );
}

// ── Completion card (already completed) ───────────────────────────────────────

function CompletionCard({
  item, completion, typeInfo, isUk, onEdit,
}: {
  item: ItemSnap;
  completion: CompletionData;
  typeInfo: typeof TYPE_INFO.bachelor;
  isUk: boolean;
  onEdit: () => void;
}) {
  const [cvExpanded, setCvExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const grade = completion.thesisGrade
    ?? (completion.thesisScore != null ? scoreToGrade(completion.thesisScore) : null);

  const cvText = buildCvText({ item, completion, typeInfo, isUk });

  function handleCopy() {
    navigator.clipboard.writeText(cvText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <LiquidCard className="overflow-hidden p-0">
      {/* Header stripe */}
      <div
        className="px-5 py-4"
        style={{ background: `linear-gradient(135deg, ${typeInfo.color}14 0%, ${typeInfo.color}06 100%)` }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
              style={{ backgroundColor: typeInfo.color + "20" }}
            >
              <Medal className="h-6 w-6" style={{ color: typeInfo.color }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                  {isUk ? "Завершено" : "Completed"}
                </p>
              </div>
              <p className="mt-0.5 text-base font-bold text-slate-900">
                {completion.degreeTitle || typeInfo.degreeLabel}
              </p>
              {completion.institution && (
                <p className="text-xs text-slate-500">{completion.institution}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onEdit}
            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white/80 px-2.5 py-1.5 text-[10px] font-bold text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
          >
            <Pencil className="h-3 w-3" /> {isUk ? "Редагувати" : "Edit"}
          </button>
        </div>

        {/* Key details grid */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {completion.completedAt && (
            <Detail icon={<Calendar />} label={isUk ? "Дата захисту" : "Defense date"} value={completion.completedAt} />
          )}
          {grade && (
            <Detail
              icon={<Award />}
              label={isUk ? "Оцінка" : "Grade"}
              value={`${grade} · ${gradeNational(grade)}${completion.thesisScore != null ? ` · ${completion.thesisScore} б.` : ""}`}
            />
          )}
          {completion.diplomaNumber && (
            <Detail icon={<BookOpen />} label={isUk ? "Диплом №" : "Diploma #"} value={completion.diplomaNumber} />
          )}
          {(item.startDate || completion.completedAt) && (
            <Detail
              icon={<Calendar />}
              label={isUk ? "Термін" : "Duration"}
              value={[item.startDate, completion.completedAt].filter(Boolean).join(" – ")}
            />
          )}
        </div>

        {completion.thesisTitle && (
          <div className="mt-3 rounded-xl border border-slate-200/70 bg-white/60 px-3 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {isUk ? typeInfo.thesisLabel : "Thesis"}
            </p>
            <p className="mt-0.5 text-sm font-semibold text-slate-800">
              «{completion.thesisTitle}»
            </p>
          </div>
        )}
      </div>

      {/* CV section */}
      <div className="border-t border-slate-100">
        <button
          type="button"
          onClick={() => setCvExpanded((v) => !v)}
          className="flex w-full items-center justify-between px-5 py-3 text-left"
        >
          <div className="flex items-center gap-2">
            <Clipboard className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-xs font-bold text-slate-600">
              {isUk ? "Запис для Життєпису (CV)" : "CV entry"}
            </span>
          </div>
          {cvExpanded
            ? <ChevronUp className="h-4 w-4 text-slate-400" />
            : <ChevronDown className="h-4 w-4 text-slate-400" />
          }
        </button>

        {cvExpanded && (
          <div className="px-5 pb-4">
            <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
              <pre className="whitespace-pre-wrap px-4 py-3 font-mono text-[11px] leading-relaxed text-slate-700">
                {cvText}
              </pre>
              <div className="flex justify-end border-t border-slate-200 bg-white px-3 py-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold transition ${
                    copied ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {copied
                    ? <><ClipboardCheck className="h-3.5 w-3.5" /> {isUk ? "Скопійовано!" : "Copied!"}</>
                    : <><Clipboard className="h-3.5 w-3.5" /> {isUk ? "Копіювати" : "Copy"}</>
                  }
                </button>
              </div>
            </div>
            {completion.notes && (
              <p className="mt-2 text-xs italic text-slate-500">{completion.notes}</p>
            )}
          </div>
        )}
      </div>
    </LiquidCard>
  );
}

function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200/70 bg-white/60 px-3 py-2">
      <div className="flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-slate-400">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
      </div>
      <p className="mt-0.5 text-xs font-bold text-slate-800 leading-tight">{value}</p>
    </div>
  );
}

// ── CV text builder ───────────────────────────────────────────────────────────

function buildCvText({
  item, completion, typeInfo, isUk,
}: {
  item: ItemSnap;
  completion: CompletionData;
  typeInfo: typeof TYPE_INFO.bachelor;
  isUk: boolean;
}): string {
  const grade = completion.thesisGrade
    ?? (completion.thesisScore != null ? scoreToGrade(completion.thesisScore) : null);

  const lines: string[] = [];
  lines.push(`${typeInfo.icon} ${completion.degreeTitle || typeInfo.degreeLabel}`);
  if (completion.institution) lines.push(completion.institution);

  const period = [item.startDate, completion.completedAt].filter(Boolean).join(" – ");
  if (period) lines.push(period);

  if (completion.diplomaNumber) {
    lines[lines.length - 1] += ` · ${isUk ? "Диплом" : "Diploma"} №${completion.diplomaNumber}`;
  }

  if (completion.thesisTitle) {
    lines.push("");
    lines.push(`${isUk ? "Тема" : "Thesis"}: «${completion.thesisTitle}»`);
  }
  if (item.supervisor) {
    lines.push(`${isUk ? "Науковий керівник" : "Supervisor"}: ${item.supervisor}`);
  }
  if (grade) {
    const nationalStr = gradeNational(grade);
    const scoreStr = completion.thesisScore != null ? ` · ${completion.thesisScore} ${isUk ? "балів" : "pts"}` : "";
    lines.push(`${isUk ? "Оцінка" : "Grade"}: ${grade} · ${nationalStr}${scoreStr}`);
  }

  return lines.join("\n");
}

// ── Completion modal ──────────────────────────────────────────────────────────

function CompletionModal({
  item, completion, typeInfo, isUk, onClose,
}: {
  item: ItemSnap;
  completion: CompletionData;
  typeInfo: typeof TYPE_INFO.bachelor;
  isUk: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [degreeTitle]                     = useState(completion.degreeTitle ?? typeInfo.degreeLabel);
  const [institution]                     = useState(
    completion.institution ??
    (item.fields?.university as string | undefined) ??
    "",
  );
  const [thesisTitle, setThesisTitle]     = useState(
    completion.thesisTitle ??
    (item.fields?.thesisTopic as string | undefined) ??
    (item.fields?.dissertationTitle as string | undefined) ??
    "",
  );
  const [thesisScore, setThesisScore]     = useState(completion.thesisScore != null ? String(completion.thesisScore) : "");
  const [completedAt, setCompletedAt]     = useState(completion.completedAt ?? item.plannedEndDate ?? "");
  const [diplomaNumber, setDiplomaNumber] = useState(completion.diplomaNumber ?? "");
  const [notes, setNotes]                 = useState(completion.notes ?? "");
  const [busy, setBusy]                   = useState(false);
  const [error, setError]                 = useState<string | null>(null);

  const scoreNum = thesisScore ? Number(thesisScore) : null;
  const autoGrade = scoreNum != null && !isNaN(scoreNum) ? scoreToGrade(scoreNum) : null;

  async function handleSave() {
    setError(null);
    setBusy(true);
    const completionPayload: CompletionData = {
      degreeTitle,
      institution,
      thesisTitle,
      thesisScore: scoreNum,
      thesisGrade: autoGrade ?? undefined,
      completedAt,
      diplomaNumber,
      notes,
      cvVisible: true,
    };
    try {
      const res = await fetch(`/api/workspace-items/${item._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "completed",
          fields: { ...(item.fields ?? {}), completion: completionPayload },
          // keep required fields
          type: item.type,
          title: item.title,
          workspaceIds: item.workspaceIds,
          visibility: item.visibility,
          tags: item.tags,
          description: item.description ?? "",
          emoji: item.emoji ?? "",
          supervisor: item.supervisor ?? "",
          startDate: item.startDate ?? "",
          plannedEndDate: (completedAt || item.plannedEndDate) ?? "",
          parentItemId: item.parentItemId ?? "",
          learningItemId: item.learningItemId ?? "",
        }),
      });
      if (!res.ok) throw new Error("save_failed");
      startTransition(() => { router.refresh(); onClose(); });
    } catch {
      setError(isUk ? "Не вдалося зберегти" : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top stripe */}
        <div className="h-1" style={{ background: `linear-gradient(90deg, ${typeInfo.color}, ${typeInfo.color}99)` }} />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" style={{ color: typeInfo.color }} />
            <p className="text-sm font-bold text-slate-900">
              {isUk ? "Завершення навчання" : "Complete your studies"}
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">
          <div className="grid gap-3 sm:grid-cols-2">

            {/* Degree title — readonly from item type */}
            <div className="sm:col-span-2">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {isUk ? "Ступінь" : "Degree"}
              </p>
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                <span className="text-sm font-bold text-slate-900">{degreeTitle}</span>
                <span className="ml-auto rounded-full bg-slate-200 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                  {isUk ? "авто" : "auto"}
                </span>
              </div>
            </div>

            {/* Institution — readonly from workspace fields */}
            <div className="sm:col-span-2">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {isUk ? "Заклад вищої освіти" : "Institution"}
              </p>
              {institution ? (
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                  <span className="text-sm font-semibold text-slate-800">{institution}</span>
                  <span className="ml-auto rounded-full bg-slate-200 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                    {isUk ? "авто" : "auto"}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-2.5">
                  <span className="text-xs text-slate-400">
                    {isUk
                      ? "Заповніть «Університет» у налаштуваннях простору"
                      : "Fill in 'University' in workspace settings"}
                  </span>
                </div>
              )}
            </div>

            {/* Thesis title — pre-filled from item.fields, editable */}
            <div className="sm:col-span-2">
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {isUk ? typeInfo.thesisLabel + " — назва" : "Thesis title"}
              </label>
              <input value={thesisTitle} onChange={(e) => setThesisTitle(e.target.value)}
                placeholder={isUk ? "Тема кваліфікаційної роботи" : "Your thesis title"}
                className="input-control w-full text-sm" />
            </div>

            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {isUk ? "Дата захисту" : "Defense date"}
              </label>
              <input type="date" value={completedAt} onChange={(e) => setCompletedAt(e.target.value)}
                className="input-control w-full text-sm" />
            </div>

            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {isUk ? "Бал за захист (0–100)" : "Defense score (0–100)"}
                {autoGrade && (
                  <span className="ml-1.5 font-bold" style={{ color: typeInfo.color }}>
                    → {autoGrade} · {gradeNational(autoGrade)}
                  </span>
                )}
              </label>
              <input type="number" min={0} max={100} value={thesisScore}
                onChange={(e) => setThesisScore(e.target.value)}
                placeholder="—" className="input-control w-full text-sm" />
            </div>

            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {isUk ? "Номер диплома" : "Diploma number"}
              </label>
              <input value={diplomaNumber} onChange={(e) => setDiplomaNumber(e.target.value)}
                placeholder="12345678" className="input-control w-full text-sm" />
            </div>

            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {isUk ? "Примітки" : "Notes"}
              </label>
              <input value={notes} onChange={(e) => setNotes(e.target.value)}
                placeholder={isUk ? "Необов'язково" : "Optional"}
                className="input-control w-full text-sm" />
            </div>

          </div>

          {/* CV preview */}
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {isUk ? "Попередній перегляд запису у Життєписі" : "CV entry preview"}
            </p>
            <pre className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-slate-600">
              {buildCvText({
                item: { ...item, startDate: item.startDate ?? "" },
                completion: {
                  degreeTitle, institution, thesisTitle,
                  thesisScore: scoreNum,
                  thesisGrade: autoGrade ?? undefined,
                  completedAt, diplomaNumber,
                },
                typeInfo,
                isUk,
              })}
            </pre>
          </div>

          {error && <p className="mt-2 text-xs font-semibold text-rose-600">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3">
          <button type="button" onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">
            {isUk ? "Скасувати" : "Cancel"}
          </button>
          <button type="button" onClick={handleSave} disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-xl px-5 py-1.5 text-xs font-bold text-white disabled:opacity-60"
            style={{ backgroundColor: typeInfo.color }}
          >
            {busy
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <Check className="h-3.5 w-3.5" />
            }
            {isUk ? "Зберегти та завершити" : "Save & complete"}
          </button>
        </div>
      </div>
    </div>
  );
}
