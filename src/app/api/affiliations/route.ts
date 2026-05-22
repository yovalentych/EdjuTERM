import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getCurrentUser } from "@/lib/current-user";
import { affiliationInputSchema, userAffiliationSchema } from "@/lib/schemas";
import { addAffiliation } from "@/lib/users";
import {
  findOrCreateInstitutionByName,
  findOrCreateUnitInInstitution,
  findOrCreateProgramByName,
} from "@/lib/institutions-db";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const input = affiliationInputSchema.parse(body);

    // 1. Find-or-create institution
    const institution = await findOrCreateInstitutionByName(input.institutionName);
    const institutionId = institution._id!;

    // 2. Parent unit (Level 1: faculty/institute)
    let parentUnitId = "";
    let parentUnitName = input.parentUnitName?.trim() ?? "";
    if (parentUnitName) {
      const parent = await findOrCreateUnitInInstitution(institutionId, parentUnitName, "");
      parentUnitId = parent._id!;
      parentUnitName = parent.name;
    }

    // 3. Child unit (Level 2: department/lab/division)
    let unitId = "";
    let unitName = input.unitName?.trim() ?? "";
    if (unitName) {
      const unit = await findOrCreateUnitInInstitution(institutionId, unitName, parentUnitId);
      unitId = unit._id!;
      unitName = unit.name;
    }

    // 4. Program (optional)
    let programId = "";
    let programName = input.programName?.trim() ?? "";
    if (programName) {
      const prog = await findOrCreateProgramByName(institutionId, programName);
      programId = prog._id!;
      programName = prog.title;
    }

    const aff = userAffiliationSchema.parse({
      _id: randomUUID(),
      institutionId,
      institutionName: institution.name,
      parentUnitId,
      parentUnitType: input.parentUnitType ?? "",
      parentUnitName,
      unitId,
      unitType: input.unitType ?? "",
      unitName,
      programId,
      programName,
      role: input.role ?? "",
      position: input.position ?? "",
      startYear: input.startYear ?? null,
      endYear: input.endYear ?? null,
      isCurrent: input.isCurrent ?? true,
    });

    const updated = await addAffiliation(user._id!, aff);
    return NextResponse.json({ user: updated, affiliation: aff });
  } catch (e: unknown) {
    if (e instanceof ZodError) {
      const issues = (e as { issues?: Array<{ path: string[]; message: string }> }).issues ?? [];
      const msg = issues.length
        ? issues.map((err) => `${err.path.join(".") || "поле"}: ${err.message}`).join("; ")
        : "Помилка валідації";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Invalid input" },
      { status: 400 }
    );
  }
}
