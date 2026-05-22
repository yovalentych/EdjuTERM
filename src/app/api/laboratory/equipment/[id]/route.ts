import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { updateEquipment, deleteEquipment } from "@/lib/laboratory";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const equipment = await updateEquipment(id, body);

    if (!equipment) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ equipment });
  } catch (error) {
    console.error("Equipment PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const ok = await deleteEquipment(id);

    if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Equipment DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
