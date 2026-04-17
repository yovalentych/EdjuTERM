import type { Metadata } from "next";
import { headers } from "next/headers";
import { isLocale } from "@/lib/i18n";
import "./globals.css";

export const metadata: Metadata = {
  title: "Grant Project Manager",
  description: "Project management and open science workspace for a research grant",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const requestHeaders = await headers();
  const locale = requestHeaders.get("x-app-locale");
  const lang = locale && isLocale(locale) ? locale : "uk";

  return (
    <html lang={lang} className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
