import {
  ClipboardList,
  Database,
  FileText,
  FlaskConical,
  LayoutDashboard,
  UsersRound,
} from "lucide-react";
import type { ReactNode } from "react";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Datasets", icon: Database },
  { label: "Protocols", icon: ClipboardList },
  { label: "Experiments", icon: FlaskConical },
  { label: "Outputs", icon: FileText },
  { label: "Team", icon: UsersRound },
];

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f3f4ef] text-stone-950">
      <div className="grid min-h-screen lg:grid-cols-[260px_1fr]">
        <aside className="border-r border-stone-200 bg-stone-950 px-4 py-5 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center bg-emerald-500 text-stone-950">
              <FlaskConical className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-stone-300">Grant manager</p>
              <p className="font-semibold">OpenLab 2027</p>
            </div>
          </div>
          <nav className="mt-8 space-y-1">
            {navItems.map((item) => (
              <a
                key={item.label}
                href="#"
                className="flex items-center gap-3 px-3 py-2 text-sm text-stone-300 transition hover:bg-stone-800 hover:text-white"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </a>
            ))}
          </nav>
          <div className="mt-8 border border-stone-800 bg-stone-900 p-4">
            <p className="text-sm font-medium text-stone-200">
              Database target
            </p>
            <p className="mt-2 font-mono text-xs leading-5 text-stone-400">
              MongoDB: records, raw_data_files, samples, decisions, audit_events
            </p>
          </div>
        </aside>

        <main className="min-w-0">
          <header className="border-b border-stone-200 bg-white px-5 py-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm text-stone-500">
                  Project operations and open science evidence
                </p>
                <p className="font-semibold text-stone-950">
                  Інформаційний проєкт грантової команди
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs font-medium">
                <span className="border border-emerald-200 bg-emerald-50 px-2 py-1 text-emerald-800">
                  FAIR
                </span>
                <span className="border border-cyan-200 bg-cyan-50 px-2 py-1 text-cyan-800">
                  DOI-ready
                </span>
                <span className="border border-amber-200 bg-amber-50 px-2 py-1 text-amber-800">
                  DMP
                </span>
              </div>
            </div>
          </header>
          <div className="space-y-4 p-4 md:p-5">{children}</div>
        </main>
      </div>
    </div>
  );
}
