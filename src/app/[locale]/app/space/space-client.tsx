"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  GraduationCap, FlaskConical, Plus, Pin, Link as LinkIcon,
  BookOpen, Microscope, Lightbulb, ChevronRight, Archive, ChevronDown,
} from "lucide-react";
import {
  LiquidCard, LiquidInfoBubble,
} from "@/components/ui/liquid";
import { SpaceOnboarding } from "@/components/space-onboarding";
import { CreateItemDialog } from "@/components/create-item-dialog";
import type { ItemType, ItemKind } from "@/lib/workspaces-meta";
import { ITEM_TYPE_META, LEARNING_TYPES, PROJECT_TYPES } from "@/lib/workspaces-meta";

export type SpaceWorkspace = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  isDefault: boolean;
  itemCount: number;
};

export type SpaceItem = {
  id: string;
  type: ItemType;
  title: string;
  description: string;
  emoji: string;
  status: string;
  visibility: string;
  workspaceIds: string[];
  tags: string[];
  legacyProjectId: string | null;
  learningItemId: string | null;
  supervisor: string;
  ownerName: string;
  href: string;
};

export function SpaceClient({
  userFirstName,
  workspaces,
  activeWorkspaceId,
  items,
  locale,
  currentInstitution,
}: {
  userFirstName: string;
  userLastName: string;
  workspaces: SpaceWorkspace[];
  activeWorkspaceId: string;
  items: SpaceItem[];
  locale: string;
  currentInstitution?: string;
}) {
  const router = useRouter();
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set());
  const [createOpen, setCreateOpen] = useState(false);
  const [createKind, setCreateKind] = useState<ItemKind | undefined>(undefined);
  const [learningArchiveOpen, setLearningArchiveOpen] = useState(false);

  const learningItems = useMemo(
    () => items.filter((it) => (LEARNING_TYPES as ItemType[]).includes(it.type)),
    [items]
  );
  const activeLearningItems = useMemo(
    () => learningItems.filter((it) => it.status !== "completed" && it.status !== "archived"),
    [learningItems]
  );
  const archivedLearningItems = useMemo(
    () => learningItems.filter((it) => it.status === "completed" || it.status === "archived"),
    [learningItems]
  );
  const projectItems = useMemo(
    () => items.filter((it) => (PROJECT_TYPES as ItemType[]).includes(it.type)),
    [items]
  );

  function openCreate(kind?: ItemKind) {
    setCreateKind(kind);
    setCreateOpen(true);
  }

  function togglePin(id: string) {
    setPinnedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  const isEmpty = items.length === 0;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <SpaceOnboarding />

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="liquid-eyebrow">Привіт, {userFirstName}</span>
          <LiquidInfoBubble
            tint="teal"
            title="Навчання і Проєкти"
            body="Навчання — ваш освітній трек (бакалаврат, магістратура, аспірантура). Проєкти — наукові, творчі та командні активності. Проєкт можна пов'язати з навчанням для спільного workflow."
          />
        </div>
        <button
          onClick={() => openCreate()}
          className="flex items-center gap-1.5 rounded-full bg-teal-600 px-4 py-1.5 text-sm font-bold text-white shadow-sm transition hover:bg-teal-700"
        >
          <Plus className="h-3.5 w-3.5" />
          Новий
        </button>
      </div>

      {/* ── Empty state ── */}
      {isEmpty && (
        <LiquidCard tint="teal" className="text-center">
          <div className="mx-auto mb-3 text-5xl">📋</div>
          <h3 className="text-base font-bold text-slate-900">Розпочніть свій шлях</h3>
          <p className="mt-1 text-sm text-slate-500">
            Додайте навчальний запис або перший проєкт — і ваш простір оживе.
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <button
              onClick={() => openCreate("learning")}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-blue-700"
            >
              <GraduationCap className="h-4 w-4" />
              Навчання
            </button>
            <button
              onClick={() => openCreate("project")}
              className="flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-teal-700"
            >
              <FlaskConical className="h-4 w-4" />
              Проєкт
            </button>
          </div>
        </LiquidCard>
      )}

      {/* ── Two-column layout ── */}
      {!isEmpty && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* ── Навчання ── */}
          <div className="flex flex-col gap-3">
            <ConceptSection
              kind="learning"
              title="Навчання"
              icon={<GraduationCap className="h-4 w-4" />}
              color="#0369a1"
              bgColor="bg-blue-50/60"
              borderColor="border-blue-200/60"
              headerBg="bg-blue-50/40"
              hint="Бакалаврат, Магістратура, Аспірантура"
              items={activeLearningItems}
              pinnedIds={pinnedIds}
              onTogglePin={togglePin}
              onAdd={() => openCreate("learning")}
              projectItems={projectItems}
            />

            {archivedLearningItems.length > 0 && (
              <ArchiveSection
                items={archivedLearningItems}
                pinnedIds={pinnedIds}
                projectItems={projectItems}
                open={learningArchiveOpen}
                onToggleOpen={() => setLearningArchiveOpen((value) => !value)}
                onTogglePin={togglePin}
              />
            )}
          </div>

          {/* ── Проєкти ── */}
          <ConceptSection
            kind="project"
            title="Проєкти"
            icon={<FlaskConical className="h-4 w-4" />}
            color="#0f766e"
            bgColor="bg-teal-50/40"
            borderColor="border-teal-200/60"
            headerBg="bg-teal-50/40"
            hint="Гранти, дослідження, лабораторії"
            items={projectItems}
            pinnedIds={pinnedIds}
            onTogglePin={togglePin}
            onAdd={() => openCreate("project")}
            projectItems={[]}
          />
        </div>
      )}

      <CreateItemDialog
        open={createOpen}
        onClose={() => { setCreateOpen(false); setCreateKind(undefined); }}
        workspaces={workspaces}
        defaultWorkspaceId={activeWorkspaceId}
        defaultKind={createKind}
        learningItems={learningItems.map((it) => ({ id: it.id, title: it.title, type: it.type }))}
        locale={locale}
        activeWorkspaceId={activeWorkspaceId}
        currentInstitution={currentInstitution}
        onCreated={(itemId) => {
          setCreateOpen(false);
          setCreateKind(undefined);
          router.push(`/${locale}/app/space/${activeWorkspaceId}/items/${itemId}`);
        }}
      />
    </div>
  );
}

function ArchiveSection({
  items, pinnedIds, projectItems, open, onToggleOpen, onTogglePin,
}: {
  items: SpaceItem[];
  pinnedIds: Set<string>;
  projectItems: SpaceItem[];
  open: boolean;
  onToggleOpen: () => void;
  onTogglePin: (id: string) => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white/55 shadow-sm">
      <button
        type="button"
        onClick={onToggleOpen}
        className="flex w-full items-center gap-2 px-4 py-3 text-left transition hover:bg-white/70"
      >
        <Archive className="h-4 w-4 text-slate-400" />
        <span className="text-sm font-bold text-slate-700">Архів навчання</span>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500">
          {items.length}
        </span>
        <span className="ml-1 hidden text-[11px] text-slate-400 sm:block">
          завершені етапи
        </span>
        <ChevronDown
          className={`ml-auto h-4 w-4 text-slate-400 transition ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="flex flex-col gap-1 border-t border-slate-200/70 p-3">
          {items.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              isPinned={pinnedIds.has(item.id)}
              onTogglePin={() => onTogglePin(item.id)}
              projectItems={projectItems}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── ConceptSection ──────────────────────────────────────────────────────────

function ConceptSection({
  kind, title, icon, color, bgColor, borderColor, headerBg, hint,
  items, pinnedIds, onTogglePin, onAdd, projectItems,
}: {
  kind: ItemKind;
  title: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  headerBg: string;
  hint: string;
  items: SpaceItem[];
  pinnedIds: Set<string>;
  onTogglePin: (id: string) => void;
  onAdd: () => void;
  projectItems: SpaceItem[];
}) {
  const pinned = items.filter((it) => pinnedIds.has(it.id));
  const rest = items.filter((it) => !pinnedIds.has(it.id));

  return (
    <div className={`overflow-hidden rounded-2xl border ${borderColor} ${bgColor} shadow-sm`}>
      {/* Header */}
      <div className={`flex items-center gap-2 border-b ${borderColor} ${headerBg} px-4 py-3`}>
        <span style={{ color }}>{icon}</span>
        <h2 className="text-sm font-bold text-slate-800">{title}</h2>
        <span className="ml-1 rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-bold text-slate-500 ring-1 ring-slate-200/60">
          {items.length}
        </span>
        <p className="ml-1 hidden text-[11px] text-slate-400 sm:block">{hint}</p>
        <button
          onClick={onAdd}
          className="ml-auto flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold text-white transition"
          style={{ background: color }}
        >
          <Plus className="h-3 w-3" />
          Додати
        </button>
      </div>

      {/* Items */}
      <div className="flex flex-col gap-1 p-3">
        {pinned.length > 0 && (
          <>
            <p className="px-1 text-[9px] font-extrabold uppercase tracking-widest text-slate-400">
              Закріплені
            </p>
            {pinned.map((it) => (
              <ItemCard key={it.id} item={it} isPinned onTogglePin={() => onTogglePin(it.id)} projectItems={projectItems} />
            ))}
            {rest.length > 0 && <div className="my-1 border-t border-slate-200/60" />}
          </>
        )}
        {rest.map((it) => (
          <ItemCard key={it.id} item={it} onTogglePin={() => onTogglePin(it.id)} projectItems={projectItems} />
        ))}
        {items.length === 0 && (
          <EmptySlot kind={kind} onAdd={onAdd} />
        )}
      </div>
    </div>
  );
}

// ── EmptySlot ───────────────────────────────────────────────────────────────

function EmptySlot({ kind, onAdd }: { kind: ItemKind; onAdd: () => void }) {
  const isLearning = kind === "learning";
  return (
    <button
      onClick={onAdd}
      className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-6 text-center transition hover:border-slate-300 hover:bg-white/40"
    >
      {isLearning
        ? <GraduationCap className="h-6 w-6 text-blue-300" />
        : <FlaskConical className="h-6 w-6 text-teal-300" />
      }
      <span className="text-xs text-slate-400">
        {isLearning ? "Додайте освітній запис" : "Додайте перший проєкт"}
      </span>
      <span className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-500">
        <Plus className="h-2.5 w-2.5" />
        {isLearning ? "Навчання" : "Проєкт"}
      </span>
    </button>
  );
}

// ── ItemCard ─────────────────────────────────────────────────────────────────

function ItemCard({
  item, isPinned, onTogglePin, projectItems,
}: {
  item: SpaceItem;
  isPinned?: boolean;
  onTogglePin: () => void;
  projectItems: SpaceItem[];
}) {
  const meta = ITEM_TYPE_META[item.type] ?? {
    label: item.type, emoji: "📄", kind: "project" as ItemKind, category: "personal" as const, color: "#64748b",
  };
  const isShared = item.workspaceIds.length > 1;
  const isLegacy = !!item.legacyProjectId;

  // Count linked projects (for learning items)
  const linkedCount = projectItems.filter((p) => p.learningItemId === item.id).length;

  return (
    <div
      className="group flex items-center gap-3 rounded-xl bg-white/70 px-3 py-2.5 shadow-sm ring-1 ring-slate-200/60 transition hover:bg-white hover:shadow-md"
    >
      <Link href={item.href} className="flex flex-1 items-center gap-3 min-w-0">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xl"
          style={{ backgroundColor: meta.color + "18" }}
        >
          {item.emoji || meta.emoji}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1">
            <span className="truncate text-sm font-bold tracking-tight text-slate-900">{item.title}</span>
            <span
              className="shrink-0 rounded border px-1.5 py-0.5 text-[9px] font-extrabold tracking-wide"
              style={{
                color: meta.color,
                backgroundColor: meta.color + "12",
                borderColor: meta.color + "30",
              }}
            >
              {meta.label}
            </span>
            {isLegacy && (
              <span className="shrink-0 rounded border border-amber-200 bg-amber-50 px-1 py-0.5 text-[8px] font-extrabold uppercase tracking-wider text-amber-600">
                legacy
              </span>
            )}
            {isShared && (
              <span className="flex shrink-0 items-center gap-0.5 rounded border border-violet-200 bg-violet-50 px-1 py-0.5 text-[8px] font-extrabold text-violet-600">
                <LinkIcon className="h-2 w-2" /> {item.workspaceIds.length}
              </span>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-400">
            {item.supervisor && <span className="truncate">{item.supervisor}</span>}
            {item.supervisor && item.tags[0] && <span>·</span>}
            {item.tags[0] && <span className="font-semibold">{item.tags[0]}</span>}
            {linkedCount > 0 && (
              <>
                {(item.supervisor || item.tags[0]) && <span>·</span>}
                <span className="flex items-center gap-0.5 text-blue-500 font-semibold">
                  <FlaskConical className="h-2.5 w-2.5" />
                  {linkedCount} проєкт{linkedCount === 1 ? "" : "и"}
                </span>
              </>
            )}
          </div>
        </div>
        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-300 group-hover:text-slate-400" />
      </Link>
      <button
        type="button"
        onClick={onTogglePin}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-300 hover:bg-slate-100"
        aria-label="Pin"
      >
        <Pin
          className="h-3.5 w-3.5"
          fill={isPinned ? "#d97706" : "none"}
          color={isPinned ? "#d97706" : "currentColor"}
          strokeWidth={1.8}
        />
      </button>
    </div>
  );
}
