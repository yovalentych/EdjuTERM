import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { attendanceRecordInputSchema } from "@/lib/schemas";
import {
  bulkSetAttendance,
  deleteAttendance,
  listAttendanceForCourse,
  listAttendanceForMember,
  listAttendanceForSession,
  setAttendance,
} from "@/lib/learning";

/**
 * GET /api/learning/attendance?sessionId=... | courseId=... | memberId=...
 */
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const sessionId = url.searchParams.get("sessionId");
  const courseId  = url.searchParams.get("courseId");
  const memberId  = url.searchParams.get("memberId");

  if (sessionId) {
    return NextResponse.json({ records: await listAttendanceForSession(sessionId) });
  }
  if (courseId) {
    return NextResponse.json({ records: await listAttendanceForCourse(courseId) });
  }
  if (memberId) {
    return NextResponse.json({ records: await listAttendanceForMember(memberId) });
  }
  return NextResponse.json({ error: "sessionId, courseId or memberId is required" }, { status: 400 });
}

/**
 * POST /api/learning/attendance
 * body: single AttendanceRecordInput OR { records: AttendanceRecordInput[] }
 * Upsert за (sessionId, memberId).
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    if (Array.isArray(body?.records)) {
      const parsed = body.records.map((r: any) => attendanceRecordInputSchema.parse(r));
      const count = await bulkSetAttendance(parsed, user);
      return NextResponse.json({ ok: true, count });
    }
    const input = attendanceRecordInputSchema.parse(body);
    const record = await setAttendance(input, user);
    return NextResponse.json({ record });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Invalid input" }, { status: 400 });
  }
}

/**
 * DELETE /api/learning/attendance?sessionId=...&memberId=...
 */
export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const sessionId = url.searchParams.get("sessionId");
  const memberId  = url.searchParams.get("memberId");
  if (!sessionId || !memberId) {
    return NextResponse.json({ error: "sessionId and memberId required" }, { status: 400 });
  }
  await deleteAttendance(sessionId, memberId);
  return NextResponse.json({ ok: true });
}
