import { redirect, notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n";
import { getCurrentInstitution } from "@/lib/institution-guard";
import { listUnits, listAdmins } from "@/lib/institutions-db";
import { StructureClient } from "@/components/institution/structure-client";
import type { Locale } from "@/lib/i18n";

export default async function StructurePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const auth = await getCurrentInstitution();
  if (!auth) redirect(`/${locale}/login`);

  const id = auth.institution._id!;
  const [units, admins] = await Promise.all([listUnits(id), listAdmins(id)]);

  return (
    <StructureClient
      locale={locale as Locale}
      institutionName={auth.institution.name}
      initialUnits={units}
      initialAdmins={admins}
    />
  );
}
