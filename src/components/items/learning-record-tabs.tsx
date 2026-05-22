"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpen, FlaskConical, GraduationCap, Target, Award,
  ClipboardList, CalendarDays, Microscope, DollarSign,
  NotebookPen, TrendingUp, CheckCircle2, Circle, Clock,
  ChevronRight, Plus, BarChart3, FileText, Layers,
} from "lucide-react";
import { LiquidCard } from "@/components/ui/liquid";

type LearningType = "bachelor" | "master" | "phd";

type TypeInfo = {
  uk: string; en: string; color: string;
  sciLabel: { uk: string; en: string };
};

// Serializable data passed from server
type LearningData = {
  courses: any[];
  modules: any[];
  topics: any[];
  assessments: any[];
  sessions: any[];
  assignments: any[];
  stats: {
    totalCredits: number;
    completedCourses: number;
    avgScore: number | null;
    attendancePct: number | null;
    totalCourses: number;
  };
  phdPlan: any | null;
  earnedCredits: number;
  targetCredits: number;
};

type ScienceData = {
  stages: any[];
  tasks: any[];
  milestones: any[];
  experiments: any[];
  budgetPeriods: any[];
  stats: {
    stageCount: number;
    completedStages: number;
    taskCount: number;
    activeTasks: number;
    doneTasks: number;
    milestonesCount: number;
    experimentsCount: number;
    hasBudget: boolean;
  };
  phdPlan: any | null;
  supervisor?: string | null;
  fields: Record<string, any>;
};

export function LearningRecordTabs({
  itemId, dataId, learningType, locale, wsId, learningData, scienceData, typeInfo,
}: {
  itemId: string;
  dataId: string;
  learningType: LearningType;
  locale: string;
  wsId: string;
  learningData: LearningData;
  scienceData: ScienceData;
  typeInfo: TypeInfo;
}) {
  const [activeTab, setActiveTab] = useState<"learning" | "science">("learning");
  const isUk = locale === "uk";
  const color = typeInfo.color;

  const sciLabel = isUk ? typeInfo.sciLabel.uk : typeInfo.sciLabel.en;

  return (
    <div className="flex flex-col gap-4">
      {/* Tab switcher */}
      <div className="flex overflow-hidden rounded-2xl border border-slate-200/70 bg-white/60 p-1 shadow-sm backdrop-blur">
        <TabBtn
          active={activeTab === "learning"}
          onClick={() => setActiveTab("learning")}
          icon={<BookOpen className="h-4 w-4" />}
          label={isUk ? "Навчальна складова" : "Academic Track"}
          color="#0369a1"
        />
        {learningType === "phd" && (
          <TopLevelLinkTab
            href={`/${locale}/app/space/${wsId}/items/${itemId}/plan`}
            icon={<GraduationCap className="h-4 w-4" />}
            label={isUk ? "Загальний план" : "General Plan"}
          />
        )}
        <TabBtn
          active={activeTab === "science"}
          onClick={() => setActiveTab("science")}
          icon={<FlaskConical className="h-4 w-4" />}
          label={sciLabel}
          color={color}
        />
      </div>

      {/* ── Навчальна складова ── */}
      {activeTab === "learning" && (
        <LearningSection
          learningType={learningType}
          locale={locale}
          wsId={wsId}
          itemId={itemId}
          dataId={dataId}
          data={learningData}
        />
      )}

      {/* ── Наукова складова ── */}
      {activeTab === "science" && (
        <ScienceSection
          learningType={learningType}
          locale={locale}
          wsId={wsId}
          itemId={itemId}
          dataId={dataId}
          data={scienceData}
          typeInfo={typeInfo}
        />
      )}
    </div>
  );
}

// ── Tab button ────────────────────────────────────────────────────────────────

function TabBtn({ active, onClick, icon, label, color }: {
  active: boolean; onClick: () => void;
  icon: React.ReactNode; label: string; color: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
        active ? "text-white shadow-sm" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
      }`}
      style={active ? { background: color } : {}}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function TopLevelLinkTab({ href, icon, label }: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </Link>
  );
}

// ── LEARNING SECTION ──────────────────────────────────────────────────────────

function LearningSection({ learningType, locale, wsId, itemId, dataId, data }: {
  learningType: LearningType;
  locale: string;
  wsId: string;
  itemId: string;
  dataId: string;
  data: LearningData;
}) {
  const isUk = locale === "uk";
  const { stats, courses, phdPlan, earnedCredits, targetCredits } = data;

  return (
    <div className="flex flex-col gap-4">
      {/* Stats strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={<BookOpen className="h-4 w-4" />}
          label={isUk ? "Курсів" : "Courses"}
          value={stats.totalCourses}
          sub={`${stats.completedCourses} ${isUk ? "завершено" : "done"}`}
          color="#0369a1"
        />
        <StatCard
          icon={<Award className="h-4 w-4" />}
          label={isUk ? "Середній бал" : "Avg. Score"}
          value={stats.avgScore !== null ? `${stats.avgScore}%` : "—"}
          sub={isUk ? "з оцінених" : "from graded"}
          color="#059669"
        />
        <StatCard
          icon={<CalendarDays className="h-4 w-4" />}
          label={isUk ? "Відвідуваність" : "Attendance"}
          value={stats.attendancePct !== null ? `${stats.attendancePct}%` : "—"}
          sub={isUk ? "від занять" : "of sessions"}
          color="#0891b2"
        />
        <StatCard
          icon={<Layers className="h-4 w-4" />}
          label={isUk ? "Кредити" : "Credits"}
          value={stats.totalCredits}
          sub={isUk ? "ЄКТС накопичено" : "ECTS accumulated"}
          color="#7c3aed"
        />
      </div>

      {/* Courses list */}
      <SectionCard
        title={isUk ? "Навчальні курси" : "Courses"}
        icon={<BookOpen className="h-4 w-4" />}
        color="#0369a1"
        action={
          <Link
            href={`/${locale}/app/space/${wsId}/items/${itemId}/learning?tab=courses`}
            className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700"
          >
            {isUk ? "Усі курси" : "All courses"}
            <ChevronRight className="h-3 w-3" />
          </Link>
        }
      >
        {courses.length === 0 ? (
          <EmptySlot
            label={isUk ? "Курсів ще немає" : "No courses yet"}
            hint={isUk ? "Додайте перший курс — оцінки, теми, відвідуваність" : "Add your first course with grades and attendance"}
            actionLabel={isUk ? "Додати курс" : "Add course"}
            href={`/${locale}/app/space/${wsId}/items/${itemId}/learning?tab=courses&action=create`}
            color="#0369a1"
          />
        ) : (
          <div className="flex flex-col gap-1">
            {courses.slice(0, 5).map((c: any) => (
              <CourseRow key={c._id} course={c} isUk={isUk} />
            ))}
            {courses.length > 5 && (
              <Link
                href={`/${locale}/app/space/${wsId}/items/${itemId}/learning?tab=courses`}
                className="mt-1 text-center text-[11px] font-bold text-blue-500 hover:text-blue-700"
              >
                + {courses.length - 5} {isUk ? "ще" : "more"}
              </Link>
            )}
          </div>
        )}
      </SectionCard>

      {/* PhD curriculum — only for phd */}
      {learningType === "phd" && phdPlan && (
        <SectionCard
          title={isUk ? "Загальний план аспірантури" : "General PhD Plan"}
          icon={<GraduationCap className="h-4 w-4" />}
          color="#7c3aed"
          action={
            <Link
              href={`/${locale}/app/space/${wsId}/items/${itemId}/plan`}
              className="flex items-center gap-1 text-[11px] font-bold text-violet-600 hover:text-violet-700"
            >
              {isUk ? "Повний план" : "Full plan"}
              <ChevronRight className="h-3 w-3" />
            </Link>
          }
        >
          <div className="flex flex-col gap-2">
            {/* Credit progress bar */}
            <div>
              <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
                <span className="font-semibold">{isUk ? "Кредити" : "Credits"}</span>
                <span className="font-bold">{earnedCredits} / {targetCredits}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-violet-500 transition-all"
                  style={{ width: `${Math.min(100, (earnedCredits / targetCredits) * 100)}%` }}
                />
              </div>
            </div>
            {phdPlan.dissertationTitle && (
              <p className="text-xs text-slate-500">
                <span className="font-semibold text-slate-700">{isUk ? "Тема дисертації:" : "Dissertation:"}</span>{" "}
                {phdPlan.dissertationTitle}
              </p>
            )}
          </div>
        </SectionCard>
      )}

      {/* PhD with no plan yet */}
      {learningType === "phd" && !phdPlan && (
        <EmptyCard
          title={isUk ? "Загальний план аспірантури" : "General PhD Plan"}
          icon={<GraduationCap className="h-5 w-5" />}
          color="#7c3aed"
          hint={isUk ? "Заповніть навчальний план, наукову роботу, терміни і звіти аспіранта" : "Fill in curriculum, research work, deadlines and reports"}
          actionLabel={isUk ? "Відкрити план" : "Open plan"}
          href={`/${locale}/app/space/${wsId}/items/${itemId}/plan`}
        />
      )}
    </div>
  );
}

// ── SCIENCE SECTION ───────────────────────────────────────────────────────────

function ScienceSection({ learningType, locale, wsId, itemId, dataId, data, typeInfo }: {
  learningType: LearningType;
  locale: string;
  wsId: string;
  itemId: string;
  dataId: string;
  data: ScienceData;
  typeInfo: TypeInfo;
}) {
  const isUk = locale === "uk";
  const { stages, tasks, milestones, experiments, budgetPeriods, stats, phdPlan, supervisor, fields } = data;
  const color = typeInfo.color;

  const activeTasks = tasks.filter((t: any) => t.status !== "done" && t.status !== "archived" && t.status !== "cancelled");
  const doneTasks = tasks.filter((t: any) => t.status === "done");

  return (
    <div className="flex flex-col gap-4">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={<ClipboardList className="h-4 w-4" />}
          label={isUk ? "Етапи" : "Stages"}
          value={`${stats.completedStages}/${stats.stageCount}`}
          sub={isUk ? "виконано" : "completed"}
          color={color}
        />
        <StatCard
          icon={<Target className="h-4 w-4" />}
          label={isUk ? "Задачі" : "Tasks"}
          value={stats.activeTasks}
          sub={`${stats.doneTasks} ${isUk ? "завершено" : "done"}`}
          color="#d97706"
        />
        <StatCard
          icon={<CalendarDays className="h-4 w-4" />}
          label={isUk ? "Мілстоуни" : "Milestones"}
          value={stats.milestonesCount}
          sub={isUk ? "всього" : "total"}
          color="#0891b2"
        />
        {learningType === "phd" ? (
          <StatCard
            icon={<Microscope className="h-4 w-4" />}
            label={isUk ? "Експерименти" : "Experiments"}
            value={stats.experimentsCount}
            sub={isUk ? "всього" : "total"}
            color="#7c3aed"
          />
        ) : (
          <StatCard
            icon={<FileText className="h-4 w-4" />}
            label={isUk ? "Матеріали" : "Materials"}
            value={"—"}
            sub={isUk ? "готується" : "coming soon"}
            color="#64748b"
          />
        )}
      </div>

      {/* Thesis / Dissertation info card */}
      <SectionCard
        title={isUk ? typeInfo.sciLabel.uk : typeInfo.sciLabel.en}
        icon={learningType === "phd" ? <GraduationCap className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
        color={color}
      >
        {learningType === "phd" && phdPlan ? (
          <div className="flex flex-col gap-2 text-sm">
            {phdPlan.dissertationTitle && (
              <InfoRow label={isUk ? "Тема" : "Title"} value={phdPlan.dissertationTitle} />
            )}
            {phdPlan.specialty && (
              <InfoRow label={isUk ? "Спеціальність" : "Specialty"} value={phdPlan.specialty} />
            )}
            {phdPlan.supervisor && (
              <InfoRow label={isUk ? "Науковий керівник" : "Supervisor"} value={`${phdPlan.supervisor}${phdPlan.supervisorTitle ? `, ${phdPlan.supervisorTitle}` : ""}`} />
            )}
            {phdPlan.institution && (
              <InfoRow label={isUk ? "Установа" : "Institution"} value={phdPlan.institution} />
            )}
            {phdPlan.department && (
              <InfoRow label={isUk ? "Відділ/Кафедра" : "Department"} value={phdPlan.department} />
            )}
            <Link
              href={`/${locale}/app/space/${wsId}/items/${itemId}/plan`}
              className="mt-1 flex items-center gap-1.5 self-start rounded-lg bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-700 hover:bg-violet-100"
            >
              <GraduationCap className="h-3 w-3" />
              {isUk ? "Відкрити загальний план" : "Open general plan"}
            </Link>
          </div>
        ) : learningType === "phd" && !phdPlan ? (
          <EmptySlot
            label={isUk ? "План ще не заповнено" : "Plan not filled yet"}
            hint={isUk ? "Заповніть тему дисертації, керівника та план роботи" : "Add dissertation title, supervisor and work plan"}
            actionLabel={isUk ? "Заповнити план" : "Fill plan"}
            href={`/${locale}/app/space/${wsId}/items/${itemId}/plan`}
            color={color}
          />
        ) : (() => {
            const hasAny = fields?.programName || fields?.university || fields?.abstract
              || fields?.thesisTopic || fields?.defenseDate || fields?.faculty || supervisor;
            return hasAny ? (
              <div className="flex flex-col gap-2 text-sm">
                {fields?.university && <InfoRow label={isUk ? "Університет" : "University"} value={String(fields.university)} />}
                {fields?.faculty && <InfoRow label={isUk ? "Факультет" : "Faculty"} value={String(fields.faculty)} />}
                {fields?.programName && <InfoRow label={isUk ? "Програма" : "Program"} value={String(fields.programName)} />}
                {supervisor && <InfoRow label={isUk ? "Науковий керівник" : "Supervisor"} value={String(supervisor)} />}
                {fields?.thesisTopic && (
                  <div className="mt-0.5 rounded-lg border border-slate-200/60 bg-slate-50/60 px-3 py-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                      {isUk ? "Тема роботи" : "Thesis topic"}
                    </p>
                    <p className="text-xs font-medium text-slate-700">«{String(fields.thesisTopic)}»</p>
                  </div>
                )}
                {fields?.defenseDate && <InfoRow label={isUk ? "Дата захисту" : "Defense date"} value={String(fields.defenseDate)} />}
                {fields?.abstract && (
                  <div className="mt-1 rounded-lg bg-slate-50 p-3">
                    <p className="text-xs text-slate-500 line-clamp-3">{String(fields.abstract)}</p>
                  </div>
                )}
                <Link
                  href={`/${locale}/app/space/${wsId}/items/${itemId}`}
                  className="mt-1 flex items-center gap-1.5 self-start rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100"
                >
                  <FileText className="h-3 w-3" />
                  {isUk ? "Редагувати деталі" : "Edit details"}
                </Link>
              </div>
            ) : (
              <EmptySlot
                label={isUk ? "Деталей ще немає" : "No details yet"}
                hint={isUk ? "Відкрийте редактор і заповніть деталі у розділі «Деталі типу»" : "Open the editor and fill in the fields under 'Type-specific fields'"}
                actionLabel={isUk ? "Редагувати" : "Edit"}
                href={`/${locale}/app/space/${wsId}/items/${itemId}`}
                color={color}
              />
            );
          })()}
      </SectionCard>

      {/* Research stages / timeline */}
      <SectionCard
        title={isUk ? "Планування й етапи дослідження" : "Research Stages & Planning"}
        icon={<ClipboardList className="h-4 w-4" />}
        color="#059669"
        action={
          <Link
            href={`/${locale}/app/space/${wsId}/items/${itemId}/science?tab=stages`}
            className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700"
          >
            {isUk ? "Всі етапи" : "All stages"}
            <ChevronRight className="h-3 w-3" />
          </Link>
        }
      >
        {stages.length === 0 ? (
          <EmptySlot
            label={isUk ? "Етапів ще немає" : "No stages yet"}
            hint={isUk ? "Розбийте дослідження на етапи з дедлайнами та індикаторами" : "Break your research into stages with deadlines and indicators"}
            actionLabel={isUk ? "Додати етап" : "Add stage"}
            href={`/${locale}/app/space/${wsId}/items/${itemId}/science?tab=stages`}
            color="#059669"
          />
        ) : (
          <div className="flex flex-col gap-1.5">
            {stages.slice(0, 4).map((s: any, i: number) => (
              <StageRow key={s._id} stage={s} index={i + 1} isUk={isUk} />
            ))}
          </div>
        )}
      </SectionCard>

      {/* Tasks */}
      <SectionCard
        title={isUk ? "Задачі" : "Tasks"}
        icon={<Target className="h-4 w-4" />}
        color="#d97706"
        action={
          <Link
            href={`/${locale}/app/space/${wsId}/items/${itemId}/science?tab=tasks`}
            className="flex items-center gap-1 text-[11px] font-bold text-amber-600 hover:text-amber-700"
          >
            {isUk ? "Дошка задач" : "Task board"}
            <ChevronRight className="h-3 w-3" />
          </Link>
        }
      >
        {tasks.length === 0 ? (
          <EmptySlot
            label={isUk ? "Задач ще немає" : "No tasks yet"}
            hint={isUk ? "Додайте задачі для відстеження прогресу дослідження" : "Add tasks to track your research progress"}
            actionLabel={isUk ? "Додати задачу" : "Add task"}
            href={`/${locale}/app/space/${wsId}/items/${itemId}/science?tab=tasks`}
            color="#d97706"
          />
        ) : (
          <div className="flex flex-col gap-1">
            {activeTasks.slice(0, 4).map((t: any) => (
              <TaskRow key={t._id} task={t} isUk={isUk} />
            ))}
            {activeTasks.length > 4 && (
              <p className="text-center text-[11px] font-bold text-amber-500">
                +{activeTasks.length - 4} {isUk ? "активних" : "active"}
              </p>
            )}
          </div>
        )}
      </SectionCard>

      {/* PhD-specific: Experiments */}
      {learningType === "phd" && (
        <SectionCard
          title={isUk ? "Експерименти" : "Experiments"}
          icon={<Microscope className="h-4 w-4" />}
          color="#7c3aed"
          action={
            <Link
              href={`/${locale}/app/space/${wsId}/items/${itemId}/science?tab=experiments`}
              className="flex items-center gap-1 text-[11px] font-bold text-violet-600"
            >
              {isUk ? "Всі" : "All"}
              <ChevronRight className="h-3 w-3" />
            </Link>
          }
        >
          {experiments.length === 0 ? (
            <EmptySlot
              label={isUk ? "Експериментів ще немає" : "No experiments yet"}
              hint={isUk ? "Додайте лабораторні та польові експерименти" : "Add lab and field experiments"}
              actionLabel={isUk ? "Новий експеримент" : "New experiment"}
              href={`/${locale}/app/space/${wsId}/items/${itemId}/science?tab=experiments`}
              color="#7c3aed"
            />
          ) : (
            <div className="flex flex-col gap-1">
              {experiments.slice(0, 3).map((e: any) => (
                <div key={e._id} className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-slate-50">
                  <span className="text-sm text-slate-700 font-medium">{e.title}</span>
                  <ExperimentStatusPill status={e.status} isUk={isUk} />
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      )}

      {/* Budget */}
      {(learningType === "phd" || stats.hasBudget) && (
        <SectionCard
          title={isUk ? "Бюджет" : "Budget"}
          icon={<DollarSign className="h-4 w-4" />}
          color="#0f766e"
          action={
            <Link
              href={`/${locale}/app/space/${wsId}/items/${itemId}/science?tab=budget`}
              className="flex items-center gap-1 text-[11px] font-bold text-teal-600"
            >
              {isUk ? "Деталі" : "Details"}
              <ChevronRight className="h-3 w-3" />
            </Link>
          }
        >
          {budgetPeriods.length === 0 ? (
            <EmptySlot
              label={isUk ? "Бюджет не заповнено" : "No budget yet"}
              hint={isUk ? "Додайте бюджетні статті, якщо передбачено фінансування" : "Add budget lines if funding is available"}
              actionLabel={isUk ? "Додати бюджет" : "Add budget"}
              href={`/${locale}/app/space/${wsId}/items/${itemId}/science?tab=budget`}
              color="#0f766e"
            />
          ) : (
            <div className="flex flex-col gap-1">
              {budgetPeriods.slice(0, 2).map((p: any) => (
                <div key={p._id} className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-slate-50">
                  <span className="text-sm font-medium text-slate-700">{p.title}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${p.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                    {p.status === "active" ? (isUk ? "Активний" : "Active") : (isUk ? "Закрито" : "Closed")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionCard({ title, icon, color, children, action }: {
  title: string; icon: React.ReactNode; color: string;
  children: React.ReactNode; action?: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white/80 shadow-sm">
      <div
        className="flex items-center gap-2 border-b border-slate-100/80 px-4 py-3"
        style={{ background: `linear-gradient(135deg, ${color}10, transparent)` }}
      >
        <span style={{ color }}>{icon}</span>
        <h3 className="text-sm font-bold text-slate-800">{title}</h3>
        {action && <div className="ml-auto">{action}</div>}
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}

function StatCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; color: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-slate-200/60 bg-white/80 p-4 shadow-sm">
      <span style={{ color }} className="mb-0.5">{icon}</span>
      <span className="text-lg font-bold text-slate-900">{value}</span>
      <span className="text-[11px] font-semibold text-slate-500">{label}</span>
      {sub && <span className="text-[10px] text-slate-400">{sub}</span>}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <span className="min-w-[100px] shrink-0 text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
      <span className="text-slate-700">{value}</span>
    </div>
  );
}

function EmptySlot({ label, hint, actionLabel, href, color }: {
  label: string; hint: string; actionLabel: string; href: string; color: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl py-5 text-center">
      <p className="text-sm font-semibold text-slate-600">{label}</p>
      <p className="max-w-xs text-[11px] text-slate-400">{hint}</p>
      <Link
        href={href}
        className="mt-1 flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold text-white transition"
        style={{ background: color }}
      >
        <Plus className="h-3 w-3" />
        {actionLabel}
      </Link>
    </div>
  );
}

function EmptyCard({ title, icon, color, hint, actionLabel, href }: {
  title: string; icon: React.ReactNode; color: string; hint: string; actionLabel: string; href: string;
}) {
  return (
    <div
      className="flex items-center gap-4 overflow-hidden rounded-2xl border px-5 py-4"
      style={{ borderColor: color + "30", backgroundColor: color + "08" }}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: color + "18", color }}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-800">{title}</p>
        <p className="text-[11px] text-slate-500">{hint}</p>
      </div>
      <Link
        href={href}
        className="shrink-0 rounded-full px-4 py-1.5 text-xs font-bold text-white"
        style={{ background: color }}
      >
        {actionLabel}
      </Link>
    </div>
  );
}

function CourseRow({ course, isUk }: { course: any; isUk: boolean }) {
  const statusColors: Record<string, string> = {
    completed: "bg-emerald-100 text-emerald-700",
    active:    "bg-blue-100 text-blue-700",
    planned:   "bg-slate-100 text-slate-500",
    failed:    "bg-rose-100 text-rose-700",
    withdrawn: "bg-amber-100 text-amber-700",
  };
  const statusLabels: Record<string, [string, string]> = {
    completed: ["Завершено",  "Done"],
    active:    ["Активний",   "Active"],
    planned:   ["Запланован", "Planned"],
    failed:    ["Незараховано","Failed"],
    withdrawn: ["Відрахований","Withdrawn"],
  };
  const [labelUk, labelEn] = statusLabels[course.status] ?? [course.status, course.status];
  const cls = statusColors[course.status] ?? "bg-slate-100 text-slate-500";

  return (
    <div className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-slate-50">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-xs font-bold text-blue-700">
        {course.credits || 0}
      </div>
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-semibold text-slate-800">{course.title}</p>
        <p className="text-[10px] text-slate-400">
          {isUk ? `${course.semester || 1} сем.` : `Sem. ${course.semester || 1}`}
          {course.instructor ? ` · ${course.instructor}` : ""}
        </p>
      </div>
      {course.finalScore !== null && course.finalScore !== undefined && (
        <span className="text-sm font-bold text-slate-700">{course.finalScore}</span>
      )}
      <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${cls}`}>
        {isUk ? labelUk : labelEn}
      </span>
    </div>
  );
}

function StageRow({ stage, index, isUk }: { stage: any; index: number; isUk: boolean }) {
  const statusMap: Record<string, { color: string; icon: React.ReactNode }> = {
    planned:   { color: "#64748b", icon: <Circle className="h-3 w-3" /> },
    active:    { color: "#0369a1", icon: <Clock className="h-3 w-3" /> },
    completed: { color: "#059669", icon: <CheckCircle2 className="h-3 w-3" /> },
    reported:  { color: "#7c3aed", icon: <CheckCircle2 className="h-3 w-3" /> },
  };
  const { color, icon } = statusMap[stage.status] ?? statusMap.planned;

  return (
    <div className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-slate-50">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold" style={{ backgroundColor: color + "15", color }}>
        {index}
      </div>
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-semibold text-slate-800">{stage.title}</p>
        {stage.endDate && (
          <p className="text-[10px] text-slate-400">
            {isUk ? "до" : "until"} {stage.endDate}
          </p>
        )}
      </div>
      <span style={{ color }}>{icon}</span>
    </div>
  );
}

function TaskRow({ task, isUk }: { task: any; isUk: boolean }) {
  const priorityColors: Record<string, string> = {
    critical: "#dc2626",
    high:     "#d97706",
    medium:   "#0369a1",
    low:      "#64748b",
  };
  const priorityLabels: Record<string, [string, string]> = {
    critical: ["Критично", "Critical"],
    high:     ["Високий",  "High"],
    medium:   ["Середній", "Medium"],
    low:      ["Низький",  "Low"],
  };
  const color = priorityColors[task.priority] ?? "#64748b";
  const [uk, en] = priorityLabels[task.priority] ?? [task.priority, task.priority];

  return (
    <div className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-slate-50">
      <Circle className="h-3.5 w-3.5 shrink-0 text-slate-300" />
      <p className="flex-1 truncate text-sm text-slate-700">{task.title}</p>
      {task.dueDate && (
        <span className="text-[10px] text-slate-400">{task.dueDate}</span>
      )}
      <span className="rounded-full px-2 py-0.5 text-[9px] font-bold" style={{ backgroundColor: color + "15", color }}>
        {isUk ? uk : en}
      </span>
    </div>
  );
}

function ExperimentStatusPill({ status, isUk }: { status: string; isUk: boolean }) {
  const map: Record<string, [string, string, string]> = {
    planned:   ["bg-slate-100 text-slate-500",   "Заплан.",   "Planned"],
    running:   ["bg-blue-100 text-blue-700",      "Запущено",  "Running"],
    completed: ["bg-emerald-100 text-emerald-700","Завершено", "Done"],
    failed:    ["bg-rose-100 text-rose-700",      "Невдача",   "Failed"],
    on_hold:   ["bg-amber-100 text-amber-700",    "На паузі",  "On hold"],
  };
  const [cls, uk, en] = map[status] ?? ["bg-slate-100 text-slate-500", status, status];
  return <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${cls}`}>{isUk ? uk : en}</span>;
}
