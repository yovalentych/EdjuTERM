import type { Metadata } from "next";
import { IBM_Plex_Serif } from "next/font/google";
import { headers } from "next/headers";
import Script from "next/script";
import { isLocale } from "@/lib/i18n";
import "./globals.css";

export const metadata: Metadata = {
  title: "Grant Project Manager",
  description: "Project management and open science workspace for a research grant",
};

const ibmPlexSerif = IBM_Plex_Serif({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const cleanExtensionRootAttrs = `
  (function () {
    var root = document.documentElement;
    var attrs = [
      "data-lt-installed",
      "data-lt-active",
      "data-gramm",
      "data-gramm_editor",
      "data-enable-grammarly",
      "data-new-gr-c-s-check-loaded",
      "data-gr-ext-installed",
      "suppresshydrationwarning"
    ];
    function clean() {
      for (var i = 0; i < attrs.length; i += 1) {
        root.removeAttribute(attrs[i]);
      }
    }
    clean();
    var observer = new MutationObserver(clean);
    observer.observe(root, { attributes: true });
    window.addEventListener("DOMContentLoaded", function () {
      window.setTimeout(function () {
        clean();
        observer.disconnect();
      }, 10000);
    });
  })();
`;

const privateShellPreferencesScript = `
  (function () {
    try {
      var theme = window.localStorage.getItem("grant-manager-private-theme");
      if (theme === "soft") {
        document.documentElement.dataset.privateTheme = "soft";
      }
      var sidebarCollapsed = window.localStorage.getItem("grant-manager-sidebar-collapsed");
      if (sidebarCollapsed === "true" || sidebarCollapsed === "false") {
        document.documentElement.dataset.sidebarCollapsed = sidebarCollapsed;
      }
    } catch (error) {
      // localStorage can be unavailable in restricted contexts.
    }
  })();
`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const requestHeaders = await headers();
  const locale = requestHeaders.get("x-app-locale");
  const lang = locale && isLocale(locale) ? locale : "uk";

  return (
    <html
      lang={lang}
      className={`h-full antialiased ${ibmPlexSerif.variable}`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head />
      <body className="min-h-full flex flex-col">
        <Script
          id="private-shell-preferences"
          strategy="beforeInteractive"
        >
          {privateShellPreferencesScript}
        </Script>
        <Script
          id="clean-extension-root-attrs"
          strategy="beforeInteractive"
        >
          {cleanExtensionRootAttrs}
        </Script>
        {children}
      </body>
    </html>
  );
}
