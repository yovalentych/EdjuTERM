import { NextResponse } from "next/server";
import { getCurrentInstitution } from "@/lib/institution-guard";
import {
  institutionAdminInputSchema,
  institutionUnitInputSchema,
  institutionUnitTypes,
  institutionMemberInputSchema,
  institutionMemberRoles,
  institutionProgramInputSchema,
  programLevels,
  institutionCourseInputSchema,
} from "@/lib/schemas";
import {
  createAdmin,
  createUnit,
  createMember,
  createProgram,
  createInstitutionCourse,
} from "@/lib/institutions-db";

type EntityType = "admins" | "units" | "members" | "programs" | "courses";

// Normalize rows before Zod parsing to avoid hard enum failures on known fields.
function normalizeRow(type: EntityType, row: unknown): unknown {
  if (typeof row !== "object" || row === null) return row;
  const r = { ...(row as Record<string, unknown>) };

  if (type === "units") {
    if (typeof r.type === "string" && !(institutionUnitTypes as readonly string[]).includes(r.type)) {
      r.type = "other";
    }
  }
  if (type === "members") {
    if (typeof r.role === "string" && !(institutionMemberRoles as readonly string[]).includes(r.role)) {
      r.role = "lecturer";
    }
  }
  if (type === "programs") {
    if (typeof r.level === "string" && !(programLevels as readonly string[]).includes(r.level)) {
      r.level = "bachelor";
    }
  }

  return r;
}

// Trim Zod error messages — full enum lists make them unreadable.
function friendlyError(e: unknown): string {
  if (!(e instanceof Error)) return "Невірні дані";
  try {
    const parsed = JSON.parse(e.message) as { path: (string | number)[]; message: string }[];
    return parsed
      .map((iss) => `${iss.path.join(".") || "?"}: ${iss.message}`)
      .join("; ")
      .slice(0, 300);
  } catch {
    return e.message.slice(0, 300);
  }
}

async function importSection(
  type: EntityType,
  rows: unknown[],
  institutionId: string,
): Promise<{ created: number; errors: { index: number; message: string }[] }> {
  const schemaMap = {
    admins: institutionAdminInputSchema,
    units: institutionUnitInputSchema,
    members: institutionMemberInputSchema,
    programs: institutionProgramInputSchema,
    courses: institutionCourseInputSchema,
  } as const;

  const creatorMap = {
    admins: createAdmin,
    units: createUnit,
    members: createMember,
    programs: createProgram,
    courses: createInstitutionCourse,
  } as const;

  const schema = schemaMap[type];
  const creator = creatorMap[type];
  let created = 0;
  const errors: { index: number; message: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    try {
      const normalized = normalizeRow(type, rows[i]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const input: any = schema.parse({ ...(normalized as object), institutionId });
      await creator(input);
      created++;
    } catch (e: unknown) {
      errors.push({ index: i, message: friendlyError(e) });
    }
  }

  return { created, errors };
}

export async function POST(req: Request) {
  const auth = await getCurrentInstitution();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const institutionId = auth.institution._id!;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { type, data } = body as { type: string; data: unknown };

  // Full backup import: { version, units, members, programs, courses }
  if (type === "backup" && typeof data === "object" && data !== null) {
    const backup = data as Record<string, unknown>;
    const results: Record<string, { created: number; errors: unknown[] }> = {};

    for (const section of ["admins", "units", "members", "programs", "courses"] as EntityType[]) {
      const rows = backup[section];
      if (Array.isArray(rows) && rows.length > 0) {
        results[section] = await importSection(section, rows, institutionId);
      } else {
        results[section] = { created: 0, errors: [] };
      }
    }

    const totalCreated = Object.values(results).reduce((s, r) => s + r.created, 0);
    const totalErrors = Object.values(results).flatMap((r) => r.errors);
    return NextResponse.json({ results, totalCreated, totalErrors: totalErrors.length });
  }

  // Single entity import
  const validTypes: EntityType[] = ["admins", "units", "members", "programs", "courses"];
  if (!validTypes.includes(type as EntityType)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }
  if (!Array.isArray(data)) {
    return NextResponse.json({ error: "data must be an array" }, { status: 400 });
  }
  if (data.length > 500) {
    return NextResponse.json({ error: "Max 500 records per import" }, { status: 400 });
  }

  const { created, errors } = await importSection(type as EntityType, data, institutionId);
  return NextResponse.json({ created, errors, total: data.length });
}
