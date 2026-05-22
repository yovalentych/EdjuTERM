"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/current-user";
import { addMemberByEmail, removeMember } from "@/lib/item-members";

export async function addItemMemberAction(
  itemId: string,
  email: string,
  role: string,
  locale: string,
  wsId: string,
): Promise<{ ok: boolean; error?: string; userName?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Unauthorized" };

  const result = await addMemberByEmail(itemId, email, role, user);
  if (!result.ok) return { ok: false, error: result.error };

  revalidatePath(`/${locale}/app/space/${wsId}/items/${itemId}`);
  return { ok: true, userName: result.member?.userName };
}

export async function removeItemMemberAction(
  itemId: string,
  userId: string,
  locale: string,
  wsId: string,
): Promise<{ ok: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false };

  const result = await removeMember(itemId, userId, user);
  if (!result.ok) return { ok: false };

  revalidatePath(`/${locale}/app/space/${wsId}/items/${itemId}`);
  return { ok: true };
}
