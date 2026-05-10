"use client";

import { useState, useTransition } from "react";
import {
  GraduationCap, BookOpen, FlaskConical, Plus, Trash2, Edit3,
  ChevronDown, ChevronUp, Save, X, CheckCircle2, Clock, AlertCircle, Circle,
  Users, Award, FileText, TrendingUp, CalendarDays,
} from "lucide-react";
import { PhdGanttChart } from "@/components/phd-plan/phd-gantt-chart";
import clsx from "clsx";
import type {
  PhdPlan,
  PhdCurriculumCourse,
  PhdMilestone,
  PhdYearlyPlan,
  PhdYearlyCourse,
  PhdYearlyScientificItem,
  PhdCycleType,
  PhdSubgroupType,
  PhdWorkStatus,
} from "@/lib/schemas";
import {
  savePhdMeta,
  addCurriculumCourse, updateCurriculumCourse, removeCurriculumCourse,
  importCoursesFromYearly,
  addMilestone, updateMilestone, removeMilestone,
  saveYearMeta, saveSemesterDates,
  addYearlyCourse, updateYearlyCourse, removeYearlyCourse,
  addYearlyScientificItem, updateYearlyScientificItem, removeYearlyScientificItem,
} from "@/app/phd-plan-actions";

// ── Constants ─────────────────────────────────────────────────────────────────

const CYCLE_LABELS: Record<PhdCycleType, string> = {
  general: "Цикл загальної підготовки",
  specialty_practice: "Дисципліни науково-практичної підготовки",
  specialty_professional: "Цикл професійної підготовки",
};

const SUBGROUP_LABELS: Record<PhdSubgroupType, string> = {
  mandatory: "Обов'язкові курси (ОК)",
  elective: "Вибіркові курси (ВК)",
};

const WORK_STATUS_LABELS: Record<PhdWorkStatus, string> = {
  pending: "Очікується",
  completed: "Виконано",
  not_completed: "Не виконано",
  partial: "Частково",
};

const WORK_STATUS_COLORS: Record<PhdWorkStatus, string> = {
  pending: "bg-slate-100 text-slate-600 border-slate-200",
  completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  not_completed: "bg-rose-100 text-rose-700 border-rose-200",
  partial: "bg-amber-100 text-amber-700 border-amber-200",
};

const WORK_STATUS_ICONS: Record<PhdWorkStatus, typeof Circle> = {
  pending: Clock,
  completed: CheckCircle2,
  not_completed: AlertCircle,
  partial: Circle,
};

const YEAR_LABELS = ["1-й рік", "2-й рік", "3-й рік", "4-й рік"];

const CONTROL_FORM_OPTIONS = [
  { value: "Іспит", label: "Іспит" },
  { value: "Диф.залік", label: "Диф.залік" },
  { value: "Залік", label: "Залік" },
];

// ── Semester helpers ──────────────────────────────────────────────────────────

function semOptionsFromPlan(plan: PhdPlan | null, year: number): SemOption[] {
  const yp = plan?.yearlyPlans.find((y) => y.year === year);
  const opts: SemOption[] = [];
  if (yp?.sem1Start && yp?.sem1End) opts.push({ key: "sem1", label: "Семестр І", from: yp.sem1Start, to: yp.sem1End });
  if (yp?.sem2Start && yp?.sem2End) opts.push({ key: "sem2", label: "Семестр ІІ", from: yp.sem2Start, to: yp.sem2End });
  if (yp?.sem1Start && yp?.sem2End) opts.push({ key: "academic_year", label: "Академічний рік", from: yp.sem1Start, to: yp.sem2End });
  return opts;
}

// ── Course suggestion helpers ─────────────────────────────────────────────────

type CourseSuggestion = {
  title: string;
  cycle: PhdCycleType;
  subgroup: PhdSubgroupType;
  controlForm: string;
  credits?: number;
  studyYear?: number;
};

function CourseQuickPick({ suggestions, onPick }: {
  suggestions: CourseSuggestion[];
  onPick: (s: CourseSuggestion) => void;
}) {
  if (suggestions.length === 0) return null;
  return (
    <div className="mb-2 rounded border border-amber-200 bg-amber-50/60 p-2">
      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-amber-700">
        Підтягнути з каталогу
      </label>
      <select
        className="w-full rounded border border-amber-200 bg-white px-2 py-1 text-xs text-slate-700 focus:border-amber-400 focus:outline-none"
        value=""
        onChange={(e) => {
          const s = suggestions[Number(e.target.value)];
          if (s) onPick(s);
        }}
      >
        <option value="">— Оберіть курс зі списку —</option>
        {suggestions.map((s, i) => (
          <option key={i} value={i}>
            {s.title}{s.credits ? ` (${s.credits} кред.)` : ""}
          </option>
        ))}
      </select>
    </div>
  );
}

// ── Base input style ──────────────────────────────────────────────────────────

const inputCls =
  "w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-800 placeholder-slate-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-200";

// ── Helper UI components ──────────────────────────────────────────────────────

function Input({
  name, defaultValue = "", placeholder = "", className = "", type = "text", ...rest
}: {
  name: string; defaultValue?: string | number; placeholder?: string;
  className?: string; type?: string; [key: string]: unknown;
}) {
  return (
    <input
      type={type}
      name={name}
      defaultValue={String(defaultValue)}
      placeholder={placeholder}
      className={clsx(inputCls, className)}
      {...rest}
    />
  );
}

function DateInput({ name, defaultValue = "", className = "" }: {
  name: string; defaultValue?: string; className?: string;
}) {
  return (
    <input
      type="date"
      name={name}
      defaultValue={defaultValue}
      className={clsx(inputCls, "cursor-pointer", className)}
    />
  );
}

type SemOption = { key?: string; label: string; from: string; to: string };

function DateRangeInput({ name, defaultValue, defaultTermType = "", semOptions }: {
  name: string; defaultValue?: string; defaultTermType?: string; semOptions?: SemOption[];
}) {
  const parts = (defaultValue ?? "").split(" — ");
  const isIso = (s?: string) => /^\d{4}-\d{2}-\d{2}$/.test(s ?? "");
  const [from, setFrom] = useState(isIso(parts[0]) ? (parts[0] ?? "") : "");
  const [to, setTo] = useState(isIso(parts[1]) ? (parts[1] ?? "") : "");
  const [termType, setTermType] = useState(defaultTermType);
  const combined = from && to ? `${from} — ${to}` : from || to || "";
  return (
    <div className="space-y-1">
      {semOptions && semOptions.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {semOptions.map((opt) => (
            <button
              key={opt.label}
              type="button"
              onClick={() => { setFrom(opt.from); setTo(opt.to); setTermType(opt.key ?? ""); }}
              className={clsx(
                "rounded border px-1.5 py-0.5 text-[10px] font-medium transition-colors",
                termType === opt.key
                  ? "border-blue-400 bg-blue-100 text-blue-700"
                  : "border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-1.5">
        <input type="hidden" name={name} value={combined} />
        <input type="hidden" name={`${name}_termType`} value={termType} />
        <input
          type="date"
          value={from}
          onChange={(e) => { setFrom(e.target.value); setTermType(""); }}
          className={clsx(inputCls, "cursor-pointer flex-1 min-w-0")}
        />
        <span className="shrink-0 text-xs text-slate-400">—</span>
        <input
          type="date"
          value={to}
          onChange={(e) => { setTo(e.target.value); setTermType(""); }}
          className={clsx(inputCls, "cursor-pointer flex-1 min-w-0")}
        />
      </div>
    </div>
  );
}

function Textarea({ name, defaultValue = "", placeholder = "", rows = 3 }: {
  name: string; defaultValue?: string; placeholder?: string; rows?: number;
}) {
  return (
    <textarea
      name={name}
      defaultValue={defaultValue}
      placeholder={placeholder}
      rows={rows}
      className={inputCls}
    />
  );
}

function SelectField({ name, defaultValue, options, className = "" }: {
  name: string; defaultValue?: string; options: { value: string; label: string }[]; className?: string;
}) {
  return (
    <select name={name} defaultValue={defaultValue} className={clsx(inputCls, className)}>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="mb-0.5 block text-xs font-medium text-slate-600">{children}</label>;
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><Label>{label}</Label>{children}</div>;
}

function SectionCard({ title, icon: Icon, children, className = "" }: {
  title: string; icon?: typeof GraduationCap; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={clsx("rounded-lg border border-slate-200 bg-white", className)}>
      {title && (
        <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
          {Icon && <Icon className="h-4 w-4 text-blue-600" />}
          <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}

function ActionBtn({ onClick, variant = "ghost", children, type = "button", className = "" }: {
  onClick?: () => void; variant?: "ghost" | "primary" | "danger"; children: React.ReactNode;
  type?: "button" | "submit"; className?: string;
}) {
  const base = "inline-flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium transition focus:outline-none";
  const variants = {
    ghost: "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50",
    primary: "border border-blue-600 bg-blue-600 text-white hover:bg-blue-700",
    danger: "border border-rose-200 bg-white text-rose-600 hover:border-rose-300 hover:bg-rose-50",
  };
  return (
    <button type={type} onClick={onClick} className={clsx(base, variants[variant], className)}>
      {children}
    </button>
  );
}

// ── ECTS Gauge (manometer) ────────────────────────────────────────────────────

function EctsGauge({ current, target, mandatory, elective }: {
  current: number; target: number; mandatory: number; elective: number;
}) {
  const pct = target > 0 ? Math.min(current / target, 1) : 0;
  const cx = 100, cy = 105;
  const rO = 76, rI = 59;
  const startDeg = 150, sweepDeg = 240;

  function polar(angleDeg: number, r: number) {
    const a = (angleDeg * Math.PI) / 180;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  }

  function arcPath(fromDeg: number, toDeg: number, rOuter: number, rInner: number) {
    const p1 = polar(fromDeg, rOuter);
    const p2 = polar(toDeg, rOuter);
    const p3 = polar(toDeg, rInner);
    const p4 = polar(fromDeg, rInner);
    const span = ((toDeg - fromDeg) + 720) % 360;
    const lg = span > 180 ? 1 : 0;
    const f = (n: number) => n.toFixed(2);
    return (
      `M ${f(p1.x)} ${f(p1.y)} A ${rOuter} ${rOuter} 0 ${lg} 1 ${f(p2.x)} ${f(p2.y)} ` +
      `L ${f(p3.x)} ${f(p3.y)} A ${rInner} ${rInner} 0 ${lg} 0 ${f(p4.x)} ${f(p4.y)} Z`
    );
  }

  const progressColor = pct < 0.4 ? "#ef4444" : pct < 0.7 ? "#f59e0b" : "#10b981";

  // Needle
  const needleAngle = startDeg + pct * sweepDeg;
  const tip = polar(needleAngle, 51);
  const bl = polar(needleAngle + 90, 5.5);
  const br = polar(needleAngle - 90, 5.5);

  // 5 tick marks at 0%, 25%, 50%, 75%, 100%
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t, i) => {
    const angle = startDeg + t * sweepDeg;
    return {
      inner: polar(angle, rO + 2),
      outer: polar(angle, rO + 10),
      label: polar(angle, rO + 19),
      value: target > 0 ? Math.round(t * target) : 0,
      major: i === 0 || i === 2 || i === 4,
    };
  });

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 152" width="224" height="170" aria-label={`${current} з ${target} кредитів ЄКТС`}>
        <defs>
          <filter id="gauge-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Outer decorative ring */}
        <circle cx={cx} cy={cy} r={rO + 14} fill="none" stroke="#e2e8f0" strokeWidth="1" />

        {/* Background track */}
        <path d={arcPath(startDeg, startDeg + sweepDeg, rO, rI)} fill="#f1f5f9" />

        {/* Color zone backgrounds (light) */}
        <path d={arcPath(startDeg, startDeg + 0.40 * sweepDeg, rO, rI)} fill="#fecaca" opacity="0.7" />
        <path d={arcPath(startDeg + 0.40 * sweepDeg, startDeg + 0.70 * sweepDeg, rO, rI)} fill="#fde68a" opacity="0.7" />
        <path d={arcPath(startDeg + 0.70 * sweepDeg, startDeg + sweepDeg, rO, rI)} fill="#a7f3d0" opacity="0.7" />

        {/* Active progress arc */}
        {pct > 0.005 && (
          <path
            d={arcPath(startDeg, startDeg + pct * sweepDeg, rO, rI)}
            fill={progressColor}
            filter="url(#gauge-glow)"
          />
        )}

        {/* Tick marks */}
        {ticks.map((tick, i) => (
          <g key={i}>
            <line
              x1={tick.inner.x.toFixed(2)} y1={tick.inner.y.toFixed(2)}
              x2={tick.outer.x.toFixed(2)} y2={tick.outer.y.toFixed(2)}
              stroke={tick.major ? "#475569" : "#94a3b8"}
              strokeWidth={tick.major ? 2 : 1.2}
              strokeLinecap="round"
            />
            <text
              x={tick.label.x.toFixed(2)} y={tick.label.y.toFixed(2)}
              textAnchor="middle" dominantBaseline="middle"
              fontSize="7.5" fill="#64748b" fontWeight={tick.major ? "600" : "400"}
            >
              {tick.value}
            </text>
          </g>
        ))}

        {/* Inner white disc */}
        <circle cx={cx} cy={cy} r={rI - 3} fill="white" />

        {/* Subtle inner shadow ring */}
        <circle cx={cx} cy={cy} r={rI - 3} fill="none" stroke="#e2e8f0" strokeWidth="1.5" />

        {/* Needle */}
        <polygon
          points={`${tip.x.toFixed(2)},${tip.y.toFixed(2)} ${bl.x.toFixed(2)},${bl.y.toFixed(2)} ${br.x.toFixed(2)},${br.y.toFixed(2)}`}
          fill="#1e293b"
        />
        {/* Center hub */}
        <circle cx={cx} cy={cy} r={6} fill="#0f172a" />
        <circle cx={cx} cy={cy} r={3} fill="#94a3b8" />

        {/* Value readout */}
        <text
          x={cx} y={cy + 22}
          textAnchor="middle" fontSize="26" fontWeight="800"
          fill={progressColor} fontFamily="ui-monospace, monospace"
        >
          {current}
        </text>
        <text x={cx} y={cy + 36} textAnchor="middle" fontSize="9" fill="#94a3b8">
          / {target} кредитів ЄКТС
        </text>
        <text x={cx} y={cy + 49} textAnchor="middle" fontSize="8.5" fill="#64748b" fontWeight="600">
          {Math.round(pct * 100)}% виконано
        </text>
      </svg>

      {/* Breakdown strip */}
      <div className="mt-1 flex items-center divide-x divide-slate-200 rounded-lg border border-slate-100 bg-slate-50/80 text-xs overflow-hidden">
        <div className="px-4 py-2 text-center">
          <p className="font-bold text-blue-700 tabular-nums">{mandatory}</p>
          <p className="text-slate-500 mt-0.5">ОК кредити</p>
        </div>
        <div className="px-4 py-2 text-center">
          <p className="font-bold text-violet-700 tabular-nums">{elective}</p>
          <p className="text-slate-500 mt-0.5">ВК кредити</p>
        </div>
        <div className="px-4 py-2 text-center">
          <p className="font-bold tabular-nums" style={{ color: progressColor }}>{current}</p>
          <p className="text-slate-500 mt-0.5">Всього</p>
        </div>
        <div className="px-4 py-2 text-center">
          <p className="font-bold text-slate-700 tabular-nums">{target}</p>
          <p className="text-slate-500 mt-0.5">Ціль</p>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function PhdPlanView({
  projectId, locale, canManage, initialPlan,
}: {
  projectId: string; locale: string; canManage: boolean; initialPlan: PhdPlan | null;
}) {
  const [tab, setTab] = useState<"meta" | "general" | 1 | 2 | 3 | 4 | "gantt">("meta");
  const [, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const plan = initialPlan;

  function flash() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const tabs: { id: typeof tab; label: string; icon: typeof GraduationCap }[] = [
    { id: "meta", label: "Інформація", icon: GraduationCap },
    { id: "general", label: "Загальний план", icon: BookOpen },
    { id: 1, label: "1-й рік", icon: FlaskConical },
    { id: 2, label: "2-й рік", icon: FlaskConical },
    { id: 3, label: "3-й рік", icon: FlaskConical },
    { id: 4, label: "4-й рік", icon: FlaskConical },
    { id: "gantt", label: "Ганта", icon: CalendarDays },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
        {tabs.map((t) => (
          <button
            key={String(t.id)}
            onClick={() => setTab(t.id)}
            className={clsx(
              "inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition",
              tab === t.id
                ? "bg-white text-blue-700 shadow-sm"
                : "text-slate-500 hover:bg-white/60 hover:text-slate-700",
            )}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
        {saved && (
          <span className="ml-auto flex items-center gap-1 text-xs text-emerald-600">
            <CheckCircle2 className="h-3.5 w-3.5" /> Збережено
          </span>
        )}
      </div>

      {tab === "meta" && (
        <MetaTab projectId={projectId} locale={locale} canManage={canManage} plan={plan} onSaved={flash} startTransition={startTransition} />
      )}
      {tab === "general" && (
        <GeneralPlanTab projectId={projectId} locale={locale} canManage={canManage} plan={plan} startTransition={startTransition} />
      )}
      {typeof tab === "number" && (
        <YearlyPlanTab
          projectId={projectId}
          locale={locale}
          canManage={canManage}
          year={tab}
          yearlyPlan={plan?.yearlyPlans.find((y) => y.year === tab) ?? null}
          curriculumCourses={plan?.curriculumCourses ?? []}
          startTransition={startTransition}
        />
      )}
      {tab === "gantt" && <PhdGanttChart plan={plan} />}
    </div>
  );
}

// ── Meta tab ──────────────────────────────────────────────────────────────────

function MetaTab({ projectId, locale, canManage, plan, onSaved, startTransition }: {
  projectId: string; locale: string; canManage: boolean; plan: PhdPlan | null;
  onSaved: () => void; startTransition: ReturnType<typeof useTransition>[1];
}) {
  return (
    <form
      action={(fd) => {
        fd.set("locale", locale);
        fd.set("projectId", projectId);
        startTransition(async () => { await savePhdMeta(fd); onSaved(); });
      }}
      className="space-y-4"
    >
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="projectId" value={projectId} />

      <SectionCard title="Загальні відомості" icon={GraduationCap}>
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="ПІБ аспіранта">
            <Input name="studentName" defaultValue={plan?.studentName} placeholder="Прізвище Ім'я По батькові" />
          </FormField>
          <FormField label="Спеціальність">
            <Input name="specialty" defaultValue={plan?.specialty} placeholder="Наприклад: 091 Біологія" />
          </FormField>
          <FormField label="Форма навчання">
            <SelectField
              name="studyForm"
              defaultValue={plan?.studyForm ?? "full_time"}
              options={[
                { value: "full_time", label: "Денна" },
                { value: "part_time", label: "Заочна" },
              ]}
            />
          </FormField>
          <FormField label="Загальна кількість кредитів ЄКТС (ціль)">
            <Input name="totalCredits" type="number" defaultValue={plan?.totalCredits ?? 60} />
          </FormField>
          <FormField label="Дата зарахування в аспірантуру">
            <DateInput name="enrollmentDate" defaultValue={plan?.enrollmentDate} />
          </FormField>
          <FormField label="Дата наказу про зарахування">
            <DateInput name="enrollmentOrderDate" defaultValue={plan?.enrollmentOrderDate} />
          </FormField>
          <FormField label="Номер наказу">
            <Input name="enrollmentOrderNumber" defaultValue={plan?.enrollmentOrderNumber} />
          </FormField>
        </div>
      </SectionCard>

      <SectionCard title="Науковий керівник" icon={Users}>
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="ПІБ наукового керівника">
            <Input name="supervisor" defaultValue={plan?.supervisor} placeholder="Прізвище Ім'я По батькові" />
          </FormField>
          <FormField label="Науковий ступінь, вчене звання">
            <Input name="supervisorTitle" defaultValue={plan?.supervisorTitle} placeholder="к.б.н., старший дослідник" />
          </FormField>
        </div>
      </SectionCard>

      <SectionCard title="Установа" icon={FileText}>
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="Установа">
            <Input name="institution" defaultValue={plan?.institution} placeholder="Назва наукової установи / університету" />
          </FormField>
          <FormField label="Відділ / Підрозділ">
            <Input name="department" defaultValue={plan?.department} placeholder="Назва відділу або підрозділу" />
          </FormField>
        </div>
      </SectionCard>

      <SectionCard title="Тема дисертації" icon={Award}>
        <div className="space-y-3">
          <FormField label="Тема дисертаційної роботи">
            <Textarea name="dissertationTitle" defaultValue={plan?.dissertationTitle} rows={3}
              placeholder="Повна назва теми дисертації доктора філософії" />
          </FormField>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Дата затвердження вченою радою">
              <DateInput name="dissertationApprovalDate" defaultValue={plan?.dissertationApprovalDate} />
            </FormField>
            <FormField label="Номер протоколу">
              <Input name="dissertationApprovalProtocol" defaultValue={plan?.dissertationApprovalProtocol} />
            </FormField>
          </div>
          <FormField label="Обґрунтування вибору теми">
            <Textarea name="justification" defaultValue={plan?.justification} rows={6}
              placeholder="Стислий виклад актуальності та обґрунтування вибору теми..." />
          </FormField>
        </div>
      </SectionCard>

      {canManage && (
        <div className="flex justify-end">
          <ActionBtn type="submit" variant="primary">
            <Save className="h-3.5 w-3.5" /> Зберегти інформацію
          </ActionBtn>
        </div>
      )}
    </form>
  );
}

// ── Semester helpers ─────────────────────────────────────────────────────────

function fmtSemDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("uk-UA", { day: "numeric", month: "short" });
}

function SemesterAccordion({ plan, projectId, locale, canManage, open, onToggle, startTransition }: {
  plan: PhdPlan | null; projectId: string; locale: string; canManage: boolean;
  open: boolean; onToggle: () => void;
  startTransition: ReturnType<typeof useTransition>[1];
}) {
  const configuredCount = ([1, 2, 3, 4] as const).filter((yr) => {
    const yp = plan?.yearlyPlans.find((y) => y.year === yr);
    return yp?.sem1Start && yp?.sem1End && yp?.sem2Start && yp?.sem2End;
  }).length;

  const yearAccents = [
    { bg: "bg-blue-600", ring: "ring-blue-400", text: "text-blue-700" },
    { bg: "bg-emerald-600", ring: "ring-emerald-400", text: "text-emerald-700" },
    { bg: "bg-violet-600", ring: "ring-violet-400", text: "text-violet-700" },
    { bg: "bg-amber-600", ring: "ring-amber-400", text: "text-amber-700" },
  ] as const;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Accordion header — always visible */}
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50/60 transition"
      >
        <CalendarDays className="h-4 w-4 shrink-0 text-blue-600" />
        <span className="flex-1 text-sm font-semibold text-slate-800">Дати навчальних семестрів</span>
        <span className={clsx(
          "mr-2 rounded-full px-2 py-0.5 text-[10px] font-semibold",
          configuredCount === 4 ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500",
        )}>
          {configuredCount}/4 років
        </span>
        {open ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
      </button>

      {/* Compact summary row — visible when closed */}
      {!open && (
        <div className="border-t border-slate-100 px-4 pb-3 pt-2">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-4">
            {([1, 2, 3, 4] as const).map((yr, idx) => {
              const yp = plan?.yearlyPlans.find((y) => y.year === yr);
              const acc = yearAccents[idx];
              const s1 = yp?.sem1Start && yp?.sem1End ? `${fmtSemDate(yp.sem1Start)} — ${fmtSemDate(yp.sem1End)}` : null;
              const s2 = yp?.sem2Start && yp?.sem2End ? `${fmtSemDate(yp.sem2Start)} — ${fmtSemDate(yp.sem2End)}` : null;
              return (
                <div key={yr} className="min-w-0">
                  <div className="mb-1 flex items-center gap-1.5">
                    <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${acc.bg} text-[9px] font-black text-white`}>{yr}</div>
                    <span className={`text-[10px] font-semibold ${acc.text}`}>{yr}-й рік</span>
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1">
                      <span className="w-4 shrink-0 text-[9px] font-bold text-blue-500">І</span>
                      <span className="truncate text-[10px] text-slate-500">{s1 ?? <span className="italic text-slate-300">не вказано</span>}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-4 shrink-0 text-[9px] font-bold text-violet-500">ІІ</span>
                      <span className="truncate text-[10px] text-slate-500">{s2 ?? <span className="italic text-slate-300">не вказано</span>}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Full editor — visible when open */}
      {open && (
        <div className="border-t border-slate-100">
          {([1, 2, 3, 4] as const).map((yr, idx) => {
            const yp = plan?.yearlyPlans.find((y) => y.year === yr);
            const hasBoth = yp?.sem1Start && yp?.sem1End && yp?.sem2Start && yp?.sem2End;
            const acc = yearAccents[idx];
            return (
              <form
                key={yr}
                action={(fd) => {
                  fd.set("locale", locale); fd.set("projectId", projectId); fd.set("year", String(yr));
                  startTransition(() => saveSemesterDates(fd));
                }}
                className="border-b border-slate-100 last:border-b-0"
              >
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="projectId" value={projectId} />
                <input type="hidden" name="year" value={String(yr)} />

                <div className="flex items-center gap-3 bg-slate-50/70 px-4 py-2">
                  <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${acc.bg} text-[11px] font-black text-white ring-2 ring-offset-1 ${acc.ring}`}>
                    {yr}
                  </div>
                  <span className={`text-xs font-semibold ${acc.text}`}>{yr}-й рік навчання</span>
                  {hasBoth && (
                    <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                      <CheckCircle2 className="h-3 w-3" /> налаштовано
                    </span>
                  )}
                </div>

                <div className="grid gap-3 px-4 py-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-l-4 border-blue-200 border-l-blue-400 bg-blue-50/40 p-3">
                    <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-blue-700">
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[9px] font-black text-white">І</span>
                      Семестр
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="mb-0.5 block text-[10px] text-slate-400">Початок</label>
                        <DateInput name="sem1Start" defaultValue={yp?.sem1Start} />
                      </div>
                      <div>
                        <label className="mb-0.5 block text-[10px] text-slate-400">Кінець</label>
                        <DateInput name="sem1End" defaultValue={yp?.sem1End} />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-l-4 border-violet-200 border-l-violet-400 bg-violet-50/40 p-3">
                    <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-violet-700">
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-violet-500 text-[9px] font-black text-white">ІІ</span>
                      Семестр
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="mb-0.5 block text-[10px] text-slate-400">Початок</label>
                        <DateInput name="sem2Start" defaultValue={yp?.sem2Start} />
                      </div>
                      <div>
                        <label className="mb-0.5 block text-[10px] text-slate-400">Кінець</label>
                        <DateInput name="sem2End" defaultValue={yp?.sem2End} />
                      </div>
                    </div>
                  </div>
                </div>

                {canManage && (
                  <div className="flex justify-end px-4 pb-3">
                    <ActionBtn type="submit" variant="primary">
                      <Save className="h-3.5 w-3.5" /> Зберегти {yr}-й рік
                    </ActionBtn>
                  </div>
                )}
              </form>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SemesterInfoBar({ yearlyPlan }: { yearlyPlan: PhdYearlyPlan | null }) {
  const s1 = yearlyPlan?.sem1Start && yearlyPlan?.sem1End
    ? `${fmtSemDate(yearlyPlan.sem1Start)} — ${fmtSemDate(yearlyPlan.sem1End)}`
    : null;
  const s2 = yearlyPlan?.sem2Start && yearlyPlan?.sem2End
    ? `${fmtSemDate(yearlyPlan.sem2Start)} — ${fmtSemDate(yearlyPlan.sem2End)}`
    : null;

  return (
    <div className={clsx(
      "flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border px-3 py-2 text-[11px]",
      s1 || s2 ? "border-blue-100 bg-blue-50/60 text-slate-600" : "border-slate-100 bg-slate-50 text-slate-400",
    )}>
      <CalendarDays className="h-3.5 w-3.5 shrink-0 text-blue-400" />
      {s1 || s2 ? (
        <>
          <span className="flex items-center gap-1.5">
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[8px] font-black text-white">І</span>
            <span>{s1 ?? <span className="italic text-slate-300">не вказано</span>}</span>
          </span>
          <span className="text-slate-300">·</span>
          <span className="flex items-center gap-1.5">
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-violet-500 text-[8px] font-black text-white">ІІ</span>
            <span>{s2 ?? <span className="italic text-slate-300">не вказано</span>}</span>
          </span>
        </>
      ) : (
        <span className="italic">Дати семестрів не вказано — налаштуйте у вкладці «Загальний план»</span>
      )}
    </div>
  );
}

// ── General plan tab ──────────────────────────────────────────────────────────

function GeneralPlanTab({ projectId, locale, canManage, plan, startTransition }: {
  projectId: string; locale: string; canManage: boolean; plan: PhdPlan | null;
  startTransition: ReturnType<typeof useTransition>[1];
}) {
  const [semOpen, setSemOpen] = useState(false);
  const courses = plan?.curriculumCourses ?? [];
  const mandatoryCredits = courses.filter((c) => c.subgroup === "mandatory").reduce((s, c) => s + c.credits, 0);
  const electiveCredits = courses.filter((c) => c.subgroup === "elective").reduce((s, c) => s + c.credits, 0);
  const totalCredits = mandatoryCredits + electiveCredits;
  const targetCredits = plan?.totalCredits && plan.totalCredits > 0 ? plan.totalCredits : 60;

  // Collect all yearly courses as suggestions for curriculum add forms
  const yearlySuggestions: CourseSuggestion[] = (plan?.yearlyPlans ?? []).flatMap((yp) =>
    yp.educationalCourses.map((yc) => ({
      title: yc.title,
      cycle: yc.cycle,
      subgroup: yc.subgroup,
      controlForm: yc.controlForm,
      studyYear: yp.year,
    }))
  );
  // Deduplicate by title (case-insensitive)
  const seen = new Set<string>();
  const uniqueYearlySuggestions = yearlySuggestions.filter((s) => {
    const k = s.title.toLowerCase().trim();
    if (!k || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  // Only suggest courses not already in curriculum
  const existingTitles = new Set(courses.map((c) => c.title.toLowerCase().trim()));
  const newSuggestions = uniqueYearlySuggestions.filter((s) => !existingTitles.has(s.title.toLowerCase().trim()));

  return (
    <div className="space-y-4">
      {/* ECTS progress gauge */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-3">
          <TrendingUp className="h-4 w-4 text-blue-600" />
          <h3 className="text-sm font-semibold text-slate-800">Прогрес кредитів ЄКТС</h3>
          {plan?.totalCredits == null && (
            <span className="ml-auto text-xs text-slate-400">Вкажіть ціль кредитів у «Інформація»</span>
          )}
        </div>
        <div className="flex justify-center">
          <EctsGauge
            current={totalCredits}
            target={targetCredits}
            mandatory={mandatoryCredits}
            elective={electiveCredits}
          />
        </div>
      </div>

      {/* Semester dates — collapsible accordion */}
      <SemesterAccordion
        plan={plan}
        projectId={projectId}
        locale={locale}
        canManage={canManage}
        open={semOpen}
        onToggle={() => setSemOpen((v) => !v)}
        startTransition={startTransition}
      />

      <SectionCard title="І. Індивідуальний навчальний план" icon={BookOpen}>
        {canManage && newSuggestions.length > 0 && (
          <div className="mb-3 flex items-center gap-2 rounded border border-amber-200 bg-amber-50/60 px-3 py-2">
            <span className="flex-1 text-xs text-amber-800">
              {newSuggestions.length} {newSuggestions.length === 1 ? "курс знайдено" : "курси знайдено"} у річних планах але відсутні в загальному плані.
            </span>
            <form action={(fd) => {
              fd.set("locale", locale);
              fd.set("projectId", projectId);
              startTransition(() => importCoursesFromYearly(fd));
            }}>
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="projectId" value={projectId} />
              <button
                type="submit"
                className="inline-flex items-center gap-1 rounded border border-amber-400 bg-amber-400 px-2.5 py-1 text-xs font-medium text-white hover:bg-amber-500 transition"
              >
                <Plus className="h-3 w-3" /> Імпортувати всі
              </button>
            </form>
          </div>
        )}
        <CurriculumTable
          projectId={projectId}
          locale={locale}
          canManage={canManage}
          courses={courses}
          yearlySuggestions={uniqueYearlySuggestions}
          startTransition={startTransition}
        />
      </SectionCard>

      <SectionCard title="ІІ. Індивідуальний план наукової роботи" icon={FlaskConical}>
        <MilestonesTable
          projectId={projectId}
          locale={locale}
          canManage={canManage}
          milestones={plan?.milestones ?? []}
          startTransition={startTransition}
        />
      </SectionCard>
    </div>
  );
}

// ── Curriculum table ──────────────────────────────────────────────────────────

function CurriculumTable({ projectId, locale, canManage, courses, yearlySuggestions = [], startTransition }: {
  projectId: string; locale: string; canManage: boolean; courses: PhdCurriculumCourse[];
  yearlySuggestions?: CourseSuggestion[];
  startTransition: ReturnType<typeof useTransition>[1];
}) {
  const cycles: PhdCycleType[] = ["general", "specialty_practice", "specialty_professional"];

  return (
    <div className="space-y-4">
      {cycles.map((cycle) => {
        const cycleCourses = courses.filter((c) => c.cycle === cycle);
        const cycleTotal = cycleCourses.reduce((s, c) => s + c.credits, 0);
        const hasCourses = cycleCourses.length > 0;
        if (!hasCourses && !canManage) return null;

        return (
          <div key={cycle} className="overflow-hidden rounded-xl border border-slate-200">
            {/* Cycle header */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                {CYCLE_LABELS[cycle]}
              </p>
              {cycleTotal > 0 && (
                <span className="rounded bg-slate-200 px-2 py-0.5 text-xs font-medium tabular-nums text-slate-600">
                  {cycleTotal} кред.
                </span>
              )}
            </div>

            {/* ОК and ВК subsections */}
            <div className="divide-y divide-slate-100">
              {(["mandatory", "elective"] as PhdSubgroupType[]).map((sub) => (
                <CurriculumSubgroupSection
                  key={sub}
                  projectId={projectId}
                  locale={locale}
                  canManage={canManage}
                  cycle={cycle}
                  subgroup={sub}
                  courses={cycleCourses.filter((c) => c.subgroup === sub)}
                  suggestions={yearlySuggestions.filter((s) => s.cycle === cycle && s.subgroup === sub)}
                  startTransition={startTransition}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CurriculumSubgroupSection({ projectId, locale, canManage, cycle, subgroup, courses, suggestions = [], startTransition }: {
  projectId: string; locale: string; canManage: boolean;
  cycle: PhdCycleType; subgroup: PhdSubgroupType; courses: PhdCurriculumCourse[];
  suggestions?: CourseSuggestion[];
  startTransition: ReturnType<typeof useTransition>[1];
}) {
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const isOK = subgroup === "mandatory";
  const totalCredits = courses.reduce((s, c) => s + c.credits, 0);

  return (
    <div>
      {/* Subgroup header */}
      <div className={clsx(
        "flex items-center justify-between px-4 py-2",
        isOK ? "bg-blue-50/40" : "bg-violet-50/40",
      )}>
        <div className="flex items-center gap-2">
          <span className={clsx(
            "rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wide",
            isOK ? "bg-blue-600 text-white" : "bg-violet-600 text-white",
          )}>
            {isOK ? "ОК" : "ВК"}
          </span>
          <span className="text-xs font-medium text-slate-700">{SUBGROUP_LABELS[subgroup]}</span>
        </div>
        {totalCredits > 0 && (
          <span className={clsx(
            "text-xs font-bold tabular-nums",
            isOK ? "text-blue-700" : "text-violet-700",
          )}>
            {totalCredits} кред.
          </span>
        )}
      </div>

      {/* Courses table */}
      {courses.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-white/80">
                <th className="px-2 py-1.5 text-left font-medium text-slate-400">№</th>
                <th className="px-2 py-1.5 text-left font-medium text-slate-400">Назва дисципліни</th>
                <th className="px-2 py-1.5 text-center font-medium text-slate-400">Кредити</th>
                <th className="px-2 py-1.5 text-left font-medium text-slate-400">Форма контролю</th>
                <th className="px-2 py-1.5 text-center font-medium text-slate-400">Рік</th>
                {canManage && <th className="w-12 px-2 py-1.5" />}
              </tr>
            </thead>
            <tbody>
              {courses.map((course, i) =>
                editId === course.cid ? (
                  <CurriculumCourseEditRow
                    key={course.cid}
                    projectId={projectId}
                    locale={locale}
                    course={course}
                    startTransition={startTransition}
                    onDone={() => setEditId(null)}
                  />
                ) : (
                  <tr key={course.cid} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                    <td className="px-2 py-1.5 text-slate-400">{i + 1}</td>
                    <td className="px-2 py-1.5 text-slate-800">{course.title}</td>
                    <td className="px-2 py-1.5 text-center">
                      <span className={clsx(
                        "rounded px-1.5 py-0.5 font-semibold tabular-nums",
                        isOK ? "bg-blue-50 text-blue-700" : "bg-violet-50 text-violet-700",
                      )}>
                        {course.credits}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 text-slate-600">{course.controlForm}</td>
                    <td className="px-2 py-1.5 text-center text-slate-600">{toRoman(course.studyYear)}</td>
                    {canManage && (
                      <td className="px-2 py-1.5">
                        <div className="flex gap-1">
                          <button
                            onClick={() => setEditId(course.cid)}
                            className="rounded p-0.5 text-slate-400 hover:text-blue-600"
                          >
                            <Edit3 className="h-3 w-3" />
                          </button>
                          <form action={(fd) => {
                            fd.set("locale", locale);
                            fd.set("projectId", projectId);
                            fd.set("cid", course.cid);
                            startTransition(() => removeCurriculumCourse(fd));
                          }}>
                            <input type="hidden" name="locale" value={locale} />
                            <input type="hidden" name="projectId" value={projectId} />
                            <input type="hidden" name="cid" value={course.cid} />
                            <button type="submit" className="rounded p-0.5 text-slate-400 hover:text-rose-600">
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </form>
                        </div>
                      </td>
                    )}
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="px-4 py-3 text-center text-xs text-slate-400">
          {canManage ? "Дисциплін ще немає — додайте першу." : "Дисциплін немає."}
        </div>
      )}

      {/* Add row */}
      {canManage && (
        <div className={clsx("border-t border-slate-100 px-3 py-2", adding ? "bg-slate-50" : "")}>
          {adding ? (
            <CurriculumCourseAddForm
              projectId={projectId}
              locale={locale}
              fixedCycle={cycle}
              fixedSubgroup={subgroup}
              suggestions={suggestions}
              startTransition={startTransition}
              onDone={() => setAdding(false)}
            />
          ) : (
            <button
              onClick={() => setAdding(true)}
              className={clsx(
                "inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition",
                isOK
                  ? "text-blue-600 hover:bg-blue-50"
                  : "text-violet-600 hover:bg-violet-50",
              )}
            >
              <Plus className="h-3 w-3" /> Додати дисципліну
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function CurriculumCourseAddForm({ projectId, locale, fixedCycle, fixedSubgroup, suggestions = [], startTransition, onDone }: {
  projectId: string; locale: string;
  fixedCycle?: PhdCycleType; fixedSubgroup?: PhdSubgroupType;
  suggestions?: CourseSuggestion[];
  startTransition: ReturnType<typeof useTransition>[1]; onDone: () => void;
}) {
  const [title, setTitle] = useState("");
  const [credits, setCredits] = useState("3");
  const [controlForm, setControlForm] = useState(CONTROL_FORM_OPTIONS[0]?.value ?? "Іспит");
  const [studyYear, setStudyYear] = useState("1");

  function applyPick(s: CourseSuggestion) {
    setTitle(s.title);
    if (s.credits) setCredits(String(s.credits));
    setControlForm(s.controlForm || (CONTROL_FORM_OPTIONS[0]?.value ?? "Іспит"));
    if (s.studyYear) setStudyYear(String(s.studyYear));
  }

  return (
    <form
      action={(fd) => {
        fd.set("locale", locale);
        fd.set("projectId", projectId);
        startTransition(async () => { await addCurriculumCourse(fd); onDone(); });
      }}
      className="rounded border border-blue-100 bg-white p-3"
    >
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="projectId" value={projectId} />
      {fixedCycle && <input type="hidden" name="cycle" value={fixedCycle} />}
      {fixedSubgroup && <input type="hidden" name="subgroup" value={fixedSubgroup} />}

      <CourseQuickPick suggestions={suggestions} onPick={applyPick} />

      <div className={clsx("grid gap-2", fixedCycle && fixedSubgroup ? "sm:grid-cols-4" : "sm:grid-cols-3")}>
        <div className={clsx(fixedCycle && fixedSubgroup ? "sm:col-span-2" : "")}>
          <FormField label="Назва дисципліни">
            <input
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Назва..."
              className={inputCls}
            />
          </FormField>
        </div>
        {!fixedCycle && (
          <FormField label="Цикл">
            <SelectField name="cycle" options={Object.entries(CYCLE_LABELS).map(([v, l]) => ({ value: v, label: l }))} />
          </FormField>
        )}
        {!fixedSubgroup && (
          <FormField label="Підгрупа">
            <SelectField name="subgroup" options={Object.entries(SUBGROUP_LABELS).map(([v, l]) => ({ value: v, label: l }))} />
          </FormField>
        )}
        <FormField label="Кредити ЄКТС">
          <input
            name="credits"
            type="number"
            value={credits}
            onChange={(e) => setCredits(e.target.value)}
            className={inputCls}
          />
        </FormField>
        <FormField label="Форма контролю">
          <select
            name="controlForm"
            value={controlForm}
            onChange={(e) => setControlForm(e.target.value)}
            className={inputCls}
          >
            {CONTROL_FORM_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </FormField>
        <FormField label="Рік навчання">
          <select
            name="studyYear"
            value={studyYear}
            onChange={(e) => setStudyYear(e.target.value)}
            className={inputCls}
          >
            {[1, 2, 3, 4].map((y) => <option key={y} value={String(y)}>{toRoman(y)}</option>)}
          </select>
        </FormField>
      </div>
      <div className="mt-2 flex gap-2">
        <ActionBtn type="submit" variant="primary"><Save className="h-3.5 w-3.5" /> Додати</ActionBtn>
        <ActionBtn onClick={onDone}><X className="h-3.5 w-3.5" /> Скасувати</ActionBtn>
      </div>
    </form>
  );
}

function CurriculumCourseEditRow({ projectId, locale, course, startTransition, onDone }: {
  projectId: string; locale: string; course: PhdCurriculumCourse;
  startTransition: ReturnType<typeof useTransition>[1]; onDone: () => void;
}) {
  return (
    <tr>
      <td colSpan={6} className="p-2">
        <form
          action={(fd) => {
            fd.set("locale", locale);
            fd.set("projectId", projectId);
            fd.set("cid", course.cid);
            startTransition(async () => { await updateCurriculumCourse(fd); onDone(); });
          }}
          className="grid gap-2 sm:grid-cols-3"
        >
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="cid" value={course.cid} />
          <FormField label="Назва"><Input name="title" defaultValue={course.title} /></FormField>
          <FormField label="Цикл">
            <SelectField name="cycle" defaultValue={course.cycle} options={Object.entries(CYCLE_LABELS).map(([v, l]) => ({ value: v, label: l }))} />
          </FormField>
          <FormField label="Підгрупа">
            <SelectField name="subgroup" defaultValue={course.subgroup} options={Object.entries(SUBGROUP_LABELS).map(([v, l]) => ({ value: v, label: l }))} />
          </FormField>
          <FormField label="Кредити ЄКТС"><Input name="credits" type="number" defaultValue={course.credits} /></FormField>
          <FormField label="Форма контролю">
            <SelectField name="controlForm" defaultValue={course.controlForm} options={CONTROL_FORM_OPTIONS} />
          </FormField>
          <FormField label="Рік навчання">
            <SelectField name="studyYear" defaultValue={String(course.studyYear)} options={[1, 2, 3, 4].map((y) => ({ value: String(y), label: toRoman(y) }))} />
          </FormField>
          <div className="col-span-full flex gap-2">
            <ActionBtn type="submit" variant="primary"><Save className="h-3.5 w-3.5" /> Зберегти</ActionBtn>
            <ActionBtn onClick={onDone}><X className="h-3.5 w-3.5" /> Скасувати</ActionBtn>
          </div>
        </form>
      </td>
    </tr>
  );
}

// ── Milestones table ──────────────────────────────────────────────────────────

function MilestonesTable({ projectId, locale, canManage, milestones, startTransition }: {
  projectId: string; locale: string; canManage: boolean; milestones: PhdMilestone[];
  startTransition: ReturnType<typeof useTransition>[1];
}) {
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded border border-slate-100">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="px-2 py-1.5 text-left font-medium text-slate-500">№</th>
              <th className="px-2 py-1.5 text-left font-medium text-slate-500">Зміст науково-дослідницької діяльності</th>
              <th className="px-2 py-1.5 text-left font-medium text-slate-500">Термін виконання</th>
              {canManage && <th className="px-2 py-1.5" />}
            </tr>
          </thead>
          <tbody>
            {milestones.map((m, i) =>
              editId === m.mid ? (
                <MilestoneEditRow key={m.mid} projectId={projectId} locale={locale} milestone={m} startTransition={startTransition} onDone={() => setEditId(null)} />
              ) : (
                <tr key={m.mid} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                  <td className="px-2 py-2 text-slate-400">{i + 1}</td>
                  <td className="px-2 py-2 text-slate-800">{m.title}</td>
                  <td className="px-2 py-2 text-slate-600">{m.period}</td>
                  {canManage && (
                    <td className="px-2 py-2">
                      <div className="flex gap-1">
                        <button onClick={() => setEditId(m.mid)} className="rounded p-0.5 text-slate-400 hover:text-blue-600">
                          <Edit3 className="h-3 w-3" />
                        </button>
                        <form action={(fd) => {
                          fd.set("locale", locale); fd.set("projectId", projectId); fd.set("mid", m.mid);
                          startTransition(() => removeMilestone(fd));
                        }}>
                          <input type="hidden" name="locale" value={locale} />
                          <input type="hidden" name="projectId" value={projectId} />
                          <input type="hidden" name="mid" value={m.mid} />
                          <button type="submit" className="rounded p-0.5 text-slate-400 hover:text-rose-600">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </form>
                      </div>
                    </td>
                  )}
                </tr>
              )
            )}
            {milestones.length === 0 && (
              <tr>
                <td colSpan={canManage ? 4 : 3} className="px-2 py-4 text-center text-xs text-slate-400">
                  Пунктів науково-дослідницької діяльності ще немає.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {canManage && !adding && (
        <ActionBtn onClick={() => setAdding(true)}><Plus className="h-3.5 w-3.5" /> Додати пункт</ActionBtn>
      )}
      {adding && (
        <form
          action={(fd) => {
            fd.set("locale", locale); fd.set("projectId", projectId); fd.set("orderIndex", String(milestones.length));
            startTransition(async () => { await addMilestone(fd); setAdding(false); });
          }}
          className="rounded border border-blue-100 bg-blue-50/40 p-3"
        >
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="orderIndex" value={String(milestones.length)} />
          <div className="grid gap-2 sm:grid-cols-2">
            <FormField label="Зміст діяльності">
              <Textarea name="title" rows={2} placeholder="Наприклад: Затвердження теми дисертації" />
            </FormField>
            <FormField label="Термін виконання">
              <Input name="period" placeholder="1-й рік навчання" />
            </FormField>
          </div>
          <div className="mt-2 flex gap-2">
            <ActionBtn type="submit" variant="primary"><Save className="h-3.5 w-3.5" /> Додати</ActionBtn>
            <ActionBtn onClick={() => setAdding(false)}><X className="h-3.5 w-3.5" /> Скасувати</ActionBtn>
          </div>
        </form>
      )}
    </div>
  );
}

function MilestoneEditRow({ projectId, locale, milestone, startTransition, onDone }: {
  projectId: string; locale: string; milestone: PhdMilestone;
  startTransition: ReturnType<typeof useTransition>[1]; onDone: () => void;
}) {
  return (
    <tr>
      <td colSpan={4} className="p-2">
        <form
          action={(fd) => {
            fd.set("locale", locale); fd.set("projectId", projectId); fd.set("mid", milestone.mid);
            startTransition(async () => { await updateMilestone(fd); onDone(); });
          }}
          className="grid gap-2 sm:grid-cols-2"
        >
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="mid" value={milestone.mid} />
          <input type="hidden" name="orderIndex" value={String(milestone.orderIndex)} />
          <FormField label="Зміст діяльності"><Textarea name="title" defaultValue={milestone.title} rows={2} /></FormField>
          <FormField label="Термін виконання"><Input name="period" defaultValue={milestone.period} /></FormField>
          <div className="col-span-full flex gap-2">
            <ActionBtn type="submit" variant="primary"><Save className="h-3.5 w-3.5" /> Зберегти</ActionBtn>
            <ActionBtn onClick={onDone}><X className="h-3.5 w-3.5" /> Скасувати</ActionBtn>
          </div>
        </form>
      </td>
    </tr>
  );
}

// ── Yearly plan tab ───────────────────────────────────────────────────────────

function YearlyPlanTab({ projectId, locale, canManage, year, yearlyPlan, curriculumCourses = [], startTransition }: {
  projectId: string; locale: string; canManage: boolean; year: number;
  yearlyPlan: PhdYearlyPlan | null; curriculumCourses?: PhdCurriculumCourse[];
  startTransition: ReturnType<typeof useTransition>[1];
}) {
  const [showMeta, setShowMeta] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-800">Робочий план {YEAR_LABELS[year - 1]} підготовки</h2>
        {canManage && (
          <ActionBtn onClick={() => setShowMeta(!showMeta)}>
            {showMeta ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            Підписи та рішення
          </ActionBtn>
        )}
      </div>

      <SemesterInfoBar yearlyPlan={yearlyPlan} />

      {showMeta && canManage && (
        <YearlyMetaForm
          projectId={projectId} locale={locale} year={year}
          yearlyPlan={yearlyPlan} startTransition={startTransition}
          onDone={() => setShowMeta(false)}
        />
      )}

      <SectionCard title="І. Освітня складова" icon={BookOpen}>
        <YearlyCoursesTable
          projectId={projectId} locale={locale} canManage={canManage}
          year={year} courses={yearlyPlan?.educationalCourses ?? []}
          curriculumCourses={curriculumCourses}
          semOptions={[
            ...(yearlyPlan?.sem1Start && yearlyPlan?.sem1End ? [{ key: "sem1", label: "Семестр І", from: yearlyPlan.sem1Start, to: yearlyPlan.sem1End }] : []),
            ...(yearlyPlan?.sem2Start && yearlyPlan?.sem2End ? [{ key: "sem2", label: "Семестр ІІ", from: yearlyPlan.sem2Start, to: yearlyPlan.sem2End }] : []),
            ...(yearlyPlan?.sem1Start && yearlyPlan?.sem2End ? [{ key: "academic_year", label: "Академічний рік", from: yearlyPlan.sem1Start, to: yearlyPlan.sem2End }] : []),
          ]}
          startTransition={startTransition}
        />
        {yearlyPlan?.headOfDeptName && (
          <div className="mt-3 text-xs text-slate-500">
            Зав. відділом: <span className="font-medium text-slate-700">{yearlyPlan.headOfDeptName}</span>
            {yearlyPlan.headOfDeptDate && <span className="ml-2 text-slate-400">{yearlyPlan.headOfDeptDate}</span>}
          </div>
        )}
      </SectionCard>

      <SectionCard title="ІІ. Індивідуальний план наукової роботи" icon={FlaskConical}>
        <YearlyScientificTable
          projectId={projectId} locale={locale} canManage={canManage}
          year={year} items={yearlyPlan?.scientificWorkItems ?? []}
          semOptions={[
            ...(yearlyPlan?.sem1Start && yearlyPlan?.sem1End ? [{ key: "sem1", label: "Семестр І", from: yearlyPlan.sem1Start, to: yearlyPlan.sem1End }] : []),
            ...(yearlyPlan?.sem2Start && yearlyPlan?.sem2End ? [{ key: "sem2", label: "Семестр ІІ", from: yearlyPlan.sem2Start, to: yearlyPlan.sem2End }] : []),
            ...(yearlyPlan?.sem1Start && yearlyPlan?.sem2End ? [{ key: "academic_year", label: "Академічний рік", from: yearlyPlan.sem1Start, to: yearlyPlan.sem2End }] : []),
          ]}
          startTransition={startTransition}
        />
      </SectionCard>

      {(yearlyPlan?.supervisorAssessment || yearlyPlan?.committeeDecision) && (
        <SectionCard title="Атестація" icon={Award}>
          <div className="space-y-2 text-xs">
            {yearlyPlan.supervisorAssessment && (
              <div>
                <span className="font-medium text-slate-600">Оцінка наукового керівника: </span>
                <span className="text-slate-800">{yearlyPlan.supervisorAssessment}</span>
              </div>
            )}
            {yearlyPlan.committeeDecision && (
              <div>
                <span className="font-medium text-slate-600">Рішення атестаційної комісії: </span>
                <span className="text-slate-800">{yearlyPlan.committeeDecision}</span>
              </div>
            )}
            {yearlyPlan.committeeChair && (
              <div>
                <span className="font-medium text-slate-600">Голова комісії: </span>
                <span className="text-slate-800">{yearlyPlan.committeeChair}</span>
                {yearlyPlan.committeeDate && <span className="ml-2 text-slate-400">{yearlyPlan.committeeDate}</span>}
              </div>
            )}
          </div>
        </SectionCard>
      )}
    </div>
  );
}

function YearlyMetaForm({ projectId, locale, year, yearlyPlan, startTransition, onDone }: {
  projectId: string; locale: string; year: number; yearlyPlan: PhdYearlyPlan | null;
  startTransition: ReturnType<typeof useTransition>[1]; onDone: () => void;
}) {
  return (
    <form
      action={(fd) => {
        fd.set("locale", locale); fd.set("projectId", projectId); fd.set("year", String(year));
        startTransition(async () => { await saveYearMeta(fd); onDone(); });
      }}
      className="rounded border border-slate-200 bg-slate-50 p-3"
    >
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="year" value={String(year)} />
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField label="Зав. відділом (ПІБ)">
          <Input name="headOfDeptName" defaultValue={yearlyPlan?.headOfDeptName} />
        </FormField>
        <FormField label="Дата підпису зав. відділом">
          <DateInput name="headOfDeptDate" defaultValue={yearlyPlan?.headOfDeptDate} />
        </FormField>
        <FormField label="Оцінка наукового керівника">
          <Input name="supervisorAssessment" defaultValue={yearlyPlan?.supervisorAssessment} placeholder="Виконано / Не виконано" />
        </FormField>
        <FormField label="Рішення атестаційної комісії">
          <Input name="committeeDecision" defaultValue={yearlyPlan?.committeeDecision} />
        </FormField>
        <FormField label="Голова атестаційної комісії (ПІБ)">
          <Input name="committeeChair" defaultValue={yearlyPlan?.committeeChair} />
        </FormField>
        <FormField label="Дата рішення комісії">
          <DateInput name="committeeDate" defaultValue={yearlyPlan?.committeeDate} />
        </FormField>
      </div>
      <div className="mt-2 flex gap-2">
        <ActionBtn type="submit" variant="primary"><Save className="h-3.5 w-3.5" /> Зберегти</ActionBtn>
        <ActionBtn onClick={onDone}><X className="h-3.5 w-3.5" /> Скасувати</ActionBtn>
      </div>
    </form>
  );
}

// ── Yearly courses table ──────────────────────────────────────────────────────

function YearlyCoursesTable({ projectId, locale, canManage, year, courses, curriculumCourses = [], semOptions = [], startTransition }: {
  projectId: string; locale: string; canManage: boolean; year: number; courses: PhdYearlyCourse[];
  curriculumCourses?: PhdCurriculumCourse[];
  semOptions?: SemOption[];
  startTransition: ReturnType<typeof useTransition>[1];
}) {
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const okCourses = courses.filter((c) => c.subgroup === "mandatory");
  const vkCourses = courses.filter((c) => c.subgroup === "elective");

  return (
    <div className="space-y-3">
      {(
        [
          { sub: "mandatory" as PhdSubgroupType, label: "ОК", courses: okCourses, color: "blue" },
          { sub: "elective" as PhdSubgroupType, label: "ВК", courses: vkCourses, color: "violet" },
        ] as const
      ).map(({ sub, label, courses: subCourses, color }) => {
        const isOK = sub === "mandatory";
        if (subCourses.length === 0 && !canManage) return null;
        return (
          <div key={sub} className="overflow-hidden rounded-lg border border-slate-100">
            <div className={clsx(
              "flex items-center gap-2 px-3 py-1.5",
              isOK ? "bg-blue-50/60" : "bg-violet-50/60",
            )}>
              <span className={clsx(
                "rounded px-1.5 py-0.5 text-[10px] font-bold",
                isOK ? "bg-blue-600 text-white" : "bg-violet-600 text-white",
              )}>{label}</span>
              <span className="text-xs font-medium text-slate-600">{SUBGROUP_LABELS[sub]}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-white">
                    <th className="px-2 py-1.5 text-left font-medium text-slate-400">Назва</th>
                    <th className="px-2 py-1.5 text-left font-medium text-slate-400">Форма контролю</th>
                    <th className="px-2 py-1.5 text-left font-medium text-slate-400">Термін</th>
                    <th className="px-2 py-1.5 text-left font-medium text-slate-400">Оцінка</th>
                    <th className="px-2 py-1.5 text-left font-medium text-slate-400">Викладач</th>
                    {canManage && <th className="px-2 py-1.5" />}
                  </tr>
                </thead>
                <tbody>
                  {subCourses.map((course) =>
                    editId === course.ycid ? (
                      <YearlyCourseEditRow
                        key={course.ycid}
                        projectId={projectId} locale={locale} year={year} course={course}
                        semOptions={semOptions}
                        startTransition={startTransition} onDone={() => setEditId(null)}
                      />
                    ) : (
                      <tr key={course.ycid} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                        <td className="px-2 py-1.5 text-slate-800">{course.title}</td>
                        <td className="px-2 py-1.5 text-slate-600">{course.controlForm}</td>
                        <td className="px-2 py-1.5 text-slate-500 tabular-nums">{course.period || "—"}</td>
                        <td className="px-2 py-1.5">
                          {course.grade ? (
                            <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-700">{course.grade}</span>
                          ) : <span className="text-slate-400">—</span>}
                        </td>
                        <td className="px-2 py-1.5 text-slate-600">{course.teacherName || "—"}</td>
                        {canManage && (
                          <td className="px-2 py-1.5">
                            <div className="flex gap-1">
                              <button onClick={() => setEditId(course.ycid)} className="rounded p-0.5 text-slate-400 hover:text-blue-600">
                                <Edit3 className="h-3 w-3" />
                              </button>
                              <form action={(fd) => {
                                fd.set("locale", locale); fd.set("projectId", projectId);
                                fd.set("year", String(year)); fd.set("ycid", course.ycid);
                                startTransition(() => removeYearlyCourse(fd));
                              }}>
                                <input type="hidden" name="locale" value={locale} />
                                <input type="hidden" name="projectId" value={projectId} />
                                <input type="hidden" name="year" value={String(year)} />
                                <input type="hidden" name="ycid" value={course.ycid} />
                                <button type="submit" className="rounded p-0.5 text-slate-400 hover:text-rose-600">
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </form>
                            </div>
                          </td>
                        )}
                      </tr>
                    )
                  )}
                  {subCourses.length === 0 && (
                    <tr>
                      <td colSpan={canManage ? 6 : 5} className="px-2 py-3 text-center text-xs text-slate-400">
                        Дисциплін ще немає.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {canManage && !adding && (
        <ActionBtn onClick={() => setAdding(true)}><Plus className="h-3.5 w-3.5" /> Додати дисципліну</ActionBtn>
      )}
      {adding && (
        <YearlyCoursesAddForm
          projectId={projectId}
          locale={locale}
          year={year}
          curriculumSuggestions={curriculumCourses.filter((c) => c.studyYear === year)}
          semOptions={semOptions}
          startTransition={startTransition}
          onDone={() => setAdding(false)}
        />
      )}
    </div>
  );
}

function YearlyCoursesAddForm({ projectId, locale, year, curriculumSuggestions, semOptions = [], startTransition, onDone }: {
  projectId: string; locale: string; year: number;
  curriculumSuggestions: PhdCurriculumCourse[];
  semOptions?: SemOption[];
  startTransition: ReturnType<typeof useTransition>[1]; onDone: () => void;
}) {
  const [title, setTitle] = useState("");
  const [subgroup, setSubgroup] = useState<PhdSubgroupType>("mandatory");
  const [controlForm, setControlForm] = useState(CONTROL_FORM_OPTIONS[0]?.value ?? "Іспит");
  const [cycle, setCycle] = useState<PhdCycleType>("general");

  const suggestions: CourseSuggestion[] = curriculumSuggestions.map((c) => ({
    title: c.title,
    cycle: c.cycle,
    subgroup: c.subgroup,
    controlForm: c.controlForm,
    credits: c.credits,
    studyYear: c.studyYear,
  }));

  function applyPick(s: CourseSuggestion) {
    setTitle(s.title);
    setSubgroup(s.subgroup);
    setControlForm(s.controlForm || (CONTROL_FORM_OPTIONS[0]?.value ?? "Іспит"));
    setCycle(s.cycle);
  }

  return (
    <form
      action={(fd) => {
        fd.set("locale", locale); fd.set("projectId", projectId); fd.set("year", String(year));
        startTransition(async () => { await addYearlyCourse(fd); onDone(); });
      }}
      className="rounded border border-blue-100 bg-blue-50/40 p-3"
    >
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="year" value={String(year)} />

      <CourseQuickPick suggestions={suggestions} onPick={applyPick} />

      <div className="grid gap-2 sm:grid-cols-3">
        <FormField label="Назва дисципліни">
          <input
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Назва..."
            className={inputCls}
          />
        </FormField>
        <FormField label="Підгрупа">
          <select
            name="subgroup"
            value={subgroup}
            onChange={(e) => setSubgroup(e.target.value as PhdSubgroupType)}
            className={inputCls}
          >
            {Object.entries(SUBGROUP_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </FormField>
        <FormField label="Форма контролю">
          <select
            name="controlForm"
            value={controlForm}
            onChange={(e) => setControlForm(e.target.value)}
            className={inputCls}
          >
            {CONTROL_FORM_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </FormField>
        <FormField label="Термін (від — до)">
          <DateRangeInput name="period" semOptions={semOptions} />
        </FormField>
        <FormField label="Оцінка">
          <Input name="grade" placeholder="Добре/81" />
        </FormField>
        <FormField label="Викладач (ПІБ)">
          <Input name="teacherName" placeholder="Прізвище І.П." />
        </FormField>
        <FormField label="Цикл">
          <select
            name="cycle"
            value={cycle}
            onChange={(e) => setCycle(e.target.value as PhdCycleType)}
            className={inputCls}
          >
            {Object.entries(CYCLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </FormField>
      </div>
      <div className="mt-2 flex gap-2">
        <ActionBtn type="submit" variant="primary"><Save className="h-3.5 w-3.5" /> Додати</ActionBtn>
        <ActionBtn onClick={onDone}><X className="h-3.5 w-3.5" /> Скасувати</ActionBtn>
      </div>
    </form>
  );
}

function YearlyCourseEditRow({ projectId, locale, year, course, semOptions = [], startTransition, onDone }: {
  projectId: string; locale: string; year: number; course: PhdYearlyCourse;
  semOptions?: SemOption[];
  startTransition: ReturnType<typeof useTransition>[1]; onDone: () => void;
}) {
  return (
    <tr>
      <td colSpan={6} className="p-2">
        <form
          action={(fd) => {
            fd.set("locale", locale); fd.set("projectId", projectId);
            fd.set("year", String(year)); fd.set("ycid", course.ycid);
            startTransition(async () => { await updateYearlyCourse(fd); onDone(); });
          }}
          className="grid gap-2 sm:grid-cols-3"
        >
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="year" value={String(year)} />
          <input type="hidden" name="ycid" value={course.ycid} />
          <FormField label="Назва"><Input name="title" defaultValue={course.title} /></FormField>
          <FormField label="Підгрупа">
            <SelectField name="subgroup" defaultValue={course.subgroup} options={Object.entries(SUBGROUP_LABELS).map(([v, l]) => ({ value: v, label: l }))} />
          </FormField>
          <FormField label="Форма контролю">
            <SelectField name="controlForm" defaultValue={course.controlForm} options={CONTROL_FORM_OPTIONS} />
          </FormField>
          <FormField label="Термін (від — до)">
            <DateRangeInput name="period" defaultValue={course.period} defaultTermType={course.termType ?? ""} semOptions={semOptions} />
          </FormField>
          <FormField label="Оцінка"><Input name="grade" defaultValue={course.grade} /></FormField>
          <FormField label="Викладач"><Input name="teacherName" defaultValue={course.teacherName} /></FormField>
          <FormField label="Цикл">
            <SelectField name="cycle" defaultValue={course.cycle} options={Object.entries(CYCLE_LABELS).map(([v, l]) => ({ value: v, label: l }))} />
          </FormField>
          <div className="col-span-full flex gap-2">
            <ActionBtn type="submit" variant="primary"><Save className="h-3.5 w-3.5" /> Зберегти</ActionBtn>
            <ActionBtn onClick={onDone}><X className="h-3.5 w-3.5" /> Скасувати</ActionBtn>
          </div>
        </form>
      </td>
    </tr>
  );
}

// ── Yearly scientific items table ─────────────────────────────────────────────

function YearlyScientificTable({ projectId, locale, canManage, year, items, semOptions = [], startTransition }: {
  projectId: string; locale: string; canManage: boolean; year: number; items: PhdYearlyScientificItem[];
  semOptions?: SemOption[];
  startTransition: ReturnType<typeof useTransition>[1];
}) {
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded border border-slate-100">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="px-2 py-1.5 text-left font-medium text-slate-500">Назва роботи</th>
              <th className="px-2 py-1.5 text-left font-medium text-slate-500">Об'єм і зміст</th>
              <th className="px-2 py-1.5 text-left font-medium text-slate-500">Строк виконання</th>
              <th className="px-2 py-1.5 text-left font-medium text-slate-500">Стан</th>
              <th className="px-2 py-1.5 text-left font-medium text-slate-500">Відмітка керівника</th>
              {canManage && <th className="px-2 py-1.5" />}
            </tr>
          </thead>
          <tbody>
            {items.map((item) =>
              editId === item.wsid ? (
                <ScientificItemEditRow
                  key={item.wsid} projectId={projectId} locale={locale} year={year}
                  item={item} semOptions={semOptions} startTransition={startTransition} onDone={() => setEditId(null)}
                />
              ) : (
                <tr key={item.wsid} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                  <td className="px-2 py-2 text-slate-800">{item.title}</td>
                  <td className="max-w-[180px] px-2 py-2 text-slate-600">{item.content || "—"}</td>
                  <td className="px-2 py-2 text-slate-500 tabular-nums">{item.period || "—"}</td>
                  <td className="px-2 py-2"><StatusBadge status={item.status} /></td>
                  <td className="px-2 py-2 text-slate-600">{item.supervisorNote || "—"}</td>
                  {canManage && (
                    <td className="px-2 py-2">
                      <div className="flex gap-1">
                        <button onClick={() => setEditId(item.wsid)} className="rounded p-0.5 text-slate-400 hover:text-blue-600">
                          <Edit3 className="h-3 w-3" />
                        </button>
                        <form action={(fd) => {
                          fd.set("locale", locale); fd.set("projectId", projectId);
                          fd.set("year", String(year)); fd.set("wsid", item.wsid);
                          startTransition(() => removeYearlyScientificItem(fd));
                        }}>
                          <input type="hidden" name="locale" value={locale} />
                          <input type="hidden" name="projectId" value={projectId} />
                          <input type="hidden" name="year" value={String(year)} />
                          <input type="hidden" name="wsid" value={item.wsid} />
                          <button type="submit" className="rounded p-0.5 text-slate-400 hover:text-rose-600">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </form>
                      </div>
                    </td>
                  )}
                </tr>
              )
            )}
            {items.length === 0 && (
              <tr>
                <td colSpan={canManage ? 6 : 5} className="px-2 py-4 text-center text-xs text-slate-400">
                  Пунктів наукової роботи ще не додано.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {canManage && !adding && (
        <ActionBtn onClick={() => setAdding(true)}><Plus className="h-3.5 w-3.5" /> Додати пункт</ActionBtn>
      )}
      {adding && (
        <form
          action={(fd) => {
            fd.set("locale", locale); fd.set("projectId", projectId);
            fd.set("year", String(year)); fd.set("orderIndex", String(items.length));
            startTransition(async () => { await addYearlyScientificItem(fd); setAdding(false); });
          }}
          className="rounded border border-blue-100 bg-blue-50/40 p-3"
        >
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="year" value={String(year)} />
          <input type="hidden" name="orderIndex" value={String(items.length)} />
          <div className="grid gap-2 sm:grid-cols-2">
            <FormField label="Назва роботи">
              <Input name="title" placeholder="Наприклад: Теоретична робота" />
            </FormField>
            <FormField label="Об'єм і короткий зміст">
              <Textarea name="content" rows={2} placeholder="Короткий зміст роботи..." />
            </FormField>
            <FormField label="Строк виконання (від — до)">
              <DateRangeInput name="period" semOptions={semOptions} />
            </FormField>
            <FormField label="Статус виконання">
              <SelectField name="status" defaultValue="pending" options={Object.entries(WORK_STATUS_LABELS).map(([v, l]) => ({ value: v, label: l }))} />
            </FormField>
            <FormField label="Відмітка наукового керівника">
              <Input name="supervisorNote" placeholder="Виконано / Не виконано..." />
            </FormField>
          </div>
          <div className="mt-2 flex gap-2">
            <ActionBtn type="submit" variant="primary"><Save className="h-3.5 w-3.5" /> Додати</ActionBtn>
            <ActionBtn onClick={() => setAdding(false)}><X className="h-3.5 w-3.5" /> Скасувати</ActionBtn>
          </div>
        </form>
      )}
    </div>
  );
}

function ScientificItemEditRow({ projectId, locale, year, item, semOptions = [], startTransition, onDone }: {
  projectId: string; locale: string; year: number; item: PhdYearlyScientificItem;
  semOptions?: SemOption[];
  startTransition: ReturnType<typeof useTransition>[1]; onDone: () => void;
}) {
  return (
    <tr>
      <td colSpan={6} className="p-2">
        <form
          action={(fd) => {
            fd.set("locale", locale); fd.set("projectId", projectId);
            fd.set("year", String(year)); fd.set("wsid", item.wsid);
            startTransition(async () => { await updateYearlyScientificItem(fd); onDone(); });
          }}
          className="grid gap-2 sm:grid-cols-2"
        >
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="year" value={String(year)} />
          <input type="hidden" name="wsid" value={item.wsid} />
          <input type="hidden" name="orderIndex" value={String(item.orderIndex)} />
          <FormField label="Назва роботи"><Input name="title" defaultValue={item.title} /></FormField>
          <FormField label="Об'єм і зміст"><Textarea name="content" defaultValue={item.content} rows={2} /></FormField>
          <FormField label="Строк виконання (від — до)">
            <DateRangeInput name="period" defaultValue={item.period} defaultTermType={item.termType ?? ""} semOptions={semOptions} />
          </FormField>
          <FormField label="Статус">
            <SelectField name="status" defaultValue={item.status} options={Object.entries(WORK_STATUS_LABELS).map(([v, l]) => ({ value: v, label: l }))} />
          </FormField>
          <FormField label="Відмітка керівника">
            <Input name="supervisorNote" defaultValue={item.supervisorNote} />
          </FormField>
          <div className="col-span-full flex gap-2">
            <ActionBtn type="submit" variant="primary"><Save className="h-3.5 w-3.5" /> Зберегти</ActionBtn>
            <ActionBtn onClick={onDone}><X className="h-3.5 w-3.5" /> Скасувати</ActionBtn>
          </div>
        </form>
      </td>
    </tr>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: PhdWorkStatus }) {
  const Icon = WORK_STATUS_ICONS[status];
  return (
    <span className={clsx("inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium", WORK_STATUS_COLORS[status])}>
      <Icon className="h-2.5 w-2.5" />
      {WORK_STATUS_LABELS[status]}
    </span>
  );
}

// ── Utilities ─────────────────────────────────────────────────────────────────

function toRoman(n: number): string {
  return ["І", "ІІ", "ІІІ", "ІV"][n - 1] ?? String(n);
}
