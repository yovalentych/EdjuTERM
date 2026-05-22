import { NextResponse } from "next/server";
import { createUser } from "@/lib/users";
import { createSession, encryptSession } from "@/lib/session";
import { registerInputSchema } from "@/lib/schemas";
import { sendVerificationEmailForUser } from "@/lib/auth-email";
import { createPersonalProfileForUser } from "@/lib/personal-profile";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = registerInputSchema.safeParse({
      email: typeof body.email === "string" ? body.email.trim().toLowerCase() : body.email,
      password: body.password,
      firstName: typeof body.firstName === "string" ? body.firstName.trim() : body.firstName,
      lastName: typeof body.lastName === "string" ? body.lastName.trim() : body.lastName,
      firstNameLatin: typeof body.firstNameLatin === "string" ? body.firstNameLatin.trim() : body.firstNameLatin,
      lastNameLatin: typeof body.lastNameLatin === "string" ? body.lastNameLatin.trim() : body.lastNameLatin,
      phone: typeof body.phone === "string" ? body.phone.replace(/\s+/g, "") : body.phone,
    });

    if (!payload.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const user = await createUser(payload.data);
    await createPersonalProfileForUser(user).catch((error) => {
      console.error("[register api] personal profile bootstrap failed", error);
    });

    await sendVerificationEmailForUser(user, {
      locale: typeof body.locale === "string" ? body.locale : "uk",
      request,
    }).catch((error) => {
      console.error("[register api] verification email failed", error);
    });

    await createSession(user._id!, user.role, true, user.sessionVersion);
    const token = await encryptSession(user._id!, user.role, true, user.sessionVersion);

    return NextResponse.json({ user, token }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "USER_EXISTS") {
      return NextResponse.json({ error: "User already exists" }, { status: 409 });
    }

    console.error("Register API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
