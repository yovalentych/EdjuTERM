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
            </article>
          ))
        )}
      </div>
    </section>
  );
}
