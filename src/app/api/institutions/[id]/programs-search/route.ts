import { NextResponse } from "next/server";
import { searchPrograms } from "@/lib/institutions-db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? "";
  const programs = await searchPrograms(id, q).catch(() => []);
  return NextResponse.json({ programs });
}
