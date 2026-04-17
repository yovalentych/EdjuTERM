import { readSession } from "@/lib/session";
import { getSafeUserById } from "@/lib/users";

export async function getCurrentUser() {
  const session = await readSession();

  if (!session) {
    return null;
  }

  return getSafeUserById(session.userId);
}
