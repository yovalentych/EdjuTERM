import "server-only";
import { getCurrentUser } from "@/lib/current-user";
import { getInstitution } from "@/lib/institutions-db";
import type { Institution, SafeUser } from "@/lib/schemas";

/**
 * Перевіряє що поточний user — представник institution-акаунту і повертає його
 * власну Institution (як owner). Підгризає 401/403 у API-ендпоінтів.
 */
export async function getCurrentInstitution(): Promise<{ user: SafeUser; institution: Institution } | null> {
  const user = await getCurrentUser();
  if (!user || (user as any).accountType !== "institution") return null;
  const institutionId = (user as any).institutionId as string | undefined;
  if (!institutionId) return null;
  const institution = await getInstitution(institutionId);
  if (!institution || institution.deletedAt) return null;
  // Тільки owner може керувати закладом (наразі простий чек, ролі додамо пізніше).
  if (institution.ownerId && institution.ownerId !== user._id) return null;
  return { user, institution };
}
