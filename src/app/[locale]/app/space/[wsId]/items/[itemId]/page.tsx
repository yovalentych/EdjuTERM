import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Flag, Globe, User, UserCheck } from "lucide-react";
import { LiquidAppShell } from "@/components/liquid-app-shell";
import { LiquidCard } from "@/components/ui/liquid";
import { getCurrentUser } from "@/lib/current-user";
import { getDictionary, isLocale } from "@/lib/i18n";
import { listItemsForUser, listWorkspacesForUser } from "@/lib/workspaces";
import { ITEM_TYPE_META, LEARNING_TYPES, type ItemType } from "@/lib/workspaces-meta";
import { ItemDetailBlock } from "@/components/items/item-detail-block";
import { ItemEditButton } from "@/components/items/item-edit-button";
import { ItemDetailClient } from "./item-detail-client";
import { LearningRecordView } from "@/components/items/learning-record-view";
import { listLinkedItems } from "@/lib/item-relations";
import { LinkedItemsBlock } from "@/components/items/linked-items-block";
import { ItemMembersPanel } from "@/components/items/item-members-panel";
import { listPublications } from "@/lib/research-publications";
import { ItemPublicationsBlock } from "@/components/items/item-publications-block";
import { listItemFiles } from "@/lib/item-files";
import { ItemFilesBlock } from "@/components/items/item-files-block";

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ locale: string; wsId: string; itemId: string }>;
}) {
  const { locale: localeParam, wsId, itemId } = await params;
  if (!isLocale(localeParam)) notFound();

  const user = await getCurrentUser();
  if (!user) redirect(`/${localeParam}/login`);

  const dictionary = getDictionary(localeParam);

  const [allItems, workspaces, linkedItems] = await Promise.all([
    listItemsForUser(user),
    listWorkspacesForUser(user),
    listLinkedItems(itemId, user).catch(() => []),
  ]);

  const item = allItems.find((i) => i._id === itemId);

  if (!item) {
    return (
      <LiquidAppShell dictionary={dictionary} locale={localeParam} user={user}>
        <LiquidCard className="text-center">
          <h2 className="text-base font-bold text-slate-900">Проєкт не знайдено</h2>
          <Link href={`/${localeParam}/app/space/${wsId}`} className="liquid-pill mt-3 inline-flex">
            <ArrowLeft className="h-3 w-3" />
            Назад до Простору
          </Link>
        </LiquidCard>
      </LiquidAppShell>
    );
  }

  const meta = ITEM_TYPE_META[item.type as ItemType];
  const itemWorkspaces = workspaces.filter((w) => item.workspaceIds.includes(w._id ?? ""));
  const isLearning = LEARNING_TYPES.includes(item.type as ItemType);

  const itemWorkspace = workspaces.find((w) => w._id === wsId);
  const wsUniversity = (itemWorkspace as any)?.fields?.university as string | undefined;

  const pubProjectId = item.legacyProjectId ?? item._id!;
  const [publications, itemFilesList] = await Promise.all([
    listPublications(pubProjectId).catch(() => []),
    listItemFiles(item._id!).catch(() => []),
  ]);

  return (
    <LiquidAppShell dictionary={dictionary} locale={localeParam} user={user}>
      {/* Back row */}
      <Link
        href={`/${localeParam}/app/space/${wsId}`}
        className="inline-flex items-center gap-1.5 self-start rounded-full bg-white/75 px-3 py-1.5 text-xs font-bold backdrop-blur transition hover:bg-white"
        style={{ color: meta.color }}
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Простір
      </Link>

      {isLearning ? (
        /* ── Learning record: two-section layout ── */
        <LearningRecordView item={item} locale={localeParam} wsId={wsId} wsUniversity={wsUniversity} />
      ) : (
        /* ── Generic project layout ── */
        <>
          {/* Hero */}
          <LiquidCard className="overflow-hidden p-0" glow={false}>
            <div
              className="relative p-6"
              style={{ background: `linear-gradient(135deg, ${meta.color}20 0%, ${meta.color}06 100%)` }}
            >
              <div className="flex items-start justify-between">
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-xl text-3xl"
                  style={{ backgroundColor: meta.color + "20" }}
                >
                  {item.emoji || meta.emoji}
                </div>
                <ItemEditButton
                  item={{
                    _id: item._id,
                    type: item.type,
                    title: item.title,
                    description: item.description,
                    emoji: item.emoji,
                    status: item.status,
                    visibility: item.visibility,
                    supervisor: item.supervisor,
                    startDate: item.startDate,
                    plannedEndDate: item.plannedEndDate,
                    tags: item.tags,
                    fields: item.fields as Record<string, any>,
                  }}
                  locale={localeParam as "uk" | "en"}
                  label="Редагувати"
                  accentColor={meta.color}
                />
              </div>
              <p className="mt-4 liquid-eyebrow" style={{ color: meta.color }}>{meta.label}</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{item.title}</h1>
              {item.description && <p className="mt-2 text-sm text-slate-600">{item.description}</p>}
              <div className="mt-4 flex flex-wrap gap-2">
                <StatusPill status={item.status} />
                <span className="flex items-center gap-1 rounded-full bg-white/70 px-3 py-1 text-[11px] font-semibold text-slate-600">
                  <Globe className="h-3 w-3" />
                  {visLabel(item.visibility)}
                </span>
              </div>
            </div>
          </LiquidCard>

          {/* Overview */}
          <LiquidCard tint="teal">
            <h2 className="liquid-eyebrow">ОГЛЯД</h2>
            <div className="mt-3 flex flex-col gap-2">
              {item.supervisor && <DetailRow icon={<User />} label="Науковий керівник" value={item.supervisor} />}
              {item.startDate && <DetailRow icon={<Calendar />} label="Старт" value={item.startDate} />}
              {item.plannedEndDate && <DetailRow icon={<Flag />} label="Плановане завершення" value={item.plannedEndDate} />}
              <DetailRow icon={<UserCheck />} label="Власник" value={item.ownerName} />
              {item.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {item.tags.map((tag) => (
                    <span key={tag} className="rounded-md bg-teal-50 px-2 py-1 text-[11px] font-bold text-teal-700">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </LiquidCard>

          {/* Members */}
          <LiquidCard tint="blue">
            <ItemMembersPanel
              itemId={item._id!}
              wsId={wsId}
              locale={localeParam}
              initialMembers={(item as any).members ?? []}
              ownerName={item.ownerName}
            />
          </LiquidCard>

          {/* Type-specific deep UI */}
          <ItemDetailBlock item={item} locale={localeParam} wsId={wsId} />

          {/* Workspaces */}
          <ItemDetailClient
            itemId={item._id!}
            currentWorkspaceIds={item.workspaceIds}
            allWorkspaces={workspaces.map((w) => ({
              id: w._id!,
              name: w.name,
              emoji: w.emoji ?? "🏠",
              color: w.color ?? "#0f766e",
              isDefault: w.isDefault,
            }))}
          />

          {/* Publications */}
          <LiquidCard tint="blue">
            <ItemPublicationsBlock
              projectId={pubProjectId}
              itemId={item._id!}
              wsId={wsId}
              locale={localeParam}
              initialPubs={publications.map((p) => ({
                _id: p._id,
                title: p.title,
                authors: p.authors,
                doi: p.doi,
                journal: p.journal,
                url: p.url,
                type: p.type,
                status: p.status,
                expectedYear: p.expectedYear ?? null,
              }))}
            />
          </LiquidCard>

          {/* Files */}
          <LiquidCard>
            <ItemFilesBlock
              itemId={item._id!}
              initialFiles={itemFilesList.map((f) => ({
                _id: f._id,
                name: f.name,
                mimeType: f.mimeType,
                bytes: f.bytes,
                uploadedAt: f.uploadedAt,
              }))}
            />
          </LiquidCard>

          {/* Linked items */}
          <LiquidCard tint="violet">
            <LinkedItemsBlock
              itemId={item._id!}
              wsId={wsId}
              locale={localeParam}
              linkedItems={linkedItems.map((li) => ({
                id: li._id!,
                type: li.type,
                title: li.title,
                emoji: li.emoji,
                status: li.status,
                workspaceIds: li.workspaceIds,
              }))}
              allItems={allItems
                .filter((i) => i._id && i._id !== item._id)
                .map((i) => ({
                  id: i._id!,
                  type: i.type,
                  title: i.title,
                  emoji: i.emoji,
                  status: i.status,
                  workspaceIds: i.workspaceIds,
                }))}
            />
          </LiquidCard>
        </>
      )}
    </LiquidAppShell>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 border-b border-slate-100/80 pb-2 last:border-0 last:pb-0">
      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-slate-500 [&>svg]:h-3.5 [&>svg]:w-3.5">
        {icon}
      </span>
      <span className="text-xs text-slate-500">{label}</span>
      <span className="ml-auto truncate text-xs font-bold text-slate-900">{value}</span>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const colors: Record<string, [string, string]> = {
    active:    ["bg-emerald-100", "text-emerald-700"],
    draft:     ["bg-slate-200",   "text-slate-600"],
    paused:    ["bg-amber-100",   "text-amber-700"],
    completed: ["bg-blue-100",    "text-blue-700"],
    archived:  ["bg-slate-100",   "text-slate-500"],
  };
  const labels: Record<string, string> = {
    active: "Активний", draft: "Чернетка", paused: "Пауза", completed: "Завершено", archived: "Архів",
  };
  const [bg, text] = colors[status] ?? ["bg-slate-100", "text-slate-600"];
  return (
    <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${bg} ${text}`}>
      {labels[status] ?? status}
    </span>
  );
}

function visLabel(v: string): string {
  switch (v) {
    case "private":       return "Приватний";
    case "institutional": return "Інституційний";
    case "public":        return "Публічний";
    default: return v;
  }
}
