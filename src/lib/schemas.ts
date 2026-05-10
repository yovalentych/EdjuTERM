import { z } from "zod";

export const recordKinds = [
  // Group 1: Planning & Strategy
  "research_question", "literature_review", "theoretical_framework", "hypothesis", "project_charter",
  // Group 2: Methodology & Protocols
  "methodology", "sop", "protocol", "data_collection_protocol", "analysis_protocol", "safety_protocol", "measurement_method",
  // Group 3: Data & Measurements
  "dataset", "data_dictionary", "data_collection_form", "measurement_log", "calibration_record", "experiment_log",
  // Group 4: Samples & Materials
  "sample", "reagent", "equipment", "consumable",
  // Group 5: Team & Communication
  "task", "task_set", "meeting_minutes", "decision_log", "raci", "training_record", "supervision_log",
  // Group 6: Risk, Safety & Ethics
  "risk", "ethics_approval", "dpia", "coi_declaration", "safety_assessment",
  // Group 7: Outputs & Publications
  "output", "conference_abstract", "dissertation_chapter", "patent", "report", "outreach",
  // Group 8: Knowledge & Standards
  "literature_note", "glossary", "standard", "regulatory_requirement",
  // Group 9: Finance & Resources
  "purchase_request", "expense_record",
] as const;

export const accessCategories = [
  "internal",
  "open",
  "embargoed",
  "restricted",
] as const;

export const openScienceCategories = [
  "data_repository",
  "updates",
  "news",
  "conferences",
  "publications",
  "protocols",
  "outreach",
] as const;

export const userRoles = ["admin", "supervisor", "member", "user"] as const;

export const projectTypes = [
  "fundamental",
  "applied",
  "infrastructure",
  "training",
  "grant",
  "dissertation",
  "experimental",
  "internship",
] as const;

/** @deprecated Use CLASSIFICATION_1021 from classification-1021.ts */
export const researchFields = [
  "physiology",
  "neuroscience",
  "molecular_biology",
  "bioinformatics",
  "biomedicine",
] as const;

export const projectVisibilityOptions = [
  "private",
  "team",
  "public_profile",
] as const;

export const dataPolicyOptions = [
  "internal",
  "open_by_default",
  "embargo_then_open",
  "restricted_sensitive",
] as const;

export const repositoryPlanOptions = [
  "github_zenodo",
  "osf",
  "institutional",
  "undecided",
] as const;

export const processingStatuses = ["raw", "processed", "analyzed", "published"] as const;

export const recordCreatorSchema = z.object({
  name: z.string().max(200),           // Ukrainian / native script
  nameEn: z.string().max(200).default(""), // Latin script for Zenodo (Last, First)
  affiliation: z.string().max(200).default(""),
  orcid: z.string().max(40).default(""),
});

export const recordContributorRoles = [
  "DataCollector",
  "DataCurator",
  "DataManager",
  "Editor",
  "ProjectLeader",
  "ProjectMember",
  "Researcher",
  "Supervisor",
  "Other",
] as const;

export const recordContributorSchema = z.object({
  name: z.string().max(200),
  nameEn: z.string().max(200).default(""),
  affiliation: z.string().max(200).default(""),
  orcid: z.string().max(40).default(""),
  role: z.enum(recordContributorRoles).default("Other"),
});

export const relatedIdentifierSchemes = ["doi", "url", "isbn", "issn", "arxiv", "pmid", "handle", "urn"] as const;
export const relatedIdentifierRelations = [
  "IsCitedBy", "Cites",
  "IsSupplementTo", "IsSupplementedBy",
  "IsPartOf", "HasPart",
  "IsVersionOf", "IsNewVersionOf", "IsPreviousVersionOf",
  "References", "IsReferencedBy",
  "IsDocumentedBy", "Documents",
  "IsDerivedFrom", "IsSourceOf",
] as const;

export const relatedIdentifierSchema = z.object({
  identifier: z.string().max(500),
  scheme: z.enum(relatedIdentifierSchemes).default("doi"),
  relation: z.enum(relatedIdentifierRelations).default("References"),
});

export const projectRecordInputSchema = z.object({
  projectId: z.string().min(1).max(120),
  kind: z.enum(recordKinds),
  localId: z.string().min(3).max(80),
  title: z.string().min(3).max(240),
  stage: z.string().min(3).max(80),
  group: z.string().max(120).default(""),
  dataFormat: z.string().max(80).default(""),
  version: z.string().max(40).default(""),
  rootRecordId: z.string().max(120).default(""),
  parentVersionId: z.string().max(120).default(""),
  variantLabel: z.string().max(200).default(""),
  versionNote: z.string().max(1000).default(""),
  access: z.enum(accessCategories),
  owner: z.string().min(1).max(120),
  repository: z.string().min(1).max(160),
  summary: z.string().max(1200).default(""),
  usageNotes: z.string().max(2400).default(""),
  keywords: z.string().max(400).default(""),
  license: z.string().max(80).default(""),
  tags: z.array(z.string().max(60)).default([]),
  doi: z.string().max(200).default(""),
  processingStatus: z.enum(processingStatuses).default("raw"),
  linkedPublicationIds: z.array(z.string()).default([]),
  // Zenodo-aligned metadata
  creators: z.array(recordCreatorSchema).default([]),
  language: z.string().max(10).default(""),
  embargoDate: z.string().max(32).default(""),
  dateCollectedFrom: z.string().max(32).default(""),
  dateCollectedTo: z.string().max(32).default(""),
  fundingGrant: z.string().max(400).default(""),
  subjects: z.array(z.string().max(200)).default([]),
  notes: z.string().max(2000).default(""),
  contributors: z.array(recordContributorSchema).default([]),
  references: z.string().max(4000).default(""),
  relatedIdentifiers: z.array(relatedIdentifierSchema).default([]),
  typedData: z.record(z.string(), z.unknown()).default({}),
});

export const projectRecordSchema = projectRecordInputSchema.extend({
  _id: z.string().optional(),
  createdBy: z.string().default(""),
  status: z
    .enum(["planned", "active", "review", "released", "blocked"])
    .default("planned"),
  processingHistory: z
    .array(
      z.object({
        status: z.enum(processingStatuses),
        changedAt: z.coerce.date(),
        changedBy: z.string().default(""),
        note: z.string().max(600).default(""),
      }),
    )
    .default([]),
  relatedIds: z.array(z.string()).default([]),
  rawDataFiles: z
    .array(
      z.object({
        name: z.string(),
        storageUri: z.string(),
        checksum: z.string().optional(),
        mimeType: z.string().optional(),
        bytes: z.number().optional(),
        uploadedAt: z.coerce.date().optional(),
      }),
    )
    .default([]),
  archivedAt: z.coerce.date().optional(),
  zenodoDepositionId: z.number().optional(),
  zenodoRecordId: z.number().optional(),
  zenodoConceptDoi: z.string().max(200).default(""),
  zenodoDoi: z.string().max(200).default(""),
  zenodoUrl: z.string().max(500).default(""),
  zenodoDraftUrl: z.string().max(500).default(""),
  zenodoState: z.string().max(80).default(""),
  zenodoSubmitted: z.boolean().default(false),
  zenodoFileCount: z.number().int().min(0).default(0),
  zenodoFilesSyncedAt: z.coerce.date().nullable().default(null),
  zenodoPublishedAt: z.coerce.date().nullable().default(null),
  zenodoSyncedAt: z.coerce.date().nullable().default(null),
  zenodoSyncError: z.string().max(1200).default(""),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type ProjectRecordInput = z.infer<typeof projectRecordInputSchema>;
export type ProjectRecord = z.infer<typeof projectRecordSchema>;
export type ProcessingStatus = (typeof processingStatuses)[number];

export const registerInputSchema = z.object({
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  firstNameLatin: z.string().min(1).max(80),
  lastNameLatin: z.string().min(1).max(80),
  email: z.string().email().max(240).transform((email) => email.toLowerCase()),
  password: z.string().min(8).max(200),
});

export const loginInputSchema = z.object({
  email: z.string().email().max(240).transform((email) => email.toLowerCase()),
  password: z.string().min(1).max(200),
});

export const userSchema = z.object({
  _id: z.string().optional(),
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  firstNameLatin: z.string().min(1).max(80),
  lastNameLatin: z.string().min(1).max(80),
  email: z.string().email(),
  orcid: z.string().max(32).default(""),
  position: z.string().max(120).default(""),
  affiliation: z.string().max(200).default(""),
  profileBio: z.string().max(1200).default(""),
  defaultSpecialty: z.string().max(10).default(""),
  passwordHash: z.string(),
  role: z.enum(userRoles).default("user"),
  sessionVersion: z.number().int().min(1).default(1),
  emailVerifiedAt: z.coerce.date().nullable().default(null),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const safeUserSchema = userSchema.omit({ passwordHash: true });

export const projectInputSchema = z.object({
  title: z.string().min(3).max(200),
  acronym: z.string().min(2).max(32),
  summary: z.string().max(1200).default(""),
  projectType: z.enum(projectTypes).default("fundamental"),
  researchField: z.string().max(10).default(""),
  grantProgram: z.string().max(160).default(""),
  startDate: z.string().max(32).default(""),
  endDate: z.string().max(32).default(""),
  defaultLocale: z.enum(["uk", "en"]).default("uk"),
  visibility: z.enum(projectVisibilityOptions).default("private"),
  dataPolicy: z.enum(dataPolicyOptions).default("embargo_then_open"),
  repositoryPlan: z.enum(repositoryPlanOptions).default("github_zenodo"),
  ethicsReview: z.enum(["not_required", "planned", "approved"]).default("planned"),
  hasHumanData: z.coerce.boolean().default(false),
  hasAnimalData: z.coerce.boolean().default(false),
  hasPersonalData: z.coerce.boolean().default(false),
  openScienceEnabled: z.coerce.boolean().default(true),
  teamChatEnabled: z.coerce.boolean().default(true),
  taskManagementEnabled: z.coerce.boolean().default(true),
  rawDataRegistryEnabled: z.coerce.boolean().default(true),
});

export const projectSchema = projectInputSchema.extend({
  _id: z.string().optional(),
  ownerId: z.string(),
  supervisorId: z.string(),
  memberIds: z.array(z.string()).default([]),
  joinCode: z.string().max(32).default(""),
  supervisorJoinCode: z.string().max(32).default(""),
  status: z.enum(["active", "archived"]).default("active"),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const profileInputSchema = z.object({
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  firstNameLatin: z.string().min(1).max(80),
  lastNameLatin: z.string().min(1).max(80),
  orcid: z.string().max(32).default(""),
  position: z.string().max(120).default(""),
  affiliation: z.string().max(200).default(""),
  profileBio: z.string().max(1200).default(""),
  defaultSpecialty: z.string().max(10).default(""),
});

export const openScienceUpdateInputSchema = z.object({
  projectId: z.string().min(1).max(120),
  category: z.enum(openScienceCategories).default("updates"),
  title: z.string().min(3).max(240),
  summary: z.string().max(600).default(""),
  content: z.string().max(5000).default(""),
  publicUrl: z.string().max(500).default(""),
  accessibilityNotes: z.string().max(1200).default(""),
  license: z.string().max(80).default(""),
  status: z.enum(["draft", "published"]).default("draft"),
  linkedRecordIds: z.array(z.string()).default([]),
});

export const openScienceUpdateSchema = openScienceUpdateInputSchema.extend({
  _id: z.string().optional(),
  createdBy: z.string(),
  updatedBy: z.string().optional(),
  publishedAt: z.coerce.date().nullable().default(null),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const teamMessageLabels = ["urgent", "question", "decision", "info", "note"] as const;
export type TeamMessageLabel = (typeof teamMessageLabels)[number];

export const teamMessageInputSchema = z.object({
  projectId: z.string().min(1).max(120),
  body: z.string().min(1).max(2000),
  topic: z.string().max(80).default("general"),
  label: z.enum(teamMessageLabels).nullable().default(null),
});

export const teamMessageSchema = teamMessageInputSchema.extend({
  _id: z.string().optional(),
  authorId: z.string(),
  starredBy: z.array(z.string()).default([]),
  pinned: z.boolean().default(false),
  createdAt: z.coerce.date(),
});

export const projectInvitationInputSchema = z.object({
  projectId: z.string().min(1).max(120),
  email: z.string().email().max(240).transform((email) => email.toLowerCase()),
});

export const projectInvitationSchema = projectInvitationInputSchema.extend({
  _id: z.string().optional(),
  code: z.string().min(6).max(32),
  status: z.enum(["pending", "accepted", "revoked", "expired"]).default("pending"),
  createdBy: z.string(),
  acceptedBy: z.string().optional(),
  expiresAt: z.coerce.date(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const taskPriorities = ["low", "medium", "high", "critical"] as const;

export const taskStatuses = [
  "todo",
  "in_progress",
  "review",
  "done",
  "cancelled",
] as const;

export const taskCategories = [
  "research",
  "experiment",
  "data_collection",
  "analysis",
  "writing",
  "report",
  "meeting",
  "procurement",
  "admin",
  "other",
] as const;

export const taskInputSchema = z.object({
  projectId: z.string().min(1).max(120),
  title: z.string().min(2).max(240),
  description: z.string().max(2000).default(""),
  parentTaskId: z.string().max(120).default(""),
  assigneeId: z.string().max(120).default(""),
  dueDate: z.string().max(32).default(""),
  priority: z.enum(taskPriorities).default("medium"),
  category: z.enum(taskCategories).default("research"),
  estimatedHours: z.coerce.number().min(0).max(9999).default(0),
});

export const taskSchema = taskInputSchema.extend({
  _id: z.string().optional(),
  status: z.enum(taskStatuses).default("todo"),
  createdBy: z.string(),
  completedAt: z.coerce.date().nullable().default(null),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const milestoneInputSchema = z.object({
  projectId: z.string().min(1).max(120),
  title: z.string().min(2).max(200),
  description: z.string().max(1000).default(""),
  dueDate: z.string().min(1).max(32),
});

export const milestoneSchema = milestoneInputSchema.extend({
  _id: z.string().optional(),
  status: z.enum(["upcoming", "reached", "missed"]).default("upcoming"),
  createdBy: z.string(),
  reachedAt: z.coerce.date().nullable().default(null),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const timeEntryInputSchema = z.object({
  projectId: z.string().min(1).max(120),
  taskId: z.string().max(120).default(""),
  date: z.string().min(1).max(32),
  hours: z.coerce.number().min(0.25).max(24),
  description: z.string().max(500).default(""),
  category: z.enum(taskCategories).default("research"),
});

export const timeEntrySchema = timeEntryInputSchema.extend({
  _id: z.string().optional(),
  userId: z.string(),
  createdAt: z.coerce.date(),
});

export const budgetCategories = [
  "personnel",
  "equipment",
  "reagents",
  "consumables",
  "travel",
  "services",
  "subcontracting",
  "overhead",
  "software",
  "publications",
  "other",
] as const;

export const currencyOptions = ["UAH", "EUR", "USD"] as const;

export const purchaseRequestStatuses = [
  "draft",
  "submitted",
  "approved",
  "rejected",
  "purchased",
  "delivered",
] as const;

export const budgetPeriodInputSchema = z.object({
  projectId: z.string().min(1).max(120),
  label: z.string().min(2).max(100),
  startDate: z.string().max(32),
  endDate: z.string().max(32),
});

export const budgetPeriodSchema = budgetPeriodInputSchema.extend({
  _id: z.string().optional(),
  status: z.enum(["active", "closed"]).default("active"),
  createdBy: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const budgetLineItemInputSchema = z.object({
  projectId: z.string().min(1).max(120),
  periodId: z.string().max(120).default(""),
  category: z.enum(budgetCategories),
  name: z.string().min(2).max(300),
  description: z.string().max(1000).default(""),
  quantity: z.coerce.number().min(0).max(999_999).default(1),
  unit: z.string().max(50).default("шт."),
  unitPrice: z.coerce.number().min(0).max(999_999_999).default(0),
  plannedAmount: z.coerce.number().min(0).max(999_999_999),
  currency: z.enum(currencyOptions).default("UAH"),
  vendor: z.string().max(200).default(""),
  url: z.string().max(500).default(""),
  notes: z.string().max(600).default(""),
});

export const budgetLineItemSchema = budgetLineItemInputSchema.extend({
  _id: z.string().optional(),
  createdBy: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const purchaseRequestInputSchema = z.object({
  projectId: z.string().min(1).max(120),
  title: z.string().min(3).max(240),
  description: z.string().min(3).max(2000),
  category: z.enum(budgetCategories),
  estimatedAmount: z.coerce.number().min(0).max(999_999_999),
  currency: z.enum(currencyOptions).default("UAH"),
  vendor: z.string().max(200).default(""),
  justification: z.string().max(1200).default(""),
  linkedPeriodId: z.string().max(120).default(""),
  linkedLineItemId: z.string().max(120).default(""),
});

export const purchaseRequestSchema = purchaseRequestInputSchema.extend({
  _id: z.string().optional(),
  requesterId: z.string(),
  status: z.enum(purchaseRequestStatuses).default("draft"),
  reviewedBy: z.string().optional(),
  reviewNote: z.string().max(600).default(""),
  actualAmount: z.coerce.number().min(0).optional(),
  purchasedAt: z.coerce.date().nullable().default(null),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const researchStageStatuses = [
  "planned",
  "active",
  "completed",
  "reported",
] as const;

export const researchStageInputSchema = z.object({
  projectId: z.string().min(1).max(120),
  stageNumber: z.coerce.number().int().min(1).max(99),
  title: z.string().min(2).max(2000),
  goals: z.string().max(10000).default(""),
  tasksText: z.string().max(20000).default(""),
  startDate: z.string().max(32).default(""),
  endDate: z.string().max(32).default(""),
  indicators: z.string().max(10000).default(""),
  budget: z.coerce.number().min(0).max(999_999_999).default(0),
  currency: z.enum(currencyOptions).default("UAH"),
  linkedMilestoneId: z.string().max(120).default(""),
  progress: z.coerce.number().int().min(0).max(100).default(0),
});

export const researchStageSchema = researchStageInputSchema.extend({
  _id: z.string().optional(),
  status: z.enum(researchStageStatuses).default("planned"),
  linkedTaskIds: z.array(z.string()).default([]),
  completionNote: z.string().max(2000).default(""),
  completedAt: z.coerce.date().nullable().default(null),
  createdBy: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const publicationTypes = [
  "article",
  "conference",
  "book_chapter",
  "monograph",
  "patent",
  "report",
  "dataset",
  "software",
  "other",
] as const;

export const publicationStatuses = [
  "planned",
  "submitted",
  "under_review",
  "accepted",
  "published",
  "rejected",
] as const;

export const researchPublicationInputSchema = z.object({
  projectId: z.string().min(1).max(120),
  stageId: z.string().max(120).default(""),
  type: z.enum(publicationTypes).default("article"),
  title: z.string().min(2).max(500),
  authors: z.string().max(500).default(""),
  journal: z.string().max(300).default(""),
  status: z.enum(publicationStatuses).default("planned"),
  expectedYear: z.coerce.number().int().min(2020).max(2040).nullable().default(null),
  doi: z.string().max(200).default(""),
  url: z.string().max(500).default(""),
  note: z.string().max(1000).default(""),
});

export const researchPublicationSchema = researchPublicationInputSchema.extend({
  _id: z.string().optional(),
  createdBy: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type PublicationType = (typeof publicationTypes)[number];
export type PublicationStatus = (typeof publicationStatuses)[number];
export type ResearchPublicationInput = z.infer<typeof researchPublicationInputSchema>;
export type ResearchPublication = z.infer<typeof researchPublicationSchema>;

export const deliverableTypes = [
  "publication",
  "dataset",
  "software",
  "patent",
  "protocol",
  "report",
  "training",
  "equipment",
  "other",
] as const;

export const deliverableStatuses = [
  "planned",
  "in_progress",
  "delayed",
  "completed",
] as const;

export const researchDeliverableInputSchema = z.object({
  projectId: z.string().min(1).max(120),
  stageId: z.string().max(120).default(""),
  type: z.enum(deliverableTypes).default("publication"),
  title: z.string().min(2).max(500),
  description: z.string().max(2000).default(""),
  plannedDate: z.string().max(32).default(""),
  status: z.enum(deliverableStatuses).default("planned"),
  link: z.string().max(500).default(""),
  note: z.string().max(1000).default(""),
});

export const researchDeliverableSchema = researchDeliverableInputSchema.extend({
  _id: z.string().optional(),
  completedAt: z.coerce.date().nullable().default(null),
  createdBy: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type DeliverableType = (typeof deliverableTypes)[number];
export type DeliverableStatus = (typeof deliverableStatuses)[number];
export type ResearchDeliverableInput = z.infer<typeof researchDeliverableInputSchema>;
export type ResearchDeliverable = z.infer<typeof researchDeliverableSchema>;

// ── Experiments ───────────────────────────────────────────────────────────────

export const experimentTypes = [
  "in_silico",
  "in_vitro",
  "in_vivo",
  "clinical",
  "other",
] as const;

export const experimentStatuses = [
  "planned",
  "running",
  "completed",
  "failed",
  "on_hold",
] as const;

export const experimentPriorities = ["low", "medium", "high", "critical"] as const;
export type ExperimentPriority = (typeof experimentPriorities)[number];

export const experimentInputSchema = z.object({
  projectId: z.string().min(1).max(120),
  stageId: z.string().max(120).default(""),
  title: z.string().min(2).max(300),
  type: z.enum(experimentTypes).default("in_silico"),
  status: z.enum(experimentStatuses).default("planned"),
  priority: z.enum(experimentPriorities).default("medium"),
  startDate: z.string().max(32).default(""),
  endDate: z.string().max(32).default(""),
  objectives: z.string().max(2000).default(""),
  hypothesis: z.string().max(3000).default(""),
  variables: z.string().max(2000).default(""),
  controls: z.string().max(1000).default(""),
  replicates: z.coerce.number().int().min(0).default(0),
  methods: z.string().max(5000).default(""),
  results: z.string().max(5000).default(""),
  conclusion: z.string().max(2000).default(""),
  notes: z.string().max(2000).default(""),
  linkedMethodologyId: z.string().max(120).default(""),
  linkedRecordIds: z.array(z.string()).default([]),
  outputRecordIds: z.array(z.string()).default([]),
});

export const experimentSchema = experimentInputSchema.extend({
  _id: z.string().optional(),
  createdBy: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type ExperimentType = (typeof experimentTypes)[number];
export type ExperimentStatus = (typeof experimentStatuses)[number];
export type ExperimentInput = z.infer<typeof experimentInputSchema>;
export type Experiment = z.infer<typeof experimentSchema>;

export const auditActions = [
  "project.created",
  "project.settings.updated",
  "project.member.added",
  "project.member.removed",
  "project.supervisor.changed",
  "project.invitation.created",
  "project.join_code.generated",
  "project.joined_by_code",
  "user.profile.updated",
  "admin.viewed",
  "budget.period.created",
  "budget.line_item.created",
  "budget.request.submitted",
  "budget.request.approved",
  "budget.request.rejected",
  "budget.request.purchased",
  "planning.task.created",
  "planning.task.status_changed",
  "planning.milestone.created",
  "planning.milestone.reached",
  "planning.time.logged",
  "research.stage.created",
  "research.stage.updated",
  "research.stage.deleted",
  "research.stage.status_changed",
  "research.stage.progress_updated",
  "research.publication.created",
  "research.deliverable.created",
  "experiment.created",
  "experiment.updated",
  "experiment.methodology_linked",
  "experiment.record_generated",
  "report.created",
  "report.updated",
  "report.status_changed",
  "record.created",
  "record.updated",
  "record.versioned",
  "record.variant_created",
  "record.processing_status.changed",
  "record.archived",
  "record.restored",
  "record.deleted",
  "zenodo.draft.synced",
  "zenodo.draft.sync_failed",
  "zenodo.files.synced",
  "zenodo.files.sync_failed",
  "zenodo.record.published",
  "zenodo.record.publish_failed",
  "zenodo.status.checked",
  "zenodo.status.deleted",
  "open_science.created",
  "open_science.updated",
  "open_science.deleted",
  "manuscript.created",
  "manuscript.updated",
  "manuscript.deleted",
  "manuscript.blocks_updated",
  "manuscript.attachments_updated",
  "event.created",
  "event.updated",
  "event.deleted",
  "event.participation.added",
  "event.participation.updated",
  "event.participation.removed",
  "event.submission.added",
  "event.submission.updated",
  "event.submission.removed",
] as const;

// ── Chat ─────────────────────────────────────────────────────────────────────

export const chatMessageSchema = z.object({
  _id: z.string().optional(),
  projectId: z.string().min(1),
  userId: z.string().min(1),
  displayName: z.string().min(1).max(100),
  initials: z.string().max(3),
  content: z.string().min(1).max(2000),
  createdAt: z.coerce.date(),
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;

// ── Audit ─────────────────────────────────────────────────────────────────────

export const auditEventSchema = z.object({
  _id: z.string().optional(),
  action: z.enum(auditActions),
  actorId: z.string(),
  actorEmail: z.string().email().optional(),
  projectId: z.string().optional(),
  targetUserId: z.string().optional(),
  targetEmail: z.string().email().optional(),
  targetEntity: z.string().optional(),
  requestId: z.string().optional(),
  before: z.record(z.string(), z.unknown()).optional(),
  after: z.record(z.string(), z.unknown()).optional(),
  metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])).default({}),
  createdAt: z.coerce.date(),
});

export type UserRole = z.infer<typeof userSchema>["role"];
export type User = z.infer<typeof userSchema>;
export type SafeUser = z.infer<typeof safeUserSchema>;
export type RegisterInput = z.infer<typeof registerInputSchema>;
export type LoginInput = z.infer<typeof loginInputSchema>;
export type ProfileInput = z.infer<typeof profileInputSchema>;
export type ProjectInput = z.infer<typeof projectInputSchema>;
export type Project = z.infer<typeof projectSchema>;
export type OpenScienceUpdateInput = z.infer<
  typeof openScienceUpdateInputSchema
>;
export type OpenScienceUpdate = z.infer<typeof openScienceUpdateSchema>;
export type TeamMessageInput = z.infer<typeof teamMessageInputSchema>;
export type TeamMessage = z.infer<typeof teamMessageSchema>;
export type ProjectInvitationInput = z.infer<typeof projectInvitationInputSchema>;
export type ProjectInvitation = z.infer<typeof projectInvitationSchema>;
export type AuditEvent = z.infer<typeof auditEventSchema>;
export type AuditAction = z.infer<typeof auditEventSchema>["action"];
export type TaskPriority = (typeof taskPriorities)[number];
export type TaskStatus = (typeof taskStatuses)[number];
export type TaskCategory = (typeof taskCategories)[number];
export type TaskInput = z.infer<typeof taskInputSchema>;
export type Task = z.infer<typeof taskSchema>;
export type MilestoneInput = z.infer<typeof milestoneInputSchema>;
export type Milestone = z.infer<typeof milestoneSchema>;
export type TimeEntryInput = z.infer<typeof timeEntryInputSchema>;
export type TimeEntry = z.infer<typeof timeEntrySchema>;
export type BudgetCategory = (typeof budgetCategories)[number];
export type Currency = (typeof currencyOptions)[number];
export type PurchaseRequestStatus = (typeof purchaseRequestStatuses)[number];
export type BudgetPeriodInput = z.infer<typeof budgetPeriodInputSchema>;
export type BudgetPeriod = z.infer<typeof budgetPeriodSchema>;
export type BudgetLineItemInput = z.infer<typeof budgetLineItemInputSchema>;
export type BudgetLineItem = z.infer<typeof budgetLineItemSchema>;
export type PurchaseRequestInput = z.infer<typeof purchaseRequestInputSchema>;
export type PurchaseRequest = z.infer<typeof purchaseRequestSchema>;
export type ResearchStageStatus = (typeof researchStageStatuses)[number];
export type ResearchStageInput = z.infer<typeof researchStageInputSchema>;
export type ResearchStage = z.infer<typeof researchStageSchema>;

// ── Reports ───────────────────────────────────────────────────────────────────

export const reportTypes = [
  "intermediate",
  "annual",
  "final",
  "financial",
  "conference",
  "custom",
] as const;

export const reportStatuses = [
  "draft",
  "ready",
  "submitted",
  "approved",
] as const;

export const reportInputSchema = z.object({
  projectId: z.string().min(1).max(120),
  type: z.enum(reportTypes).default("intermediate"),
  title: z.string().min(2).max(300),
  period: z.string().max(100).default(""),
  linkedStageIds: z.array(z.string()).default([]),
  sectionGoals: z.string().max(20000).default(""),
  sectionResults: z.string().max(20000).default(""),
  sectionPublications: z.string().max(10000).default(""),
  sectionTimeline: z.string().max(10000).default(""),
  sectionFinancial: z.string().max(10000).default(""),
  sectionProblems: z.string().max(10000).default(""),
  sectionPlans: z.string().max(10000).default(""),
  sectionMeta: z.string().max(200000).default("{}"),
  note: z.string().max(2000).default(""),
});

export const reportSchema = reportInputSchema.extend({
  _id: z.string().optional(),
  status: z.enum(reportStatuses).default("draft"),
  submittedAt: z.coerce.date().nullable().default(null),
  approvedAt: z.coerce.date().nullable().default(null),
  createdBy: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type ReportType = (typeof reportTypes)[number];
export type ReportStatus = (typeof reportStatuses)[number];
export type ReportInput = z.infer<typeof reportInputSchema>;
export type Report = z.infer<typeof reportSchema>;

// ── Learning Journal ──────────────────────────────────────────────────────────

export const courseTypes = [
  "mandatory", "elective", "optional", "language", "physical", "practice", "research",
] as const;

export const courseStatuses = ["planned", "active", "completed", "failed", "withdrawn"] as const;

export const topicTypes = [
  "lecture", "seminar", "practical", "lab", "self_study", "consultation",
] as const;

export const assessmentTypes = [
  "exam", "zalik", "midterm", "test", "colloquium", "seminar", "practical_work",
  "essay", "project", "coursework", "lab_work", "notes_check", "oral",
  "presentation", "other",
] as const;

export const assessmentStatuses = [
  "upcoming", "in_progress", "completed", "missed", "retake_needed", "passed_retake",
] as const;

export const learningCourseInputSchema = z.object({
  projectId: z.string().min(1).max(120),
  title: z.string().min(2).max(300),
  code: z.string().max(50).default(""),
  semester: z.coerce.number().int().min(1).max(12).default(1),
  year: z.coerce.number().int().min(1).max(6).default(1),
  credits: z.coerce.number().min(0).max(30).default(3),
  courseType: z.enum(courseTypes).default("mandatory"),
  instructor: z.string().max(200).default(""),
  status: z.enum(courseStatuses).default("planned"),
  finalScore: z.coerce.number().min(0).max(100).nullable().default(null),
  finalGrade: z.string().max(10).default(""),
  orderIndex: z.coerce.number().int().default(0),
  note: z.string().max(1000).default(""),
});

export const learningCourseSchema = learningCourseInputSchema.extend({
  _id: z.string().optional(),
  createdBy: z.string().default(""),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const learningModuleInputSchema = z.object({
  projectId: z.string().min(1).max(120),
  courseId: z.string().min(1).max(120),
  title: z.string().min(1).max(300),
  description: z.string().max(2000).default(""),
  orderIndex: z.coerce.number().int().default(0),
  isCompleted: z.boolean().default(false),
});

export const learningModuleSchema = learningModuleInputSchema.extend({
  _id: z.string().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const learningTopicInputSchema = z.object({
  projectId: z.string().min(1).max(120),
  courseId: z.string().min(1).max(120),
  moduleId: z.string().min(1).max(120),
  title: z.string().min(1).max(300),
  description: z.string().max(2000).default(""),
  topicType: z.enum(topicTypes).default("lecture"),
  orderIndex: z.coerce.number().int().default(0),
  isCompleted: z.boolean().default(false),
  completedAt: z.coerce.date().nullable().default(null),
  durationHours: z.coerce.number().min(0).max(100).default(2),
  notes: z.string().max(20000).default(""),
  linkedLectureId: z.string().max(120).default(""),
});

export const learningTopicSchema = learningTopicInputSchema.extend({
  _id: z.string().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const learningAssessmentInputSchema = z.object({
  projectId: z.string().min(1).max(120),
  courseId: z.string().min(1).max(120),
  moduleId: z.string().max(120).default(""),
  title: z.string().min(1).max(300),
  description: z.string().max(2000).default(""),
  assessmentType: z.enum(assessmentTypes).default("test"),
  linkedTopicIds: z.array(z.string()).default([]),
  linkedModuleIds: z.array(z.string()).default([]),
  dueDate: z.string().max(32).default(""),
  completedDate: z.string().max(32).default(""),
  maxScore: z.coerce.number().min(0).max(1000).default(100),
  achievedScore: z.coerce.number().min(0).max(1000).nullable().default(null),
  weight: z.coerce.number().min(0).max(100).default(0),
  status: z.enum(assessmentStatuses).default("upcoming"),
  notes: z.string().max(2000).default(""),
  feedback: z.string().max(2000).default(""),
});

export const learningAssessmentSchema = learningAssessmentInputSchema.extend({
  _id: z.string().optional(),
  createdBy: z.string().default(""),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type CourseType = (typeof courseTypes)[number];
export type CourseStatus = (typeof courseStatuses)[number];
export type TopicType = (typeof topicTypes)[number];
export type AssessmentType = (typeof assessmentTypes)[number];
export type AssessmentStatus = (typeof assessmentStatuses)[number];
export type LearningCourseInput = z.infer<typeof learningCourseInputSchema>;
export type LearningCourse = z.infer<typeof learningCourseSchema>;
export type LearningModuleInput = z.infer<typeof learningModuleInputSchema>;
export type LearningModule = z.infer<typeof learningModuleSchema>;
export type LearningTopicInput = z.infer<typeof learningTopicInputSchema>;
export type LearningTopic = z.infer<typeof learningTopicSchema>;
export type LearningAssessmentInput = z.infer<typeof learningAssessmentInputSchema>;
export type LearningAssessment = z.infer<typeof learningAssessmentSchema>;

export const attendanceStatuses = ["present", "absent", "excused", "late"] as const;
export const sessionStatuses = ["active", "cancelled", "rescheduled", "makeup"] as const;

export const learningSessionInputSchema = z.object({
  projectId: z.string().min(1).max(120),
  courseId: z.string().min(1).max(120),
  topicId: z.string().max(120).default(""),
  moduleId: z.string().max(120).default(""),
  title: z.string().max(300).default(""),
  sessionType: z.enum(topicTypes).default("lecture"),
  date: z.string().max(32).default(""),
  startTime: z.string().max(10).default(""),
  endTime: z.string().max(10).default(""),
  durationHours: z.coerce.number().min(0).max(24).default(1.5),
  attendance: z.enum(attendanceStatuses).nullable().default(null),
  grade: z.coerce.number().min(0).max(100).nullable().default(null),
  notes: z.string().max(5000).default(""),
  location: z.string().max(200).default(""),
  orderIndex: z.coerce.number().int().default(0),
  status: z.enum(sessionStatuses).default("active"),
  cancellationReason: z.string().max(500).default(""),
  originalDate: z.string().max(32).default(""),
  recurringGroupId: z.string().max(120).default(""),
});

export const learningSessionSchema = learningSessionInputSchema.extend({
  _id: z.string().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const assignmentTypes = [
  "homework", "essay", "notes", "report", "project", "problem_set",
  "lab_report", "reading", "presentation", "other",
] as const;

export const assignmentStatuses = [
  "assigned", "in_progress", "submitted", "graded", "late", "missing",
] as const;

export const learningAssignmentInputSchema = z.object({
  projectId: z.string().min(1).max(120),
  courseId: z.string().min(1).max(120),
  sessionId: z.string().max(120).default(""),
  topicId: z.string().max(120).default(""),
  moduleId: z.string().max(120).default(""),
  title: z.string().min(1).max(300),
  description: z.string().max(5000).default(""),
  assignmentType: z.enum(assignmentTypes).default("homework"),
  dueDate: z.string().max(32).default(""),
  submittedDate: z.string().max(32).default(""),
  maxScore: z.coerce.number().min(0).max(1000).default(100),
  achievedScore: z.coerce.number().min(0).max(1000).nullable().default(null),
  status: z.enum(assignmentStatuses).default("assigned"),
  notes: z.string().max(2000).default(""),
  feedback: z.string().max(2000).default(""),
});

export const learningAssignmentSchema = learningAssignmentInputSchema.extend({
  _id: z.string().optional(),
  createdBy: z.string().default(""),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type AttendanceStatus = (typeof attendanceStatuses)[number];
export type SessionStatus = (typeof sessionStatuses)[number];
export type AssignmentType = (typeof assignmentTypes)[number];
export type AssignmentStatus = (typeof assignmentStatuses)[number];
export type LearningSessionInput = z.infer<typeof learningSessionInputSchema>;
export type LearningSession = z.infer<typeof learningSessionSchema>;
export type LearningAssignmentInput = z.infer<typeof learningAssignmentInputSchema>;
export type LearningAssignment = z.infer<typeof learningAssignmentSchema>;

// ── Research Events ───────────────────────────────────────────────────────────

export const eventTypes = [
  "conference",
  "workshop",
  "symposium",
  "seminar",
  "summer_school",
  "competition",
  "exhibition",
  "hackathon",
  "other",
] as const;

export const eventFormats = ["in_person", "online", "hybrid"] as const;

export const eventStatuses = [
  "planned",
  "confirmed",
  "attended",
  "cancelled",
] as const;

export const participationRoles = [
  "presenter",
  "poster_presenter",
  "attendee",
  "organizer",
  "chair",
  "volunteer",
] as const;

export const contributionTypes = [
  "oral",
  "poster",
  "keynote",
  "panel",
  "demo",
  "workshop_talk",
] as const;

export const participationStatuses = [
  "planned",
  "abstract_submitted",
  "accepted",
  "rejected",
  "attended",
  "cancelled",
] as const;

export const researchEventInputSchema = z.object({
  projectId: z.string().min(1).max(120),
  title: z.string().min(2).max(300),
  type: z.enum(eventTypes).default("conference"),
  format: z.enum(eventFormats).default("in_person"),
  status: z.enum(eventStatuses).default("planned"),
  startDate: z.string().max(20).default(""),
  endDate: z.string().max(20).default(""),
  location: z.string().max(200).default(""),
  url: z.string().max(500).default(""),
  abstractDeadline: z.string().max(20).default(""),
  fullPaperDeadline: z.string().max(20).default(""),
  registrationDeadline: z.string().max(20).default(""),
  registrationFormUrl: z.string().max(500).default(""),
  organizingEmail: z.string().max(200).default(""),
  languages: z.string().max(200).default(""),
  sections: z.string().max(2000).default(""),
  description: z.string().max(3000).default(""),
});

export const researchEventSchema = researchEventInputSchema.extend({
  _id: z.string().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const submissionTypes = [
  "abstract",
  "full_paper",
  "poster",
  "slides",
  "video",
  "registration",
  "visa_docs",
  "other",
] as const;

export const submissionStatuses = [
  "draft",
  "submitted",
  "accepted",
  "rejected",
  "revision_required",
  "withdrawn",
] as const;

export const submissionItemSchema = z.object({
  sid: z.string().min(1),
  type: z.enum(submissionTypes).default("abstract"),
  title: z.string().max(300).default(""),
  coAuthors: z.string().max(500).default(""),
  section: z.string().max(100).default(""),
  deadline: z.string().max(20).default(""),
  submittedAt: z.string().max(20).default(""),
  status: z.enum(submissionStatuses).default("draft"),
  revisionDeadline: z.string().max(20).default(""),
  revisionNotes: z.string().max(1000).default(""),
});

export const eventParticipationInputSchema = z.object({
  eventId: z.string().min(1),
  projectId: z.string().min(1).max(120),
  participantId: z.string().min(1),
  participantName: z.string().max(200).default(""),
  affiliation: z.string().max(300).default(""),
  role: z.enum(participationRoles).default("attendee"),
  section: z.string().max(100).default(""),
  contributionTitle: z.string().max(300).default(""),
  contributionType: z.enum(contributionTypes).nullable().default(null),
  status: z.enum(participationStatuses).default("planned"),
  notes: z.string().max(1000).default(""),
});

export const eventParticipationSchema = eventParticipationInputSchema.extend({
  _id: z.string().optional(),
  createdAt: z.coerce.date(),
  submissions: z.array(submissionItemSchema).default([]),
});

export type EventType = (typeof eventTypes)[number];
export type EventFormat = (typeof eventFormats)[number];
export type EventStatus = (typeof eventStatuses)[number];
export type ParticipationRole = (typeof participationRoles)[number];
export type ContributionType = (typeof contributionTypes)[number];
export type ParticipationStatus = (typeof participationStatuses)[number];
export type SubmissionType = (typeof submissionTypes)[number];
export type SubmissionStatus = (typeof submissionStatuses)[number];
export type SubmissionItem = z.infer<typeof submissionItemSchema>;
export type ResearchEventInput = z.infer<typeof researchEventInputSchema>;
export type ResearchEvent = z.infer<typeof researchEventSchema>;
export type EventParticipationInput = z.infer<typeof eventParticipationInputSchema>;
export type EventParticipation = z.infer<typeof eventParticipationSchema>;

// ── Manuscripts ──────────────────────────────────────────────────────────────

export const manuscriptTypes = [
  "dissertation",
  "article",
  "monograph",
  "thesis",
  "guide",
  "other",
] as const;

export const manuscriptStatuses = [
  "draft",
  "review",
  "submitted",
  "revision",
  "published",
] as const;

export const manuscriptBlockTypes = [
  "h1",
  "h2",
  "h3",
  "paragraph",
  "quote",
  "figure",
  "table",
  "code",
  "math",
  "divider",
] as const;

export const manuscriptAuthorSchema = z.object({
  name: z.string().max(150),
  affiliation: z.string().max(200).default(""),
  role: z.enum(["first", "corresponding", "co"]).default("co"),
  userId: z.string().optional(),
});

export const manuscriptBlockSchema = z.object({
  id: z.string(),
  type: z.enum(manuscriptBlockTypes).default("paragraph"),
  content: z.string().max(20000).default(""),
  meta: z.record(z.string(), z.any()).optional(),
});

export const dissertationMetaSchema = z.object({
  degree: z.enum(["phd", "doctor"]).default("phd"),
  specialtyCode: z.string().max(20).default(""),
  specialty: z.string().max(300).default(""),
  institution: z.string().max(400).default(""),
  defenseInstitution: z.string().max(400).default(""),
  supervisor: z.string().max(200).default(""),
  supervisorTitle: z.string().max(200).default(""),
  udc: z.string().max(50).default(""),
  city: z.string().max(100).default(""),
  year: z.number().optional(),
});

export const manuscriptInputSchema = z.object({
  projectId: z.string().min(1).max(120),
  title: z.string().min(2).max(300),
  type: z.enum(manuscriptTypes).default("other"),
  abstract: z.string().max(3000).default(""),
  keywords: z.array(z.string().max(80)).max(20).default([]),
  authors: z.array(manuscriptAuthorSchema).default([]),
  journal: z.string().max(200).default(""),
  doi: z.string().max(200).default(""),
  dissertationMeta: dissertationMetaSchema.optional(),
  blocks: z.array(manuscriptBlockSchema).default([]),
  attachedRecordIds: z.array(z.string()).default([]),
  attachedExperimentIds: z.array(z.string()).default([]),
  note: z.string().max(2000).default(""),
});

export const manuscriptSchema = manuscriptInputSchema.extend({
  _id: z.string().optional(),
  status: z.enum(manuscriptStatuses).default("draft"),
  createdBy: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type ManuscriptType = (typeof manuscriptTypes)[number];
export type ManuscriptStatus = (typeof manuscriptStatuses)[number];
export type ManuscriptBlockType = (typeof manuscriptBlockTypes)[number];
export type DissertationMeta = z.infer<typeof dissertationMetaSchema>;
export type ManuscriptAuthor = z.infer<typeof manuscriptAuthorSchema>;
export type ManuscriptBlock = z.infer<typeof manuscriptBlockSchema>;
export type ManuscriptInput = z.infer<typeof manuscriptInputSchema>;
export type Manuscript = z.infer<typeof manuscriptSchema>;

// ── PhD Individual Plan ───────────────────────────────────────────────────────

export const phdCycleTypes = [
  "general",
  "specialty_practice",
  "specialty_professional",
] as const;

export const phdSubgroupTypes = ["mandatory", "elective"] as const;

export const phdWorkStatuses = [
  "pending",
  "completed",
  "not_completed",
  "partial",
] as const;

export const phdCurriculumCourseSchema = z.object({
  cid: z.string().min(1),
  cycle: z.enum(phdCycleTypes).default("general"),
  subgroup: z.enum(phdSubgroupTypes).default("mandatory"),
  title: z.string().min(1).max(300),
  credits: z.coerce.number().min(0).max(30).default(3),
  controlForm: z.string().max(50).default(""),
  studyYear: z.coerce.number().int().min(1).max(4).default(1),
  orderIndex: z.coerce.number().int().default(0),
  credited: z.boolean().default(false),
});

export const phdMilestoneSchema = z.object({
  mid: z.string().min(1),
  title: z.string().max(500),
  period: z.string().max(200).default(""),
  orderIndex: z.coerce.number().int().default(0),
});

export const phdYearlyCourseSchema = z.object({
  ycid: z.string().min(1),
  cycle: z.enum(phdCycleTypes).default("general"),
  subgroup: z.enum(phdSubgroupTypes).default("mandatory"),
  title: z.string().max(300),
  controlForm: z.string().max(50).default(""),
  period: z.string().max(100).default(""),
  termType: z.string().max(30).default(""),
  grade: z.string().max(50).default(""),
  teacherName: z.string().max(200).default(""),
  orderIndex: z.coerce.number().int().default(0),
});

export const phdYearlyScientificItemSchema = z.object({
  wsid: z.string().min(1),
  title: z.string().max(300),
  content: z.string().max(2000).default(""),
  period: z.string().max(100).default(""),
  termType: z.string().max(30).default(""),
  status: z.enum(phdWorkStatuses).default("pending"),
  supervisorNote: z.string().max(500).default(""),
  orderIndex: z.coerce.number().int().default(0),
});

export const phdYearlyPlanSchema = z.object({
  year: z.coerce.number().int().min(1).max(4),
  educationalCourses: z.array(phdYearlyCourseSchema).default([]),
  headOfDeptName: z.string().max(200).default(""),
  headOfDeptDate: z.string().max(32).default(""),
  scientificWorkItems: z.array(phdYearlyScientificItemSchema).default([]),
  supervisorAssessment: z.string().max(1000).default(""),
  committeeDecision: z.string().max(1000).default(""),
  committeeChair: z.string().max(200).default(""),
  committeeDate: z.string().max(32).default(""),
  sem1Start: z.string().max(32).default(""),
  sem1End: z.string().max(32).default(""),
  sem2Start: z.string().max(32).default(""),
  sem2End: z.string().max(32).default(""),
});

export const phdPlanMetaSchema = z.object({
  projectId: z.string().min(1).max(120),
  studentName: z.string().max(200).default(""),
  specialty: z.string().max(200).default(""),
  studyForm: z.enum(["full_time", "part_time"]).default("full_time"),
  enrollmentDate: z.string().max(32).default(""),
  enrollmentOrderDate: z.string().max(32).default(""),
  enrollmentOrderNumber: z.string().max(50).default(""),
  supervisor: z.string().max(200).default(""),
  supervisorTitle: z.string().max(200).default(""),
  dissertationTitle: z.string().max(1000).default(""),
  dissertationApprovalDate: z.string().max(32).default(""),
  dissertationApprovalProtocol: z.string().max(50).default(""),
  justification: z.string().max(5000).default(""),
  department: z.string().max(200).default(""),
  institution: z.string().max(200).default(""),
  totalCredits: z.coerce.number().int().min(0).max(999).default(0),
});

export const phdPlanSchema = phdPlanMetaSchema.extend({
  _id: z.string().optional(),
  curriculumCourses: z.array(phdCurriculumCourseSchema).default([]),
  milestones: z.array(phdMilestoneSchema).default([]),
  yearlyPlans: z.array(phdYearlyPlanSchema).default([]),
  createdBy: z.string().default(""),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type PhdCycleType = (typeof phdCycleTypes)[number];
export type PhdSubgroupType = (typeof phdSubgroupTypes)[number];
export type PhdWorkStatus = (typeof phdWorkStatuses)[number];
export type PhdCurriculumCourse = z.infer<typeof phdCurriculumCourseSchema>;
export type PhdMilestone = z.infer<typeof phdMilestoneSchema>;
export type PhdYearlyCourse = z.infer<typeof phdYearlyCourseSchema>;
export type PhdYearlyScientificItem = z.infer<typeof phdYearlyScientificItemSchema>;
export type PhdYearlyPlan = z.infer<typeof phdYearlyPlanSchema>;
export type PhdPlanMeta = z.infer<typeof phdPlanMetaSchema>;
export type PhdPlan = z.infer<typeof phdPlanSchema>;

// ── Portfolio ─────────────────────────────────────────────────────────────────

export const portfolioPublicationTypes = [
  "journal_indexed",
  "journal_other",
  "conference_proceedings",
  "monograph",
  "patent",
  "other",
] as const;

export const portfolioPublicationSchema = z.object({
  pubid: z.string().min(1),
  pubType: z.enum(portfolioPublicationTypes).default("journal_indexed"),
  authors: z.string().max(800).default(""),
  title: z.string().max(600).default(""),
  journal: z.string().max(400).default(""),
  year: z.coerce.number().int().min(1990).max(2100).default(new Date().getFullYear()),
  volume: z.string().max(50).default(""),
  issue: z.string().max(50).default(""),
  pages: z.string().max(50).default(""),
  doi: z.string().max(300).default(""),
  url: z.string().max(600).default(""),
  orderIndex: z.coerce.number().int().default(0),
});

export const conferenceCompetitionPlaces = ["I", "II", "III", "special", "nomination", "other"] as const;
export type ConferenceCompetitionPlace = (typeof conferenceCompetitionPlaces)[number];

export const portfolioConferenceSchema = z.object({
  confid: z.string().min(1),
  name: z.string().max(600).default(""),
  organizer: z.string().max(400).default(""),
  location: z.string().max(200).default(""),
  dateStart: z.string().max(20).default(""),
  dateEnd: z.string().max(20).default(""),
  thesisTitle: z.string().max(600).default(""),
  authors: z.string().max(400).default(""),
  award: z.string().max(400).default(""),
  isCompetition: z.coerce.boolean().default(false),
  competitionPlace: z.string().max(50).default(""),
  competitionNomination: z.string().max(400).default(""),
  url: z.string().max(800).default(""),
  orderIndex: z.coerce.number().int().default(0),
});

export const portfolioAwardSchema = z.object({
  awid: z.string().min(1),
  title: z.string().max(400).default(""),
  issuer: z.string().max(400).default(""),
  date: z.string().max(20).default(""),
  description: z.string().max(800).default(""),
  url: z.string().max(800).default(""),
  orderIndex: z.coerce.number().int().default(0),
});

export const portfolioMetaSchema = z.object({
  projectId: z.string().min(1).max(120),
  fullName: z.string().max(200).default(""),
  educationLevel: z.string().max(100).default("phd"),
  specialty: z.string().max(200).default(""),
  educationalProgram: z.string().max(300).default(""),
  department: z.string().max(300).default(""),
  institution: z.string().max(300).default(""),
  studyPeriodStart: z.string().max(20).default(""),
  studyPeriodEnd: z.string().max(20).default(""),
  dissertationTopic: z.string().max(800).default(""),
  supervisor: z.string().max(200).default(""),
  supervisorTitle: z.string().max(200).default(""),
});

export const portfolioSchema = portfolioMetaSchema.extend({
  _id: z.string().optional(),
  publications: z.array(portfolioPublicationSchema).default([]),
  conferences: z.array(portfolioConferenceSchema).default([]),
  awards: z.array(portfolioAwardSchema).default([]),
  createdBy: z.string().default(""),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export type PortfolioPublicationType = (typeof portfolioPublicationTypes)[number];
export type PortfolioPublication = z.infer<typeof portfolioPublicationSchema>;
export type PortfolioConference = z.infer<typeof portfolioConferenceSchema>;
export type PortfolioAward = z.infer<typeof portfolioAwardSchema>;
export type PortfolioMeta = z.infer<typeof portfolioMetaSchema>;
export type Portfolio = z.infer<typeof portfolioSchema>;

// ── Activity diary ────────────────────────────────────────────────────────────

export const diaryEntryTypes = [
  "note",
  "meeting",
  "application",
  "info_received",
  "request_received",
  "task_done",
  "event",
] as const;

export const diaryEntrySchema = z.object({
  _id: z.string().optional(),
  projectId: z.string().min(1).max(120),
  userId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  type: z.enum(diaryEntryTypes),
  title: z.string().min(1).max(300),
  body: z.string().max(4000).default(""),
  // type-specific extras (all optional)
  person: z.string().max(200).default(""),       // who (meeting, request, info)
  place: z.string().max(200).default(""),        // where (meeting, event)
  recipient: z.string().max(200).default(""),    // to whom (application)
  docRef: z.string().max(100).default(""),       // reference/number (application)
  outcome: z.string().max(500).default(""),      // result/status
  tags: z.array(z.string().max(40)).default([]),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const diaryEntryInputSchema = diaryEntrySchema.omit({ _id: true, createdAt: true, updatedAt: true });

export type DiaryEntryType = (typeof diaryEntryTypes)[number];
export type DiaryEntry = z.infer<typeof diaryEntrySchema>;
export type DiaryEntryInput = z.infer<typeof diaryEntryInputSchema>;
