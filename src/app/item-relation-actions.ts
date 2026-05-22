"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/current-user";
import { linkItems, unlinkItems } from "@/lib/item-relations";
import { getItemForUser } from "@/lib/workspaces";

export async function linkItemsAction(
  itemId: string,
  targetId: string,
  locale: string,
  wsId: string,
): Promise<{ ok: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false };

  const item = await getItemForUser(itemId, user);
  if (!item) return { ok: false };

  await linkItems(itemId, targetId, user);
  revalidatePath(`/${locale}/app/space/${wsId}/items/${itemId}`);
  return { ok: true };
}

export async function unlinkItemsAction(
  itemId: string,
  targetId: string,
  locale: string,
  wsId: string,
): Promise<{ ok: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false };

  const item = await getItemForUser(itemId, user);
  if (!item) return { ok: false };

  await unlinkItems(itemId, targetId);
  revalidatePath(`/${locale}/app/space/${wsId}/items/${itemId}`);
  return { ok: true };
}
