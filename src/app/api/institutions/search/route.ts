import { NextResponse } from "next/server";
import { searchInstitutionsDb } from "@/lib/institutions-db";
import { getInstitutions, searchInstitutions as searchEdbo } from "@/lib/institutions";

/**
 * Об'єднаний autocomplete для пошуку закладу.
 *   • registered — наші зареєстровані заклади (з _id, isVerified) → можна linkувати.
 *   • edbo — публічний реєстр ЗВО України (тільки назви) → reference-only,
 *     заклад ще не зареєструвався, але користувач знатиме що такий існує.
 *
 * Public endpoint — використовується і на /register/institution (анонімний user),
 * і у залогіненому workspace editor. Дані з ЄДЕБО — публічний реєстр МОН.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? "";
  if (q.trim().length < 2) {
    return NextResponse.json({ registered: [], edbo: [] });
  }

  const [dbList, edboList] = await Promise.all([
    searchInstitutionsDb(q, 8).catch(() => []),
    getInstitutions()
      .then((all) => searchEdbo(all, q).slice(0, 8))
      .catch(() => [] as Awaited<ReturnType<typeof searchEdbo>>),
  ]);

  // Дедуплікація ЄДЕБО рядків що збігаються з зареєстрованими (за назвою).
  const dbNames = new Set(dbList.map((i) => i.name.toLowerCase().trim()));
  const edboFiltered = edboList.filter((e) => !dbNames.has(e.name.toLowerCase().trim()));

  return NextResponse.json({
    registered: dbList.map((i) => ({
      id: i._id,
      name: i.name,
      shortName: i.shortName,
      type: i.type,
      city: i.city,
      country: i.country,
      isVerified: i.isVerified,
    })),
    edbo: edboFiltered.map((e) => ({
      name: e.name,
      shortName: e.shortName ?? "",
      city: e.city ?? "",
      type: e.type ?? "",
    })),
  });
}
