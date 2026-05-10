import { NextResponse } from "next/server";
import { getInstitutions, searchInstitutions } from "@/lib/institutions";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  if (q.length < 2) return NextResponse.json({ results: [] });

  const all = await getInstitutions();
  const results = searchInstitutions(all, q);
  return NextResponse.json(
    { results },
    { headers: { "Cache-Control": "public, max-age=120, stale-while-revalidate=600" } },
  );
}
