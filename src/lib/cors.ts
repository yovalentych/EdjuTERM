export function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get("origin");
  
  // If no origin (e.g. mobile app or direct request), allow all but don't allow credentials with *
  if (!origin || origin === "null") {
    return {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
    };
  }

  // Echo origin and allow credentials for cross-origin requests that provide an origin
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
    "Access-Control-Allow-Credentials": "true",
  };
}
