import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Database, FileText, FlaskConical, ShieldCheck } from "lucide-react";
import { AuthForm } from "@/components/auth/auth-form";
import { LanguageToggle } from "@/components/language-toggle";
import { getCurrentUser } from "@/lib/current-user";
import { getDictionary, isLocale } from "@/lib/i18n";

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const { locale: localeParam } = await params;

  if (!isLocale(localeParam)) notFound();

  const user = await getCurrentUser();
  if (user) redirect(`/${localeParam}/app`);

  const dictionary = getDictionary(localeParam);
  const { error, notice } = await searchParams;
  const isUk = localeParam === "uk";

  const benefits = [
    {
      icon: Database,
      label: isUk ? "FAIR записи" : "FAIR records",
      text: isUk ? "дані, протоколи, версії" : "data, protocols, versions",
    },
    {
      icon: FlaskConical,
      label: isUk ? "Експерименти" : "Experiments",
      text: isUk ? "журнал, QC, результати" : "journal, QC, results",
    },
    {
      icon: FileText,
      label: isUk ? "Документи" : "Documents",
      text: isUk ? "звіти, рукописи, експорт" : "reports, manuscripts, export",
    },
  ];

  return (
    <main className="min-h-screen bg-[#0A2640] text-white">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden overflow-hidden px-10 py-8 lg:flex lg:flex-col">
          <Image
            src="/landing/hero-lab.jpg"
            alt={isUk ? "Науковці у лабораторії" : "Scientists in a laboratory"}
            fill
            priority
            sizes="55vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,38,64,0.96),rgba(10,38,64,0.78)_54%,rgba(10,38,64,0.45))]" />
          <div className="absolute right-0 top-0 h-[420px] w-[55%] rounded-bl-[180px] bg-[#1C3D5B]/70" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(101,228,163,0.20),transparent_24rem)]" />

          <div className="relative flex items-center justify-between">
            <Link href={`/${localeParam}`} className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white">
                <Image src="/logo.svg" alt="Logo" width={28} height={28} />
              </span>
              <span className="text-xl font-bold">{dictionary.shell.projectShortName}</span>
            </Link>
            <Link href={`/${localeParam}/open-science`} className="rounded-full border border-white/30 px-4 py-2 text-sm font-bold text-white transition hover:bg-white hover:text-[#0A2640]">
              Open Science
            </Link>
          </div>

          <div className="relative mt-auto max-w-2xl pb-8">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-[#65E4A3]">
              <ShieldCheck className="h-4 w-4" />
              {isUk ? "Захищений робочий простір" : "Secure research workspace"}
            </p>
            <h1 className="text-5xl font-semibold leading-[1.05]">
              {isUk
                ? "Поверніться до свого дослідницького контуру"
                : "Return to your research operating loop"}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-200">
              {isUk
                ? "Керуйте проєктами, записами, експериментами, бюджетом, звітами й відкритою наукою з одного місця."
                : "Manage projects, records, experiments, budget, reports, and open science from one place."}
            </p>

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {benefits.map((item) => (
                <div key={item.label} className="rounded-[8px] border border-white/12 bg-white/10 p-4 backdrop-blur">
                  <item.icon className="h-5 w-5 text-[#65E4A3]" />
                  <p className="mt-4 font-bold">{item.label}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-300">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative flex min-h-screen items-center justify-center bg-white px-5 py-8 text-[#0A2640]">
          <div className="absolute left-5 right-5 top-5 flex items-center justify-between gap-3 lg:hidden">
            <Link href={`/${localeParam}`} className="flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0A2640]">
                <Image src="/logo.svg" alt="Logo" width={24} height={24} />
              </span>
              <span className="font-bold">{dictionary.shell.projectShortName}</span>
            </Link>
            <LanguageToggle locale={localeParam} alternateLocale={dictionary.alternateLocale} />
          </div>

          <div className="w-full max-w-md pt-16 lg:pt-0">
            <div className="mb-8 hidden justify-end lg:flex">
              <LanguageToggle locale={localeParam} alternateLocale={dictionary.alternateLocale} />
            </div>

            <div className="rounded-[8px] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_-36px_rgba(10,38,64,0.45)] md:p-8">
              <div className="mb-8">
                <p className="mb-3 inline-flex rounded-full bg-[#65E4A3]/20 px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#0A2640]">
                  {isUk ? "Вхід до системи" : "Workspace access"}
                </p>
                <h2 className="text-3xl font-semibold leading-tight text-[#0A2640]">
                  {dictionary.auth.loginTitle}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {isUk
                    ? "Увійдіть, щоб продовжити роботу з проєктами, даними та документами."
                    : "Sign in to continue working with projects, data, and documents."}
                </p>
              </div>

              <AuthForm
                mode="login"
                dictionary={dictionary}
                locale={localeParam}
                error={error}
                notice={notice}
              />
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm">
              <Link href={`/${localeParam}`} className="inline-flex items-center gap-2 font-semibold text-slate-500 transition hover:text-[#0A2640]">
                {isUk ? "На головну" : "Back home"}
              </Link>
              <Link href={`/${localeParam}/register`} className="inline-flex items-center gap-2 font-bold text-[#0A2640]">
                {dictionary.auth.registerSubmit}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
