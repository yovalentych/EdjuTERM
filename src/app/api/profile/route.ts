import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getCurrentUser } from "@/lib/current-user";
import { updateUserProfile } from "@/lib/users";
import { syncPersonalProfileIdentity } from "@/lib/personal-profile";
import { profileInputSchema } from "@/lib/schemas";

/**
 * PATCH /api/profile — оновлення профілю поточного user.
 */
export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user || !user._id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Нормалізуємо phone — приберемо whitespace.
  if (typeof body?.phone === "string") {
    body.phone = body.phone.replace(/\s+/g, "");
    if (!body.phone) body.phone = undefined;
  }

  let input;
  try {
    input = profileInputSchema.parse({
      firstName:        body.firstName || user.firstName,
      lastName:         body.lastName || user.lastName,
      firstNameLatin:   body.firstNameLatin || undefined,
      lastNameLatin:    body.lastNameLatin || undefined,
      phone:            body.phone || undefined,
      orcid:            body.orcid || undefined,
      position:         body.position || undefined,
      affiliation:      body.affiliation || undefined,
      profileBio:       body.profileBio || undefined,
      defaultSpecialty: body.defaultSpecialty || undefined,
      academicLinks:    body.academicLinks || undefined,
      researchInterests: body.researchInterests || undefined,
    });
  } catch (e: unknown) {
    if (e instanceof ZodError) {
      const issues = e.issues ?? [];
      const msg = issues.length
        ? issues.map((err) => `${err.path.join(".") || "поле"}: ${err.message}`).join("; ")
        : "Помилка валідації";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    return NextResponse.json({ error: e instanceof Error ? e.message : "Invalid input" }, { status: 400 });
  }

  const updated = await updateUserProfile(user._id, input);
  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const personalProfile = await syncPersonalProfileIdentity(updated, {
    ...input,
    links: body.links,
    institutions: body.institutions,
    onboardingCompleted: body.onboardingCompleted,
  }).catch((error) => {
    console.error("[profile api] personal profile sync failed", error);
    return null;
  });
  return NextResponse.json({ user: updated, personalProfile });
}
