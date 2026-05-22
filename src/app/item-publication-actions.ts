"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/current-user";
import {
  createPublication,
  listPublications,
  updatePublication,
  deletePublication,
} from "@/lib/research-publications";

export async function addItemPublicationAction(
  projectId: string,
  data: { title: string; doi?: string; authors?: string; journal?: string; url?: string; type?: string; status?: string; expectedYear?: number | null },
  locale: string,
  wsId: string,
  itemId: string,
): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Unauthorized" };

  await createPublication(
    {
      projectId,
      title: data.title,
      doi: data.doi,
      authors: data.authors,
      journal: data.journal,
      url: data.url,
      type: data.type ?? "article",
      status: (data.status as any) ?? "planned",
      expectedYear: data.expectedYear ?? null,
      createdBy: user._id ?? "",
    },
    user,
  );

  revalidatePath(`/${locale}/app/space/${wsId}/items/${itemId}`);
  return { ok: true };
}

export async function deleteItemPublicationAction(
  pubId: string,
  locale: string,
  wsId: string,
  itemId: string,
): Promise<{ ok: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false };

  await deletePublication(pubId);
  revalidatePath(`/${locale}/app/space/${wsId}/items/${itemId}`);
  return { ok: true };
}

export async function updateItemPublicationStatusAction(
  pubId: string,
  status: string,
  locale: string,
  wsId: string,
  itemId: string,
): Promise<{ ok: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false };

  await updatePublication(pubId, { status: status as any });
  revalidatePath(`/${locale}/app/space/${wsId}/items/${itemId}`);
  return { ok: true };
}
