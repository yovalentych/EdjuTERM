import type { Metadata } from "next";
import { headers } from "next/headers";
import { isLocale } from "@/lib/i18n";
import "./globals.css";

export const metadata: Metadata = {
  title: "Grant Project Manager",
  description: "Project management and open science workspace for a research grant",
};

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
      <body className="min-h-full flex flex-col">
        <script
          id="clean-extension-root-attrs"
          dangerouslySetInnerHTML={{ __html: cleanExtensionRootAttrs }}
        />
        {children}
      </body>
    </html>
  );
}
