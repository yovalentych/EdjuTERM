import { cookies } from "next/headers";

const COOKIE_NAME = "grant_prefs";
const MAX_AGE = 365 * 24 * 60 * 60; // 1 year

export type UserPrefs = {
  theme: "light" | "soft";
  compact: boolean;
  notifications: boolean;
  lastProjectId: string;
};

const DEFAULTS: UserPrefs = {
  theme: "light",
  compact: false,
  notifications: true,
  lastProjectId: "",
};

export async function readPrefs(): Promise<UserPrefs> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value;
  if (!raw) return { ...DEFAULTS };
  try {
    return { ...DEFAULTS, ...JSON.parse(decodeURIComponent(raw)) };
  } catch {
    return { ...DEFAULTS };
  }
}

export async function writePrefs(partial: Partial<UserPrefs>): Promise<void> {
  const cookieStore = await cookies();
  const current = await readPrefs();
  const next = { ...current, ...partial };
  cookieStore.set(COOKIE_NAME, encodeURIComponent(JSON.stringify(next)), {
    httpOnly: false, // JS-readable so client components can sync
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

// Client-side helpers (runs in browser only)
export const clientPrefs = {
  read(): UserPrefs {
    if (typeof document === "undefined") return { ...DEFAULTS };
    const match = document.cookie.match(
      new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`),
    );
    if (!match) return { ...DEFAULTS };
    try {
      return { ...DEFAULTS, ...JSON.parse(decodeURIComponent(match[1])) };
    } catch {
      return { ...DEFAULTS };
    }
  },
  write(partial: Partial<UserPrefs>) {
    const current = this.read();
    const next = { ...current, ...partial };
    const maxAge = MAX_AGE;
    document.cookie = `${COOKIE_NAME}=${encodeURIComponent(JSON.stringify(next))};path=/;max-age=${maxAge};samesite=lax`;
    window.dispatchEvent(new Event("grant-prefs-change"));
  },
};
