"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAuditEvent } from "@/lib/audit";
import {
  createBudgetLineItem,
  createBudgetPeriod,
  createPurchaseRequest,
  getPurchaseRequestById,
  markRequestPurchased,
  reviewPurchaseRequest,
} from "@/lib/budget";
import { postChatMessage } from "@/lib/chat";
import {
  createMilestone,
  createTask,
  createTimeEntry,
  markMilestoneReached,
  listTasks,
  listMilestones,
  updateTaskStatus,
  updateMilestone as updateMilestoneLib,
  deleteMilestone as deleteMilestoneLib,
} from "@/lib/planning";
import {
  createResearchStage,
  listResearchStages,
  updateStageStatus,
  linkTaskToStage,
  unlinkTaskFromStage,
  updateResearchStage as updateResearchStageLib,
  deleteResearchStage as deleteResearchStageLib,
} from "@/lib/research-plan";
import {
  createReport as createReportLib,
  getReport as getReportLib,
  updateReport as updateReportLib,
  updateReportStatus as updateReportStatusLib,
  deleteReport as deleteReportLib,
} from "@/lib/reports";
import {
  createPublication,
  listPublications,
  updatePublicationStatus as updatePubStatus,
  updatePublication as updatePublicationLib,
  deletePublication as deletePublicationLib,
  createDeliverable,
  updateDeliverableStatus as updateDelivStatus,
  updateDeliverable as updateDeliverableLib,
  deleteDeliverable as deleteDeliverableLib,
  updateStageProgress as updateStageProgressLib,
} from "@/lib/research-publications";
import {
  createExperiment as createExperimentLib,
  getExperimentById as getExperimentByIdLib,
  updateExperiment as updateExperimentLib,
  updateExperimentStatus as updateExperimentStatusLib,
  deleteExperiment as deleteExperimentLib,
} from "@/lib/experiments";
import {
  createResearchEvent as createResearchEventLib,
  updateResearchEvent as updateResearchEventLib,
  deleteResearchEvent as deleteResearchEventLib,
  addEventParticipation as addEventParticipationLib,
  updateEventParticipation as updateEventParticipationLib,
  removeEventParticipation as removeEventParticipationLib,
  addSubmissionToParticipation as addSubmissionLib,
  updateSubmissionInParticipation as updateSubmissionLib,
  removeSubmissionFromParticipation as removeSubmissionLib,
} from "@/lib/events";
import { getCurrentUser } from "@/lib/current-user";
import { isLocale } from "@/lib/i18n";
import { createProjectInvitation } from "@/lib/invitations";
import {
  createOpenScienceUpdate,
  getOpenScienceUpdateByLinkedRecord,
  updateOpenScienceUpdate,
  deleteOpenScienceUpdate as deleteOpenScienceUpdateLib,
} from "@/lib/open-science";
import { verifyPassword } from "@/lib/passwords";
import {
  addProjectMemberByEmail,
  canManageProject,
  createProjectForUser,
  generateProjectJoinCode,
  joinProjectByCode,
  joinProjectBySupervisorCode,
  generateProjectSupervisorJoinCode,
  listProjectsForUser,
  removeProjectMember,
  getProjectForUser,
  setProjectSupervisor,
  updateProjectForUser,
} from "@/lib/projects";
import {
  createManuscript as createManuscriptLib,
  deleteManuscript as deleteManuscriptLib,
  updateManuscript as updateManuscriptLib,
} from "@/lib/manuscripts";
import {
  archiveProjectRecord,
  forkRecordAsVariant,
  forkRecordAsVersion,
  hardDeleteProjectRecord,
  insertProjectRecord,
  restoreProjectRecord,
  getProjectRecordById,
  updateProjectRecord,
} from "@/lib/repositories";
import {
  budgetLineItemInputSchema,
  budgetPeriodInputSchema,
  loginInputSchema,
  milestoneInputSchema,
  taskInputSchema,
  timeEntryInputSchema,
  openScienceUpdateInputSchema,
  profileInputSchema,
  projectInputSchema,
  projectInvitationInputSchema,
  projectRecordInputSchema,
  processingStatuses,
  purchaseRequestInputSchema,
  registerInputSchema,
  researchStageInputSchema,
  researchPublicationInputSchema,
  researchDeliverableInputSchema,
  experimentInputSchema,
  experimentStatuses,
  reportInputSchema,
  reportStatuses,
  teamMessageInputSchema,
  researchEventInputSchema,
  eventParticipationInputSchema,
  submissionItemSchema,
  participationStatuses,
  eventStatuses,
  type Project,
  type ProjectRecord,
  type ProjectRecordInput,
  type SafeUser,
  type DissertationMeta,
  type ManuscriptAuthor,
  type ManuscriptBlock,
  type ManuscriptInput,
  type ManuscriptStatus,
  type ManuscriptType,
  diaryEntryInputSchema,
} from "@/lib/schemas";
import {
  createDiaryEntry as createDiaryEntryLib,
  updateDiaryEntry as updateDiaryEntryLib,
  deleteDiaryEntry as deleteDiaryEntryLib,
} from "@/lib/diary";
import { createSession, destroySession } from "@/lib/session";
import { createTeamMessage, toggleStarMessage as toggleStarMessageLib, setPinTeamMessage } from "@/lib/team";
import { createNotificationsForUsers, type NotificationType } from "@/lib/notifications";
import { createUser, findUserByEmail, listSafeUsersByIds, updateUserProfile, updateUserPassword } from "@/lib/users";
import { createPasswordResetToken, consumeToken } from "@/lib/password-reset";
import { UploadPolicyError } from "@/lib/file-storage";
import { writePrefs, type UserPrefs } from "@/lib/prefs";
import { PROJECT_TEMPLATES, buildTemplateDates, type TemplateId } from "@/lib/project-templates";
import { assertRateLimit, RateLimitError } from "@/lib/rate-limit";
import {
  checkZenodoStatus,
  createNewZenodoVersion,
  publishRecordToZenodo,
  syncRecordFilesToZenodo,
  syncRecordMetadataToZenodo,
  validateZenodoPublishReadiness,
} from "@/lib/zenodo";

// ── Notification helpers ───────────────────────────────────────────────────────

async function notifyProjectMembers(
  project: Project,
  actor: SafeUser,
  type: NotificationType,
  title: string,
  body: string,
  link?: string,
) {
  const memberIds = [
    project.ownerId,
    project.supervisorId,
    ...(project.memberIds ?? []),
  ].filter((id): id is string => Boolean(id));

  await createNotificationsForUsers(memberIds, {
    userId: "", // overridden per-user in createNotificationsForUsers
    actorId: actor._id ?? "",
    actorName: [actor.firstName, actor.lastName].filter(Boolean).join(" ") || actor.email,
    type,
    title,
    body,
    projectId: project._id,
    projectName: project.title,
    link,
  });
}

// ─────────────────────────────────────────────────────────────────────────────

function formLocale(formData: FormData) {
  const localeValue = formData.get("locale");

  return typeof localeValue === "string" && isLocale(localeValue)
    ? localeValue
    : "uk";
}

function safeAppReturnTo(formData: FormData, locale: string, fallback: string) {
  const returnTo = formData.get("returnTo");

  return typeof returnTo === "string" && returnTo.startsWith(`/${locale}/app`)
    ? returnTo
    : fallback;
}

function withQuery(path: string, key: string, value: string) {
  return `${path}${path.includes("?") ? "&" : "?"}${key}=${encodeURIComponent(value)}`;
}

function parseCreators(formData: FormData) {
  const creators: { name: string; nameEn: string; affiliation: string; orcid: string }[] = [];
  for (let i = 0; i < 20; i++) {
    const name = (formData.get(`creator_name_${i}`) as string | null)?.trim();
    if (!name) break;
    creators.push({
      name,
      nameEn: (formData.get(`creator_nameEn_${i}`) as string | null)?.trim() ?? "",
      affiliation: (formData.get(`creator_affiliation_${i}`) as string | null)?.trim() ?? "",
      orcid: (formData.get(`creator_orcid_${i}`) as string | null)?.trim() ?? "",
    });
  }
  return creators;
}

function parseContributors(formData: FormData) {
  const contributors: { name: string; nameEn: string; affiliation: string; orcid: string; role: string }[] = [];
  for (let i = 0; i < 20; i++) {
    const name = (formData.get(`contributor_name_${i}`) as string | null)?.trim();
    if (!name) break;
    contributors.push({
      name,
      nameEn: (formData.get(`contributor_nameEn_${i}`) as string | null)?.trim() ?? "",
      affiliation: (formData.get(`contributor_affiliation_${i}`) as string | null)?.trim() ?? "",
      orcid: (formData.get(`contributor_orcid_${i}`) as string | null)?.trim() ?? "",
      role: (formData.get(`contributor_role_${i}`) as string | null)?.trim() ?? "Other",
    });
  }
  return contributors;
}

function parseRelatedIdentifiers(formData: FormData) {
  const ids: { identifier: string; scheme: string; relation: string }[] = [];
  for (let i = 0; i < 20; i++) {
    const identifier = (formData.get(`related_identifier_${i}`) as string | null)?.trim();
    if (!identifier) break;
    ids.push({
      identifier,
      scheme: (formData.get(`related_scheme_${i}`) as string | null)?.trim() ?? "doi",
      relation: (formData.get(`related_relation_${i}`) as string | null)?.trim() ?? "References",
    });
  }
  return ids;
}

export async function createRecord(formData: FormData) {
  const locale = formLocale(formData);
  const returnTo = safeAppReturnTo(formData, locale, `/${locale}/app`);
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  const creators = parseCreators(formData);
  const contributors = parseContributors(formData);
  const relatedIdentifiers = parseRelatedIdentifiers(formData);

  const payload = {
    projectId: formData.get("projectId"),
    kind: formData.get("kind"),
    localId: formData.get("localId"),
    title: formData.get("title"),
    stage: formData.get("stage"),
    group: formData.get("group") || "",
    dataFormat: formData.get("dataFormat") || "",
    version: formData.get("version") || "",
    rootRecordId: formData.get("rootRecordId") || "",
    parentVersionId: formData.get("parentVersionId") || "",
    variantLabel: formData.get("variantLabel") || "",
    versionNote: formData.get("versionNote") || "",
    access: formData.get("access"),
    owner: formData.get("owner"),
    repository: formData.get("repository"),
    summary: formData.get("summary") || "",
    usageNotes: formData.get("usageNotes") || "",
    keywords: formData.get("keywords") || "",
    license: formData.get("license") || "",
    doi: formData.get("doi") || "",
    processingStatus: formData.get("processingStatus") || "raw",
    tags: ((formData.get("tags") as string) || "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    linkedPublicationIds: [],
    creators,
    language: formData.get("language") || "",
    embargoDate: formData.get("embargoDate") || "",
    dateCollectedFrom: formData.get("dateCollectedFrom") || "",
    dateCollectedTo: formData.get("dateCollectedTo") || "",
    fundingGrant: formData.get("fundingGrant") || "",
    subjects: ((formData.get("subjects") as string) || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    notes: formData.get("notes") || "",
    contributors,
    references: formData.get("references") as string || "",
    relatedIdentifiers,
    typedData: (() => {
      try { return JSON.parse((formData.get("typedData") as string) || "{}"); }
      catch { return {}; }
    })(),
  };
  const record = projectRecordInputSchema.parse(payload);
  const projects = await listProjectsForUser(user);

  if (!projects.some((project) => project._id === record.projectId)) {
    redirect(`/${locale}/app`);
  }

  const files = formData
    .getAll("files")
    .filter((value): value is File => value instanceof File && value.size > 0);

  const rawStatus = (formData.get("recordStatus") as string) ?? "planned";
  const initialStatus = (["planned", "active", "released"] as const).includes(rawStatus as never)
    ? (rawStatus as "planned" | "active" | "released")
    : "planned";
  try {
    await insertProjectRecord(record, files, user._id ?? "", initialStatus);
  } catch (error) {
    if (error instanceof UploadPolicyError) {
      redirect(withQuery(returnTo, "error", error.code.toLowerCase()));
    }
    throw error;
  }
  await createAuditEvent({ action: "record.created", actor: user, projectId: record.projectId, metadata: { title: record.title, localId: record.localId } });
  const createdProject = projects.find((p) => p._id === record.projectId);
  if (createdProject) {
    void notifyProjectMembers(
      createdProject, user, "record_created",
      `Новий запис: ${record.title}`,
      `${[user.firstName, user.lastName].filter(Boolean).join(" ") || user.email} додав(ла) ${record.kind} у проєкті «${createdProject.title}».`,
      returnTo,
    );
  }
  revalidatePath(`/${locale}/app`);
  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function createRecordVersion(formData: FormData) {
  const locale = formLocale(formData);
  const returnTo = safeAppReturnTo(formData, locale, `/${locale}/app`);
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);

  const sourceId = formData.get("sourceRecordId") as string;
  if (!sourceId) redirect(returnTo);

  const source = await getProjectRecordById(sourceId);
  if (!source) redirect(returnTo);

  const projects = await listProjectsForUser(user);
  if (!projects.some((p) => p._id === source.projectId)) redirect(`/${locale}/app`);

  const versionNote = (formData.get("versionNote") as string) || "";
  const version = (formData.get("version") as string) || "";
  const title = (formData.get("title") as string) || "";

  const forked = await forkRecordAsVersion(sourceId, { versionNote, version, title: title || undefined }, user._id ?? "");
  if (forked) {
    await createAuditEvent({ action: "record.versioned", actor: user, projectId: source.projectId, metadata: { sourceId, title: forked.title, localId: forked.localId } });
  }

  revalidatePath(`/${locale}/app`);
  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function createRecordVariant(formData: FormData) {
  const locale = formLocale(formData);
  const returnTo = safeAppReturnTo(formData, locale, `/${locale}/app`);
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);

  const sourceId = formData.get("sourceRecordId") as string;
  if (!sourceId) redirect(returnTo);

  const source = await getProjectRecordById(sourceId);
  if (!source) redirect(returnTo);

  const projects = await listProjectsForUser(user);
  if (!projects.some((p) => p._id === source.projectId)) redirect(`/${locale}/app`);

  const variantLabel = ((formData.get("variantLabel") as string) || "").trim();
  const versionNote = (formData.get("versionNote") as string) || "";
  const title = (formData.get("title") as string) || "";

  if (!variantLabel) redirect(returnTo);

  const forked = await forkRecordAsVariant(sourceId, variantLabel, { versionNote, title: title || undefined }, user._id ?? "");
  if (forked) {
    await createAuditEvent({ action: "record.variant_created", actor: user, projectId: source.projectId, metadata: { sourceId, variantLabel, localId: forked.localId } });
  }

  revalidatePath(`/${locale}/app`);
  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function updateRecord(formData: FormData) {
  const locale = formLocale(formData);
  const returnTo = safeAppReturnTo(formData, locale, `/${locale}/app`);
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);

  const id = formData.get("recordId") as string;
  if (!id) redirect(returnTo);

  const existing = await getProjectRecordById(id);
  if (!existing) redirect(returnTo);

  const projects = await listProjectsForUser(user);
  if (!projects.some((p) => p._id === existing.projectId)) redirect(`/${locale}/app`);

  // Parse indexed creators
  const creators = parseCreators(formData);
  const contributors = parseContributors(formData);
  const relatedIdentifiers = parseRelatedIdentifiers(formData);

  const subjectsRaw = (formData.get("subjects") as string | null)?.trim() ?? "";
  const subjects = subjectsRaw
    ? subjectsRaw.split("\n").map((s) => s.trim()).filter(Boolean)
    : existing.subjects ?? [];

  const patch: Partial<ProjectRecordInput> &
    Partial<Pick<ProjectRecord, "status" | "processingHistory">> = {
    kind: (formData.get("kind") as ProjectRecordInput["kind"]) || existing.kind,
    title: (formData.get("title") as string) || existing.title,
    stage: (formData.get("stage") as string) || existing.stage,
    group: (formData.get("group") as string) ?? existing.group,
    dataFormat: (formData.get("dataFormat") as string) ?? existing.dataFormat,
    version: (formData.get("version") as string) ?? existing.version,
    access: (formData.get("access") as ProjectRecordInput["access"]) || existing.access,
    owner: (formData.get("owner") as string) || existing.owner,
    repository: (formData.get("repository") as string) || existing.repository,
    summary: (formData.get("summary") as string) ?? existing.summary,
    usageNotes: (formData.get("usageNotes") as string) ?? existing.usageNotes,
    keywords: (formData.get("keywords") as string) ?? existing.keywords,
    license: (formData.get("license") as string) ?? existing.license,
    doi: (formData.get("doi") as string) ?? existing.doi,
    processingStatus: (formData.get("processingStatus") as ProjectRecordInput["processingStatus"]) || existing.processingStatus,
    tags: ((formData.get("tags") as string) || existing.tags.join(","))
      .split(",").map((t) => t.trim()).filter(Boolean),
    status: (formData.get("status") as ProjectRecord["status"]) || existing.status,
    creators: creators.length > 0 ? creators : (existing.creators ?? []),
    language: (formData.get("language") as string) ?? existing.language ?? "",
    embargoDate: (formData.get("embargoDate") as string) ?? existing.embargoDate ?? "",
    dateCollectedFrom: (formData.get("dateCollectedFrom") as string) ?? existing.dateCollectedFrom ?? "",
    dateCollectedTo: (formData.get("dateCollectedTo") as string) ?? existing.dateCollectedTo ?? "",
    fundingGrant: (formData.get("fundingGrant") as string) ?? existing.fundingGrant ?? "",
    subjects,
    notes: (formData.get("notes") as string) ?? existing.notes ?? "",
    contributors: (contributors.length > 0 ? contributors : (existing.contributors ?? [])) as ProjectRecordInput["contributors"],
    references: (formData.get("references") as string) ?? existing.references ?? "",
    relatedIdentifiers: (relatedIdentifiers.length > 0 ? relatedIdentifiers : (existing.relatedIdentifiers ?? [])) as ProjectRecordInput["relatedIdentifiers"],
    typedData: (() => {
      try { return JSON.parse((formData.get("typedData") as string) || "{}"); }
      catch { return existing.typedData ?? {}; }
    })(),
  };
  if (
    patch.processingStatus &&
    patch.processingStatus !== existing.processingStatus
  ) {
    patch.processingHistory = [
      ...existing.processingHistory,
      {
        status: patch.processingStatus,
        changedAt: new Date(),
        changedBy: user._id ?? user.email,
        note: String(formData.get("lifecycleNote") ?? ""),
      },
    ];
  }

  await updateProjectRecord(id, patch);
  await createAuditEvent({
    action: "record.updated",
    actor: user,
    projectId: existing.projectId,
    metadata: { recordId: id, title: existing.title, localId: existing.localId },
  });
  revalidatePath(`/${locale}/app`);
  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function changeRecordProcessingStatus(formData: FormData) {
  const locale = formLocale(formData);
  const returnTo = safeAppReturnTo(formData, locale, `/${locale}/app`);
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);

  const recordId = String(formData.get("recordId") ?? "");
  const nextStatus = String(formData.get("processingStatus") ?? "");
  const note = String(formData.get("note") ?? "").slice(0, 600);
  if (!recordId || !processingStatuses.includes(nextStatus as ProjectRecordInput["processingStatus"])) {
    redirect(returnTo);
  }

  const record = await getProjectRecordById(recordId);
  if (!record) redirect(returnTo);

  const projects = await listProjectsForUser(user);
  if (!projects.some((project) => project._id === record.projectId)) {
    redirect(returnTo);
  }

  const processingStatus = nextStatus as ProjectRecordInput["processingStatus"];
  if (processingStatus !== record.processingStatus) {
    const processingHistory = [
      ...record.processingHistory,
      {
        status: processingStatus,
        changedAt: new Date(),
        changedBy: user._id ?? user.email,
        note,
      },
    ];

    await updateProjectRecord(recordId, {
      processingStatus,
      processingHistory,
      status: processingStatus === "published" ? "released" : record.status,
    });
    await createAuditEvent({
      action: "record.processing_status.changed",
      actor: user,
      projectId: record.projectId,
      metadata: {
        recordId,
        from: record.processingStatus,
        to: processingStatus,
        title: record.title,
      },
    });
  }

  revalidatePath(`/${locale}/app`);
  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function addRecordProcessingNote(formData: FormData) {
  const locale = formLocale(formData);
  const returnTo = safeAppReturnTo(formData, locale, `/${locale}/app`);
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);

  const recordId = String(formData.get("recordId") ?? "");
  const note = String(formData.get("note") ?? "").trim().slice(0, 600);
  if (!recordId || !note) redirect(returnTo);

  const record = await getProjectRecordById(recordId);
  if (!record) redirect(returnTo);

  const projects = await listProjectsForUser(user);
  if (!projects.some((project) => project._id === record.projectId)) {
    redirect(returnTo);
  }

  await updateProjectRecord(recordId, {
    processingHistory: [
      ...record.processingHistory,
      {
        status: record.processingStatus,
        changedAt: new Date(),
        changedBy: user._id ?? user.email,
        note,
      },
    ],
  });
  await createAuditEvent({
    action: "record.processing_status.changed",
    actor: user,
    projectId: record.projectId,
    metadata: {
      recordId,
      status: record.processingStatus,
      noteOnly: "true",
      title: record.title,
    },
  });

  revalidatePath(`/${locale}/app`);
  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function prepareRecordForOpenScience(formData: FormData) {
  const locale = formLocale(formData);
  const returnTo = safeAppReturnTo(formData, locale, `/${locale}/app`);
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);

  const recordId = String(formData.get("recordId") ?? "");
  const record = await getProjectRecordById(recordId);
  if (!record) redirect(withQuery(returnTo, "error", "record"));

  const projects = await listProjectsForUser(user);
  if (!projects.some((project) => project._id === record.projectId)) {
    redirect(withQuery(returnTo, "error", "project"));
  }

  if (record.processingStatus !== "published") {
    redirect(withQuery(returnTo, "error", "record_not_published"));
  }

  const linkedRecordIds = record._id ? [record._id] : [];
  const status: "draft" | "published" = record.access === "open" ? "published" : "draft";
  const title = String(formData.get("publicTitle") ?? record.title).trim() || record.title;
  const summary =
    String(formData.get("publicSummary") ?? record.summary).trim() ||
    record.summary ||
    `${record.localId}: ${record.dataFormat || "mixed"} dataset.`;
  const defaultContent = [
    record.usageNotes,
    record.rawDataFiles.length > 0
      ? `Файли: ${record.rawDataFiles.map((file) => file.name).join(", ")}`
      : "",
    record.doi ? `DOI: ${record.doi}` : "",
  ].filter(Boolean).join("\n\n");
  const content = String(formData.get("publicContent") ?? defaultContent).trim();
  const publicUrl =
    String(formData.get("publicUrl") ?? "").trim() ||
    record.zenodoUrl ||
    record.zenodoDraftUrl ||
    (record.zenodoConceptDoi ? `https://doi.org/${record.zenodoConceptDoi}` : "") ||
    (record.doi ? (record.doi.startsWith("http") ? record.doi : `https://doi.org/${record.doi}`) : "");
  const accessibilityNotes =
    String(formData.get("accessibilityNotes") ?? record.usageNotes).trim() ||
    record.usageNotes ||
    "";
  const license = String(formData.get("license") ?? record.license).trim() || record.license || "";
  const generated = {
    projectId: record.projectId,
    category: "data_repository" as const,
    title,
    summary,
    content,
    publicUrl,
    accessibilityNotes,
    license,
    status,
    linkedRecordIds,
  };

  const existing = record._id
    ? await getOpenScienceUpdateByLinkedRecord(record.projectId, record._id)
    : null;

  if (existing?._id) {
    await updateOpenScienceUpdate(existing._id, generated, user);
    await createAuditEvent({
      action: "open_science.updated",
      actor: user,
      projectId: record.projectId,
      metadata: { updateId: existing._id, recordId, title: record.title, status },
    });
  } else {
    const created = await createOpenScienceUpdate(generated, user);
    await createAuditEvent({
      action: "open_science.created",
      actor: user,
      projectId: record.projectId,
      metadata: { updateId: created._id ?? "", recordId, title: record.title, status },
    });
  }

  if (record.status !== "released") {
    await updateProjectRecord(recordId, { status: "released" });
  }

  revalidatePath(`/${locale}/open-science`);
  revalidatePath(`/${locale}/app/open-science`);
  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function syncRecordZenodoDraft(formData: FormData) {
  const locale = formLocale(formData);
  const returnTo = safeAppReturnTo(formData, locale, `/${locale}/app`);
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);

  const recordId = String(formData.get("recordId") ?? "");
  const record = await getProjectRecordById(recordId);
  if (!record) redirect(withQuery(returnTo, "error", "record"));

  const projects = await listProjectsForUser(user);
  if (!projects.some((project) => project._id === record.projectId)) {
    redirect(withQuery(returnTo, "error", "project"));
  }

  try {
    const updated = await syncRecordMetadataToZenodo(record, user);
    await createAuditEvent({
      action: "zenodo.draft.synced",
      actor: user,
      projectId: record.projectId,
      metadata: {
        recordId,
        depositionId: String(updated.zenodoDepositionId ?? ""),
        doi: updated.zenodoDoi || updated.zenodoConceptDoi || updated.doi,
      },
    });
  } catch (error) {
    await createAuditEvent({
      action: "zenodo.draft.sync_failed",
      actor: user,
      projectId: record.projectId,
      metadata: {
        recordId,
        error: error instanceof Error ? error.message : "Unknown Zenodo error",
      },
    });
    redirect(withQuery(returnTo, "error", "zenodo"));
  }

  revalidatePath(`/${locale}/open-science`);
  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function syncRecordZenodoFiles(formData: FormData) {
  const locale = formLocale(formData);
  const returnTo = safeAppReturnTo(formData, locale, `/${locale}/app`);
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);

  const recordId = String(formData.get("recordId") ?? "");
  const record = await getProjectRecordById(recordId);
  if (!record) redirect(withQuery(returnTo, "error", "record"));

  const projects = await listProjectsForUser(user);
  if (!projects.some((project) => project._id === record.projectId)) {
    redirect(withQuery(returnTo, "error", "project"));
  }

  try {
    const updated = await syncRecordFilesToZenodo(record, user);
    await createAuditEvent({
      action: "zenodo.files.synced",
      actor: user,
      projectId: record.projectId,
      metadata: {
        recordId,
        depositionId: String(updated.zenodoDepositionId ?? ""),
        fileCount: String(updated.zenodoFileCount ?? 0),
      },
    });
  } catch (error) {
    await createAuditEvent({
      action: "zenodo.files.sync_failed",
      actor: user,
      projectId: record.projectId,
      metadata: {
        recordId,
        error: error instanceof Error ? error.message : "Unknown Zenodo error",
      },
    });
    redirect(withQuery(returnTo, "error", "zenodo_files"));
  }

  revalidatePath(`/${locale}/open-science`);
  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function publishRecordZenodo(formData: FormData) {
  const locale = formLocale(formData);
  const returnTo = safeAppReturnTo(formData, locale, `/${locale}/app`);
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);

  const recordId = String(formData.get("recordId") ?? "");
  const confirmed = String(formData.get("confirmPublish") ?? "") === "yes";
  if (!confirmed) redirect(withQuery(returnTo, "error", "zenodo_confirm"));

  const record = await getProjectRecordById(recordId);
  if (!record) redirect(withQuery(returnTo, "error", "record"));

  const projects = await listProjectsForUser(user);
  if (!projects.some((project) => project._id === record.projectId)) {
    redirect(withQuery(returnTo, "error", "project"));
  }

  const readiness = validateZenodoPublishReadiness(record);
  if (!readiness.ready) {
    redirect(withQuery(returnTo, "error", "zenodo_not_ready"));
  }

  try {
    const updated = await publishRecordToZenodo(record, user);
    await createAuditEvent({
      action: "zenodo.record.published",
      actor: user,
      projectId: record.projectId,
      metadata: {
        recordId,
        depositionId: String(updated.zenodoDepositionId ?? ""),
        doi: updated.zenodoDoi || updated.zenodoConceptDoi || updated.doi,
      },
    });
    const zenodoProject = projects.find((p) => p._id === record.projectId);
    const doi = updated.zenodoDoi || updated.zenodoConceptDoi || updated.doi;
    if (zenodoProject) {
      void notifyProjectMembers(
        zenodoProject, user, "zenodo_published",
        `Опубліковано на Zenodo: ${record.title}`,
        `DOI: ${doi || "зарезервовано"}. Запис тепер у відкритому доступі.`,
        doi ? `https://doi.org/${doi}` : updated.zenodoUrl,
      );
    }
  } catch (error) {
    await createAuditEvent({
      action: "zenodo.record.publish_failed",
      actor: user,
      projectId: record.projectId,
      metadata: {
        recordId,
        error: error instanceof Error ? error.message : "Unknown Zenodo error",
      },
    });
    redirect(withQuery(returnTo, "error", "zenodo_publish"));
  }

  revalidatePath(`/${locale}/open-science`);
  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function createZenodoNewVersion(formData: FormData) {
  const locale = formLocale(formData);
  const returnTo = safeAppReturnTo(formData, locale, `/${locale}/app`);
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);

  const recordId = formData.get("recordId") as string;
  if (!recordId) redirect(returnTo);

  const record = await getProjectRecordById(recordId);
  if (!record) redirect(returnTo);

  const projects = await listProjectsForUser(user);
  if (!projects.some((p) => p._id === record.projectId)) redirect(`/${locale}/app`);

  try {
    const updated = await createNewZenodoVersion(record, user);
    await createAuditEvent({
      action: "zenodo.draft.synced",
      actor: user,
      projectId: record.projectId,
      metadata: {
        recordId,
        depositionId: String(updated.zenodoDepositionId ?? ""),
        doi: updated.zenodoDoi || updated.zenodoConceptDoi || updated.doi,
        note: "new version created",
      },
    });
  } catch {
    redirect(withQuery(returnTo, "error", "zenodo_newversion"));
  }

  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function checkRecordZenodoStatus(formData: FormData) {
  const locale = formLocale(formData);
  const returnTo = safeAppReturnTo(formData, locale, `/${locale}/app`);
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);

  const recordId = formData.get("recordId") as string;
  if (!recordId) redirect(returnTo);

  const record = await getProjectRecordById(recordId);
  if (!record) redirect(returnTo);

  const projects = await listProjectsForUser(user);
  if (!projects.some((p) => p._id === record.projectId)) redirect(`/${locale}/app`);

  try {
    const result = await checkZenodoStatus(record);
    await createAuditEvent({
      action: result.deleted ? "zenodo.status.deleted" : "zenodo.status.checked",
      actor: user,
      projectId: record.projectId,
      metadata: {
        recordId,
        depositionId: String(record.zenodoDepositionId ?? ""),
        deleted: String(result.deleted),
      },
    });
  } catch {
    redirect(withQuery(returnTo, "error", "zenodo"));
  }

  revalidatePath(returnTo);
  revalidatePath(`/${locale}/open-science`);
  redirect(returnTo);
}

export async function archiveRecord(formData: FormData) {
  const locale = formLocale(formData);
  const returnTo = safeAppReturnTo(formData, locale, `/${locale}/app`);
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);

  const id = String(formData.get("recordId") ?? "");
  const record = await getProjectRecordById(id);
  if (!record) redirect(returnTo);

  const projects = await listProjectsForUser(user);
  if (!projects.some((p) => p._id === record.projectId)) redirect(returnTo);

  await archiveProjectRecord(id);
  await createAuditEvent({ action: "record.archived", actor: user, projectId: record.projectId, metadata: { recordId: id, title: record.title } });
  const archivedProject = projects.find((p) => p._id === record.projectId);
  if (archivedProject) {
    void notifyProjectMembers(
      archivedProject, user, "record_archived",
      `Запис архівовано: ${record.title}`,
      `${[user.firstName, user.lastName].filter(Boolean).join(" ") || user.email} архівував(ла) запис у проєкті «${archivedProject.title}».`,
    );
  }
  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function restoreRecord(formData: FormData) {
  const locale = formLocale(formData);
  const returnTo = safeAppReturnTo(formData, locale, `/${locale}/app`);
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);

  const id = String(formData.get("recordId") ?? "");
  const record = await getProjectRecordById(id);
  if (!record) redirect(returnTo);

  const projects = await listProjectsForUser(user);
  if (!projects.some((p) => p._id === record.projectId)) redirect(returnTo);

  await restoreProjectRecord(id);
  await createAuditEvent({ action: "record.restored", actor: user, projectId: record.projectId, metadata: { recordId: id, title: record.title } });
  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function deleteRecord(formData: FormData) {
  const locale = formLocale(formData);
  const returnTo = safeAppReturnTo(formData, locale, `/${locale}/app`);
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);

  const id = String(formData.get("recordId") ?? "");
  const record = await getProjectRecordById(id);
  if (!record) redirect(returnTo);

  const projects = await listProjectsForUser(user);
  if (!projects.some((p) => p._id === record.projectId)) redirect(returnTo);

  // Only allow hard-delete if already archived
  if (!record.archivedAt) redirect(returnTo);

  await hardDeleteProjectRecord(id);
  await createAuditEvent({ action: "record.deleted", actor: user, projectId: record.projectId, metadata: { recordId: id, title: record.title, localId: record.localId } });
  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function register(formData: FormData) {
  const locale = formLocale(formData);
  try {
    await assertRateLimit("auth:register", { limit: 5, windowMs: 15 * 60 * 1000 });
  } catch (error) {
    if (error instanceof RateLimitError) redirect(`/${locale}/register?error=rate_limited`);
    throw error;
  }
  const payload = registerInputSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    firstNameLatin: formData.get("firstNameLatin"),
    lastNameLatin: formData.get("lastNameLatin"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!payload.success) {
    redirect(`/${locale}/register?error=invalid`);
  }

  try {
    const user = await createUser(payload.data);

    if (!user._id) {
      redirect(`/${locale}/register?error=server`);
    }

    await createSession(user._id, user.role, false, user.sessionVersion);
  } catch (error) {
    if (error instanceof Error && error.message === "USER_EXISTS") {
      redirect(`/${locale}/register?error=exists`);
    }

    redirect(`/${locale}/register?error=server`);
  }

  redirect(`/${locale}/app`);
}

export async function saveOpenScienceUpdate(formData: FormData) {
  const locale = formLocale(formData);
  const returnTo = safeAppReturnTo(formData, locale, `/${locale}/app`);
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);

  const linkedRaw = formData.getAll("linkedRecordIds") as string[];
  const payload = openScienceUpdateInputSchema.safeParse({
    projectId: formData.get("projectId"),
    category: formData.get("category") || "updates",
    title: formData.get("title"),
    summary: formData.get("summary") || "",
    content: formData.get("content") || "",
    publicUrl: formData.get("publicUrl") || "",
    accessibilityNotes: formData.get("accessibilityNotes") || "",
    license: formData.get("license") || "",
    status: formData.get("status") === "published" ? "published" : "draft",
    linkedRecordIds: linkedRaw.filter(Boolean),
  });

  if (!payload.success) redirect(withQuery(returnTo, "error", "invalid"));

  const projects = await listProjectsForUser(user);
  if (!projects.some((project) => project._id === payload.data.projectId)) {
    redirect(withQuery(returnTo, "error", "project"));
  }

  const updateId = formData.get("updateId") as string | null;
  if (updateId) {
    await updateOpenScienceUpdate(updateId, payload.data, user);
    await createAuditEvent({ action: "open_science.updated", actor: user, projectId: payload.data.projectId, metadata: { updateId, title: payload.data.title, status: payload.data.status } });
  } else {
    const created = await createOpenScienceUpdate(payload.data, user);
    await createAuditEvent({ action: "open_science.created", actor: user, projectId: payload.data.projectId, metadata: { updateId: created._id ?? "", title: payload.data.title, status: payload.data.status } });
  }

  revalidatePath(`/${locale}/open-science`);
  revalidatePath(`/${locale}/app/open-science`);
  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function deleteOpenScienceUpdate(formData: FormData) {
  const locale = formLocale(formData);
  const returnTo = safeAppReturnTo(formData, locale, `/${locale}/app`);
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);

  const updateId = formData.get("updateId") as string;
  if (!updateId) redirect(returnTo);

  const projectId = formData.get("projectId") as string;
  const projects = await listProjectsForUser(user);
  if (!projects.some((p) => p._id === projectId)) redirect(`/${locale}/app`);

  await deleteOpenScienceUpdateLib(updateId);
  await createAuditEvent({ action: "open_science.deleted", actor: user, projectId, metadata: { updateId } });
  revalidatePath(`/${locale}/open-science`);
  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function postTeamMessage(formData: FormData) {
  const locale = formLocale(formData);
  const returnTo = safeAppReturnTo(formData, locale, `/${locale}/app/team`);
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  const rawLabel = formData.get("label");
  const payload = teamMessageInputSchema.safeParse({
    projectId: formData.get("projectId"),
    body: formData.get("body"),
    topic: formData.get("topic") || "general",
    label: rawLabel && rawLabel !== "" ? rawLabel : null,
  });

  if (!payload.success) {
    redirect(withQuery(returnTo, "error", "invalid"));
  }

  const projects = await listProjectsForUser(user);
  const project = projects.find((p) => p._id === payload.data.projectId);

  if (!project) {
    redirect(withQuery(returnTo, "error", "project"));
  }

  await createTeamMessage(payload.data, user);

  const actorName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email;
  const topic = payload.data.topic === "general"
    ? (locale === "uk" ? "Загальне" : "General")
    : payload.data.topic;
  const recipientIds = [...new Set([project.ownerId, project.supervisorId, ...project.memberIds])];
  void createNotificationsForUsers(recipientIds, {
    userId: "",
    actorId: user._id ?? "",
    actorName,
    type: "team_message_posted",
    title: `${actorName} — #${topic}`,
    body: payload.data.body.slice(0, 120),
    projectId: project._id,
    projectName: project.acronym,
    link: `/${locale}/app/project?projectId=${project._id}&tab=team`,
  });

  revalidatePath(`/${locale}/app/team`);
  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function toggleStarMessage(formData: FormData) {
  const locale = formLocale(formData);
  const returnTo = safeAppReturnTo(formData, locale, `/${locale}/app/team`);
  const user = await getCurrentUser();
  if (!user?._id) redirect(`/${locale}/login`);

  const messageId = formData.get("messageId");
  if (typeof messageId !== "string") redirect(returnTo);

  await toggleStarMessageLib(messageId, user._id);
  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function pinTeamMessage(formData: FormData) {
  const locale = formLocale(formData);
  const returnTo = safeAppReturnTo(formData, locale, `/${locale}/app/team`);
  const user = await getCurrentUser();
  if (!user?._id) redirect(`/${locale}/login`);

  const messageId = formData.get("messageId");
  const pinned = formData.get("pinned") === "true";
  if (typeof messageId !== "string") redirect(returnTo);

  await setPinTeamMessage(messageId, pinned);
  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function generateSupervisorJoinCode(formData: FormData) {
  const locale = formLocale(formData);
  const returnTo = safeAppReturnTo(formData, locale, `/${locale}/app`);
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);

  const projectId = formData.get("projectId");
  if (typeof projectId !== "string") redirect(returnTo);

  try {
    await generateProjectSupervisorJoinCode(projectId, user);
  } catch {
    redirect(withQuery(returnTo, "error", "forbidden"));
  }

  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function login(formData: FormData) {
  const locale = formLocale(formData);
  const remember = formData.get("rememberMe") === "on";
  try {
    await assertRateLimit("auth:login", { limit: 10, windowMs: 15 * 60 * 1000 });
  } catch (error) {
    if (error instanceof RateLimitError) redirect(`/${locale}/login?error=rate_limited`);
    throw error;
  }

  const payload = loginInputSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!payload.success) {
    await assertRateLimit("auth:login:failed", { limit: 5, windowMs: 15 * 60 * 1000 }).catch(() => undefined);
    redirect(`/${locale}/login?error=invalid`);
  }

  const user = await findUserByEmail(payload.data.email);

  if (!user) {
    await assertRateLimit(`auth:login:failed:${payload.data.email}`, { limit: 5, windowMs: 15 * 60 * 1000 }).catch(() => undefined);
    redirect(`/${locale}/login?error=invalid`);
  }

  const isValidPassword = await verifyPassword(
    payload.data.password,
    user.passwordHash,
  );

  if (!isValidPassword || !user._id) {
    await assertRateLimit(`auth:login:failed:${payload.data.email}`, { limit: 5, windowMs: 15 * 60 * 1000 }).catch(() => undefined);
    redirect(`/${locale}/login?error=invalid`);
  }

  await createSession(user._id, user.role, remember, user.sessionVersion);
  redirect(`/${locale}/app`);
}

export async function savePrefs(formData: FormData) {
  const locale = formLocale(formData);
  const returnTo = safeAppReturnTo(formData, locale, `/${locale}/app/settings`);
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);

  const partial: Partial<UserPrefs> = {
    theme: formData.get("theme") === "soft" ? "soft" : "light",
    compact: formData.get("compact") === "on",
    notifications: formData.get("notifications") !== "off",
  };

  await writePrefs(partial);
  redirect(withQuery(returnTo, "saved", "prefs"));
}

export async function logout(formData: FormData) {
  const locale = formLocale(formData);
  await destroySession();
  redirect(`/${locale}`);
}

export async function requestPasswordReset(formData: FormData) {
  const locale = formLocale(formData);
  try {
    await assertRateLimit("auth:password-reset", { limit: 5, windowMs: 15 * 60 * 1000 });
  } catch (error) {
    if (error instanceof RateLimitError) redirect(`/${locale}/forgot-password?error=rate_limited`);
    throw error;
  }
  const email = (formData.get("email") as string | null)?.trim().toLowerCase() ?? "";

  if (!email) {
    redirect(`/${locale}/forgot-password?error=invalid`);
  }

  // Always redirect with "sent" to avoid email enumeration — but only create
  // a token when the user actually exists.
  const user = await findUserByEmail(email);
  if (user) {
    try {
      await createPasswordResetToken(email);
    } catch {
      // ignore — don't leak errors
    }
  }

  redirect(`/${locale}/forgot-password?sent=1`);
}

export async function resetPassword(formData: FormData) {
  const locale = formLocale(formData);
  try {
    await assertRateLimit("auth:reset-password", { limit: 5, windowMs: 15 * 60 * 1000 });
  } catch (error) {
    if (error instanceof RateLimitError) redirect(`/${locale}/reset-password?error=rate_limited`);
    throw error;
  }
  const token = (formData.get("token") as string | null) ?? "";
  const password = (formData.get("password") as string | null) ?? "";

  if (!token || password.length < 8) {
    redirect(`/${locale}/reset-password?token=${encodeURIComponent(token)}&error=invalid`);
  }

  const email = await consumeToken(token);
  if (!email) {
    redirect(`/${locale}/reset-password?token=${encodeURIComponent(token)}&error=expired`);
  }

  const { hashPassword } = await import("@/lib/passwords");
  const newHash = await hashPassword(password);
  const ok = await updateUserPassword(email, newHash);

  if (!ok) {
    redirect(`/${locale}/reset-password?token=${encodeURIComponent(token)}&error=server`);
  }

  redirect(`/${locale}/login?notice=password_reset`);
}

export async function createProject(formData: FormData) {
  const locale = formLocale(formData);
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  const payload = projectPayloadFromForm(formData);

  if (!payload.success) {
    redirect(`/${locale}/projects/new?error=invalid`);
  }

  const project = await createProjectForUser(payload.data, user);
  await createAuditEvent({
    action: "project.created",
    actor: user,
    projectId: project._id,
    metadata: { acronym: project.acronym },
  });
  revalidatePath(`/${locale}/app`);
  redirect(`/${locale}/app`);
}

// ── Project Wizard: create project + seed template ────────────────────────────

export async function createProjectWithTemplate(formData: FormData) {
  const locale = formLocale(formData);
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);

  const payload = projectPayloadFromForm(formData);
  if (!payload.success) redirect(`/${locale}/projects/new?error=invalid`);

  const project = await createProjectForUser(payload.data, user);
  await createAuditEvent({
    action: "project.created",
    actor: user,
    projectId: project._id,
    metadata: { acronym: project.acronym, wizard: "true" },
  });

  // Seed template stages + milestones
  const templateId = (formData.get("template") as TemplateId) ?? "empty";
  const template = PROJECT_TEMPLATES[templateId];
  const projectStart = payload.data.startDate || new Date().toISOString().slice(0, 10);

  if (template && template.stages.length > 0) {
    const dates = buildTemplateDates(template, projectStart);

    const useEn = locale !== "uk";

    for (let i = 0; i < template.stages.length; i++) {
      const s = template.stages[i];
      const d = dates[i];

      const stageTitle = useEn ? s.titleEn : s.title;
      const stageGoals = useEn ? (s.goalsEn ?? s.goals) : s.goals;
      const milestoneTitle = useEn ? s.milestoneTitleEn : s.milestoneTitle;

      // Create milestone first so we can link it to the stage
      const milestone = await createMilestone(
        {
          projectId: project._id ?? "",
          title: milestoneTitle,
          description: "",
          dueDate: d.milestoneDate,
        },
        user,
      );

      await createResearchStage(
        {
          projectId: project._id ?? "",
          stageNumber: s.stageNumber,
          title: stageTitle,
          goals: stageGoals,
          tasksText: "",
          startDate: d.startDate,
          endDate: d.endDate,
          indicators: "",
          budget: 0,
          currency: "UAH",
          linkedMilestoneId: milestone._id ?? "",
          progress: 0,
        },
        user,
      );
    }
  }

  revalidatePath(`/${locale}/app`);
  redirect(
    `/${locale}/app/research-plan?projectId=${project._id}&tab=timeline`,
  );
}

function projectPayloadFromForm(formData: FormData) {
  return projectInputSchema.safeParse({
    title: formData.get("title"),
    acronym: formData.get("acronym"),
    summary: formData.get("summary") || "",
    projectType: formData.get("projectType"),
    researchField: formData.get("researchField"),
    grantProgram: formData.get("grantProgram"),
    startDate: formData.get("startDate") || "",
    endDate: formData.get("endDate") || "",
    defaultLocale: formData.get("defaultLocale"),
    visibility: formData.get("visibility"),
    dataPolicy: formData.get("dataPolicy"),
    repositoryPlan: formData.get("repositoryPlan"),
    ethicsReview: formData.get("ethicsReview"),
    hasHumanData: formData.has("hasHumanData"),
    hasAnimalData: formData.has("hasAnimalData"),
    hasPersonalData: formData.has("hasPersonalData"),
    openScienceEnabled: formData.has("openScienceEnabled"),
    teamChatEnabled: formData.has("teamChatEnabled"),
    taskManagementEnabled: formData.has("taskManagementEnabled"),
    rawDataRegistryEnabled: formData.has("rawDataRegistryEnabled"),
  });
}

export async function updateProjectSettings(formData: FormData) {
  const locale = formLocale(formData);
  const user = await getCurrentUser();
  const projectId = formData.get("projectId");

  if (!user) {
    redirect(`/${locale}/login`);
  }

  if (typeof projectId !== "string") {
    redirect(`/${locale}/app`);
  }

  const payload = projectPayloadFromForm(formData);

  if (!payload.success) {
    redirect(`/${locale}/app/project-settings?projectId=${projectId}&error=invalid`);
  }

  try {
    await updateProjectForUser(projectId, payload.data, user);
    await createAuditEvent({
      action: "project.settings.updated",
      actor: user,
      projectId,
      metadata: { title: payload.data.title, acronym: payload.data.acronym },
    });
  } catch {
    redirect(`/${locale}/app/project-settings?projectId=${projectId}&error=forbidden`);
  }

  revalidatePath(`/${locale}/app`);
  revalidatePath(`/${locale}/app/project-settings`);
  redirect(`/${locale}/app/project-settings?projectId=${projectId}&saved=1`);
}

export async function addProjectMember(formData: FormData) {
  const locale = formLocale(formData);
  const user = await getCurrentUser();
  const projectId = formData.get("projectId");
  const email = formData.get("email");

  if (!user) {
    redirect(`/${locale}/login`);
  }

  if (typeof projectId !== "string" || typeof email !== "string") {
    redirect(`/${locale}/app`);
  }

  try {
    const member = await addProjectMemberByEmail(projectId, email, user);
    await createAuditEvent({
      action: "project.member.added",
      actor: user,
      projectId,
      targetUserId: member._id,
      targetEmail: member.email,
    });
  } catch (error) {
    const reason =
      error instanceof Error && error.message === "USER_NOT_FOUND"
        ? "user"
        : "forbidden";
    redirect(`/${locale}/app/project-settings?projectId=${projectId}&error=${reason}`);
  }

  revalidatePath(`/${locale}/app/team`);
  revalidatePath(`/${locale}/app/project-settings`);
  redirect(`/${locale}/app/project-settings?projectId=${projectId}&saved=member`);
}

export async function promoteProjectSupervisor(formData: FormData) {
  const locale = formLocale(formData);
  const user = await getCurrentUser();
  const projectId = formData.get("projectId");
  const supervisorId = formData.get("supervisorId");

  if (!user) {
    redirect(`/${locale}/login`);
  }

  if (typeof projectId !== "string" || typeof supervisorId !== "string") {
    redirect(`/${locale}/app`);
  }

  try {
    await setProjectSupervisor(projectId, supervisorId, user);
    await createAuditEvent({
      action: "project.supervisor.changed",
      actor: user,
      projectId,
      targetUserId: supervisorId,
    });
  } catch {
    redirect(`/${locale}/app/project-settings?projectId=${projectId}&error=forbidden`);
  }

  revalidatePath(`/${locale}/app/team`);
  revalidatePath(`/${locale}/app/project-settings`);
  redirect(`/${locale}/app/project-settings?projectId=${projectId}&saved=supervisor`);
}

export async function deleteProjectMember(formData: FormData) {
  const locale = formLocale(formData);
  const user = await getCurrentUser();
  const projectId = formData.get("projectId");
  const memberId = formData.get("memberId");

  if (!user) {
    redirect(`/${locale}/login`);
  }

  if (typeof projectId !== "string" || typeof memberId !== "string") {
    redirect(`/${locale}/app`);
  }

  try {
    await removeProjectMember(projectId, memberId, user);
    await createAuditEvent({
      action: "project.member.removed",
      actor: user,
      projectId,
      targetUserId: memberId,
    });
  } catch {
    redirect(`/${locale}/app/project-settings?projectId=${projectId}&error=forbidden`);
  }

  revalidatePath(`/${locale}/app/team`);
  revalidatePath(`/${locale}/app/project-settings`);
  redirect(`/${locale}/app/project-settings?projectId=${projectId}&saved=member`);
}

export async function updateProfile(formData: FormData) {
  const locale = formLocale(formData);
  const user = await getCurrentUser();

  if (!user?._id) {
    redirect(`/${locale}/login`);
  }

  const payload = profileInputSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    firstNameLatin: formData.get("firstNameLatin"),
    lastNameLatin: formData.get("lastNameLatin"),
    orcid: formData.get("orcid") || "",
    position: formData.get("position") || "",
    affiliation: formData.get("affiliation") || "",
    profileBio: formData.get("profileBio") || "",
    defaultSpecialty: formData.get("defaultSpecialty") || "",
  });

  if (!payload.success) {
    redirect(`/${locale}/app/profile?error=invalid`);
  }

  await updateUserProfile(user._id, payload.data);
  await createAuditEvent({
    action: "user.profile.updated",
    actor: user,
    targetUserId: user._id,
  });
  revalidatePath(`/${locale}/app/profile`);
  revalidatePath(`/${locale}/app`);
  redirect(`/${locale}/app/profile?saved=1`);
}

export async function createProjectInvite(formData: FormData) {
  const locale = formLocale(formData);
  const user = await getCurrentUser();
  const projectId = formData.get("projectId");
  const payload = projectInvitationInputSchema.safeParse({
    projectId,
    email: formData.get("email"),
  });

  if (!user) {
    redirect(`/${locale}/login`);
  }

  if (!payload.success || typeof projectId !== "string") {
    redirect(`/${locale}/app/project-settings?projectId=${projectId}&error=invalid`);
  }

  try {
    const invitation = await createProjectInvitation(payload.data, user);
    await createAuditEvent({
      action: "project.invitation.created",
      actor: user,
      projectId,
      targetEmail: payload.data.email,
      metadata: { code: invitation.code },
    });
  } catch {
    redirect(`/${locale}/app/project-settings?projectId=${projectId}&error=forbidden`);
  }

  revalidatePath(`/${locale}/app/project-settings`);
  redirect(`/${locale}/app/project-settings?projectId=${projectId}&saved=invite`);
}

export async function resetProjectJoinCode(formData: FormData) {
  const locale = formLocale(formData);
  const user = await getCurrentUser();
  const projectId = formData.get("projectId");

  if (!user) {
    redirect(`/${locale}/login`);
  }

  if (typeof projectId !== "string") {
    redirect(`/${locale}/app`);
  }

  try {
    const joinCode = await generateProjectJoinCode(projectId, user);
    await createAuditEvent({
      action: "project.join_code.generated",
      actor: user,
      projectId,
      metadata: { joinCode },
    });
  } catch {
    redirect(`/${locale}/app/project-settings?projectId=${projectId}&error=forbidden`);
  }

  revalidatePath(`/${locale}/app/project-settings`);
  redirect(`/${locale}/app/project-settings?projectId=${projectId}&saved=code`);
}

export async function addBudgetPeriod(formData: FormData) {
  const locale = formLocale(formData);
  const user = await getCurrentUser();
  const projectId = formData.get("projectId");

  if (!user) redirect(`/${locale}/login`);
  if (typeof projectId !== "string") redirect(`/${locale}/app`);

  const payload = budgetPeriodInputSchema.safeParse({
    projectId,
    label: formData.get("label"),
    startDate: formData.get("startDate") || "",
    endDate: formData.get("endDate") || "",
  });

  if (!payload.success) {
    redirect(`/${locale}/app/budget?projectId=${projectId}&error=invalid`);
  }

  const projects = await listProjectsForUser(user);
  if (!projects.some((p) => p._id === projectId)) {
    redirect(`/${locale}/app`);
  }

  const period = await createBudgetPeriod(payload.data, user);
  await createAuditEvent({
    action: "budget.period.created",
    actor: user,
    projectId,
    metadata: { label: period.label },
  });

  revalidatePath(`/${locale}/app/budget`);
  redirect(`/${locale}/app/budget?projectId=${projectId}&saved=period`);
}

export async function addBudgetLineItem(formData: FormData) {
  const locale = formLocale(formData);
  const user = await getCurrentUser();
  const projectId = formData.get("projectId");

  if (!user) redirect(`/${locale}/login`);
  if (typeof projectId !== "string") redirect(`/${locale}/app`);

  const rawQty = parseFloat((formData.get("quantity") as string) || "1") || 1;
  const rawUnitPrice = parseFloat((formData.get("unitPrice") as string) || "0") || 0;
  const rawPlannedAmount = parseFloat((formData.get("plannedAmount") as string) || "0") || 0;
  const computedAmount = rawUnitPrice > 0 ? rawQty * rawUnitPrice : rawPlannedAmount;

  const payload = budgetLineItemInputSchema.safeParse({
    projectId,
    periodId: formData.get("periodId") || "",
    category: formData.get("category"),
    name: formData.get("name"),
    description: formData.get("description") || "",
    quantity: rawQty,
    unit: formData.get("unit") || "шт.",
    unitPrice: rawUnitPrice,
    plannedAmount: computedAmount,
    currency: formData.get("currency") || "UAH",
    vendor: formData.get("vendor") || "",
    url: formData.get("url") || "",
    notes: formData.get("notes") || "",
  });

  if (!payload.success) {
    redirect(`/${locale}/app/budget?projectId=${projectId}&error=invalid`);
  }

  const projects = await listProjectsForUser(user);
  if (!projects.some((p) => p._id === projectId)) {
    redirect(`/${locale}/app`);
  }

  await createBudgetLineItem(payload.data, user);
  await createAuditEvent({
    action: "budget.line_item.created",
    actor: user,
    projectId,
    metadata: { category: payload.data.category, name: payload.data.name },
  });

  revalidatePath(`/${locale}/app/budget`);
  redirect(`/${locale}/app/budget?projectId=${projectId}&tab=items&saved=lineitem`);
}

export async function submitPurchaseRequest(formData: FormData) {
  const locale = formLocale(formData);
  const user = await getCurrentUser();
  const projectId = formData.get("projectId");
  const isDraft = formData.get("saveDraft") === "1";

  if (!user) redirect(`/${locale}/login`);
  if (typeof projectId !== "string") redirect(`/${locale}/app`);

  const payload = purchaseRequestInputSchema.safeParse({
    projectId,
    title: formData.get("title"),
    description: formData.get("description"),
    category: formData.get("category"),
    estimatedAmount: formData.get("estimatedAmount"),
    currency: formData.get("currency") || "UAH",
    vendor: formData.get("vendor") || "",
    justification: formData.get("justification") || "",
    linkedPeriodId: formData.get("linkedPeriodId") || "",
    linkedLineItemId: formData.get("linkedLineItemId") || "",
  });

  if (!payload.success) {
    redirect(`/${locale}/app/budget?projectId=${projectId}&tab=requests&error=invalid`);
  }

  const projects = await listProjectsForUser(user);
  if (!projects.some((p) => p._id === projectId)) {
    redirect(`/${locale}/app`);
  }

  const status = isDraft ? "draft" : "submitted";
  await createPurchaseRequest(payload.data, user, status);

  if (!isDraft) {
    await createAuditEvent({
      action: "budget.request.submitted",
      actor: user,
      projectId,
      metadata: { title: payload.data.title },
    });
    const submittedProject = projects.find((p) => p._id === projectId);
    if (submittedProject) {
      const approvers = [submittedProject.ownerId, submittedProject.supervisorId].filter((id): id is string => Boolean(id));
      void createNotificationsForUsers(approvers, {
        userId: "",
        actorId: user._id ?? "",
        actorName: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email,
        type: "approval_needed",
        title: `Потрібне затвердження: ${payload.data.title}`,
        body: `Нова закупівельна заявка в проєкті «${submittedProject.title}» очікує вашого рішення.`,
        projectId,
        projectName: submittedProject.title,
        link: `/${locale}/app/budget?projectId=${projectId}&tab=requests`,
      });
    }
  }

  revalidatePath(`/${locale}/app/budget`);
  redirect(
    `/${locale}/app/budget?projectId=${projectId}&tab=requests&saved=${isDraft ? "draft" : "submitted"}`,
  );
}

export async function approvePurchaseRequest(formData: FormData) {
  const locale = formLocale(formData);
  const user = await getCurrentUser();
  const projectId = formData.get("projectId");
  const requestId = formData.get("requestId");
  const reviewNote = formData.get("reviewNote");

  if (!user) redirect(`/${locale}/login`);
  if (typeof projectId !== "string" || typeof requestId !== "string") {
    redirect(`/${locale}/app`);
  }

  const projects = await listProjectsForUser(user);
  const project = projects.find((p) => p._id === projectId);

  if (
    !project ||
    (user.role !== "admin" &&
      project.ownerId !== user._id &&
      project.supervisorId !== user._id)
  ) {
    redirect(
      `/${locale}/app/budget?projectId=${projectId}&tab=requests&error=forbidden`,
    );
  }

  const approvedReq = await getPurchaseRequestById(requestId);
  await reviewPurchaseRequest(
    requestId,
    "approved",
    typeof reviewNote === "string" ? reviewNote : "",
    user,
  );
  await createAuditEvent({
    action: "budget.request.approved",
    actor: user,
    projectId,
    metadata: { requestId },
  });
  if (approvedReq?.requesterId) {
    void createNotificationsForUsers([approvedReq.requesterId], {
      userId: "",
      actorId: user._id ?? "",
      actorName: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email,
      type: "approved",
      title: `Заявку затверджено: ${approvedReq.title}`,
      body: `${project?.title ? `Проєкт «${project.title}». ` : ""}${typeof reviewNote === "string" && reviewNote ? `Коментар: ${reviewNote}` : ""}`.trim(),
      projectId,
      projectName: project?.title,
      link: `/${locale}/app/budget?projectId=${projectId}&tab=requests`,
    });
  }

  revalidatePath(`/${locale}/app/budget`);
  redirect(
    `/${locale}/app/budget?projectId=${projectId}&tab=requests&saved=approved`,
  );
}

export async function rejectPurchaseRequest(formData: FormData) {
  const locale = formLocale(formData);
  const user = await getCurrentUser();
  const projectId = formData.get("projectId");
  const requestId = formData.get("requestId");
  const reviewNote = formData.get("reviewNote");

  if (!user) redirect(`/${locale}/login`);
  if (typeof projectId !== "string" || typeof requestId !== "string") {
    redirect(`/${locale}/app`);
  }

  const projects = await listProjectsForUser(user);
  const project = projects.find((p) => p._id === projectId);

  if (
    !project ||
    (user.role !== "admin" &&
      project.ownerId !== user._id &&
      project.supervisorId !== user._id)
  ) {
    redirect(
      `/${locale}/app/budget?projectId=${projectId}&tab=requests&error=forbidden`,
    );
  }

  const rejectedReq = await getPurchaseRequestById(requestId);
  await reviewPurchaseRequest(
    requestId,
    "rejected",
    typeof reviewNote === "string" ? reviewNote : "",
    user,
  );
  await createAuditEvent({
    action: "budget.request.rejected",
    actor: user,
    projectId,
    metadata: { requestId },
  });
  if (rejectedReq?.requesterId) {
    void createNotificationsForUsers([rejectedReq.requesterId], {
      userId: "",
      actorId: user._id ?? "",
      actorName: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email,
      type: "rejected",
      title: `Заявку відхилено: ${rejectedReq.title}`,
      body: `${project?.title ? `Проєкт «${project.title}». ` : ""}${typeof reviewNote === "string" && reviewNote ? `Причина: ${reviewNote}` : ""}`.trim(),
      projectId,
      projectName: project?.title,
      link: `/${locale}/app/budget?projectId=${projectId}&tab=requests`,
    });
  }

  revalidatePath(`/${locale}/app/budget`);
  redirect(
    `/${locale}/app/budget?projectId=${projectId}&tab=requests&saved=rejected`,
  );
}

export async function markPurchaseRequestPurchased(formData: FormData) {
  const locale = formLocale(formData);
  const user = await getCurrentUser();
  const projectId = formData.get("projectId");
  const requestId = formData.get("requestId");
  const actualAmount = Number(formData.get("actualAmount"));

  if (!user) redirect(`/${locale}/login`);
  if (
    typeof projectId !== "string" ||
    typeof requestId !== "string" ||
    Number.isNaN(actualAmount)
  ) {
    redirect(`/${locale}/app`);
  }

  const projects = await listProjectsForUser(user);
  if (!projects.some((p) => p._id === projectId)) {
    redirect(`/${locale}/app`);
  }

  await markRequestPurchased(requestId, actualAmount, user);
  await createAuditEvent({
    action: "budget.request.purchased",
    actor: user,
    projectId,
    metadata: { requestId, actualAmount: String(actualAmount) },
  });

  revalidatePath(`/${locale}/app/budget`);
  redirect(
    `/${locale}/app/budget?projectId=${projectId}&tab=requests&saved=purchased`,
  );
}

export async function addTask(formData: FormData) {
  const locale = formLocale(formData);
  const user = await getCurrentUser();
  const projectId = formData.get("projectId");

  if (!user) redirect(`/${locale}/login`);
  if (typeof projectId !== "string") redirect(`/${locale}/app`);

  const payload = taskInputSchema.safeParse({
    projectId,
    title: formData.get("title"),
    description: formData.get("description") || "",
    parentTaskId: formData.get("parentTaskId") || "",
    assigneeId: formData.get("assigneeId") || "",
    dueDate: formData.get("dueDate") || "",
    priority: formData.get("priority") || "medium",
    category: formData.get("category") || "research",
    estimatedHours: formData.get("estimatedHours") || 0,
  });

  if (!payload.success) {
    redirect(`/${locale}/app/planning?projectId=${projectId}&error=invalid`);
  }

  const projects = await listProjectsForUser(user);
  if (!projects.some((p) => p._id === projectId)) redirect(`/${locale}/app`);

  const task = await createTask(payload.data, user);
  await createAuditEvent({
    action: "planning.task.created",
    actor: user,
    projectId,
    metadata: { title: task.title },
  });

  revalidatePath(`/${locale}/app/planning`);
  redirect(`/${locale}/app/planning?projectId=${projectId}&saved=task`);
}

export async function changeTaskStatus(formData: FormData) {
  const locale = formLocale(formData);
  const user = await getCurrentUser();
  const projectId = formData.get("projectId");
  const taskId = formData.get("taskId");
  const status = formData.get("status");

  if (!user) redirect(`/${locale}/login`);
  if (
    typeof projectId !== "string" ||
    typeof taskId !== "string" ||
    typeof status !== "string"
  ) {
    redirect(`/${locale}/app`);
  }

  const projects = await listProjectsForUser(user);
  if (!projects.some((p) => p._id === projectId)) redirect(`/${locale}/app`);

  await updateTaskStatus(
    taskId,
    status as Parameters<typeof updateTaskStatus>[1],
    user,
  );
  await createAuditEvent({
    action: "planning.task.status_changed",
    actor: user,
    projectId,
    metadata: { taskId, status },
  });

  revalidatePath(`/${locale}/app/planning`);
  redirect(
    `/${locale}/app/planning?projectId=${projectId}&tab=tasks&saved=status`,
  );
}

export async function addMilestone(formData: FormData) {
  const locale = formLocale(formData);
  const user = await getCurrentUser();
  const projectId = formData.get("projectId");

  if (!user) redirect(`/${locale}/login`);
  if (typeof projectId !== "string") redirect(`/${locale}/app`);

  const payload = milestoneInputSchema.safeParse({
    projectId,
    title: formData.get("title"),
    description: formData.get("description") || "",
    dueDate: formData.get("dueDate"),
  });

  if (!payload.success) {
    redirect(
      `/${locale}/app/planning?projectId=${projectId}&tab=milestones&error=invalid`,
    );
  }

  const projects = await listProjectsForUser(user);
  if (!projects.some((p) => p._id === projectId)) redirect(`/${locale}/app`);

  const ms = await createMilestone(payload.data, user);
  await createAuditEvent({
    action: "planning.milestone.created",
    actor: user,
    projectId,
    metadata: { title: ms.title, dueDate: ms.dueDate },
  });

  revalidatePath(`/${locale}/app/planning`);
  redirect(
    `/${locale}/app/planning?projectId=${projectId}&tab=milestones&saved=milestone`,
  );
}

export async function reachMilestone(formData: FormData) {
  const locale = formLocale(formData);
  const user = await getCurrentUser();
  const projectId = formData.get("projectId");
  const milestoneId = formData.get("milestoneId");

  if (!user) redirect(`/${locale}/login`);
  if (typeof projectId !== "string" || typeof milestoneId !== "string") {
    redirect(`/${locale}/app`);
  }

  const projects = await listProjectsForUser(user);
  if (!projects.some((p) => p._id === projectId)) redirect(`/${locale}/app`);

  await markMilestoneReached(milestoneId, user);
  await createAuditEvent({
    action: "planning.milestone.reached",
    actor: user,
    projectId,
    metadata: { milestoneId },
  });

  revalidatePath(`/${locale}/app/planning`);
  redirect(
    `/${locale}/app/planning?projectId=${projectId}&tab=milestones&saved=reached`,
  );
}

export async function logTime(formData: FormData) {
  const locale = formLocale(formData);
  const user = await getCurrentUser();
  const projectId = formData.get("projectId");

  if (!user) redirect(`/${locale}/login`);
  if (typeof projectId !== "string") redirect(`/${locale}/app`);

  const payload = timeEntryInputSchema.safeParse({
    projectId,
    taskId: formData.get("taskId") || "",
    date: formData.get("date"),
    hours: formData.get("hours"),
    description: formData.get("description") || "",
    category: formData.get("category") || "research",
  });

  if (!payload.success) {
    redirect(
      `/${locale}/app/planning?projectId=${projectId}&tab=time&error=invalid`,
    );
  }

  const projects = await listProjectsForUser(user);
  if (!projects.some((p) => p._id === projectId)) redirect(`/${locale}/app`);

  await createTimeEntry(payload.data, user);
  await createAuditEvent({
    action: "planning.time.logged",
    actor: user,
    projectId,
    metadata: {
      date: payload.data.date,
      hours: String(payload.data.hours),
      category: payload.data.category,
    },
  });

  revalidatePath(`/${locale}/app/planning`);
  redirect(
    `/${locale}/app/planning?projectId=${projectId}&tab=time&saved=time`,
  );
}

export async function joinProjectWithCode(formData: FormData) {
  const locale = formLocale(formData);
  const user = await getCurrentUser();
  const code = formData.get("joinCode");

  if (!user) {
    redirect(`/${locale}/login`);
  }

  if (typeof code !== "string" || code.trim().length < 6) {
    redirect(`/${locale}/app?error=join-code`);
  }

  try {
    // Try member code first, then supervisor code
    let project;
    try {
      project = await joinProjectByCode(code, user);
    } catch {
      project = await joinProjectBySupervisorCode(code, user);
    }
    await createAuditEvent({
      action: "project.joined_by_code",
      actor: user,
      projectId: project._id,
      targetUserId: user._id,
    });
  } catch {
    redirect(`/${locale}/app?error=join-code`);
  }

  revalidatePath(`/${locale}/app`);
  redirect(`/${locale}/app?saved=joined`);
}

// ── Research Plan ─────────────────────────────────────────────────────────────

export async function addResearchStage(formData: FormData) {
  const locale = formLocale(formData);
  const user = await getCurrentUser();
  const projectId = formData.get("projectId");

  if (!user) redirect(`/${locale}/login`);
  if (typeof projectId !== "string") redirect(`/${locale}/app`);

  const payload = researchStageInputSchema.safeParse({
    projectId,
    stageNumber: formData.get("stageNumber"),
    title: formData.get("title"),
    goals: formData.get("goals") || "",
    tasksText: formData.get("tasksText") || "",
    startDate: formData.get("startDate") || "",
    endDate: formData.get("endDate") || "",
    indicators: formData.get("indicators") || "",
    budget: formData.get("budget") || 0,
    currency: formData.get("currency") || "UAH",
    linkedMilestoneId: formData.get("linkedMilestoneId") || "",
  });

  if (!payload.success) {
    redirect(`/${locale}/app/research-plan?projectId=${projectId}&error=invalid`);
  }

  const projects = await listProjectsForUser(user);
  if (!projects.some((p) => p._id === projectId)) redirect(`/${locale}/app`);

  const stage = await createResearchStage(payload.data, user);
  await createAuditEvent({
    action: "research.stage.created",
    actor: user,
    projectId,
    metadata: { stageNumber: String(stage.stageNumber), title: stage.title.slice(0, 80) },
  });

  revalidatePath(`/${locale}/app/research-plan`);
  redirect(`/${locale}/app/research-plan?projectId=${projectId}&saved=stage`);
}

export async function setStageStatus(formData: FormData) {
  const locale = formLocale(formData);
  const user = await getCurrentUser();
  const projectId = formData.get("projectId");
  const stageId = formData.get("stageId");
  const status = formData.get("status");
  const completionNote = formData.get("completionNote");

  if (!user) redirect(`/${locale}/login`);
  if (
    typeof projectId !== "string" ||
    typeof stageId !== "string" ||
    typeof status !== "string"
  ) {
    redirect(`/${locale}/app`);
  }

  const projects = await listProjectsForUser(user);
  const project = projects.find((p) => p._id === projectId);

  if (
    !project ||
    (user.role !== "admin" &&
      project.ownerId !== user._id &&
      project.supervisorId !== user._id)
  ) {
    redirect(`/${locale}/app/research-plan?projectId=${projectId}&error=forbidden`);
  }

  await updateStageStatus(
    stageId,
    status as Parameters<typeof updateStageStatus>[1],
    typeof completionNote === "string" ? completionNote : "",
    user,
  );
  await createAuditEvent({
    action: "research.stage.status_changed",
    actor: user,
    projectId,
    metadata: { stageId, status },
  });

  revalidatePath(`/${locale}/app/research-plan`);
  redirect(`/${locale}/app/research-plan?projectId=${projectId}&tab=stages&saved=status`);
}

export async function addTaskToStage(formData: FormData) {
  const locale = formLocale(formData);
  const user = await getCurrentUser();
  const projectId = formData.get("projectId");
  const stageId = formData.get("stageId");
  const taskId = formData.get("taskId");

  if (!user) redirect(`/${locale}/login`);
  if (
    typeof projectId !== "string" ||
    typeof stageId !== "string" ||
    typeof taskId !== "string"
  ) {
    redirect(`/${locale}/app`);
  }

  const projects = await listProjectsForUser(user);
  if (!projects.some((p) => p._id === projectId)) redirect(`/${locale}/app`);

  await linkTaskToStage(stageId, taskId);

  revalidatePath(`/${locale}/app/research-plan`);
  redirect(`/${locale}/app/research-plan?projectId=${projectId}&tab=stages&saved=linked`);
}

export async function removeTaskFromStage(formData: FormData) {
  const locale = formLocale(formData);
  const user = await getCurrentUser();
  const projectId = formData.get("projectId");
  const stageId = formData.get("stageId");
  const taskId = formData.get("taskId");

  if (!user) redirect(`/${locale}/login`);
  if (
    typeof projectId !== "string" ||
    typeof stageId !== "string" ||
    typeof taskId !== "string"
  ) {
    redirect(`/${locale}/app`);
  }

  const projects = await listProjectsForUser(user);
  if (!projects.some((p) => p._id === projectId)) redirect(`/${locale}/app`);

  await unlinkTaskFromStage(stageId, taskId);

  revalidatePath(`/${locale}/app/research-plan`);
  redirect(`/${locale}/app/research-plan?projectId=${projectId}&tab=stages&saved=unlinked`);
}

export async function addPublication(formData: FormData) {
  const locale = formLocale(formData);
  const user = await getCurrentUser();
  const projectId = formData.get("projectId");

  if (!user) redirect(`/${locale}/login`);
  if (typeof projectId !== "string") redirect(`/${locale}/app`);

  const payload = researchPublicationInputSchema.safeParse({
    projectId,
    stageId: formData.get("stageId") || "",
    type: formData.get("type") || "article",
    title: formData.get("title"),
    authors: formData.get("authors") || "",
    journal: formData.get("journal") || "",
    status: formData.get("status") || "planned",
    expectedYear: formData.get("expectedYear") || null,
    doi: formData.get("doi") || "",
    url: formData.get("url") || "",
    note: formData.get("note") || "",
  });

  if (!payload.success) {
    redirect(`/${locale}/app/research-plan?projectId=${projectId}&tab=publications&error=invalid`);
  }

  const projects = await listProjectsForUser(user);
  if (!projects.some((p) => p._id === projectId)) redirect(`/${locale}/app`);

  const pub = await createPublication(payload.data, user);
  await createAuditEvent({
    action: "research.publication.created",
    actor: user,
    projectId,
    metadata: { title: pub.title.slice(0, 80), type: pub.type },
  });

  revalidatePath(`/${locale}/app/research-plan`);
  redirect(`/${locale}/app/research-plan?projectId=${projectId}&tab=publications&saved=publication`);
}

export async function updatePublicationStatus(formData: FormData) {
  const locale = formLocale(formData);
  const user = await getCurrentUser();
  const projectId = formData.get("projectId");
  const pubId = formData.get("pubId");
  const status = formData.get("status");
  const doi = formData.get("doi");
  const url = formData.get("url");

  if (!user) redirect(`/${locale}/login`);
  if (
    typeof projectId !== "string" ||
    typeof pubId !== "string" ||
    typeof status !== "string"
  ) {
    redirect(`/${locale}/app`);
  }

  const projects = await listProjectsForUser(user);
  if (!projects.some((p) => p._id === projectId)) redirect(`/${locale}/app`);

  await updatePubStatus(
    pubId,
    status as Parameters<typeof updatePubStatus>[1],
    typeof doi === "string" ? doi : "",
    typeof url === "string" ? url : "",
  );

  revalidatePath(`/${locale}/app/research-plan`);
  redirect(`/${locale}/app/research-plan?projectId=${projectId}&tab=publications&saved=pub_status`);
}

export async function addDeliverable(formData: FormData) {
  const locale = formLocale(formData);
  const user = await getCurrentUser();
  const projectId = formData.get("projectId");

  if (!user) redirect(`/${locale}/login`);
  if (typeof projectId !== "string") redirect(`/${locale}/app`);

  const payload = researchDeliverableInputSchema.safeParse({
    projectId,
    stageId: formData.get("stageId") || "",
    type: formData.get("type") || "publication",
    title: formData.get("title"),
    description: formData.get("description") || "",
    plannedDate: formData.get("plannedDate") || "",
    status: formData.get("status") || "planned",
    link: formData.get("link") || "",
    note: formData.get("note") || "",
  });

  if (!payload.success) {
    redirect(`/${locale}/app/research-plan?projectId=${projectId}&tab=deliverables&error=invalid`);
  }

  const projects = await listProjectsForUser(user);
  if (!projects.some((p) => p._id === projectId)) redirect(`/${locale}/app`);

  const deliv = await createDeliverable(payload.data, user);
  await createAuditEvent({
    action: "research.deliverable.created",
    actor: user,
    projectId,
    metadata: { title: deliv.title.slice(0, 80), type: deliv.type },
  });

  revalidatePath(`/${locale}/app/research-plan`);
  redirect(`/${locale}/app/research-plan?projectId=${projectId}&tab=deliverables&saved=deliverable`);
}

export async function updateDeliverableStatus(formData: FormData) {
  const locale = formLocale(formData);
  const user = await getCurrentUser();
  const projectId = formData.get("projectId");
  const delivId = formData.get("delivId");
  const status = formData.get("status");

  if (!user) redirect(`/${locale}/login`);
  if (
    typeof projectId !== "string" ||
    typeof delivId !== "string" ||
    typeof status !== "string"
  ) {
    redirect(`/${locale}/app`);
  }

  const projects = await listProjectsForUser(user);
  if (!projects.some((p) => p._id === projectId)) redirect(`/${locale}/app`);

  await updateDelivStatus(
    delivId,
    status as Parameters<typeof updateDelivStatus>[1],
    user,
  );

  revalidatePath(`/${locale}/app/research-plan`);
  redirect(`/${locale}/app/research-plan?projectId=${projectId}&tab=deliverables&saved=deliv_status`);
}

// ── Experiments ───────────────────────────────────────────────────────────────

export async function createExperiment(formData: FormData) {
  const locale = formLocale(formData);
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);

  const projectId = formData.get("projectId") as string;
  if (!projectId) redirect(`/${locale}/app`);

  const project = await getProjectForUser(projectId, user);
  if (!project?._id) redirect(`/${locale}/app`);

  const raw = {
    projectId,
    stageId: formData.get("stageId") ?? "",
    title: formData.get("title"),
    type: formData.get("type"),
    status: formData.get("status") ?? "planned",
    priority: formData.get("priority") ?? "medium",
    startDate: formData.get("startDate") ?? "",
    endDate: formData.get("endDate") ?? "",
    objectives: formData.get("objectives") ?? "",
    hypothesis: formData.get("hypothesis") ?? "",
    variables: formData.get("variables") ?? "",
    controls: formData.get("controls") ?? "",
    replicates: formData.get("replicates") ?? 0,
    methods: formData.get("methods") ?? "",
    results: formData.get("results") ?? "",
    conclusion: formData.get("conclusion") ?? "",
    notes: formData.get("notes") ?? "",
    linkedMethodologyId: formData.get("linkedMethodologyId") ?? "",
    linkedRecordIds: (() => { try { return JSON.parse((formData.get("linkedRecordIds") as string) || "[]"); } catch { return []; } })(),
    outputRecordIds: (() => { try { return JSON.parse((formData.get("outputRecordIds") as string) || "[]"); } catch { return []; } })(),
  };

  const parsed = experimentInputSchema.safeParse(raw);
  if (!parsed.success) {
    redirect(`/${locale}/app/experiments?projectId=${projectId}&error=invalid`);
  }

  const exp = await createExperimentLib(parsed.data, user);
  await createAuditEvent({
    action: "experiment.created",
    actor: user,
    projectId,
    metadata: { experimentId: exp._id ?? "", title: exp.title },
  });

  revalidatePath(`/${locale}/app/experiments`);
  redirect(`/${locale}/app/experiments?projectId=${projectId}&saved=created`);
}

export async function updateExperiment(formData: FormData) {
  const locale = formLocale(formData);
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);

  const projectId = formData.get("projectId") as string;
  const experimentId = formData.get("experimentId") as string;
  if (!projectId || !experimentId) redirect(`/${locale}/app`);

  const project = await getProjectForUser(projectId, user);
  if (!project?._id) redirect(`/${locale}/app`);

  const raw = {
    projectId,
    stageId: formData.get("stageId") ?? "",
    title: formData.get("title"),
    type: formData.get("type"),
    status: formData.get("status") ?? "planned",
    priority: formData.get("priority") ?? "medium",
    startDate: formData.get("startDate") ?? "",
    endDate: formData.get("endDate") ?? "",
    objectives: formData.get("objectives") ?? "",
    hypothesis: formData.get("hypothesis") ?? "",
    variables: formData.get("variables") ?? "",
    controls: formData.get("controls") ?? "",
    replicates: formData.get("replicates") ?? 0,
    methods: formData.get("methods") ?? "",
    results: formData.get("results") ?? "",
    conclusion: formData.get("conclusion") ?? "",
    notes: formData.get("notes") ?? "",
    linkedMethodologyId: formData.get("linkedMethodologyId") ?? "",
    linkedRecordIds: (() => { try { return JSON.parse((formData.get("linkedRecordIds") as string) || "[]"); } catch { return []; } })(),
    outputRecordIds: (() => { try { return JSON.parse((formData.get("outputRecordIds") as string) || "[]"); } catch { return []; } })(),
  };

  const parsed = experimentInputSchema.safeParse(raw);
  if (!parsed.success) {
    redirect(`/${locale}/app/experiments?projectId=${projectId}&error=invalid`);
  }

  await updateExperimentLib(experimentId, parsed.data);
  await createAuditEvent({
    action: "experiment.updated",
    actor: user,
    projectId,
    metadata: { experimentId, title: parsed.data.title },
  });

  revalidatePath(`/${locale}/app/experiments`);
  redirect(`/${locale}/app/experiments?projectId=${projectId}&saved=updated`);
}

export async function updateExperimentStatus(formData: FormData) {
  const locale = formLocale(formData);
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);

  const projectId = formData.get("projectId") as string;
  const experimentId = formData.get("experimentId") as string;
  const status = formData.get("status") as string;

  if (!projectId || !experimentId || !status) redirect(`/${locale}/app`);
  if (!(experimentStatuses as readonly string[]).includes(status)) {
    redirect(`/${locale}/app/experiments?projectId=${projectId}&error=invalid`);
  }

  const project = await getProjectForUser(projectId, user);
  if (!project?._id) redirect(`/${locale}/app`);

  await updateExperimentStatusLib(experimentId, status as Parameters<typeof updateExperimentStatusLib>[1]);
  revalidatePath(`/${locale}/app/experiments`);
  redirect(`/${locale}/app/experiments?projectId=${projectId}&saved=status`);
}

export async function deleteExperiment(formData: FormData) {
  const locale = formLocale(formData);
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);

  const projectId = formData.get("projectId") as string;
  const experimentId = formData.get("experimentId") as string;
  if (!projectId || !experimentId) redirect(`/${locale}/app`);

  const project = await getProjectForUser(projectId, user);
  if (!project?._id) redirect(`/${locale}/app`);

  await deleteExperimentLib(experimentId, projectId);
  revalidatePath(`/${locale}/app/experiments`);
  redirect(`/${locale}/app/experiments?projectId=${projectId}&saved=deleted`);
}

export async function linkMethodologyToExperiment(formData: FormData) {
  const locale = formLocale(formData);
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);

  const projectId = formData.get("projectId") as string;
  const experimentId = formData.get("experimentId") as string;
  const linkedMethodologyId = (formData.get("linkedMethodologyId") as string) || "";
  if (!projectId || !experimentId) redirect(`/${locale}/app`);

  const project = await getProjectForUser(projectId, user);
  if (!project?._id) redirect(`/${locale}/app`);

  const exp = await getExperimentByIdLib(experimentId);
  if (!exp || exp.projectId !== projectId) redirect(`/${locale}/app`);

  await updateExperimentLib(experimentId, { linkedMethodologyId });
  await createAuditEvent({ action: "experiment.methodology_linked", actor: user, projectId, metadata: { experimentId, linkedMethodologyId } });
  revalidatePath(`/${locale}/app/experiments`);
  redirect(`/${locale}/app/experiments?projectId=${projectId}&exp=${experimentId}&saved=linked`);
}

export async function createRecordFromExperiment(formData: FormData) {
  const locale = formLocale(formData);
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);

  const projectId = formData.get("projectId") as string;
  const experimentId = formData.get("experimentId") as string;
  const recordKind = (formData.get("recordKind") as string) || "experiment_log";
  if (!projectId || !experimentId) redirect(`/${locale}/app`);

  const project = await getProjectForUser(projectId, user);
  if (!project?._id) redirect(`/${locale}/app`);

  const exp = await getExperimentByIdLib(experimentId);
  if (!exp || exp.projectId !== projectId) redirect(`/${locale}/app`);

  const projects = await listProjectsForUser(user);
  if (!projects.some((p) => p._id === projectId)) redirect(`/${locale}/app`);

  const owner = user.firstNameLatin && user.lastNameLatin
    ? `${user.firstNameLatin} ${user.lastNameLatin}`
    : user.email;
  const suffix = Date.now().toString(36).slice(-4).toUpperCase();
  const localId = `${recordKind.toUpperCase().slice(0, 3)}-${suffix}`;

  const stageValue = exp.stageId || (formData.get("stage") as string) || "Stage 1";

  const recordInput: ProjectRecordInput = {
    projectId,
    kind: recordKind as ProjectRecordInput["kind"],
    localId,
    title: (formData.get("title") as string) || `${exp.title} — Results`,
    stage: stageValue,
    group: "",
    dataFormat: "",
    version: "1.0",
    rootRecordId: "",
    parentVersionId: "",
    variantLabel: "",
    versionNote: `Generated from experiment: ${exp.title}`,
    access: "internal",
    owner,
    repository: "internal",
    summary: [exp.results, exp.conclusion ? `\nConclusion: ${exp.conclusion}` : ""].filter(Boolean).join(""),
    usageNotes: exp.notes || "",
    keywords: exp.type,
    license: "",
    tags: [exp.type, exp.status].filter(Boolean),
    doi: "",
    processingStatus: "raw",
    linkedPublicationIds: [],
    creators: [],
    language: locale === "uk" ? "uk" : "en",
    embargoDate: "",
    dateCollectedFrom: exp.startDate || "",
    dateCollectedTo: exp.endDate || "",
    fundingGrant: "",
    subjects: [],
    notes: "",
    contributors: [],
    references: "",
    relatedIdentifiers: [],
    typedData: {
      linked_methodology: exp.linkedMethodologyId,
      hypothesis: exp.hypothesis,
      objectives: exp.objectives,
      variables: exp.variables,
      controls: exp.controls,
      replicates: exp.replicates,
      experiment_type: exp.type,
      execution_steps_log: [],
    },
  };

  const newRecord = await insertProjectRecord(recordInput, [], user._id ?? "", "active");
  await updateExperimentLib(experimentId, {
    outputRecordIds: [...(exp.outputRecordIds ?? []), newRecord._id ?? ""].filter(Boolean),
  });

  await createAuditEvent({ action: "experiment.record_generated", actor: user, projectId, metadata: { experimentId, recordId: newRecord._id ?? "", kind: recordKind } });
  revalidatePath(`/${locale}/app/experiments`);
  redirect(`/${locale}/app/experiments?projectId=${projectId}&exp=${experimentId}&saved=record_generated`);
}

export async function updateStageProgress(formData: FormData) {
  const locale = formLocale(formData);
  const user = await getCurrentUser();
  const projectId = formData.get("projectId");
  const stageId = formData.get("stageId");
  const progressRaw = formData.get("progress");

  if (!user) redirect(`/${locale}/login`);
  if (
    typeof projectId !== "string" ||
    typeof stageId !== "string" ||
    typeof progressRaw !== "string"
  ) {
    redirect(`/${locale}/app`);
  }

  const progress = Math.min(100, Math.max(0, parseInt(progressRaw, 10) || 0));

  const projects = await listProjectsForUser(user);
  if (!projects.some((p) => p._id === projectId)) redirect(`/${locale}/app`);

  await updateStageProgressLib(stageId, progress);
  await createAuditEvent({
    action: "research.stage.progress_updated",
    actor: user,
    projectId,
    metadata: { stageId, progress: String(progress) },
  });

  revalidatePath(`/${locale}/app/research-plan`);
  redirect(`/${locale}/app/research-plan?projectId=${projectId}&tab=stages&saved=progress`);
}

// ── Research Plan – Stage CRUD ────────────────────────────────────────────────

export async function updateResearchStage(formData: FormData) {
  "use server";
  const locale = formData.get("locale") as string;
  const projectId = formData.get("projectId") as string;
  const stageId = formData.get("stageId") as string;

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);

  const project = await getProjectForUser(projectId, user);
  if (!project?._id || !canManageProject(project, user)) {
    redirect(`/${locale}/app/research-plan?projectId=${projectId}&error=forbidden`);
  }

  const fields = {
    stageNumber: parseInt(formData.get("stageNumber") as string, 10) || 1,
    title: (formData.get("title") as string)?.trim() ?? "",
    goals: (formData.get("goals") as string)?.trim() ?? "",
    tasksText: (formData.get("tasksText") as string)?.trim() ?? "",
    startDate: (formData.get("startDate") as string) ?? "",
    endDate: (formData.get("endDate") as string) ?? "",
    indicators: (formData.get("indicators") as string)?.trim() ?? "",
    budget: parseFloat(formData.get("budget") as string) || 0,
    currency: ((formData.get("currency") as string) || "UAH") as "UAH" | "EUR" | "USD",
    linkedMilestoneId: (formData.get("linkedMilestoneId") as string) ?? "",
  };

  if (!fields.title || fields.title.length < 2) {
    redirect(`/${locale}/app/research-plan?projectId=${projectId}&tab=stages&error=invalid`);
  }

  await updateResearchStageLib(stageId, fields);
  await createAuditEvent({
    action: "research.stage.updated",
    actor: user,
    projectId,
    metadata: { stageId, title: fields.title },
  });

  revalidatePath(`/${locale}/app/research-plan`);
  redirect(`/${locale}/app/research-plan?projectId=${projectId}&tab=stages&saved=stage_updated`);
}

export async function deleteResearchStage(formData: FormData) {
  "use server";
  const locale = formData.get("locale") as string;
  const projectId = formData.get("projectId") as string;
  const stageId = formData.get("stageId") as string;

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);

  const project = await getProjectForUser(projectId, user);
  if (!project?._id || !canManageProject(project, user)) {
    redirect(`/${locale}/app/research-plan?projectId=${projectId}&error=forbidden`);
  }

  await deleteResearchStageLib(stageId);
  await createAuditEvent({
    action: "research.stage.deleted",
    actor: user,
    projectId,
    metadata: { stageId },
  });

  revalidatePath(`/${locale}/app/research-plan`);
  redirect(`/${locale}/app/research-plan?projectId=${projectId}&tab=stages&saved=stage_deleted`);
}

// ── Research Plan – Milestone CRUD ────────────────────────────────────────────

export async function updateMilestone(formData: FormData) {
  "use server";
  const locale = formData.get("locale") as string;
  const projectId = formData.get("projectId") as string;
  const milestoneId = formData.get("milestoneId") as string;

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);

  const project = await getProjectForUser(projectId, user);
  if (!project?._id || !canManageProject(project, user)) {
    redirect(`/${locale}/app/research-plan?projectId=${projectId}&error=forbidden`);
  }

  const title = (formData.get("title") as string)?.trim() ?? "";
  const description = (formData.get("description") as string)?.trim() ?? "";
  const dueDate = (formData.get("dueDate") as string) ?? "";
  const status = (formData.get("status") as string) ?? "upcoming";

  if (!title || title.length < 2 || !dueDate) {
    redirect(`/${locale}/app/research-plan?projectId=${projectId}&tab=milestones&error=invalid`);
  }

  await updateMilestoneLib(milestoneId, { title, description, dueDate, status });

  revalidatePath(`/${locale}/app/research-plan`);
  redirect(`/${locale}/app/research-plan?projectId=${projectId}&tab=milestones&saved=milestone_updated`);
}

export async function deleteMilestone(formData: FormData) {
  "use server";
  const locale = formData.get("locale") as string;
  const projectId = formData.get("projectId") as string;
  const milestoneId = formData.get("milestoneId") as string;

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);

  const project = await getProjectForUser(projectId, user);
  if (!project?._id || !canManageProject(project, user)) {
    redirect(`/${locale}/app/research-plan?projectId=${projectId}&error=forbidden`);
  }

  await deleteMilestoneLib(milestoneId);

  revalidatePath(`/${locale}/app/research-plan`);
  redirect(`/${locale}/app/research-plan?projectId=${projectId}&tab=milestones&saved=milestone_deleted`);
}

// ── Research Plan – Publication full CRUD ─────────────────────────────────────

export async function updatePublication(formData: FormData) {
  "use server";
  const locale = formData.get("locale") as string;
  const projectId = formData.get("projectId") as string;
  const pubId = formData.get("pubId") as string;

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);

  const project = await getProjectForUser(projectId, user);
  if (!project?._id || !canManageProject(project, user)) {
    redirect(`/${locale}/app/research-plan?projectId=${projectId}&error=forbidden`);
  }

  const title = (formData.get("title") as string)?.trim() ?? "";
  if (!title || title.length < 2) {
    redirect(`/${locale}/app/research-plan?projectId=${projectId}&tab=publications&error=invalid`);
  }

  const yearRaw = formData.get("expectedYear") as string;
  const pubType = ((formData.get("type") as string) || "article") as
    | "article" | "conference" | "book_chapter" | "monograph"
    | "patent" | "software" | "dataset" | "report" | "other";
  const pubStatus = ((formData.get("status") as string) || "planned") as
    | "planned" | "submitted" | "under_review" | "accepted" | "published" | "rejected";
  const fields = {
    title,
    type: pubType,
    authors: (formData.get("authors") as string)?.trim() ?? "",
    journal: (formData.get("journal") as string)?.trim() ?? "",
    status: pubStatus,
    expectedYear: yearRaw ? parseInt(yearRaw, 10) : null,
    doi: (formData.get("doi") as string)?.trim() ?? "",
    url: (formData.get("url") as string)?.trim() ?? "",
    note: (formData.get("note") as string)?.trim() ?? "",
    stageId: (formData.get("stageId") as string) ?? "",
  };

  await updatePublicationLib(pubId, fields);

  revalidatePath(`/${locale}/app/research-plan`);
  redirect(`/${locale}/app/research-plan?projectId=${projectId}&tab=publications&saved=pub_updated`);
}

export async function deletePublication(formData: FormData) {
  "use server";
  const locale = formData.get("locale") as string;
  const projectId = formData.get("projectId") as string;
  const pubId = formData.get("pubId") as string;

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);

  const project = await getProjectForUser(projectId, user);
  if (!project?._id || !canManageProject(project, user)) {
    redirect(`/${locale}/app/research-plan?projectId=${projectId}&error=forbidden`);
  }

  await deletePublicationLib(pubId);

  revalidatePath(`/${locale}/app/research-plan`);
  redirect(`/${locale}/app/research-plan?projectId=${projectId}&tab=publications&saved=pub_deleted`);
}

// ── Research Plan – Deliverable full CRUD ─────────────────────────────────────

export async function updateDeliverable(formData: FormData) {
  "use server";
  const locale = formData.get("locale") as string;
  const projectId = formData.get("projectId") as string;
  const delivId = formData.get("delivId") as string;

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);

  const project = await getProjectForUser(projectId, user);
  if (!project?._id || !canManageProject(project, user)) {
    redirect(`/${locale}/app/research-plan?projectId=${projectId}&error=forbidden`);
  }

  const title = (formData.get("title") as string)?.trim() ?? "";
  if (!title || title.length < 2) {
    redirect(`/${locale}/app/research-plan?projectId=${projectId}&tab=deliverables&error=invalid`);
  }

  const delivType = ((formData.get("type") as string) || "report") as
    | "publication" | "dataset" | "software" | "patent" | "protocol"
    | "report" | "training" | "equipment" | "other";
  const delivStatus = ((formData.get("status") as string) || "planned") as
    | "planned" | "in_progress" | "delayed" | "completed";
  const fields = {
    title,
    type: delivType,
    description: (formData.get("description") as string)?.trim() ?? "",
    plannedDate: (formData.get("plannedDate") as string) ?? "",
    status: delivStatus,
    link: (formData.get("link") as string)?.trim() ?? "",
    note: (formData.get("note") as string)?.trim() ?? "",
    stageId: (formData.get("stageId") as string) ?? "",
  };

  await updateDeliverableLib(delivId, fields);

  revalidatePath(`/${locale}/app/research-plan`);
  redirect(`/${locale}/app/research-plan?projectId=${projectId}&tab=deliverables&saved=deliv_updated`);
}

export async function deleteDeliverable(formData: FormData) {
  "use server";
  const locale = formData.get("locale") as string;
  const projectId = formData.get("projectId") as string;
  const delivId = formData.get("delivId") as string;

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);

  const project = await getProjectForUser(projectId, user);
  if (!project?._id || !canManageProject(project, user)) {
    redirect(`/${locale}/app/research-plan?projectId=${projectId}&error=forbidden`);
  }

  await deleteDeliverableLib(delivId);

  revalidatePath(`/${locale}/app/research-plan`);
  redirect(`/${locale}/app/research-plan?projectId=${projectId}&tab=deliverables&saved=deliv_deleted`);
}

// ── Chat ─────────────────────────────────────────────────────────────────────

export async function sendChatMessage(
  projectId: string,
  content: string,
): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  const trimmed = content.trim();
  if (!trimmed || trimmed.length > 2000) return { ok: false, error: "invalid" };

  const project = await getProjectForUser(projectId, user);
  if (!project?._id) return { ok: false, error: "forbidden" };

  const displayName = `${user.firstName} ${user.lastName}`.trim();
  const initials = `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase();

  await postChatMessage(projectId, user._id ?? "", displayName, initials, trimmed);
  return { ok: true };
}

// ── Reports ───────────────────────────────────────────────────────────────────

export async function createReport(formData: FormData) {
  const locale = formLocale(formData);
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);

  const raw = {
    projectId: formData.get("projectId"),
    type: formData.get("type"),
    title: formData.get("title"),
    period: formData.get("period") ?? "",
    linkedStageIds: formData.getAll("linkedStageIds"),
    sectionGoals: formData.get("sectionGoals") ?? "",
    sectionResults: formData.get("sectionResults") ?? "",
    sectionPublications: formData.get("sectionPublications") ?? "",
    sectionTimeline: formData.get("sectionTimeline") ?? "",
    sectionFinancial: formData.get("sectionFinancial") ?? "",
    sectionProblems: formData.get("sectionProblems") ?? "",
    sectionPlans: formData.get("sectionPlans") ?? "",
    note: formData.get("note") ?? "",
  };

  const parsed = reportInputSchema.safeParse(raw);
  if (!parsed.success) {
    redirect(`/${locale}/app/reports?projectId=${raw.projectId}&error=invalid`);
  }

  const project = await getProjectForUser(parsed.data.projectId, user);
  if (!project?._id) redirect(`/${locale}/app`);

  const report = await createReportLib(parsed.data, user);
  await createAuditEvent({
    action: "report.created",
    actor: user,
    projectId: parsed.data.projectId,
    metadata: { reportId: report._id ?? "", title: parsed.data.title },
  });

  revalidatePath(`/${locale}/app/reports`);
  redirect(`/${locale}/app/reports?projectId=${parsed.data.projectId}&saved=report`);
}

export async function updateReport(formData: FormData) {
  const locale = formLocale(formData);
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);

  const projectId = formData.get("projectId");
  const reportId = formData.get("reportId");

  if (typeof projectId !== "string" || typeof reportId !== "string") {
    redirect(`/${locale}/app`);
  }

  const raw = {
    projectId,
    type: formData.get("type"),
    title: formData.get("title"),
    period: formData.get("period") ?? "",
    linkedStageIds: formData.getAll("linkedStageIds"),
    sectionGoals: formData.get("sectionGoals") ?? "",
    sectionResults: formData.get("sectionResults") ?? "",
    sectionPublications: formData.get("sectionPublications") ?? "",
    sectionTimeline: formData.get("sectionTimeline") ?? "",
    sectionFinancial: formData.get("sectionFinancial") ?? "",
    sectionProblems: formData.get("sectionProblems") ?? "",
    sectionPlans: formData.get("sectionPlans") ?? "",
    sectionMeta: formData.get("sectionMeta") ?? "{}",
    note: formData.get("note") ?? "",
  };

  const parsed = reportInputSchema.safeParse(raw);
  if (!parsed.success) {
    redirect(`/${locale}/app/reports?projectId=${projectId}&reportId=${reportId}&error=invalid`);
  }

  const project = await getProjectForUser(projectId, user);
  if (!project?._id) redirect(`/${locale}/app`);

  await updateReportLib(reportId, parsed.data);
  await createAuditEvent({
    action: "report.updated",
    actor: user,
    projectId,
    metadata: { reportId, title: parsed.data.title },
  });

  revalidatePath(`/${locale}/app/reports`);
  redirect(`/${locale}/app/reports?projectId=${projectId}&reportId=${reportId}&saved=updated`);
}

export async function autoFillReportSections(formData: FormData) {
  const locale = formLocale(formData);
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);

  const projectId = formData.get("projectId") as string;
  const reportId = formData.get("reportId") as string;
  if (!projectId || !reportId) redirect(`/${locale}/app`);

  const project = await getProjectForUser(projectId, user);
  if (!project?._id) redirect(`/${locale}/app`);

  const isUk = locale === "uk";

  const [report, allStages, tasks, milestones, publications] = await Promise.all([
    getReportLib(reportId, projectId),
    listResearchStages(projectId),
    listTasks(projectId),
    listMilestones(projectId),
    listPublications(projectId),
  ]);

  if (!report) redirect(`/${locale}/app/reports?projectId=${projectId}`);

  // Use linked stages or all stages if none are linked
  const stages =
    report.linkedStageIds.length > 0
      ? allStages.filter((s) => report.linkedStageIds.includes(s._id ?? ""))
      : allStages;

  const today = new Date().toLocaleDateString(isUk ? "uk-UA" : "en-US", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const fmtDate = (d: string) => {
    if (!d) return "—";
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? "—" : dt.toLocaleDateString(isUk ? "uk-UA" : "en-US", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const stageStatusLabel: Record<string, string> = isUk
    ? { planned: "заплановано", active: "активний", completed: "завершено", reported: "звітовано" }
    : { planned: "planned", active: "active", completed: "completed", reported: "reported" };

  const taskStatusLabel: Record<string, string> = isUk
    ? { todo: "до виконання", in_progress: "в роботі", review: "перевірка", done: "виконано", cancelled: "скасовано" }
    : { todo: "to do", in_progress: "in progress", review: "review", done: "done", cancelled: "cancelled" };

  // ── sectionGoals ─────────────────────────────────────────────────────────────
  const sectionGoals = [
    isUk ? "МЕТА ТА ЗАВДАННЯ ДОСЛІДЖЕННЯ\n" : "RESEARCH GOALS AND OBJECTIVES\n",
    ...stages.map((s) =>
      [
        `Е${s.stageNumber}. ${s.title}`,
        s.startDate || s.endDate ? `   ${fmtDate(s.startDate)} — ${fmtDate(s.endDate)}` : "",
        s.goals ? `\n   ${s.goals.trim()}` : "",
        s.indicators ? `\n   ${isUk ? "Показники:" : "Indicators:"} ${s.indicators.trim()}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    ),
  ].join("\n\n");

  // ── sectionTimeline ───────────────────────────────────────────────────────────
  const sectionTimeline = [
    isUk
      ? `ХРОНОЛОГІЯ ВИКОНАННЯ ПРОЄКТУ\n(станом на ${today})\n`
      : `PROJECT TIMELINE\n(as of ${today})\n`,
    ...stages.map((s) =>
      [
        `Е${s.stageNumber}  ${s.title}`,
        `   ${fmtDate(s.startDate)} — ${fmtDate(s.endDate)}`,
        `   ${isUk ? "Статус" : "Status"}: ${stageStatusLabel[s.status] ?? s.status}  |  ${isUk ? "Прогрес" : "Progress"}: ${s.progress}%`,
      ].join("\n"),
    ),
  ].join("\n\n");

  // ── sectionResults ────────────────────────────────────────────────────────────
  const reachedMilestones = milestones.filter((m) => m.status === "reached");
  const doneTasks = tasks.filter(
    (t) => t.status === "done" && stages.some((s) => s.linkedTaskIds.includes(t._id ?? "")),
  );

  const sectionResults = [
    isUk ? "РЕЗУЛЬТАТИ ВИКОНАННЯ\n" : "RESULTS\n",
    reachedMilestones.length > 0
      ? [isUk ? "── Досягнуті вісі ──" : "── Reached milestones ──",
          ...reachedMilestones.map((m) => `◆ ${m.title}  (${fmtDate(m.dueDate)})`),
        ].join("\n")
      : "",
    doneTasks.length > 0
      ? [isUk ? "── Виконані завдання ──" : "── Completed tasks ──",
          ...doneTasks.map((t) => `✓ ${t.title}`),
        ].join("\n")
      : "",
    [
      isUk ? "── Прогрес по етапах ──" : "── Stage progress ──",
      ...stages.map(
        (s) => `• Е${s.stageNumber} ${s.title}: ${s.progress}% [${stageStatusLabel[s.status] ?? s.status}]`,
      ),
    ].join("\n"),
  ]
    .filter(Boolean)
    .join("\n\n");

  // ── sectionPublications ───────────────────────────────────────────────────────
  const pubTypeLabel: Record<string, string> = isUk
    ? { article: "Стаття", conference: "Тези конф.", book_chapter: "Розділ книги", monograph: "Монографія", other: "Інше" }
    : { article: "Article", conference: "Conference abstract", book_chapter: "Book chapter", monograph: "Monograph", other: "Other" };
  const pubStatusLabel: Record<string, string> = isUk
    ? { planned: "заплановано", submitted: "подано", accepted: "прийнято", published: "опубліковано" }
    : { planned: "planned", submitted: "submitted", accepted: "accepted", published: "published" };

  const sectionPublications =
    publications.length === 0
      ? isUk
        ? "ПУБЛІКАЦІЇ\n\nПублікації ще не додано."
        : "PUBLICATIONS\n\nNo publications added yet."
      : [
          isUk ? "ПУБЛІКАЦІЇ ТА АПРОБАЦІЯ РЕЗУЛЬТАТІВ\n" : "PUBLICATIONS AND RESULTS DISSEMINATION\n",
          ...publications.map((p, i) =>
            [
              `${i + 1}. [${pubTypeLabel[p.type] ?? p.type}] ${p.title}`,
              p.authors ? `   ${isUk ? "Автори" : "Authors"}: ${p.authors}` : "",
              p.journal ? `   ${isUk ? "Журнал" : "Journal"}: ${p.journal}` : "",
              `   ${isUk ? "Статус" : "Status"}: ${pubStatusLabel[p.status] ?? p.status}${p.expectedYear ? `, ${p.expectedYear}` : ""}`,
              p.doi ? `   DOI: ${p.doi}` : "",
            ]
              .filter(Boolean)
              .join("\n"),
          ),
          `\n${isUk ? "Всього" : "Total"}: ${publications.length}`,
        ].join("\n\n");

  // ── sectionPlans ──────────────────────────────────────────────────────────────
  const upcomingMilestones = milestones.filter((m) => m.status === "upcoming");
  const pendingTasks = tasks.filter(
    (t) =>
      (t.status === "todo" || t.status === "in_progress") &&
      stages.some((s) => s.linkedTaskIds.includes(t._id ?? "")),
  );
  const plannedStages = stages.filter((s) => s.status === "planned");

  const sectionPlans = [
    isUk ? "ПЛАНИ НА НАСТУПНИЙ ЗВІТНИЙ ПЕРІОД\n" : "PLANS FOR THE NEXT REPORTING PERIOD\n",
    pendingTasks.length > 0
      ? [isUk ? "── Заплановані завдання ──" : "── Planned tasks ──",
          ...pendingTasks.map(
            (t) => `○ ${t.title}  [${taskStatusLabel[t.status] ?? t.status}]${t.dueDate ? `  (до ${fmtDate(t.dueDate)})` : ""}`,
          ),
        ].join("\n")
      : "",
    upcomingMilestones.length > 0
      ? [isUk ? "── Майбутні вісі ──" : "── Upcoming milestones ──",
          ...upcomingMilestones.map((m) => `◆ ${m.title}  (до ${fmtDate(m.dueDate)})`),
        ].join("\n")
      : "",
    plannedStages.length > 0
      ? [
          isUk ? "── Заплановані етапи ──" : "── Planned stages ──",
          ...plannedStages.map(
            (s) =>
              `Е${s.stageNumber} ${s.title}  (${fmtDate(s.startDate)} — ${fmtDate(s.endDate)})`,
          ),
        ].join("\n")
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  await updateReportLib(reportId, {
    sectionGoals,
    sectionTimeline,
    sectionResults,
    sectionPublications,
    sectionPlans,
  });

  await createAuditEvent({
    action: "report.updated",
    actor: user,
    projectId,
    metadata: { reportId, autofill: "true" },
  });

  revalidatePath(`/${locale}/app/reports`);
  redirect(
    `/${locale}/app/reports?projectId=${projectId}&tab=editor&reportId=${reportId}&saved=autofill`,
  );
}

export async function updateReportStatus(formData: FormData) {
  const locale = formLocale(formData);
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);

  const projectId = formData.get("projectId");
  const reportId = formData.get("reportId");
  const status = formData.get("status");

  if (
    typeof projectId !== "string" ||
    typeof reportId !== "string" ||
    typeof status !== "string"
  ) {
    redirect(`/${locale}/app`);
  }

  if (!(reportStatuses as readonly string[]).includes(status)) {
    redirect(`/${locale}/app/reports?projectId=${projectId}&error=invalid`);
  }

  const project = await getProjectForUser(projectId, user);
  if (!project?._id) redirect(`/${locale}/app`);

  await updateReportStatusLib(reportId, status as (typeof reportStatuses)[number], user);
  await createAuditEvent({
    action: "report.status_changed",
    actor: user,
    projectId,
    metadata: { reportId, status },
  });

  revalidatePath(`/${locale}/app/reports`);
  redirect(`/${locale}/app/reports?projectId=${projectId}&saved=status`);
}

export async function deleteReport(formData: FormData) {
  const locale = formLocale(formData);
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);

  const projectId = formData.get("projectId");
  const reportId = formData.get("reportId");

  if (typeof projectId !== "string" || typeof reportId !== "string") {
    redirect(`/${locale}/app`);
  }

  const project = await getProjectForUser(projectId, user);
  if (!project?._id) redirect(`/${locale}/app`);

  if (!canManageProject(project, user)) {
    redirect(`/${locale}/app/reports?projectId=${projectId}&error=forbidden`);
  }

  await deleteReportLib(reportId, projectId);
  await createAuditEvent({
    action: "report.updated",
    actor: user,
    projectId,
    metadata: { reportId, action: "deleted" },
  });

  revalidatePath(`/${locale}/app/reports`);
  redirect(`/${locale}/app/reports?projectId=${projectId}&saved=deleted`);
}

// ── Research Events ───────────────────────────────────────────────────────────

export async function createResearchEvent(formData: FormData) {
  const locale = formLocale(formData);
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);

  const projectId = String(formData.get("projectId") ?? "");
  const returnTo = safeAppReturnTo(formData, locale, `/${locale}/app/events?projectId=${projectId}`);

  const project = await getProjectForUser(projectId, user);
  if (!project || !canManageProject(project, user)) {
    redirect(withQuery(returnTo, "error", "forbidden"));
  }

  const payload = researchEventInputSchema.safeParse({
    projectId,
    title: formData.get("title"),
    type: formData.get("type"),
    format: formData.get("format"),
    status: formData.get("status") || "planned",
    startDate: formData.get("startDate") || "",
    endDate: formData.get("endDate") || "",
    location: formData.get("location") || "",
    url: formData.get("url") || "",
    abstractDeadline: formData.get("abstractDeadline") || "",
    fullPaperDeadline: formData.get("fullPaperDeadline") || "",
    registrationDeadline: formData.get("registrationDeadline") || "",
    registrationFormUrl: formData.get("registrationFormUrl") || "",
    organizingEmail: formData.get("organizingEmail") || "",
    languages: formData.get("languages") || "",
    sections: formData.get("sections") || "",
    description: formData.get("description") || "",
  });

  if (!payload.success) redirect(withQuery(returnTo, "error", "invalid"));

  const event = await createResearchEventLib(payload.data);
  await createAuditEvent({
    action: "event.created",
    actor: user,
    projectId,
    metadata: { title: event.title, type: event.type },
  });

  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function updateResearchEvent(formData: FormData) {
  const locale = formLocale(formData);
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);

  const projectId = String(formData.get("projectId") ?? "");
  const eventId = String(formData.get("eventId") ?? "");
  const returnTo = safeAppReturnTo(formData, locale, `/${locale}/app/events?projectId=${projectId}`);

  const project = await getProjectForUser(projectId, user);
  if (!project || !canManageProject(project, user)) {
    redirect(withQuery(returnTo, "error", "forbidden"));
  }

  const payload = researchEventInputSchema.partial().safeParse({
    title: formData.get("title"),
    type: formData.get("type"),
    format: formData.get("format"),
    status: formData.get("status"),
    startDate: formData.get("startDate") || "",
    endDate: formData.get("endDate") || "",
    location: formData.get("location") || "",
    url: formData.get("url") || "",
    abstractDeadline: formData.get("abstractDeadline") || "",
    fullPaperDeadline: formData.get("fullPaperDeadline") || "",
    registrationDeadline: formData.get("registrationDeadline") || "",
    registrationFormUrl: formData.get("registrationFormUrl") || "",
    organizingEmail: formData.get("organizingEmail") || "",
    languages: formData.get("languages") || "",
    sections: formData.get("sections") || "",
    description: formData.get("description") || "",
  });

  if (!payload.success) redirect(withQuery(returnTo, "error", "invalid"));

  await updateResearchEventLib(eventId, payload.data);
  await createAuditEvent({
    action: "event.updated",
    actor: user,
    projectId,
    metadata: { eventId, title: String(formData.get("title") ?? "") },
  });

  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function deleteResearchEvent(formData: FormData) {
  const locale = formLocale(formData);
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);

  const projectId = String(formData.get("projectId") ?? "");
  const eventId = String(formData.get("eventId") ?? "");
  const returnTo = `/${locale}/app/events?projectId=${projectId}`;

  const project = await getProjectForUser(projectId, user);
  if (!project || !canManageProject(project, user)) redirect(returnTo);

  await deleteResearchEventLib(eventId);
  await createAuditEvent({
    action: "event.deleted",
    actor: user,
    projectId,
    metadata: { eventId },
  });

  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function addEventParticipation(formData: FormData) {
  const locale = formLocale(formData);
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);

  const projectId = String(formData.get("projectId") ?? "");
  const returnTo = safeAppReturnTo(formData, locale, `/${locale}/app/events?projectId=${projectId}`);

  const project = await getProjectForUser(projectId, user);
  if (!project) redirect(withQuery(returnTo, "error", "forbidden"));

  const rawContribType = formData.get("contributionType");
  const payload = eventParticipationInputSchema.safeParse({
    eventId: formData.get("eventId"),
    projectId,
    participantId: formData.get("participantId"),
    participantName: formData.get("participantName") || "",
    affiliation: formData.get("affiliation") || "",
    role: formData.get("role"),
    section: formData.get("section") || "",
    contributionTitle: formData.get("contributionTitle") || "",
    contributionType: rawContribType && rawContribType !== "" ? rawContribType : null,
    status: formData.get("status") || "planned",
    notes: formData.get("notes") || "",
  });

  if (!payload.success) redirect(withQuery(returnTo, "error", "invalid"));

  const participation = await addEventParticipationLib(payload.data);
  await createAuditEvent({
    action: "event.participation.added",
    actor: user,
    projectId,
    metadata: {
      eventId: payload.data.eventId,
      participantName: payload.data.participantName,
      role: payload.data.role,
    },
  });

  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function updateEventParticipation(formData: FormData) {
  const locale = formLocale(formData);
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);

  const projectId = String(formData.get("projectId") ?? "");
  const participationId = String(formData.get("participationId") ?? "");
  const returnTo = safeAppReturnTo(formData, locale, `/${locale}/app/events?projectId=${projectId}`);

  const project = await getProjectForUser(projectId, user);
  if (!project) redirect(withQuery(returnTo, "error", "forbidden"));

  const rawContribType = formData.get("contributionType");
  const payload = eventParticipationInputSchema.partial().safeParse({
    affiliation: formData.get("affiliation") || "",
    role: formData.get("role"),
    section: formData.get("section") || "",
    contributionTitle: formData.get("contributionTitle") || "",
    contributionType: rawContribType && rawContribType !== "" ? rawContribType : null,
    status: formData.get("status"),
    notes: formData.get("notes") || "",
  });

  if (!payload.success) redirect(withQuery(returnTo, "error", "invalid"));

  await updateEventParticipationLib(participationId, payload.data);
  await createAuditEvent({
    action: "event.participation.updated",
    actor: user,
    projectId,
    metadata: { participationId, status: String(formData.get("status") ?? "") },
  });

  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function removeEventParticipation(formData: FormData) {
  const locale = formLocale(formData);
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);

  const projectId = String(formData.get("projectId") ?? "");
  const participationId = String(formData.get("participationId") ?? "");
  const returnTo = safeAppReturnTo(formData, locale, `/${locale}/app/events?projectId=${projectId}`);

  const project = await getProjectForUser(projectId, user);
  if (!project) redirect(returnTo);

  await removeEventParticipationLib(participationId);
  await createAuditEvent({
    action: "event.participation.removed",
    actor: user,
    projectId,
    metadata: { participationId },
  });

  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function addSubmissionItem(formData: FormData) {
  const locale = formLocale(formData);
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);

  const projectId = String(formData.get("projectId") ?? "");
  const participationId = String(formData.get("participationId") ?? "");
  const returnTo = safeAppReturnTo(formData, locale, `/${locale}/app/events?projectId=${projectId}`);

  const project = await getProjectForUser(projectId, user);
  if (!project) redirect(withQuery(returnTo, "error", "forbidden"));

  const sid = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

  const payload = submissionItemSchema.safeParse({
    sid,
    type: formData.get("type") || "abstract",
    title: formData.get("title") || "",
    coAuthors: formData.get("coAuthors") || "",
    section: formData.get("section") || "",
    deadline: formData.get("deadline") || "",
    submittedAt: formData.get("submittedAt") || "",
    status: formData.get("status") || "draft",
    revisionDeadline: formData.get("revisionDeadline") || "",
    revisionNotes: formData.get("revisionNotes") || "",
  });

  if (!payload.success) redirect(withQuery(returnTo, "error", "invalid"));

  await addSubmissionLib(participationId, payload.data);
  await createAuditEvent({
    action: "event.submission.added",
    actor: user,
    projectId,
    metadata: { participationId, type: payload.data.type, title: payload.data.title },
  });

  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function updateSubmissionItem(formData: FormData) {
  const locale = formLocale(formData);
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);

  const projectId = String(formData.get("projectId") ?? "");
  const participationId = String(formData.get("participationId") ?? "");
  const sid = String(formData.get("sid") ?? "");
  const returnTo = safeAppReturnTo(formData, locale, `/${locale}/app/events?projectId=${projectId}`);

  const project = await getProjectForUser(projectId, user);
  if (!project) redirect(withQuery(returnTo, "error", "forbidden"));

  const payload = submissionItemSchema.partial().omit({ sid: true }).safeParse({
    type: formData.get("type") || "abstract",
    title: formData.get("title") || "",
    coAuthors: formData.get("coAuthors") || "",
    section: formData.get("section") || "",
    deadline: formData.get("deadline") || "",
    submittedAt: formData.get("submittedAt") || "",
    status: formData.get("status") || "draft",
    revisionDeadline: formData.get("revisionDeadline") || "",
    revisionNotes: formData.get("revisionNotes") || "",
  });

  if (!payload.success) redirect(withQuery(returnTo, "error", "invalid"));

  await updateSubmissionLib(participationId, sid, payload.data);
  await createAuditEvent({
    action: "event.submission.updated",
    actor: user,
    projectId,
    metadata: { participationId, sid, status: String(formData.get("status") ?? "") },
  });

  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function removeSubmissionItem(formData: FormData) {
  const locale = formLocale(formData);
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);

  const projectId = String(formData.get("projectId") ?? "");
  const participationId = String(formData.get("participationId") ?? "");
  const sid = String(formData.get("sid") ?? "");
  const returnTo = safeAppReturnTo(formData, locale, `/${locale}/app/events?projectId=${projectId}`);

  const project = await getProjectForUser(projectId, user);
  if (!project) redirect(returnTo);

  await removeSubmissionLib(participationId, sid);
  await createAuditEvent({
    action: "event.submission.removed",
    actor: user,
    projectId,
    metadata: { participationId, sid },
  });

  revalidatePath(returnTo);
  redirect(returnTo);
}

// ── Manuscripts ──────────────────────────────────────────────────────────────

export async function createManuscriptAction(
  projectId: string,
  input: {
    title: string;
    type: ManuscriptType;
    abstract?: string;
    keywords?: string[];
    authors?: ManuscriptAuthor[];
    blocks?: ManuscriptBlock[];
    journal?: string;
    doi?: string;
    dissertationMeta?: DissertationMeta;
  },
) {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  const project = await getProjectForUser(projectId, user);
  if (!project?._id) return { ok: false, error: "forbidden" };

  const manuscript = await createManuscriptLib(
    {
      projectId,
      title: input.title,
      type: input.type,
      abstract: input.abstract ?? "",
      keywords: input.keywords ?? [],
      authors: input.authors ?? [],
      journal: input.journal ?? "",
      doi: input.doi ?? "",
      dissertationMeta: input.dissertationMeta,
      blocks: input.blocks ?? [],
      attachedRecordIds: [],
      attachedExperimentIds: [],
      note: "",
    },
    user,
  );

  await createAuditEvent({
    action: "manuscript.created",
    actor: user,
    projectId,
    metadata: { title: input.title, type: input.type },
  });

  revalidatePath(`/[locale]/app/project`, "page");
  return { ok: true, manuscript };
}

export async function updateManuscriptStatusAction(
  manuscriptId: string,
  projectId: string,
  status: ManuscriptStatus,
) {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  const project = await getProjectForUser(projectId, user);
  if (!project?._id) return { ok: false, error: "forbidden" };

  await updateManuscriptLib(manuscriptId, { status } as Partial<ManuscriptInput>);

  await createAuditEvent({
    action: "manuscript.updated",
    actor: user,
    projectId,
    metadata: { manuscriptId, status },
  });

  return { ok: true };
}

export async function updateManuscriptAction(
  manuscriptId: string,
  projectId: string,
  input: Partial<ManuscriptInput> & { status?: ManuscriptStatus },
) {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  const project = await getProjectForUser(projectId, user);
  if (!project?._id) return { ok: false, error: "forbidden" };

  await updateManuscriptLib(manuscriptId, input);

  await createAuditEvent({
    action: "manuscript.blocks_updated",
    actor: user,
    projectId,
    metadata: { manuscriptId },
  });

  return { ok: true };
}

export async function deleteManuscriptAction(
  manuscriptId: string,
  projectId: string,
) {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  const project = await getProjectForUser(projectId, user);
  if (!project?._id || !canManageProject(project, user)) {
    return { ok: false, error: "forbidden" };
  }

  await deleteManuscriptLib(manuscriptId, projectId);

  await createAuditEvent({
    action: "manuscript.deleted",
    actor: user,
    projectId,
  });

  revalidatePath(`/[locale]/app/project`, "page");
  return { ok: true };
}

// ── Activity diary ────────────────────────────────────────────────────────────

export async function saveDiaryEntry(formData: FormData) {
  "use server";
  const user = await getCurrentUser();
  if (!user?._id) return { ok: false, error: "unauthenticated" };

  const id = formData.get("_id") as string | null;

  const raw = {
    projectId: formData.get("projectId") as string,
    userId: user._id,
    date: formData.get("date") as string,
    type: formData.get("type") as string,
    title: formData.get("title") as string,
    body: (formData.get("body") as string) || "",
    person: (formData.get("person") as string) || "",
    place: (formData.get("place") as string) || "",
    recipient: (formData.get("recipient") as string) || "",
    docRef: (formData.get("docRef") as string) || "",
    outcome: (formData.get("outcome") as string) || "",
    tags: [],
  };

  const parsed = diaryEntryInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "invalid" };

  if (id) {
    const updated = await updateDiaryEntryLib(id, parsed.data);
    return updated ? { ok: true, entry: updated } : { ok: false, error: "not_found" };
  }

  const created = await createDiaryEntryLib(parsed.data);
  return { ok: true, entry: created };
}

export async function deleteDiaryEntry(entryId: string) {
  "use server";
  const user = await getCurrentUser();
  if (!user?._id) return { ok: false, error: "unauthenticated" };

  const ok = await deleteDiaryEntryLib(entryId);
  return { ok };
}

// ── Almanac quick-patch actions (no redirect) ─────────────────────────────────

export async function patchTaskStatus(taskId: string, status: string, projectId: string) {
  "use server";
  const user = await getCurrentUser();
  if (!user?._id) return { ok: false };
  await updateTaskStatus(taskId, status as Parameters<typeof updateTaskStatus>[1], user);
  revalidatePath("/[locale]/app/almanac", "page");
  revalidatePath("/[locale]/app/planning", "page");
  return { ok: true };
}

export async function patchExperimentStatusAlmanac(experimentId: string, status: string, projectId: string) {
  "use server";
  const user = await getCurrentUser();
  if (!user?._id) return { ok: false };
  if (!(experimentStatuses as readonly string[]).includes(status)) return { ok: false };
  await updateExperimentStatusLib(experimentId, status as Parameters<typeof updateExperimentStatusLib>[1]);
  revalidatePath("/[locale]/app/almanac", "page");
  revalidatePath("/[locale]/app/experiments", "page");
  return { ok: true };
}
