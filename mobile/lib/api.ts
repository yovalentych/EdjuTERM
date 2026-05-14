const DEFAULT_API_BASE_URL = "http://localhost:3000";

export const apiConfig = {
  baseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL,
};

type ApiOptions = RequestInit & {
  token?: string;
};

export async function apiRequest<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { token, headers, ...init } = options;
  const response = await fetch(`${apiConfig.baseUrl}${path}`, {
    ...init,
    credentials: "include", // Required for cross-origin cookies in React Native/Expo
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  if (!response.ok) {
    let errorMessage = `API request failed: ${response.status}`;
    try {
      const errorBody = await response.json() as { error?: string };
      if (errorBody.error) {
        errorMessage = errorBody.error;
      }
    } catch {
      // fallback to status code if body is not JSON
    }
    throw new Error(errorMessage);
  }

  return response.json() as Promise<T>;
}
