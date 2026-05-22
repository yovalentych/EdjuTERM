import { Database, Globe2 } from "lucide-react";
import Link from "next/link";
import type { Dictionary, Locale } from "@/lib/i18n";
import type { Project, SafeUser } from "@/lib/schemas";
import { getSpecialtyLabel } from "@/lib/classification-1021";

const TYPE_ACCENT: Record<string, string> = {
  fundamental: "bg-blue-500",
  applied: "bg-teal-500",
  grant: "bg-emerald-500",
  experimental: "bg-purple-500",
  dissertation: "bg-violet-500",
  training: "bg-amber-500",
  infrastructure: "bg-slate-400",
  internship: "bg-orange-400",
  laboratory: "bg-rose-500",
};

const TYPE_BADGE: Record<string, string> = {
  fundamental: "border-blue-200 bg-blue-50 text-blue-700",
  applied: "border-teal-200 bg-teal-50 text-teal-700",
  grant: "border-emerald-200 bg-emerald-50 text-emerald-700",
  experimental: "border-purple-200 bg-purple-50 text-purple-700",
  dissertation: "border-violet-200 bg-violet-50 text-violet-700",
  training: "border-amber-200 bg-amber-50 text-amber-700",
  infrastructure: "border-slate-200 bg-slate-50 text-slate-600",
  internship: "border-orange-200 bg-orange-50 text-orange-700",
  laboratory: "border-rose-200 bg-rose-50 text-rose-700",
};

export function ProjectList({
  compact = false,
  projects,
  dictionary,
  locale,
  user,
}: {
  compact?: boolean;
  projects: Project[];
  dictionary: Dictionary;
  locale: Locale;
  user?: SafeUser;
}) {
  if (projects.length === 0) {
    return (
      <div className="surface-muted flex flex-col items-center justify-center border-dashed px-6 py-14 text-center">
        <p className="text-sm font-medium text-stone-500">
          {dictionary.projects.none}
        </p>
        <Link
          href={`/${locale}/projects/new`}
          className="control-primary mt-4 px-4 py-2 text-sm font-semibold"
        >
          {dictionary.projects.newProject}
        </Link>
      </div>
    );
  }

  return (
    <div
      className={`grid gap-3 ${compact ? "sm:grid-cols-2" : "sm:grid-cols-2 xl:grid-cols-3"}`}
    >
      {projects.map((project) => {
        const isManager =
          user &&
          (project.ownerId === user._id || project.supervisorId === user._id);
        const accent = TYPE_ACCENT[project.projectType] ?? "bg-slate-400";
        const badge = TYPE_BADGE[project.projectType] ?? "border-slate-200 bg-slate-50 text-slate-600";

        return (
          <article
            key={project._id ?? project.acronym}
            className="metric-card relative flex flex-col overflow-hidden"
          >
            {/* Type color accent bar */}
            <div className={`absolute inset-x-0 top-0 h-0.5 ${accent}`} />

            <div className="flex flex-1 flex-col p-5">
              {/* Header row */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="font-mono text-xs font-bold tracking-widest text-blue-600">
                    {project.acronym}
                  </span>
                  {isManager && (
                    <span className="ml-2 rounded border border-indigo-200 bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700">
                      {locale === "uk" ? "Керівник" : "Manager"}
                    </span>
                  )}
                </div>
                <span
                  className={`shrink-0 rounded border px-2 py-0.5 text-[11px] font-semibold ${badge}`}
                >
                  {dictionary.projects.typeOptions[project.projectType]}
                </span>
              </div>

              {/* Title */}
              <h3 className="mt-2 line-clamp-2 text-sm font-semibold leading-snug text-stone-950">
                {project.title}
              </h3>

              {/* Summary */}
              <p className="mt-2 line-clamp-3 text-xs leading-5 text-stone-500">
                {project.summary || dictionary.projects.noDescription}
              </p>

              {/* Tags */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="rounded border border-stone-200 bg-stone-50 px-2 py-0.5 text-[11px] text-stone-600">
                  {getSpecialtyLabel(project.researchField)}
                </span>
                <span className="rounded border border-cyan-200 bg-cyan-50 px-2 py-0.5 text-[11px] text-cyan-800">
                  {dictionary.projects.dataPolicyOptions[project.dataPolicy]}
                </span>
              </div>

              {/* Feature flags */}
              {(project.openScienceEnabled || project.rawDataRegistryEnabled) && (
                <div className="mt-2.5 flex gap-2">
                  {project.openScienceEnabled && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                      <Globe2 className="h-3 w-3" />
                      Open Science
                    </span>
                  )}
                  {project.rawDataRegistryEnabled && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600">
                      <Database className="h-3 w-3" />
                      {locale === "uk" ? "Реєстр даних" : "Data Registry"}
                    </span>
                  )}
                </div>
              )}

              {/* Actions */}
              {project._id && (
                <div className="mt-auto flex flex-wrap gap-2 pt-4">
                  <Link
                    href={
                      project.projectType === "laboratory"
                        ? `/${locale}/app/laboratory?projectId=${project._id}`
                        : `/${locale}/app/project?projectId=${project._id}`
                    }
                    className="control-primary px-3 py-1.5 text-xs font-semibold"
                  >
                    {dictionary.projects.openWorkspace}
                  </Link>
                  <Link
                    href={`/${locale}/app/project-settings?projectId=${project._id}`}
                    className="control px-3 py-1.5 text-xs font-semibold"
                  >
                    {dictionary.projects.settings}
                  </Link>
                </div>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
