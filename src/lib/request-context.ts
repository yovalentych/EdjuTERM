import { randomUUID } from "node:crypto";
import { headers } from "next/headers";

export async function getRequestId() {
  const headerStore = await headers();
  return (
    headerStore.get("x-request-id") ||
    headerStore.get("x-correlation-id") ||
    randomUUID()
  );
}

export function withRequestId(response: Response, requestId: string) {
  response.headers.set("x-request-id", requestId);
  return response;
}
