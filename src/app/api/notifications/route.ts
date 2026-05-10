import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import {
  countUnreadNotifications,
  listNotificationsForUser,
  markNotificationsRead,
} from "@/lib/notifications";
import { assertRateLimit, RateLimitError } from "@/lib/rate-limit";

export async function GET() {
  const user = await getCurrentUser();
  if (!user?._id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [notifications, unread] = await Promise.all([
    listNotificationsForUser(user._id),
    countUnreadNotifications(user._id),
  ]);

  return NextResponse.json({ notifications, unread });
}

export async function PATCH(request: Request) {
  try {
    await assertRateLimit("api:notifications:write", { limit: 120, windowMs: 60 * 1000 });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json(
        { error: "Rate limited" },
        { status: 429, headers: { "retry-after": String(error.retryAfterSeconds) } },
      );
    }
    throw error;
  }

  const user = await getCurrentUser();
  if (!user?._id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const ids: string[] | undefined = Array.isArray(body.ids) ? body.ids : undefined;

  await markNotificationsRead(user._id, ids);

  return NextResponse.json({ ok: true });
}
