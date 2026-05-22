import { NextResponse, type NextRequest } from "next/server";
import { isLocale } from "@/lib/i18n";
import { getCorsHeaders } from "@/lib/cors";

export function proxy(request: NextRequest) {
  const requestId =
    request.headers.get("x-request-id") ||
    request.headers.get("x-correlation-id") ||
    crypto.randomUUID();

  // 1. Handle preflight requests for API
  if (request.nextUrl.pathname.startsWith("/api/") && request.method === "OPTIONS") {
    const response = NextResponse.json({}, { headers: getCorsHeaders(request) });
    response.headers.set("x-request-id", requestId);
    return response;
  }

  // 2. Prepare request headers (for locale and requestId)
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-request-id", requestId);

  const pathParts = request.nextUrl.pathname.split("/");
  const locale = pathParts[1];
  if (isLocale(locale)) {
    requestHeaders.set("x-app-locale", locale);
  }

  // 3. Continue to the next middleware or route
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // 4. Apply CORS to all API responses
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const cors = getCorsHeaders(request);
    Object.entries(cors).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  }

  // 5. Add requestId to all responses
  response.headers.set("x-request-id", requestId);
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
