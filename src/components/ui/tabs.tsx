import Link from "next/link";
import type { ReactNode } from "react";

export type TabItem<T extends string = string> = {
  id: T;
  label: ReactNode;
  href: string;
  icon?: ReactNode;
  badge?: number | string;
};

export function Tabs<T extends string>({
  items,
  activeId,
  className = "",
}: {
  items: TabItem<T>[];
  activeId: T;
  className?: string;
}) {
  return (
    <nav className={`tabler-tabs ${className}`}>
      {items.map((item) => {
        const active = item.id === activeId;
        return (
          <Link
            key={item.id}
            href={item.href}
            data-active={active ? "true" : "false"}
            className="tabler-tab"
          >
            {item.icon && item.icon}
            {item.label}
            {item.badge !== undefined && (
              <span
                className={`tabler-tab-badge ${
                  active
                    ? "bg-blue-100 text-blue-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
