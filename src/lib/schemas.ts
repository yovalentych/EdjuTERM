import { z } from "zod";

// --- Project Base Enums ---
export const projectTypes = [
  "fundamental",
  "applied",
  "infrastructure",
  "training",
  "grant",
  "dissertation",
  "experimental",
  "internship",
  "laboratory",
] as const;

export const projectVisibilityOptions = ["private", "team", "public_profile"] as const;
export const dataPolicyOptions = ["internal", "open_by_default", "embargo_then_open", "restricted_sensitive"] as const;
export const repositoryPlanOptions = ["github_zenodo", "osf", "institutional", "undecided"] as const;
export const ethicsReviewOptions = ["not_required", "planned", "approved"] as const;

// --- Laboratory Enums ---
export const labSafetyLevels = ["BSL-1", "BSL-2", "BSL-3", "BSL-4"] as const;
export const labAccessPolicies = ["private", "request", "public"] as const;
export const labCategories = ["biological", "chemical", "physical", "analytical", "computational", "clinical", "general"] as const;

// --- User Affiliation (community-driven institution membership) ---
export const PARENT_UNIT_TYPES = ["faculty", "institute", "college", "division", "center", "school", "other"] as const;
export const CHILD_UNIT_TYPES = ["department", "lab", "division", "center", "group", "section", "other"] as const;
export type ParentUnitType = typeof PARENT_UNIT_TYPES[number];
export type ChildUnitType = typeof CHILD_UNIT_TYPES[number];

export const userAffiliationSchema = z.object({
  _id: z.string().optional(),
  institutionId: z.string(),
  institutionName: z.string(),
  // Two-level unit hierarchy: parent (faculty/institute) → child (dept/lab/division)
  parentUnitId: z.string().default(""),
  parentUnitType: z.string().default(""),   // "faculty" | "institute" | ...
  parentUnitName: z.string().default(""),   // e.g. "Факультет природничих наук"
  unitId: z.string().default(""),
  unitType: z.string().default(""),         // "department" | "lab" | ...
  unitName: z.string().default(""),         // e.g. "Кафедра молекулярної біології"
  // Optional educational program (community-created)
  programId: z.string().default(""),
  programName: z.string().default(""),      // e.g. "Молекулярна біологія та біохімія (PhD)"
  role: z.string().max(200).default(""),
  position: z.string().max(200).default(""),
  startYear: z.number().int().nullable().default(null),
  endYear: z.number().int().nullable().default(null),
  isCurrent: z.boolean().default(true),
});

export const affiliationInputSchema = z.object({
  institutionName: z.string().min(2).max(300),
  parentUnitType: z.string().max(40).default(""),
  parentUnitName: z.string().max(200).default(""),
  unitType: z.string().max(40).default(""),
  unitName: z.string().max(200).default(""),
  programName: z.string().max(300).default(""),
  role: z.string().max(200).default(""),
  position: z.string().max(200).default(""),
  startYear: z.number().int().min(1950).max(2100).nullable().optional(),
  endYear: z.number().int().min(1950).max(2100).nullable().optional(),
  isCurrent: z.boolean().default(true),
});

export type UserAffiliation = z.infer<typeof userAffiliationSchema>;
export type AffiliationInput = z.infer<typeof affiliationInputSchema>;

// --- Personal Profile Database ---
// Central user-owned profile used for autofill across education, publications,
// reports, mobile forms, and external-service metadata.
export const personalProfileLinkSchema = z.object({
  kind: z.enum([
    "orcid",
    "google_scholar",
    "scopus",
    "web_of_science",
    "researchgate",
    "academia",
    "linkedin",
    "github",
    "website",
    "telegram",
    "other",
  ]).default("other"),
  label: z.string().max(120).default(""),
  value: z.string().max(300).default(""),
  url: z.string().max(500).default(""),
  isPrimary: z.boolean().default(false),
});

export const personalProfileInstitutionSchema = z.object({
  _id: z.string().optional(),
  institutionId: z.string().default(""),
  institutionName: z.string().max(300).default(""),
  shortName: z.string().max(80).default(""),
  country: z.string().max(100).default(""),
  city: z.string().max(120).default(""),
  parentUnitName: z.string().max(200).default(""),
  unitName: z.string().max(200).default(""),
  programName: z.string().max(300).default(""),
  educationLevel: z.string().max(80).default(""),
  role: z.string().max(160).default(""),
  position: z.string().max(200).default(""),
  startYear: z.number().int().min(1950).max(2100).nullable().default(null),
  endYear: z.number().int().min(1950).max(2100).nullable().default(null),
  isCurrent: z.boolean().default(true),
  isPrimary: z.boolean().default(false),
});

export const personalProfileSchema = z.object({
  _id: z.string().optional(),
  userId: z.string(),
  email: z.string().email(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  firstNameLatin: z.string().max(100).default(""),
  lastNameLatin: z.string().max(100).default(""),
  phone: z.string().max(20).default(""),
  orcid: z.string().max(40).default(""),
  position: z.string().max(200).default(""),
  affiliation: z.string().max(300).default(""),
  profileBio: z.string().max(2000).default(""),
  defaultSpecialty: z.string().max(120).default(""),
  researchInterests: z.array(z.string().max(80)).default([]),
  institutions: z.array(personalProfileInstitutionSchema).default([]),
  links: z.array(personalProfileLinkSchema).default([]),
  preferences: z.object({
    preferredLanguage: z.enum(["uk", "en"]).default("uk"),
    citationName: z.string().max(240).default(""),
    defaultAffiliationId: z.string().default(""),
  }).default({ preferredLanguage: "uk", citationName: "", defaultAffiliationId: "" }),
  onboardingCompleted: z.boolean().default(false),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const personalProfileInputSchema = personalProfileSchema
  .omit({ _id: true, userId: true, email: true, createdAt: true, updatedAt: true })
  .partial()
  .extend({
    firstName: z.string().min(1).max(100).optional(),
    lastName: z.string().min(1).max(100).optional(),
  });

export type PersonalProfile = z.infer<typeof personalProfileSchema>;
export type PersonalProfileInput = z.infer<typeof personalProfileInputSchema>;
export type PersonalProfileInstitution = z.infer<typeof personalProfileInstitutionSchema>;
export type PersonalProfileLink = z.infer<typeof personalProfileLinkSchema>;

// --- User Schema ---
export const safeUserSchema = z.object({
  _id: z.string().optional(),
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.string(),
  affiliation: z.string().optional(),
  position: z.string().optional(),
  orcid: z.string().optional(),
  profileBio: z.string().optional(),
  defaultSpecialty: z.string().optional(),
  firstNameLatin: z.string().optional(),
  lastNameLatin: z.string().optional(),
  phone: z.string().optional(),
  phoneVerifiedAt: z.coerce.date().nullable().optional(),
  emailVerifiedAt: z.coerce.date().nullable().optional(),
  sessionVersion: z.number().int().default(1),
  accountType: z.enum(["personal", "institution"]).default("personal").optional(),
  institutionId: z.string().optional(),
  // Structured affiliations (community-driven)
  affiliations: z.array(userAffiliationSchema).optional(),
  // Academic profile
  academicLinks: z.object({
    googleScholar: z.string().max(200).optional(),
    researchGate: z.string().max(200).optional(),
    scopus: z.string().max(100).optional(),
    webOfScience: z.string().max(100).optional(),
    publons: z.string().max(200).optional(),
    academia: z.string().max(200).optional(),
    linkedin: z.string().max(200).optional(),
    github: z.string().max(200).optional(),
    website: z.string().max(300).optional(),
    telegram: z.string().max(100).optional(),
  }).optional(),
  researchInterests: z.array(z.string().max(80)).optional(),
});

export const userSchema = safeUserSchema.extend({
  firstNameLatin: z.string().default(""),
  lastNameLatin: z.string().default(""),
  phone: z.string().default(""),
  phoneVerifiedAt: z.coerce.date().nullable().default(null),
  orcid: z.string().default(""),
  position: z.string().default(""),
  profileBio: z.string().default(""),
  passwordHash: z.string(),
  sessionVersion: z.number().int().default(1),
  emailVerifiedAt: z.coerce.date().nullable().default(null),
  accountType: z.enum(["personal", "institution"]).default("personal"),
  institutionId: z.string().default(""),
  affiliations: z.array(userAffiliationSchema).default([]),
  academicLinks: z.object({
    googleScholar: z.string().max(200).optional(),
    researchGate: z.string().max(200).optional(),
    scopus: z.string().max(100).optional(),
    webOfScience: z.string().max(100).optional(),
    publons: z.string().max(200).optional(),
    academia: z.string().max(200).optional(),
    linkedin: z.string().max(200).optional(),
    github: z.string().max(200).optional(),
    website: z.string().max(300).optional(),
    telegram: z.string().max(100).optional(),
  }).optional(),
  researchInterests: z.array(z.string().max(80)).default([]),
  updatedAt: z.coerce.date(),
  createdAt: z.coerce.date(),
});

export const loginInputSchema = z.object({
  email: z.string().email().max(240),
  password: z.string().min(1).max(100),
});

// E.164-друже: + з 7..15 цифр. Опціональний — якщо порожній рядок, пропустимо.
const phoneE164 = z
  .string()
  .max(20)
  .regex(/^\+?[1-9]\d{6,14}$/u, "Номер у форматі +380XXXXXXXXX")
  .optional()
  .or(z.literal(""));

export const registerInputSchema = z.object({
  email: z.string().email().max(240),
  password: z.string().min(8).max(100),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  firstNameLatin: z.string().min(1).max(100),
  lastNameLatin: z.string().min(1).max(100),
  phone: phoneE164,
});

export const profileInputSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  firstNameLatin: z.string().max(100).optional(),
  lastNameLatin: z.string().max(100).optional(),
  phone: phoneE164,
  orcid: z.string().max(20).optional(),
  position: z.string().max(200).optional(),
  affiliation: z.string().max(300).optional(),
  profileBio: z.string().max(2000).optional(),
  defaultSpecialty: z.string().max(120).optional(),
  academicLinks: z.object({
    googleScholar: z.string().max(200).optional(),
    researchGate: z.string().max(200).optional(),
    scopus: z.string().max(100).optional(),
    webOfScience: z.string().max(100).optional(),
    publons: z.string().max(200).optional(),
    academia: z.string().max(200).optional(),
    linkedin: z.string().max(200).optional(),
    github: z.string().max(200).optional(),
    website: z.string().max(300).optional(),
    telegram: z.string().max(100).optional(),
  }).optional(),
  researchInterests: z.array(z.string().max(80)).optional(),
});

// --- Project/Laboratory Input Schema ---
export const projectInputSchema = z.object({
  title: z.string().min(3).max(300),
  acronym: z.string().min(2).max(40),
  summary: z.string().max(1200).default(""),
  projectType: z.enum(projectTypes),
  researchField: z.string().max(120).default(""),
  grantProgram: z.string().max(200).default(""),
  startDate: z.string().max(32).default(""),
  endDate: z.string().max(32).default(""),
  defaultLocale: z.enum(["uk", "en"]).default("uk"),
  visibility: z.enum(projectVisibilityOptions).default("private"),
  dataPolicy: z.enum(dataPolicyOptions).default("embargo_then_open"),
  repositoryPlan: z.enum(repositoryPlanOptions).default("github_zenodo"),
  ethicsReview: z.enum(ethicsReviewOptions).default("not_required"),
  hasHumanData: z.coerce.boolean().default(false),
  hasAnimalData: z.coerce.boolean().default(false),
  hasPersonalData: z.coerce.boolean().default(false),
  openScienceEnabled: z.coerce.boolean().default(true),
  teamChatEnabled: z.coerce.boolean().default(true),
  taskManagementEnabled: z.coerce.boolean().default(true),
  rawDataRegistryEnabled: z.coerce.boolean().default(true),
  
  // Laboratory unique fields
  roomNumber: z.string().max(40).default(""),
  institution: z.string().max(200).default(""),
  labCategory: z.enum(labCategories).default("general"),
  safetyLevel: z.enum(labSafetyLevels).default("BSL-1"),
  accessPolicy: z.enum(labAccessPolicies).default("private"),
  responsiblePersonIds: z.array(z.string()).default([]),
  workingHours: z.string().max(100).default("9:00 - 18:00"),
});

export const projectSchema = projectInputSchema.extend({
  _id: z.string().optional(),
  ownerId: z.string(),
  supervisorId: z.string(),
  memberIds: z.array(z.string()).default([]),
  linkedLabIds: z.array(z.string()).default([]),
  joinCode: z.string().max(32).default(""),
  supervisorJoinCode: z.string().max(32).default(""),
  status: z.enum(["active", "archived"]).default("active"),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().optional(),
  deletedBy: z.string().optional(),
});

// --- Chat ---
export const chatMessageSchema = z.object({
  _id: z.string().optional(),
  projectId: z.string(),
  userId: z.string(),
  authorId: z.string().default(""),
  displayName: z.string(),
  initials: z.string(),
  content: z.string().min(1).max(5000),
  body: z.string().default(""),
  createdAt: z.coerce.date(),
});

export const teamMessageSchema = chatMessageSchema.extend({
  starredBy: z.array(z.string()).default([]),
  pinned: z.boolean().default(false),
  label: z.enum(["urgent", "question", "decision", "info", "note"]).nullable().optional(),
  topic: z.string().optional(),
  reactions: z.record(z.string(), z.array(z.string())).optional(),
});

export const budgetCategories = ["equipment", "reagents", "consumables", "services", "travel", "personnel", "subcontracting", "overhead", "software", "publications", "other"] as const;
export const currencyOptions = ["UAH", "USD", "EUR", "GBP"] as const;

// --- Audit ---
export const auditEventSchema = z.object({
  _id: z.string().optional(),
  projectId: z.string().optional(),
  actorId: z.string(),
  actorEmail: z.string(),
  action: z.string(),
  targetUserId: z.string().optional(),
  targetEmail: z.string().optional(),
  targetEntity: z.string().optional(),
  actorName: z.string().optional(),
  before: z.unknown().optional(),
  after: z.unknown().optional(),
  metadata: z.record(z.string(), z.any()).default({}),
  requestId: z.string().optional(),
  createdAt: z.coerce.date(),
});

// --- Planning ---
export const taskStatusOptions = ["todo", "in_progress", "review", "done", "blocked", "cancelled", "archived"] as const;
export const taskPriorityOptions = ["low", "medium", "high", "critical"] as const;
export const taskPriorities = taskPriorityOptions;
export const taskCategories = ["research", "admin", "lab", "writing", "meeting", "other"] as const;

export const taskInputSchema = z.object({
  projectId: z.string(),
  title: z.string().min(1).max(300).catch(""),
  description: z.string().max(2000).default(""),
  status: z.enum(taskStatusOptions).catch("todo").default("todo"),
  priority: z.enum(taskPriorityOptions).catch("medium").default("medium"),
  category: z.enum(taskCategories).catch("other").default("other"),
  dueDate: z.string().max(32).default(""),
  assigneeId: z.string().default(""),
  parentTaskId: z.string().default(""),
  estimatedHours: z.number().default(0),
});

export const taskSchema = taskInputSchema.extend({
  _id: z.string().optional(),
  createdBy: z.string(),
  completedAt: z.coerce.date().nullable().default(null),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const milestoneInputSchema = z.object({
  projectId: z.string(),
  stageId: z.string().optional(),
  title: z.string().min(1).max(300).catch(""),
  description: z.string().max(2000).default(""),
  dueDate: z.string().max(32).default(""),
});

export const milestoneSchema = milestoneInputSchema.extend({
  _id: z.string().optional(),
  status: z.enum(["upcoming", "reached", "missed"]).default("upcoming"),
  reachedAt: z.coerce.date().nullable().default(null),
  createdBy: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const timeEntryInputSchema = z.object({
  projectId: z.string(),
  date: z.string().max(32),
  hours: z.coerce.number().min(0.25).max(24),
  category: z.string().max(100).default("research"),
  description: z.string().max(1000).default(""),
  taskId: z.string().optional(),
});

export const timeEntrySchema = timeEntryInputSchema.extend({
  _id: z.string().optional(),
  userId: z.string(),
  createdAt: z.coerce.date(),
});

// --- Research Plan ---
export const researchStageInputSchema = z.object({
  projectId: z.string(),
  stageNumber: z.number().int().min(1),
  title: z.string().min(1).max(300).catch(""),
  goals: z.string().max(2000).default(""),
  tasksText: z.string().max(2000).default(""),
  indicators: z.string().max(2000).default(""),
  startDate: z.string().max(32).default(""),
  endDate: z.string().max(32).default(""),
  budget: z.coerce.number().min(0).default(0),
  currency: z.string().max(10).default("UAH"),
});

export const researchStageSchema = researchStageInputSchema.extend({
  _id: z.string().optional(),
  status: z.enum(["planned", "active", "completed", "reported"]).default("planned"),
  progress: z.number().int().min(0).max(100).default(0),
  linkedTaskIds: z.array(z.string()).default([]),
  linkedMilestoneId: z.string().optional(),
  completionNote: z.string().max(2000).default(""),
  completedAt: z.coerce.date().nullable().default(null),
  createdBy: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

// --- Learning ---

export const learningCourseInputSchema = z.object({
  projectId: z.string(),
  title: z.string().min(1).max(300).catch(""),
  code: z.string().max(40).default(""),
  instructor: z.string().max(200).default(""),
  semester: z.number().int().min(1).max(12).default(1),
  semesterEnd: z.coerce.number().int().min(1).max(12).optional(),
  year: z.number().int().min(1).max(10).optional(),
  credits: z.coerce.number().min(0).max(30).default(3),
  courseType: z.enum(["mandatory", "elective", "optional", "language", "physical", "practice", "research"]).default("mandatory"),
  status: z.enum(["planned", "active", "completed", "failed", "withdrawn"]).default("planned"),
  curriculumCourseId: z.string().max(80).default(""),
  finalScore: z.number().nullable().default(null),
  finalGrade: z.string().default(""),
  note: z.string().max(2000).default(""),
});

export const learningCourseSchema = learningCourseInputSchema.extend({
  _id: z.string().optional(),
  createdBy: z.string().default(""),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const learningModuleInputSchema = z.object({
  courseId: z.string(),
  projectId: z.string(),
  title: z.string().min(1).max(300).catch(""),
  description: z.string().max(1000).default(""),
  orderIndex: z.coerce.number().int().default(0),
  isCompleted: z.coerce.boolean().default(false),
});

export const learningModuleSchema = learningModuleInputSchema.extend({
  _id: z.string().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const learningTopicInputSchema = z.object({
  moduleId: z.string(),
  courseId: z.string(),
  projectId: z.string(),
  title: z.string().min(1).max(300).catch(""),
  description: z.string().max(1000).default(""),
  topicType: z.enum(["lecture", "seminar", "practical", "lab", "self_study", "consultation"]).default("lecture"),
  durationHours: z.coerce.number().min(0).default(2),
  isCompleted: z.coerce.boolean().default(false),
  completedAt: z.coerce.date().nullable().optional(),
  linkedLectureId: z.string().optional(),
  notes: z.string().max(2000).default(""),
  orderIndex: z.coerce.number().int().default(0),
});

export const learningTopicSchema = learningTopicInputSchema.extend({
  _id: z.string().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const learningAssessmentInputSchema = z.object({
  courseId: z.string(),
  projectId: z.string(),
  title: z.string().min(1).max(300).catch(""),
  description: z.string().max(2000).default(""),
  assessmentType: z.enum(["exam", "zalik", "midterm", "test", "colloquium", "seminar", "practical_work", "essay", "project", "coursework", "lab_work", "notes_check", "oral", "presentation", "other"]).default("test"),
  dueDate: z.string().max(32).default(""),
  completedDate: z.string().max(32).default(""),
  maxScore: z.coerce.number().min(0).default(100),
  achievedScore: z.number().nullable().default(null),
  weight: z.coerce.number().min(0).max(100).default(10),
  status: z.enum(["upcoming", "in_progress", "completed", "missed", "retake_needed", "passed_retake"]).default("upcoming"),
  notes: z.string().max(2000).default(""),
  feedback: z.string().max(2000).default(""),
  linkedTopicIds: z.array(z.string()).default([]),
  linkedModuleIds: z.array(z.string()).default([]),
});

export const learningAssessmentSchema = learningAssessmentInputSchema.extend({
  _id: z.string().optional(),
  createdBy: z.string().default(""),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const learningSessionInputSchema = z.object({
  courseId: z.string(),
  projectId: z.string(),
  topicId: z.string(),
  moduleId: z.string(),
  title: z.string().min(1).max(300).catch(""),
  sessionType: z.enum(["lecture", "seminar", "practical", "lab", "self_study", "consultation"]).default("lecture"),
  date: z.string().max(32),
  startTime: z.string().max(10),
  endTime: z.string().max(10),
  durationHours: z.coerce.number().min(0).default(1.5),
  cancellationReason: z.string().optional(),
  originalDate: z.string().optional(),
  recurringGroupId: z.string().optional(),
  attendance: z.enum(["present", "absent", "excused", "late"]).nullable().default(null),
  grade: z.number().nullable().default(null),
  notes: z.string().max(2000).default(""),
  location: z.string().max(200).default(""),
  status: z.enum(["active", "cancelled", "rescheduled", "makeup", "completed"]).default("active"),
});

export const learningSessionSchema = learningSessionInputSchema.extend({
  _id: z.string().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const learningAssignmentInputSchema = z.object({
  courseId: z.string(),
  projectId: z.string(),
  title: z.string().min(1).max(300).catch(""),
  description: z.string().max(2000).default(""),
  assignmentType: z.string().default("homework"),
  dueDate: z.string().max(32),
  submittedDate: z.string().max(32).default(""),
  maxScore: z.coerce.number().min(0).default(100),
  achievedScore: z.number().nullable().default(null),
  status: z.enum(["assigned", "in_progress", "submitted", "graded", "late", "missing"]).default("assigned"),
  notes: z.string().max(2000).default(""),
  feedback: z.string().max(2000).default(""),
  sessionId: z.string().optional(),
  topicId: z.string().optional(),
  moduleId: z.string().optional(),
});

export const learningAssignmentSchema = learningAssignmentInputSchema.extend({
  _id: z.string().optional(),
  createdBy: z.string().default(""),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

// --- Course Members (Електронний деканат: учасники курсу) ---
export const courseMemberInputSchema = z.object({
  courseId: z.string(),
  projectId: z.string(),
  // userId — внутрішній user._id, якщо є; для зовнішнього студента може бути порожнім.
  userId: z.string().default(""),
  // Дублюємо name/email щоб журнал працював навіть для зовнішніх студентів.
  fullName: z.string().min(1).max(300).catch(""),
  email: z.string().max(240).default(""),
  studentId: z.string().max(40).default(""), // номер залікової книжки / груповий ID
  group: z.string().max(80).default(""),     // навчальна група
  role: z.enum(["student", "auditor", "ta", "guest"]).default("student"),
  status: z.enum(["enrolled", "withdrawn", "completed", "failed"]).default("enrolled"),
  enrolledAt: z.string().max(32).default(""),
  notes: z.string().max(2000).default(""),
});

export const courseMemberSchema = courseMemberInputSchema.extend({
  _id: z.string().optional(),
  createdBy: z.string().default(""),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

// --- Attendance (Відвідуваність: session × student → status + grade) ---
export const attendanceRecordInputSchema = z.object({
  sessionId: z.string(),
  courseId: z.string(),
  projectId: z.string(),
  memberId: z.string(),     // _id з courseMembers
  status: z.enum(["present", "absent", "excused", "late", "online"]).default("present"),
  grade: z.number().nullable().default(null),
  notes: z.string().max(500).default(""),
});

export const attendanceRecordSchema = attendanceRecordInputSchema.extend({
  _id: z.string().optional(),
  createdBy: z.string().default(""),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

// --- Institutions (Навчальні заклади: ЗВО, інститути, академії) ---
export const institutionTypes = [
  "university",   // Університет
  "institute",    // Інститут
  "academy",      // Академія
  "college",      // Коледж
  "school",       // Школа / гімназія
  "research",     // Науково-дослідна установа
  "other",
] as const;

export const institutionInputSchema = z.object({
  name:        z.string().min(2).max(300),
  shortName:   z.string().max(40).default(""),
  type:        z.enum(institutionTypes).default("university"),
  email:       z.string().email().max(240).default(""),  // optional for community stubs
  phone:       z.string().max(40).default(""),
  country:     z.string().max(80).default(""),
  city:        z.string().max(120).default(""),
  website:     z.string().max(240).default(""),
  description: z.string().max(2000).default(""),
  logoUrl:     z.string().max(500).default(""),
  accreditation: z.string().max(500).default(""),
  contactName: z.string().max(200).default(""),
  contactPhone: z.string().max(20).default(""),
});

export const institutionSchema = institutionInputSchema.extend({
  _id: z.string().optional(),
  ownerId: z.string().default(""),   // user._id (creator/admin); empty for community stubs
  isVerified: z.boolean().default(false),
  verifiedAt: z.coerce.date().nullable().default(null),
  isCommunityCreated: z.boolean().default(false), // true = stub auto-created from user affiliation
  // Soft delete
  deletedAt: z.coerce.date().nullable().default(null),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

/**
 * Реєстраційна форма Institution: одночасно створюється:
 *  - sам Institution
 *  - admin User з accountType="institution" і linked institutionId
 */
export const registerInstitutionInputSchema = z.object({
  // Institution data
  institutionName: z.string().min(2).max(300),
  institutionType: z.enum(institutionTypes).default("university"),
  institutionShortName: z.string().max(40).default(""),
  institutionCountry: z.string().max(80).default(""),
  institutionCity: z.string().max(120).default(""),
  institutionWebsite: z.string().max(240).default(""),
  institutionDescription: z.string().max(2000).default(""),
  // Admin/contact user
  email: z.string().email().max(240),
  password: z.string().min(8).max(100),
  contactName: z.string().min(2).max(200),          // ПІБ контактної особи
  contactPhone: z.string().max(20).default(""),
  // Згода
  termsAccepted: z.coerce.boolean(),
});

// --- Institution structure ---
// ЗВО: Факультет → Кафедра → Лабораторія/Центр
// НАН-інститут: Відділ → Лабораторія/Сектор → Група
export const institutionUnitTypes = [
  "faculty",      // Факультет (ЗВО)
  "institute",    // Інститут у складі університету
  "department",   // Кафедра (ЗВО)
  "division",     // Відділ (наукові установи НАН та ін.)
  "lab",          // Лабораторія
  "sector",       // Сектор (підрозділ відділу або кафедри)
  "group",        // Наукова / навчальна група
  "center",       // Центр (навчально-науковий, ресурсний)
  "council",      // Рада (вчена рада, спеціалізована рада)
  "office",       // Адміністративний підрозділ (деканат, канцелярія)
  "other",
] as const;

export const institutionUnitInputSchema = z.object({
  institutionId: z.string(),
  parentId: z.string().default(""),       // "" — кореневий
  type: z.enum(institutionUnitTypes).default("faculty"),
  name: z.string().min(1).max(300),
  shortName: z.string().max(40).default(""),
  head: z.string().max(200).default(""),         // ПІБ керівника
  headEmail: z.string().max(240).default(""),
  description: z.string().max(2000).default(""),
  orderIndex: z.number().int().default(0),
});

export const institutionUnitSchema = institutionUnitInputSchema.extend({
  _id: z.string().optional(),
  isCommunityCreated: z.boolean().default(false),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

// --- Institution members (викладачі, staff) ---
export const staffCategories = ["leadership", "teaching", "research", "admin", "other"] as const;
export type StaffCategory = (typeof staffCategories)[number];

export const institutionMemberRoles = [
  "rector",       // Ректор
  "vice_rector",  // Проректор
  "dean",         // Декан
  "vice_dean",    // Заступник декана
  "head",         // Завідувач кафедри
  "professor",    // Професор
  "associate",    // Доцент
  "lecturer",     // Викладач
  "assistant",    // Асистент
  "researcher",   // Науковий співробітник
  "staff",        // Допоміжний персонал
  "admin",        // Адмін системи
] as const;

export const institutionMemberInputSchema = z.object({
  institutionId: z.string(),
  unitId: z.string().default(""),         // підрозділ (опц. — staff може бути без кафедри)
  userId: z.string().default(""),         // внутрішній user._id якщо є
  fullName: z.string().min(1).max(300),
  email: z.string().max(240).default(""),
  phone: z.string().max(100).default(""),
  role: z.enum(institutionMemberRoles).default("lecturer"),
  title: z.string().max(200).default(""),       // звання: к.б.н., д-р мед. наук
  position: z.string().max(200).default(""),    // повна посада
  orcid: z.string().max(40).default(""),
  isActive: z.boolean().default(true),
  hiredAt: z.string().max(32).default(""),
  staffCategory: z.enum(staffCategories).default("other"),
});

export const inviteStatuses = ["none", "pending", "accepted", "expired"] as const;

export const institutionMemberSchema = institutionMemberInputSchema.extend({
  _id: z.string().optional(),
  // Invite flow: коли admin надсилає запрошення — зберігається токен і статус.
  inviteStatus: z.enum(inviteStatuses).default("none"),
  inviteToken: z.string().default(""),
  inviteTokenExpires: z.coerce.date().nullable().default(null),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type InviteStatus = (typeof inviteStatuses)[number];

// --- Institution academic program (Освітня програма) ---
export const programLevels = ["bachelor", "master", "phd", "post_doc", "certificate", "other"] as const;

export const institutionProgramInputSchema = z.object({
  institutionId: z.string(),
  unitId: z.string().default(""),         // факультет/інститут
  code: z.string().max(40).default(""),
  title: z.string().min(1).max(300),
  specialty: z.string().max(200).default(""),   // спеціальність / код напряму (091, 222…)
  level: z.enum(programLevels).default("bachelor"),
  academicYear: z.string().max(20).default(""),  // "2024-2025"; порожньо = поточна
  durationYears: z.coerce.number().min(0).max(10).default(4),
  language: z.string().max(40).default("uk"),
  ects: z.coerce.number().min(0).default(240),
  description: z.string().max(3000).default(""),
  isActive: z.boolean().default(true),
});

export const institutionProgramSchema = institutionProgramInputSchema.extend({
  _id: z.string().optional(),
  isCommunityCreated: z.boolean().default(false),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

// --- Institution course (каталог курсів, шаблон) ---
export const institutionCourseInputSchema = z.object({
  institutionId: z.string(),
  programId: z.string().default(""),
  unitId: z.string().default(""),
  code: z.string().max(40).default(""),
  title: z.string().min(1).max(300),
  description: z.string().max(2000).default(""),
  ects: z.coerce.number().min(0).max(60).default(3),
  hoursTotal: z.coerce.number().min(0).default(0),
  semester: z.coerce.number().int().min(1).max(12).default(1),
  year: z.coerce.number().int().min(1).max(10).default(1),
  courseType: z.enum(["mandatory", "elective", "optional", "language", "physical", "practice", "research"]).default("mandatory"),
  language: z.string().max(40).default("uk"),
  instructorMemberId: z.string().default(""),   // institution member
  isActive: z.boolean().default(true),
});

export const institutionCourseSchema = institutionCourseInputSchema.extend({
  _id: z.string().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

// --- Institution administration (leadership/директорат) ---
export const institutionAdminInputSchema = z.object({
  institutionId: z.string(),
  position: z.string().min(1).max(200),        // "Директор інституту"
  fullName: z.string().min(1).max(300),
  title: z.string().max(300).default(""),       // "академік НАН України, д.б.н."
  phone: z.string().max(100).default(""),
  email: z.string().max(200).default(""),
  orderIndex: z.coerce.number().int().default(0),
});

export const institutionAdminSchema = institutionAdminInputSchema.extend({
  _id: z.string().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type InstitutionAdmin = z.infer<typeof institutionAdminSchema>;
export type InstitutionAdminInput = z.infer<typeof institutionAdminInputSchema>;

// --- PhD Plan ---
export const phdMilestoneSchema = z.object({
  mid: z.string().min(1).max(40).catch(""),
  title: z.string().min(1).max(300).catch(""),
  period: z.string().max(120).default(""),
  orderIndex: z.number().int().default(0),
});

export const phdCurriculumCourseSchema = z.object({
  cid: z.string().min(1).max(40).catch(""),
  title: z.string().min(1).max(300).catch(""),
  credits: z.coerce.number().min(0.5).max(30).default(3),
  cycle: z.enum(["general", "specialty_practice", "specialty_professional"]).catch("general").default("general"),
  subgroup: z.enum(["mandatory", "elective"]).catch("mandatory").default("mandatory"),
  controlForm: z.string().max(100).default(""),
  studyYear: z.number().int().min(1).max(4).default(1),
  credited: z.coerce.boolean().default(false),
  learningCourseId: z.string().max(80).default(""),
});

export const phdYearlyCourseSchema = z.object({
  ycid: z.string().min(1).max(40).catch(""),
  title: z.string().min(1).max(300).catch(""),
  controlForm: z.string().max(100).default(""),
  period: z.string().max(120).default(""),
  grade: z.string().max(100).default(""),
  teacherName: z.string().max(200).default(""),
  cycle: z.enum(["general", "specialty_practice", "specialty_professional"]).catch("general").default("general"),
  subgroup: z.enum(["mandatory", "elective"]).catch("mandatory").default("mandatory"),
  termType: z.enum(["sem1", "sem2", "academic_year"]).catch(undefined as any).optional(),
});

export const phdYearlyScientificItemSchema = z.object({
  wsid: z.string().min(1).max(40).catch(""),
  title: z.string().min(1).max(300).catch(""),
  content: z.string().max(2000).default(""),
  period: z.string().max(120).default(""),
  status: z.enum(["pending", "completed", "not_completed", "partial"]).default("pending"),
  supervisorNote: z.string().max(1000).default(""),
  orderIndex: z.number().int().default(0),
  termType: z.enum(["sem1", "sem2", "academic_year"]).catch(undefined as any).optional(),
});

export const phdYearlyPlanSchema = z.object({
  year: z.number().int().min(1).max(4),
  educationalCourses: z.array(phdYearlyCourseSchema).default([]),
  scientificWorkItems: z.array(phdYearlyScientificItemSchema).default([]),
  headOfDeptName: z.string().max(200).default(""),
  headOfDeptDate: z.string().max(32).default(""),
  supervisorAssessment: z.string().max(2000).default(""),
  committeeDecision: z.string().max(2000).default(""),
  committeeChair: z.string().max(200).default(""),
  committeeDate: z.string().max(32).default(""),
  sem1Start: z.string().max(32).default(""),
  sem1End: z.string().max(32).default(""),
  sem2Start: z.string().max(32).default(""),
  sem2End: z.string().max(32).default(""),
});

export const phdPlanSchema = z.object({
  _id: z.string().optional(),
  projectId: z.string().min(1),
  studentName: z.string().max(300).default(""),
  specialty: z.string().max(200).default(""),
  studyForm: z.enum(["full_time", "part_time"]).default("full_time"),
  totalCredits: z.coerce.number().default(60),
  enrollmentDate: z.string().max(32).default(""),
  enrollmentOrderDate: z.string().max(32).default(""),
  enrollmentOrderNumber: z.string().max(40).default(""),
  supervisor: z.string().max(200).default(""),
  supervisorTitle: z.string().max(300).default(""),
  institution: z.string().max(300).default(""),
  department: z.string().max(300).default(""),
  dissertationTitle: z.string().max(1000).default(""),
  dissertationApprovalDate: z.string().max(32).default(""),
  dissertationApprovalProtocol: z.string().max(100).default(""),
  justification: z.string().max(5000).default(""),
  curriculumCourses: z.array(phdCurriculumCourseSchema).default([]),
  milestones: z.array(phdMilestoneSchema).default([]),
  yearlyPlans: z.array(phdYearlyPlanSchema).default([]),
  createdBy: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const phdPlanMetaSchema = phdPlanSchema.pick({
  projectId: true, studentName: true, specialty: true, studyForm: true, totalCredits: true, 
  enrollmentDate: true, enrollmentOrderDate: true, enrollmentOrderNumber: true, 
  supervisor: true, supervisorTitle: true, institution: true, department: true, 
  dissertationTitle: true, dissertationApprovalDate: true, dissertationApprovalProtocol: true, 
  justification: true
});

// --- Manuscripts ---
export const manuscriptBlockSchema = z.object({
  id: z.string(),
  type: z.enum(["paragraph", "h1", "h2", "h3", "list_item", "image", "table", "divider", "quote", "figure", "code", "math"]),
  content: z.string(),
  metadata: z.record(z.string(), z.any()).optional(),
  meta: z.record(z.string(), z.string()).optional(),
});

export const manuscriptAuthorSchema = z.object({
  name: z.string(),
  affiliation: z.string().default(""),
  role: z.enum(["first", "co", "corresponding", "contributing"]).default("co"),
  userId: z.string().optional(),
});

export const dissertationMetaSchema = z.object({
  degree: z.string().default("candidate"),
  specialtyCode: z.string().default(""),
  specialty: z.string().default(""),
  institution: z.string().default(""),
  defenseInstitution: z.string().default(""),
  supervisor: z.string().default(""),
  supervisorTitle: z.string().default(""),
  udc: z.string().default(""),
  city: z.string().default(""),
  year: z.number().int().optional(),
});

export const manuscriptSchema = z.object({
  _id: z.string().optional(),
  projectId: z.string(),
  title: z.string().min(1).max(500).catch(""),
  type: z.enum(["article", "thesis", "dissertation", "monograph", "guide", "other"]),
  abstract: z.string().max(5000).default(""),
  keywords: z.array(z.string().max(100)).default([]),
  authors: z.array(manuscriptAuthorSchema).default([]),
  journal: z.string().max(300).default(""),
  doi: z.string().max(100).default(""),
  blocks: z.array(manuscriptBlockSchema).default([]),
  status: z.enum(["draft", "review", "submitted", "revision", "published"]).default("draft"),
  dissertationMeta: dissertationMetaSchema.optional(),
  attachedRecordIds: z.array(z.string()).default([]),
  attachedExperimentIds: z.array(z.string()).default([]),
  note: z.string().max(2000).default(""),
  createdBy: z.string().default(""),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const manuscriptInputSchema = manuscriptSchema.omit({ _id: true, createdAt: true, updatedAt: true });

// --- Other entities (Existing) ---

export const diaryEntryTypes = ["note", "meeting", "application", "info_received", "request_received", "task_done", "event"] as const;
export const diaryEntrySchema = z.object({
  _id: z.string().optional(),
  projectId: z.string(),
  userId: z.string(),
  title: z.string().min(1).max(200).catch(""),
  body: z.string().min(1).max(10000).catch(""),
  type: z.enum(diaryEntryTypes).default("note"),
  date: z.string().max(32),
  tags: z.array(z.string().max(40)).default([]),
  person: z.string().optional(),
  place: z.string().optional(),
  outcome: z.string().optional(),
  recipient: z.string().optional(),
  docRef: z.string().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const diaryEntryInputSchema = diaryEntrySchema.omit({ _id: true, createdAt: true, updatedAt: true });

// --- Laboratory Specific Entities (Foundation) ---

export const labInventoryCategories = ["reagent", "consumable", "sample", "standard", "other"] as const;
export const labInventoryStatuses = ["in_stock", "low_stock", "depleted", "expired"] as const;
export const labHazardClasses = ["none", "flammable", "toxic", "corrosive", "biohazard", "radioactive", "oxidizing"] as const;

export const labInventoryItemInputSchema = z.object({
  projectId: z.string().min(1).max(120),
  name: z.string().min(1).max(300),
  casNumber: z.string().max(40).default(""),
  catalogNumber: z.string().max(80).default(""),
  manufacturer: z.string().max(200).default(""),
  category: z.enum(labInventoryCategories).default("reagent"),
  quantity: z.coerce.number().min(0).default(0),
  unit: z.string().max(20).default("units"),
  location: z.string().max(400).default(""),
  storageConditions: z.string().max(400).default(""),
  expirationDate: z.string().max(32).default(""),
  lotNumber: z.string().max(80).default(""),
  hazardClass: z.enum(labHazardClasses).default("none"),
  notes: z.string().max(2000).default(""),
  sdsUrl: z.string().max(2000).default(""),
  sdsFirstAid: z.string().max(2000).default(""),
  sdsDisposal: z.string().max(2000).default(""),
});

export const labInventoryItemSchema = labInventoryItemInputSchema.extend({
  _id: z.string().optional(),
  status: z.enum(labInventoryStatuses).default("in_stock"),
  createdBy: z.string().default(""),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const labEquipmentStatuses = ["operational", "maintenance", "out_of_order", "decommissioned"] as const;

export const labEquipmentInputSchema = z.object({
  projectId: z.string().min(1).max(120),
  name: z.string().min(1).max(300),
  manufacturer: z.string().max(200).default(""),
  model: z.string().max(200).default(""),
  serialNumber: z.string().max(100).default(""),
  location: z.string().max(400).default(""),
  description: z.string().max(2000).default(""),
  nextCalibrationDate: z.string().max(32).default(""),
  responsiblePersonId: z.string().max(120).default(""),
});

export const labEquipmentSchema = labEquipmentInputSchema.extend({
  _id: z.string().optional(),
  status: z.enum(labEquipmentStatuses).default("operational"),
  createdBy: z.string().default(""),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const equipmentLogTypes = ["usage", "maintenance", "calibration", "failure_report"] as const;

export const equipmentLogInputSchema = z.object({
  equipmentId: z.string().min(1).max(120),
  projectId: z.string().min(1).max(120),
  type: z.enum(equipmentLogTypes).default("usage"),
  startTime: z.coerce.date().optional(),
  endTime: z.coerce.date().optional(),
  durationMinutes: z.coerce.number().int().min(0).default(0),
  description: z.string().max(2000).default(""),
  issuesNoted: z.string().max(1000).default(""),
  protocolReference: z.string().max(200).default(""),
});

export const equipmentLogSchema = equipmentLogInputSchema.extend({
  _id: z.string().optional(),
  userId: z.string(),
  createdAt: z.coerce.date(),
});

export const budgetLineItemSchema = z.object({
  _id: z.string().optional(),
  projectId: z.string(),
  periodId: z.string(),
  category: z.enum(budgetCategories),
  title: z.string(),
  name: z.string().optional(),
  description: z.string().default(""),
  url: z.string().optional(),
  quantity: z.number().default(0),
  unit: z.string().default(""),
  unitPrice: z.number().default(0),
  plannedAmount: z.number(),
  spentAmount: z.number().default(0),
  currency: z.string().default("UAH"),
  vendor: z.string().default(""),
  notes: z.string().default(""),
  createdBy: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const budgetPeriodSchema = z.object({
  _id: z.string().optional(),
  projectId: z.string(),
  title: z.string(),
  label: z.string().optional(),
  status: z.enum(["active", "closed"]).default("active"),
  startDate: z.string(),
  endDate: z.string(),
  createdBy: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const purchaseRequestStatusOptions = ["draft", "pending", "submitted", "approved", "purchased", "delivered", "rejected"] as const;
export const purchaseRequestStatuses = purchaseRequestStatusOptions;

export const purchaseRequestSchema = z.object({
  _id: z.string().optional(),
  projectId: z.string(),
  lineItemId: z.string(),
  linkedLineItemId: z.string().optional(),
  linkedPeriodId: z.string().optional(),
  requesterId: z.string(),
  title: z.string(),
  category: z.enum(budgetCategories).optional(),
  amount: z.number(),
  estimatedAmount: z.number().optional(),
  actualAmount: z.number().optional(),
  status: z.enum(purchaseRequestStatusOptions).default("pending"),
  description: z.string().default(""),
  justification: z.string().optional(),
  reviewNote: z.string().optional(),
  vendor: z.string().default(""),
  currency: z.string().default("UAH"),
  attachments: z.array(z.string()).default([]),
  documents: z.array(z.object({
    name: z.string(),
    storageUri: z.string(),
    mimeType: z.string().optional(),
    bytes: z.number().optional(),
  })).default([]),
  purchasedAt: z.coerce.date().nullable().optional(),
  reviewedBy: z.string().optional(),
  reviewedAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().default(() => new Date()),
  createdAt: z.coerce.date().default(() => new Date()),
});

export const projectInvitationSchema = z.object({
  _id: z.string().optional(),
  projectId: z.string(),
  email: z.string().email(),
  role: z.enum(["member", "supervisor"]),
  token: z.string(),
  code: z.string().optional(),
  status: z.string().optional(),
  createdBy: z.string().optional(),
  expiresAt: z.coerce.date(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

const rawDataFileSchema = z.object({
  name: z.string(),
  storageUri: z.string(),
  size: z.number().optional(),
  bytes: z.number().optional(),
  mimeType: z.string().optional(),
  uploadedAt: z.coerce.date().optional(),
});

const creatorSchema = z.object({
  name: z.string(),
  affiliation: z.string().default(""),
  orcid: z.string().default(""),
});

export const projectRecordSchema = z.object({
  _id: z.string().optional(),
  projectId: z.string(),
  title: z.string(),
  kind: z.string(),
  access: z.string(),
  localId: z.string().default(""),
  summary: z.string().default(""),
  owner: z.string().default(""),
  license: z.string().default(""),
  doi: z.string().default(""),
  usageNotes: z.string().default(""),
  keywords: z.string().default(""),
  tags: z.array(z.string()).default([]),
  language: z.string().default(""),
  repository: z.string().default(""),
  subjects: z.array(z.string()).default([]),
  notes: z.string().default(""),
  dataFormat: z.string().default(""),
  fundingGrant: z.string().default(""),
  creators: z.array(creatorSchema).default([]),
  stage: z.string().default(""),
  variantLabel: z.string().default(""),
  group: z.string().default(""),
  rootRecordId: z.string().optional(),
  relatedIds: z.array(z.string()).default([]),
  linkedPublicationIds: z.array(z.string()).default([]),
  embargoDate: z.string().optional(),
  dateCollectedFrom: z.string().optional(),
  dateCollectedTo: z.string().optional(),
  typedData: z.record(z.string(), z.unknown()).optional(),
  files: z.array(z.string()).default([]),
  rawDataFiles: z.array(rawDataFileSchema).default([]),
  processingStatus: z.string().default("new"),
  version: z.string().default(""),
  versionNote: z.string().default(""),
  parentVersionId: z.string().optional(),
  processingHistory: z.array(z.object({
    status: z.string(),
    changedAt: z.coerce.date(),
    changedBy: z.string().optional(),
    note: z.string().optional(),
  })).default([]),
  status: z.enum(["planned", "active", "review", "released", "blocked"]).default("planned"),
  createdBy: z.string().default(""),
  archivedAt: z.coerce.date().optional(),
  zenodoDepositionId: z.string().optional(),
  zenodoRecordId: z.string().optional(),
  zenodoConceptDoi: z.string().default(""),
  zenodoDoi: z.string().default(""),
  zenodoUrl: z.string().default(""),
  zenodoDraftUrl: z.string().default(""),
  zenodoState: z.string().default(""),
  zenodoSubmitted: z.boolean().default(false),
  zenodoFileCount: z.number().default(0),
  zenodoFilesSyncedAt: z.coerce.date().nullable().optional(),
  zenodoPublishedAt: z.coerce.date().nullable().optional(),
  zenodoSyncedAt: z.coerce.date().nullable().optional(),
  zenodoSyncError: z.string().default(""),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const projectRecordInputSchema = projectRecordSchema.omit({ _id: true, createdAt: true, updatedAt: true });

export const researchEventSchema = z.object({
  _id: z.string().optional(),
  projectId: z.string(),
  title: z.string(),
  description: z.string().default(""),
  date: z.string().default(""),
  startDate: z.string().default(""),
  endDate: z.string().default(""),
  status: z.enum(["planned", "confirmed", "attended", "cancelled"]).default("planned"),
  priority: z.string().default("medium"),
  type: z.enum(["conference", "workshop", "symposium", "seminar", "summer_school", "competition", "exhibition", "hackathon", "other"]).default("conference"),
  format: z.enum(["in_person", "online", "hybrid"]).default("in_person"),
  location: z.string().default(""),
  url: z.string().optional(),
  organizingEmail: z.string().optional(),
  registrationFormUrl: z.string().optional(),
  sections: z.string().default(""),
  languages: z.string().default(""),
  abstractDeadline: z.string().optional(),
  fullPaperDeadline: z.string().optional(),
  registrationDeadline: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const eventParticipationSchema = z.object({
  _id: z.string().optional(),
  eventId: z.string().catch(""),
  projectId: z.string().optional(),
  userId: z.string().catch(""),
  participantId: z.string().optional(),
  participantName: z.string().default(""),
  affiliation: z.string().optional(),
  section: z.string().optional(),
  contributionTitle: z.string().optional(),
  contributionType: z.enum(["oral", "poster", "keynote", "panel", "demo", "workshop_talk"]).optional(),
  role: z.enum(["presenter", "poster_presenter", "attendee", "organizer", "chair", "volunteer"]).default("attendee"),
  status: z.enum(["planned", "abstract_submitted", "accepted", "rejected", "attended", "cancelled"]).default("planned"),
  contributions: z.array(z.unknown()).default([]),
  submissions: z.array(z.object({
    sid: z.string(),
    title: z.string().default(""),
    type: z.enum(["abstract", "full_paper", "poster", "slides", "video", "registration", "visa_docs", "other"]).default("abstract"),
    status: z.enum(["draft", "submitted", "accepted", "rejected", "revision_required", "withdrawn"]).default("draft"),
    coAuthors: z.string().optional(),
    section: z.string().optional(),
    deadline: z.string().optional(),
    submittedAt: z.string().optional(),
    revisionDeadline: z.string().optional(),
    revisionNotes: z.string().optional(),
  })).default([]),
  notes: z.string().default(""),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const researchPublicationSchema = z.object({
  _id: z.string().optional(),
  projectId: z.string(),
  title: z.string(),
  authors: z.string().optional(),
  doi: z.string().optional(),
  url: z.string().optional(),
  note: z.string().optional(),
  journal: z.string().optional(),
  stageId: z.string().optional(),
  expectedYear: z.coerce.number().nullable().optional(),
  status: z.enum(["planned", "submitted", "under_review", "accepted", "published", "rejected"]).default("planned"),
  type: z.string().default("article"),
  createdBy: z.string().default(""),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const researchDeliverableSchema = z.object({
  _id: z.string().optional(),
  projectId: z.string(),
  stageId: z.string().optional(),
  title: z.string(),
  description: z.string().default(""),
  plannedDate: z.string().default(""),
  actualDate: z.string().optional(),
  status: z.string().default("planned"),
  type: z.string().default("other"),
  link: z.string().optional(),
  note: z.string().optional(),
  completedAt: z.coerce.date().nullable().optional(),
  createdBy: z.string().default(""),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const portfolioPublicationTypes = ["journal_indexed", "journal_other", "conference_proceedings", "monograph", "patent", "other"] as const;
export type PortfolioPublicationType = (typeof portfolioPublicationTypes)[number];

export const portfolioPublicationSchema = z.object({
  _id: z.string().optional(),
  pubid: z.string().default(""),
  pubType: z.enum(portfolioPublicationTypes).default("journal_indexed"),
  title: z.string().default(""),
  authors: z.string().default(""),
  journal: z.string().default(""),
  year: z.number().nullable().optional(),
  volume: z.string().optional(),
  issue: z.string().optional(),
  pages: z.string().optional(),
  doi: z.string().optional(),
  url: z.string().optional(),
  orderIndex: z.number().default(0),
});

export const portfolioConferenceSchema = z.object({
  _id: z.string().optional(),
  confid: z.string().default(""),
  title: z.string().default(""),
  conference: z.string().default(""),
  name: z.string().default(""),
  organizer: z.string().default(""),
  location: z.string().default(""),
  dateStart: z.string().default(""),
  dateEnd: z.string().default(""),
  thesisTitle: z.string().default(""),
  authors: z.string().default(""),
  award: z.string().default(""),
  isCompetition: z.boolean().default(false),
  competitionPlace: z.string().default(""),
  competitionNomination: z.string().default(""),
  city: z.string().default(""),
  country: z.string().default(""),
  year: z.number().nullable().optional(),
  type: z.string().default(""),
  url: z.string().optional(),
  orderIndex: z.number().default(0),
});

export const portfolioAwardSchema = z.object({
  _id: z.string().optional(),
  awardid: z.string().default(""),
  awid: z.string().default(""),
  title: z.string().default(""),
  organization: z.string().default(""),
  year: z.number().nullable().optional(),
  date: z.string().optional(),
  issuer: z.string().optional(),
  url: z.string().optional(),
  description: z.string().default(""),
  orderIndex: z.number().default(0),
});

export const portfolioSchema = z.object({
  _id: z.string().optional(),
  userId: z.string().default(""),
  projectId: z.string().optional(),
  createdBy: z.string().optional(),
  fullName: z.string().default(""),
  firstNameLatin: z.string().default(""),
  lastNameLatin: z.string().default(""),
  orcid: z.string().default(""),
  position: z.string().default(""),
  institution: z.string().default(""),
  department: z.string().default(""),
  bio: z.string().default(""),
  email: z.string().default(""),
  phone: z.string().default(""),
  website: z.string().default(""),
  researchInterests: z.string().default(""),
  educationLevel: z.string().default(""),
  specialty: z.string().default(""),
  educationalProgram: z.string().default(""),
  studyPeriodStart: z.string().default(""),
  studyPeriodEnd: z.string().default(""),
  supervisor: z.string().default(""),
  supervisorTitle: z.string().default(""),
  dissertationTopic: z.string().default(""),
  publications: z.array(portfolioPublicationSchema).default([]),
  conferences: z.array(portfolioConferenceSchema).default([]),
  awards: z.array(portfolioAwardSchema).default([]),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const reportSchema = z.object({
  _id: z.string().optional(),
  projectId: z.string(),
  title: z.string(),
  status: z.enum(["draft", "ready", "submitted", "approved"]).default("draft"),
  type: z.enum(["intermediate", "annual", "final", "financial", "conference", "custom"]).default("custom"),
  period: z.string().optional(),
  sectionGoals: z.string().default(""),
  sectionTimeline: z.string().default(""),
  sectionResults: z.string().default(""),
  sectionPublications: z.string().default(""),
  sectionFinancial: z.string().default(""),
  sectionProblems: z.string().default(""),
  sectionPlans: z.string().default(""),
  linkedStageIds: z.array(z.string()).default([]),
  note: z.string().default(""),
  sectionMeta: z.string().default(""),
  submittedAt: z.coerce.date().nullable().optional(),
  approvedAt: z.coerce.date().nullable().optional(),
  createdBy: z.string().default(""),
  createdAt: z.coerce.date().default(() => new Date()),
  updatedAt: z.coerce.date().default(() => new Date()),
});

export const experimentStatuses = ["planned", "running", "completed", "failed", "on_hold"] as const;
export const experimentPriorities = ["low", "medium", "high", "urgent"] as const;
export const experimentTypes = ["in_silico", "in_vitro", "in_vivo", "clinical", "other"] as const;

export const experimentSchema = z.object({
  _id: z.string().optional(),
  projectId: z.string(),
  title: z.string(),
  status: z.enum(experimentStatuses).default("planned"),
  priority: z.enum(experimentPriorities).default("medium"),
  type: z.enum(experimentTypes).default("other"),
  stageId: z.string().optional(),
  linkedMethodologyId: z.string().optional(),
  linkedRecordIds: z.array(z.string()).default([]),
  outputRecordIds: z.array(z.string()).default([]),
  replicates: z.number().optional(),
  controls: z.string().default(""),
  hypothesis: z.string().default(""),
  objectives: z.string().default(""),
  variables: z.string().default(""),
  methods: z.string().default(""),
  results: z.string().default(""),
  conclusion: z.string().default(""),
  notes: z.string().default(""),
  startDate: z.string().default(""),
  endDate: z.string().default(""),
  createdBy: z.string().default(""),
  createdAt: z.coerce.date().default(() => new Date()),
  updatedAt: z.coerce.date().default(() => new Date()),
});

export const openScienceCategories = ["data_repository", "updates", "news", "conferences", "publications", "protocols", "outreach", "other"] as const;

export const openScienceUpdateSchema = z.object({
  _id: z.string().optional(),
  projectId: z.string(),
  title: z.string(),
  status: z.enum(["draft", "published"]).default("draft"),
  category: z.enum(openScienceCategories).default("other"),
  summary: z.string().optional(),
  content: z.string().optional(),
  publicUrl: z.string().optional(),
  license: z.string().optional(),
  accessibilityNotes: z.string().optional(),
  linkedRecordIds: z.array(z.string()).default([]),
  createdBy: z.string().default(""),
  publishedAt: z.coerce.date().nullable().optional(),
  createdAt: z.coerce.date().default(() => new Date()),
  updatedAt: z.coerce.date().default(() => new Date()),
});

export type SafeUser = z.infer<typeof safeUserSchema>;
export type User = z.infer<typeof userSchema>;
export type UserRole = "admin" | "supervisor" | "member" | "user";
export type RegisterInput = z.infer<typeof registerInputSchema>;
export type ProfileInput = z.infer<typeof profileInputSchema>;

export type Project = z.infer<typeof projectSchema>;
export type ProjectInput = z.infer<typeof projectInputSchema>;
export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type TeamMessage = z.infer<typeof teamMessageSchema>;
export type TeamMessageInput = Omit<TeamMessage, "_id" | "createdAt">;
export type TeamMessageLabel = "urgent" | "question" | "decision" | "info" | "note";
export type AuditEvent = z.infer<typeof auditEventSchema>;
export type AuditAction = string;

export type LabCategory = (typeof labCategories)[number];
export type LabSafetyLevel = (typeof labSafetyLevels)[number];
export type LabAccessPolicy = (typeof labAccessPolicies)[number];

export type LabInventoryCategory = (typeof labInventoryCategories)[number];
export type LabInventoryStatus = (typeof labInventoryStatuses)[number];
export type LabHazardClass = (typeof labHazardClasses)[number];
export type LabInventoryItemInput = z.infer<typeof labInventoryItemInputSchema>;
export type LabInventoryItem = z.infer<typeof labInventoryItemSchema>;

export type LabEquipmentStatus = (typeof labEquipmentStatuses)[number];
export type LabEquipmentInput = z.infer<typeof labEquipmentInputSchema>;
export type LabEquipment = z.infer<typeof labEquipmentSchema>;

export type EquipmentLogType = (typeof equipmentLogTypes)[number];
export type EquipmentLogInput = z.infer<typeof equipmentLogInputSchema>;
export type EquipmentLog = z.infer<typeof equipmentLogSchema>;

export type TaskStatus = (typeof taskStatusOptions)[number];
export type TaskPriority = (typeof taskPriorityOptions)[number];
export type Task = z.infer<typeof taskSchema>;
export type TaskInput = z.infer<typeof taskInputSchema>;

export type Milestone = z.infer<typeof milestoneSchema>;
export type MilestoneInput = z.infer<typeof milestoneInputSchema>;

export type TimeEntry = z.infer<typeof timeEntrySchema>;
export type TimeEntryInput = z.infer<typeof timeEntryInputSchema>;

export type BudgetLineItem = z.infer<typeof budgetLineItemSchema>;
export type BudgetLineItemInput = Omit<BudgetLineItem, "_id">;
export type BudgetPeriod = z.infer<typeof budgetPeriodSchema>;
export type BudgetPeriodInput = Omit<BudgetPeriod, "_id">;
export type PurchaseRequest = z.infer<typeof purchaseRequestSchema>;
export type PurchaseRequestInput = Omit<PurchaseRequest, "_id" | "createdAt">;
export type PurchaseRequestStatus = (typeof purchaseRequestStatusOptions)[number];

export type ProjectInvitation = z.infer<typeof projectInvitationSchema>;
export type ProjectInvitationInput = Omit<ProjectInvitation, "_id">;

export type ProjectRecord = z.infer<typeof projectRecordSchema>;
export type ProjectRecordInput = z.input<typeof projectRecordInputSchema>;

export type Experiment = z.infer<typeof experimentSchema>;
export type ExperimentInput = Omit<Experiment, "_id">;
export type ExperimentStatus = (typeof experimentStatuses)[number];

export type OpenScienceUpdate = z.infer<typeof openScienceUpdateSchema>;
export type OpenScienceUpdateInput = Omit<OpenScienceUpdate, "_id">;

export type ResearchEvent = z.infer<typeof researchEventSchema>;
export type ResearchEventInput = Omit<ResearchEvent, "_id">;
export type EventParticipation = z.infer<typeof eventParticipationSchema>;
export type EventParticipationInput = Omit<EventParticipation, "_id">;
export type SubmissionItem = {
  sid: string;
  title: string;
  type: SubmissionType;
  status: SubmissionStatus;
  coAuthors?: string;
  section?: string;
  deadline?: string;
  submittedAt?: string;
  revisionDeadline?: string;
  revisionNotes?: string;
};

export type ResearchPublication = z.infer<typeof researchPublicationSchema>;
export type ResearchPublicationInput = Omit<ResearchPublication, "_id">;
export type PublicationStatus = "planned" | "submitted" | "under_review" | "accepted" | "published" | "rejected";
export type PublicationType = string;

export type ResearchDeliverable = z.infer<typeof researchDeliverableSchema>;
export type ResearchDeliverableInput = Omit<ResearchDeliverable, "_id">;
export type DeliverableStatus = string;
export type DeliverableType = string;

export type Portfolio = z.infer<typeof portfolioSchema>;
export type PortfolioMeta = any;
export type PortfolioPublication = z.infer<typeof portfolioPublicationSchema>;
export type PortfolioConference = z.infer<typeof portfolioConferenceSchema>;
export type PortfolioAward = z.infer<typeof portfolioAwardSchema>;

export type Report = z.infer<typeof reportSchema>;
export type ReportInput = Omit<Report, "_id">;
export type ReportStatus = string;

export type ResearchStage = z.infer<typeof researchStageSchema>;
export type ResearchStageInput = z.input<typeof researchStageInputSchema>;
export type ResearchStageStatus = "planned" | "active" | "completed" | "reported";

export type LearningCourse = z.infer<typeof learningCourseSchema>;
export type LearningCourseInput = z.infer<typeof learningCourseInputSchema>;
export type LearningModule = z.infer<typeof learningModuleSchema>;
export type LearningModuleInput = z.infer<typeof learningModuleInputSchema>;
export type LearningTopic = z.infer<typeof learningTopicSchema>;
export type LearningTopicInput = z.infer<typeof learningTopicInputSchema>;
export type LearningAssessment = z.infer<typeof learningAssessmentSchema>;
export type LearningAssessmentInput = z.infer<typeof learningAssessmentInputSchema>;
export type LearningSession = z.infer<typeof learningSessionSchema>;
export type LearningSessionInput = z.infer<typeof learningSessionInputSchema>;
export type LearningAssignment = z.infer<typeof learningAssignmentSchema>;
export type LearningAssignmentInput = z.infer<typeof learningAssignmentInputSchema>;

export type CourseMember = z.infer<typeof courseMemberSchema>;
export type CourseMemberInput = z.infer<typeof courseMemberInputSchema>;

export type Institution = z.infer<typeof institutionSchema>;
export type InstitutionInput = z.infer<typeof institutionInputSchema>;
export type InstitutionType = (typeof institutionTypes)[number];
export type RegisterInstitutionInput = z.infer<typeof registerInstitutionInputSchema>;

export type InstitutionUnit = z.infer<typeof institutionUnitSchema>;
export type InstitutionUnitInput = z.infer<typeof institutionUnitInputSchema>;
export type InstitutionUnitType = (typeof institutionUnitTypes)[number];

export type InstitutionMember = z.infer<typeof institutionMemberSchema>;
export type InstitutionMemberInput = z.infer<typeof institutionMemberInputSchema>;
export type InstitutionMemberRole = (typeof institutionMemberRoles)[number];

export type InstitutionProgram = z.infer<typeof institutionProgramSchema>;
export type InstitutionProgramInput = z.infer<typeof institutionProgramInputSchema>;
export type ProgramLevel = (typeof programLevels)[number];

export type InstitutionCourse = z.infer<typeof institutionCourseSchema>;
export type InstitutionCourseInput = z.infer<typeof institutionCourseInputSchema>;

export type AttendanceRecord = z.infer<typeof attendanceRecordSchema>;
export type AttendanceRecordInput = z.infer<typeof attendanceRecordInputSchema>;

export type PhdMilestone = z.infer<typeof phdMilestoneSchema>;
export type PhdCurriculumCourse = z.infer<typeof phdCurriculumCourseSchema>;
export type PhdYearlyCourse = z.infer<typeof phdYearlyCourseSchema>;
export type PhdYearlyScientificItem = z.infer<typeof phdYearlyScientificItemSchema>;
export type PhdWorkStatus = z.infer<typeof phdYearlyScientificItemSchema>["status"];
export type PhdCycleType = z.infer<typeof phdCurriculumCourseSchema>["cycle"];
export type PhdSubgroupType = z.infer<typeof phdCurriculumCourseSchema>["subgroup"];
export type PhdYearlyPlan = z.infer<typeof phdYearlyPlanSchema>;
export type PhdPlan = z.infer<typeof phdPlanSchema>;
export type PhdPlanMeta = z.infer<typeof phdPlanMetaSchema>;

export type ManuscriptBlock = z.infer<typeof manuscriptBlockSchema>;
export type ManuscriptBlockType = z.infer<typeof manuscriptBlockSchema>["type"];
export type ManuscriptAuthor = z.infer<typeof manuscriptAuthorSchema>;
export type DissertationMeta = z.infer<typeof dissertationMetaSchema>;
export type Manuscript = z.infer<typeof manuscriptSchema>;
export type ManuscriptInput = z.input<typeof manuscriptInputSchema>;
export type ManuscriptStatus = z.infer<typeof manuscriptSchema>["status"];
export type ManuscriptType = z.infer<typeof manuscriptSchema>["type"];

export type DiaryEntryType = (typeof diaryEntryTypes)[number];
export type DiaryEntry = z.infer<typeof diaryEntrySchema>;
export type DiaryEntryInput = z.infer<typeof diaryEntryInputSchema>;
export type TopicType = z.infer<typeof learningTopicInputSchema>["topicType"];
export type CourseType = z.infer<typeof learningCourseInputSchema>["courseType"];
export type CourseStatus = z.infer<typeof learningCourseInputSchema>["status"];
export type AssessmentStatus = z.infer<typeof learningAssessmentInputSchema>["status"];
export type BudgetCategory = (typeof budgetCategories)[number];
export type ExperimentType = (typeof experimentTypes)[number];
export type AssignmentStatus = z.infer<typeof learningAssignmentInputSchema>["status"];
export type AssignmentType = string;
export type AssessmentType = z.infer<typeof learningAssessmentInputSchema>["assessmentType"];
export type AttendanceStatus = NonNullable<z.infer<typeof learningSessionInputSchema>["attendance"]>;
export type SessionStatus = z.infer<typeof learningSessionInputSchema>["status"];

export type EventType = "conference" | "workshop" | "symposium" | "seminar" | "summer_school" | "competition" | "exhibition" | "hackathon" | "other";
export type EventFormat = "in_person" | "online" | "hybrid";
export type EventStatus = "planned" | "confirmed" | "attended" | "cancelled";
export type ParticipationRole = "presenter" | "poster_presenter" | "attendee" | "organizer" | "chair" | "volunteer";
export type ParticipationStatus = "planned" | "abstract_submitted" | "accepted" | "rejected" | "attended" | "cancelled";
export type ContributionType = "oral" | "poster" | "keynote" | "panel" | "demo" | "workshop_talk";
export type SubmissionType = "abstract" | "full_paper" | "poster" | "slides" | "video" | "registration" | "visa_docs" | "other";
export type SubmissionStatus = "draft" | "submitted" | "accepted" | "rejected" | "revision_required" | "withdrawn";
