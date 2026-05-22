import { redirect, notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n";
import { getCurrentInstitution } from "@/lib/institution-guard";
import {
  listInstitutionCourses,
  listPrograms,
  listUnits,
  listMembers,
} from "@/lib/institutions-db";
import { CoursesClient } from "@/components/institution/courses-client";
import type { Locale } from "@/lib/i18n";

export default async function CoursesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const auth = await getCurrentInstitution();
  if (!auth) redirect(`/${locale}/login`);

  const id = auth.institution._id!;

  const [courses, programs, units, members] = await Promise.all([
    listInstitutionCourses(id),
    listPrograms(id),
    listUnits(id),
    listMembers(id),
  ]);

  return (
    <CoursesClient
      locale={locale as Locale}
      institutionName={auth.institution.name}
      initialCourses={courses}
      programs={programs}
      units={units}
      members={members}
    />
  );
}
