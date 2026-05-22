import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { apiRequest } from "./api";
import { type MobileProject } from "./mock-data";
import { triggerLocalAlert } from "./notifications";
import { type ItemType, type ItemStatus, type ItemVisibility, type ItemRelationType, type ItemFields, type WorkspaceTemplate, ITEM_TYPE_REGISTRY, WORKSPACE_TEMPLATES } from "./workspace-types";

// Re-export for convenience
export type { ItemType, ItemKind, ItemStatus, ItemVisibility, ItemRelationType, ItemFields, ItemCategory, ItemTypeMeta, WorkspaceTemplate, WorkspaceTemplateMeta } from "./workspace-types";
export { ITEM_TYPE_REGISTRY, CATEGORY_META, getTypesByCategory, getCategoryMeta, getTypeMeta, WORKSPACE_TEMPLATES, LEARNING_TYPES, PROJECT_TYPES, getItemKind } from "./workspace-types";

const DIARY_DRAFTS_KEY = "research_navigator_mobile.diary_drafts.v1";
const PURCHASE_DRAFTS_KEY = "research_navigator_mobile.purchase_drafts.v1";
const REAGENT_REQUESTS_KEY = "research_navigator_mobile.reagent_requests.v1";
const SAFETY_INSPECTIONS_KEY = "research_navigator_mobile.safety_inspections.v1";
const WASTE_RECORDS_KEY   = "research_navigator_mobile.waste_records.v1";
const LAB_BOOKINGS_KEY    = "research_navigator_mobile.lab_bookings.v1";
const LAB_ACCESS_LOGS_KEY = "research_navigator_mobile.lab_access_logs.v1";
const LAB_EQ_ACCESS_KEY   = "research_navigator_mobile.lab_eq_access.v1";
const LAB_USER_ROLE_KEY   = "research_navigator_mobile.lab_user_role.v1";
const LAB_RUNS_KEY        = "research_navigator_mobile.lab_runs.v1";
const LAB_METHODS_KEY     = "research_navigator_mobile.lab_methodologies.v1";
const LAB_SESSIONS_KEY    = "research_navigator_mobile.lab_course_sessions.v1";
const LAB_ACTIVITY_KEY    = "research_navigator_mobile.lab_activity.v1";
const WORKSPACE_ITEMS_KEY     = "research_navigator_mobile.workspace_items.v1";
const WORKSPACE_RELATIONS_KEY = "research_navigator_mobile.workspace_relations.v1";
const WORKSPACE_PINNED_KEY    = "research_navigator_mobile.workspace_pinned.v1";
const WORKSPACES_KEY          = "research_navigator_mobile.workspaces.v1";
const ACTIVE_WORKSPACE_KEY    = "research_navigator_mobile.active_workspace.v1";
const MY_SUBJECTS_KEY  = "research_navigator_mobile.my_subjects.v1";
const ACTIVE_PROJECT_KEY = "research_navigator_mobile.active_project_id.v1";
const ACTIVE_WORKSPACE_ITEM_KEY = "research_navigator_mobile.active_workspace_item.v1";
const AUTH_TOKEN_KEY = "research_navigator_mobile.auth_token.v1";

// Усі ключі застосунку (для logout / cache reset).
const ALL_STORAGE_KEYS = [
  DIARY_DRAFTS_KEY, PURCHASE_DRAFTS_KEY, REAGENT_REQUESTS_KEY, SAFETY_INSPECTIONS_KEY,
  MY_SUBJECTS_KEY, WASTE_RECORDS_KEY, LAB_BOOKINGS_KEY, LAB_ACCESS_LOGS_KEY, LAB_EQ_ACCESS_KEY,
  LAB_USER_ROLE_KEY, LAB_RUNS_KEY, LAB_METHODS_KEY, LAB_SESSIONS_KEY, LAB_ACTIVITY_KEY,
  WORKSPACE_ITEMS_KEY, WORKSPACE_RELATIONS_KEY, WORKSPACE_PINNED_KEY,
  WORKSPACES_KEY, ACTIVE_WORKSPACE_KEY, ACTIVE_PROJECT_KEY, ACTIVE_WORKSPACE_ITEM_KEY,
  AUTH_TOKEN_KEY,
];

export type User = {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  emailVerifiedAt?: string | null;
  phone?: string;
  phoneVerifiedAt?: string | null;
  firstNameLatin?: string;
  lastNameLatin?: string;
  orcid?: string;
  position?: string;
  affiliation?: string;
  profileBio?: string;
  defaultSpecialty?: string;
};

export type PersonalProfileLink = {
  kind: "orcid" | "google_scholar" | "scopus" | "web_of_science" | "researchgate" | "academia" | "linkedin" | "github" | "website" | "telegram" | "other";
  label: string;
  value: string;
  url: string;
  isPrimary: boolean;
};

export type PersonalProfileInstitution = {
  _id?: string;
  institutionId?: string;
  institutionName: string;
  shortName?: string;
  country?: string;
  city?: string;
  parentUnitName?: string;
  unitName?: string;
  programName?: string;
  educationLevel?: string;
  role?: string;
  position?: string;
  startYear?: number | null;
  endYear?: number | null;
  isCurrent: boolean;
  isPrimary: boolean;
};

export type PersonalProfile = {
  _id?: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  firstNameLatin: string;
  lastNameLatin: string;
  phone: string;
  orcid: string;
  position: string;
  affiliation: string;
  profileBio: string;
  defaultSpecialty: string;
  researchInterests: string[];
  institutions: PersonalProfileInstitution[];
  links: PersonalProfileLink[];
  preferences: {
    preferredLanguage: "uk" | "en";
    citationName: string;
    defaultAffiliationId: string;
  };
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
};

// --- Learning Types ---

export type CourseType = "mandatory" | "elective" | "optional" | "language" | "physical" | "practice" | "research";
export type CourseStatus = "planned" | "active" | "completed" | "failed" | "withdrawn";

// Self-managed local subject (user builds own curriculum)
export type MySubject = {
  id: string;
  title: string;
  code?: string;
  instructor?: string;
  credits: number;
  semester: number;    // 1-8
  year: number;        // 1-4
  status: "planned" | "active" | "completed";
  finalScore?: number; // 0-100
  examDate?: string;
  examType?: "exam" | "zalik";
  note?: string;
};

export type LearningCourse = {
  _id: string;
  projectId: string;
  title: string;
  code: string;
  instructor: string;
  semester: number;
  year?: number;
  credits: number;
  courseType: CourseType;
  status: CourseStatus;
  finalScore: number | null;
  note: string;
};

export type LearningModule = {
  _id: string;
  courseId: string;
  projectId: string;
  title: string;
  description: string;
  orderIndex: number;
  isCompleted: boolean;
};

export type TopicType = "lecture" | "seminar" | "practical" | "lab" | "self_study" | "consultation";

export type LearningTopic = {
  _id: string;
  moduleId: string;
  courseId: string;
  projectId: string;
  title: string;
  description: string;
  topicType: TopicType;
  durationHours: number;
  isCompleted: boolean;
  notes: string;
  orderIndex: number;
};

export type AssessmentType = "exam" | "zalik" | "midterm" | "test" | "colloquium" | "seminar" | "practical_work" | "essay" | "project" | "coursework" | "lab_work" | "notes_check" | "oral" | "presentation" | "other";
export type AssessmentStatus = "upcoming" | "in_progress" | "completed" | "missed" | "retake_needed" | "passed_retake";

export type LearningAssessment = {
  _id: string;
  courseId: string;
  projectId: string;
  title: string;
  assessmentType: AssessmentType;
  dueDate: string;
  completedDate: string;
  maxScore: number;
  achievedScore: number | null;
  weight: number;
  status: AssessmentStatus;
  notes: string;
  linkedTopicIds: string[];
  linkedModuleIds: string[];
};

export type AttendanceStatus = "present" | "absent" | "excused" | "late";
export type SessionStatus = "active" | "cancelled" | "rescheduled" | "makeup" | "completed";

export type LearningSession = {
  _id: string;
  courseId: string;
  projectId: string;
  topicId: string;
  moduleId: string;
  title: string;
  sessionType: TopicType;
  date: string;
  startTime: string;
  endTime: string;
  attendance: AttendanceStatus | null;
  grade: number | null;
  notes: string;
  location: string;
  status: SessionStatus;
};

export type AssignmentStatus = "assigned" | "in_progress" | "submitted" | "graded" | "late" | "missing";

export type LearningAssignment = {
  _id: string;
  courseId: string;
  projectId: string;
  title: string;
  description: string;
  dueDate: string;
  submittedDate: string;
  maxScore: number;
  achievedScore: number | null;
  status: AssignmentStatus;
  notes: string;
};

// --- PhD Plan Types ---

export type PhdWorkStatus = "pending" | "completed" | "not_completed" | "partial";

export type PhdMilestone = {
  mid: string;
  title: string;
  period: string;
  orderIndex: number;
};

export type PhdCurriculumCourse = {
  cid: string;
  title: string;
  credits: number;
  cycle: "cycle" | "general" | "specialty_practice" | "specialty_professional";
  subgroup: "mandatory" | "elective";
  controlForm: string;
  studyYear: number;
  credited: boolean;
};

export type PhdYearlyCourse = {
  ycid: string;
  title: string;
  controlForm: string;
  period: string;
  grade: string;
  teacherName: string;
  cycle: "general" | "specialty_practice" | "specialty_professional";
  subgroup: "mandatory" | "elective";
  termType?: string;
};

export type PhdYearlyScientificItem = {
  wsid: string;
  title: string;
  content: string;
  period: string;
  status: PhdWorkStatus;
  supervisorNote: string;
  orderIndex: number;
  termType?: string;
};

export type PhdYearlyPlan = {
  year: number;
  educationalCourses: PhdYearlyCourse[];
  scientificWorkItems: PhdYearlyScientificItem[];
  headOfDeptName: string;
  headOfDeptDate: string;
  supervisorAssessment: string;
  committeeDecision: string;
  committeeChair: string;
  committeeDate: string;
  sem1Start: string;
  sem1End: string;
  sem2Start: string;
  sem2End: string;
};

export type PhdPlan = {
  _id?: string;
  projectId: string;
  studentName: string;
  specialty: string;
  studyForm: "full_time" | "part_time";
  totalCredits: number;
  enrollmentDate: string;
  enrollmentOrderDate: string;
  enrollmentOrderNumber: string;
  supervisor: string;
  supervisorTitle: string;
  institution: string;
  department: string;
  dissertationTitle: string;
  dissertationApprovalDate: string;
  dissertationApprovalProtocol: string;
  justification: string;
  curriculumCourses: PhdCurriculumCourse[];
  milestones: PhdMilestone[];
  yearlyPlans: PhdYearlyPlan[];
};

// --- Project Management Types ---

export type ResearchStageStatus = "planned" | "active" | "completed" | "reported";

export type ResearchStage = {
  _id: string;
  projectId: string;
  stageNumber: number;
  title: string;
  goals: string;
  tasksText: string;
  startDate: string;
  endDate: string;
  status: ResearchStageStatus;
  progress: number;
  budget: number;
  currency: string;
  indicators: string;
};

export type TaskStatus = "todo" | "in_progress" | "review" | "done" | "blocked";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export type Task = {
  _id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  assigneeId: string;
};

export type Milestone = {
  _id: string;
  projectId: string;
  title: string;
  description: string;
  dueDate: string;
  status: "upcoming" | "reached" | "missed";
};

export type BudgetCategory = {
  category: string;
  planned: number;
  spent: number;
  remaining: number;
  utilizationPct: number;
};

export type BudgetSummary = {
  totalPlanned: number;
  totalCommitted: number;
  totalSpent: number;
  totalRemaining: number;
  currency: string;
  byCategory: BudgetCategory[];
};

export type ResearchEvent = {
  _id: string;
  projectId: string;
  title: string;
  type: string;
  location: string;
  startDate: string;
  endDate: string;
  status: string;
};

export type EventParticipation = {
  _id: string;
  projectId: string;
  eventId: string;
  participantId: string;
  role: string;
  status: string;
};

export type DiaryEntry = {
  _id: string;
  projectId: string;
  title: string;
  body: string;
  type: string;
  date: string;
  tags?: string[];
  createdAt: string;
};

export type AppNotification = {
  _id: string;
  userId: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  createdAt: string;
};

export type SearchResult = {
  id: string;
  type: "project" | "record" | "task" | "milestone" | "stage" | "message";
  title: string;
  excerpt?: string;
  projectName?: string;
  projectId?: string;
};

export type LibraryItem = {
  _id: string;
  projectId: string;
  kind: string;
  title: string;
  summary?: string;
  creators?: { name: string }[];
  doi?: string;
  url?: string;
  createdAt: string;
};

export type ChatMessage = {
  _id: string;
  projectId: string;
  userId: string;
  displayName: string;
  initials: string;
  content: string;
  createdAt: string;
};

export type AlmanacEvent = {
  _id: string;
  action: string;
  actorId: string;
  actorEmail?: string;
  projectId?: string;
  createdAt: string;
  metadata?: Record<string, any>;
};

// --- Laboratory Types ---

export type GlpEntryType = "observation" | "protocol" | "anomaly" | "technical_failure" | "result" | "note";

export type LabExperimentStatus = "planned" | "active" | "completed" | "failed" | "paused";

export type LabExperimentStep = {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: string;
};

export type LabExperiment = {
  _id: string;
  projectId: string;
  title: string;
  description: string;
  hypothesis: string;
  status: LabExperimentStatus;
  type: string;
  startDate: string;
  endDate: string;
  steps: LabExperimentStep[];
  linkedEquipmentIds: string[];
  linkedInventoryIds: string[];
  tags: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type LabReagentRequest = {
  id: string;
  projectId: string;
  inventoryItemId?: string;
  reagentName: string;
  casNumber?: string;
  quantity: number;
  unit: string;
  supplier?: string;
  urgency: "low" | "normal" | "urgent";
  budgetCode?: string;
  notes?: string;
  createdAt: string;
};

export type LabInventoryCategory = "reagent" | "consumable" | "sample" | "standard" | "other";
export type LabInventoryStatus = "in_stock" | "low_stock" | "depleted" | "expired";
export type LabHazardClass = "none" | "flammable" | "toxic" | "corrosive" | "biohazard" | "radioactive" | "oxidizing";

export type LabInventoryItem = {
  _id: string;
  projectId: string;
  name: string;
  casNumber: string;
  catalogNumber: string;
  manufacturer: string;
  category: LabInventoryCategory;
  quantity: number;
  unit: string;
  location: string;
  storageConditions: string;
  expirationDate: string;
  lotNumber: string;
  hazardClass: LabHazardClass;
  status: LabInventoryStatus;
  notes: string;
  sdsUrl: string;
  sdsFirstAid: string;
  sdsDisposal: string;
  createdAt: string;
  updatedAt: string;
};

export type LabEquipmentStatus = "operational" | "maintenance" | "out_of_order" | "decommissioned";

export type LabEquipment = {
  _id: string;
  projectId: string;
  name: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  location: string;
  description: string;
  status: LabEquipmentStatus;
  nextCalibrationDate: string;
  responsiblePersonId: string;
  createdAt: string;
  updatedAt: string;
};

export type EquipmentLogType = "usage" | "maintenance" | "calibration" | "failure_report";

export type EquipmentLog = {
  _id: string;
  equipmentId: string;
  projectId: string;
  userId: string;
  type: EquipmentLogType;
  startTime?: string;
  endTime?: string;
  durationMinutes: number;
  description: string;
  issuesNoted: string;
  protocolReference: string;
  createdAt: string;
};

// --- Safety Inspection Types ---

export type SafetyCheckResult = "ok" | "fail" | "na";

export type SafetyCheckItem = {
  id: string;
  label: string;
  result: SafetyCheckResult;
  comment: string;
};

export type SafetyInspection = {
  id: string;
  projectId: string;
  templateId: string;
  templateName: string;
  date: string;
  inspector: string;
  items: SafetyCheckItem[];
  completedAt?: string;
};

// --- Waste Management Types ---

export type WasteCategory = "chemical" | "biological" | "sharp" | "radioactive" | "other";

export type WasteRecord = {
  id: string;
  projectId: string;
  date: string;
  category: WasteCategory;
  reagentName: string;
  quantity: number;
  unit: string;
  disposalMethod: string;
  handledBy: string;
  notes: string;
  createdAt: string;
};

// --- Access Control Types ---

export type BslLevel = "BSL-1" | "BSL-2" | "BSL-3" | "BSL-4";

export type LabAccessLog = {
  id: string;
  projectId: string;
  userId: string;
  userName: string;
  action: "enter" | "exit";
  zone: BslLevel;
  timestamp: string;
  notes: string;
};

export type LabEquipmentAccess = {
  equipmentId: string;
  bslRequired: BslLevel;
};

// --- Lab Run (Quick Analysis) Types ---

export type LabRunStatus = "in_progress" | "completed" | "aborted";

export type LabMeasurement = {
  id: string;
  label: string;
  value: string;
  unit: string;
  timestamp: string;
};

export type LabRunInput = {
  refId: string;            // inventory item id або equipment id
  kind: "reagent" | "equipment" | "sample";
  name: string;
  hint?: string;            // напр., "5 мл", "10× розв.", "37°C"
};

export type LabRun = {
  id: string;
  projectId: string;
  presetId: string;         // ph / weighing / dilution / pcr / colour / spectrum / custom
  presetLabel: string;
  emoji: string;
  status: LabRunStatus;
  startedAt: string;
  completedAt?: string;
  durationSec?: number;
  inputs: LabRunInput[];
  measurements: LabMeasurement[];
  notes: string;
  result?: string;          // короткий висновок користувача
};

// --- Workspace / Items ---

export type Workspace = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  ownerId: string;
  isDefault: boolean;
  template?: WorkspaceTemplate;
  description?: string;
  createdAt: string;
  updatedAt: string;
};

export type WorkspaceMember = {
  userId: string;
  userName: string;
  role: string;             // "owner" | "admin" | "editor" | "member" | "viewer" | type-specific
  joinedAt: string;
};

export type WorkspaceItem = {
  id: string;
  type: ItemType;
  title: string;
  description?: string;
  emoji?: string;            // override registry emoji
  status: ItemStatus;
  visibility: ItemVisibility;
  ownerId: string;
  ownerName: string;
  members: WorkspaceMember[];
  workspaceIds: string[];    // в яких просторах живе item (M:N)
  parentItemId?: string;
  supervisor?: string;       // common for personal items
  startDate?: string;
  plannedEndDate?: string;
  tags: string[];
  fields: ItemFields;
  legacyProjectId?: string;  // link до старого MobileProject (для адаптера)
  createdAt: string;
  updatedAt: string;
};

export type ItemRelation = {
  id: string;
  fromItemId: string;
  toItemId: string;
  relationType: ItemRelationType;
  note?: string;
  createdAt: string;
};

// --- Lab Activity Feed Types ---

export type LabActivityCategory = "equipment" | "inventory" | "experiment" | "run" | "session" | "access" | "safety" | "methodology" | "booking" | "other";

export type LabActivityAction =
  | "run_started" | "run_completed" | "run_aborted"
  | "session_assigned" | "session_submitted" | "session_graded" | "session_returned"
  | "methodology_created" | "methodology_published"
  | "booking_created" | "booking_cancelled"
  | "equipment_used" | "equipment_calibrated" | "equipment_failed"
  | "inventory_low" | "inventory_depleted" | "inventory_expiring"
  | "lab_enter" | "lab_exit"
  | "experiment_started" | "experiment_completed"
  | "waste_disposed" | "safety_inspection";

export type LabActivity = {
  id: string;
  projectId: string;
  category: LabActivityCategory;
  action: LabActivityAction;
  actorId: string;
  actorName: string;
  targetType?: string;       // "run" / "session" / "equipment" / "inventory" / etc.
  targetId?: string;
  targetTitle?: string;      // human-readable
  emoji?: string;
  description?: string;       // короткий опис (для UI)
  metadata?: Record<string, any>;
  timestamp: string;
};

// --- Lab Methodology / Course Session Types ---

export type LabMethodologyStatus = "draft" | "published" | "archived";

export type MethodologyStep = {
  id: string;
  title: string;
  description: string;
  expectedMinutes: number;
};

export type MethodologyMaterial = {
  id: string;
  name: string;
  kind: "reagent" | "equipment" | "consumable" | "sample";
  quantity: string;
};

export type GradingCriterion = {
  id: string;
  label: string;
  maxPoints: number;
};

export type LabMethodology = {
  id: string;
  projectId: string;
  courseId?: string;
  instructorId: string;
  instructorName: string;
  title: string;
  emoji: string;
  description: string;
  procedureSteps: MethodologyStep[];
  materials: MethodologyMaterial[];
  safetyNotes: string;
  expectedResults: string;
  gradingCriteria: GradingCriterion[];
  maxScore: number;
  durationMinutes: number;
  bslLevel: BslLevel;
  status: LabMethodologyStatus;
  createdAt: string;
  updatedAt: string;
};

export type LabSessionStatus = "assigned" | "in_progress" | "submitted" | "graded" | "returned";

export type SessionStepProgress = {
  stepId: string;
  completed: boolean;
  notes: string;
  completedAt?: string;
};

export type SessionGradeBreakdown = {
  criterionId: string;
  points: number;
  comment: string;
};

export type LabCourseSession = {
  id: string;
  projectId: string;
  methodologyId: string;
  methodologyTitle: string;
  methodologyEmoji: string;
  courseId?: string;
  studentId: string;
  studentName: string;
  status: LabSessionStatus;
  startedAt?: string;
  submittedAt?: string;
  gradedAt?: string;
  stepProgress: SessionStepProgress[];
  linkedRunIds: string[];
  submissionNotes: string;
  conclusions: string;
  totalScore?: number;
  maxScore: number;
  breakdown: SessionGradeBreakdown[];
  instructorFeedback: string;
  createdAt: string;
};

// --- Lab Role Types ---

export type LabRole = "lab_manager" | "researcher" | "phd_student" | "student" | "technician";

export const LAB_ROLE_META: Record<LabRole, { label: string; emoji: string; description: string; color: string }> = {
  lab_manager:  { label: "Зав. лаб.",   emoji: "👔", description: "Управління лабораторією, бюджет, безпека", color: "#7c3aed" },
  researcher:   { label: "Дослідник",   emoji: "🧑‍🔬", description: "Експерименти, протоколи, публікації",      color: "#0f766e" },
  phd_student:  { label: "Аспірант",    emoji: "🎓", description: "Дисертаційне дослідження, навчання",        color: "#0369a1" },
  student:      { label: "Студент",     emoji: "📚", description: "Курсові, практика, лабораторні",            color: "#059669" },
  technician:   { label: "Лаборант",    emoji: "🛠️", description: "Підготовка, реагенти, обладнання",         color: "#d97706" },
};

// --- Lab Calendar Types ---

export type LabBooking = {
  id: string;
  projectId: string;
  equipmentId: string;
  equipmentName: string;
  userId: string;
  userName: string;
  date: string;       // YYYY-MM-DD
  startTime: string;  // HH:MM
  endTime: string;    // HH:MM
  purpose: string;
  status: "confirmed" | "cancelled";
  createdAt: string;
};

// --- Store Types ---

export type QuickDraft = {
  id: string;
  body: string;
  title?: string;
  type: string;
  createdAt: string;
  projectId: string;
};

export type PurchaseRequestDraft = {
  id: string;
  amount: number;
  category: string;
  createdAt: string;
  projectId: string;
  title: string;
  vendor?: string;
};

export type DiaryEntryInput = {
  type: string;
  title: string;
  body: string;
  date: string;
  tags?: string[];
};

type MobileStore = {
  user: User | null;
  personalProfile: PersonalProfile | null;
  authToken: string | null;
  activeProjectId: string | null;
  activeWorkspaceItemId: string | null;
  activeWorkspaceItem: WorkspaceItem | null;
  projects: MobileProject[];
  mySubjects: MySubject[];
  addMySubject: (s: Omit<MySubject, "id">) => MySubject;
  updateMySubject: (id: string, patch: Partial<MySubject>) => void;
  deleteMySubject: (id: string) => void;
  courses: LearningCourse[];
  modules: LearningModule[];
  topics: LearningTopic[];
  assessments: LearningAssessment[];
  sessions: LearningSession[];
  assignments: LearningAssignment[];
  phdPlan: PhdPlan | null;
  
  // Project Details
  stages: ResearchStage[];
  tasks: Task[];
  milestones: Milestone[];
  budgetSummary: BudgetSummary | null;
  events: ResearchEvent[];
  participations: EventParticipation[];
  
  // Diary & Notifications
  diaryEntries: DiaryEntry[];
  notifications: AppNotification[];
  unreadCount: number;

  // Workbench & Communication
  libraryItems: LibraryItem[];
  chatMessages: ChatMessage[];
  almanacEvents: AlmanacEvent[];

  // Laboratory
  labInventory: LabInventoryItem[];
  labEquipment: LabEquipment[];
  labEquipmentLogs: Record<string, EquipmentLog[]>;
  labExperiments: LabExperiment[];
  reagentRequests: LabReagentRequest[];
  safetyInspections: SafetyInspection[];
  wasteRecords: WasteRecord[];
  labBookings: LabBooking[];
  labAccessLogs: LabAccessLog[];
  labEquipmentAccess: LabEquipmentAccess[];
  userRole: LabRole | null;
  labRuns: LabRun[];
  labMethodologies: LabMethodology[];
  labCourseSessions: LabCourseSession[];
  labActivity: LabActivity[];

  // Workspace / Items
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  workspaceItems: WorkspaceItem[];
  itemRelations: ItemRelation[];
  pinnedItemIds: string[];

  drafts: QuickDraft[];
  hydrated: boolean;
  loading: boolean;
  purchaseDrafts: PurchaseRequestDraft[];
  
  setActiveProject: (id: string | null, remember: boolean) => void;
  setActiveWorkspaceItem: (itemId: string | null, remember?: boolean) => void;
  setAuthToken: (token: string | null) => void;
  logoutAndClear: () => Promise<void>;
  fetchMe: (token?: string) => Promise<User | null>;
  fetchPersonalProfile: (token?: string) => Promise<PersonalProfile | null>;
  updatePersonalProfile: (input: Partial<PersonalProfile>) => Promise<PersonalProfile | null>;
  fetchProjects: () => Promise<void>;
  fetchLearningData: () => Promise<void>;
  updateAssessmentScore: (assessmentId: string, score: number | null) => Promise<void>;
  fetchPhdPlan: () => Promise<void>;
  fetchProjectDetails: () => Promise<void>;
  fetchDiaryEntries: () => Promise<void>;
  fetchNotifications: () => Promise<void>;
  markNotificationsRead: (ids?: string[]) => Promise<void>;
  fetchLibraryItems: () => Promise<void>;
  fetchChatMessages: (silent?: boolean) => Promise<void>;
  sendChatMessage: (content: string) => Promise<void>;
  fetchAlmanac: () => Promise<void>;

  // Laboratory actions
  fetchLabInventory: () => Promise<void>;
  fetchLabEquipment: () => Promise<void>;
  fetchLabEquipmentLogs: (equipmentId: string) => Promise<void>;
  addEquipmentLog: (equipmentId: string, log: Partial<EquipmentLog>) => Promise<void>;
  createInventoryItem: (data: Partial<LabInventoryItem>) => Promise<LabInventoryItem>;
  updateInventoryItem: (id: string, data: Partial<LabInventoryItem>) => Promise<void>;
  deleteInventoryItem: (id: string) => Promise<void>;
  createEquipment: (data: Partial<LabEquipment>) => Promise<LabEquipment>;
  updateEquipment: (id: string, data: Partial<LabEquipment>) => Promise<void>;
  deleteEquipment: (id: string) => Promise<void>;
  fetchLabExperiments: () => Promise<void>;
  createExperiment: (data: Partial<LabExperiment>) => Promise<LabExperiment>;
  updateExperiment: (id: string, data: Partial<LabExperiment>) => Promise<void>;
  deleteExperiment: (id: string) => Promise<void>;
  addReagentRequest: (data: Omit<LabReagentRequest, "id" | "createdAt" | "projectId">) => LabReagentRequest;
  removeReagentRequest: (id: string) => void;
  clearReagentRequests: () => void;
  saveInspection: (inspection: Omit<SafetyInspection, "id" | "projectId">) => SafetyInspection;
  removeInspection: (id: string) => void;
  addWasteRecord: (data: Omit<WasteRecord, "id" | "projectId" | "createdAt">) => WasteRecord;
  removeWasteRecord: (id: string) => void;
  addLabBooking: (data: Omit<LabBooking, "id" | "projectId" | "createdAt" | "status">) => LabBooking | null;
  cancelLabBooking: (id: string) => void;
  logLabAccess: (action: LabAccessLog["action"], zone: BslLevel, notes?: string) => LabAccessLog;
  setEquipmentBsl: (equipmentId: string, bslRequired: BslLevel) => void;
  setUserRole: (role: LabRole | null) => void;
  startLabRun: (data: { presetId: string; presetLabel: string; emoji: string; inputs?: LabRunInput[]; notes?: string }) => LabRun;
  addRunMeasurement: (runId: string, m: Omit<LabMeasurement, "id" | "timestamp">) => void;
  addRunInput: (runId: string, input: LabRunInput) => void;
  removeRunInput: (runId: string, refId: string) => void;
  updateRunNotes: (runId: string, notes: string) => void;
  completeLabRun: (runId: string, result?: string) => Promise<LabRun | null>;
  abortLabRun: (runId: string) => void;
  deleteLabRun: (runId: string) => void;

  // Methodology / Course Session
  createMethodology: (data: Partial<LabMethodology>) => LabMethodology;
  updateMethodology: (id: string, data: Partial<LabMethodology>) => void;
  publishMethodology: (id: string) => void;
  deleteMethodology: (id: string) => void;
  assignSession: (methodologyId: string, studentName?: string) => LabCourseSession | null;
  startSession: (sessionId: string) => void;
  toggleSessionStep: (sessionId: string, stepId: string, notes?: string) => void;
  linkRunToSession: (sessionId: string, runId: string) => void;
  updateSessionSubmission: (sessionId: string, data: { submissionNotes?: string; conclusions?: string }) => void;
  submitSession: (sessionId: string) => void;
  gradeSession: (sessionId: string, grade: { totalScore: number; breakdown: SessionGradeBreakdown[]; feedback: string }) => void;
  returnSession: (sessionId: string, feedback: string) => void;
  deleteSession: (sessionId: string) => void;

  recordActivity: (a: Omit<LabActivity, "id" | "projectId" | "timestamp" | "actorId" | "actorName">) => void;
  clearActivity: () => void;

  // Workspace methods
  createWorkspace: (data: { name: string; emoji?: string; color?: string; template?: WorkspaceTemplate; description?: string }) => Workspace;
  renameWorkspace: (id: string, name: string) => void;
  updateWorkspace: (id: string, patch: Partial<Workspace>) => void;
  deleteWorkspace: (id: string) => void;
  setActiveWorkspace: (id: string) => void;
  // ── API sync (web ↔ mobile через /api/workspaces) ───────────────────
  fetchWorkspacesFromApi: () => Promise<void>;
  fetchItemsFromApi: (workspaceId?: string) => Promise<void>;
  // Linked items (сервер-синхронізовані зв'язки)
  linkedItemsMap: Record<string, WorkspaceItem[]>;
  fetchLinkedItems: (itemId: string) => Promise<void>;
  linkItemViaApi: (itemId: string, targetId: string) => Promise<void>;
  unlinkItemViaApi: (itemId: string, targetId: string) => Promise<void>;
  createWorkspaceViaApi: (data: { name: string; emoji?: string; color?: string; template?: string; description?: string }) => Promise<Workspace | null>;
  createItemViaApi: (data: Partial<WorkspaceItem> & { type: ItemType; title: string; workspaceIds: string[] }) => Promise<WorkspaceItem | null>;
  // Item methods
  createWorkspaceItem: (data: Partial<WorkspaceItem> & { type: ItemType; title: string; workspaceIds?: string[] }) => WorkspaceItem;
  updateWorkspaceItem: (id: string, patch: Partial<WorkspaceItem>) => void;
  deleteWorkspaceItem: (id: string) => void;
  archiveWorkspaceItem: (id: string) => void;
  setItemPinned: (id: string, pinned: boolean) => void;
  addItemMember: (itemId: string, member: WorkspaceMember) => void;
  removeItemMember: (itemId: string, userId: string) => void;
  addItemToWorkspace: (itemId: string, workspaceId: string) => void;
  removeItemFromWorkspace: (itemId: string, workspaceId: string) => void;
  addItemRelation: (fromId: string, toId: string, type: ItemRelationType, note?: string) => ItemRelation | null;
  removeItemRelation: (relationId: string) => void;
  getRelatedItems: (itemId: string) => { incoming: ItemRelation[]; outgoing: ItemRelation[] };
  getAllItems: () => WorkspaceItem[];                   // усі items користувача (з адаптером)
  getItemsForWorkspace: (workspaceId: string) => WorkspaceItem[];  // тільки для активного простору

  search: (query: string) => Promise<SearchResult[]>;
  updateProjectTaskStatus: (taskId: string, status: TaskStatus) => Promise<void>;
  addDiaryDraft: (body: string, title?: string, type?: string) => QuickDraft;
  syncDiaryEntry: (input: DiaryEntryInput) => Promise<void>;
  addPurchaseDraft: (input: Omit<PurchaseRequestDraft, "createdAt" | "id" | "projectId">) => PurchaseRequestDraft;
  clearDrafts: () => void;
  clearPurchaseDrafts: () => void;
};

const MobileStoreContext = createContext<MobileStore | null>(null);

export function MobileStoreProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [personalProfile, setPersonalProfile] = useState<PersonalProfile | null>(null);
  const [authToken, setAuthTokenState] = useState<string | null>(null);
  const [activeWorkspaceItemId, setActiveWorkspaceItemIdState] = useState<string | null>(null);
  const [projects, setProjects] = useState<MobileProject[]>([]);
  const [mySubjects, setMySubjects] = useState<MySubject[]>([]);
  const [courses, setCourses] = useState<LearningCourse[]>([]);
  const [modules, setModules] = useState<LearningModule[]>([]);
  const [topics, setTopics] = useState<LearningTopic[]>([]);
  const [assessments, setAssessments] = useState<LearningAssessment[]>([]);
  const [sessions, setSessions] = useState<LearningSession[]>([]);
  const [assignments, setAssignments] = useState<LearningAssignment[]>([]);
  const [phdPlan, setPhdPlan] = useState<PhdPlan | null>(null);

  const [stages, setStages] = useState<ResearchStage[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [budgetSummary, setBudgetSummary] = useState<BudgetSummary | null>(null);
  const [events, setEvents] = useState<ResearchEvent[]>([]);
  const [participations, setParticipations] = useState<EventParticipation[]>([]);

  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [almanacEvents, setAlmanacEvents] = useState<AlmanacEvent[]>([]);

  const [labInventory, setLabInventory] = useState<LabInventoryItem[]>([]);
  const [labEquipment, setLabEquipment] = useState<LabEquipment[]>([]);
  const [labEquipmentLogs, setLabEquipmentLogs] = useState<Record<string, EquipmentLog[]>>({});
  const [labExperiments, setLabExperiments] = useState<LabExperiment[]>([]);
  const [reagentRequests, setReagentRequests] = useState<LabReagentRequest[]>([]);
  const [safetyInspections, setSafetyInspections] = useState<SafetyInspection[]>([]);
  const [wasteRecords, setWasteRecords] = useState<WasteRecord[]>([]);
  const [labBookings, setLabBookings] = useState<LabBooking[]>([]);
  const [labAccessLogs, setLabAccessLogs] = useState<LabAccessLog[]>([]);
  const [labEquipmentAccess, setLabEquipmentAccess] = useState<LabEquipmentAccess[]>([]);
  const [userRole, setUserRoleState] = useState<LabRole | null>(null);
  const [labRuns, setLabRuns] = useState<LabRun[]>([]);
  const [labMethodologies, setLabMethodologies] = useState<LabMethodology[]>([]);
  const [labCourseSessions, setLabCourseSessions] = useState<LabCourseSession[]>([]);
  const [labActivity, setLabActivity] = useState<LabActivity[]>([]);
  const [workspaceItems, setWorkspaceItems] = useState<WorkspaceItem[]>([]);
  const [itemRelations, setItemRelations] = useState<ItemRelation[]>([]);
  const [linkedItemsMap, setLinkedItemsMap] = useState<Record<string, WorkspaceItem[]>>({});
  const [pinnedItemIds, setPinnedItemIds] = useState<string[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceIdState] = useState<string | null>(null);

  const [drafts, setDrafts] = useState<QuickDraft[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [purchaseDrafts, setPurchaseDrafts] = useState<PurchaseRequestDraft[]>([]);

  // ─── Derived: активний WorkspaceItem + legacy-сумісний activeProjectId ───
  // activeWorkspaceItemId — справжнє джерело "що зараз обрано" (item-first).
  // activeProjectId — обчислюється з item: legacyProjectId якщо є,
  // інакше item.id (нові items використовують власний id як projectId для записів).
  const activeWorkspaceItem: WorkspaceItem | null = useMemo(() => {
    if (!activeWorkspaceItemId) return null;
    const direct = workspaceItems.find(it => it.id === activeWorkspaceItemId);
    if (direct) return direct;
    // Legacy-adapter: підтримує id формату "legacy_<projectId>" для проєктів,
    // що ще не мають свого WorkspaceItem.
    if (activeWorkspaceItemId.startsWith("legacy_")) {
      const projectId = activeWorkspaceItemId.slice("legacy_".length);
      const p = projects.find(pp => String(pp.id) === projectId);
      if (!p) return null;
      const itemType: ItemType = p.projectType === "laboratory" ? "laboratory" : "individual_research";
      const meta = ITEM_TYPE_REGISTRY[itemType];
      const defaultWsId = workspaces.find(w => w.isDefault)?.id || workspaces[0]?.id || "";
      return {
        id: activeWorkspaceItemId,
        type: itemType,
        title: p.title,
        description: "",
        emoji: meta.emoji,
        status: "active",
        visibility: meta.defaultVisibility,
        ownerId: user?._id || "",
        ownerName: user ? `${user.firstName} ${user.lastName}` : "",
        members: [],
        workspaceIds: defaultWsId ? [defaultWsId] : [],
        tags: [p.acronym].filter(Boolean) as string[],
        fields: itemType === "laboratory"
          ? ({ bslLevel: (p as any).safetyLevel, roomNumber: p.roomNumber } as ItemFields)
          : {},
        legacyProjectId: String(p.id),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
    return null;
  }, [activeWorkspaceItemId, workspaceItems, projects, workspaces, user]);

  const activeProjectId: string | null = useMemo(() => {
    if (!activeWorkspaceItem) return null;
    return activeWorkspaceItem.legacyProjectId || activeWorkspaceItem.id;
  }, [activeWorkspaceItem]);

  // Background polling for chat & notifications
  useEffect(() => {
    if (!user || !activeProjectId) return;

    const interval = setInterval(() => {
      store.fetchChatMessages(true);
      store.fetchNotifications();
    }, 10000); // every 10s

    return () => clearInterval(interval);
  }, [user, activeProjectId, chatMessages.length]);

  useEffect(() => {
    let mounted = true;

    async function loadInitialData() {
      const [mySubjectsValue, diaryValue, purchaseValue, reagentValue, safetyValue, wasteValue, bookingsValue, accessLogsValue, eqAccessValue, roleValue, runsValue, methodsValue, sessionsValue, activityValue, wsItemsValue, wsRelValue, wsPinnedValue, workspacesValue, activeWsValue, activeId, token, activeItemIdValue] = await Promise.all([
        AsyncStorage.getItem(MY_SUBJECTS_KEY),
        AsyncStorage.getItem(DIARY_DRAFTS_KEY),
        AsyncStorage.getItem(PURCHASE_DRAFTS_KEY),
        AsyncStorage.getItem(REAGENT_REQUESTS_KEY),
        AsyncStorage.getItem(SAFETY_INSPECTIONS_KEY),
        AsyncStorage.getItem(WASTE_RECORDS_KEY),
        AsyncStorage.getItem(LAB_BOOKINGS_KEY),
        AsyncStorage.getItem(LAB_ACCESS_LOGS_KEY),
        AsyncStorage.getItem(LAB_EQ_ACCESS_KEY),
        AsyncStorage.getItem(LAB_USER_ROLE_KEY),
        AsyncStorage.getItem(LAB_RUNS_KEY),
        AsyncStorage.getItem(LAB_METHODS_KEY),
        AsyncStorage.getItem(LAB_SESSIONS_KEY),
        AsyncStorage.getItem(LAB_ACTIVITY_KEY),
        AsyncStorage.getItem(WORKSPACE_ITEMS_KEY),
        AsyncStorage.getItem(WORKSPACE_RELATIONS_KEY),
        AsyncStorage.getItem(WORKSPACE_PINNED_KEY),
        AsyncStorage.getItem(WORKSPACES_KEY),
        AsyncStorage.getItem(ACTIVE_WORKSPACE_KEY),
        AsyncStorage.getItem(ACTIVE_PROJECT_KEY),
        AsyncStorage.getItem(AUTH_TOKEN_KEY),
        AsyncStorage.getItem(ACTIVE_WORKSPACE_ITEM_KEY),
      ]);

      if (!mounted) return;
      if (mySubjectsValue) setMySubjects(JSON.parse(mySubjectsValue) as MySubject[]);
      if (diaryValue)      setDrafts(JSON.parse(diaryValue) as QuickDraft[]);
      if (purchaseValue)   setPurchaseDrafts(JSON.parse(purchaseValue) as PurchaseRequestDraft[]);
      if (reagentValue)    setReagentRequests(JSON.parse(reagentValue) as LabReagentRequest[]);
      if (safetyValue)     setSafetyInspections(JSON.parse(safetyValue) as SafetyInspection[]);
      if (wasteValue)      setWasteRecords(JSON.parse(wasteValue) as WasteRecord[]);
      if (bookingsValue)   setLabBookings(JSON.parse(bookingsValue) as LabBooking[]);
      if (accessLogsValue) setLabAccessLogs(JSON.parse(accessLogsValue) as LabAccessLog[]);
      if (eqAccessValue)   setLabEquipmentAccess(JSON.parse(eqAccessValue) as LabEquipmentAccess[]);
      if (roleValue)       setUserRoleState(roleValue as LabRole);
      if (runsValue)       setLabRuns(JSON.parse(runsValue) as LabRun[]);
      if (methodsValue)    setLabMethodologies(JSON.parse(methodsValue) as LabMethodology[]);
      if (sessionsValue)   setLabCourseSessions(JSON.parse(sessionsValue) as LabCourseSession[]);
      if (activityValue)   setLabActivity(JSON.parse(activityValue) as LabActivity[]);
      if (wsItemsValue)    setWorkspaceItems(JSON.parse(wsItemsValue) as WorkspaceItem[]);
      if (wsRelValue)      setItemRelations(JSON.parse(wsRelValue) as ItemRelation[]);
      if (wsPinnedValue)   setPinnedItemIds(JSON.parse(wsPinnedValue) as string[]);

      // Workspaces: bootstrap default if none exist
      let loadedWorkspaces: Workspace[] = [];
      if (workspacesValue) {
        loadedWorkspaces = JSON.parse(workspacesValue) as Workspace[];
      }

      // Підрахунок items для кожного workspace (потрібно для dedup).
      const itemsForDedup: WorkspaceItem[] = wsItemsValue
        ? (JSON.parse(wsItemsValue) as WorkspaceItem[])
        : [];
      const itemsByWs = new Map<string, number>();
      for (const it of itemsForDedup) {
        for (const wid of it.workspaceIds || []) {
          itemsByWs.set(wid, (itemsByWs.get(wid) || 0) + 1);
        }
      }

      // ── Агресивна dedup після зміни моделі workspaces ────────────────
      // Лишаємо ОДИН isDefault (найстаріший); решту isDefault → false.
      const defaults = loadedWorkspaces
        .filter(w => w.isDefault)
        .sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""));
      if (defaults.length > 1) {
        const keeperId = defaults[0].id;
        loadedWorkspaces = loadedWorkspaces.map(w =>
          w.isDefault && w.id !== keeperId ? { ...w, isDefault: false } : w
        );
      }
      // Видаляємо порожні дублі за (name, template): якщо два+ workspace мають
      // ідентичні name+template і немає жодного item — лишити лише найстаріший.
      const groupKey = (w: Workspace) => `${w.name}|${w.template || ""}`;
      const groups = new Map<string, Workspace[]>();
      for (const w of loadedWorkspaces) {
        const arr = groups.get(groupKey(w)) || [];
        arr.push(w);
        groups.set(groupKey(w), arr);
      }
      const toRemove = new Set<string>();
      for (const arr of groups.values()) {
        if (arr.length < 2) continue;
        const sorted = arr.slice().sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""));
        for (let i = 1; i < sorted.length; i++) {
          const w = sorted[i];
          if ((itemsByWs.get(w.id) || 0) === 0) {
            toRemove.add(w.id);
          }
        }
      }
      if (toRemove.size > 0) {
        loadedWorkspaces = loadedWorkspaces.filter(w => !toRemove.has(w.id));
      }

      // Жодного auto-bootstrap — empty state у space.tsx запросить користувача
      // створити перший простір самостійно.
      setWorkspaces(loadedWorkspaces);

      // Migration: items without workspaceIds → assign to default workspace
      if (wsItemsValue) {
        const items = JSON.parse(wsItemsValue) as WorkspaceItem[];
        const defaultWs = loadedWorkspaces.find(w => w.isDefault) || loadedWorkspaces[0];
        const migrated = items.map(it => (it.workspaceIds && it.workspaceIds.length > 0)
          ? it
          : { ...it, workspaceIds: [defaultWs.id] });
        setWorkspaceItems(migrated);
      }

      // Active workspace
      const validActiveWs = activeWsValue && loadedWorkspaces.some(w => w.id === activeWsValue);
      setActiveWorkspaceIdState(validActiveWs ? activeWsValue : loadedWorkspaces[0]?.id || null);

      // Restore active item:
      //  1) preferred — saved activeWorkspaceItemId (новий шлях)
      //  2) fallback  — saved legacy activeProjectId → "legacy_<id>" обгортка
      if (activeItemIdValue) {
        setActiveWorkspaceItemIdState(activeItemIdValue);
      } else if (activeId) {
        setActiveWorkspaceItemIdState(`legacy_${activeId}`);
      }
      if (token) setAuthTokenState(token);

      // Try to restore session — лише якщо є токен (анонімний /me просто 401).
      if (token) {
        try {
          const res = await apiRequest<{ user: User }>("/api/auth/me", { token });
          if (mounted) setUser(res.user);
        } catch {
          // ignore — token застарів, юзер побачить login screen
        }
      }

      setHydrated(true);
    }

    loadInitialData().catch(() => setHydrated(true));
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(DIARY_DRAFTS_KEY, JSON.stringify(drafts)).catch(() => undefined);
  }, [drafts, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(PURCHASE_DRAFTS_KEY, JSON.stringify(purchaseDrafts)).catch(() => undefined);
  }, [hydrated, purchaseDrafts]);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(REAGENT_REQUESTS_KEY, JSON.stringify(reagentRequests)).catch(() => undefined);
  }, [hydrated, reagentRequests]);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(SAFETY_INSPECTIONS_KEY, JSON.stringify(safetyInspections)).catch(() => undefined);
  }, [hydrated, safetyInspections]);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(WASTE_RECORDS_KEY, JSON.stringify(wasteRecords)).catch(() => undefined);
  }, [hydrated, wasteRecords]);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(LAB_BOOKINGS_KEY, JSON.stringify(labBookings)).catch(() => undefined);
  }, [hydrated, labBookings]);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(LAB_ACCESS_LOGS_KEY, JSON.stringify(labAccessLogs)).catch(() => undefined);
  }, [hydrated, labAccessLogs]);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(LAB_EQ_ACCESS_KEY, JSON.stringify(labEquipmentAccess)).catch(() => undefined);
  }, [hydrated, labEquipmentAccess]);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(LAB_RUNS_KEY, JSON.stringify(labRuns)).catch(() => undefined);
  }, [hydrated, labRuns]);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(LAB_METHODS_KEY, JSON.stringify(labMethodologies)).catch(() => undefined);
  }, [hydrated, labMethodologies]);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(LAB_SESSIONS_KEY, JSON.stringify(labCourseSessions)).catch(() => undefined);
  }, [hydrated, labCourseSessions]);

  useEffect(() => {
    if (!hydrated) return;
    // Keep last 500 to avoid bloat
    const trimmed = labActivity.slice(0, 500);
    AsyncStorage.setItem(LAB_ACTIVITY_KEY, JSON.stringify(trimmed)).catch(() => undefined);
  }, [hydrated, labActivity]);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(WORKSPACE_ITEMS_KEY, JSON.stringify(workspaceItems)).catch(() => undefined);
  }, [hydrated, workspaceItems]);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(WORKSPACE_RELATIONS_KEY, JSON.stringify(itemRelations)).catch(() => undefined);
  }, [hydrated, itemRelations]);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(WORKSPACE_PINNED_KEY, JSON.stringify(pinnedItemIds)).catch(() => undefined);
  }, [hydrated, pinnedItemIds]);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(WORKSPACES_KEY, JSON.stringify(workspaces)).catch(() => undefined);
  }, [hydrated, workspaces]);

  useEffect(() => {
    if (!hydrated) return;
    if (activeWorkspaceId) {
      AsyncStorage.setItem(ACTIVE_WORKSPACE_KEY, activeWorkspaceId).catch(() => undefined);
    }
  }, [hydrated, activeWorkspaceId]);

  const store = useMemo<MobileStore>(() => {
    const pushActivity = (a: Omit<LabActivity, "id" | "projectId" | "timestamp" | "actorId" | "actorName">) => {
      const entry: LabActivity = {
        ...a,
        id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        projectId: activeProjectId || "",
        actorId: user?._id || "",
        actorName: user ? `${user.firstName} ${user.lastName}` : "Анонім",
        timestamp: new Date().toISOString(),
      };
      setLabActivity(prev => [entry, ...prev]);
    };
    return ({
    user,
    personalProfile,
    authToken,
    activeProjectId,
    activeWorkspaceItemId,
    activeWorkspaceItem,
    projects,
    courses,
    modules,
    topics,
    assessments,
    sessions,
    assignments,
    phdPlan,
    stages,
    tasks,
    milestones,
    budgetSummary,
    events,
    participations,
    diaryEntries,
    notifications,
    unreadCount,
    libraryItems,
    chatMessages,
    almanacEvents,
    labInventory,
    labEquipment,
    labEquipmentLogs,
    labExperiments,
    reagentRequests,
    safetyInspections,
    wasteRecords,
    labBookings,
    labAccessLogs,
    labEquipmentAccess,
    userRole,
    labRuns,
    labMethodologies,
    labCourseSessions,
    labActivity,
    workspaces,
    activeWorkspaceId,
    workspaceItems,
    itemRelations,
    linkedItemsMap,
    pinnedItemIds,
    drafts,
    hydrated,
    loading,
    purchaseDrafts,
    setAuthToken: (token) => {
      setAuthTokenState(token);
      if (token) {
        AsyncStorage.setItem(AUTH_TOKEN_KEY, token).catch(() => undefined);
      } else {
        AsyncStorage.removeItem(AUTH_TOKEN_KEY).catch(() => undefined);
      }
    },
    logoutAndClear: async () => {
      // Очищаємо ВСІ кешовані ключі — щоб попередній юзер не бачив дані наступного.
      try {
        await AsyncStorage.multiRemove(ALL_STORAGE_KEYS);
      } catch (e) {
        console.error("[logout] AsyncStorage clear failed", e);
      }
      // Скидаємо in-memory state.
      setAuthTokenState(null);
      setUser(null);
      setPersonalProfile(null);
      setActiveWorkspaceItemIdState(null);
      setProjects([]);
      setCourses([]); setModules([]); setTopics([]); setAssessments([]);
      setSessions([]); setAssignments([]); setPhdPlan(null);
      setStages([]); setTasks([]); setMilestones([]);
      setBudgetSummary(null); setEvents([]); setParticipations([]);
      setDiaryEntries([]); setNotifications([]); setUnreadCount(0);
      setLibraryItems([]); setChatMessages([]); setAlmanacEvents([]);
      setLabInventory([]); setLabEquipment([]); setLabEquipmentLogs({});
      setLabExperiments([]); setReagentRequests([]); setSafetyInspections([]);
      setWasteRecords([]); setLabBookings([]); setLabAccessLogs([]);
      setLabEquipmentAccess([]); setUserRoleState(null);
      setLabRuns([]); setLabMethodologies([]); setLabCourseSessions([]); setLabActivity([]);
      setWorkspaces([]); setActiveWorkspaceIdState(null);
      setWorkspaceItems([]); setItemRelations([]); setPinnedItemIds([]);
      setDrafts([]); setPurchaseDrafts([]);
    },
    // Legacy API: setActiveProject(projectId, remember).
    // Тепер це обгортка над setActiveWorkspaceItem — знаходимо існуючий
    // WorkspaceItem за legacyProjectId або fallback на "legacy_<id>" формат.
    setActiveProject: (id, remember) => {
      if (!id) {
        setActiveWorkspaceItemIdState(null);
        AsyncStorage.multiRemove([ACTIVE_PROJECT_KEY, ACTIVE_WORKSPACE_ITEM_KEY]).catch(() => undefined);
        return;
      }
      const ownItem = workspaceItems.find(it => it.legacyProjectId === String(id));
      const itemId = ownItem?.id || `legacy_${id}`;
      setActiveWorkspaceItemIdState(itemId);
      if (remember) {
        AsyncStorage.multiSet([
          [ACTIVE_PROJECT_KEY, String(id)],
          [ACTIVE_WORKSPACE_ITEM_KEY, itemId],
        ]).catch(() => undefined);
      }
    },
    setActiveWorkspaceItem: (itemId, remember = true) => {
      setActiveWorkspaceItemIdState(itemId);
      if (!itemId) {
        AsyncStorage.multiRemove([ACTIVE_PROJECT_KEY, ACTIVE_WORKSPACE_ITEM_KEY]).catch(() => undefined);
        return;
      }
      if (!remember) return;
      // persist itemId + (best-effort) legacyProjectId for backward compat
      const own = workspaceItems.find(it => it.id === itemId);
      const legacyId = own?.legacyProjectId
        || (itemId.startsWith("legacy_") ? itemId.slice("legacy_".length) : "");
      const pairs: [string, string][] = [[ACTIVE_WORKSPACE_ITEM_KEY, itemId]];
      if (legacyId) pairs.push([ACTIVE_PROJECT_KEY, legacyId]);
      AsyncStorage.multiSet(pairs).catch(() => undefined);
    },
    fetchMe: async (providedToken) => {
      const token = providedToken || authToken;
      try {
        const res = await apiRequest<{ user: User }>("/api/auth/me", { token: token || undefined });
        setUser(res.user);
        return res.user;
      } catch {
        setUser(null);
        return null;
      }
    },
    fetchPersonalProfile: async (providedToken) => {
      try {
        const token = providedToken || authToken;
        const res = await apiRequest<{ profile: PersonalProfile }>("/api/personal-profile", { token: token || undefined });
        setPersonalProfile(res.profile);
        return res.profile;
      } catch (e) {
        console.error("Failed to fetch personal profile", e);
        return null;
      }
    },
    updatePersonalProfile: async (input) => {
      try {
        const res = await apiRequest<{ profile: PersonalProfile }>("/api/personal-profile", {
          method: "PATCH",
          token: authToken || undefined,
          body: JSON.stringify(input),
        });
        setPersonalProfile(res.profile);
        return res.profile;
      } catch (e) {
        console.error("Failed to update personal profile", e);
        throw e;
      }
    },
    fetchProjects: async () => {
      setLoading(true);
      try {
        const res = await apiRequest<{ projects: MobileProject[] }>("/api/projects", { token: authToken || undefined });
        setProjects(res.projects);
      } catch (e) {
        console.error("Failed to fetch projects", e);
      } finally {
        setLoading(false);
      }
    },
    fetchLearningData: async () => {
      if (!activeProjectId) return;
      setLoading(true);
      try {
        const res = await apiRequest<{ 
          courses: LearningCourse[], 
          modules: LearningModule[], 
          topics: LearningTopic[], 
          assessments: LearningAssessment[],
          sessions: LearningSession[], 
          assignments: LearningAssignment[] 
        }>(
          `/api/learning?projectId=${activeProjectId}`,
          { token: authToken || undefined }
        );
        setCourses(res.courses || []);
        setModules(res.modules || []);
        setTopics(res.topics || []);
        setAssessments(res.assessments || []);
        setSessions(res.sessions || []);
        setAssignments(res.assignments || []);
      } catch (e) {
        console.error("Failed to fetch learning data", e);
      } finally {
        setLoading(false);
      }
    },
    updateAssessmentScore: async (assessmentId, score) => {
      if (!activeProjectId) return;
      const previous = assessments;
      const today = new Date().toISOString().slice(0, 10);

      setAssessments(current => current.map(item => {
        if (item._id !== assessmentId) return item;
        return {
          ...item,
          achievedScore: score,
          status: score == null
            ? item.status
            : item.status === "passed_retake"
              ? "passed_retake"
              : "completed",
          completedDate: score == null ? item.completedDate : (item.completedDate || today),
        };
      }));

      try {
        const res = await apiRequest<{ assessment: LearningAssessment }>("/api/learning", {
          method: "PATCH",
          token: authToken || undefined,
          body: JSON.stringify({
            projectId: activeProjectId,
            assessmentId,
            achievedScore: score,
          }),
        });
        setAssessments(current => current.map(item => item._id === assessmentId ? res.assessment : item));
      } catch (error) {
        setAssessments(previous);
        console.error("Failed to update assessment score", error);
        throw error;
      }
    },
    fetchPhdPlan: async () => {
      if (!activeProjectId) return;
      setLoading(true);
      try {
        const res = await apiRequest<{ plan: PhdPlan }>("/api/phd-plan?projectId=" + activeProjectId, { token: authToken || undefined });
        setPhdPlan(res.plan);
      } catch (e) {
        console.error("Failed to fetch PhD plan", e);
      } finally {
        setLoading(false);
      }
    },
    fetchProjectDetails: async () => {
      if (!activeProjectId) return;
      setLoading(true);
      try {
        const res = await apiRequest<{ 
          stages: ResearchStage[], 
          tasks: Task[], 
          milestones: Milestone[], 
          budget: BudgetSummary,
          events: ResearchEvent[],
          participations: EventParticipation[]
        }>(
          `/api/projects/${activeProjectId}/details`,
          { token: authToken || undefined }
        );
        setStages(res.stages || []);
        setTasks(res.tasks || []);
        setMilestones(res.milestones || []);
        setBudgetSummary(res.budget || null);
        setEvents(res.events || []);
        setParticipations(res.participations || []);
      } catch (e) {
        console.error("Failed to fetch project details", e);
      } finally {
        setLoading(false);
      }
    },
    fetchDiaryEntries: async () => {
      if (!activeProjectId) return;
      try {
        const res = await apiRequest<DiaryEntry[]>("/api/records/diary?projectId=" + activeProjectId, { token: authToken || undefined });
        setDiaryEntries(res);
      } catch (e) {
        console.error("Failed to fetch diary entries", e);
      }
    },
    fetchNotifications: async () => {
      try {
        const res = await apiRequest<{ notifications: AppNotification[], unread: number }>("/api/notifications", { token: authToken || undefined });
        setNotifications(res.notifications);
        setUnreadCount(res.unread);
      } catch (e) {
        console.error("Failed to fetch notifications", e);
      }
    },
    markNotificationsRead: async (ids) => {
      try {
        await apiRequest("/api/notifications", {
          method: "PATCH",
          token: authToken || undefined,
          body: JSON.stringify({ ids }),
        });
        await store.fetchNotifications();
      } catch (e) {
        console.error("Failed to mark notifications read", e);
      }
    },
    fetchLibraryItems: async () => {
      if (!activeProjectId) return;
      try {
        const res = await apiRequest<{ items: LibraryItem[] }>("/api/library?projectId=" + activeProjectId, { token: authToken || undefined });
        setLibraryItems(res.items);
      } catch (e) {
        console.error("Failed to fetch library items", e);
      }
    },
    fetchChatMessages: async (silent = false) => {
      if (!activeProjectId) return;
      try {
        const res = await apiRequest<{ messages: ChatMessage[] }>("/api/chat/messages?projectId=" + activeProjectId, { token: authToken || undefined });
        
        // Detect new messages for local alert if not in chat
        if (silent && res.messages.length > chatMessages.length) {
          const newMsg = res.messages[res.messages.length - 1];
          if (newMsg.userId !== user?._id) {
            triggerLocalAlert(`Чат: ${newMsg.displayName}`, newMsg.content);
          }
        }
        
        setChatMessages(res.messages);
      } catch (e) {
        if (!silent) console.error("Failed to fetch chat messages", e);
      }
    },
    sendChatMessage: async (content) => {
      if (!activeProjectId) return;
      try {
        await apiRequest("/api/chat/messages", {
          method: "POST",
          token: authToken || undefined,
          body: JSON.stringify({ projectId: activeProjectId, content }),
        });
        await store.fetchChatMessages();
      } catch (e) {
        console.error("Failed to send chat message", e);
        throw e;
      }
    },
    fetchAlmanac: async () => {
      if (!activeProjectId) return;
      try {
        const res = await apiRequest<{ events: AlmanacEvent[] }>("/api/almanac?projectId=" + activeProjectId, { token: authToken || undefined });
        setAlmanacEvents(res.events);
      } catch (e) {
        console.error("Failed to fetch almanac", e);
      }
    },
    fetchLabInventory: async () => {
      if (!activeProjectId) return;
      try {
        const res = await apiRequest<{ items: LabInventoryItem[] }>("/api/laboratory/inventory?projectId=" + activeProjectId, { token: authToken || undefined });
        setLabInventory(res.items);
      } catch (e) {
        console.error("Failed to fetch lab inventory", e);
      }
    },
    fetchLabEquipment: async () => {
      if (!activeProjectId) return;
      try {
        const res = await apiRequest<{ equipment: LabEquipment[] }>("/api/laboratory/equipment?projectId=" + activeProjectId, { token: authToken || undefined });
        setLabEquipment(res.equipment);
      } catch (e) {
        console.error("Failed to fetch lab equipment", e);
      }
    },
    fetchLabEquipmentLogs: async (equipmentId: string) => {
      try {
        const res = await apiRequest<{ logs: EquipmentLog[] }>(`/api/laboratory/equipment/${equipmentId}/logs`, { token: authToken || undefined });
        setLabEquipmentLogs(prev => ({ ...prev, [equipmentId]: res.logs }));
      } catch (e) {
        console.error("Failed to fetch equipment logs", e);
      }
    },
    addEquipmentLog: async (equipmentId: string, logData: any) => {
      if (!activeProjectId) return;
      try {
        await apiRequest(`/api/laboratory/equipment/${equipmentId}/logs`, {
          method: "POST",
          token: authToken || undefined,
          body: JSON.stringify({ ...logData, projectId: activeProjectId }),
        });
        await store.fetchLabEquipmentLogs(equipmentId);
      } catch (e) {
        console.error("Failed to add equipment log", e);
        throw e;
      }
    },
    createInventoryItem: async (data: Partial<LabInventoryItem>) => {
      if (!activeProjectId) throw new Error("No active project");
      const res = await apiRequest<{ item: LabInventoryItem }>("/api/laboratory/inventory", {
        method: "POST",
        token: authToken || undefined,
        body: JSON.stringify({ ...data, projectId: activeProjectId }),
      });
      setLabInventory(prev => [...prev, res.item]);
      return res.item;
    },
    updateInventoryItem: async (id: string, data: Partial<LabInventoryItem>) => {
      const res = await apiRequest<{ item: LabInventoryItem }>(`/api/laboratory/inventory/${id}`, {
        method: "PATCH",
        token: authToken || undefined,
        body: JSON.stringify(data),
      });
      setLabInventory(prev => prev.map(i => i._id === id ? res.item : i));
    },
    deleteInventoryItem: async (id: string) => {
      await apiRequest(`/api/laboratory/inventory/${id}`, {
        method: "DELETE",
        token: authToken || undefined,
      });
      setLabInventory(prev => prev.filter(i => i._id !== id));
    },
    createEquipment: async (data: Partial<LabEquipment>) => {
      if (!activeProjectId) throw new Error("No active project");
      const res = await apiRequest<{ equipment: LabEquipment }>("/api/laboratory/equipment", {
        method: "POST",
        token: authToken || undefined,
        body: JSON.stringify({ ...data, projectId: activeProjectId }),
      });
      setLabEquipment(prev => [...prev, res.equipment]);
      return res.equipment;
    },
    updateEquipment: async (id: string, data: Partial<LabEquipment>) => {
      const res = await apiRequest<{ equipment: LabEquipment }>(`/api/laboratory/equipment/${id}`, {
        method: "PATCH",
        token: authToken || undefined,
        body: JSON.stringify(data),
      });
      setLabEquipment(prev => prev.map(e => e._id === id ? res.equipment : e));
    },
    deleteEquipment: async (id: string) => {
      await apiRequest(`/api/laboratory/equipment/${id}`, {
        method: "DELETE",
        token: authToken || undefined,
      });
      setLabEquipment(prev => prev.filter(e => e._id !== id));
    },
    fetchLabExperiments: async () => {
      if (!activeProjectId) return;
      try {
        const res = await apiRequest<{ experiments: LabExperiment[] }>("/api/laboratory/experiments?projectId=" + activeProjectId, { token: authToken || undefined });
        setLabExperiments(res.experiments || []);
      } catch (e) {
        console.error("Failed to fetch lab experiments", e);
      }
    },
    createExperiment: async (data: Partial<LabExperiment>) => {
      if (!activeProjectId) throw new Error("No active project");
      const res = await apiRequest<{ experiment: LabExperiment }>("/api/laboratory/experiments", {
        method: "POST",
        token: authToken || undefined,
        body: JSON.stringify({ ...data, projectId: activeProjectId }),
      });
      setLabExperiments(prev => [res.experiment, ...prev]);
      return res.experiment;
    },
    updateExperiment: async (id: string, data: Partial<LabExperiment>) => {
      const res = await apiRequest<{ experiment: LabExperiment }>(`/api/laboratory/experiments/${id}`, {
        method: "PATCH",
        token: authToken || undefined,
        body: JSON.stringify(data),
      });
      setLabExperiments(prev => prev.map(e => e._id === id ? res.experiment : e));
    },
    deleteExperiment: async (id: string) => {
      await apiRequest(`/api/laboratory/experiments/${id}`, {
        method: "DELETE",
        token: authToken || undefined,
      });
      setLabExperiments(prev => prev.filter(e => e._id !== id));
    },
    addReagentRequest: (data) => {
      const req: LabReagentRequest = {
        ...data,
        id: `${Date.now()}`,
        projectId: activeProjectId || "",
        createdAt: new Date().toISOString(),
      };
      setReagentRequests(prev => [req, ...prev]);
      return req;
    },
    removeReagentRequest: (id: string) => {
      setReagentRequests(prev => prev.filter(r => r.id !== id));
    },
    clearReagentRequests: () => setReagentRequests([]),
    saveInspection: (data) => {
      const inspection: SafetyInspection = {
        ...data,
        id: `${Date.now()}`,
        projectId: activeProjectId || "",
      };
      setSafetyInspections(prev => [inspection, ...prev]);
      return inspection;
    },
    removeInspection: (id: string) => {
      setSafetyInspections(prev => prev.filter(i => i.id !== id));
    },
    mySubjects,
    addMySubject: (data) => {
      const subject: MySubject = { ...data, id: `subj_${Date.now()}` };
      const next = [...mySubjects, subject];
      setMySubjects(next);
      AsyncStorage.setItem(MY_SUBJECTS_KEY, JSON.stringify(next));
      return subject;
    },
    updateMySubject: (id, patch) => {
      const next = mySubjects.map(s => s.id === id ? { ...s, ...patch } : s);
      setMySubjects(next);
      AsyncStorage.setItem(MY_SUBJECTS_KEY, JSON.stringify(next));
    },
    deleteMySubject: (id) => {
      const next = mySubjects.filter(s => s.id !== id);
      setMySubjects(next);
      AsyncStorage.setItem(MY_SUBJECTS_KEY, JSON.stringify(next));
    },
    addWasteRecord: (data) => {
      const record: WasteRecord = {
        ...data,
        id: `${Date.now()}`,
        projectId: activeProjectId || "",
        createdAt: new Date().toISOString(),
      };
      setWasteRecords(prev => [record, ...prev]);
      return record;
    },
    removeWasteRecord: (id: string) => {
      setWasteRecords(prev => prev.filter(r => r.id !== id));
    },
    addLabBooking: (data) => {
      // Conflict check: same equipment, same date, overlapping time
      const conflict = labBookings.some(b =>
        b.status === "confirmed" &&
        b.equipmentId === data.equipmentId &&
        b.date === data.date &&
        data.startTime < b.endTime &&
        data.endTime > b.startTime
      );
      if (conflict) return null;
      const booking: LabBooking = {
        ...data,
        id: `${Date.now()}`,
        projectId: activeProjectId || "",
        status: "confirmed",
        createdAt: new Date().toISOString(),
      };
      setLabBookings(prev => [...prev, booking]);
      pushActivity({
        category: "booking", action: "booking_created",
        targetType: "equipment", targetId: booking.equipmentId, targetTitle: booking.equipmentName,
        emoji: "📅", description: `Заброньовано "${booking.equipmentName}" на ${booking.date} ${booking.startTime}–${booking.endTime}`,
        metadata: { purpose: booking.purpose },
      });
      return booking;
    },
    cancelLabBooking: (id: string) => {
      const b = labBookings.find(x => x.id === id);
      setLabBookings(prev => prev.map(b => b.id === id ? { ...b, status: "cancelled" } : b));
      if (b) {
        pushActivity({
          category: "booking", action: "booking_cancelled",
          targetType: "equipment", targetId: b.equipmentId, targetTitle: b.equipmentName,
          emoji: "❌", description: `Скасовано бронювання "${b.equipmentName}" на ${b.date}`,
        });
      }
    },
    logLabAccess: (action, zone, notes = "") => {
      const entry: LabAccessLog = {
        id: `${Date.now()}`,
        projectId: activeProjectId || "",
        userId: user?._id || "",
        userName: user ? `${user.firstName} ${user.lastName}` : "Анонім",
        action,
        zone,
        timestamp: new Date().toISOString(),
        notes,
      };
      setLabAccessLogs(prev => [entry, ...prev]);
      pushActivity({
        category: "access", action: action === "enter" ? "lab_enter" : "lab_exit",
        targetType: "zone", targetTitle: zone,
        emoji: action === "enter" ? "🚪" : "🚶",
        description: action === "enter" ? `Увійшов до ${zone}` : `Вийшов з ${zone}`,
      });
      return entry;
    },
    setEquipmentBsl: (equipmentId, bslRequired) => {
      setLabEquipmentAccess(prev => {
        const existing = prev.find(e => e.equipmentId === equipmentId);
        if (existing) return prev.map(e => e.equipmentId === equipmentId ? { ...e, bslRequired } : e);
        return [...prev, { equipmentId, bslRequired }];
      });
    },
    setUserRole: (role) => {
      setUserRoleState(role);
      if (role) {
        AsyncStorage.setItem(LAB_USER_ROLE_KEY, role).catch(() => undefined);
      } else {
        AsyncStorage.removeItem(LAB_USER_ROLE_KEY).catch(() => undefined);
      }
    },
    startLabRun: (data) => {
      const run: LabRun = {
        id: `run_${Date.now()}`,
        projectId: activeProjectId || "",
        presetId: data.presetId,
        presetLabel: data.presetLabel,
        emoji: data.emoji,
        status: "in_progress",
        startedAt: new Date().toISOString(),
        inputs: data.inputs || [],
        measurements: [],
        notes: data.notes || "",
      };
      setLabRuns(prev => [run, ...prev]);
      pushActivity({
        category: "run", action: "run_started",
        targetType: "run", targetId: run.id, targetTitle: run.presetLabel,
        emoji: run.emoji, description: `Розпочато ${run.presetLabel}`,
      });
      return run;
    },
    addRunMeasurement: (runId, m) => {
      setLabRuns(prev => prev.map(r => r.id === runId
        ? { ...r, measurements: [...r.measurements, { ...m, id: `m_${Date.now()}`, timestamp: new Date().toISOString() }] }
        : r));
    },
    addRunInput: (runId, input) => {
      setLabRuns(prev => prev.map(r => {
        if (r.id !== runId) return r;
        if (r.inputs.some(i => i.refId === input.refId && i.kind === input.kind)) return r;
        return { ...r, inputs: [...r.inputs, input] };
      }));
    },
    removeRunInput: (runId, refId) => {
      setLabRuns(prev => prev.map(r => r.id === runId
        ? { ...r, inputs: r.inputs.filter(i => i.refId !== refId) }
        : r));
    },
    updateRunNotes: (runId, notes) => {
      setLabRuns(prev => prev.map(r => r.id === runId ? { ...r, notes } : r));
    },
    completeLabRun: async (runId, result) => {
      const now = new Date();
      let completed: LabRun | null = null;
      setLabRuns(prev => prev.map(r => {
        if (r.id !== runId) return r;
        const duration = Math.max(0, Math.round((now.getTime() - new Date(r.startedAt).getTime()) / 1000));
        completed = { ...r, status: "completed", completedAt: now.toISOString(), durationSec: duration, result };
        return completed;
      }));
      if (completed) {
        const run = completed as LabRun;
        pushActivity({
          category: "run", action: "run_completed",
          targetType: "run", targetId: run.id, targetTitle: run.presetLabel,
          emoji: run.emoji, description: `Завершено ${run.presetLabel} · ${run.measurements.length} замірів`,
          metadata: { durationSec: run.durationSec, measurements: run.measurements.length },
        });
      }
      // Auto-log to diary
      if (completed && activeProjectId) {
        const run = completed as LabRun;
        const measurementLines = run.measurements
          .map(m => `• ${m.label}: ${m.value} ${m.unit}`)
          .join("\n");
        const inputLines = run.inputs
          .map(i => `• ${i.kind === "reagent" ? "Реагент" : i.kind === "equipment" ? "Прилад" : "Зразок"}: ${i.name}${i.hint ? ` (${i.hint})` : ""}`)
          .join("\n");
        const body = [
          run.result ? `Результат: ${run.result}` : "",
          inputLines ? `\nВикористано:\n${inputLines}` : "",
          measurementLines ? `\nВимірювання:\n${measurementLines}` : "",
          run.notes ? `\nНотатки: ${run.notes}` : "",
          `\nТривалість: ${Math.round((run.durationSec || 0) / 60)} хв`,
        ].filter(Boolean).join("");
        try {
          await apiRequest("/api/records/diary", {
            method: "POST",
            token: authToken || undefined,
            body: JSON.stringify({
              projectId: activeProjectId,
              type: "result",
              title: `${run.emoji} ${run.presetLabel}`,
              body,
              date: now.toISOString().split("T")[0],
              tags: ["quick-run", run.presetId],
            }),
          });
          await store.fetchDiaryEntries();
        } catch (e) {
          // local-only fallback — додамо в drafts
          const draft: QuickDraft = {
            id: `${Date.now()}`,
            body,
            title: `${run.emoji} ${run.presetLabel}`,
            type: "result",
            createdAt: now.toISOString(),
            projectId: activeProjectId,
          };
          setDrafts(curr => [draft, ...curr]);
        }
      }
      return completed;
    },
    abortLabRun: (runId) => {
      const now = new Date().toISOString();
      const run = labRuns.find(r => r.id === runId);
      setLabRuns(prev => prev.map(r => r.id === runId ? { ...r, status: "aborted", completedAt: now } : r));
      if (run) {
        pushActivity({
          category: "run", action: "run_aborted",
          targetType: "run", targetId: run.id, targetTitle: run.presetLabel,
          emoji: run.emoji, description: `Скасовано ${run.presetLabel}`,
        });
      }
    },
    deleteLabRun: (runId) => {
      setLabRuns(prev => prev.filter(r => r.id !== runId));
    },
    createMethodology: (data) => {
      const now = new Date().toISOString();
      const isPublished = data.status === "published";
      const method: LabMethodology = {
        id: `meth_${Date.now()}`,
        projectId: activeProjectId || "",
        courseId: data.courseId,
        instructorId: user?._id || "",
        instructorName: user ? `${user.firstName} ${user.lastName}` : "Інструктор",
        title: data.title || "Нова методичка",
        emoji: data.emoji || "📋",
        description: data.description || "",
        procedureSteps: data.procedureSteps || [],
        materials: data.materials || [],
        safetyNotes: data.safetyNotes || "",
        expectedResults: data.expectedResults || "",
        gradingCriteria: data.gradingCriteria || [],
        maxScore: data.maxScore ?? 100,
        durationMinutes: data.durationMinutes ?? 90,
        bslLevel: data.bslLevel || "BSL-1",
        status: data.status || "draft",
        createdAt: now,
        updatedAt: now,
      };
      setLabMethodologies(prev => [method, ...prev]);
      pushActivity({
        category: "methodology", action: isPublished ? "methodology_published" : "methodology_created",
        targetType: "methodology", targetId: method.id, targetTitle: method.title,
        emoji: method.emoji, description: isPublished ? `Опубліковано методичку "${method.title}"` : `Створено чернетку "${method.title}"`,
      });
      return method;
    },
    updateMethodology: (id, data) => {
      setLabMethodologies(prev => prev.map(m => m.id === id ? { ...m, ...data, updatedAt: new Date().toISOString() } : m));
    },
    publishMethodology: (id) => {
      const m = labMethodologies.find(x => x.id === id);
      setLabMethodologies(prev => prev.map(m => m.id === id ? { ...m, status: "published", updatedAt: new Date().toISOString() } : m));
      if (m && m.status !== "published") {
        pushActivity({
          category: "methodology", action: "methodology_published",
          targetType: "methodology", targetId: m.id, targetTitle: m.title,
          emoji: m.emoji, description: `Опубліковано методичку "${m.title}"`,
        });
      }
    },
    deleteMethodology: (id) => {
      setLabMethodologies(prev => prev.filter(m => m.id !== id));
      setLabCourseSessions(prev => prev.filter(s => s.methodologyId !== id));
    },
    assignSession: (methodologyId, studentName) => {
      const method = labMethodologies.find(m => m.id === methodologyId);
      if (!method) return null;
      const session: LabCourseSession = {
        id: `sess_${Date.now()}`,
        projectId: activeProjectId || "",
        methodologyId,
        methodologyTitle: method.title,
        methodologyEmoji: method.emoji,
        courseId: method.courseId,
        studentId: user?._id || "",
        studentName: studentName || (user ? `${user.firstName} ${user.lastName}` : "Студент"),
        status: "assigned",
        stepProgress: method.procedureSteps.map(s => ({ stepId: s.id, completed: false, notes: "" })),
        linkedRunIds: [],
        submissionNotes: "",
        conclusions: "",
        maxScore: method.maxScore,
        breakdown: [],
        instructorFeedback: "",
        createdAt: new Date().toISOString(),
      };
      setLabCourseSessions(prev => [session, ...prev]);
      pushActivity({
        category: "session", action: "session_assigned",
        targetType: "session", targetId: session.id, targetTitle: method.title,
        emoji: method.emoji, description: `Розпочато лабораторну "${method.title}"`,
      });
      return session;
    },
    startSession: (sessionId) => {
      setLabCourseSessions(prev => prev.map(s => s.id === sessionId && s.status === "assigned"
        ? { ...s, status: "in_progress", startedAt: new Date().toISOString() }
        : s));
    },
    toggleSessionStep: (sessionId, stepId, notes) => {
      setLabCourseSessions(prev => prev.map(s => {
        if (s.id !== sessionId) return s;
        const stepProgress = s.stepProgress.map(p => {
          if (p.stepId !== stepId) return p;
          const completed = !p.completed;
          return {
            ...p,
            completed,
            notes: notes ?? p.notes,
            completedAt: completed ? new Date().toISOString() : undefined,
          };
        });
        return { ...s, stepProgress, status: s.status === "assigned" ? "in_progress" : s.status, startedAt: s.startedAt || new Date().toISOString() };
      }));
    },
    linkRunToSession: (sessionId, runId) => {
      setLabCourseSessions(prev => prev.map(s => {
        if (s.id !== sessionId) return s;
        if (s.linkedRunIds.includes(runId)) return s;
        return { ...s, linkedRunIds: [...s.linkedRunIds, runId] };
      }));
    },
    updateSessionSubmission: (sessionId, data) => {
      setLabCourseSessions(prev => prev.map(s => s.id === sessionId
        ? { ...s, submissionNotes: data.submissionNotes ?? s.submissionNotes, conclusions: data.conclusions ?? s.conclusions }
        : s));
    },
    submitSession: (sessionId) => {
      const s = labCourseSessions.find(x => x.id === sessionId);
      setLabCourseSessions(prev => prev.map(s => s.id === sessionId
        ? { ...s, status: "submitted", submittedAt: new Date().toISOString() }
        : s));
      if (s) {
        pushActivity({
          category: "session", action: "session_submitted",
          targetType: "session", targetId: s.id, targetTitle: s.methodologyTitle,
          emoji: s.methodologyEmoji, description: `Здано на оцінювання "${s.methodologyTitle}"`,
        });
      }
    },
    gradeSession: (sessionId, grade) => {
      const s = labCourseSessions.find(x => x.id === sessionId);
      setLabCourseSessions(prev => prev.map(s => s.id === sessionId
        ? { ...s, status: "graded", gradedAt: new Date().toISOString(), totalScore: grade.totalScore, breakdown: grade.breakdown, instructorFeedback: grade.feedback }
        : s));
      if (s) {
        pushActivity({
          category: "session", action: "session_graded",
          targetType: "session", targetId: s.id, targetTitle: s.methodologyTitle,
          emoji: s.methodologyEmoji, description: `Оцінено: ${grade.totalScore}/${s.maxScore} — ${s.studentName}`,
          metadata: { score: grade.totalScore, maxScore: s.maxScore, studentName: s.studentName },
        });
      }
    },
    returnSession: (sessionId, feedback) => {
      const s = labCourseSessions.find(x => x.id === sessionId);
      setLabCourseSessions(prev => prev.map(s => s.id === sessionId
        ? { ...s, status: "returned", instructorFeedback: feedback }
        : s));
      if (s) {
        pushActivity({
          category: "session", action: "session_returned",
          targetType: "session", targetId: s.id, targetTitle: s.methodologyTitle,
          emoji: s.methodologyEmoji, description: `Повернено на доопрацювання — ${s.studentName}`,
        });
      }
    },
    deleteSession: (sessionId) => {
      setLabCourseSessions(prev => prev.filter(s => s.id !== sessionId));
    },
    recordActivity: (a) => {
      const entry: LabActivity = {
        ...a,
        id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        projectId: activeProjectId || "",
        actorId: user?._id || "",
        actorName: user ? `${user.firstName} ${user.lastName}` : "Анонім",
        timestamp: new Date().toISOString(),
      };
      setLabActivity(prev => [entry, ...prev]);
    },
    clearActivity: () => setLabActivity([]),

    // ── Workspaces (контейнери) ─────────────────────────────────────────
    createWorkspace: (data) => {
      const now = new Date().toISOString();
      const ws: Workspace = {
        id: `ws_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
        name: data.name,
        emoji: data.emoji || (data.template ? WORKSPACE_TEMPLATES[data.template].emoji : "📋"),
        color: data.color || (data.template ? WORKSPACE_TEMPLATES[data.template].color : "#0f766e"),
        ownerId: user?._id || "anonymous",
        isDefault: false,
        template: data.template,
        description: data.description,
        createdAt: now,
        updatedAt: now,
      };
      setWorkspaces(prev => [...prev, ws]);
      return ws;
    },
    renameWorkspace: (id, name) => {
      setWorkspaces(prev => prev.map(w => w.id === id ? { ...w, name, updatedAt: new Date().toISOString() } : w));
    },
    updateWorkspace: (id, patch) => {
      setWorkspaces(prev => prev.map(w => w.id === id ? { ...w, ...patch, updatedAt: new Date().toISOString() } : w));
    },
    deleteWorkspace: (id) => {
      const target = workspaces.find(w => w.id === id);
      if (!target || target.isDefault) return;
      // Items, що залишилися без workspaces → переносимо до default
      const defaultWs = workspaces.find(w => w.isDefault) || workspaces.find(w => w.id !== id);
      setWorkspaceItems(prev => prev.map(it => {
        const remaining = it.workspaceIds.filter(wid => wid !== id);
        if (remaining.length === 0 && defaultWs) {
          return { ...it, workspaceIds: [defaultWs.id] };
        }
        return { ...it, workspaceIds: remaining };
      }));
      setWorkspaces(prev => prev.filter(w => w.id !== id));
      // Switch active якщо видаляємо активний
      if (activeWorkspaceId === id && defaultWs) {
        setActiveWorkspaceIdState(defaultWs.id);
      }
    },
    setActiveWorkspace: (id) => {
      setActiveWorkspaceIdState(id);
    },

    // ── API sync ─────────────────────────────────────────────────────
    fetchWorkspacesFromApi: async () => {
      try {
        const res = await apiRequest<{ workspaces: any[] }>("/api/workspaces", { token: authToken || undefined });
        const remote: Workspace[] = (res.workspaces || []).map((w) => ({
          id: w._id,
          name: w.name,
          emoji: w.emoji,
          color: w.color,
          ownerId: w.ownerId,
          isDefault: w.isDefault,
          template: w.template,
          description: w.description,
          createdAt: w.createdAt,
          updatedAt: w.updatedAt,
        }));
        // Remote — єдине джерело істини: повна заміна.
        setWorkspaces(remote);
        // Якщо активний workspace відсутній у remote — переключаємось на default з remote
        if (!activeWorkspaceId || !remote.some((w) => w.id === activeWorkspaceId)) {
          const def = remote.find((w) => w.isDefault) || remote[0];
          if (def) setActiveWorkspaceIdState(def.id);
        }
      } catch (e) {
        console.error("[workspaces] fetch failed", e);
      }
    },
    fetchItemsFromApi: async (workspaceId) => {
      try {
        const url = workspaceId
          ? `/api/workspace-items?workspaceId=${encodeURIComponent(workspaceId)}`
          : "/api/workspace-items";
        const res = await apiRequest<{ items: any[] }>(url, { token: authToken || undefined });
        const remote: WorkspaceItem[] = (res.items || []).map((it) => ({
          id: it._id,
          type: it.type,
          title: it.title,
          description: it.description,
          emoji: it.emoji,
          status: it.status,
          visibility: it.visibility,
          ownerId: it.ownerId,
          ownerName: it.ownerName,
          members: it.members || [],
          workspaceIds: it.workspaceIds || [],
          parentItemId: it.parentItemId,
          supervisor: it.supervisor,
          startDate: it.startDate,
          plannedEndDate: it.plannedEndDate,
          tags: it.tags || [],
          fields: it.fields || {},
          legacyProjectId: it.legacyProjectId,
          createdAt: it.createdAt,
          updatedAt: it.updatedAt,
        }));
        if (workspaceId) {
          // Фільтрований fetch — замінюємо тільки items цього workspace,
          // решту (інших workspace) залишаємо.
          setWorkspaceItems((prev) => {
            const others = prev.filter((it) => !it.workspaceIds.includes(workspaceId));
            return [...remote, ...others];
          });
        } else {
          // Повний fetch — API повертає ВСІ items: просто замінюємо цілком.
          setWorkspaceItems(remote);
        }
      } catch (e) {
        console.error("[items] fetch failed", e);
      }
    },
    fetchLinkedItems: async (itemId) => {
      try {
        const res = await apiRequest<{ items: any[] }>(
          `/api/item-relations?itemId=${encodeURIComponent(itemId)}`,
          { token: authToken || undefined },
        );
        const linked: WorkspaceItem[] = (res.items || []).map((it) => ({
          id: it._id,
          type: it.type,
          title: it.title,
          description: it.description,
          emoji: it.emoji,
          status: it.status,
          visibility: it.visibility,
          ownerId: it.ownerId,
          ownerName: it.ownerName,
          members: it.members || [],
          workspaceIds: it.workspaceIds || [],
          parentItemId: it.parentItemId,
          supervisor: it.supervisor,
          startDate: it.startDate,
          plannedEndDate: it.plannedEndDate,
          tags: it.tags || [],
          fields: it.fields || {},
          legacyProjectId: it.legacyProjectId,
          createdAt: it.createdAt,
          updatedAt: it.updatedAt,
        }));
        setLinkedItemsMap((prev) => ({ ...prev, [itemId]: linked }));
      } catch (e) {
        console.error("[linked-items] fetch failed", e);
      }
    },
    linkItemViaApi: async (itemId, targetId) => {
      try {
        await apiRequest("/api/item-relations", {
          method: "POST",
          token: authToken || undefined,
          body: JSON.stringify({ itemId, targetId }),
        });
        // optimistic: додаємо targetId до існуючого списку
        const allItems = [...workspaceItems];
        const target = allItems.find((it) => it.id === targetId);
        if (target) {
          setLinkedItemsMap((prev) => ({
            ...prev,
            [itemId]: [...(prev[itemId] || []).filter((i) => i.id !== targetId), target],
          }));
        }
      } catch (e) {
        console.error("[linked-items] link failed", e);
      }
    },
    unlinkItemViaApi: async (itemId, targetId) => {
      try {
        await apiRequest(
          `/api/item-relations?itemId=${encodeURIComponent(itemId)}&targetId=${encodeURIComponent(targetId)}`,
          { method: "DELETE", token: authToken || undefined },
        );
        setLinkedItemsMap((prev) => ({
          ...prev,
          [itemId]: (prev[itemId] || []).filter((i) => i.id !== targetId),
        }));
      } catch (e) {
        console.error("[linked-items] unlink failed", e);
      }
    },
    createWorkspaceViaApi: async (data) => {
      try {
        const res = await apiRequest<{ workspace: any }>("/api/workspaces", {
          method: "POST",
          token: authToken || undefined,
          body: JSON.stringify(data),
        });
        if (!res.workspace) return null;
        const ws: Workspace = {
          id: res.workspace._id,
          name: res.workspace.name,
          emoji: res.workspace.emoji,
          color: res.workspace.color,
          ownerId: res.workspace.ownerId,
          isDefault: res.workspace.isDefault,
          template: res.workspace.template,
          description: res.workspace.description,
          createdAt: res.workspace.createdAt,
          updatedAt: res.workspace.updatedAt,
        };
        setWorkspaces((prev) => [...prev, ws]);
        return ws;
      } catch (e) {
        console.error("[workspaces] create failed", e);
        return null;
      }
    },
    createItemViaApi: async (data) => {
      try {
        const res = await apiRequest<{ item: any }>("/api/workspace-items", {
          method: "POST",
          token: authToken || undefined,
          body: JSON.stringify(data),
        });
        if (!res.item) return null;
        const it: WorkspaceItem = {
          id: res.item._id,
          type: res.item.type,
          title: res.item.title,
          description: res.item.description,
          emoji: res.item.emoji,
          status: res.item.status,
          visibility: res.item.visibility,
          ownerId: res.item.ownerId,
          ownerName: res.item.ownerName,
          members: res.item.members || [],
          workspaceIds: res.item.workspaceIds || [],
          parentItemId: res.item.parentItemId,
          supervisor: res.item.supervisor,
          startDate: res.item.startDate,
          plannedEndDate: res.item.plannedEndDate,
          tags: res.item.tags || [],
          fields: res.item.fields || {},
          legacyProjectId: res.item.legacyProjectId,
          createdAt: res.item.createdAt,
          updatedAt: res.item.updatedAt,
        };
        setWorkspaceItems((prev) => [it, ...prev]);
        return it;
      } catch (e) {
        console.error("[items] create failed", e);
        return null;
      }
    },

    // ── Workspace Items ──────────────────────────────────────────────────
    createWorkspaceItem: (data) => {
      const now = new Date().toISOString();
      const meta = ITEM_TYPE_REGISTRY[data.type];
      const defaultWsId = activeWorkspaceId || workspaces[0]?.id;
      const wsIds = (data.workspaceIds && data.workspaceIds.length > 0)
        ? data.workspaceIds
        : (defaultWsId ? [defaultWsId] : []);
      const item: WorkspaceItem = {
        id: `it_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        type: data.type,
        title: data.title,
        description: data.description || "",
        emoji: data.emoji || meta.emoji,
        status: data.status || "draft",
        visibility: data.visibility || meta.defaultVisibility,
        ownerId: user?._id || "anonymous",
        ownerName: user ? `${user.firstName} ${user.lastName}` : "Анонім",
        members: data.members || [],
        workspaceIds: wsIds,
        parentItemId: data.parentItemId,
        supervisor: data.supervisor,
        startDate: data.startDate,
        plannedEndDate: data.plannedEndDate,
        tags: data.tags || [],
        fields: data.fields || {},
        legacyProjectId: data.legacyProjectId,
        createdAt: now,
        updatedAt: now,
      };
      setWorkspaceItems(prev => [item, ...prev]);
      pushActivity({
        category: "other", action: "methodology_created" as any, // generic for now
        targetType: "item", targetId: item.id, targetTitle: item.title,
        emoji: item.emoji, description: `Створено ${meta.label}: "${item.title}"`,
      });
      return item;
    },
    updateWorkspaceItem: (id, patch) => {
      setWorkspaceItems(prev => prev.map(it => it.id === id
        ? { ...it, ...patch, updatedAt: new Date().toISOString() }
        : it));
    },
    deleteWorkspaceItem: (id) => {
      setWorkspaceItems(prev => prev.filter(it => it.id !== id));
      setItemRelations(prev => prev.filter(r => r.fromItemId !== id && r.toItemId !== id));
      setPinnedItemIds(prev => prev.filter(p => p !== id));
    },
    archiveWorkspaceItem: (id) => {
      setWorkspaceItems(prev => prev.map(it => it.id === id ? { ...it, status: "archived" as ItemStatus, updatedAt: new Date().toISOString() } : it));
    },
    setItemPinned: (id, pinned) => {
      setPinnedItemIds(prev => pinned
        ? (prev.includes(id) ? prev : [id, ...prev])
        : prev.filter(p => p !== id));
    },
    addItemMember: (itemId, member) => {
      setWorkspaceItems(prev => prev.map(it => {
        if (it.id !== itemId) return it;
        if (it.members.some(m => m.userId === member.userId)) return it;
        return { ...it, members: [...it.members, member], updatedAt: new Date().toISOString() };
      }));
    },
    removeItemMember: (itemId, userId) => {
      setWorkspaceItems(prev => prev.map(it => {
        if (it.id !== itemId) return it;
        return { ...it, members: it.members.filter(m => m.userId !== userId), updatedAt: new Date().toISOString() };
      }));
    },
    addItemToWorkspace: (itemId, workspaceId) => {
      setWorkspaceItems(prev => prev.map(it => {
        if (it.id !== itemId) return it;
        if (it.workspaceIds.includes(workspaceId)) return it;
        return { ...it, workspaceIds: [...it.workspaceIds, workspaceId], updatedAt: new Date().toISOString() };
      }));
    },
    removeItemFromWorkspace: (itemId, workspaceId) => {
      setWorkspaceItems(prev => prev.map(it => {
        if (it.id !== itemId) return it;
        const remaining = it.workspaceIds.filter(wid => wid !== workspaceId);
        // Якщо це останній простір — залишити (Item стане orphan, але не зникне)
        if (remaining.length === 0) return it;
        return { ...it, workspaceIds: remaining, updatedAt: new Date().toISOString() };
      }));
    },
    addItemRelation: (fromId, toId, type, note) => {
      if (fromId === toId) return null;
      // duplicate guard
      const exists = itemRelations.some(r => r.fromItemId === fromId && r.toItemId === toId && r.relationType === type);
      if (exists) return null;
      const rel: ItemRelation = {
        id: `rel_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        fromItemId: fromId, toItemId: toId, relationType: type, note,
        createdAt: new Date().toISOString(),
      };
      setItemRelations(prev => [rel, ...prev]);
      return rel;
    },
    removeItemRelation: (relationId) => {
      setItemRelations(prev => prev.filter(r => r.id !== relationId));
    },
    getRelatedItems: (itemId) => {
      const outgoing = itemRelations.filter(r => r.fromItemId === itemId);
      const incoming = itemRelations.filter(r => r.toItemId === itemId);
      return { incoming, outgoing };
    },
    getAllItems: () => {
      // Workspace items + projects-as-items адаптер (без mutations)
      const defaultWsId = workspaces.find(w => w.isDefault)?.id || workspaces[0]?.id || "";
      const projectItems: WorkspaceItem[] = projects
        .filter(p => !workspaceItems.some(it => it.legacyProjectId === String(p.id)))
        .map(p => {
          const itemType: ItemType = p.projectType === "laboratory" ? "laboratory" : "individual_research";
          const meta = ITEM_TYPE_REGISTRY[itemType];
          return {
            id: `legacy_${p.id}`,
            type: itemType,
            title: p.title,
            description: "",
            emoji: meta.emoji,
            status: "active" as ItemStatus,
            visibility: meta.defaultVisibility,
            ownerId: user?._id || "",
            ownerName: user ? `${user.firstName} ${user.lastName}` : "",
            members: [],
            workspaceIds: defaultWsId ? [defaultWsId] : [],
            tags: [p.acronym].filter(Boolean) as string[],
            fields: itemType === "laboratory"
              ? { bslLevel: (p as any).safetyLevel, roomNumber: p.roomNumber } as ItemFields
              : {},
            legacyProjectId: String(p.id),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        });
      return [...workspaceItems, ...projectItems];
    },
    getItemsForWorkspace: (workspaceId) => {
      const all = (function getAll(): WorkspaceItem[] {
        const defaultWsId = workspaces.find(w => w.isDefault)?.id || workspaces[0]?.id || "";
        const projectItems: WorkspaceItem[] = projects
          .filter(p => !workspaceItems.some(it => it.legacyProjectId === String(p.id)))
          .map(p => {
            const itemType: ItemType = p.projectType === "laboratory" ? "laboratory" : "individual_research";
            const meta = ITEM_TYPE_REGISTRY[itemType];
            return {
              id: `legacy_${p.id}`,
              type: itemType,
              title: p.title,
              description: "",
              emoji: meta.emoji,
              status: "active" as ItemStatus,
              visibility: meta.defaultVisibility,
              ownerId: user?._id || "",
              ownerName: user ? `${user.firstName} ${user.lastName}` : "",
              members: [],
              workspaceIds: defaultWsId ? [defaultWsId] : [],
              tags: [p.acronym].filter(Boolean) as string[],
              fields: itemType === "laboratory"
                ? { bslLevel: (p as any).safetyLevel, roomNumber: p.roomNumber } as ItemFields
                : {},
              legacyProjectId: String(p.id),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
          });
        return [...workspaceItems, ...projectItems];
      })();
      return all.filter(it => it.workspaceIds.includes(workspaceId));
    },
    search: async (query) => {
      try {
        const res = await apiRequest<{ results: SearchResult[] }>(`/api/search?q=${encodeURIComponent(query)}`, { token: authToken || undefined });
        return res.results;
      } catch (e) {
        console.error("Search failed", e);
        return [];
      }
    },
    updateProjectTaskStatus: async (taskId, status) => {
      // Optimistic UI
      const prevTasks = [...tasks];
      setTasks(current => current.map(t => t._id === taskId ? { ...t, status } : t));
      
      try {
        await apiRequest(`/api/planning/tasks/${taskId}/status`, {
          method: "PATCH",
          token: authToken || undefined,
          body: JSON.stringify({ status }),
        });
      } catch (error) {
        setTasks(prevTasks); // Rollback on error
        console.error("Failed to update task status", error);
        throw error;
      }
    },
    syncDiaryEntry: async (input) => {
      if (!activeProjectId) return;
      await apiRequest("/api/records/diary", {
        method: "POST",
        token: authToken || undefined,
        body: JSON.stringify({
          ...input,
          projectId: activeProjectId,
        }),
      });
      await store.fetchDiaryEntries();
    },
    addDiaryDraft: (body, title, type = "note") => {
      const draft: QuickDraft = {
        id: `${Date.now()}`,
        body: body.trim(),
        title: title?.trim(),
        type,
        createdAt: new Date().toISOString(),
        projectId: activeProjectId || "demo-project",
      };
      setDrafts((current) => [draft, ...current]);
      return draft;
    },
    addPurchaseDraft: (input) => {
      const draft: PurchaseRequestDraft = {
        ...input,
        amount: Math.max(0, input.amount),
        id: `${Date.now()}`,
        createdAt: new Date().toISOString(),
        projectId: activeProjectId || "demo-project",
        title: input.title.trim(),
        vendor: input.vendor?.trim() || undefined,
      };
      setPurchaseDrafts((current) => [draft, ...current]);
      return draft;
    },
    clearDrafts: () => setDrafts([]),
    clearPurchaseDrafts: () => setPurchaseDrafts([]),
    });
  }, [user, personalProfile, authToken, activeProjectId, projects, mySubjects, courses, modules, topics, assessments, sessions, assignments, phdPlan, stages, tasks, milestones, budgetSummary, events, participations, diaryEntries, notifications, unreadCount, libraryItems, chatMessages, almanacEvents, labInventory, labEquipment, labEquipmentLogs, labExperiments, reagentRequests, safetyInspections, wasteRecords, labBookings, labAccessLogs, labEquipmentAccess, userRole, labRuns, labMethodologies, labCourseSessions, labActivity, workspaces, activeWorkspaceId, workspaceItems, itemRelations, pinnedItemIds, drafts, hydrated, loading, purchaseDrafts]);

  useEffect(() => {
    if (user && hydrated) {
      store.fetchProjects().catch(() => undefined);
      store.fetchPersonalProfile().catch(() => undefined);
      store.fetchNotifications().catch(() => undefined);
      // Workspace API sync
      store.fetchWorkspacesFromApi().then(() => {
        store.fetchItemsFromApi().catch(() => undefined);
      }).catch(() => undefined);
      if (activeProjectId) {
        store.fetchLearningData().catch(() => undefined);
        store.fetchPhdPlan().catch(() => undefined);
        store.fetchProjectDetails().catch(() => undefined);
        store.fetchDiaryEntries().catch(() => undefined);
        store.fetchLibraryItems().catch(() => undefined);
        store.fetchChatMessages().catch(() => undefined);
        store.fetchAlmanac().catch(() => undefined);
        store.fetchLabInventory().catch(() => undefined);
        store.fetchLabEquipment().catch(() => undefined);
        store.fetchLabExperiments().catch(() => undefined);
      }
    }
  }, [user, activeProjectId, hydrated]);

  return (
    <MobileStoreContext.Provider value={store}>
      {children}
    </MobileStoreContext.Provider>
  );
}

export function useMobileStore() {
  const store = useContext(MobileStoreContext);
  if (!store) {
    throw new Error("useMobileStore must be used inside MobileStoreProvider");
  }
  return store;
}
