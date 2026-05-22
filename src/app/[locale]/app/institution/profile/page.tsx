import { redirect, notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n";
import { getCurrentInstitution } from "@/lib/institution-guard";

export default async function InstitutionProfileRedirect({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const auth = await getCurrentInstitution();
  if (!auth) redirect(`/${locale}/login`);
  redirect(`/${locale}/institutions/${auth.institution._id}`);
}
