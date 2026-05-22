import { NextResponse } from "next/server";
import { listUnits, getCommunityUnits } from "@/lib/institutions-db";

/**
 * Autocomplete підрозділів для конкретної інституції.
 * Повертає union офіційних (адмін-доданих) та community одиниць.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").toLowerCase().trim();

  const [units, communityNames] = await Promise.all([
    listUnits(id).catch(() => []),
    getCommunityUnits(id).catch(() => []),
  ]);

  const officialNames = units.map((u) => ({ id: u._id!, name: u.name, isOfficial: true }));
  const officialNameSet = new Set(officialNames.map((u) => u.name.toLowerCase()));

  const communityOnly = communityNames
    .filter((n) => !officialNameSet.has(n.toLowerCase()))
    .map((n) => ({ id: null, name: n, isOfficial: false }));

  const all = [...officialNames, ...communityOnly];
  const filtered = q ? all.filter((u) => u.name.toLowerCase().includes(q)) : all;

  return NextResponse.json({ units: filtered.slice(0, 15) });
}
