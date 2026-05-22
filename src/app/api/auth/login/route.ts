import { NextResponse } from "next/server";
import { findUserByEmail } from "@/lib/users";
import { verifyPassword } from "@/lib/passwords";
import { createSession, encryptSession } from "@/lib/session";
import { loginInputSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = loginInputSchema.safeParse(body);

    if (!payload.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const user = await findUserByEmail(payload.data.email);

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const isValid = await verifyPassword(payload.data.password, user.passwordHash);

    if (!isValid || !user._id) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    console.log(`[AUTH] Creating session for user: ${user.email}`);
    await createSession(user._id, user.role, true, user.sessionVersion);
    const token = await encryptSession(user._id, user.role, true, user.sessionVersion);

    const { passwordHash, ...safeUser } = user;
    void passwordHash;

    return NextResponse.json({ user: safeUser, token });
  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
