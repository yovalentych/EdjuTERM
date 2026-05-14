import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { getSpecialtyLabel } from "@/lib/classification-1021";
import type { Dictionary } from "@/lib/i18n";
import type { Project } from "@/lib/schemas";
import {
  ResearchChip,
  ResearchWorkspaceHeader,
  type ResearchTone,
} from "./research-workspace";

export function ProjectResearchHeader({
  description,
  dictionary,
  icon,
  locale,
  metrics,
  project,
  tone = "blue",
  title,
}: {
  description?: ReactNode;
  dictionary: Dictionary;
  icon: LucideIcon;
  locale: string;
  metrics?: ReactNode;
  project: Project;
  tone?: ResearchTone;
  title: ReactNode;
}) {
  const isUk = locale === "uk";
  const dateLabel =
    project.startDate && project.endDate
      ? `${project.startDate} - ${project.endDate}`
      : dictionary.projects.noDateSet;
  const statusLabel =
    project.status === "archived"
      ? isUk
        ? "Архів"
        : "Archived"
      : dictionary.statuses.active;

  return (
    <ResearchWorkspaceHeader
      aside={
        <>
          <ResearchChip>{getSpecialtyLabel(project.researchField)}</ResearchChip>
          <ResearchChip>{dateLabel}</ResearchChip>
          <ResearchChip tone={project.status === "archived" ? "amber" : "emerald"}>
            {statusLabel}
          </ResearchChip>
          {metrics}
        </>
      }
      description={description}
      eyebrow={
        <>
          <ResearchChip className="font-mono text-[10px] font-bold uppercase tracking-widest">
            {project.acronym}
          </ResearchChip>
          <ResearchChip>
            {dictionary.projects.typeOptions[project.projectType]}
          </ResearchChip>
        </>
      }
      icon={icon}
      iconTone={tone}
      title={title}
    />
  );
}
