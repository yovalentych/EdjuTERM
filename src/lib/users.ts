import { ObjectId } from "mongodb";
import { getMongoDb, hasMongoConfig } from "@/lib/mongodb";
import { hashPassword } from "@/lib/passwords";
import {
  type RegisterInput,
  type SafeUser,
  type User,
  type UserRole,
  safeUserSchema,
  userSchema,
} from "@/lib/schemas";

const collectionName = "users";
const localUsers: User[] = [];

function toSafeUser(user: User): SafeUser {
  return safeUserSchema.parse(user);
}

function roleForEmail(email: string): UserRole {
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  return adminEmails.includes(email.toLowerCase()) ? "admin" : "user";
}

export async function createUser(input: RegisterInput) {
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
    email: input.email,
    passwordHash: await hashPassword(input.password),
    role: roleForEmail(input.email),
    emailVerifiedAt: null,
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
  const result = await db.collection(collectionName).insertOne(user);

  return toSafeUser({ ...user, _id: result.insertedId.toString() });
}

export async function findUserByEmail(email: string) {
  const normalizedEmail = email.toLowerCase();

  if (!hasMongoConfig()) {
    return localUsers.find((user) => user.email === normalizedEmail) ?? null;
  }

  const db = await getMongoDb();
  const doc = await db.collection(collectionName).findOne({ email: normalizedEmail });

  return doc ? userSchema.parse({ ...doc, _id: doc._id.toString() }) : null;
}

export async function findUserById(id: string) {
  if (!hasMongoConfig()) {
    return localUsers.find((user) => user._id === id) ?? null;
  }

  const db = await getMongoDb();
  const doc = await db.collection(collectionName).findOne({ _id: new ObjectId(id) });

  return doc ? userSchema.parse({ ...doc, _id: doc._id.toString() }) : null;
}

export async function getSafeUserById(id: string) {
  const user = await findUserById(id);
  return user ? toSafeUser(user) : null;
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

  const db = await getMongoDb();
  const result = await db.collection(collectionName).findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: { role, updatedAt: new Date() } },
    { returnDocument: "after" },
  );

  return result
    ? toSafeUser(userSchema.parse({ ...result, _id: result._id.toString() }))
    : null;
}

async function ensureUserIndexes() {
  const db = await getMongoDb();
  await db.collection(collectionName).createIndexes([
    { key: { email: 1 }, unique: true },
    { key: { role: 1 } },
  ]);
}
