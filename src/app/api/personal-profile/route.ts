import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getCurrentUser } from "@/lib/current-user";
import { getPersonalProfile, updatePersonalProfile } from "@/lib/personal-profile";
import { personalProfileInputSchema } from "@/lib/schemas";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !user._id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await getPersonalProfile(user);
  return NextResponse.json({ profile });
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user || !user._id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const input = personalProfileInputSchema.parse(body);
    const profile = await updatePersonalProfile(user, input);
    return NextResponse.json({ profile });
  } catch (error) {
    if (error instanceof ZodError) {
      const message = error.issues
        .map((issue) => `${issue.path.join(".") || "field"}: ${issue.message}`)
        .join("; ");
      return NextResponse.json({ error: message || "Invalid input" }, { status: 400 });
    }
    console.error("[personal-profile api] update failed", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
