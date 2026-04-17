import { NextResponse } from "next/server";
import { getMongoStatus } from "@/lib/mongodb";

export async function GET() {
  const status = await getMongoStatus();

  return NextResponse.json(status, {
    status: status.connected ? 200 : 503,
  });
}
