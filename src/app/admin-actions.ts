"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/current-user";
import { updateAiSystemSettings } from "@/lib/system-settings";

export async function saveAiSystemSettings(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return { ok: false, error: "forbidden" };

  const locale = (formData.get("locale") as string) || "uk";
  const openAiSyllabusModel = formData.get("openAiSyllabusModel") as string;
  const settings = await updateAiSystemSettings({ openAiSyllabusModel });

  revalidatePath(`/${locale}/app/admin`);
  return { ok: true, settings };
}
