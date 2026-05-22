import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { listEquipmentLogs, insertEquipmentLog } from "@/lib/laboratory";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: equipmentId } = await params;

    const logs = await listEquipmentLogs(equipmentId);
    return NextResponse.json({ logs });
  } catch (error) {
    console.error("Lab Equipment Logs GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !user._id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: equipmentId } = await params;
    const body = await request.json();
    
    const log = await insertEquipmentLog({
      ...body,
      equipmentId,
    }, user._id);

    return NextResponse.json({ log }, { status: 201 });
  } catch (error) {
    console.error("Lab Equipment Logs POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
