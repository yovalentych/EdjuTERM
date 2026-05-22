import { redirect } from "next/navigation";

export default async function TeachersRedirectPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/app/institution/staff`);
}
