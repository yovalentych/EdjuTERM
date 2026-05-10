import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import type { ReactNode } from "react";

export type BreadcrumbItem = {
  label: ReactNode;
  href?: string;
};

export function Breadcrumb({
  items,
  showHome = true,
  homeHref,
  className = "",
}: {
  items: BreadcrumbItem[];
  showHome?: boolean;
  homeHref?: string;
  className?: string;
}) {
  const all: BreadcrumbItem[] = showHome
    ? [{ label: <Home className="h-3.5 w-3.5" />, href: homeHref ?? "/" }, ...items]
    : items;

  return (
    <nav aria-label="Breadcrumb" className={`breadcrumb ${className}`}>
      {all.map((item, i) => {
        const isLast = i === all.length - 1;
        return (
          <span key={i} className="flex items-center gap-0.5">
            {i > 0 && (
              <ChevronRight className="breadcrumb-sep h-3.5 w-3.5 flex-shrink-0" />
            )}
            {isLast || !item.href ? (
              <span className={isLast ? "breadcrumb-current" : "breadcrumb-link"}>
                {item.label}
              </span>
            ) : (
              <Link href={item.href} className="breadcrumb-link">
                {item.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
