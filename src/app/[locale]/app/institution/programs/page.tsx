import { redirect, notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n";
import { getCurrentInstitution } from "@/lib/institution-guard";
import { listPrograms, listUnits } from "@/lib/institutions-db";
import { ProgramsClient } from "@/components/institution/programs-client";

export default async function ProgramsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const auth = await getCurrentInstitution();
  if (!auth) redirect(`/${locale}/login`);

  const [programs, units] = await Promise.all([
    listPrograms(auth.institution._id!),
    listUnits(auth.institution._id!),
  ]);

  return (
    <ProgramsClient
      locale={locale}
      institutionName={auth.institution.name}
      initialPrograms={programs}
      units={units}
    />
  );
}
