import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { getChatMessages, postChatMessage } from "@/lib/chat";
import { createNotification } from "@/lib/notifications";
import { getProjectById } from "@/lib/projects";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const after = searchParams.get("after") || undefined;

    if (!projectId) {
      return NextResponse.json({ error: "Project ID required" }, { status: 400 });
    }

    const messages = await getChatMessages(projectId, 50, after);
    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Chat GET API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { projectId, content } = await request.json();

    if (!projectId || !content) {
      return NextResponse.json({ error: "Project ID and content required" }, { status: 400 });
    }

    const initials = `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase();
    const displayName = `${user.firstName} ${user.lastName}`;

    const message = await postChatMessage(projectId, user._id || "system", displayName, initials, content);

    // Trigger notifications for other team members
    try {
      const project = await getProjectById(projectId);
      if (project) {
        const recipients = [project.ownerId, ...project.memberIds].filter(id => id !== user._id);
        
        for (const recipientId of recipients) {
          await createNotification({
            userId: recipientId,
            actorId: user._id || "system",
            actorName: displayName,
            title: `Чат: ${project.acronym}`,
            body: `${displayName}: ${content.substring(0, 60)}${content.length > 60 ? '...' : ''}`,
            type: "chat",
          });
        }
      }
    } catch (notifError) {
      console.error("Failed to create chat notifications:", notifError);
      // Don't fail the message post if notifications fail
    }

    return NextResponse.json({ message });
  } catch (error) {
    console.error("Chat POST API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
