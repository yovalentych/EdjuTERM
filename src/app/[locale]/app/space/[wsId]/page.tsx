import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LiquidAppShell } from "@/components/liquid-app-shell";
import { LiquidCard } from "@/components/ui/liquid";
import { WorkspaceHub } from "@/components/space/workspace-hub";
import { getCurrentUser } from "@/lib/current-user";
import { getDictionary, isLocale } from "@/lib/i18n";
import { listItemsForUser, listWorkspacesForUser } from "@/lib/workspaces";
import { listProjectMembers } from "@/lib/learning";
import { listMilestones } from "@/lib/planning";
import { listResearchStages } from "@/lib/research-plan";
import { ITEM_TYPE_META, type ItemType } from "@/lib/workspaces-meta";

/**
 * Workspace Hub — hub-сторінка одного простору з вкладками:
 *   • Огляд (Items grid)
 *   • Журнал (наскрізна gradebook для всіх курсів простору)
 *   • Календар (сесії + дедлайни)
 *   • Учасники (всі члени з усіх курсів)
 *   • Налаштування
 */
export default async function WorkspaceHubPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; wsId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { locale: localeParam, wsId } = await params;
  if (!isLocale(localeParam)) notFound();

  const user = await getCurrentUser();
  if (!user) redirect(`/${localeParam}/login`);

  const { tab } = await searchParams;
  const dictionary = getDictionary(localeParam);

  const [workspaces, items] = await Promise.all([
    listWorkspacesForUser(user),
    listItemsForUser(user, wsId),
  ]);
  const ws = workspaces.find((w) => w._id === wsId);

  if (!ws) {
    return (
      <LiquidAppShell dictionary={dictionary} locale={localeParam} user={user}>
        <LiquidCard className="text-center">
          <h2 className="text-base font-bold text-slate-900">Простір не знайдено</h2>
          <Link
            href={`/${localeParam}/app/space`}
            className="liquid-pill mt-3 inline-flex"
          >
            <ArrowLeft className="h-3 w-3" />
            До списку просторів
          </Link>
        </LiquidCard>
      </LiquidAppShell>
    );
  }

  // Учасники з курсів
  const courseItemIds = items
    .filter((i) => i.type === "course" || i.type === "phd")
    .map((i) => i.legacyProjectId || i._id)
    .filter(Boolean) as string[];
  const membersByProject = await Promise.all(
    courseItemIds.map((pid) => listProjectMembers(pid).catch(() => [])),
  );
  const allMembers = membersByProject.flat();

  // Timeline: milestones + stages для всіх items простору (max перші 5 items)
  const dataIds = items.slice(0, 5).map((i) => ({ id: i.legacyProjectId || i._id!, type: i.type, title: i.title }));
  const [milestonesAll, stagesAll] = await Promise.all([
    Promise.all(dataIds.map((d) => listMilestones(d.id).catch(() => []))),
    Promise.all(dataIds.map((d) => listResearchStages(d.id).catch(() => []))),
  ]);
  type TimelineEntry = { id: string; date: string; title: string; kind: string; itemTitle: string; itemType: string; color: string; status: string };
  const timelineEntries: TimelineEntry[] = [];
  dataIds.forEach(({ id, type, title }, idx) => {
    const color = ITEM_TYPE_META[type as ItemType]?.color ?? "#64748b";
    milestonesAll[idx].forEach((m: any) => {
      if (m.dueDate) timelineEntries.push({ id: m._id, date: m.dueDate, title: m.title, kind: "milestone", itemTitle: title, itemType: type, color, status: m.status ?? "pending" });
    });
    stagesAll[idx].forEach((s: any) => {
      if (s.endDate) timelineEntries.push({ id: s._id, date: s.endDate, title: s.title, kind: "stage", itemTitle: title, itemType: type, color, status: s.status ?? "planned" });
    });
    // Item dates
    const item = items[idx];
    if (item.startDate) timelineEntries.push({ id: `${id}_start`, date: item.startDate, title: `Початок: ${title}`, kind: "item_start", itemTitle: title, itemType: type, color, status: item.status });
    if (item.plannedEndDate) timelineEntries.push({ id: `${id}_end`, date: item.plannedEndDate, title: `Завершення: ${title}`, kind: "item_end", itemTitle: title, itemType: type, color, status: item.status });
  });
  timelineEntries.sort((a, b) => a.date.localeCompare(b.date));

  return (
    <LiquidAppShell dictionary={dictionary} locale={localeParam} user={user}>
      <WorkspaceHub
        locale={localeParam}
        workspace={{
          id: ws._id!,
          name: ws.name,
          emoji: ws.emoji || "🏠",
          color: ws.color || "#0f766e",
          template: ws.template,
          description: ws.description || "",
          fields: (ws as any).fields || {},
        }}
        items={items.map((it) => ({
          id: it._id!,
          type: it.type,
          title: it.title,
          description: it.description ?? "",
          emoji: it.emoji ?? "",
          status: it.status,
          visibility: it.visibility,
          legacyProjectId: it.legacyProjectId ?? null,
          tags: it.tags,
          supervisor: it.supervisor ?? "",
          ownerName: it.ownerName,
          fields: (it.fields as Record<string, any>) ?? {},
          href: it.legacyProjectId
            ? `/${localeParam}/app/project?projectId=${it.legacyProjectId}`
            : `/${localeParam}/app/space/${wsId}/items/${it._id}`,
        }))}
        members={allMembers}
        timelineEntries={timelineEntries}
        initialTab={(tab as any) ?? "overview"}
      />
    </LiquidAppShell>
  );
}
