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

export const projectRecordInputSchema = z.object({
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
