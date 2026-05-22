import { redirect, notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n";
import { getCurrentInstitution } from "@/lib/institution-guard";
import {
  listUnits,
  listMembers,
  listPrograms,
  listInstitutionCourses,
} from "@/lib/institutions-db";
import { ImportClient } from "@/components/institution/import-client";
import type { Locale } from "@/lib/i18n";

export default async function ImportPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const auth = await getCurrentInstitution();
  if (!auth) redirect(`/${locale}/login`);

  const id = auth.institution._id!;

  const [units, members, programs, courses] = await Promise.all([
    listUnits(id),
    listMembers(id),
    listPrograms(id),
    listInstitutionCourses(id),
  ]);

  return (
    <ImportClient
      locale={locale as Locale}
      institutionName={auth.institution.name}
      counts={{
        units: units.length,
        members: members.length,
        programs: programs.length,
        courses: courses.length,
      }}
    />
  );
}
