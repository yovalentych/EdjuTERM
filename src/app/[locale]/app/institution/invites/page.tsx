import { redirect, notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n";
import { getCurrentInstitution } from "@/lib/institution-guard";
import { listMembers } from "@/lib/institutions-db";
import { InvitesClient } from "@/components/institution/invites-client";
import type { Locale } from "@/lib/i18n";

export default async function InvitesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const auth = await getCurrentInstitution();
  if (!auth) redirect(`/${locale}/login`);

  // Тільки ті, кому відправлено запрошення (inviteStatus != "none")
  const allMembers = await listMembers(auth.institution._id!);
  const invites = allMembers.filter((m) => (m as any).inviteStatus && (m as any).inviteStatus !== "none");

  return (
    <InvitesClient
      locale={locale as Locale}
      institutionName={auth.institution.name}
      initialInvites={invites as any}
    />
  );
}
