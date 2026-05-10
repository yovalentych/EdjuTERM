"use client";

import {
  AlertTriangle,
  ArrowUpRight,
  AtSign,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleDashed,
  Clock,
  ExternalLink,
  Filter,
  FileText,
  Globe,
  LayoutGrid,
  Languages,
  List,
  Link2,
  MapPin,
  Microscope,
  Monitor,
  Pencil,
  Plus,
  Search,
  Send,
  Sparkles,
  Target,
  TimerReset,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useDeferredValue, useRef, useState } from "react";
import {
  createResearchEvent,
  updateResearchEvent,
  deleteResearchEvent,
  addEventParticipation,
  updateEventParticipation,
  removeEventParticipation,
  addSubmissionItem,
  updateSubmissionItem,
  removeSubmissionItem,
} from "@/app/actions";
import type {
  ResearchEvent,
  EventParticipation,
  SafeUser,
  EventType,
  EventFormat,
  EventStatus,
  ParticipationRole,
  ParticipationStatus,
  ContributionType,
  SubmissionType,
  SubmissionStatus,
  SubmissionItem,
} from "@/lib/schemas";
import { ConfirmModal } from "@/components/ui/confirm-modal";

// ── Label maps ────────────────────────────────────────────────────────────────

const EVENT_TYPE_LABEL: Record<EventType, string> = {
  conference:   "Конференція",
  workshop:     "Воркшоп",
  symposium:    "Симпозіум",
  seminar:      "Семінар",
  summer_school:"Літня школа",
  competition:  "Конкурс",
  exhibition:   "Виставка",
  hackathon:    "Хакатон",
  other:        "Інше",
};

const EVENT_TYPE_COLOR: Record<EventType, string> = {
  conference:   "border-blue-200 bg-blue-50 text-blue-700",
  workshop:     "border-violet-200 bg-violet-50 text-violet-700",
  symposium:    "border-indigo-200 bg-indigo-50 text-indigo-700",
  seminar:      "border-cyan-200 bg-cyan-50 text-cyan-700",
  summer_school:"border-emerald-200 bg-emerald-50 text-emerald-700",
  competition:  "border-amber-200 bg-amber-50 text-amber-700",
  exhibition:   "border-rose-200 bg-rose-50 text-rose-700",
  hackathon:    "border-orange-200 bg-orange-50 text-orange-700",
  other:        "border-slate-200 bg-slate-100 text-slate-600",
};

const EVENT_TYPE_BAR: Record<EventType, string> = {
  conference:   "bg-blue-500",
  workshop:     "bg-violet-500",
  symposium:    "bg-indigo-500",
  seminar:      "bg-cyan-500",
  summer_school:"bg-emerald-500",
  competition:  "bg-amber-500",
  exhibition:   "bg-rose-500",
  hackathon:    "bg-orange-500",
  other:        "bg-slate-400",
};

const EVENT_STATUS_LABEL: Record<EventStatus, string> = {
  planned:   "Заплановано",
  confirmed: "Підтверджено",
  attended:  "Відвідано",
  cancelled: "Скасовано",
};

const EVENT_STATUS_COLOR: Record<EventStatus, string> = {
  planned:   "border-slate-200 bg-slate-100 text-slate-600",
  confirmed: "border-blue-200 bg-blue-50 text-blue-700",
  attended:  "border-emerald-200 bg-emerald-50 text-emerald-700",
  cancelled: "border-rose-200 bg-rose-50 text-rose-600 line-through",
};

const FORMAT_LABEL: Record<EventFormat, string> = {
  in_person: "Офлайн",
  online:    "Онлайн",
  hybrid:    "Гібрид",
};

const FORMAT_ICON: Record<EventFormat, React.ReactNode> = {
  in_person: <MapPin className="h-3 w-3" />,
  online:    <Monitor className="h-3 w-3" />,
  hybrid:    <Globe className="h-3 w-3" />,
};

const ROLE_LABEL: Record<ParticipationRole, string> = {
  presenter:       "Доповідач",
  poster_presenter:"Постер",
  attendee:        "Слухач",
  organizer:       "Організатор",
  chair:           "Голова секції",
  volunteer:       "Волонтер",
};

const ROLE_COLOR: Record<ParticipationRole, string> = {
  presenter:       "border-blue-200 bg-blue-50 text-blue-700",
  poster_presenter:"border-violet-200 bg-violet-50 text-violet-700",
  attendee:        "border-slate-200 bg-slate-100 text-slate-600",
  organizer:       "border-amber-200 bg-amber-50 text-amber-700",
  chair:           "border-indigo-200 bg-indigo-50 text-indigo-700",
  volunteer:       "border-emerald-200 bg-emerald-50 text-emerald-700",
};

const PARTICIPATION_STATUS_LABEL: Record<ParticipationStatus, string> = {
  planned:           "Планується",
  abstract_submitted:"Тези подано",
  accepted:          "Прийнято",
  rejected:          "Відхилено",
  attended:          "Відвідано",
  cancelled:         "Скасовано",
};

const PARTICIPATION_STATUS_COLOR: Record<ParticipationStatus, string> = {
  planned:           "text-slate-500",
  abstract_submitted:"text-amber-600",
  accepted:          "text-emerald-600",
  rejected:          "text-rose-600",
  attended:          "text-emerald-700 font-semibold",
  cancelled:         "text-slate-400 line-through",
};

const CONTRIBUTION_LABEL: Record<ContributionType, string> = {
  oral:          "Усна доповідь",
  poster:        "Постер",
  keynote:       "Keynote",
  panel:         "Панельна дискусія",
  demo:          "Демо",
  workshop_talk: "Воркшоп-доповідь",
};

const SUBMISSION_TYPE_LABEL: Record<SubmissionType, string> = {
  abstract:     "Тези",
  full_paper:   "Повна стаття",
  poster:       "Постер",
  slides:       "Презентація",
  video:        "Відео",
  registration: "Реєстрація",
  visa_docs:    "Документи для візи",
  other:        "Інше",
};

const SUBMISSION_STATUS_LABEL: Record<SubmissionStatus, string> = {
  draft:            "Чернетка",
  submitted:        "Подано",
  accepted:         "Прийнято",
  rejected:         "Відхилено",
  revision_required:"Потрібні правки",
  withdrawn:        "Відкликано",
};

const SUBMISSION_STATUS_COLOR: Record<SubmissionStatus, string> = {
  draft:            "border-slate-200 bg-slate-50 text-slate-500",
  submitted:        "border-amber-200 bg-amber-50 text-amber-700",
  accepted:         "border-emerald-200 bg-emerald-50 text-emerald-700",
  rejected:         "border-rose-200 bg-rose-50 text-rose-700",
  revision_required:"border-orange-200 bg-orange-50 text-orange-700",
  withdrawn:        "border-slate-200 bg-slate-100 text-slate-400",
};

const SUBMISSION_STATUS_ICON: Record<SubmissionStatus, React.ReactNode> = {
  draft:            <Clock className="h-3 w-3" />,
  submitted:        <Send className="h-3 w-3" />,
  accepted:         <CheckCircle2 className="h-3 w-3" />,
  rejected:         <X className="h-3 w-3" />,
  revision_required:<AlertTriangle className="h-3 w-3" />,
  withdrawn:        <X className="h-3 w-3" />,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(dateStr: string | undefined) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString("uk-UA", { day: "2-digit", month: "short", year: "numeric" });
}

function daysUntil(dateStr: string): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return Math.ceil((d.getTime() - Date.now()) / 86_400_000);
}

function isUpcoming(event: ResearchEvent): boolean {
  if (event.status === "cancelled" || event.status === "attended") return false;
  if (!event.startDate) return true;
  return new Date(event.startDate).getTime() >= Date.now() - 86_400_000;
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase() || "?";
}

// ── Countdown chip ────────────────────────────────────────────────────────────

function Countdown({ label, dateStr, size = "sm" }: { label: string; dateStr: string; size?: "sm" | "xs" }) {
  const days = daysUntil(dateStr);
  if (days === null) return null;
  const urgent = days >= 0 && days <= 7;
  const past = days < 0;
  const cls = size === "xs" ? "text-[10px] px-1.5 py-0" : "text-[11px] px-2 py-0.5";
  return (
    <span className={`inline-flex items-center gap-1 rounded border font-semibold ${cls} ${
      past   ? "border-slate-200 bg-slate-50 text-slate-400 line-through" :
      urgent ? "border-rose-200 bg-rose-50 text-rose-700" :
               "border-amber-200 bg-amber-50 text-amber-700"
    }`}>
      {label}:{past ? " минув" : days === 0 ? " сьогодні" : ` ${days} дн.`}
    </span>
  );
}

// ── Participant avatars ────────────────────────────────────────────────────────

function ParticipantAvatars({ participations }: { participations: EventParticipation[] }) {
  if (participations.length === 0) return null;
  const shown = participations.slice(0, 6);
  return (
    <div className="flex items-center gap-1">
      {shown.map((p) => (
        <div
          key={p._id}
          title={`${p.participantName} — ${ROLE_LABEL[p.role]}`}
          className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-blue-100 text-[10px] font-bold text-blue-700 shadow-sm ring-1 ring-blue-100"
        >
          {getInitials(p.participantName)}
        </div>
      ))}
      {participations.length > 6 && (
        <span className="text-[11px] text-slate-400">+{participations.length - 6}</span>
      )}
    </div>
  );
}

// ── Submission section ────────────────────────────────────────────────────────

function SubmissionsSection({
  participation,
  locale,
  projectId,
  returnTo,
  canManage,
}: {
  participation: EventParticipation;
  locale: string;
  projectId: string;
  returnTo: string;
  canManage: boolean;
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [editSid, setEditSid] = useState<string | null>(null);
  const submissions: SubmissionItem[] = participation.submissions ?? [];

  return (
    <div className="mt-3 rounded-lg border border-violet-100 bg-violet-50/30 p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-violet-600">
          <FileText className="h-3 w-3" />
          Подання та матеріали ({submissions.length})
        </p>
        {canManage && (
          <button
            type="button"
            onClick={() => setAddOpen((v) => !v)}
            className="inline-flex items-center gap-1 rounded border border-violet-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-violet-700 transition hover:bg-violet-100"
          >
            <Plus className="h-3 w-3" />
            Додати
          </button>
        )}
      </div>

      {/* Add submission form */}
      {addOpen && canManage && (
        <form
          action={async (fd) => { await addSubmissionItem(fd); setAddOpen(false); }}
          className="mb-3 rounded-lg border border-violet-200 bg-white p-3 space-y-2"
        >
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="participationId" value={participation._id ?? ""} />
          <input type="hidden" name="returnTo" value={returnTo} />

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Тип матеріалу</label>
              <select name="type" className="input-control w-full py-1 text-xs">
                {(Object.keys(SUBMISSION_TYPE_LABEL) as SubmissionType[]).map((t) => (
                  <option key={t} value={t}>{SUBMISSION_TYPE_LABEL[t]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Статус</label>
              <select name="status" className="input-control w-full py-1 text-xs">
                {(Object.keys(SUBMISSION_STATUS_LABEL) as SubmissionStatus[]).map((s) => (
                  <option key={s} value={s}>{SUBMISSION_STATUS_LABEL[s]}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Назва / Заголовок</label>
            <input type="text" name="title" className="input-control w-full py-1 text-xs" placeholder="Назва тез або матеріалу…" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Співавтори</label>
              <input type="text" name="coAuthors" className="input-control w-full py-1 text-xs" placeholder="Іваненко А.Б., Петренко В.Г.…" />
            </div>
            <div>
              <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Секція</label>
              <input type="text" name="section" className="input-control w-full py-1 text-xs" placeholder="Секція 1 / Track A…" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Дедлайн подання</label>
              <input type="date" name="deadline" className="input-control w-full py-1 text-xs" />
            </div>
            <div>
              <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Дата подання</label>
              <input type="date" name="submittedAt" className="input-control w-full py-1 text-xs" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Дедлайн правок</label>
              <input type="date" name="revisionDeadline" className="input-control w-full py-1 text-xs" />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Що виправити</label>
              <textarea name="revisionNotes" rows={2} className="input-control w-full py-1 text-xs" placeholder="Коментарі рецензентів…" />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setAddOpen(false)} className="control px-3 py-1.5 text-xs">Скасувати</button>
            <button type="submit" className="control-primary px-3 py-1.5 text-xs">Додати</button>
          </div>
        </form>
      )}

      {/* Submission rows */}
      <div className="space-y-2">
        {submissions.map((sub) => (
          <div key={sub.sid} className="rounded-lg border border-slate-100 bg-white p-2.5">
            {editSid === sub.sid ? (
              <form
                action={async (fd) => { await updateSubmissionItem(fd); setEditSid(null); }}
                className="space-y-2"
              >
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="projectId" value={projectId} />
                <input type="hidden" name="participationId" value={participation._id ?? ""} />
                <input type="hidden" name="sid" value={sub.sid} />
                <input type="hidden" name="returnTo" value={returnTo} />

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Тип</label>
                    <select name="type" defaultValue={sub.type} className="input-control w-full py-1 text-xs">
                      {(Object.keys(SUBMISSION_TYPE_LABEL) as SubmissionType[]).map((t) => (
                        <option key={t} value={t}>{SUBMISSION_TYPE_LABEL[t]}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Статус</label>
                    <select name="status" defaultValue={sub.status} className="input-control w-full py-1 text-xs">
                      {(Object.keys(SUBMISSION_STATUS_LABEL) as SubmissionStatus[]).map((s) => (
                        <option key={s} value={s}>{SUBMISSION_STATUS_LABEL[s]}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Назва</label>
                  <input type="text" name="title" defaultValue={sub.title} className="input-control w-full py-1 text-xs" />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Співавтори</label>
                    <input type="text" name="coAuthors" defaultValue={sub.coAuthors} className="input-control w-full py-1 text-xs" placeholder="Іваненко А.Б., Петренко В.Г.…" />
                  </div>
                  <div>
                    <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Секція</label>
                    <input type="text" name="section" defaultValue={sub.section} className="input-control w-full py-1 text-xs" placeholder="Секція 1 / Track A…" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Дедлайн подання</label>
                    <input type="date" name="deadline" defaultValue={sub.deadline} className="input-control w-full py-1 text-xs" />
                  </div>
                  <div>
                    <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Дата подання</label>
                    <input type="date" name="submittedAt" defaultValue={sub.submittedAt} className="input-control w-full py-1 text-xs" />
                  </div>
                  <div>
                    <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Дедлайн правок</label>
                    <input type="date" name="revisionDeadline" defaultValue={sub.revisionDeadline} className="input-control w-full py-1 text-xs" />
                  </div>
                  <div>
                    <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Що виправити</label>
                    <textarea name="revisionNotes" defaultValue={sub.revisionNotes} rows={2} className="input-control w-full py-1 text-xs" />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setEditSid(null)} className="control px-3 py-1.5 text-xs">Скасувати</button>
                  <button type="submit" className="control-primary px-3 py-1.5 text-xs">Зберегти</button>
                </div>
              </form>
            ) : (
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-semibold ${SUBMISSION_STATUS_COLOR[sub.status]}`}>
                      {SUBMISSION_STATUS_ICON[sub.status]}
                      {SUBMISSION_STATUS_LABEL[sub.status]}
                    </span>
                    <span className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-500">
                      {SUBMISSION_TYPE_LABEL[sub.type]}
                    </span>
                  </div>
                  {sub.title && (
                    <p className="mt-0.5 text-xs font-medium text-slate-800">{sub.title}</p>
                  )}
                  {sub.coAuthors && (
                    <p className="mt-0.5 text-[10px] text-slate-400">
                      Співавт.: {sub.coAuthors}
                    </p>
                  )}
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    {sub.section && (
                      <span className="rounded border border-indigo-100 bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium text-indigo-600">
                        {sub.section}
                      </span>
                    )}
                    {sub.deadline && <Countdown label="Дедлайн" dateStr={sub.deadline} size="xs" />}
                    {sub.submittedAt && (
                      <span className="text-[10px] text-slate-400">
                        Подано: {fmtDate(sub.submittedAt)}
                      </span>
                    )}
                  </div>
                  {sub.status === "revision_required" && (
                    <div className="mt-1.5 rounded border border-orange-200 bg-orange-50 px-2 py-1.5">
                      {sub.revisionDeadline && (
                        <div className="mb-1">
                          <Countdown label="Правки до" dateStr={sub.revisionDeadline} size="xs" />
                        </div>
                      )}
                      {sub.revisionNotes && (
                        <p className="text-[11px] leading-relaxed text-orange-700">{sub.revisionNotes}</p>
                      )}
                    </div>
                  )}
                </div>
                {canManage && (
                  <div className="flex shrink-0 items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => setEditSid(sub.sid)}
                      className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      title="Редагувати"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <form action={removeSubmissionItem}>
                      <input type="hidden" name="locale" value={locale} />
                      <input type="hidden" name="projectId" value={projectId} />
                      <input type="hidden" name="participationId" value={participation._id ?? ""} />
                      <input type="hidden" name="sid" value={sub.sid} />
                      <input type="hidden" name="returnTo" value={returnTo} />
                      <button type="submit" className="rounded p-1 text-slate-300 hover:bg-rose-50 hover:text-rose-500" title="Видалити">
                        <X className="h-3 w-3" />
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {submissions.length === 0 && (
          <p className="text-[11px] text-slate-400">Подань ще немає.</p>
        )}
      </div>
    </div>
  );
}

// ── Participation section ─────────────────────────────────────────────────────

function ParticipationSection({
  event,
  participations,
  members,
  locale,
  projectId,
  returnTo,
  canManage,
}: {
  event: ResearchEvent;
  participations: EventParticipation[];
  members: SafeUser[];
  locale: string;
  projectId: string;
  returnTo: string;
  canManage: boolean;
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [expandedSub, setExpandedSub] = useState<string | null>(null);

  return (
    <div className="mt-3 border-t border-slate-100 pt-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          <Users className="h-3 w-3" />
          Учасники ({participations.length})
        </p>
        {canManage && (
          <button
            type="button"
            onClick={() => setAddOpen((v) => !v)}
            className="inline-flex items-center gap-1 rounded border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 transition hover:bg-blue-100"
          >
            <UserPlus className="h-3 w-3" />
            Додати
          </button>
        )}
      </div>

      {/* Add participation form */}
      {addOpen && canManage && (
        <form
          action={async (fd) => { await addEventParticipation(fd); setAddOpen(false); }}
          className="mb-3 rounded-lg border border-blue-100 bg-blue-50/60 p-3 space-y-2"
        >
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="eventId" value={event._id ?? ""} />
          <input type="hidden" name="returnTo" value={returnTo} />

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Учасник *</label>
              <select
                name="participantId"
                required
                className="input-control w-full py-1 text-xs"
                onChange={(e) => {
                  const opt = e.target.options[e.target.selectedIndex];
                  const nameInput = e.target.closest("form")?.querySelector<HTMLInputElement>("[name=participantName]");
                  if (nameInput) nameInput.value = opt.dataset.name ?? "";
                }}
              >
                <option value="">— обрати —</option>
                {members.map((m) => (
                  <option key={m._id} value={m._id ?? ""} data-name={`${m.firstName} ${m.lastName}`}>
                    {m.firstName} {m.lastName}
                  </option>
                ))}
              </select>
              <input type="hidden" name="participantName" />
            </div>
            <div>
              <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Роль</label>
              <select name="role" className="input-control w-full py-1 text-xs">
                {(["attendee","presenter","poster_presenter","organizer","chair","volunteer"] as ParticipationRole[]).map((r) => (
                  <option key={r} value={r}>{ROLE_LABEL[r]}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Установа / Афіліація</label>
            <input type="text" name="affiliation" className="input-control w-full py-1 text-xs" placeholder="КПІ ім. Ігоря Сікорського, Інститут клітинної біології НАН України…" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Секція конференції</label>
              <input type="text" name="section" className="input-control w-full py-1 text-xs" placeholder="Секція 1 / Track A…" />
            </div>
            <div>
              <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Статус</label>
              <select name="status" className="input-control w-full py-1 text-xs">
                {(["planned","abstract_submitted","accepted","rejected","attended","cancelled"] as ParticipationStatus[]).map((s) => (
                  <option key={s} value={s}>{PARTICIPATION_STATUS_LABEL[s]}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Назва доповіді / постера</label>
            <input type="text" name="contributionTitle" className="input-control w-full py-1 text-xs" placeholder="Заголовок тез / постера…" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Тип внеску</label>
              <select name="contributionType" className="input-control w-full py-1 text-xs">
                <option value="">— без типу —</option>
                {(["oral","poster","keynote","panel","demo","workshop_talk"] as ContributionType[]).map((t) => (
                  <option key={t} value={t}>{CONTRIBUTION_LABEL[t]}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Нотатки</label>
            <textarea name="notes" rows={2} className="input-control w-full py-1 text-xs" />
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setAddOpen(false)} className="control px-3 py-1.5 text-xs">Скасувати</button>
            <button type="submit" className="control-primary px-3 py-1.5 text-xs">Додати учасника</button>
          </div>
        </form>
      )}

      {/* Participation rows */}
      <div className="space-y-2">
        {participations.map((p) => (
          <div key={p._id} className="rounded-lg border border-slate-100 bg-white">
            {editId === p._id ? (
              <form
                action={async (fd) => { await updateEventParticipation(fd); setEditId(null); }}
                className="space-y-2 p-3"
              >
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="projectId" value={projectId} />
                <input type="hidden" name="participationId" value={p._id ?? ""} />
                <input type="hidden" name="returnTo" value={returnTo} />

                <div>
                  <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Установа / Афіліація</label>
                  <input type="text" name="affiliation" defaultValue={p.affiliation} className="input-control w-full py-1 text-xs" placeholder="КПІ ім. Ігоря Сікорського…" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Роль</label>
                    <select name="role" defaultValue={p.role} className="input-control w-full py-1 text-xs">
                      {(["attendee","presenter","poster_presenter","organizer","chair","volunteer"] as ParticipationRole[]).map((r) => (
                        <option key={r} value={r}>{ROLE_LABEL[r]}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Статус</label>
                    <select name="status" defaultValue={p.status} className="input-control w-full py-1 text-xs">
                      {(["planned","abstract_submitted","accepted","rejected","attended","cancelled"] as ParticipationStatus[]).map((s) => (
                        <option key={s} value={s}>{PARTICIPATION_STATUS_LABEL[s]}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Секція конференції</label>
                    <input type="text" name="section" defaultValue={p.section} className="input-control w-full py-1 text-xs" placeholder="Секція 1 / Track A…" />
                  </div>
                  <div>
                    <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Тип внеску</label>
                    <select name="contributionType" defaultValue={p.contributionType ?? ""} className="input-control w-full py-1 text-xs">
                      <option value="">— без типу —</option>
                      {(["oral","poster","keynote","panel","demo","workshop_talk"] as ContributionType[]).map((t) => (
                        <option key={t} value={t}>{CONTRIBUTION_LABEL[t]}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <input type="text" name="contributionTitle" defaultValue={p.contributionTitle} className="input-control w-full py-1 text-xs" placeholder="Назва доповіді…" />
                <textarea name="notes" defaultValue={p.notes} rows={2} className="input-control w-full py-1 text-xs" placeholder="Нотатки…" />
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setEditId(null)} className="control px-3 py-1.5 text-xs">Скасувати</button>
                  <button type="submit" className="control-primary px-3 py-1.5 text-xs">Зберегти</button>
                </div>
              </form>
            ) : (
              <div>
                {/* Participant row */}
                <div className="flex items-start justify-between gap-2 px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700">
                        {getInitials(p.participantName)}
                      </div>
                      <span className="text-sm font-semibold text-stone-900">{p.participantName}</span>
                      <span className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold ${ROLE_COLOR[p.role]}`}>
                        {ROLE_LABEL[p.role]}
                      </span>
                      <span className={`text-[11px] ${PARTICIPATION_STATUS_COLOR[p.status]}`}>
                        {PARTICIPATION_STATUS_LABEL[p.status]}
                      </span>
                    </div>
                    {p.affiliation && (
                      <p className="mt-0.5 text-[11px] text-slate-400">{p.affiliation}</p>
                    )}
                    {(p.section || p.contributionTitle) && (
                      <p className="mt-0.5 text-xs text-slate-500">
                        {p.section && (
                          <span className="mr-1.5 rounded border border-indigo-100 bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium text-indigo-600">
                            {p.section}
                          </span>
                        )}
                        {p.contributionType ? `${CONTRIBUTION_LABEL[p.contributionType]}: ` : ""}
                        {p.contributionTitle && <span className="font-medium text-slate-700">{p.contributionTitle}</span>}
                      </p>
                    )}
                    {p.notes && <p className="mt-0.5 text-[11px] italic text-slate-400">{p.notes}</p>}
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => setExpandedSub(expandedSub === p._id ? null : (p._id ?? null))}
                      className={`rounded p-1 transition ${expandedSub === p._id ? "bg-violet-100 text-violet-600" : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"}`}
                      title="Подання та матеріали"
                    >
                      <FileText className="h-3.5 w-3.5" />
                    </button>
                    {canManage && (
                      <>
                        <button
                          type="button"
                          onClick={() => setEditId(p._id ?? null)}
                          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                          title="Редагувати"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <form action={removeEventParticipation}>
                          <input type="hidden" name="locale" value={locale} />
                          <input type="hidden" name="projectId" value={projectId} />
                          <input type="hidden" name="participationId" value={p._id ?? ""} />
                          <input type="hidden" name="returnTo" value={returnTo} />
                          <button type="submit" className="rounded p-1 text-slate-300 hover:bg-rose-50 hover:text-rose-500" title="Видалити">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </form>
                      </>
                    )}
                  </div>
                </div>

                {/* Submissions sub-panel */}
                {expandedSub === p._id && (
                  <div className="border-t border-slate-100 px-3 pb-3">
                    <SubmissionsSection
                      participation={p}
                      locale={locale}
                      projectId={projectId}
                      returnTo={returnTo}
                      canManage={canManage}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {participations.length === 0 && (
          <p className="text-[11px] text-slate-400">Учасників ще немає.</p>
        )}
      </div>
    </div>
  );
}

// ── Add event form ────────────────────────────────────────────────────────────

function AddEventForm({
  locale,
  projectId,
  returnTo,
  onClose,
}: {
  locale: string;
  projectId: string;
  returnTo: string;
  onClose: () => void;
}) {
  const [startDate, setStartDate] = useState("");
  const [oneDayEvent, setOneDayEvent] = useState(false);
  const [descLen, setDescLen] = useState(0);

  return (
    <form
      action={async (fd) => { await createResearchEvent(fd); onClose(); }}
      className="border-t border-slate-200 px-5 pb-6 pt-4 space-y-4"
    >
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="returnTo" value={returnTo} />

      <div>
        <label className="mb-1 block text-xs font-semibold text-stone-600">Назва події *</label>
        <input type="text" name="title" required className="input-control w-full" placeholder="Наприклад: International Symposium on Neuroscience 2026" />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-stone-600">Тип</label>
          <select name="type" className="input-control w-full">
            {(Object.keys(EVENT_TYPE_LABEL) as EventType[]).map((t) => (
              <option key={t} value={t}>{EVENT_TYPE_LABEL[t]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-stone-600">Формат</label>
          <select name="format" className="input-control w-full">
            <option value="in_person">Офлайн</option>
            <option value="online">Онлайн</option>
            <option value="hybrid">Гібрид</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-stone-600">Статус</label>
          <select name="status" className="input-control w-full">
            <option value="planned">Заплановано</option>
            <option value="confirmed">Підтверджено</option>
          </select>
        </div>
      </div>

      {/* Date fields with single-day toggle */}
      <div>
        <div className="mb-2 flex items-center gap-2">
          <label className="text-xs font-semibold text-stone-600">Дати</label>
          <label className="flex cursor-pointer items-center gap-1.5 text-xs text-slate-500">
            <input
              type="checkbox"
              checked={oneDayEvent}
              onChange={(e) => setOneDayEvent(e.target.checked)}
              className="h-3.5 w-3.5 rounded accent-blue-600"
            />
            Одноденна подія
          </label>
        </div>
        <div className={`grid gap-4 ${oneDayEvent ? "grid-cols-1" : "grid-cols-2"}`}>
          <div>
            <label className="mb-1 block text-[11px] text-slate-500">{oneDayEvent ? "Дата" : "Початок"}</label>
            <input
              type="date"
              name="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input-control w-full"
            />
          </div>
          {oneDayEvent ? (
            <input type="hidden" name="endDate" value={startDate} />
          ) : (
            <div>
              <label className="mb-1 block text-[11px] text-slate-500">Закінчення</label>
              <input type="date" name="endDate" className="input-control w-full" />
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <label className="mb-1 block text-xs font-semibold text-stone-600">Дедлайн тез</label>
          <input type="date" name="abstractDeadline" className="input-control w-full" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-stone-600">Дедлайн повної статті</label>
          <input type="date" name="fullPaperDeadline" className="input-control w-full" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-stone-600">Дедлайн реєстрації</label>
          <input type="date" name="registrationDeadline" className="input-control w-full" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-stone-600">Мови</label>
          <input type="text" name="languages" className="input-control w-full" placeholder="укр., англ." />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-xs font-semibold text-stone-600">Місце / Місто</label>
          <input type="text" name="location" className="input-control w-full" placeholder="Kyiv, Ukraine" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-stone-600">URL сайту</label>
          <input type="url" name="url" className="input-control w-full" placeholder="https://…" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-stone-600">Форма реєстрації (URL)</label>
          <input type="url" name="registrationFormUrl" className="input-control w-full" placeholder="https://forms.gle/…" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-stone-600">Email оргкомітету</label>
          <input type="email" name="organizingEmail" className="input-control w-full" placeholder="conf@example.com" />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-stone-600">Наукові секції / треки</label>
        <textarea
          name="sections"
          rows={3}
          className="input-control w-full resize-y"
          placeholder={"Секція 1. Промислова, харчова та медична біотехнологія\nСекція 2. Природоохоронні біотехнології та біоенергетика\nСекція 3. Біотехніка та обладнання"}
        />
        <p className="mt-0.5 text-[10px] text-slate-400">Кожна секція з нового рядка</p>
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="text-xs font-semibold text-stone-600">Опис / Примітки</label>
          <span className={`text-[10px] tabular-nums ${descLen > 2800 ? "text-rose-500" : "text-slate-400"}`}>
            {descLen}/3000
          </span>
        </div>
        <textarea
          name="description"
          rows={4}
          maxLength={3000}
          onChange={(e) => setDescLen(e.target.value.length)}
          className="input-control w-full resize-y"
          placeholder="Тематика конференції, важлива інформація, нотатки щодо участі…"
        />
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onClose} className="control px-4 py-2 text-sm">Скасувати</button>
        <button type="submit" className="control-primary px-4 py-2 text-sm">Додати подію</button>
      </div>
    </form>
  );
}

// ── Edit event form ───────────────────────────────────────────────────────────

function EditEventForm({
  event,
  locale,
  projectId,
  returnTo,
  onClose,
}: {
  event: ResearchEvent;
  locale: string;
  projectId: string;
  returnTo: string;
  onClose: () => void;
}) {
  const [startDate, setStartDate] = useState(event.startDate ?? "");
  const [oneDayEvent, setOneDayEvent] = useState(
    !!event.startDate && event.startDate === event.endDate,
  );
  const [descLen, setDescLen] = useState(event.description?.length ?? 0);

  return (
    <form
      action={async (fd) => { await updateResearchEvent(fd); onClose(); }}
      className="space-y-3 rounded-xl border border-blue-100 bg-blue-50/40 p-4"
    >
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="eventId" value={event._id ?? ""} />
      <input type="hidden" name="returnTo" value={returnTo} />

      <div>
        <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Назва</label>
        <input type="text" name="title" defaultValue={event.title} required className="input-control w-full" />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Тип</label>
          <select name="type" defaultValue={event.type} className="input-control w-full">
            {(Object.keys(EVENT_TYPE_LABEL) as EventType[]).map((t) => (
              <option key={t} value={t}>{EVENT_TYPE_LABEL[t]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Формат</label>
          <select name="format" defaultValue={event.format} className="input-control w-full">
            <option value="in_person">Офлайн</option>
            <option value="online">Онлайн</option>
            <option value="hybrid">Гібрид</option>
          </select>
        </div>
        <div>
          <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Статус</label>
          <select name="status" defaultValue={event.status} className="input-control w-full">
            <option value="planned">Заплановано</option>
            <option value="confirmed">Підтверджено</option>
            <option value="attended">Відвідано</option>
            <option value="cancelled">Скасовано</option>
          </select>
        </div>
      </div>

      <div>
        <div className="mb-1.5 flex items-center gap-2">
          <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Дати</label>
          <label className="flex cursor-pointer items-center gap-1.5 text-xs text-slate-500">
            <input
              type="checkbox"
              checked={oneDayEvent}
              onChange={(e) => {
                setOneDayEvent(e.target.checked);
              }}
              className="h-3.5 w-3.5 rounded accent-blue-600"
            />
            Одноденна подія
          </label>
        </div>
        <div className={`grid gap-3 ${oneDayEvent ? "grid-cols-1" : "grid-cols-2"}`}>
          <div>
            <label className="mb-0.5 block text-[10px] text-slate-400">{oneDayEvent ? "Дата" : "Початок"}</label>
            <input
              type="date"
              name="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input-control w-full"
            />
          </div>
          {oneDayEvent ? (
            <input type="hidden" name="endDate" value={startDate} />
          ) : (
            <div>
              <label className="mb-0.5 block text-[10px] text-slate-400">Закінчення</label>
              <input type="date" name="endDate" defaultValue={event.endDate} className="input-control w-full" />
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Дедлайн тез</label>
          <input type="date" name="abstractDeadline" defaultValue={event.abstractDeadline} className="input-control w-full" />
        </div>
        <div>
          <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Дедлайн повної статті</label>
          <input type="date" name="fullPaperDeadline" defaultValue={event.fullPaperDeadline} className="input-control w-full" />
        </div>
        <div>
          <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Дедлайн реєстрації</label>
          <input type="date" name="registrationDeadline" defaultValue={event.registrationDeadline} className="input-control w-full" />
        </div>
        <div>
          <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Мови</label>
          <input type="text" name="languages" defaultValue={event.languages} className="input-control w-full" placeholder="укр., англ." />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Місце / Місто</label>
          <input type="text" name="location" defaultValue={event.location} className="input-control w-full" />
        </div>
        <div>
          <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">URL сайту</label>
          <input type="url" name="url" defaultValue={event.url} className="input-control w-full" placeholder="https://…" />
        </div>
        <div>
          <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Форма реєстрації (URL)</label>
          <input type="url" name="registrationFormUrl" defaultValue={event.registrationFormUrl} className="input-control w-full" placeholder="https://forms.gle/…" />
        </div>
        <div>
          <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Email оргкомітету</label>
          <input type="email" name="organizingEmail" defaultValue={event.organizingEmail} className="input-control w-full" placeholder="conf@example.com" />
        </div>
      </div>

      <div>
        <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Наукові секції / треки</label>
        <textarea
          name="sections"
          defaultValue={event.sections}
          rows={3}
          className="input-control w-full resize-y"
          placeholder={"Секція 1. Промислова біотехнологія\nСекція 2. Біоенергетика"}
        />
        <p className="mt-0.5 text-[10px] text-slate-400">Кожна секція з нового рядка</p>
      </div>

      <div>
        <div className="mb-0.5 flex items-center justify-between">
          <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Опис / Примітки</label>
          <span className={`text-[10px] tabular-nums ${descLen > 2800 ? "text-rose-500" : "text-slate-400"}`}>
            {descLen}/3000
          </span>
        </div>
        <textarea
          name="description"
          defaultValue={event.description}
          rows={4}
          maxLength={3000}
          onChange={(e) => setDescLen(e.target.value.length)}
          className="input-control w-full resize-y"
          placeholder="Тематика, важлива інформація, нотатки…"
        />
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onClose} className="control px-3 py-1.5 text-sm">Скасувати</button>
        <button type="submit" className="control-primary px-3 py-1.5 text-sm">Зберегти зміни</button>
      </div>
    </form>
  );
}

// ── Event card ────────────────────────────────────────────────────────────────

function EventCard({
  event,
  participations,
  members,
  locale,
  projectId,
  returnTo,
  canManage,
  isOpen,
  onOpen,
  onClose,
}: {
  event: ResearchEvent;
  participations: EventParticipation[];
  members: SafeUser[];
  locale: string;
  projectId: string;
  returnTo: string;
  canManage: boolean;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const deleteFormRef = useRef<HTMLFormElement>(null);

  const startFmt = fmtDate(event.startDate);
  const endFmt = fmtDate(event.endDate);
  const isSingleDay = event.startDate && event.endDate && event.startDate === event.endDate;
  const dateRange = isSingleDay
    ? startFmt
    : [startFmt, endFmt].filter(Boolean).join(" — ");
  const deadlines = [
    event.abstractDeadline ? { label: "Тези", value: event.abstractDeadline } : null,
    event.fullPaperDeadline ? { label: "Стаття", value: event.fullPaperDeadline } : null,
    event.registrationDeadline ? { label: "Реєстрація", value: event.registrationDeadline } : null,
  ].filter(Boolean) as { label: string; value: string }[];
  const sections = event.sections.split("\n").map((item) => item.trim()).filter(Boolean);
  const submissionCount = participations.reduce((acc, item) => acc + (item.submissions?.length ?? 0), 0);
  const acceptedCount = participations.filter((p) => p.status === "accepted" || p.status === "attended").length;
  const attentionLevel = Math.min(
    ...deadlines
      .map((item) => daysUntil(item.value))
      .filter((value): value is number => value !== null),
  );
  const accentClass =
    event.status === "cancelled"
      ? "from-slate-100 via-white to-slate-50"
      : attentionLevel <= 7
        ? "from-rose-50 via-white to-amber-50"
        : "from-blue-50 via-white to-cyan-50";

  return (
    <>
      <motion.article
        layout
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className={`overflow-hidden rounded-[20px] border border-white/70 bg-gradient-to-br ${accentClass} shadow-[0_10px_30px_rgba(15,23,42,0.06)] ring-1 ring-slate-200/70 transition ${
          event.status === "cancelled" ? "opacity-70" : "hover:-translate-y-0.5 hover:shadow-[0_16px_38px_rgba(37,99,235,0.10)]"
        }`}
      >
        <div className={`h-1 w-full ${EVENT_TYPE_BAR[event.type]}`} />
        <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${EVENT_TYPE_COLOR[event.type]}`}>
                {EVENT_TYPE_LABEL[event.type]}
              </span>
              <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${EVENT_STATUS_COLOR[event.status]}`}>
                {EVENT_STATUS_LABEL[event.status]}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                {FORMAT_ICON[event.format]}
                {FORMAT_LABEL[event.format]}
              </span>
            </div>
            <h3 className="mt-2 line-clamp-2 text-base font-semibold leading-6 text-slate-950">
              {event.title}
            </h3>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500">
              {dateRange && (
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5 text-blue-600" />
                  {dateRange}
                </span>
              )}
              {event.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-cyan-600" />
                  {event.location}
                </span>
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {deadlines.slice(0, 2).map((item) => (
                <Countdown key={`${event._id}-${item.label}`} label={item.label} dateStr={item.value} size="xs" />
              ))}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <div className="hidden min-w-[120px] lg:block">
              <ParticipantAvatars participations={participations} />
              <div className="mt-2 text-[11px] text-slate-500">
                {participations.length} учасн. • {submissionCount} подань
              </div>
            </div>
            <button
              type="button"
              onClick={onOpen}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            >
              Деталі
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </motion.article>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Закрити панель"
              onClick={() => {
                setEditing(false);
                onClose();
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-slate-950/28 backdrop-blur-[2px]"
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl overflow-y-auto border-l border-slate-200 bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_18%,#ffffff_100%)] shadow-[0_24px_80px_rgba(15,23,42,0.20)]"
            >
              <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/92 px-5 py-4 backdrop-blur">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${EVENT_TYPE_COLOR[event.type]}`}>
                        {EVENT_TYPE_LABEL[event.type]}
                      </span>
                      <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${EVENT_STATUS_COLOR[event.status]}`}>
                        {EVENT_STATUS_LABEL[event.status]}
                      </span>
                    </div>
                    <h3 className="mt-2 text-lg font-semibold leading-6 text-slate-950">{event.title}</h3>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      {dateRange && <span>{dateRange}</span>}
                      {event.location && <span>• {event.location}</span>}
                      <span>• {participations.length} учасн.</span>
                      <span>• {acceptedCount} прийнято</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(false);
                      onClose();
                    }}
                    className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-4 p-5">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Участь</p>
                    <p className="mt-1 text-xl font-semibold text-slate-900">{participations.length}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Подання</p>
                    <p className="mt-1 text-xl font-semibold text-violet-700">{submissionCount}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Accepted</p>
                    <p className="mt-1 text-xl font-semibold text-emerald-700">{acceptedCount}</p>
                  </div>
                </div>

                {deadlines.length > 0 && (
                  <div className="rounded-[20px] border border-slate-200 bg-white p-4">
                    <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Дедлайни</p>
                    <div className="flex flex-wrap gap-2">
                      {deadlines.map((item) => (
                        <Countdown key={`${event._id}-${item.label}`} label={item.label} dateStr={item.value} />
                      ))}
                    </div>
                  </div>
                )}

                {!editing && (event.languages || event.organizingEmail || event.registrationFormUrl || event.url) && (
                  <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-500">
                    {event.languages && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1">
                        <Languages className="h-3.5 w-3.5" />
                        {event.languages}
                      </span>
                    )}
                    {event.organizingEmail && (
                      <a href={`mailto:${event.organizingEmail}`} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-blue-700 hover:border-blue-200 hover:bg-blue-50">
                        <AtSign className="h-3.5 w-3.5" />
                        {event.organizingEmail}
                      </a>
                    )}
                    {event.registrationFormUrl && (
                      <a href={event.registrationFormUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-emerald-700 transition hover:bg-emerald-100">
                        <Link2 className="h-3.5 w-3.5" />
                        Реєстрація
                      </a>
                    )}
                    {event.url && (
                      <a href={event.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-blue-700 transition hover:bg-blue-100">
                        <ExternalLink className="h-3.5 w-3.5" />
                        Сайт
                      </a>
                    )}
                  </div>
                )}

                {!editing && sections.length > 0 && (
                  <div className="rounded-[20px] border border-indigo-100 bg-indigo-50/45 px-4 py-4">
                    <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-600">
                      <BookOpen className="h-3 w-3" />
                      Наукові секції
                    </p>
                    <ul className="grid gap-2">
                      {sections.map((s, i) => (
                        <li key={i} className="rounded-2xl border border-indigo-100/80 bg-white/70 px-3 py-2 text-xs text-indigo-950">
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {event.description && !editing && (
                  <div className="rounded-[20px] border border-slate-200 bg-white px-4 py-4">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Опис і нотатки</p>
                    <p className="whitespace-pre-line text-sm leading-7 text-slate-700">{event.description}</p>
                  </div>
                )}

                {editing && canManage ? (
                  <EditEventForm
                    event={event}
                    locale={locale}
                    projectId={projectId}
                    returnTo={returnTo}
                    onClose={() => setEditing(false)}
                  />
                ) : (
                  canManage && (
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEditing(true)}
                        className="inline-flex items-center gap-1.5 control px-3 py-1.5 text-xs"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Редагувати подію
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(true)}
                        className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-500 transition hover:bg-rose-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Видалити
                      </button>
                      <form ref={deleteFormRef} action={deleteResearchEvent} className="hidden" aria-hidden="true">
                        <input type="hidden" name="locale" value={locale} />
                        <input type="hidden" name="projectId" value={projectId} />
                        <input type="hidden" name="eventId" value={event._id ?? ""} />
                        <button type="submit" />
                      </form>
                    </div>
                  )
                )}

                <ParticipationSection
                  event={event}
                  participations={participations}
                  members={members}
                  locale={locale}
                  projectId={projectId}
                  returnTo={returnTo}
                  canManage={canManage}
                />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <ConfirmModal
        open={confirmDelete}
        title="Видалити подію?"
        message="Подію та всіх учасників буде видалено безповоротно."
        onConfirm={() => { setConfirmDelete(false); deleteFormRef.current?.requestSubmit(); }}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}

// ── Stats bar ─────────────────────────────────────────────────────────────────

type AttentionItem = {
  key: string;
  title: string;
  subtitle: string;
  days: number | null;
  href?: string;
  tone: "rose" | "amber" | "blue" | "emerald";
};

function buildAttentionItems(events: ResearchEvent[], allParticipations: EventParticipation[]) {
  const items: AttentionItem[] = [];

  for (const event of events) {
    const eventDeadlines = [
      event.abstractDeadline ? { label: "Тези", value: event.abstractDeadline } : null,
      event.fullPaperDeadline ? { label: "Стаття", value: event.fullPaperDeadline } : null,
      event.registrationDeadline ? { label: "Реєстрація", value: event.registrationDeadline } : null,
    ].filter(Boolean) as { label: string; value: string }[];

    for (const deadline of eventDeadlines) {
      const days = daysUntil(deadline.value);
      const tone = days !== null && days < 0 ? "blue" : days !== null && days <= 7 ? "rose" : "amber";
      items.push({
        key: `${event._id}-${deadline.label}`,
        title: `${deadline.label}: ${event.title}`,
        subtitle: fmtDate(deadline.value) ?? "Без дати",
        days,
        tone,
      });
    }
  }

  for (const participation of allParticipations) {
    for (const sub of participation.submissions ?? []) {
      if (!sub.deadline || sub.status === "accepted" || sub.status === "withdrawn") continue;
      const days = daysUntil(sub.deadline);
      items.push({
        key: `${participation._id}-${sub.sid}`,
        title: sub.title || `${SUBMISSION_TYPE_LABEL[sub.type]} для ${participation.participantName}`,
        subtitle: `${participation.participantName} • ${SUBMISSION_STATUS_LABEL[sub.status]}`,
        days,
        tone: days !== null && days <= 5 ? "rose" : "amber",
      });
    }
  }

  return items
    .sort((a, b) => {
      if (a.days === null) return 1;
      if (b.days === null) return -1;
      return a.days - b.days;
    })
    .slice(0, 6);
}

function getToneClasses(tone: AttentionItem["tone"]) {
  switch (tone) {
    case "rose":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "amber":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "emerald":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    default:
      return "border-blue-200 bg-blue-50 text-blue-700";
  }
}

function StatsBar({
  events,
  allParticipations,
}: {
  events: ResearchEvent[];
  allParticipations: EventParticipation[];
}) {
  const upcoming = events.filter(isUpcoming).length;
  const attended = events.filter((e) => e.status === "attended").length;
  const accepted = allParticipations.filter((p) => p.status === "accepted" || p.status === "attended").length;
  const submitted = allParticipations.filter((p) => p.status === "abstract_submitted").length;
  const totalSubmissions = allParticipations.reduce((acc, p) => acc + (p.submissions?.length ?? 0), 0);
  const teamInvolved = new Set(allParticipations.map((p) => p.participantId)).size;

  const stats = [
    {
      label: "Всього подій",
      value: events.length,
      note: "активність напряму",
      icon: <CalendarDays className="h-4 w-4" />,
      color: "text-slate-800",
      chrome: "from-slate-50 to-white",
    },
    {
      label: "Найближчих",
      value: upcoming,
      note: "потребують підготовки",
      icon: <TimerReset className="h-4 w-4" />,
      color: "text-blue-700",
      chrome: "from-blue-50 to-cyan-50",
    },
    {
      label: "Відвідано",
      value: attended,
      note: "закриті події",
      icon: <CheckCircle2 className="h-4 w-4" />,
      color: "text-emerald-700",
      chrome: "from-emerald-50 to-white",
    },
    {
      label: "Прийнятих тез",
      value: accepted,
      note: "успішні участі",
      icon: <Target className="h-4 w-4" />,
      color: "text-indigo-700",
      chrome: "from-indigo-50 to-white",
    },
    {
      label: "Подань / матеріалів",
      value: totalSubmissions,
      note: `${teamInvolved} учасн. залучено`,
      icon: <FileText className="h-4 w-4" />,
      color: "text-violet-700",
      chrome: "from-violet-50 to-white",
    },
  ];

  void submitted;

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
      {stats.map((s) => (
        <div key={s.label} className={`rounded-[22px] border border-white/80 bg-gradient-to-br ${s.chrome} px-4 py-4 shadow-[0_12px_32px_rgba(15,23,42,0.06)] ring-1 ring-slate-200/70`}>
          <div className="flex items-center justify-between gap-3">
            <span className={`flex h-9 w-9 items-center justify-center rounded-2xl border border-white/80 bg-white/90 ${s.color}`}>
              {s.icon}
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{s.label}</span>
          </div>
          <p className={`mt-4 text-3xl font-semibold ${s.color}`}>{s.value}</p>
          <p className="mt-1 text-xs text-slate-500">{s.note}</p>
        </div>
      ))}
    </div>
  );
}

function AgendaRow({
  event,
  participations,
  onOpen,
}: {
  event: ResearchEvent;
  participations: EventParticipation[];
  onOpen: () => void;
}) {
  const startFmt = fmtDate(event.startDate);
  const deadlines = [
    event.abstractDeadline ? { label: "Тези", value: event.abstractDeadline } : null,
    event.registrationDeadline ? { label: "Реєстрація", value: event.registrationDeadline } : null,
    event.fullPaperDeadline ? { label: "Стаття", value: event.fullPaperDeadline } : null,
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <button
      type="button"
      onClick={onOpen}
      className="grid w-full gap-3 rounded-[22px] border border-slate-200/80 bg-white/85 p-4 text-left shadow-sm transition hover:border-blue-200 hover:bg-blue-50/40 hover:shadow-md md:grid-cols-[120px_minmax(0,1fr)_220px]"
    >
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Дата</p>
        <p className="mt-1 text-sm font-semibold text-slate-900">{startFmt ?? "Без дати"}</p>
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${EVENT_TYPE_COLOR[event.type]}`}>
            {EVENT_TYPE_LABEL[event.type]}
          </span>
          <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${EVENT_STATUS_COLOR[event.status]}`}>
            {EVENT_STATUS_LABEL[event.status]}
          </span>
        </div>
        <p className="mt-2 truncate text-sm font-semibold text-slate-950">{event.title}</p>
        <p className="mt-1 text-xs text-slate-500">
          {event.location || "Локація не вказана"} • {participations.length} учасн.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2 md:justify-end">
        {deadlines.slice(0, 2).map((item) => (
          <Countdown key={`${event._id}-${item.label}`} label={item.label} dateStr={item.value} size="xs" />
        ))}
        <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700">
          Деталі <ArrowUpRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function EventsTab({
  events,
  allParticipations,
  members,
  locale,
  projectId,
  returnTo,
  canManage,
}: {
  events: ResearchEvent[];
  allParticipations: EventParticipation[];
  members: SafeUser[];
  locale: string;
  projectId: string;
  returnTo: string;
  canManage: boolean;
}) {
  const [filterType, setFilterType] = useState<EventType | "all">("all");
  const [filterStatus, setFilterStatus] = useState<EventStatus | "upcoming" | "all">("upcoming");
  const [addOpen, setAddOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "agenda">("cards");
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const deferredSearch = useDeferredValue(search);

  const participationsByEvent = new Map<string, EventParticipation[]>();
  for (const p of allParticipations) {
    const arr = participationsByEvent.get(p.eventId) ?? [];
    arr.push(p);
    participationsByEvent.set(p.eventId, arr);
  }

  const filtered = events.filter((e) => {
    if (filterType !== "all" && e.type !== filterType) return false;
    if (filterStatus === "upcoming") return isUpcoming(e);
    if (filterStatus !== "all" && e.status !== filterStatus) return false;
    const haystack = [e.title, e.location, e.description, e.sections, e.languages].join(" ").toLowerCase();
    if (deferredSearch.trim() && !haystack.includes(deferredSearch.trim().toLowerCase())) return false;
    return true;
  });

  const upcoming = filtered.filter(isUpcoming).sort((a, b) => (a.startDate ?? "").localeCompare(b.startDate ?? ""));
  const past = filtered.filter((e) => !isUpcoming(e)).sort((a, b) => (b.startDate ?? "").localeCompare(a.startDate ?? ""));

  const presentTypes = Array.from(new Set(events.map((e) => e.type)));
  const attentionItems = buildAttentionItems(events, allParticipations);
  const nextEvent = events
    .filter(isUpcoming)
    .sort((a, b) => (a.startDate ?? "").localeCompare(b.startDate ?? ""))
    .at(0);
  const totalParticipants = allParticipations.length;
  const acceptedRate = totalParticipants > 0
    ? Math.round((allParticipations.filter((p) => p.status === "accepted" || p.status === "attended").length / totalParticipants) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[24px] border border-white/70 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.12),_transparent_24%),linear-gradient(145deg,_rgba(255,255,255,0.96),_rgba(244,248,255,0.92))] p-5 shadow-[0_16px_44px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/70">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_360px]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-700">
              <Sparkles className="h-3.5 w-3.5" />
              Event intelligence
            </div>
            <h2 className="mt-3 max-w-3xl text-xl font-semibold leading-tight text-slate-950 md:text-2xl">
              Події, дедлайни і участь команди в одному компактному потоці.
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Список подій, коротка аналітика та швидкий доступ до деталей у підсувній панелі.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2.5">
              {canManage && (
                <button
                  type="button"
                  onClick={() => setAddOpen((v) => !v)}
                  className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(37,99,235,0.22)] transition hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  Додати подію
                </button>
              )}
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/85 px-3 py-1.5 text-sm text-slate-600">
                <Target className="h-4 w-4 text-emerald-600" />
                Acceptance rate: <span className="font-semibold text-slate-900">{acceptedRate}%</span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/85 px-3 py-1.5 text-sm text-slate-600">
                <Users className="h-4 w-4 text-violet-600" />
                Залучень: <span className="font-semibold text-slate-900">{totalParticipants}</span>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-[20px] border border-white/80 bg-white/88 p-4 shadow-sm">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Найближча подія</p>
              {nextEvent ? (
                <>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-950">{nextEvent.title}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    {nextEvent.startDate && <span>{fmtDate(nextEvent.startDate)}</span>}
                    {nextEvent.location && <span>• {nextEvent.location}</span>}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {nextEvent.abstractDeadline && <Countdown label="Тези" dateStr={nextEvent.abstractDeadline} />}
                    {nextEvent.registrationDeadline && <Countdown label="Реєстрація" dateStr={nextEvent.registrationDeadline} />}
                  </div>
                </>
              ) : (
                <p className="mt-2 text-sm text-slate-500">У найближчому горизонті подій ще немає.</p>
              )}
            </div>

            <div className="rounded-[20px] border border-white/80 bg-slate-950 p-4 text-white shadow-sm">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Потрібна увага</p>
              <p className="mt-2 text-2xl font-semibold">{attentionItems.length}</p>
              <p className="mt-1 text-xs text-slate-300">дедлайнів і подань у фокусі</p>
            </div>
          </div>
        </div>
      </section>

      <StatsBar events={events} allParticipations={allParticipations} />

      {canManage && (
        <div className="surface overflow-hidden rounded-[20px]">
          <AnimatePresence initial={false}>
            {addOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.24, ease: "easeOut" }}
                className="overflow-hidden"
              >
                <div className="border-b border-slate-100 bg-gradient-to-r from-blue-50 to-cyan-50 px-5 py-3 text-sm font-semibold text-slate-700">
                  Нова подія
                </div>
                <AddEventForm
                  locale={locale}
                  projectId={projectId}
                  returnTo={returnTo}
                  onClose={() => setAddOpen(false)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
        <div className="surface rounded-[20px] p-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Пошук за назвою, містом, секцією, описом…"
                  className="input-control w-full pl-9 pr-3 py-2 text-sm"
                />
              </div>
              <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 p-1">
                <button
                  type="button"
                  onClick={() => setViewMode("cards")}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${viewMode === "cards" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500"}`}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  Cards
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("agenda")}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${viewMode === "agenda" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500"}`}
                >
                  <List className="h-3.5 w-3.5" />
                  Agenda
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                <Filter className="h-3.5 w-3.5" />
                Статус
              </span>
              {(["upcoming", "all", "planned", "confirmed", "attended", "cancelled"] as const).map((s) => {
                const label = s === "all" ? "Всі" : s === "upcoming" ? "Найближчі" : EVENT_STATUS_LABEL[s as EventStatus];
                const isActive = filterStatus === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setFilterStatus(s)}
                    className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition ${
                      isActive ? "border-blue-500 bg-blue-600 text-white shadow-sm" : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {presentTypes.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Тип</span>
                <button
                  type="button"
                  onClick={() => setFilterType("all")}
                  className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition ${filterType === "all" ? "border-slate-500 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"}`}
                >
                  Усі типи
                </button>
                {presentTypes.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setFilterType(filterType === t ? "all" : t)}
                    className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition ${
                      filterType === t ? `${EVENT_TYPE_COLOR[t]} ring-1 ring-current/15` : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    {EVENT_TYPE_LABEL[t]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="surface rounded-[20px] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Потрібна увага</p>
              <h3 className="mt-1 text-sm font-semibold text-slate-900">Дедлайни і незавершені подання</h3>
            </div>
            <CircleDashed className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-4 space-y-2.5">
            {attentionItems.length > 0 ? attentionItems.map((item) => (
              <div key={item.key} className="rounded-[18px] border border-slate-100 bg-slate-50/70 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">{item.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{item.subtitle}</p>
                  </div>
                  <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${getToneClasses(item.tone)}`}>
                    {item.days === null ? "Без дати" : item.days < 0 ? "Минув" : item.days === 0 ? "Сьогодні" : `${item.days} дн.`}
                  </span>
                </div>
              </div>
            )) : (
              <div className="rounded-[18px] border border-dashed border-slate-200 bg-slate-50/70 px-4 py-6 text-sm text-slate-400">
                Немає термінових задач по подіях.
              </div>
            )}
          </div>
        </div>
      </div>

      {upcoming.length === 0 && past.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-[26px] border border-dashed border-slate-200 bg-white/70 py-16 text-center">
          <Microscope className="h-10 w-10 text-slate-200" />
          <p className="text-sm font-medium text-slate-400">
            {events.length === 0 ? "Подій ще немає. Додайте першу конференцію або воркшоп." : "Жодних подій за обраними фільтрами."}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {upcoming.length > 0 && (
            <div>
              <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-blue-600">
                <CalendarDays className="h-3.5 w-3.5" />
                Найближчі події ({upcoming.length})
              </h3>
              {viewMode === "cards" ? (
                <div className="space-y-4">
                  {upcoming.map((event) => (
                    <EventCard
                      key={event._id}
                      event={event}
                      participations={participationsByEvent.get(event._id ?? "") ?? []}
                      members={members}
                      locale={locale}
                      projectId={projectId}
                      returnTo={returnTo}
                      canManage={canManage}
                      isOpen={activeEventId === event._id}
                      onOpen={() => setActiveEventId(event._id ?? null)}
                      onClose={() => setActiveEventId(null)}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {upcoming.map((event) => (
                    <AgendaRow
                      key={event._id}
                      event={event}
                      participations={participationsByEvent.get(event._id ?? "") ?? []}
                      onOpen={() => setActiveEventId(event._id ?? null)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {past.length > 0 && (filterStatus === "all" || filterStatus === "attended" || filterStatus === "cancelled") && (
            <div>
              <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-slate-400">
                <CalendarDays className="h-3.5 w-3.5" />
                Минулі / Архів ({past.length})
              </h3>
              {viewMode === "cards" ? (
                <div className="space-y-4">
                  {past.map((event) => (
                    <EventCard
                      key={event._id}
                      event={event}
                      participations={participationsByEvent.get(event._id ?? "") ?? []}
                      members={members}
                      locale={locale}
                      projectId={projectId}
                      returnTo={returnTo}
                      canManage={canManage}
                      isOpen={activeEventId === event._id}
                      onOpen={() => setActiveEventId(event._id ?? null)}
                      onClose={() => setActiveEventId(null)}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {past.map((event) => (
                    <AgendaRow
                      key={event._id}
                      event={event}
                      participations={participationsByEvent.get(event._id ?? "") ?? []}
                      onOpen={() => setActiveEventId(event._id ?? null)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
