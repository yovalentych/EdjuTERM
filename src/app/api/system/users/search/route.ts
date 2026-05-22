import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { getMongoDb, hasMongoConfig } from "@/lib/mongodb";
import { safeUserSchema } from "@/lib/schemas";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";

    if (q.length < 2) {
      return NextResponse.json({ users: [] });
    }

    if (!hasMongoConfig()) {
      return NextResponse.json({ users: [] });
    }

    const db = await getMongoDb();
    const docs = await db.collection("users")
      .find({
        $or: [
          { firstName: { $regex: q, $options: "i" } },
          { lastName: { $regex: q, $options: "i" } },
          { email: { $regex: q, $options: "i" } },
        ],
      })
      .limit(10)
      .toArray();

    const users = docs.map(doc => {
      const parsed = safeUserSchema.parse({ ...doc, _id: doc._id.toString() });
      return {
        id: parsed._id,
        name: `${parsed.firstName} ${parsed.lastName}`,
        email: parsed.email,
        initials: `${parsed.firstName?.[0] || ""}${parsed.lastName?.[0] || ""}`.toUpperCase(),
      };
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("User search API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
