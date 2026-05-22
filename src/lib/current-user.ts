import "server-only";
import { destroySession, readSession, verifySessionToken } from "@/lib/session";
import { getSafeUserById } from "@/lib/users";
import { headers } from "next/headers";

export async function getCurrentUser() {
  // 1. Try session from cookies first
  const sessionFromCookie = await readSession();
  if (sessionFromCookie) {
    try {
      const user = await getSafeUserById(sessionFromCookie.userId);
      if (user && user.sessionVersion === sessionFromCookie.sessionVersion) {
        console.log(`[AUTH] Resolved user ${user.email} from cookie`);
        return user;
      }
      // Користувач видалений (наприклад, очищена БД) або sessionVersion змінено.
      // Очищаємо stale cookie, щоб уникнути нескінченних 401/500 на наступних запитах.
      console.warn(`[AUTH] Stale cookie session for ID ${sessionFromCookie.userId} — clearing.`);
      try { await destroySession(); } catch { /* ignore */ }
    } catch (error) {
      console.error("Failed to resolve user from cookie session:", error);
      try { await destroySession(); } catch { /* ignore */ }
    }
  }

  // 2. Fallback to Authorization header if cookie session failed or was missing
  try {
    const h = await headers();
    const auth = h.get("authorization");
    if (auth?.startsWith("Bearer ")) {
      const token = auth.substring(7);
      const sessionFromHeader = verifySessionToken(token);
      
      if (sessionFromHeader) {
        const user = await getSafeUserById(sessionFromHeader.userId);
        if (user && user.sessionVersion === sessionFromHeader.sessionVersion) {
          console.log(`[AUTH] Resolved user ${user.email} from Authorization header`);
          return user;
        }
        console.warn(`[AUTH] Header session found but user not resolved or version mismatch for ID: ${sessionFromHeader.userId}`);
      } else {
        console.warn("[AUTH] Invalid or expired token in Authorization header");
      }
    } else if (auth) {
      console.warn("[AUTH] Authorization header present but not Bearer");
    }
  } catch (error) {
    console.error("Failed to resolve user from Authorization header:", error);
  }

  return null;
}
