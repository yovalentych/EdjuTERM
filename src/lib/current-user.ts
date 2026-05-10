import { readSession } from "@/lib/session";
import { getSafeUserById } from "@/lib/users";

export async function getCurrentUser() {
  const session = await readSession();

  if (!session) {
    return null;
  }

  try {
    const user = await getSafeUserById(session.userId);

    if (!user || user.sessionVersion !== session.sessionVersion) {
      return null;
    }

    return user;
  } catch (error) {
    console.error("Failed to resolve current user from session", error);
    return null;
  }
}
