"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAuditEvent } from "@/lib/audit";
import { getCurrentUser } from "@/lib/current-user";
import { isLocale } from "@/lib/i18n";
import { createProjectInvitation } from "@/lib/invitations";
import { createOpenScienceUpdate } from "@/lib/open-science";
import { verifyPassword } from "@/lib/passwords";
import {
  addProjectMemberByEmail,
  createProjectForUser,
  generateProjectJoinCode,
  joinProjectByCode,
  listProjectsForUser,
  removeProjectMember,
  setProjectSupervisor,
  updateProjectForUser,
} from "@/lib/projects";
import { insertProjectRecord } from "@/lib/repositories";
import {
  loginInputSchema,
  openScienceUpdateInputSchema,
  profileInputSchema,
  projectInputSchema,
  projectInvitationInputSchema,
  projectRecordInputSchema,
  registerInputSchema,
  teamMessageInputSchema,
} from "@/lib/schemas";
import { createSession, destroySession } from "@/lib/session";
import { createTeamMessage } from "@/lib/team";
import { createUser, findUserByEmail, updateUserProfile } from "@/lib/users";

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

export async function createRecord(formData: FormData) {
  const locale = formLocale(formData);
  const returnTo = safeAppReturnTo(formData, locale, `/${locale}/app`);
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  const payload = {
    projectId: formData.get("projectId"),
    kind: formData.get("kind"),
    localId: formData.get("localId"),
    title: formData.get("title"),
    stage: formData.get("stage"),
    access: formData.get("access"),
    owner: formData.get("owner"),
    repository: formData.get("repository"),
    summary: formData.get("summary") || "",
  };
  const record = projectRecordInputSchema.parse(payload);
  const projects = await listProjectsForUser(user);

  if (!projects.some((project) => project._id === record.projectId)) {
    redirect(`/${locale}/app`);
  }

  await insertProjectRecord(record);
  revalidatePath(`/${locale}/app`);
  revalidatePath(returnTo);
}

export async function register(formData: FormData) {
  const locale = formLocale(formData);
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

    await createSession(user._id, user.role);
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
  const returnTo = safeAppReturnTo(
    formData,
    locale,
    `/${locale}/app/open-science`,
  );
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  const payload = openScienceUpdateInputSchema.safeParse({
    projectId: formData.get("projectId"),
    title: formData.get("title"),
    summary: formData.get("summary") || "",
    content: formData.get("content") || "",
    status: formData.get("status") === "published" ? "published" : "draft",
  });

  if (!payload.success) {
    redirect(withQuery(returnTo, "error", "invalid"));
  }

  const projects = await listProjectsForUser(user);

  if (!projects.some((project) => project._id === payload.data.projectId)) {
    redirect(withQuery(returnTo, "error", "project"));
  }

  await createOpenScienceUpdate(payload.data, user);
  revalidatePath(`/${locale}/open-science`);
  revalidatePath(`/${locale}/app/open-science`);
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

  const payload = teamMessageInputSchema.safeParse({
    projectId: formData.get("projectId"),
    body: formData.get("body"),
  });

  if (!payload.success) {
    redirect(withQuery(returnTo, "error", "invalid"));
  }

  const projects = await listProjectsForUser(user);

  if (!projects.some((project) => project._id === payload.data.projectId)) {
    redirect(withQuery(returnTo, "error", "project"));
  }

  await createTeamMessage(payload.data, user);
  revalidatePath(`/${locale}/app/team`);
  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function login(formData: FormData) {
  const locale = formLocale(formData);
  const payload = loginInputSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!payload.success) {
    redirect(`/${locale}/login?error=invalid`);
  }

  const user = await findUserByEmail(payload.data.email);

  if (!user) {
    redirect(`/${locale}/login?error=invalid`);
  }

  const isValidPassword = await verifyPassword(
    payload.data.password,
    user.passwordHash,
  );

  if (!isValidPassword || !user._id) {
    redirect(`/${locale}/login?error=invalid`);
  }

  await createSession(user._id, user.role);
  redirect(`/${locale}/app`);
}

export async function logout(formData: FormData) {
  const locale = formLocale(formData);
  await destroySession();
  redirect(`/${locale}`);
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
    const project = await joinProjectByCode(code, user);
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
