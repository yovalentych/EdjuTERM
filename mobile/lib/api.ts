import Constants from "expo-constants";

// Авто-детект IP мака у dev-режимі через Expo hostUri (yyy.yyy.yyy.yyy:8081)
// Fallback порядок: EXPO_PUBLIC_API_BASE_URL → Expo hostUri:3000 → localhost:3000
function resolveBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_API_BASE_URL) return process.env.EXPO_PUBLIC_API_BASE_URL;

  const hostUri =
    // Expo SDK 49+
    (Constants.expoConfig as any)?.hostUri ??
    // legacy
    (Constants as any).manifest?.debuggerHost ??
    (Constants as any).manifest2?.extra?.expoClient?.hostUri;

  if (typeof hostUri === "string" && hostUri.includes(":")) {
    const host = hostUri.split(":")[0]; // забираємо IP до порту
    if (host && host !== "localhost") return `http://${host}:3000`;
  }

  return "http://localhost:3000";
}

export const apiConfig = {
  baseUrl: resolveBaseUrl(),
};

// eslint-disable-next-line no-console
console.log(`[API] Base URL resolved to: ${apiConfig.baseUrl}`);

type ApiOptions = RequestInit & {
  token?: string;
};
export async function apiRequest<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { token, headers, ...init } = options;
  const url = `${apiConfig.baseUrl}${path}`;
  console.log(`[API] Fetching: ${url}${token ? ' (with token)' : ' (no token)'}`);

  try {
    const response = await fetch(url, {
      ...init,
      // Only include credentials if we don't have a token, or if specifically requested.
      // For mobile, Bearer token is preferred and more reliable than cookies.
      credentials: token ? "omit" : "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest", // Helps identify as AJAX/Mobile request
        ...(token?.trim() ? { Authorization: `Bearer ${token.trim()}` } : {}),
        ...headers,
      },
    });

    if (!response.ok) {
      let errorMessage = `API request failed: ${response.status}`;
      try {
        const errorBody = await response.json() as { error?: string };
        if (errorBody.error) errorMessage = errorBody.error;
      } catch {
        // fallback to status code if body is not JSON
      }
      // 401 без токена — це очікувано (анонімний запит); логуємо тихо як warn.
      if (response.status === 401) {
        console.log(`[API] 401 (anonymous) for ${url}`);
      } else {
        console.error(`[API] Error response (${response.status}) for ${url}:`, errorMessage);
      }
      const err = new Error(errorMessage) as Error & { status?: number };
      err.status = response.status;
      throw err;
    }

    console.log(`[API] Success response (200) for ${url}`);
    return response.json() as Promise<T>;
  } catch (error: any) {
    // Network errors лoгуємо лише якщо це справді fetch failure, а не вже логований 401.
    if (error?.status === undefined) {
      console.error(`[API] Network error for ${url}:`, error);
    }
    throw error;
  }
}
