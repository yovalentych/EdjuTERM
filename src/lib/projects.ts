import { getMongoDb, hasMongoConfig } from "@/lib/mongodb";
import {
  type Project,
  type ProjectInput,
  type SafeUser,
  projectSchema,
} from "@/lib/schemas";
import { setUserRole } from "@/lib/users";

const collectionName = "projects";
const localProjects: Project[] = [];

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

async function listAllProjects() {
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

async function ensureProjectIndexes() {
  const db = await getMongoDb();
  await db.collection(collectionName).createIndexes([
    { key: { ownerId: 1 } },
    { key: { supervisorId: 1 } },
    { key: { memberIds: 1 } },
    { key: { acronym: 1 } },
  ]);
}
