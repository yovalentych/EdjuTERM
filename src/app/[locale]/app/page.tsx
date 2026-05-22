import { redirect, notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n";

// Стара Dashboard сторінка більше не активна.
// Простір (/app/space) — єдиний головний екран робочих просторів.
export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();
  redirect(`/${localeParam}/app/space`);
}
