import Link from "next/link";
import type { Dictionary, Locale } from "@/lib/i18n";
import type { Project } from "@/lib/schemas";

export function ProjectList({
  projects,
  dictionary,
  locale,
}: {
  projects: Project[];
  dictionary: Dictionary;
  locale: Locale;
}) {
  return (
    <section className="border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-stone-950">
            {dictionary.projects.current}
          </h2>
          <p className="text-sm text-stone-600">
            {dictionary.projects.createHint}
          </p>
        </div>
        <Link
          href={`/${locale}/projects/new`}
          className="bg-stone-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-800"
        >
          {dictionary.projects.newProject}
        </Link>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {projects.length === 0 ? (
          <div className="border border-dashed border-stone-300 p-4 text-sm text-stone-500">
            {dictionary.projects.none}
          </div>
        ) : (
          projects.map((project) => (
            <article key={project._id ?? project.acronym} className="border border-stone-200 p-4">
              <p className="font-mono text-xs text-stone-500">
                {project.acronym}
              </p>
              <h3 className="mt-1 font-semibold text-stone-950">
                {project.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                {project.summary}
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <span className="border border-emerald-200 bg-emerald-50 px-2 py-1 text-emerald-900">
                  {dictionary.projects.typeOptions[project.projectType]}
                </span>
                <span className="border border-stone-200 bg-stone-50 px-2 py-1 text-stone-700">
                  {dictionary.projects.fieldOptions[project.researchField]}
                </span>
                <span className="border border-cyan-200 bg-cyan-50 px-2 py-1 text-cyan-900">
                  {dictionary.projects.dataPolicyOptions[project.dataPolicy]}
                </span>
              </div>
              {project._id ? (
                <Link
                  href={`/${locale}/app/project-settings?projectId=${project._id}`}
                  className="mt-4 inline-flex border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-stone-800 transition hover:border-emerald-700 hover:text-emerald-800"
                >
                  {dictionary.projects.settings}
                </Link>
              ) : null}
            </article>
          ))
        )}
      </div>
    </section>
  );
}
