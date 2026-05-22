import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { LiquidAppShell } from "@/components/liquid-app-shell";
import { getCurrentUser } from "@/lib/current-user";
import { getDictionary, isLocale } from "@/lib/i18n";
import { listProjectsForUser } from "@/lib/projects";
import {
  listWorkspacesForUser,
  ensureDefaultWorkspace,
  repairOrphanedItems,
  listItemsForUser,
  syncLegacyProjectsToItems,
} from "@/lib/workspaces";
import { SpaceClient } from "./space-client";
import type { UserAffiliation } from "@/lib/schemas";

export const metadata: Metadata = {
  title: "Простір",
};

export default async function SpacePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ ws?: string }>;
}) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();

  const user = await getCurrentUser();
  if (!user) redirect(`/${localeParam}/login`);

  const dictionary = getDictionary(localeParam);

  // 1. Завантажуємо workspaces — авто-бутстрап default якщо жодного немає
  let workspaces = await listWorkspacesForUser(user);
  if (workspaces.length === 0) {
    const created = await ensureDefaultWorkspace(user);
    workspaces = [created];
  }
  const defaultWs = workspaces.find((w) => w.isDefault) ?? workspaces[0];

  // 2. Repair orphaned items (workspaceIds: [""]) + migrate legacy projects
  if (defaultWs?._id) {
    await repairOrphanedItems(user, defaultWs._id);
    const projects = await listProjectsForUser(user);
    await syncLegacyProjectsToItems(projects, defaultWs._id, user);
  }

  // 3. Обираємо активний workspace з ?ws= або беремо default
  const sp = await searchParams;
  const activeWsId = sp.ws && workspaces.some((w) => w._id === sp.ws) ? sp.ws : defaultWs?._id;

  // 4. Беремо items для активного workspace
  const items = activeWsId ? await listItemsForUser(user, activeWsId) : [];

  // 5. Current affiliation for pre-filling create dialog
  const affiliations = (user as { affiliations?: UserAffiliation[] }).affiliations ?? [];
  const currentAff = affiliations.find((a) => a.isCurrent);
  const currentInstitution = currentAff?.institutionName ?? user.affiliation ?? undefined;

  return (
    <LiquidAppShell dictionary={dictionary} locale={localeParam} user={user}>
      <SpaceClient
        userFirstName={user.firstName}
        userLastName={user.lastName}
        workspaces={workspaces.map((w) => ({
          id: w._id!,
          name: w.name,
          emoji: w.emoji ?? "🏠",
          color: w.color ?? "#0f766e",
          isDefault: w.isDefault,
          itemCount: 0,
        }))}
        activeWorkspaceId={activeWsId ?? ""}
        currentInstitution={currentInstitution}
        items={items.map((it) => ({
          id: it._id!,
          type: it.type,
          title: it.title,
          description: it.description ?? "",
          emoji: it.emoji ?? "",
          status: it.status,
          visibility: it.visibility,
          workspaceIds: it.workspaceIds,
          tags: it.tags,
          legacyProjectId: it.legacyProjectId ?? null,
          supervisor: it.supervisor ?? "",
          ownerName: it.ownerName,
          learningItemId: it.learningItemId ?? null,
          href: it.legacyProjectId
            ? `/${localeParam}/app/project?projectId=${it.legacyProjectId}`
            : `/${localeParam}/app/space/${activeWsId}/items/${it._id}`,
        }))}
        locale={localeParam}
      />
    </LiquidAppShell>
  );
}
