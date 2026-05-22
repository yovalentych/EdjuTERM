"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, BookOpen, CalendarDays, ClipboardList, LayoutGrid, Pencil, Settings, Users,
  Flag, Milestone, PlayCircle, CheckCircle2, Circle, Medal,
} from "lucide-react";
import { LiquidCard, LiquidStatTile, LiquidTabs } from "@/components/ui/liquid";
import {
  resolveTemplate,
  templateTabIcon,
  templateTabLabel,
  type HubTab as TemplateHubTab,
} from "@/lib/workspace-template-config";
import { WorkspaceSettingsEditor } from "./workspace-settings-editor";
import type { CourseMember } from "@/lib/schemas";

type Item = {
  id: string;
  type: string;
  title: string;
  description: string;
  emoji: string;
  status: string;
  visibility: string;
  legacyProjectId: string | null;
  tags: string[];
  supervisor: string;
  ownerName: string;
  href: string;
  fields?: Record<string, any>;
};

type Workspace = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  template?: string;
  description: string;
  fields?: Record<string, any>;
};

type HubTab = TemplateHubTab;

type TimelineEntry = {
  id: string;
  date: string;
  title: string;
  kind: string;
  itemTitle: string;
  itemType: string;
  color: string;
  status: string;
};

export function WorkspaceHub({
  locale,
  workspace,
  items,
  members,
  timelineEntries = [],
  initialTab,
}: {
  locale: "uk" | "en";
  workspace: Workspace;
  items: Item[];
  members: CourseMember[];
  timelineEntries?: TimelineEntry[];
  initialTab: HubTab;
}) {
  const isUk = locale === "uk";
  const template = resolveTemplate(workspace.template);
  // Якщо переданий initialTab не дозволений шаблоном — fallback на overview.
  const allowedTabs = template.tabs;
  const safeInitial = allowedTabs.includes(initialTab) ? initialTab : (allowedTabs[0] ?? "overview");
  const [tab, setTab] = useState<HubTab>(safeInitial);
  const [editorOpen, setEditorOpen] = useState(false);

  return (
    <div className="space-y-4">
      {/* ── Workspace hero ─────────────────────────────────── */}
      <LiquidCard className="overflow-hidden p-0">
        <div
          className="relative p-6"
          style={{ background: `linear-gradient(135deg, ${workspace.color}22 0%, ${workspace.color}08 100%)` }}
        >
          <Link
            href={`/${locale}/app/space`}
            className="mb-3 inline-flex items-center gap-1 self-start rounded-full bg-white/75 px-3 py-1 text-[11px] font-bold text-slate-600 backdrop-blur hover:bg-white"
          >
            <ArrowLeft className="h-3 w-3" />
            {isUk ? "До просторів" : "All spaces"}
          </Link>

          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-2xl text-4xl"
                style={{ backgroundColor: workspace.color + "26" }}
              >
                {workspace.emoji}
              </div>
              <div>
                <p className="liquid-eyebrow" style={{ color: workspace.color }}>
                  {template.label[isUk ? "uk" : "en"]}
                </p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                  {workspace.name}
                </h1>
                {workspace.description ? (
                  <p className="mt-1 max-w-xl text-sm text-slate-600">{workspace.description}</p>
                ) : (
                  <p className="mt-1 max-w-xl text-sm text-slate-500">
                    {template.description[isUk ? "uk" : "en"]}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden gap-2 sm:flex">
                <LiquidStatTile
                  icon={<LayoutGrid className="h-3.5 w-3.5" />}
                  label={isUk ? "Проєктів" : "Projects"}
                  value={items.length}
                  tint="emerald"
                />
                <LiquidStatTile
                  icon={<Users className="h-3.5 w-3.5" />}
                  label={isUk ? "Учасників" : "Members"}
                  value={members.length}
                  tint="blue"
                />
              </div>
              <button
                type="button"
                onClick={() => setEditorOpen(true)}
                className="liquid-cta"
                style={{ background: workspace.color }}
              >
                <Pencil className="h-4 w-4" />
                {isUk ? "Редагувати" : "Edit"}
              </button>
            </div>
          </div>
        </div>
      </LiquidCard>

      {/* ── Tabs (динамічні, залежать від шаблону) ─────────── */}
      <LiquidTabs<HubTab>
        tint="emerald"
        active={tab}
        onChange={setTab}
        tabs={allowedTabs.map((t) => {
          const Icon = templateTabIcon(t);
          let badge: number | null = null;
          if (t === "overview" || t === "journal") badge = items.length || null;
          else if (t === "members") badge = members.length || null;
          return {
            id: t,
            label: templateTabLabel(t, isUk ? "uk" : "en"),
            icon: <Icon className="h-3.5 w-3.5" />,
            badge,
          };
        })}
      />

      {/* ── Tab content ────────────────────────────────────── */}
      {tab === "overview" && (
        <OverviewTab items={items} locale={locale} workspace={workspace} timelineEntries={timelineEntries} />
      )}
      {tab === "journal" && (
        <JournalTab items={items} members={members} locale={locale} />
      )}
      {tab === "calendar" && (
        <PlaceholderTab
          title={isUk ? "Календар простору" : "Workspace calendar"}
          hint={isUk
            ? "Тут зведений календар: усі сесії з курсів + дедлайни + віхи PhD-плану. Зараз сесії доступні в електронному журналі кожного курсу окремо."
            : "Aggregated calendar across all courses + assessment deadlines + PhD milestones. For now, see per-course schedule in electronic journal."}
        />
      )}
      {tab === "members" && (
        <MembersTab members={members} items={items} locale={locale} />
      )}
      {tab === "thesis" && (
        <WorkspaceFieldsTab workspace={workspace} isUk={isUk} groupId="thesis" />
      )}
      {tab === "dissertation" && (
        <WorkspaceFieldsTab workspace={workspace} isUk={isUk} groupId="dissertation" />
      )}
      {tab === "deliverables" && (
        <WorkspaceFieldsTab workspace={workspace} isUk={isUk} groupId="deliverables" />
      )}
      {tab === "budget" && (
        <WorkspaceFieldsTab workspace={workspace} isUk={isUk} groupId="budget" />
      )}
      {tab === "timeline" && (
        <TimelineTab entries={timelineEntries} isUk={isUk} />
      )}
      {tab === "publications" && (
        <PlaceholderTab
          title={isUk ? "Публікації" : "Publications"}
          hint={isUk
            ? "Список публікацій з DOI, рейтингом, цитуваннями. Інтеграція з ORCID/Scopus — скоро."
            : "Publication list with DOI, ranking, citations. ORCID/Scopus integration — soon."}
        />
      )}
      {tab === "settings" && (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setEditorOpen(true)}
            className="liquid-cta self-start"
            style={{ background: workspace.color }}
          >
            <Pencil className="h-4 w-4" />
            {isUk ? "Редагувати простір" : "Edit workspace"}
          </button>
          <WorkspaceFieldsTab workspace={workspace} isUk={isUk} groupId="settings" />
        </div>
      )}

      {editorOpen && (
        <WorkspaceSettingsEditor
          workspace={workspace}
          locale={locale}
          onClose={() => setEditorOpen(false)}
        />
      )}
    </div>
  );
}

/** Універсальна вкладка для template-specific метаполів workspace. */
function WorkspaceFieldsTab({
  workspace,
  isUk,
  groupId,
}: {
  workspace: Workspace;
  isUk: boolean;
  groupId: string;
}) {
  const template = resolveTemplate(workspace.template);
  const fields = workspace.fields || {};

  // Settings — показуємо ВСІ групи метаполів простору.
  if (groupId === "settings") {
    if (template.fieldGroups.length === 0) {
      return (
        <PlaceholderTab
          title={isUk ? "Налаштування" : "Settings"}
          hint={isUk
            ? "Шаблон без структурованих метаполів. Скоро — редактор назви, іконки, кольору."
            : "Template has no structured fields. Coming soon — name/emoji/color editor."}
        />
      );
    }
    return (
      <div className="space-y-3">
        {template.fieldGroups.map((g, gi) => (
          <FieldGroupCard key={gi} group={g} fields={fields} isUk={isUk} />
        ))}
      </div>
    );
  }

  // Інші tabs — підбираємо релевантну групу за назвою.
  const group = template.fieldGroups.find((g) =>
    g.titleEn.toLowerCase().includes(groupId) ||
    g.fields.some((f) => f.key.toLowerCase().includes(groupId)),
  );
  if (!group) {
    return (
      <PlaceholderTab
        title={titleForTab(groupId, isUk)}
        hint={isUk
          ? "Цей шаблон поки не має полів для цієї секції. Заповніть в Налаштуваннях."
          : "This template doesn't have fields for this section yet. Fill it in Settings."}
      />
    );
  }
  return <FieldGroupCard group={group} fields={fields} isUk={isUk} />;
}

function FieldGroupCard({
  group,
  fields,
  isUk,
}: {
  group: import("@/lib/workspace-template-config").WorkspaceFieldGroup;
  fields: Record<string, any>;
  isUk: boolean;
}) {
  const filled = group.fields.filter((f) => {
    const v = fields[f.key];
    if (v == null) return false;
    if (typeof v === "string") return v.trim().length > 0;
    if (Array.isArray(v)) return v.length > 0;
    return Boolean(v) || typeof v === "number";
  });

  return (
    <LiquidCard tint="emerald" className="p-0 overflow-hidden">
      <div className="border-b border-slate-200/60 bg-gradient-to-br from-emerald-50/60 via-white to-slate-50/60 px-5 py-3.5">
        <span className="liquid-eyebrow">{isUk ? group.titleUk : group.titleEn}</span>
      </div>
      {filled.length === 0 ? (
        <p className="px-5 py-8 text-center text-xs italic text-slate-400">
          {isUk ? "Поля ще не заповнені. Перейдіть у Налаштування простору." : "Fields not yet filled. Go to Settings."}
        </p>
      ) : (
        <div className="divide-y divide-slate-100/70">
          {filled.map((f) => {
            const v = fields[f.key];
            const Icon = f.icon;
            return (
              <div key={f.key} className="flex items-center gap-3 px-5 py-3">
                {Icon && (
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                )}
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  {f.label[isUk ? "uk" : "en"]}
                </span>
                <span className="ml-auto truncate text-right text-sm font-semibold text-slate-900">
                  {Array.isArray(v) ? v.join(", ") : String(v)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </LiquidCard>
  );
}

function titleForTab(t: string, isUk: boolean): string {
  const m: Record<string, [string, string]> = {
    thesis: ["Кваліфікаційна робота", "Qualification paper"],
    dissertation: ["Дисертація", "Dissertation"],
    deliverables: ["Результати", "Deliverables"],
    budget: ["Бюджет", "Budget"],
  };
  return (m[t] ?? [t, t])[isUk ? 0 : 1];
}

// ── Overview ───────────────────────────────────────────────

const STATUS_META: Record<string, { label: [string, string]; bg: string; text: string }> = {
  active:    { label: ["Активні", "Active"],       bg: "bg-emerald-100", text: "text-emerald-700" },
  draft:     { label: ["Чернетки", "Drafts"],      bg: "bg-slate-200",   text: "text-slate-600" },
  paused:    { label: ["Пауза", "Paused"],         bg: "bg-amber-100",   text: "text-amber-700" },
  completed: { label: ["Завершені", "Completed"],  bg: "bg-blue-100",    text: "text-blue-700" },
  archived:  { label: ["Архів", "Archived"],       bg: "bg-slate-100",   text: "text-slate-500" },
};

function OverviewTab({
  items, locale, workspace, timelineEntries = [],
}: {
  items: Item[];
  locale: "uk" | "en";
  workspace: Workspace;
  timelineEntries?: TimelineEntry[];
}) {
  const isUk = locale === "uk";

  if (items.length === 0) {
    return (
      <LiquidCard className="text-center" tint="emerald" accent>
        <h3 className="text-base font-bold text-slate-900">
          {isUk ? "Поки що порожньо" : "Empty space"}
        </h3>
        <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">
          {isUk
            ? `Додайте перший проєкт у простір «${workspace.name}» — лабораторію, дисертацію, курс чи грант.`
            : `Add the first project — laboratory, dissertation, course or grant.`}
        </p>
      </LiquidCard>
    );
  }

  // ── stats ──
  const statusCounts = items.reduce<Record<string, number>>((acc, it) => {
    acc[it.status] = (acc[it.status] ?? 0) + 1;
    return acc;
  }, {});

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = timelineEntries
    .filter((e) => e.date >= today)
    .slice(0, 3);

  return (
    <div className="space-y-4">
      {/* ── Stat pills ── */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(statusCounts).map(([status, count]) => {
          const m = STATUS_META[status];
          if (!m || count === 0) return null;
          return (
            <span key={status} className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold ${m.bg} ${m.text}`}>
              {count}
              <span className="font-medium opacity-80">{m.label[isUk ? 0 : 1]}</span>
            </span>
          );
        })}
      </div>

      {/* ── Nearest deadlines ── */}
      {upcoming.length > 0 && (
        <LiquidCard tint="amber" className="p-4">
          <p className="liquid-eyebrow mb-2">{isUk ? "НАЙБЛИЖЧІ ПОДІЇ" : "UPCOMING EVENTS"}</p>
          <div className="space-y-2">
            {upcoming.map((e) => (
              <div key={e.id} className="flex items-center gap-3">
                <div
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white text-[10px] font-bold"
                  style={{ backgroundColor: e.color }}
                >
                  {e.date.slice(5)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-slate-800">{e.title}</p>
                  <p className="text-[10px] text-slate-400">{e.itemTitle}</p>
                </div>
                <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                  {e.date}
                </span>
              </div>
            ))}
          </div>
        </LiquidCard>
      )}

      {/* ── Items grid ── */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((it) => {
          const sm = STATUS_META[it.status];
          const completion = it.fields?.completion as Record<string, any> | undefined;
          const isCompleted = it.status === "completed" && completion;
          return (
            <Link
              key={it.id}
              href={it.href}
              className={`liquid-card p-5 transition hover:-translate-y-0.5 hover:shadow-md relative overflow-hidden ${isCompleted ? "opacity-90" : ""}`}
              data-liquid-tint={isCompleted ? "blue" : "emerald"}
            >
              {isCompleted && (
                <div className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 shadow-sm">
                  <Medal className="h-3.5 w-3.5 text-amber-600" />
                </div>
              )}
              <div className="flex items-start gap-3">
                <div className="text-3xl">{it.emoji || "📁"}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      {itemTypeLabel(it.type, isUk)}
                    </p>
                    {sm && (
                      <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${sm.bg} ${sm.text}`}>
                        {sm.label[isUk ? 0 : 1]}
                      </span>
                    )}
                  </div>
                  <h3 className="mt-1 text-sm font-bold leading-snug tracking-tight text-slate-900">
                    {it.title}
                  </h3>
                  {isCompleted && completion.degreeTitle && (
                    <p className="mt-0.5 text-xs font-semibold text-blue-600">{completion.degreeTitle}</p>
                  )}
                  {!isCompleted && it.description && (
                    <p className="mt-1 line-clamp-2 text-xs text-slate-500">{it.description}</p>
                  )}
                  {isCompleted && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {completion.institution && (
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[9px] font-bold text-blue-600">
                          {completion.institution}
                        </span>
                      )}
                      {completion.completedAt && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-500">
                          {completion.completedAt}
                        </span>
                      )}
                    </div>
                  )}
                  {!isCompleted && it.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {it.tags.slice(0, 3).map((t) => (
                        <span key={t} className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-600">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ── Journal aggregate ───────────────────────────────────────

function JournalTab({
  items, members, locale,
}: { items: Item[]; members: CourseMember[]; locale: "uk" | "en" }) {
  const isUk = locale === "uk";
  const courseLikeItems = items.filter((i) => i.type === "course" || i.type === "phd" || i.type === "bachelor" || i.type === "master");

  if (courseLikeItems.length === 0) {
    return (
      <PlaceholderTab
        title={isUk ? "Журнал" : "Journal"}
        hint={isUk
          ? "Журнал стає активним коли в просторі є course/phd/bachelor/master проєкти. Додайте їх в Огляді."
          : "Journal activates when the space has course/phd/bachelor/master projects."}
      />
    );
  }

  return (
    <div className="space-y-3">
      <LiquidCard tint="emerald" className="p-4">
        <p className="text-xs text-slate-600">
          {isUk
            ? "Журнал зведений по проєктам цього простору. Відкрийте будь-який курс/PhD для детального gradebook."
            : "Journal aggregated across the space's projects. Open a course/PhD for the detailed gradebook."}
        </p>
      </LiquidCard>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {courseLikeItems.map((it) => {
          const c = members.filter((m) => m.courseId === (it.legacyProjectId || it.id) || true).length; // simplified
          return (
            <Link
              key={it.id}
              href={
                it.legacyProjectId
                  ? `/${locale}/app/learning/hub?projectId=${it.legacyProjectId}`
                  : it.href
              }
              className="liquid-card p-4 transition hover:-translate-y-0.5 hover:shadow-md"
              data-liquid-tint={it.type === "phd" || it.type === "bachelor" || it.type === "master" ? "violet" : "blue"}
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl">{it.emoji || "🎓"}</div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    {itemTypeLabel(it.type, isUk)}
                  </p>
                  <h3 className="truncate text-sm font-bold tracking-tight text-slate-900">{it.title}</h3>
                </div>
                <ClipboardList className="h-4 w-4 shrink-0 text-slate-400" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ── Members aggregate ──────────────────────────────────────

function MembersTab({
  members, items, locale,
}: { members: CourseMember[]; items: Item[]; locale: "uk" | "en" }) {
  const isUk = locale === "uk";

  if (members.length === 0) {
    return (
      <PlaceholderTab
        title={isUk ? "Учасники" : "Members"}
        hint={isUk
          ? "Учасників додають у конкретний курс через електронний журнал. Тут показано зведений список."
          : "Members are added per-course in the electronic journal. This is the aggregated view."}
      />
    );
  }

  // group by courseId → title
  const titleByCourseId = new Map<string, string>();
  for (const it of items) {
    if (it.legacyProjectId) titleByCourseId.set(it.legacyProjectId, it.title);
    titleByCourseId.set(it.id, it.title);
  }

  return (
    <LiquidCard tint="blue" className="overflow-hidden p-0">
      <div className="flex items-center justify-between border-b border-slate-200/60 bg-gradient-to-br from-blue-50/60 via-white to-slate-50/60 px-5 py-3.5">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-blue-600" />
          <h2 className="text-sm font-bold tracking-tight text-slate-900">
            {isUk ? "Усі учасники простору" : "All space members"}
          </h2>
        </div>
        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
          {members.length}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200/60 bg-slate-50/40">
              <Th>{isUk ? "Учасник" : "Member"}</Th>
              <Th>{isUk ? "Курс" : "Course"}</Th>
              <Th>{isUk ? "Email" : "Email"}</Th>
              <Th>{isUk ? "Група" : "Group"}</Th>
              <Th>{isUk ? "Роль" : "Role"}</Th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m._id} className="border-b border-slate-100/70 hover:bg-slate-50/30">
                <td className="px-4 py-2.5 font-bold text-slate-900">{m.fullName}</td>
                <td className="px-4 py-2.5 text-xs text-slate-500">
                  {titleByCourseId.get(m.courseId) || m.courseId.slice(0, 8)}
                </td>
                <td className="px-4 py-2.5 text-xs text-slate-500">{m.email || "—"}</td>
                <td className="px-4 py-2.5 text-xs text-slate-500">{m.group || "—"}</td>
                <td className="px-4 py-2.5">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                    {roleLabel(m.role, isUk)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </LiquidCard>
  );
}

function TimelineTab({ entries, isUk }: { entries: TimelineEntry[]; isUk: boolean }) {
  const today = new Date().toISOString().slice(0, 10);

  if (entries.length === 0) {
    return (
      <LiquidCard tint="teal" className="text-center">
        <CalendarDays className="mx-auto mb-3 h-8 w-8 text-teal-300" />
        <p className="text-sm font-semibold text-slate-600">
          {isUk ? "Хронологія порожня" : "Timeline is empty"}
        </p>
        <p className="mt-1 text-xs text-slate-400">
          {isUk
            ? "Додайте дати старту/завершення до проєктів, або створіть milestone у плануванні."
            : "Add start/end dates to items, or create milestones in planning."}
        </p>
      </LiquidCard>
    );
  }

  const KIND_ICON: Record<string, React.ReactNode> = {
    milestone:  <Flag className="h-3.5 w-3.5" />,
    stage:      <ClipboardList className="h-3.5 w-3.5" />,
    item_start: <PlayCircle className="h-3.5 w-3.5" />,
    item_end:   <CheckCircle2 className="h-3.5 w-3.5" />,
  };
  const KIND_LABEL: Record<string, [string, string]> = {
    milestone:  ["Milestone",      "Milestone"],
    stage:      ["Етап",           "Stage"],
    item_start: ["Старт",          "Start"],
    item_end:   ["Завершення",     "End"],
  };

  const past = entries.filter((e) => e.date < today);
  const upcoming = entries.filter((e) => e.date >= today);

  function Section({ title, items: rows }: { title: string; items: TimelineEntry[] }) {
    if (rows.length === 0) return null;
    return (
      <div className="flex flex-col gap-2">
        <p className="liquid-eyebrow">{title}</p>
        {rows.map((e) => {
          const [lUk, lEn] = KIND_LABEL[e.kind] ?? [e.kind, e.kind];
          const isOverdue = e.date < today && e.status !== "completed" && e.status !== "reported" && e.status !== "reached";
          return (
            <div
              key={e.id}
              className="flex items-center gap-3 rounded-xl border border-slate-200/60 bg-white/80 px-4 py-3 shadow-sm"
            >
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                style={{ backgroundColor: e.color + "18", color: e.color }}
              >
                {KIND_ICON[e.kind] ?? <Circle className="h-3.5 w-3.5" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-bold text-slate-900">{e.title}</p>
                <p className="text-[10px] text-slate-400">
                  {isUk ? lUk : lEn} · {e.itemTitle}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${isOverdue ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-500"}`}>
                  {e.date}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Section title={isUk ? "ЗАПЛАНОВАНО" : "UPCOMING"} items={upcoming} />
      <Section title={isUk ? "МИНУЛЕ" : "PAST"} items={past.slice().reverse().slice(0, 10)} />
    </div>
  );
}

function PlaceholderTab({ title, hint }: { title: string; hint: string }) {
  return (
    <LiquidCard tint="amber" className="text-center">
      <h3 className="text-sm font-bold text-slate-900">{title}</h3>
      <p className="mx-auto mt-1 max-w-xl text-xs leading-relaxed text-slate-500">{hint}</p>
    </LiquidCard>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-2 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
      {children}
    </th>
  );
}

function itemTypeLabel(t: string, isUk: boolean): string {
  const map: Record<string, [string, string]> = {
    bachelor: ["Бакалаврська",     "Bachelor's"],
    master:   ["Магістерська",     "Master's"],
    phd:      ["PhD дисертація",   "PhD dissertation"],
    individual_research: ["Дослідження", "Research"],
    laboratory: ["Лабораторія",     "Laboratory"],
    course:     ["Курс",            "Course"],
    grant:      ["Грант",           "Grant"],
    collaboration: ["Колаборація",  "Collaboration"],
    study_group:   ["Навч. група",  "Study group"],
    seminar:       ["Семінар",      "Seminar"],
    open_science:  ["Open Science", "Open Science"],
    idea:          ["Ідея",         "Idea"],
  };
  return (map[t] ?? [t, t])[isUk ? 0 : 1];
}

function roleLabel(r: string, isUk: boolean): string {
  const map: Record<string, [string, string]> = {
    student: ["Студент",        "Student"],
    auditor: ["Вільний слухач", "Auditor"],
    ta:      ["Асистент",       "TA"],
    guest:   ["Гість",          "Guest"],
  };
  return (map[r] ?? [r, r])[isUk ? 0 : 1];
}
