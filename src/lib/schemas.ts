import { z } from "zod";

export const recordKinds = [
  "dataset",
  "protocol",
  "task",
  "output",
  "sample",
  "risk",
] as const;

export const accessCategories = [
  "internal",
  "open",
  "embargoed",
  "restricted",
] as const;

export const userRoles = ["admin", "supervisor", "member", "user"] as const;

export const projectRecordInputSchema = z.object({
  projectId: z.string().min(1).max(120),
  kind: z.enum(recordKinds),
  localId: z.string().min(3).max(80),
  title: z.string().min(3).max(240),
  stage: z.string().min(3).max(80),
  access: z.enum(accessCategories),
  owner: z.string().min(1).max(120),
  repository: z.string().min(1).max(160),
  summary: z.string().max(1200).default(""),
});

export const projectRecordSchema = projectRecordInputSchema.extend({
  _id: z.string().optional(),
  status: z
    .enum(["planned", "active", "review", "released", "blocked"])
    .default("planned"),
  relatedIds: z.array(z.string()).default([]),
  rawDataFiles: z
    .array(
      z.object({
        name: z.string(),
        storageUri: z.string(),
        checksum: z.string().optional(),
        mimeType: z.string().optional(),
        bytes: z.number().optional(),
      }),
    )
    .default([]),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type ProjectRecordInput = z.infer<typeof projectRecordInputSchema>;
export type ProjectRecord = z.infer<typeof projectRecordSchema>;

export const registerInputSchema = z.object({
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  firstNameLatin: z.string().min(1).max(80),
  lastNameLatin: z.string().min(1).max(80),
  email: z.string().email().max(240).transform((email) => email.toLowerCase()),
  password: z.string().min(8).max(200),
});

export const loginInputSchema = z.object({
  email: z.string().email().max(240).transform((email) => email.toLowerCase()),
  password: z.string().min(1).max(200),
});

export const userSchema = z.object({
  _id: z.string().optional(),
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  firstNameLatin: z.string().min(1).max(80),
  lastNameLatin: z.string().min(1).max(80),
  email: z.string().email(),
  passwordHash: z.string(),
  role: z.enum(userRoles).default("user"),
  emailVerifiedAt: z.coerce.date().nullable().default(null),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const safeUserSchema = userSchema.omit({ passwordHash: true });

export const projectInputSchema = z.object({
  title: z.string().min(3).max(200),
  acronym: z.string().min(2).max(32),
  summary: z.string().max(1200).default(""),
});

export const projectSchema = projectInputSchema.extend({
  _id: z.string().optional(),
  ownerId: z.string(),
  supervisorId: z.string(),
  memberIds: z.array(z.string()).default([]),
  status: z.enum(["active", "archived"]).default("active"),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const openScienceUpdateInputSchema = z.object({
  projectId: z.string().min(1).max(120),
  title: z.string().min(3).max(240),
  summary: z.string().max(600).default(""),
  content: z.string().max(5000).default(""),
  status: z.enum(["draft", "published"]).default("draft"),
});

export const openScienceUpdateSchema = openScienceUpdateInputSchema.extend({
  _id: z.string().optional(),
  createdBy: z.string(),
  publishedAt: z.coerce.date().nullable().default(null),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type UserRole = z.infer<typeof userSchema>["role"];
export type User = z.infer<typeof userSchema>;
export type SafeUser = z.infer<typeof safeUserSchema>;
export type RegisterInput = z.infer<typeof registerInputSchema>;
export type LoginInput = z.infer<typeof loginInputSchema>;
export type ProjectInput = z.infer<typeof projectInputSchema>;
export type Project = z.infer<typeof projectSchema>;
export type OpenScienceUpdateInput = z.infer<
  typeof openScienceUpdateInputSchema
>;
export type OpenScienceUpdate = z.infer<typeof openScienceUpdateSchema>;
