import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentInstitution } from "@/lib/institution-guard";
import { updateInstitution } from "@/lib/institutions-db";
import { institutionTypes } from "@/lib/schemas";

const patchSchema = z.object({
  name:         z.string().min(2).max(300).optional(),
  shortName:    z.string().max(40).optional(),
  type:         z.enum(institutionTypes).optional(),
  email:        z.string().email().max(240).optional(),
  country:      z.string().max(80).optional(),
  city:         z.string().max(120).optional(),
  website:      z.string().max(240).optional(),
  description:  z.string().max(2000).optional(),
  contactName:  z.string().max(200).optional(),
  contactPhone: z.string().max(20).optional(),
  accreditation: z.string().max(500).optional(),
});

export async function PATCH(req: Request) {
  const auth = await getCurrentInstitution();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", details: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await updateInstitution(auth.institution._id!, parsed.data);
  if (!updated) return NextResponse.json({ error: "not_found" }, { status: 404 });

  return NextResponse.json({ ok: true, institution: updated });
}
