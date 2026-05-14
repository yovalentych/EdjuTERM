import { NextResponse } from "next/server";
import { findUserByEmail } from "@/lib/users";
import { verifyPassword } from "@/lib/passwords";
import { createSession } from "@/lib/session";
import { loginInputSchema } from "@/lib/schemas";

function corsHeaders(request: Request) {
  const origin = request.headers.get("origin") || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
  };
}

export async function OPTIONS(request: Request) {
  return NextResponse.json({}, { headers: corsHeaders(request) });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = loginInputSchema.safeParse(body);

    if (!payload.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400, headers: corsHeaders(request) });
    }

    const user = await findUserByEmail(payload.data.email);

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401, headers: corsHeaders(request) });
    }

    const isValid = await verifyPassword(payload.data.password, user.passwordHash);

    if (!isValid || !user._id) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401, headers: corsHeaders(request) });
    }

    await createSession(user._id, user.role, true, user.sessionVersion);

    const { passwordHash, ...safeUser } = user;
    void passwordHash;

    return NextResponse.json({ user: safeUser }, { headers: corsHeaders(request) });
  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: corsHeaders(request) });
  }
}
