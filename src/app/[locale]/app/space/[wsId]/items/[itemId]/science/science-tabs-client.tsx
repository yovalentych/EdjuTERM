"use client";

import { useRouter } from "next/navigation";

export function ScienceTabsClient({
  tabs, activeTab, locale, wsId, itemId, color, basePath = "science",
}: {
  tabs: { id: string; label: string }[];
  activeTab: string;
  locale: string;
  wsId: string;
  itemId: string;
  color: string;
  basePath?: string;
}) {
  const router = useRouter();

  return (
    <div className="flex overflow-x-auto gap-1 rounded-2xl border border-slate-200/70 bg-white/60 p-1 shadow-sm backdrop-blur">
      {tabs.map((t) => {
        const active = t.id === activeTab;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => router.push(`/${locale}/app/space/${wsId}/items/${itemId}/${basePath}?tab=${t.id}`)}
            className="shrink-0 flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold transition whitespace-nowrap"
            style={active ? { background: color, color: "#fff" } : {}}
          >
            <span className={active ? "" : "text-slate-500 hover:text-slate-700"}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}
