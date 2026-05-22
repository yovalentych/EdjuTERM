import { redirect, notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n";
import { getCurrentInstitution } from "@/lib/institution-guard";
import { SettingsClient } from "@/components/institution/settings-client";
import type { Locale } from "@/lib/i18n";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const auth = await getCurrentInstitution();
  if (!auth) redirect(`/${locale}/login`);

  return (
    <SettingsClient
      locale={locale as Locale}
      institution={auth.institution}
    />
  );
}
