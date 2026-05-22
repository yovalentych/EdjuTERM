import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { getPhdPlan } from "@/lib/phd-plan";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ error: "Project ID required" }, { status: 400 });
    }

    const plan = await getPhdPlan(projectId);

    return NextResponse.json({ plan });
  } catch (error) {
    console.error("PhD Plan API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
