import { ObjectId } from "mongodb";
import { randomBytes } from "node:crypto";
import { getMongoDb, hasMongoConfig } from "@/lib/mongodb";
import {
  type Project,
  type ProjectInput,
  type SafeUser,
  projectSchema,
} from "@/lib/schemas";
import { findUserByEmail, setUserRole } from "@/lib/users";

const collectionName = "projects";
const localProjects: Project[] = [];

function generateJoinCode() {
  return randomBytes(4).toString("hex").toUpperCase();
}

export async function createProjectForUser(input: ProjectInput, user: SafeUser) {
  if (!user._id) {
    throw new Error("USER_ID_REQUIRED");
  }

  const now = new Date();
  const project: Project = {
    ...input,
    ownerId: user._id,
    supervisorId: user._id,
    memberIds: [user._id],
    joinCode: generateJoinCode(),
    status: "active",
    createdAt: now,
    updatedAt: now,
  };

  if (!hasMongoConfig()) {
    const localProject = {
      ...project,
      _id: `local-project-${localProjects.length + 1}`,
    };
    localProjects.push(localProject);

    if (user.role === "user") {
      await setUserRole(user._id, "supervisor");
    }

    return localProject;
  }

  const db = await getMongoDb();
  await ensureProjectIndexes();
  const { _id, ...insertProject } = project;
  void _id;
  const result = await db.collection(collectionName).insertOne(insertProject);

  if (user.role === "user") {
    await setUserRole(user._id, "supervisor");
  }

  return { ...project, _id: result.insertedId.toString() };
}

export async function listProjectsForUser(user: SafeUser) {
  if (!user._id) {
    return [];
  }

  if (user.role === "admin") {
    return listAllProjects();
  }

  if (!hasMongoConfig()) {
    return localProjects.filter(
      (project) =>
        project.ownerId === user._id ||
        project.supervisorId === user._id ||
        project.memberIds.includes(user._id ?? ""),
    );
  }

  const db = await getMongoDb();
  const docs = await db
    .collection(collectionName)
    .find({
      $or: [
        { ownerId: user._id },
        { supervisorId: user._id },
        { memberIds: user._id },
      ],
    })
    .sort({ createdAt: -1 })
    .toArray();

  return docs.map((doc) =>
    projectSchema.parse({ ...doc, _id: doc._id.toString() }),
  );
}

export async function getProjectForUser(projectId: string, user: SafeUser) {
  const project = await getProjectById(projectId);

  if (!project || !canViewProject(project, user)) {
    return null;
  }

  return project;
}

export async function updateProjectForUser(
  projectId: string,
  input: ProjectInput,
  user: SafeUser,
) {
  const project = await getProjectById(projectId);

  if (!project || !canManageProject(project, user)) {
    throw new Error("PROJECT_FORBIDDEN");
  }

  const updatedProject: Project = {
    ...project,
    ...input,
    updatedAt: new Date(),
  };

  if (!hasMongoConfig()) {
    const index = localProjects.findIndex((item) => item._id === projectId);

    if (index >= 0) {
      localProjects[index] = updatedProject;
    }

    return updatedProject;
  }

  const db = await getMongoDb();
  const { _id, ...updateProject } = updatedProject;
  void _id;
  await db
    .collection(collectionName)
    .updateOne({ _id: new ObjectId(projectId) }, { $set: updateProject });

  return updatedProject;
}

export async function addProjectMemberByEmail(
  projectId: string,
  email: string,
  user: SafeUser,
) {
  const project = await getProjectById(projectId);

  if (!project || !canManageProject(project, user)) {
    throw new Error("PROJECT_FORBIDDEN");
  }

  const member = await findUserByEmail(email);

  if (!member?._id) {
    throw new Error("USER_NOT_FOUND");
  }

  const memberIds = [...new Set([...project.memberIds, member._id])];
  await saveProjectMembership(projectId, { memberIds });

  if (member.role === "user") {
    await setUserRole(member._id, "member");
  }

  return member;
}

export async function addProjectMemberById(
  projectId: string,
  memberId: string,
  actor: SafeUser,
) {
  const project = await getProjectById(projectId);

  if (!project || !canManageProject(project, actor)) {
    throw new Error("PROJECT_FORBIDDEN");
  }

  const memberIds = [...new Set([...project.memberIds, memberId])];
  await saveProjectMembership(projectId, { memberIds });
  await setUserRole(memberId, "member");
}

export async function joinProjectByCode(code: string, user: SafeUser) {
  if (!user._id) {
    throw new Error("USER_ID_REQUIRED");
  }

  const normalizedCode = code.trim().toUpperCase();
  const project = await getProjectByJoinCode(normalizedCode);

  if (!project?._id) {
    throw new Error("PROJECT_NOT_FOUND");
  }

  if (!canViewProject(project, user)) {
    const memberIds = [...new Set([...project.memberIds, user._id])];
    await saveProjectMembership(project._id, { memberIds });
  }

  if (user.role === "user") {
    await setUserRole(user._id, "member");
  }

  return project;
}

export async function generateProjectJoinCode(projectId: string, actor: SafeUser) {
  const project = await getProjectById(projectId);

  if (!project || !canManageProject(project, actor)) {
    throw new Error("PROJECT_FORBIDDEN");
  }

  const joinCode = generateJoinCode();
  await saveProjectMembership(projectId, { joinCode });
  return joinCode;
}

export async function setProjectSupervisor(
  projectId: string,
  supervisorId: string,
  user: SafeUser,
) {
  const project = await getProjectById(projectId);

  if (!project || !canManageProject(project, user)) {
    throw new Error("PROJECT_FORBIDDEN");
  }

  if (![project.ownerId, ...project.memberIds].includes(supervisorId)) {
    throw new Error("USER_NOT_PROJECT_MEMBER");
  }

  await saveProjectMembership(projectId, {
    supervisorId,
    memberIds: [...new Set([...project.memberIds, supervisorId])],
  });
  await setUserRole(supervisorId, "supervisor");
}

export async function removeProjectMember(
  projectId: string,
  memberId: string,
  user: SafeUser,
) {
  const project = await getProjectById(projectId);

  if (!project || !canManageProject(project, user)) {
    throw new Error("PROJECT_FORBIDDEN");
  }

  if (memberId === project.ownerId) {
    throw new Error("OWNER_CANNOT_BE_REMOVED");
  }

  const memberIds = project.memberIds.filter((id) => id !== memberId);
  const supervisorId =
    project.supervisorId === memberId ? project.ownerId : project.supervisorId;
  await saveProjectMembership(projectId, { memberIds, supervisorId });
}

export function canManageProject(project: Project, user: SafeUser) {
  return (
    user.role === "admin" ||
    project.ownerId === user._id ||
    project.supervisorId === user._id
  );
}

export async function listAllProjects() {
  if (!hasMongoConfig()) {
    return localProjects;
  }

  const db = await getMongoDb();
  const docs = await db
    .collection(collectionName)
    .find({})
    .sort({ createdAt: -1 })
    .toArray();

  return docs.map((doc) =>
    projectSchema.parse({ ...doc, _id: doc._id.toString() }),
  );
}

async function getProjectById(projectId: string) {
  if (!hasMongoConfig()) {
    return localProjects.find((project) => project._id === projectId) ?? null;
  }

  if (!ObjectId.isValid(projectId)) {
    return null;
  }

  const db = await getMongoDb();
  const doc = await db
    .collection(collectionName)
    .findOne({ _id: new ObjectId(projectId) });

  return doc ? projectSchema.parse({ ...doc, _id: doc._id.toString() }) : null;
}

export async function getProjectByIdForAdmin(projectId: string) {
  return getProjectById(projectId);
}

async function getProjectByJoinCode(joinCode: string) {
  if (!hasMongoConfig()) {
    return localProjects.find((project) => project.joinCode === joinCode) ?? null;
  }

  const db = await getMongoDb();
  const doc = await db.collection(collectionName).findOne({ joinCode });

  return doc ? projectSchema.parse({ ...doc, _id: doc._id.toString() }) : null;
}

function canViewProject(project: Project, user: SafeUser) {
  return (
    user.role === "admin" ||
    project.ownerId === user._id ||
    project.supervisorId === user._id ||
    project.memberIds.includes(user._id ?? "")
  );
}

async function saveProjectMembership(
  projectId: string,
  update: Pick<Partial<Project>, "memberIds" | "supervisorId" | "joinCode">,
) {
  if (!hasMongoConfig()) {
    const project = localProjects.find((item) => item._id === projectId);

    if (project) {
      Object.assign(project, update, { updatedAt: new Date() });
    }

    return;
  }

  const db = await getMongoDb();
  await db.collection(collectionName).updateOne(
    { _id: new ObjectId(projectId) },
    {
      $set: {
        ...update,
        updatedAt: new Date(),
      },
    },
  );
}

async function ensureProjectIndexes() {
  const db = await getMongoDb();
  await db.collection(collectionName).createIndexes([
    { key: { ownerId: 1 } },
    { key: { supervisorId: 1 } },
    { key: { memberIds: 1 } },
    { key: { acronym: 1 } },
    { key: { joinCode: 1 }, sparse: true },
  ]);
}
