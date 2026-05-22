import { redirect, notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n";
import { getCurrentInstitution } from "@/lib/institution-guard";
import { listMembers, listUnits, syncStaffFromSources } from "@/lib/institutions-db";
import { StaffClient } from "@/components/institution/staff-client";
import type { Locale } from "@/lib/i18n";

export default async function StaffPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const auth = await getCurrentInstitution();
  if (!auth) redirect(`/${locale}/login`);

  const id = auth.institution._id!;

  const syncResult = await syncStaffFromSources(id);
  const [members, units] = await Promise.all([listMembers(id), listUnits(id)]);

  return (
    <StaffClient
      locale={locale as Locale}
      institutionName={auth.institution.name}
      initialMembers={members}
      units={units}
      autoSyncedCount={syncResult.created}
    />
  );
}
