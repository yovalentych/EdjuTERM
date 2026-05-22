import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { verifyInstitution, getInstitution } from "@/lib/institutions-db";
import { sendEmail, buildVerifiedEmail } from "@/lib/email";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const verified: boolean = body.verified !== false; // default true

  const institution = await getInstitution(id);
  if (!institution) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await verifyInstitution(id, verified);

  if (verified && !institution.isVerified) {
    // Надсилаємо email адміну закладу (за email з запису institution).
    const tpl = buildVerifiedEmail({
      institutionName: institution.name,
      locale: "uk",
    });
    await sendEmail({ to: institution.email, subject: tpl.subject, html: tpl.html, text: tpl.text })
      .catch(() => {});
  }

  return NextResponse.json({ ok: true, isVerified: verified });
}
