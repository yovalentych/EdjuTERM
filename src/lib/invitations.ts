import { ObjectId } from "mongodb";
import { randomBytes } from "node:crypto";
import { getMongoDb, hasMongoConfig } from "@/lib/mongodb";
import { canManageProject, getProjectForUser } from "@/lib/projects";
import {
  type ProjectInvitation,
  type ProjectInvitationInput,
  type SafeUser,
  projectInvitationSchema,
} from "@/lib/schemas";

const collectionName = "project_invitations";
const localInvitations: ProjectInvitation[] = [];

function generateInvitationCode() {
  return randomBytes(6).toString("hex").toUpperCase();
}

export async function createProjectInvitation(
  input: ProjectInvitationInput,
  actor: SafeUser,
) {
  if (!actor._id) {
    throw new Error("USER_ID_REQUIRED");
  }

  const project = await getProjectForUser(input.projectId, actor);

  if (!project || !canManageProject(project, actor)) {
    throw new Error("PROJECT_FORBIDDEN");
  }

  const now = new Date();
  const invitation: ProjectInvitation = {
    ...input,
    code: generateInvitationCode(),
    status: "pending",
    createdBy: actor._id,
    expiresAt: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 30),
    createdAt: now,
    updatedAt: now,
  };

  if (!hasMongoConfig()) {
    const localInvitation = {
      ...invitation,
      _id: `local-invitation-${localInvitations.length + 1}`,
    };
    localInvitations.unshift(localInvitation);
    return localInvitation;
  }

  const db = await getMongoDb();
  await ensureInvitationIndexes();
  const { _id, ...insertInvitation } = invitation;
  void _id;
  const result = await db.collection(collectionName).insertOne(insertInvitation);

  return { ...invitation, _id: result.insertedId.toString() };
}

export async function listProjectInvitations(projectId: string) {
  if (!hasMongoConfig()) {
    return localInvitations.filter((invitation) => invitation.projectId === projectId);
  }

  const db = await getMongoDb();
  const docs = await db
    .collection(collectionName)
    .find({ projectId })
    .sort({ createdAt: -1 })
    .limit(50)
    .toArray();

  return docs.map((doc) =>
    projectInvitationSchema.parse({ ...doc, _id: (doc._id as ObjectId).toString() }),
  );
}

export async function listAllProjectInvitations() {
  if (!hasMongoConfig()) {
    return localInvitations;
  }

  const db = await getMongoDb();
  const docs = await db
    .collection(collectionName)
    .find({})
    .sort({ createdAt: -1 })
    .limit(200)
    .toArray();

  return docs.map((doc) =>
    projectInvitationSchema.parse({ ...doc, _id: (doc._id as ObjectId).toString() }),
  );
}

async function ensureInvitationIndexes() {
  const db = await getMongoDb();
  await db.collection(collectionName).createIndexes([
    { key: { projectId: 1, createdAt: -1 } },
    { key: { email: 1, status: 1 } },
    { key: { code: 1 }, unique: true },
    { key: { expiresAt: 1 } },
  ]);
}
