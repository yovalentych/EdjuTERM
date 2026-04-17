import { notFound, redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { getCurrentUser } from "@/lib/current-user";
import { getDictionary, isLocale } from "@/lib/i18n";

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { locale: localeParam } = await params;

  if (!isLocale(localeParam)) {
    notFound();
  }

  const user = await getCurrentUser();

  if (user) {
    redirect(`/${localeParam}/app`);
  }

  const dictionary = getDictionary(localeParam);
  const { error } = await searchParams;

  return (
    <main className="min-h-screen bg-[#f3f4ef] px-5 py-10 text-stone-950">
      <section className="mx-auto max-w-md border border-stone-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">{dictionary.auth.loginTitle}</h1>
        <div className="mt-5">
          <AuthForm
            mode="login"
            dictionary={dictionary}
            locale={localeParam}
            error={error}
          />
        </div>
      </section>
    </main>
  );
}
