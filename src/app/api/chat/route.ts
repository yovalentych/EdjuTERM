import { type NextRequest, NextResponse } from "next/server";
import { getChatMessages } from "@/lib/chat";
import { getCurrentUser } from "@/lib/current-user";
import { getProjectForUser } from "@/lib/projects";
import { assertRateLimit, RateLimitError } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  try {
    await assertRateLimit("api:chat:read", { limit: 120, windowMs: 60 * 1000 });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json(
        { error: "rate_limited" },
        { status: 429, headers: { "retry-after": String(error.retryAfterSeconds) } },
      );
    }
    throw error;
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const projectId = searchParams.get("projectId");
  const after = searchParams.get("after") ?? undefined;

  if (!projectId) {
    return NextResponse.json({ error: "missing projectId" }, { status: 400 });
  }

  const project = await getProjectForUser(projectId, user);
  if (!project?._id) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const messages = await getChatMessages(projectId, 60, after);
  return NextResponse.json({ messages });
}
