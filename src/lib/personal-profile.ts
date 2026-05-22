import { ObjectId, type Document, type WithId } from "mongodb";
import { getMongoDb, hasMongoConfig } from "@/lib/mongodb";
import {
  personalProfileInputSchema,
  personalProfileSchema,
  type PersonalProfile,
  type PersonalProfileInput,
  type SafeUser,
} from "@/lib/schemas";

const collectionName = "personalProfiles";
const localProfiles: PersonalProfile[] = [];

function parseProfile(doc: WithId<Document> | Record<string, unknown>): PersonalProfile {
  const { _id, ...rest } = doc as Record<string, unknown>;
  return personalProfileSchema.parse({ ...rest, _id: _id?.toString() });
}

function profileFromUser(user: SafeUser): PersonalProfileInput {
  const links = [
    user.orcid ? { kind: "orcid" as const, label: "ORCID", value: user.orcid, url: user.orcid.startsWith("http") ? user.orcid : `https://orcid.org/${user.orcid}`, isPrimary: true } : null,
    user.academicLinks?.googleScholar ? { kind: "google_scholar" as const, label: "Google Scholar", value: "", url: user.academicLinks.googleScholar, isPrimary: false } : null,
    user.academicLinks?.researchGate ? { kind: "researchgate" as const, label: "ResearchGate", value: "", url: user.academicLinks.researchGate, isPrimary: false } : null,
    user.academicLinks?.scopus ? { kind: "scopus" as const, label: "Scopus", value: user.academicLinks.scopus, url: "", isPrimary: false } : null,
    user.academicLinks?.webOfScience ? { kind: "web_of_science" as const, label: "Web of Science", value: user.academicLinks.webOfScience, url: "", isPrimary: false } : null,
    user.academicLinks?.linkedin ? { kind: "linkedin" as const, label: "LinkedIn", value: "", url: user.academicLinks.linkedin, isPrimary: false } : null,
    user.academicLinks?.github ? { kind: "github" as const, label: "GitHub", value: "", url: user.academicLinks.github, isPrimary: false } : null,
    user.academicLinks?.website ? { kind: "website" as const, label: "Website", value: "", url: user.academicLinks.website, isPrimary: false } : null,
    user.academicLinks?.telegram ? { kind: "telegram" as const, label: "Telegram", value: user.academicLinks.telegram, url: "", isPrimary: false } : null,
  ].filter(Boolean);

  const institutions = (user.affiliations ?? []).map((aff, idx) => ({
    _id: aff._id,
    institutionId: aff.institutionId,
    institutionName: aff.institutionName,
    parentUnitName: aff.parentUnitName,
    unitName: aff.unitName,
    programName: aff.programName,
    role: aff.role,
    position: aff.position,
    startYear: aff.startYear ?? null,
    endYear: aff.endYear ?? null,
    isCurrent: aff.isCurrent,
    isPrimary: idx === 0 || aff.isCurrent,
  }));

  return personalProfileInputSchema.parse({
    firstName: user.firstName,
    lastName: user.lastName,
    firstNameLatin: user.firstNameLatin ?? "",
    lastNameLatin: user.lastNameLatin ?? "",
    phone: user.phone ?? "",
    orcid: user.orcid ?? "",
    position: user.position ?? "",
    affiliation: user.affiliation ?? "",
    profileBio: user.profileBio ?? "",
    defaultSpecialty: user.defaultSpecialty ?? "",
    researchInterests: user.researchInterests ?? [],
    institutions,
    links,
    preferences: {
      preferredLanguage: "uk",
      citationName: [user.firstNameLatin, user.lastNameLatin].filter(Boolean).join(" "),
      defaultAffiliationId: institutions.find((item) => item.isPrimary)?._id ?? "",
    },
    onboardingCompleted: false,
  });
}

async function ensureIndexes() {
  if (!hasMongoConfig()) return;
  const db = await getMongoDb();
  await Promise.all([
    db.collection(collectionName).createIndex({ userId: 1 }, { unique: true }),
    db.collection(collectionName).createIndex({ email: 1 }),
    db.collection(collectionName).createIndex({ "institutions.institutionId": 1 }),
  ]);
}

export async function getPersonalProfile(user: SafeUser): Promise<PersonalProfile> {
  if (!user._id) throw new Error("User id is required");

  if (!hasMongoConfig()) {
    const existing = localProfiles.find((profile) => profile.userId === user._id);
    if (existing) return existing;
    return createPersonalProfileForUser(user);
  }

  const db = await getMongoDb();
  await ensureIndexes();
  const doc = await db.collection(collectionName).findOne({ userId: user._id });
  if (doc) return parseProfile(doc);
  return createPersonalProfileForUser(user);
}

export async function createPersonalProfileForUser(user: SafeUser): Promise<PersonalProfile> {
  if (!user._id) throw new Error("User id is required");
  const now = new Date();
  const base = profileFromUser(user);
  const profile: PersonalProfile = {
    ...base,
    firstName: base.firstName ?? user.firstName,
    lastName: base.lastName ?? user.lastName,
    firstNameLatin: base.firstNameLatin ?? user.firstNameLatin ?? "",
    lastNameLatin: base.lastNameLatin ?? user.lastNameLatin ?? "",
    phone: base.phone ?? user.phone ?? "",
    orcid: base.orcid ?? user.orcid ?? "",
    position: base.position ?? user.position ?? "",
    affiliation: base.affiliation ?? user.affiliation ?? "",
    profileBio: base.profileBio ?? user.profileBio ?? "",
    defaultSpecialty: base.defaultSpecialty ?? user.defaultSpecialty ?? "",
    researchInterests: base.researchInterests ?? user.researchInterests ?? [],
    institutions: base.institutions ?? [],
    links: base.links ?? [],
    preferences: base.preferences ?? {
      preferredLanguage: "uk",
      citationName: [user.firstNameLatin, user.lastNameLatin].filter(Boolean).join(" "),
      defaultAffiliationId: "",
    },
    onboardingCompleted: base.onboardingCompleted ?? false,
    userId: user._id,
    email: user.email,
    createdAt: now,
    updatedAt: now,
  };

  if (!hasMongoConfig()) {
    const local = { ...profile, _id: `pp-${localProfiles.length + 1}` };
    localProfiles.push(local);
    return local;
  }

  const db = await getMongoDb();
  await ensureIndexes();
  const { _id, ...insert } = profile;
  void _id;
  const result = await db.collection(collectionName).insertOne(insert);
  return { ...profile, _id: result.insertedId.toString() };
}

export async function updatePersonalProfile(user: SafeUser, input: PersonalProfileInput): Promise<PersonalProfile> {
  const existing = await getPersonalProfile(user);
  const now = new Date();
  const patch = personalProfileInputSchema.parse(input);
  const next: PersonalProfile = {
    ...existing,
    ...patch,
    email: user.email,
    updatedAt: now,
  };

  if (!hasMongoConfig()) {
    const idx = localProfiles.findIndex((profile) => profile.userId === user._id);
    if (idx >= 0) localProfiles[idx] = next;
    return next;
  }

  const db = await getMongoDb();
  const _id = ObjectId.isValid(existing._id ?? "") ? new ObjectId(existing._id) : null;
  const selector = _id ? { _id } : { userId: user._id };
  const result = await db.collection(collectionName).findOneAndUpdate(
    selector,
    { $set: { ...patch, email: user.email, updatedAt: now } },
    { returnDocument: "after" },
  );
  return result ? parseProfile(result) : next;
}

export async function syncPersonalProfileIdentity(user: SafeUser, input: PersonalProfileInput) {
  const profile = await getPersonalProfile(user);
  return updatePersonalProfile(user, {
    ...profile,
    firstName: input.firstName ?? profile.firstName,
    lastName: input.lastName ?? profile.lastName,
    firstNameLatin: input.firstNameLatin ?? profile.firstNameLatin,
    lastNameLatin: input.lastNameLatin ?? profile.lastNameLatin,
    phone: input.phone ?? profile.phone,
    orcid: input.orcid ?? profile.orcid,
    position: input.position ?? profile.position,
    affiliation: input.affiliation ?? profile.affiliation,
    profileBio: input.profileBio ?? profile.profileBio,
    defaultSpecialty: input.defaultSpecialty ?? profile.defaultSpecialty,
    researchInterests: input.researchInterests ?? profile.researchInterests,
    links: input.links ?? profile.links,
    institutions: input.institutions ?? profile.institutions,
  });
}
