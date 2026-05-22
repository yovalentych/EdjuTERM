import { getCurrentInstitution } from "@/lib/institution-guard";
import {
  listUnits,
  listMembers,
  listPrograms,
  listInstitutionCourses,
} from "@/lib/institutions-db";
import type {
  InstitutionUnit,
  InstitutionMember,
  InstitutionProgram,
  InstitutionCourse,
} from "@/lib/schemas";

function sanitizeUnit(u: InstitutionUnit) {
  return {
    type: u.type,
    name: u.name,
    shortName: u.shortName,
    head: u.head,
    headEmail: u.headEmail,
    description: u.description,
    orderIndex: u.orderIndex,
  };
}

function sanitizeMember(m: InstitutionMember) {
  return {
    fullName: m.fullName,
    email: m.email,
    phone: m.phone,
    role: m.role,
    title: m.title,
    position: m.position,
    orcid: m.orcid,
    isActive: m.isActive,
    hiredAt: m.hiredAt,
  };
}

function sanitizeProgram(p: InstitutionProgram) {
  return {
    code: p.code,
    title: p.title,
    specialty: p.specialty,
    level: p.level,
    durationYears: p.durationYears,
    ects: p.ects,
    language: p.language,
    description: p.description,
    isActive: p.isActive,
  };
}

function sanitizeCourse(c: InstitutionCourse) {
  return {
    code: c.code,
    title: c.title,
    courseType: c.courseType,
    ects: c.ects,
    hoursTotal: c.hoursTotal,
    semester: c.semester,
    year: c.year,
    language: c.language,
    description: c.description,
    isActive: c.isActive,
  };
}

function jsonResponse(data: unknown, filename: string) {
  const ascii = filename.replace(/[^\x20-\x7E]/g, "_");
  const encoded = encodeURIComponent(filename);
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${ascii}"; filename*=UTF-8''${encoded}`,
    },
  });
}

export async function GET(req: Request) {
  const auth = await getCurrentInstitution();
  if (!auth) return new Response("Unauthorized", { status: 401 });

  const institutionId = auth.institution._id!;
  const url = new URL(req.url);
  const type = url.searchParams.get("type") ?? "all";
  const shortId = auth.institution.shortName?.replace(/\s+/g, "-") ?? institutionId.slice(-6);
  const date = new Date().toISOString().slice(0, 10);

  if (type === "units") {
    const items = await listUnits(institutionId);
    return jsonResponse(items.map(sanitizeUnit), `${shortId}-units-${date}.json`);
  }
  if (type === "members") {
    const items = await listMembers(institutionId);
    return jsonResponse(items.map(sanitizeMember), `${shortId}-members-${date}.json`);
  }
  if (type === "programs") {
    const items = await listPrograms(institutionId);
    return jsonResponse(items.map(sanitizeProgram), `${shortId}-programs-${date}.json`);
  }
  if (type === "courses") {
    const items = await listInstitutionCourses(institutionId);
    return jsonResponse(items.map(sanitizeCourse), `${shortId}-courses-${date}.json`);
  }

  // Full backup
  const [units, members, programs, courses] = await Promise.all([
    listUnits(institutionId),
    listMembers(institutionId),
    listPrograms(institutionId),
    listInstitutionCourses(institutionId),
  ]);

  return jsonResponse(
    {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      institution: { name: auth.institution.name, shortName: auth.institution.shortName },
      units: units.map(sanitizeUnit),
      members: members.map(sanitizeMember),
      programs: programs.map(sanitizeProgram),
      courses: courses.map(sanitizeCourse),
    },
    `${shortId}-backup-${date}.json`,
  );
}
