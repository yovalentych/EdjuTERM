"use server";

import { revalidatePath } from "next/cache";
import { insertProjectRecord } from "@/lib/repositories";
import { projectRecordInputSchema } from "@/lib/schemas";
import { isLocale } from "@/lib/i18n";

export async function createRecord(formData: FormData) {
  const payload = {
    kind: formData.get("kind"),
    localId: formData.get("localId"),
    title: formData.get("title"),
    stage: formData.get("stage"),
    access: formData.get("access"),
    owner: formData.get("owner") || "Unassigned",
    repository: formData.get("repository") || "tbd",
    summary: formData.get("summary") || "",
  };
  const localeValue = formData.get("locale");
  const locale =
    typeof localeValue === "string" && isLocale(localeValue)
      ? localeValue
      : "uk";

  const record = projectRecordInputSchema.parse(payload);
  await insertProjectRecord(record);
  revalidatePath(`/${locale}`);
}
