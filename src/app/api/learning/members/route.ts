import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { courseMemberInputSchema } from "@/lib/schemas";
import { enrollMember, listCourseMembers, listProjectMembers } from "@/lib/learning";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const courseId = url.searchParams.get("courseId");
  const projectId = url.searchParams.get("projectId");

  if (courseId) {
    const members = await listCourseMembers(courseId);
    return NextResponse.json({ members });
  }
  if (projectId) {
    const members = await listProjectMembers(projectId);
    return NextResponse.json({ members });
  }
  return NextResponse.json({ error: "courseId or projectId is required" }, { status: 400 });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const input = courseMemberInputSchema.parse(body);
    const member = await enrollMember(input, user);
    return NextResponse.json({ member });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Invalid input" }, { status: 400 });
  }
}
