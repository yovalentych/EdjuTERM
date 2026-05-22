import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { listItemsForUser, createItemForUser, itemInputSchema } from "@/lib/workspaces";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const workspaceId = url.searchParams.get("workspaceId") ?? undefined;
  const items = await listItemsForUser(user, workspaceId);
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const input = itemInputSchema.parse(body);
    const item = await createItemForUser(input, user);
    return NextResponse.json({ item });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Invalid input" }, { status: 400 });
  }
}
