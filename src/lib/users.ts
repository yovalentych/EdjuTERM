import { ObjectId, type Document, type WithId } from "mongodb";
import { getMongoDb, hasMongoConfig } from "@/lib/mongodb";
import { toObjectId } from "@/lib/object-id";
import { hashPassword } from "@/lib/passwords";
import {
  type RegisterInput,
  type SafeUser,
  type User,
  type UserRole,
  type ProfileInput,
  type UserAffiliation,
  safeUserSchema,
  userSchema,
} from "@/lib/schemas";

const collectionName = "users";
const localUsers: User[] = [];

function toSafeUser(user: User): SafeUser {
  return safeUserSchema.parse(user);
}

function normalizeUserDocument(doc: WithId<Document>) {
  const fallbackName =
    typeof doc.name === "string" && doc.name.trim().length > 0
      ? doc.name.trim()
      : "";
  const [fallbackFirstName = "", ...fallbackLastNameParts] =
    fallbackName.split(/\s+/);
  const fallbackLastName = fallbackLastNameParts.join(" ");

  return userSchema.parse({
    ...doc,
    _id: doc._id.toString(),
    firstName: doc.firstName ?? fallbackFirstName,
    lastName: doc.lastName ?? (fallbackLastName || "-"),
    firstNameLatin: doc.firstNameLatin ?? fallbackFirstName,
    lastNameLatin: doc.lastNameLatin ?? (fallbackLastName || "-"),
    orcid: doc.orcid ?? "",
    position: doc.position ?? "",
    affiliation: doc.affiliation ?? "",
    profileBio: doc.profileBio ?? "",
    defaultSpecialty: doc.defaultSpecialty ?? "",
    sessionVersion: doc.sessionVersion ?? 1,
    affiliations: doc.affiliations ?? [],
    // null → default for fields that may be null in older DB documents
    phone: doc.phone ?? "",
    researchInterests: doc.researchInterests ?? [],
    academicLinks: doc.academicLinks ?? undefined,
  });
}

async function migrateLegacyUserDocument(doc: WithId<Document>, user: User) {
  if (
    doc.firstName &&
    doc.lastName &&
    doc.firstNameLatin &&
    doc.lastNameLatin &&
    "orcid" in doc &&
    "position" in doc &&
    "affiliation" in doc &&
    "profileBio" in doc &&
    "defaultSpecialty" in doc &&
    "sessionVersion" in doc
  ) {
    return;
  }

  const db = await getMongoDb();
  await db.collection(collectionName).updateOne(
    { _id: doc._id },
    {
      $set: {
        firstName: user.firstName,
        lastName: user.lastName,
        firstNameLatin: user.firstNameLatin,
        lastNameLatin: user.lastNameLatin,
        orcid: user.orcid,
        position: user.position,
        affiliation: user.affiliation,
        profileBio: user.profileBio,
        defaultSpecialty: user.defaultSpecialty,
        sessionVersion: user.sessionVersion,
        updatedAt: new Date(),
      },
    },
  );
}

function roleForEmail(email: string): UserRole {
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  return adminEmails.includes(email.toLowerCase()) ? "admin" : "user";
}

export async function createUser(
  input: RegisterInput,
  options?: { accountType?: "personal" | "institution"; institutionId?: string },
) {
  const existingUser = await findUserByEmail(input.email);

  if (existingUser) {
    throw new Error("USER_EXISTS");
  }

  const now = new Date();
  const user: User = {
    firstName: input.firstName,
    lastName: input.lastName,
    firstNameLatin: input.firstNameLatin,
    lastNameLatin: input.lastNameLatin,
    phone: input.phone || "",
    phoneVerifiedAt: null,
    orcid: "",
    position: "",
    affiliation: "",
    profileBio: "",
    defaultSpecialty: "",
    email: input.email,
    passwordHash: await hashPassword(input.password),
    role: roleForEmail(input.email),
    sessionVersion: 1,
    emailVerifiedAt: null,
    accountType: options?.accountType ?? "personal",
    institutionId: options?.institutionId ?? "",
    affiliations: [],
    researchInterests: [],
    createdAt: now,
    updatedAt: now,
  };

  if (!hasMongoConfig()) {
    const localUser = { ...user, _id: `local-user-${localUsers.length + 1}` };
    localUsers.push(localUser);
    return toSafeUser(localUser);
  }

  const db = await getMongoDb();
  await ensureUserIndexes();
  const { _id, ...insertUser } = user;
  void _id;
  const result = await db.collection(collectionName).insertOne(insertUser);

  return toSafeUser({ ...user, _id: result.insertedId.toString() });
}

export async function findUserByEmail(email: string) {
  const normalizedEmail = email.toLowerCase();

  if (!hasMongoConfig()) {
    return localUsers.find((user) => user.email === normalizedEmail) ?? null;
  }

  const db = await getMongoDb();
  const doc = await db.collection(collectionName).findOne({ email: normalizedEmail });

  if (!doc) {
    return null;
  }

  const user = normalizeUserDocument(doc);
  await migrateLegacyUserDocument(doc, user);
  return user;
}

export async function findUserById(id: string) {
  if (!hasMongoConfig()) {
    return localUsers.find((user) => user._id === id) ?? null;
  }

  if (!ObjectId.isValid(id)) {
    return null;
  }

  const db = await getMongoDb();
  const doc = await db.collection(collectionName).findOne({ _id: new ObjectId(id) });

  if (!doc) {
    return null;
  }

  const user = normalizeUserDocument(doc);
  await migrateLegacyUserDocument(doc, user);
  return user;
}

export async function getSafeUserById(id: string) {
  const user = await findUserById(id);
  return user ? toSafeUser(user) : null;
}

export async function listSafeUsersByIds(ids: string[]) {
  const uniqueIds = [...new Set(ids.filter(Boolean))];

  if (uniqueIds.length === 0) {
    return [];
  }

  if (!hasMongoConfig()) {
    return localUsers
      .filter((user) => user._id && uniqueIds.includes(user._id))
      .map(toSafeUser);
  }

  const db = await getMongoDb();
  const objectIds = uniqueIds
    .filter((id) => ObjectId.isValid(id))
    .map((id) => new ObjectId(id));

  if (objectIds.length === 0) {
    return [];
  }

  const docs = await db
    .collection(collectionName)
    .find({ _id: { $in: objectIds } })
    .toArray();
  const users = await Promise.all(
    docs.map(async (doc) => {
      const user = normalizeUserDocument(doc);
      await migrateLegacyUserDocument(doc, user);
      return toSafeUser(user);
    }),
  );

  return users;
}

export async function listAllSafeUsers() {
  if (!hasMongoConfig()) {
    return localUsers.map(toSafeUser);
  }

  const db = await getMongoDb();
  const docs = await db
    .collection(collectionName)
    .find({})
    .sort({ createdAt: -1 })
    .limit(500)
    .toArray();
  const users = await Promise.all(
    docs.map(async (doc) => {
      const user = normalizeUserDocument(doc);
      await migrateLegacyUserDocument(doc, user);
      return toSafeUser(user);
    }),
  );

  return users;
}

export async function updateUserProfile(id: string, input: ProfileInput) {
  if (!hasMongoConfig()) {
    const user = localUsers.find((item) => item._id === id);

    if (!user) {
      return null;
    }

    Object.assign(user, input, { updatedAt: new Date() });
    return toSafeUser(user);
  }

  if (!ObjectId.isValid(id)) {
    return null;
  }

  const db = await getMongoDb();
  const result = await db.collection(collectionName).findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: { ...input, updatedAt: new Date() } },
    { returnDocument: "after" },
  );

  return result ? toSafeUser(normalizeUserDocument(result)) : null;
}

export async function setUserRole(id: string, role: UserRole) {
  if (!hasMongoConfig()) {
    const user = localUsers.find((item) => item._id === id);

    if (!user) {
      return null;
    }

    user.role = role;
    user.updatedAt = new Date();
    return toSafeUser(user);
  }

  if (!ObjectId.isValid(id)) {
    return null;
  }

  const db = await getMongoDb();
  const result = await db.collection(collectionName).findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: { role, updatedAt: new Date() } },
    { returnDocument: "after" },
  );

  return result
    ? toSafeUser(normalizeUserDocument(result))
    : null;
}

export async function setUserInstitution(userId: string, institutionId: string): Promise<boolean> {
  const now = new Date();
  if (!hasMongoConfig()) {
    const user = localUsers.find((u) => String(u._id) === String(userId));
    if (!user) return false;
    user.institutionId = institutionId;
    user.accountType = "institution";
    user.updatedAt = now;
    return true;
  }
  const db = await getMongoDb();
  const _id = toObjectId(userId);
  if (!_id) return false;
  const result = await db.collection(collectionName).updateOne(
    { _id },
    { $set: { institutionId, accountType: "institution", updatedAt: now } },
  );
  return result.matchedCount > 0;
}

export async function markEmailVerified(userId: string): Promise<boolean> {
  const now = new Date();
  if (!hasMongoConfig()) {
    const user = localUsers.find((u) => String(u._id) === String(userId));
    if (!user) return false;
    user.emailVerifiedAt = now;
    user.updatedAt = now;
    return true;
  }
  const db = await getMongoDb();
  const _id = toObjectId(userId);
  if (!_id) return false;
  const result = await db.collection(collectionName).updateOne(
    { _id },
    { $set: { emailVerifiedAt: now, updatedAt: now } },
  );
  return result.matchedCount > 0;
}

export async function updateUserPasswordById(userId: string, newPasswordHash: string): Promise<boolean> {
  const now = new Date();
  if (!hasMongoConfig()) {
    const user = localUsers.find((u) => String(u._id) === String(userId));
    if (!user) return false;
    user.passwordHash = newPasswordHash;
    user.sessionVersion += 1;
    user.updatedAt = now;
    return true;
  }
  const db = await getMongoDb();
  const _id = toObjectId(userId);
  if (!_id) return false;
  const result = await db.collection(collectionName).updateOne(
    { _id },
    { $set: { passwordHash: newPasswordHash, updatedAt: now }, $inc: { sessionVersion: 1 } },
  );
  return result.modifiedCount > 0;
}

export async function updateUserPassword(email: string, newPasswordHash: string): Promise<boolean> {
  const normalized = email.toLowerCase();

  if (!hasMongoConfig()) {
    const user = localUsers.find((u) => u.email === normalized);
    if (!user) return false;
    user.passwordHash = newPasswordHash;
    user.sessionVersion += 1;
    user.updatedAt = new Date();
    return true;
  }

  const db = await getMongoDb();
  const result = await db.collection(collectionName).updateOne(
    { email: normalized },
    { $set: { passwordHash: newPasswordHash, updatedAt: new Date() }, $inc: { sessionVersion: 1 } },
  );
  return result.modifiedCount > 0;
}

async function ensureUserIndexes() {
  const db = await getMongoDb();
  await db.collection(collectionName).createIndexes([
    { key: { email: 1 }, unique: true },
    { key: { role: 1 } },
    { key: { "affiliations.institutionId": 1 } },
  ]);
}

// ── Affiliations ──────────────────────────────────────────────────────────────

/** Додає або оновлює приналежність користувача до інституції/підрозділу. */
export async function addAffiliation(
  userId: string,
  aff: UserAffiliation,
): Promise<SafeUser | null> {
  if (!hasMongoConfig()) {
    const user = localUsers.find((u) => u._id === userId);
    if (!user) return null;
    user.affiliations = [...(user.affiliations ?? []), aff];
    return toSafeUser(user);
  }
  if (!ObjectId.isValid(userId)) return null;
  const db = await getMongoDb();
  const result = await db.collection(collectionName).findOneAndUpdate(
    { _id: new ObjectId(userId) },
    {
      $push: { affiliations: aff } as never,
      $set: { updatedAt: new Date() },
    },
    { returnDocument: "after" },
  );
  return result ? toSafeUser(normalizeUserDocument(result)) : null;
}

/** Завершує (isCurrent=false) або видаляє конкретну приналежність (за _id). */
export async function endAffiliation(userId: string, affiliationId: string): Promise<SafeUser | null> {
  if (!hasMongoConfig()) {
    const user = localUsers.find((u) => u._id === userId);
    if (!user) return null;
    user.affiliations = (user.affiliations ?? []).map((a) =>
      a._id === affiliationId ? { ...a, isCurrent: false } : a
    );
    return toSafeUser(user);
  }
  if (!ObjectId.isValid(userId)) return null;
  const db = await getMongoDb();
  const result = await db.collection(collectionName).findOneAndUpdate(
    { _id: new ObjectId(userId), "affiliations._id": affiliationId },
    {
      $set: { "affiliations.$.isCurrent": false, updatedAt: new Date() },
    },
    { returnDocument: "after" },
  );
  return result ? toSafeUser(normalizeUserDocument(result)) : null;
}

/** Видаляє приналежність повністю. */
export async function deleteAffiliation(userId: string, affiliationId: string): Promise<SafeUser | null> {
  if (!hasMongoConfig()) {
    const user = localUsers.find((u) => u._id === userId);
    if (!user) return null;
    user.affiliations = (user.affiliations ?? []).filter((a) => a._id !== affiliationId);
    return toSafeUser(user);
  }
  if (!ObjectId.isValid(userId)) return null;
  const db = await getMongoDb();
  const result = await db.collection(collectionName).findOneAndUpdate(
    { _id: new ObjectId(userId) },
    {
      $pull: { affiliations: { _id: affiliationId } } as never,
      $set: { updatedAt: new Date() },
    },
    { returnDocument: "after" },
  );
  return result ? toSafeUser(normalizeUserDocument(result)) : null;
}
