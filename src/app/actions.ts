"use server";

import { revalidatePath } from "next/cache";
import { insertProjectRecord } from "@/lib/repositories";
import { projectRecordInputSchema } from "@/lib/schemas";

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

  const record = projectRecordInputSchema.parse(payload);
  await insertProjectRecord(record);
  revalidatePath("/");
}
