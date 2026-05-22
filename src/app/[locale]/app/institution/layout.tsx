import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Building2, Sparkles } from "lucide-react";
import { getCurrentUser } from "@/lib/current-user";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";
import { getInstitution } from "@/lib/institutions-db";
import { InstitutionShell } from "@/components/institution/institution-shell";
import { LiquidBg, LiquidCard } from "@/components/ui/liquid";

export default async function InstitutionLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);
  if ((user as any).accountType !== "institution") {
    redirect(`/${locale}/app/space`);
  }

  const institutionId = (user as any).institutionId as string | undefined;
  const institution = institutionId ? await getInstitution(institutionId).catch(() => null) : null;
  const dictionary = getDictionary(locale);
  const isUk = locale === "uk";

  // Корисний edge case: акаунт типу institution, але запис закладу видалено/не знайдено.
  if (!institution) {
    return (
      <LiquidBg tint="amber" className="min-h-screen">
        <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 py-10">
          <LiquidCard tint="amber" className="w-full text-center" accent>
            <Building2 className="mx-auto mb-3 h-10 w-10 text-amber-600" />
            <h1 className="text-base font-bold text-slate-900">
              {isUk ? "Заклад не знайдено" : "Institution not found"}
            </h1>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              {isUk
                ? "Ваш акаунт не пов'язаний з активним закладом. Зареєструйте новий або зверніться у підтримку."
                : "Your account is not linked to an active institution. Register a new one or contact support."}
            </p>
            <Link href={`/${locale}/register/institution`} className="liquid-cta mt-4 inline-flex">
              <Sparkles className="h-4 w-4" />
              {isUk ? "Зареєструвати заклад" : "Register an institution"}
            </Link>
          </LiquidCard>
        </div>
      </LiquidBg>
    );
  }

  return (
    <InstitutionShell
      locale={locale as Locale}
      user={user}
      institution={institution}
      alternateLocale={dictionary.alternateLocale}
    >
      {children}
    </InstitutionShell>
  );
}
