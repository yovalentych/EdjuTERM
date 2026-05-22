import { NextResponse } from "next/server";
import { z } from "zod";
import { findMemberByInviteToken, acceptMemberInvite } from "@/lib/institutions-db";
import { findUserByEmail, createUser } from "@/lib/users";
import { createSession } from "@/lib/session";

const acceptSchema = z.object({
  token:     z.string().min(1),
  memberId:  z.string().min(1),
  firstName: z.string().min(1).max(100),
  lastName:  z.string().min(1).max(100),
  email:     z.string().email(),
  password:  z.string().min(8).max(100),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = acceptSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const { token, memberId, firstName, lastName, email, password } = parsed.data;

  // Verify token still valid.
  const member = await findMemberByInviteToken(token).catch(() => null);
  if (!member || member._id !== memberId) {
    return NextResponse.json({ error: "invalid_token" }, { status: 400 });
  }
  if (member.inviteStatus === "accepted") {
    return NextResponse.json({ error: "already_accepted" }, { status: 409 });
  }
  if (member.inviteTokenExpires && new Date(member.inviteTokenExpires) < new Date()) {
    return NextResponse.json({ error: "token_expired" }, { status: 410 });
  }

  // Check email uniqueness.
  const existing = await findUserByEmail(email).catch(() => null);
  if (existing) {
    return NextResponse.json({ error: "email_taken" }, { status: 409 });
  }

  // Create personal user (accountType = "personal", but institutionId set).
  const user = await createUser({
    email,
    password,
    firstName,
    lastName,
    firstNameLatin: "",
    lastNameLatin: "",
  });

  // Accept invite — links member.userId.
  await acceptMemberInvite(memberId, user._id!);

  // Create session so user is immediately logged in.
  await createSession(user._id!, user.role, true, user.sessionVersion ?? 1);

  return NextResponse.json({ ok: true });
}
