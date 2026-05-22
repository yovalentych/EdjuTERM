import { listExperiments } from "@/lib/experiments";
import { listResearchStages } from "@/lib/research-plan";
import { listTasks, listMilestones } from "@/lib/planning";
import { listResearchEvents, listAllParticipationsForProject } from "@/lib/events";
import { getBudgetSummary, listBudgetPeriods, listBudgetLineItems, listPurchaseRequests } from "@/lib/budget";
import { listPublications, listDeliverables } from "@/lib/research-publications";
import { listOpenScienceUpdatesForProjects } from "@/lib/open-science";
import { getReport } from "@/lib/reports";
import { getProjectForUser } from "@/lib/projects";
import { getCurrentUser } from "@/lib/current-user";
import type {
  Report, ResearchStage, Experiment, Task, Milestone,
  ResearchEvent, EventParticipation, ResearchPublication, ResearchDeliverable,
} from "@/lib/schemas";

export type ReportExportData = {
  generatedAt: string;
  project: {
    _id: string;
    title: string;
    acronym: string;
    grantProgram: string;
    startDate: string;
    endDate: string;
    status: string;
  };
  report: Report | null;
  stages: ResearchStage[];
  experiments: Experiment[];
  tasks: Task[];
  milestones: Milestone[];
  events: ResearchEvent[];
  participations: EventParticipation[];
  publications: ResearchPublication[];
  deliverables: ResearchDeliverable[];
  openScience: Array<{ title: string; category: string; status: string; summary?: string; publishedAt?: Date | null }>;
  budget: {
    totalPlanned: number;
    totalCommitted: number;
    totalSpent: number;
    currency: string;
    byCategory: Array<{ category: string; planned: number; spent: number }>;
    periods: Array<{ label: string; startDate: string; endDate: string }>;
    lineItems: Array<{ category: string; description: string; plannedAmount: number; currency: string }>;
    purchaseRequests: Array<{ title: string; category: string; status: string; estimatedAmount: number; actualAmount?: number | null }>;
  };
};

export async function collectReportExportData(
  projectId: string,
  reportId: string | null,
): Promise<ReportExportData | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const project = await getProjectForUser(projectId, user);
  if (!project?._id) return null;

  const [
    report,
    stages,
    experiments,
    tasks,
    milestones,
    events,
    participations,
    publications,
    deliverables,
    openScience,
    budgetSummary,
    budgetPeriods,
    lineItems,
    purchaseRequests,
  ] = await Promise.all([
    reportId ? getReport(reportId, projectId) : Promise.resolve(null),
    listResearchStages(projectId),
    listExperiments(projectId),
    listTasks(projectId),
    listMilestones(projectId),
    listResearchEvents(projectId),
    listAllParticipationsForProject(projectId),
    listPublications(projectId),
    listDeliverables(projectId),
    listOpenScienceUpdatesForProjects([projectId]),
    getBudgetSummary(projectId),
    listBudgetPeriods(projectId),
    listBudgetLineItems(projectId),
    listPurchaseRequests(projectId),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    project: {
      _id: project._id ?? "",
      title: project.title,
      acronym: project.acronym ?? "",
      grantProgram: project.grantProgram ?? "",
      startDate: project.startDate ?? "",
      endDate: project.endDate ?? "",
      status: project.status ?? "",
    },
    report: report ?? null,
    stages,
    experiments,
    tasks,
    milestones,
    events,
    participations,
    publications,
    deliverables,
    openScience: openScience.map((u) => ({
      title: u.title,
      category: u.category,
      status: u.status,
      summary: u.summary,
      publishedAt: u.publishedAt,
    })),
    budget: {
      ...budgetSummary,
      periods: budgetPeriods.map((p) => ({
        label: p.label ?? "",
        startDate: p.startDate,
        endDate: p.endDate,
      })),
      lineItems: lineItems.map((li) => ({
        category: li.category,
        description: li.description,
        plannedAmount: li.plannedAmount,
        currency: li.currency,
      })),
      purchaseRequests: purchaseRequests.map((r) => ({
        title: r.title,
        category: r.category ?? "",
        status: r.status,
        estimatedAmount: r.estimatedAmount ?? 0,
        actualAmount: r.actualAmount,
      })),
    },
  };
}
