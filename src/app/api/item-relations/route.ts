import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { listLinkedItems, linkItems, unlinkItems } from "@/lib/item-relations";
import { getItemForUser } from "@/lib/workspaces";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const itemId = url.searchParams.get("itemId");
  if (!itemId) return NextResponse.json({ error: "itemId required" }, { status: 400 });

  const item = await getItemForUser(itemId, user);
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const linked = await listLinkedItems(itemId, user);
  return NextResponse.json({ items: linked });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { itemId, targetId } = await req.json();
  if (!itemId || !targetId) return NextResponse.json({ error: "itemId and targetId required" }, { status: 400 });

  const item = await getItemForUser(itemId, user);
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await linkItems(itemId, targetId, user);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const itemId = url.searchParams.get("itemId");
  const targetId = url.searchParams.get("targetId");
  if (!itemId || !targetId) return NextResponse.json({ error: "itemId and targetId required" }, { status: 400 });

  const item = await getItemForUser(itemId, user);
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await unlinkItems(itemId, targetId);
  return NextResponse.json({ ok: true });
}
