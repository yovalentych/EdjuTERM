import "server-only";
import { ObjectId } from "mongodb";
import { getMongoDb, hasMongoConfig } from "@/lib/mongodb";
import { toObjectId } from "@/lib/object-id";
import {
  institutionSchema,
  institutionUnitSchema,
  institutionMemberSchema,
  institutionProgramSchema,
  institutionCourseSchema,
  institutionAdminSchema,
  userAffiliationSchema,
  type Institution,
  type InstitutionInput,
  type InstitutionUnit,
  type InstitutionUnitInput,
  type InstitutionMember,
  type InstitutionMemberInput,
  type InstitutionProgram,
  type InstitutionProgramInput,
  type InstitutionCourse,
  type InstitutionCourseInput,
  type InstitutionAdmin,
  type InstitutionAdminInput,
  type UserAffiliation,
  type SafeUser,
} from "@/lib/schemas";

/**
 * CRUD для НАШИХ зареєстрованих Institutions (паралельно з ЄДЕБО fetcher
 * у `institutions.ts`). У нас вони мають окрему таблицю,
 * власника (admin user) і власну верифікацію.
 */

const COLLECTION = "institutions";

// In-memory fallback (без MongoDB).
const localInstitutions: Institution[] = [];

function parseDoc(doc: any): Institution {
  return institutionSchema.parse({ ...doc, _id: doc._id?.toString() });
}

export async function listInstitutionsDb(): Promise<Institution[]> {
  if (!hasMongoConfig()) {
    return localInstitutions.filter((i) => !i.deletedAt);
  }
  const db = await getMongoDb();
  const docs = await db.collection(COLLECTION)
    .find({ deletedAt: null })
    .sort({ name: 1 })
    .toArray();
  return docs.map(parseDoc);
}

export async function searchInstitutionsDb(query: string, limit = 10): Promise<Institution[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  if (!hasMongoConfig()) {
    return localInstitutions
      .filter((i) => !i.deletedAt && (
        i.name.toLowerCase().includes(q) ||
        i.shortName.toLowerCase().includes(q) ||
        i.city.toLowerCase().includes(q)
      ))
      .slice(0, limit);
  }
  const db = await getMongoDb();
  const docs = await db.collection(COLLECTION)
    .find({
      deletedAt: null,
      $or: [
        { name:      { $regex: q, $options: "i" } },
        { shortName: { $regex: q, $options: "i" } },
        { city:      { $regex: q, $options: "i" } },
      ],
    })
    .limit(limit)
    .toArray();
  return docs.map(parseDoc);
}

export async function getInstitution(id: string): Promise<Institution | null> {
  if (!hasMongoConfig()) {
    return localInstitutions.find((i) => i._id === id) ?? null;
  }
  const db = await getMongoDb();
  const _id = toObjectId(id);
  if (!_id) return null;
  const doc = await db.collection(COLLECTION).findOne({ _id });
  return doc ? parseDoc(doc) : null;
}

export async function findInstitutionByEmail(email: string): Promise<Institution | null> {
  const normalized = email.toLowerCase();
  if (!hasMongoConfig()) {
    return localInstitutions.find((i) => i.email.toLowerCase() === normalized) ?? null;
  }
  const db = await getMongoDb();
  const doc = await db.collection(COLLECTION).findOne({ email: normalized });
  return doc ? parseDoc(doc) : null;
}

export async function createInstitution(
  input: InstitutionInput,
  owner: SafeUser,
): Promise<Institution> {
  const now = new Date();
  const normalizedEmail = input.email ? input.email.toLowerCase() : "";

  // Перевірка унікальності email (тільки якщо email заданий)
  if (normalizedEmail) {
    const existing = await findInstitutionByEmail(normalizedEmail);
    if (existing) throw new Error("INSTITUTION_EMAIL_EXISTS");
  }

  const doc: Omit<Institution, "_id"> = {
    ...input,
    email: normalizedEmail,
    ownerId: owner._id ?? "",
    isVerified: false,
    isCommunityCreated: false,
    verifiedAt: null,
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
  };

  if (!hasMongoConfig()) {
    const local: Institution = { ...doc, _id: `inst-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` };
    localInstitutions.push(local);
    return local;
  }

  const db = await getMongoDb();
  await db.collection(COLLECTION).createIndexes([
    { key: { name: 1 } },
    { key: { ownerId: 1 } },
    ...(normalizedEmail ? [{ key: { email: 1 }, unique: true } as const] : []),
  ]);
  const result = await db.collection(COLLECTION).insertOne(doc);
  return { ...doc, _id: result.insertedId.toString() };
}

export async function updateInstitution(
  id: string,
  patch: Partial<InstitutionInput>,
): Promise<Institution | null> {
  const now = new Date();
  if (!hasMongoConfig()) {
    const i = localInstitutions.find((x) => x._id === id);
    if (!i) return null;
    Object.assign(i, patch, { updatedAt: now });
    return i;
  }
  const db = await getMongoDb();
  const _id = toObjectId(id);
  if (!_id) return null;
  const result = await db.collection(COLLECTION).findOneAndUpdate(
    { _id, deletedAt: null },
    { $set: { ...patch, updatedAt: now } },
    { returnDocument: "after" },
  );
  return result ? parseDoc(result) : null;
}

/** Для системного адміна: всі заклади (верифіковані та ні). */
export async function listAllInstitutions(): Promise<Institution[]> {
  if (!hasMongoConfig()) return localInstitutions.filter((i) => !i.deletedAt);
  const db = await getMongoDb();
  const docs = await db.collection(COLLECTION)
    .find({ deletedAt: null })
    .sort({ createdAt: -1 })
    .toArray();
  return docs.map(parseDoc);
}

/** Верифікація закладу системним адміном. */
export async function verifyInstitution(id: string, verified: boolean): Promise<void> {
  const now = new Date();
  if (!hasMongoConfig()) {
    const i = localInstitutions.find((x) => x._id === id);
    if (i) { i.isVerified = verified; i.verifiedAt = verified ? now : null; }
    return;
  }
  const db = await getMongoDb();
  const _id = toObjectId(id);
  if (!_id) return;
  await db.collection(COLLECTION).updateOne(
    { _id },
    { $set: { isVerified: verified, verifiedAt: verified ? now : null, updatedAt: now } },
  );
}

export async function softDeleteInstitution(id: string): Promise<boolean> {
  const now = new Date();
  if (!hasMongoConfig()) {
    const i = localInstitutions.find((x) => x._id === id);
    if (!i) return false;
    i.deletedAt = now;
    return true;
  }
  const db = await getMongoDb();
  const _id = toObjectId(id);
  if (!_id) return false;
  const result = await db.collection(COLLECTION).updateOne(
    { _id },
    { $set: { deletedAt: now, updatedAt: now } },
  );
  return result.modifiedCount > 0;
}

// ─── Units (tree structure) ───────────────────────────────────────────────

const UNITS_COLLECTION = "institutionUnits";
const localUnits: InstitutionUnit[] = [];

export async function listUnits(institutionId: string): Promise<InstitutionUnit[]> {
  if (!hasMongoConfig()) {
    return localUnits.filter((u) => u.institutionId === institutionId);
  }
  const db = await getMongoDb();
  const docs = await db.collection(UNITS_COLLECTION)
    .find({ institutionId })
    .sort({ orderIndex: 1, name: 1 })
    .toArray();
  return docs.map((d) => institutionUnitSchema.parse({ ...d, _id: d._id.toString() }));
}

export async function createUnit(input: InstitutionUnitInput): Promise<InstitutionUnit> {
  const now = new Date();
  const doc: Omit<InstitutionUnit, "_id"> = { ...input, isCommunityCreated: false, createdAt: now, updatedAt: now };
  if (!hasMongoConfig()) {
    const local: InstitutionUnit = { ...doc, _id: `unit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` };
    localUnits.push(local);
    return local;
  }
  const db = await getMongoDb();
  await db.collection(UNITS_COLLECTION).createIndexes([
    { key: { institutionId: 1, parentId: 1 } },
  ]);
  const result = await db.collection(UNITS_COLLECTION).insertOne(doc);
  return { ...doc, _id: result.insertedId.toString() };
}

export async function updateUnit(id: string, patch: Partial<InstitutionUnitInput>): Promise<void> {
  const now = new Date();
  if (!hasMongoConfig()) {
    const u = localUnits.find((x) => x._id === id);
    if (u) Object.assign(u, patch, { updatedAt: now });
    return;
  }
  const db = await getMongoDb();
  const _id = toObjectId(id);
  if (!_id) return;
  await db.collection(UNITS_COLLECTION).updateOne({ _id }, { $set: { ...patch, updatedAt: now } });
}

export async function deleteUnit(id: string): Promise<void> {
  if (!hasMongoConfig()) {
    const idx = localUnits.findIndex((x) => x._id === id);
    if (idx >= 0) localUnits.splice(idx, 1);
    return;
  }
  const db = await getMongoDb();
  const _id = toObjectId(id);
  if (!_id) return;
  await db.collection(UNITS_COLLECTION).deleteOne({ _id });
}

// ─── Members (викладачі) ──────────────────────────────────────────────────

const MEMBERS_COLLECTION = "institutionMembers";
const localMembers: InstitutionMember[] = [];

export async function listMembers(institutionId: string, unitId?: string): Promise<InstitutionMember[]> {
  if (!hasMongoConfig()) {
    return localMembers.filter((m) => m.institutionId === institutionId && (!unitId || m.unitId === unitId));
  }
  const db = await getMongoDb();
  const query: any = { institutionId };
  if (unitId) query.unitId = unitId;
  const docs = await db.collection(MEMBERS_COLLECTION).find(query).sort({ fullName: 1 }).toArray();
  return docs.map((d) => institutionMemberSchema.parse({ ...d, _id: d._id.toString() }));
}

export async function createMember(input: InstitutionMemberInput): Promise<InstitutionMember> {
  const now = new Date();
  const doc: Omit<InstitutionMember, "_id"> = {
    ...input,
    inviteStatus: (input as any).inviteStatus ?? "none",
    inviteToken: (input as any).inviteToken ?? "",
    inviteTokenExpires: (input as any).inviteTokenExpires ?? null,
    createdAt: now,
    updatedAt: now,
  };
  if (!hasMongoConfig()) {
    const local: InstitutionMember = { ...doc, _id: `mem-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` };
    localMembers.push(local);
    return local;
  }
  const db = await getMongoDb();
  await db.collection(MEMBERS_COLLECTION).createIndexes([
    { key: { institutionId: 1, unitId: 1 } },
    { key: { userId: 1 } },
  ]);
  const result = await db.collection(MEMBERS_COLLECTION).insertOne(doc);
  return { ...doc, _id: result.insertedId.toString() };
}

export async function updateMember(id: string, patch: Partial<InstitutionMemberInput>): Promise<void> {
  const now = new Date();
  if (!hasMongoConfig()) {
    const m = localMembers.find((x) => x._id === id);
    if (m) Object.assign(m, patch, { updatedAt: now });
    return;
  }
  const db = await getMongoDb();
  const _id = toObjectId(id);
  if (!_id) return;
  await db.collection(MEMBERS_COLLECTION).updateOne({ _id }, { $set: { ...patch, updatedAt: now } });
}

export async function deleteMember(id: string): Promise<void> {
  if (!hasMongoConfig()) {
    const idx = localMembers.findIndex((x) => x._id === id);
    if (idx >= 0) localMembers.splice(idx, 1);
    return;
  }
  const db = await getMongoDb();
  const _id = toObjectId(id);
  if (!_id) return;
  await db.collection(MEMBERS_COLLECTION).deleteOne({ _id });
}

// ─── Staff auto-sync ──────────────────────────────────────────────────────

/** Creates stub member records for unit heads and admin-panel entries that are not yet in members. */
export async function syncStaffFromSources(institutionId: string): Promise<{ created: number }> {
  const [units, admins, existing] = await Promise.all([
    listUnits(institutionId),
    listAdmins(institutionId),
    listMembers(institutionId),
  ]);
  const known = new Set(existing.map((m) => m.fullName.trim().toLowerCase()));
  let created = 0;

  for (const unit of units) {
    const name = unit.head?.trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (known.has(key)) continue;
    await createMember({
      institutionId, fullName: name,
      email: unit.headEmail?.trim() || "", phone: "",
      role: "head", title: "",
      position: `Завідувач — ${unit.name}`,
      unitId: unit._id || "", userId: "", orcid: "",
      isActive: true, hiredAt: "", staffCategory: "leadership",
    });
    known.add(key);
    created++;
  }

  for (const admin of admins) {
    const name = admin.fullName.trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (known.has(key)) continue;
    await createMember({
      institutionId, fullName: name,
      email: admin.email?.trim() || "",
      phone: admin.phone?.trim() || "",
      role: "staff", title: admin.title?.trim() || "",
      position: admin.position?.trim() || "",
      unitId: "", userId: "", orcid: "",
      isActive: true, hiredAt: "", staffCategory: "admin",
    });
    known.add(key);
    created++;
  }

  return { created };
}

// ─── Invite flow ──────────────────────────────────────────────────────────

/** Знаходить member-запрошення за invite token (для сторінки accept-invite). */
export async function findMemberByInviteToken(token: string): Promise<InstitutionMember | null> {
  if (!hasMongoConfig()) {
    return localMembers.find((m) => m.inviteToken === token) ?? null;
  }
  const db = await getMongoDb();
  const doc = await db.collection(MEMBERS_COLLECTION).findOne({ inviteToken: token });
  if (!doc) return null;
  return institutionMemberSchema.parse({ ...doc, _id: doc._id.toString() });
}

/** Позначає invite як прийнятий і прив'язує userId. */
export async function acceptMemberInvite(memberId: string, userId: string): Promise<void> {
  const now = new Date();
  if (!hasMongoConfig()) {
    const m = localMembers.find((x) => x._id === memberId);
    if (m) Object.assign(m, { userId, inviteStatus: "accepted", inviteToken: "", updatedAt: now });
    return;
  }
  const db = await getMongoDb();
  const _id = toObjectId(memberId);
  if (!_id) return;
  await db.collection(MEMBERS_COLLECTION).updateOne(
    { _id },
    { $set: { userId, inviteStatus: "accepted", inviteToken: "", updatedAt: now } },
  );
}

// ─── Programs ────────────────────────────────────────────────────────────

const PROGRAMS_COLLECTION = "institutionPrograms";
const localPrograms: InstitutionProgram[] = [];

export async function listPrograms(institutionId: string): Promise<InstitutionProgram[]> {
  if (!hasMongoConfig()) {
    return localPrograms.filter((p) => p.institutionId === institutionId);
  }
  const db = await getMongoDb();
  const docs = await db.collection(PROGRAMS_COLLECTION).find({ institutionId }).sort({ title: 1 }).toArray();
  return docs.map((d) => institutionProgramSchema.parse({ ...d, _id: d._id.toString() }));
}

export async function createProgram(input: InstitutionProgramInput): Promise<InstitutionProgram> {
  const now = new Date();
  const doc: Omit<InstitutionProgram, "_id"> = { ...input, isCommunityCreated: false, createdAt: now, updatedAt: now };
  if (!hasMongoConfig()) {
    const local: InstitutionProgram = { ...doc, _id: `prog-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` };
    localPrograms.push(local);
    return local;
  }
  const db = await getMongoDb();
  await db.collection(PROGRAMS_COLLECTION).createIndexes([
    { key: { institutionId: 1, level: 1 } },
  ]);
  const result = await db.collection(PROGRAMS_COLLECTION).insertOne(doc);
  return { ...doc, _id: result.insertedId.toString() };
}

export async function updateProgram(id: string, patch: Partial<InstitutionProgramInput>): Promise<void> {
  const now = new Date();
  if (!hasMongoConfig()) {
    const p = localPrograms.find((x) => x._id === id);
    if (p) Object.assign(p, patch, { updatedAt: now });
    return;
  }
  const db = await getMongoDb();
  const _id = toObjectId(id);
  if (!_id) return;
  await db.collection(PROGRAMS_COLLECTION).updateOne({ _id }, { $set: { ...patch, updatedAt: now } });
}

export async function deleteProgram(id: string): Promise<void> {
  if (!hasMongoConfig()) {
    const idx = localPrograms.findIndex((x) => x._id === id);
    if (idx >= 0) localPrograms.splice(idx, 1);
    return;
  }
  const db = await getMongoDb();
  const _id = toObjectId(id);
  if (!_id) return;
  await db.collection(PROGRAMS_COLLECTION).deleteOne({ _id });
}

// ─── Course catalog ──────────────────────────────────────────────────────

const COURSES_COLLECTION = "institutionCourses";
const localCourses: InstitutionCourse[] = [];

export async function listInstitutionCourses(institutionId: string, programId?: string): Promise<InstitutionCourse[]> {
  if (!hasMongoConfig()) {
    return localCourses.filter((c) => c.institutionId === institutionId && (!programId || c.programId === programId));
  }
  const db = await getMongoDb();
  const query: any = { institutionId };
  if (programId) query.programId = programId;
  const docs = await db.collection(COURSES_COLLECTION).find(query).sort({ semester: 1, title: 1 }).toArray();
  return docs.map((d) => institutionCourseSchema.parse({ ...d, _id: d._id.toString() }));
}

export async function createInstitutionCourse(input: InstitutionCourseInput): Promise<InstitutionCourse> {
  const now = new Date();
  const doc: Omit<InstitutionCourse, "_id"> = { ...input, createdAt: now, updatedAt: now };
  if (!hasMongoConfig()) {
    const local: InstitutionCourse = { ...doc, _id: `crs-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` };
    localCourses.push(local);
    return local;
  }
  const db = await getMongoDb();
  await db.collection(COURSES_COLLECTION).createIndexes([
    { key: { institutionId: 1, programId: 1 } },
  ]);
  const result = await db.collection(COURSES_COLLECTION).insertOne(doc);
  return { ...doc, _id: result.insertedId.toString() };
}

export async function updateInstitutionCourse(id: string, patch: Partial<InstitutionCourseInput>): Promise<void> {
  const now = new Date();
  if (!hasMongoConfig()) {
    const c = localCourses.find((x) => x._id === id);
    if (c) Object.assign(c, patch, { updatedAt: now });
    return;
  }
  const db = await getMongoDb();
  const _id = toObjectId(id);
  if (!_id) return;
  await db.collection(COURSES_COLLECTION).updateOne({ _id }, { $set: { ...patch, updatedAt: now } });
}

export async function deleteInstitutionCourse(id: string): Promise<void> {
  if (!hasMongoConfig()) {
    const idx = localCourses.findIndex((x) => x._id === id);
    if (idx >= 0) localCourses.splice(idx, 1);
    return;
  }
  const db = await getMongoDb();
  const _id = toObjectId(id);
  if (!_id) return;
  await db.collection(COURSES_COLLECTION).deleteOne({ _id });
}

// ── Institution admins (leadership / директорат) ──────────────────────────────

const ADMINS_COLLECTION = "institutionAdmins";
const localAdmins: InstitutionAdmin[] = [];

export async function listAdmins(institutionId: string): Promise<InstitutionAdmin[]> {
  if (!hasMongoConfig()) {
    return localAdmins.filter((a) => a.institutionId === institutionId)
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }
  const db = await getMongoDb();
  const docs = await db.collection(ADMINS_COLLECTION)
    .find({ institutionId })
    .sort({ orderIndex: 1 })
    .toArray();
  return docs.map((d) => institutionAdminSchema.parse({ ...d, _id: d._id.toString() }));
}

export async function createAdmin(input: InstitutionAdminInput): Promise<InstitutionAdmin> {
  const now = new Date();
  const doc: Omit<InstitutionAdmin, "_id"> = { ...input, createdAt: now, updatedAt: now };
  if (!hasMongoConfig()) {
    const local: InstitutionAdmin = { ...doc, _id: `admin-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` };
    localAdmins.push(local);
    return local;
  }
  const db = await getMongoDb();
  const result = await db.collection(ADMINS_COLLECTION).insertOne(doc);
  return institutionAdminSchema.parse({ ...doc, _id: result.insertedId.toString() });
}

export async function updateAdmin(id: string, patch: Partial<InstitutionAdminInput>): Promise<void> {
  const now = new Date();
  if (!hasMongoConfig()) {
    const a = localAdmins.find((x) => x._id === id);
    if (a) Object.assign(a, patch, { updatedAt: now });
    return;
  }
  const db = await getMongoDb();
  const _id = toObjectId(id);
  if (!_id) return;
  await db.collection(ADMINS_COLLECTION).updateOne({ _id }, { $set: { ...patch, updatedAt: now } });
}

export async function deleteAdmin(id: string): Promise<void> {
  if (!hasMongoConfig()) {
    const idx = localAdmins.findIndex((x) => x._id === id);
    if (idx >= 0) localAdmins.splice(idx, 1);
    return;
  }
  const db = await getMongoDb();
  const _id = toObjectId(id);
  if (!_id) return;
  await db.collection(ADMINS_COLLECTION).deleteOne({ _id });
}

// ── Community-driven: find-or-create ─────────────────────────────────────────

/**
 * Знаходить інституцію за назвою (нечутлива до регістру) або створює stub.
 * Повертає існуючу якщо є точний або близький збіг.
 */
export async function findOrCreateInstitutionByName(name: string): Promise<Institution> {
  const trimmed = name.trim();
  const lower = trimmed.toLowerCase();

  if (!hasMongoConfig()) {
    const found = localInstitutions.find((i) =>
      !i.deletedAt && i.name.toLowerCase() === lower
    );
    if (found) return found;
    const stub: Institution = {
      _id: `inst-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: trimmed, shortName: "", type: "other",
      country: "", city: "", email: "", phone: "", website: "", description: "",
      logoUrl: "", accreditation: "", contactName: "", contactPhone: "",
      ownerId: "", isVerified: false, verifiedAt: null,
      isCommunityCreated: true, deletedAt: null,
      createdAt: new Date(), updatedAt: new Date(),
    };
    localInstitutions.push(stub);
    return stub;
  }

  const db = await getMongoDb();
  const existing = await db.collection(COLLECTION).findOne({
    deletedAt: null,
    name: { $regex: `^${lower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
  });
  if (existing) return parseDoc(existing);

  const now = new Date();
  const doc = {
    name: trimmed, shortName: "", type: "other",
    country: "", city: "", email: "", phone: "", website: "", description: "",
    logoUrl: "", accreditation: "", contactName: "", contactPhone: "",
    ownerId: "", isVerified: false, verifiedAt: null,
    isCommunityCreated: true, deletedAt: null,
    createdAt: now, updatedAt: now,
  };
  const result = await db.collection(COLLECTION).insertOne(doc);
  return parseDoc({ ...doc, _id: result.insertedId });
}

/**
 * Знаходить підрозділ за назвою всередині інституції або створює stub.
 * @param parentId — якщо задано, шукає/створює як дочірній підрозділ.
 */
export async function findOrCreateUnitInInstitution(
  institutionId: string,
  unitName: string,
  parentId = "",
): Promise<InstitutionUnit> {
  const trimmed = unitName.trim();
  if (!trimmed) throw new Error("Unit name is required");
  const lower = trimmed.toLowerCase();

  if (!hasMongoConfig()) {
    const found = localUnits.find((u) =>
      u.institutionId === institutionId &&
      u.name.toLowerCase() === lower &&
      u.parentId === parentId
    );
    if (found) return found;
    const stub: InstitutionUnit = {
      _id: `unit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      institutionId, name: trimmed, shortName: "", type: "other",
      head: "", headEmail: "", description: "", parentId,
      orderIndex: 99, isCommunityCreated: true,
      createdAt: new Date(), updatedAt: new Date(),
    };
    localUnits.push(stub);
    return stub;
  }

  const db = await getMongoDb();
  const existing = await db.collection("institution_units").findOne({
    institutionId,
    parentId,
    name: { $regex: `^${lower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
  });
  if (existing) return institutionUnitSchema.parse({ ...existing, _id: existing._id.toString() });

  const now = new Date();
  const doc = {
    institutionId, name: trimmed, shortName: "", type: "other",
    head: "", headEmail: "", description: "", parentId,
    orderIndex: 99, isCommunityCreated: true,
    createdAt: now, updatedAt: now,
  };
  const result = await db.collection("institution_units").insertOne(doc);
  return institutionUnitSchema.parse({ ...doc, _id: result.insertedId.toString() });
}

/**
 * Знаходить освітню програму за назвою або створює community-stub.
 */
export async function findOrCreateProgramByName(
  institutionId: string,
  programName: string,
): Promise<InstitutionProgram> {
  const trimmed = programName.trim();
  if (!trimmed) throw new Error("Program name is required");
  const lower = trimmed.toLowerCase();

  if (!hasMongoConfig()) {
    const found = localPrograms.find((p) =>
      p.institutionId === institutionId && p.title.toLowerCase() === lower
    );
    if (found) return found;
    const stub: InstitutionProgram = {
      _id: `prog-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      institutionId, title: trimmed, code: "", specialty: "",
      level: "other" as InstitutionProgram["level"],
      unitId: "", ects: 0, durationYears: 0, language: "uk",
      academicYear: "", description: "", isActive: true,
      isCommunityCreated: true,
      createdAt: new Date(), updatedAt: new Date(),
    };
    localPrograms.push(stub);
    return stub;
  }

  const db = await getMongoDb();
  const existing = await db.collection("institution_programs").findOne({
    institutionId,
    title: { $regex: `^${lower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
  });
  if (existing) return institutionProgramSchema.parse({ ...existing, _id: existing._id.toString() });

  const now = new Date();
  const doc = {
    institutionId, title: trimmed, code: "", specialty: "",
    level: "other", unitId: "", ects: 0, durationYears: 0,
    language: "uk", academicYear: "", description: "", isActive: true,
    isCommunityCreated: true, createdAt: now, updatedAt: now,
  };
  const result = await db.collection("institution_programs").insertOne(doc);
  return institutionProgramSchema.parse({ ...doc, _id: result.insertedId.toString() });
}

/**
 * Повертає всіх користувачів з їхніми affiliations для даної інституції.
 * Читає з колекції users де affiliations[].institutionId === institutionId.
 */
export async function getCommunityMembers(institutionId: string): Promise<Array<{
  userId: string;
  firstName: string;
  lastName: string;
  affiliation: UserAffiliation;
}>> {
  if (!hasMongoConfig()) return [];
  const db = await getMongoDb();
  const users = await db.collection("users").find({
    "affiliations.institutionId": institutionId,
  }, {
    projection: { _id: 1, firstName: 1, lastName: 1, affiliations: 1 },
  }).toArray();

  const result: Array<{ userId: string; firstName: string; lastName: string; affiliation: UserAffiliation }> = [];
  for (const u of users) {
    const matched = (u.affiliations ?? []).filter(
      (a: UserAffiliation) => a.institutionId === institutionId
    );
    for (const aff of matched) {
      result.push({
        userId: u._id.toString(),
        firstName: u.firstName ?? "",
        lastName: u.lastName ?? "",
        affiliation: userAffiliationSchema.parse(aff),
      });
    }
  }
  return result;
}

/**
 * Повертає community-units: підрозділи, які зазначили самі юзери,
 * але які ще не підтверджені адміном.
 */
export async function getCommunityUnits(institutionId: string): Promise<string[]> {
  if (!hasMongoConfig()) return [];
  const db = await getMongoDb();
  const users = await db.collection("users").find(
    { "affiliations.institutionId": institutionId, "affiliations.unitName": { $ne: "" } },
    { projection: { affiliations: 1 } }
  ).toArray();

  const nameSet = new Set<string>();
  for (const u of users) {
    for (const a of (u.affiliations ?? []) as UserAffiliation[]) {
      if (a.institutionId === institutionId && a.unitName) {
        nameSet.add(a.unitName.trim());
      }
    }
  }
  return [...nameSet].sort();
}

// ── Hierarchy & statistics ────────────────────────────────────────────────────

export type CommunityUnitNode = {
  name: string;
  unitId: string;
  count: number;
  children: CommunityUnitNode[];
};

export type CommunityStructure = {
  totalUsers: number;
  topUnits: CommunityUnitNode[];  // root-level (faculty/institute)
  orphanCount: number;            // users with no unit at all
  programs: { name: string; programId: string; count: number }[];
};

/**
 * Будує ієрархічну структуру інституції з affiliations користувачів.
 * Два рівні: parentUnit → childUnit.
 */
export async function getCommunityStructure(institutionId: string): Promise<CommunityStructure> {
  if (!hasMongoConfig()) {
    return { totalUsers: 0, topUnits: [], orphanCount: 0, programs: [] };
  }

  const db = await getMongoDb();
  const users = await db.collection("users").find(
    { "affiliations.institutionId": institutionId },
    { projection: { affiliations: 1 } }
  ).toArray();

  // Aggregate counts
  type TopKey = string; // parentUnitName or ""
  type ChildKey = string; // unitName

  const topMap = new Map<TopKey, { unitId: string; count: number; children: Map<ChildKey, { unitId: string; count: number }> }>();
  let totalUsers = 0;
  let orphanCount = 0;
  const programMap = new Map<string, { programId: string; count: number }>();

  for (const u of users) {
    const affs = (u.affiliations ?? []) as UserAffiliation[];
    const matched = affs.filter((a) => a.institutionId === institutionId);
    if (matched.length === 0) continue;
    totalUsers++;

    // Use the most recent (isCurrent) affiliation; fallback to first
    const aff = matched.find((a) => a.isCurrent) ?? matched[0];

    if (!aff.parentUnitName && !aff.unitName) {
      orphanCount++;
    } else {
      const topKey = aff.parentUnitName || aff.unitName;
      const topId = aff.parentUnitName ? aff.parentUnitId : aff.unitId;
      if (!topMap.has(topKey)) {
        topMap.set(topKey, { unitId: topId, count: 0, children: new Map() });
      }
      const top = topMap.get(topKey)!;
      top.count++;

      // If we have both levels, add child
      if (aff.parentUnitName && aff.unitName) {
        if (!top.children.has(aff.unitName)) {
          top.children.set(aff.unitName, { unitId: aff.unitId, count: 0 });
        }
        top.children.get(aff.unitName)!.count++;
      }
    }

    // Programs
    if (aff.programName) {
      if (!programMap.has(aff.programName)) {
        programMap.set(aff.programName, { programId: aff.programId, count: 0 });
      }
      programMap.get(aff.programName)!.count++;
    }
  }

  const topUnits: CommunityUnitNode[] = Array.from(topMap.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .map(([name, data]) => ({
      name,
      unitId: data.unitId,
      count: data.count,
      children: Array.from(data.children.entries())
        .sort((a, b) => b[1].count - a[1].count)
        .map(([cname, cdata]) => ({
          name: cname,
          unitId: cdata.unitId,
          count: cdata.count,
          children: [],
        })),
    }));

  const programs = Array.from(programMap.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .map(([name, data]) => ({ name, programId: data.programId, count: data.count }));

  return { totalUsers, topUnits, orphanCount, programs };
}

/**
 * Autocomplete програм: union офіційних + community.
 */
export async function searchPrograms(institutionId: string, query: string): Promise<
  { id: string | null; name: string; level: string; isOfficial: boolean }[]
> {
  const q = query.toLowerCase().trim();
  const [official, communityNames] = await Promise.all([
    listPrograms(institutionId).catch(() => []),
    (async () => {
      if (!hasMongoConfig()) return [] as string[];
      const db = await getMongoDb();
      const users = await db.collection("users").find(
        { "affiliations.institutionId": institutionId, "affiliations.programName": { $ne: "" } },
        { projection: { affiliations: 1 } }
      ).toArray();
      const names = new Set<string>();
      for (const u of users) {
        for (const a of (u.affiliations ?? []) as UserAffiliation[]) {
          if (a.institutionId === institutionId && a.programName) names.add(a.programName.trim());
        }
      }
      return [...names];
    })(),
  ]);

  const officialFiltered = official
    .filter((p) => !q || p.title.toLowerCase().includes(q))
    .map((p) => ({ id: p._id!, name: p.title, level: p.level, isOfficial: true }));

  const officialTitles = new Set(officialFiltered.map((p) => p.name.toLowerCase()));
  const communityFiltered = communityNames
    .filter((n) => (!q || n.toLowerCase().includes(q)) && !officialTitles.has(n.toLowerCase()))
    .map((n) => ({ id: null, name: n, level: "", isOfficial: false }));

  return [...officialFiltered, ...communityFiltered].slice(0, 15);
}
