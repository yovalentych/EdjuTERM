"use client";

import { ExternalLink, ShieldCheck } from "lucide-react";
import { getLicense } from "@/lib/licenses";

export function LicenseBadge({
  licenseId,
  showLink = true,
}: {
  licenseId: string | null | undefined;
  showLink?: boolean;
}) {
  const license = getLicense(licenseId);
  if (!license) return null;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded border px-2.5 py-1 text-xs font-semibold ${license.badgeClass}`}>
      <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
      {license.name}
      {showLink && license.url && (
        <a
          href={license.url}
          target="_blank"
          rel="noreferrer"
          className="ml-0.5 opacity-60 hover:opacity-100"
          title={license.fullName}
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </span>
  );
}

// Block variant — shown on public page as a section
export function LicenseBlock({ licenseId }: { licenseId: string | null | undefined }) {
  const license = getLicense(licenseId);
  if (!license) return null;

  return (
    <div className={`mt-3 flex items-start gap-2 rounded border px-3 py-2.5 text-xs ${license.badgeClass}`}>
      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0">
        <p className="font-semibold">{license.fullName}</p>
        <p className="mt-0.5 opacity-80">{license.summary}</p>
        {license.url && (
          <a
            href={license.url}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-flex items-center gap-1 underline underline-offset-2 opacity-70 hover:opacity-100"
          >
            Текст ліцензії <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </div>
  );
}
