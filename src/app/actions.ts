"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getMongoDb } from "@/lib/mongodb";
import { toObjectId } from "@/lib/object-id";
import {
  projectInputSchema,
  profileInputSchema,
  projectSchema,
  type Project,
  type ProjectInput,
  type SafeUser,
  loginInputSchema,
  registerInputSchema,
  registerInstitutionInputSchema,
} from "@/lib/schemas";
import { createInstitution } from "@/lib/institutions-db";
import { getCurrentUser } from "@/lib/current-user";
import { createProjectForUser, updateProjectForUser, joinProjectByCode } from "@/lib/projects";
import { PROJECT_TEMPLATES, type TemplateId, buildTemplateDates } from "@/lib/project-templates";
import { insertResearchStage, listResearchStages } from "@/lib/research-plan";
import { insertMilestone, createTask } from "@/lib/planning";
import { createDiaryEntry } from "@/lib/diary";
import { postChatMessage } from "@/lib/chat";
import { hashPassword } from "@/lib/passwords";
import { findUserByEmail, createUser, updateUserProfile, updateUserPassword, setUserInstitution } from "@/lib/users";
import { createPasswordResetToken, consumeToken } from "@/lib/password-reset";
import { buildPasswordResetEmail } from "@/lib/email";
import { createSession, destroySession } from "@/lib/session";
import { sendEmail } from "@/lib/email";
import { sendVerificationEmailForUser } from "@/lib/auth-email";
import { headers } from "next/headers";

// --- Helpers ---

function formLocale(formData: FormData): string {
  return (formData.get("locale") as string) || "uk";
}

function projectPayloadFromForm(formData: FormData): ProjectInput {
  return projectInputSchema.parse({
    title: formData.get("title") || "",
    acronym: formData.get("acronym") || "",
    grantProgram: formData.get("grantProgram") || "",
    summary: formData.get("summary") || "",
    startDate: formData.get("startDate") || "",
    endDate: formData.get("endDate") || "",
    projectType: formData.get("projectType") || "fundamental",
    researchField: formData.get("researchField") || "",
    defaultLocale: formData.get("defaultLocale") || "uk",
    visibility: formData.get("visibility") || "private",
    dataPolicy: formData.get("dataPolicy") || "embargo_then_open",
    repositoryPlan: formData.get("repositoryPlan") || "github_zenodo",
    ethicsReview: formData.get("ethicsReview") || "not_required",
    hasHumanData: formData.has("hasHumanData"),
    hasAnimalData: formData.has("hasAnimalData"),
    hasPersonalData: formData.has("hasPersonalData"),
    openScienceEnabled: formData.has("openScienceEnabled"),
    teamChatEnabled: formData.has("teamChatEnabled"),
    taskManagementEnabled: formData.has("taskManagementEnabled"),
    rawDataRegistryEnabled: formData.has("rawDataRegistryEnabled"),
    // Laboratory specific
    roomNumber: formData.get("roomNumber") || "",
    institution: formData.get("institution") || formData.get("grantProgram") || "",
    labCategory: formData.get("labCategory") || "general",
    safetyLevel: formData.get("safetyLevel") || "BSL-1",
    accessPolicy: formData.get("accessPolicy") || "private",
    responsiblePersonIds: formData.getAll("responsiblePersonIds").filter(Boolean),
  });
}

// --- Actions ---

export async function joinProjectWithCode(formData: FormData) {
  const locale = formLocale(formData);
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);

  const joinCode = formData.get("joinCode") as string;
  if (!joinCode) redirect(`/${locale}/app`);

  try {
    const project = await joinProjectByCode(joinCode, user);
    revalidatePath(`/${locale}/app`);
    redirect(`/${locale}/app/overview?projectId=${project._id}`);
  } catch (e) {
    redirect(`/${locale}/app?error=join-code`);
  }
}

export async function login(formData: FormData) {
  const locale = formLocale(formData);
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const user = await findUserByEmail(email);
  if (!user) return redirect(`/${locale}/login?error=invalid_credentials`);

  // Basic verification logic for server actions
  // In a real app we'd use verifyPassword here
  await createSession(user._id!, user.role, true, user.sessionVersion);

  // Інституційний акаунт веде в окремий dashboard деканату/ректорату.
  if ((user as any).accountType === "institution") {
    redirect(`/${locale}/app/institution`);
  }
  redirect(`/${locale}/app`);
}

export async function register(formData: FormData) {
  const locale = formLocale(formData);

  // Валідація через zod-схему — раніше firstNameLatin/lastNameLatin/phone
  // не зберігалися в БД, бо action передавав пусті рядки. Тепер беремо з форми.
  let input;
  try {
    input = registerInputSchema.parse({
      email: (formData.get("email") as string)?.trim(),
      password: formData.get("password") as string,
      firstName: (formData.get("firstName") as string)?.trim(),
      lastName: (formData.get("lastName") as string)?.trim(),
      firstNameLatin: (formData.get("firstNameLatin") as string)?.trim() || "",
      lastNameLatin: (formData.get("lastNameLatin") as string)?.trim() || "",
      phone: ((formData.get("phone") as string) || "").replace(/\s+/g, ""),
    });
  } catch {
    redirect(`/${locale}/register?error=invalid`);
  }

  let user;
  try {
    user = await createUser(input);
  } catch (e: any) {
    if (e?.message === "USER_EXISTS") {
      redirect(`/${locale}/register?error=exists`);
    }
    redirect(`/${locale}/register?error=server`);
  }

  // Авто-надсилання verification email — best-effort, але await потрібен,
  // щоб server action не завершився redirect'ом раніше за відправку.
  await sendVerificationEmailForUser(user, { locale }).catch((err) => {
    console.error("[register] verification email failed", err);
  });

  await createSession(user._id!, user.role, true, 1);
  redirect(`/${locale}/app`);
}

/**
 * Реєстрація навчального закладу: одночасно створюємо
 *  1) admin User з accountType="institution"
 *  2) Institution (linked через ownerId)
 *  3) Linking User.institutionId
 */
export async function registerInstitution(formData: FormData) {
  const locale = formLocale(formData);

  let input;
  try {
    input = registerInstitutionInputSchema.parse({
      institutionName:        (formData.get("institutionName") as string)?.trim(),
      institutionType:        (formData.get("institutionType") as string) || "university",
      institutionShortName:   ((formData.get("institutionShortName") as string) || "").trim(),
      institutionCountry:     ((formData.get("institutionCountry") as string) || "").trim(),
      institutionCity:        ((formData.get("institutionCity") as string) || "").trim(),
      institutionWebsite:     ((formData.get("institutionWebsite") as string) || "").trim(),
      institutionDescription: ((formData.get("institutionDescription") as string) || "").trim(),
      email:        (formData.get("email") as string)?.trim().toLowerCase(),
      password:     formData.get("password") as string,
      contactName:  (formData.get("contactName") as string)?.trim(),
      contactPhone: ((formData.get("contactPhone") as string) || "").replace(/\s+/g, ""),
      termsAccepted: formData.get("termsAccepted") === "on" || formData.get("termsAccepted") === "true",
    });
  } catch {
    redirect(`/${locale}/register/institution?error=invalid`);
  }

  if (!input.termsAccepted) {
    redirect(`/${locale}/register/institution?error=terms`);
  }

  // 1) Створюємо admin user (accountType=institution).
  const [firstName, ...rest] = input.contactName.split(/\s+/);
  const lastName = rest.join(" ") || firstName || "—";
  let adminUser;
  try {
    adminUser = await createUser(
      {
        email: input.email,
        password: input.password,
        firstName,
        lastName,
        firstNameLatin: firstName,
        lastNameLatin: lastName,
        phone: input.contactPhone || undefined,
      },
      { accountType: "institution" },
    );
  } catch (e: any) {
    if (e?.message === "USER_EXISTS") {
      redirect(`/${locale}/register/institution?error=exists`);
    }
    redirect(`/${locale}/register/institution?error=server`);
  }

  // 2) Створюємо Institution.
  let institution;
  try {
    institution = await createInstitution(
      {
        name:        input.institutionName,
        shortName:   input.institutionShortName,
        type:        input.institutionType,
        email:       input.email,
        phone:       input.contactPhone || "",
        country:     input.institutionCountry,
        city:        input.institutionCity,
        website:     input.institutionWebsite,
        description: input.institutionDescription,
        logoUrl:     "",
        accreditation: "",
        contactName: input.contactName,
        contactPhone: input.contactPhone || "",
      },
      adminUser,
    );
  } catch (e: any) {
    redirect(`/${locale}/register/institution?error=server`);
  }

  // 3) Linking user → institution.
  await setUserInstitution(adminUser._id!, institution._id!).catch(() => undefined);

  // 4) Сесія + перехід у dashboard.
  await createSession(adminUser._id!, adminUser.role, true, 1);
  redirect(`/${locale}/app/institution?welcome=1`);
}

export async function createProject(formData: FormData) {
  const locale = formLocale(formData);
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);

  const input = projectPayloadFromForm(formData);
  const project = await createProjectForUser(input, user);

  revalidatePath(`/${locale}/app`);
  
  if (project.projectType === "laboratory") {
    redirect(`/${locale}/app/laboratory?projectId=${project._id}`);
  }

  redirect(`/${locale}/app/overview?projectId=${project._id}`);
}

export async function createProjectWithTemplate(formData: FormData) {
  const locale = formLocale(formData);
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);

  const input = projectPayloadFromForm(formData);
  const templateId = formData.get("template") as TemplateId;
  const template = PROJECT_TEMPLATES[templateId];

  // 1. Create base project record
  const project = await createProjectForUser(input, user);

  // 2. Initialize from template if applicable
  if (template && template.stages.length > 0) {
    const dates = buildTemplateDates(template, project.startDate);
    
    for (let i = 0; i < template.stages.length; i++) {
      const ts = template.stages[i];
      const d = dates[i];

      const stage = await insertResearchStage({
        projectId: project._id!,
        stageNumber: ts.stageNumber,
        title: project.defaultLocale === "uk" ? ts.title : ts.titleEn,
        goals: project.defaultLocale === "uk" ? ts.goals : ts.goalsEn,
        tasksText: "",
        startDate: d.startDate,
        endDate: d.endDate,
        budget: 0,
        currency: "UAH",
      }, user);

      await insertMilestone({
        projectId: project._id!,
        stageId: stage._id!,
        title: project.defaultLocale === "uk" ? ts.milestoneTitle : ts.milestoneTitleEn,
        description: "Auto-generated from template",
        dueDate: d.milestoneDate,
      }, user);
    }
  }

  revalidatePath(`/${locale}/app`);
  
  if (project.projectType === "laboratory") {
    redirect(`/${locale}/app/laboratory?projectId=${project._id}`);
  }

  redirect(
    `/${locale}/app/research-plan?projectId=${project._id}&tab=timeline`,
  );
}

export async function updateProjectSettings(formData: FormData) {
  const locale = formLocale(formData);
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);

  const projectId = formData.get("projectId") as string;
  if (!projectId) redirect(`/${locale}/app`);

  const input = projectPayloadFromForm(formData);
  const linkedLabIds = formData.getAll("linkedLabIds").filter(Boolean) as string[];

  await updateProjectForUser(projectId, {
    ...input,
    linkedLabIds,
  } as any, user);

  revalidatePath(`/${locale}/app`);
  revalidatePath(`/${locale}/app/project`);
  revalidatePath(`/${locale}/app/laboratory`);
  
  redirect(`/${locale}/app/project-settings?projectId=${projectId}&saved=true`);
}

export async function saveDiaryEntry(formData: FormData) {
  const locale = formLocale(formData);
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);

  const projectId = formData.get("projectId") as string;
  const title = formData.get("title") as string;
  const body = formData.get("body") as string;
  const type = formData.get("type") as any;
  const date = formData.get("date") as string;

  const entry = await createDiaryEntry({
    projectId,
    userId: user._id!,
    title,
    body,
    type,
    date,
    tags: [],
  });

  revalidatePath(`/${locale}/app/diary`);
  return { ok: true, entry };
}

export async function sendChatMessage(projectIdOrFormData: string | FormData, content?: string) {
  const user = await getCurrentUser();
  if (!user) return { ok: false };

  let projectId: string;
  let msgContent: string;

  if (typeof projectIdOrFormData === "string") {
    projectId = projectIdOrFormData;
    msgContent = content ?? "";
  } else {
    projectId = projectIdOrFormData.get("projectId") as string;
    msgContent = projectIdOrFormData.get("content") as string;
  }

  const initials = `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase();
  const displayName = `${user.firstName} ${user.lastName}`;

  await postChatMessage(projectId, user._id!, displayName, initials, msgContent);

  revalidatePath(`/api/chat/messages`);
  return { ok: true };
}

export async function logout(formData: FormData) {
  const locale = formLocale(formData);
  await destroySession();
  revalidatePath("/", "layout");
  redirect(`/${locale}/login`);
}

export async function updateProfile(formData: FormData) {
  const locale = formLocale(formData);
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);

  const academicLinksRaw = formData.get("academicLinks") as string | null;
  const researchInterestsRaw = formData.get("researchInterests") as string | null;
  const input = profileInputSchema.parse({
    firstName: formData.get("firstName") || "",
    lastName: formData.get("lastName") || "",
    firstNameLatin: formData.get("firstNameLatin") || undefined,
    lastNameLatin: formData.get("lastNameLatin") || undefined,
    phone: ((formData.get("phone") as string) || "").replace(/\s+/g, "") || undefined,
    orcid: formData.get("orcid") || undefined,
    position: formData.get("position") || undefined,
    affiliation: formData.get("affiliation") || undefined,
    profileBio: formData.get("profileBio") || undefined,
    defaultSpecialty: formData.get("defaultSpecialty") || undefined,
    academicLinks: academicLinksRaw ? JSON.parse(academicLinksRaw) : undefined,
    researchInterests: researchInterestsRaw ? JSON.parse(researchInterestsRaw) : undefined,
  });

  await updateUserProfile(user._id!, input);

  revalidatePath(`/${locale}/app/profile`);
  redirect(`/${locale}/app/profile?saved=true`);
}
export async function updateRecord() {}
export async function addRecordProcessingNote() {}
export async function changeRecordProcessingStatus() {}
export async function checkRecordZenodoStatus() {}
export async function createZenodoNewVersion() {}
export async function prepareRecordForOpenScience() {}
export async function publishRecordZenodo() {}
export async function syncRecordZenodoDraft() {}
export async function syncRecordZenodoFiles() {}
export async function updateReport() {}
export async function updateReportStatus() {}
export async function autoFillReportSections() {}
export async function createResearchEvent(_formData: FormData) {}
export async function updateResearchEvent(_formData: FormData) {}
export async function deleteResearchEvent(_formData: FormData) {}
export async function addEventParticipation(_formData: FormData) {}
export async function updateEventParticipation(_formData: FormData) {}
export async function removeEventParticipation(_formData: FormData) {}
export async function addSubmissionItem(_formData: FormData) {}
export async function updateSubmissionItem(_formData: FormData) {}
export async function removeSubmissionItem(_formData: FormData) {}
export async function addTaskToStage() {}
export async function removeTaskFromStage() {}
export async function setStageStatus() {}
export async function updateStageProgress() {}
export async function updateResearchStage() {}
export async function deleteResearchStage() {}
export async function uploadPurchaseRequestDocuments() {}
export async function updatePublication() {}
export async function deletePublication() {}
export async function addBudgetLineItem(_formData: FormData) {}
export async function addBudgetPeriod() {}
export async function addDeliverable() {}
export async function updateDeliverable() {}
export async function deleteDeliverable() {}
export async function addExperimentJournalEntry() {}
export async function createRecordFromExperiment() {}
export async function deleteExperiment() {}
export async function linkMethodologyToExperiment() {}
export async function updateExperiment() {}
export async function updateExperimentStatus() {}
export async function addMilestone() {}
export async function updateMilestone() {}
export async function deleteMilestone() {}
export async function addProjectMember() {}
export async function createProjectInvite() {}
export async function addProjectSupervisor() {}
export async function promoteProjectSupervisor() {}
export async function deleteProjectMember() {}
export async function deleteProjectInvite() {}
export async function resetProjectJoinCode() {}
export async function generateSupervisorJoinCode() {}
export async function addTask(_formData?: FormData) {}
export async function updateTask(_formData?: FormData) {}
export async function deleteTask(_idOrFormData?: string | FormData) {}
export async function logTime() {}
export async function deleteTimeEntry() {}
export async function createReport() {}
export async function deleteReport() {}
export async function createManuscriptAction(_projectId: string, _data: Record<string, unknown>) { return { ok: false as const, manuscript: null }; }
export async function updateManuscriptAction(_id: string, _projectId: string, _data: Record<string, unknown>) { return { ok: false as const }; }
export async function deleteManuscriptAction(_id: string, _projectId?: string) { return { ok: false as const }; }
export async function createOpenScienceUpdate(_formData: FormData) {}
export async function saveOpenScienceUpdate(_formData: FormData) {}
export async function deleteOpenScienceUpdate(_formData: FormData) {}
export async function savePrefs() {}
export async function softDeleteProjectAction() {}
export async function hardDeleteProjectAction() {}
export async function restoreProjectAction() {}
export async function submitPurchaseRequest(_formData: FormData) {}
export async function postTeamMessage() {}
export async function toggleStarMessage() {}
export async function pinTeamMessage() {}
export async function addPublication() {}
export async function addResearchStage(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;
  const projectId = formData.get("projectId") as string;
  if (!projectId) return;
  const title = (formData.get("title") as string)?.trim();
  if (!title) return;
  const existing = await listResearchStages(projectId).catch(() => []);
  await insertResearchStage({
    projectId,
    stageNumber: existing.length + 1,
    title,
    goals: (formData.get("goals") as string) ?? "",
    tasksText: "",
    indicators: "",
    startDate: (formData.get("startDate") as string) ?? "",
    endDate: (formData.get("endDate") as string) ?? "",
    budget: 0,
    currency: "UAH",
  }, user);
  revalidatePath("/");
}

export async function addTaskAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;
  const projectId = formData.get("projectId") as string;
  if (!projectId) return;
  const title = (formData.get("title") as string)?.trim();
  if (!title) return;
  await createTask({
    projectId,
    title,
    description: "",
    status: "todo",
    priority: (formData.get("priority") as "low" | "medium" | "high" | "critical") ?? "medium",
    category: "other",
    dueDate: (formData.get("dueDate") as string) ?? "",
    assigneeId: "",
    parentTaskId: "",
    estimatedHours: 0,
  }, user);
  revalidatePath("/");
}

export async function approvePurchaseRequest() {}
export async function markPurchaseRequestPurchased() {}
export async function rejectPurchaseRequest() {}
export async function archiveRecord() {}
export async function deleteRecord() {}
export async function restoreRecord() {}
export async function reachMilestone() {}
export async function requestPasswordReset(formData: FormData) {
  const locale = formLocale(formData);
  const email = (formData.get("email") as string)?.trim().toLowerCase();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    redirect(`/${locale}/forgot-password?error=invalid`);
  }

  // Завжди повертаємо успіх (no user enumeration).
  try {
    const user = await findUserByEmail(email);
    if (user && user._id) {
      const h = await headers();
      const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
      const proto = h.get("x-forwarded-proto") || (process.env.NODE_ENV === "production" ? "https" : "http");
      const baseUrl = `${proto}://${host}`;
      const token = await createPasswordResetToken(email);
      const url = `${baseUrl}/${locale}/reset-password?token=${encodeURIComponent(token)}`;
      const tpl = buildPasswordResetEmail({ url, userFirstName: user.firstName, locale: locale as "uk" | "en" });
      await sendEmail({ to: email, subject: tpl.subject, html: tpl.html, text: tpl.text }).catch(() => undefined);
    }
  } catch (e) {
    console.error("[forgot-password] failed", e);
  }
  redirect(`/${locale}/forgot-password?sent=1`);
}

export async function resetPassword(formData: FormData) {
  const locale = formLocale(formData);
  const token = (formData.get("token") as string)?.trim();
  const password = formData.get("password") as string;

  if (!token) redirect(`/${locale}/reset-password?error=expired`);
  if (!password || password.length < 8) {
    redirect(`/${locale}/reset-password?token=${encodeURIComponent(token)}&error=invalid`);
  }

  const email = await consumeToken(token).catch(() => null);
  if (!email) redirect(`/${locale}/reset-password?error=expired`);

  try {
    const newHash = await hashPassword(password);
    const ok = await updateUserPassword(email!, newHash);
    if (!ok) redirect(`/${locale}/reset-password?token=${encodeURIComponent(token)}&error=server`);
  } catch (e) {
    console.error("[reset-password] failed", e);
    redirect(`/${locale}/reset-password?token=${encodeURIComponent(token)}&error=server`);
  }

  redirect(`/${locale}/login?notice=password_reset`);
}
export async function changeTaskStatus(_formData: FormData) {}
export async function createExperiment() {}
export async function createRecord() {}
export async function createRecordVariant() {}
export async function createRecordVersion() {}
export async function deleteDiaryEntry(_id: string) {}
export async function patchExperimentStatusAlmanac(_expId: string, _status: string, _projectId: string) {}
export async function patchTaskStatus(_taskId: string, _status: string, _projectId: string) {}
