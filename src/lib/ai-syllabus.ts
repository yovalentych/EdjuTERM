import "server-only";

import OpenAI from "openai";
import { z } from "zod";
import { zodTextFormat } from "openai/helpers/zod";

export const aiSessionTypeSchema = z.enum(["lecture", "seminar", "practical", "lab", "self_study", "consultation"]);

export const aiCoursePlanSchema = z.object({
  source: z.object({
    institution: z.string().default(""),
    programName: z.string().default(""),
    faculty: z.string().default(""),
    department: z.string().default(""),
    studyLevel: z.string().default(""),
    evidence: z.string().default(""),
  }).default({
    institution: "",
    programName: "",
    faculty: "",
    department: "",
    studyLevel: "",
    evidence: "",
  }),
  course: z.object({
    title: z.string(),
    code: z.string(),
    instructor: z.string(),
    semester: z.number().int().min(1).max(12),
    semesterEnd: z.number().int().min(1).max(12),
    year: z.number().int().min(1).max(10),
    credits: z.number().min(0).max(60),
    courseType: z.enum(["mandatory", "elective", "optional", "language", "physical", "practice", "research"]),
    status: z.enum(["planned", "active", "completed", "failed", "withdrawn"]),
    note: z.string(),
  }),
  modules: z.array(z.object({
    title: z.string(),
    description: z.string(),
    topics: z.array(z.object({
      title: z.string(),
      description: z.string(),
      sessions: z.array(z.object({
        type: aiSessionTypeSchema,
        hours: z.number().min(0).max(200),
        notes: z.string(),
      })),
    })),
  })),
  assessments: z.array(z.object({
    title: z.string(),
    type: z.enum(["exam", "zalik", "midterm", "test", "colloquium", "seminar", "practical_work", "essay", "project", "coursework", "lab_work", "notes_check", "oral", "presentation", "other"]),
    maxScore: z.number().min(0).max(1000),
    weight: z.number().min(0).max(100),
    notes: z.string(),
  })),
});

export type AiCoursePlan = z.infer<typeof aiCoursePlanSchema>;

export async function analyzeSyllabusWithOpenAI(input: {
  text: string;
  locale?: string;
  existingCourseTitle?: string;
  userHint?: string;
  expectedContext?: {
    institution?: string;
    programName?: string;
    faculty?: string;
    department?: string;
    studyLevel?: string;
  };
  model?: string;
}): Promise<AiCoursePlan> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("openai_key_missing");

  const client = new OpenAI({ apiKey });
  const model = input.model || process.env.OPENAI_SYLLABUS_MODEL || "gpt-5.4-mini";

  const userLines = input.userHint?.trim()
    ? [`User correction notes (apply these to the output):`, input.userHint.trim()]
    : [];

  const response = await client.responses.parse({
    model,
    reasoning: { effort: "low" },
    instructions: [
      "You extract structured academic course plans from Ukrainian/English syllabi.",
      "Return only data that is grounded in the provided document.",
      "Extract source metadata when present: institution, faculty/institute, department, education program, study level, and a short evidence phrase.",
      "Prefer Ukrainian labels when the source is Ukrainian.",
      "Group the course as modules -> topics -> sessions.",
      "A topic may contain lecture, seminar, practical, lab, self_study, or consultation sessions.",
      "CRITICAL — ambiguous or slash-separated columns: never create two session types from one numeric cell. Use the most likely single type from nearby headers/context, or the user correction notes if provided.",
      "If a column header is ambiguous, preserve the uncertainty in session notes or topic description so the user can correct it in preview.",
      "If hours are tabular, preserve them exactly.",
      "Create a session only when the source gives positive hours for that session type.",
      "Never create lecture, seminar, practical, lab, or self_study sessions for 0 hours or blank hour cells.",
      "If a table has columns like Л/Лекції, С/Семінари, Пр/Практичні, Лаб, СР/Самостійна робота — map each positive numeric cell to the matching session type.",
      "If the source contains both full-time and part-time variants, prefer full-time/денна форма unless the document clearly indicates otherwise.",
      "Do not use default hours for tabular plans. If hours are uncertain, omit the session and mention uncertainty in the topic description.",
      "If the course spans the whole academic year, set semesterEnd greater than semester. Otherwise semesterEnd must equal semester.",
      "Do not invent excessive modules. Keep the plan usable for a learning journal.",
    ].join("\n"),
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: [
              `Locale: ${input.locale || "uk"}`,
              `Existing course title: ${input.existingCourseTitle || ""}`,
              `Expected institution/context for validation only: ${[
                input.expectedContext?.institution,
                input.expectedContext?.faculty,
                input.expectedContext?.programName,
                input.expectedContext?.department,
                input.expectedContext?.studyLevel,
              ].filter(Boolean).join(" · ")}`,
              ...userLines,
              "Syllabus text:",
              input.text.slice(0, 180_000),
            ].join("\n\n"),
          },
        ],
      },
    ],
    text: {
      format: zodTextFormat(aiCoursePlanSchema, "course_plan"),
    },
  });

  const parsed = response.output_parsed;
  if (!parsed) throw new Error("openai_parse_failed");
  return parsed;
}
