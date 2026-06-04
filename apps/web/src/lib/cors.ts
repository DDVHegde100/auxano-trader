import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const DEFAULT_METHODS = "GET, POST, PUT, PATCH, DELETE, OPTIONS";
const DEFAULT_HEADERS =
  "Content-Type, Authorization, X-Requested-With, Accept, Origin";

function parseAllowedOrigins(): string[] | "*" {
  const raw = process.env.ALLOWED_ORIGINS?.trim();
  if (!raw || raw === "*") return "*";
  return raw.split(",").map((o) => o.trim()).filter(Boolean);
}

export function resolveCorsOrigin(request: NextRequest): string | null {
  const allowed = parseAllowedOrigins();
  const origin = request.headers.get("origin");
  if (!origin) return null;
  if (allowed === "*") return "*";
  if (allowed.includes(origin)) return origin;
  if (
    process.env.NODE_ENV !== "production" &&
    (origin.startsWith("http://localhost") ||
      origin.startsWith("exp://") ||
      origin.startsWith("http://127.0.0.1"))
  ) {
    return origin;
  }
  return null;
}

export function withCors(
  request: NextRequest,
  response: NextResponse
): NextResponse {
  const origin = resolveCorsOrigin(request);
  if (origin) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
  }
  response.headers.set("Access-Control-Allow-Methods", DEFAULT_METHODS);
  response.headers.set("Access-Control-Allow-Headers", DEFAULT_HEADERS);
  response.headers.set("Access-Control-Max-Age", "86400");
  response.headers.set("Vary", "Origin");
  return response;
}

export function corsPreflightResponse(request: NextRequest): NextResponse | null {
  if (request.method !== "OPTIONS") return null;
  const origin = resolveCorsOrigin(request);
  if (!origin && request.headers.get("origin")) {
    return new NextResponse(null, { status: 403 });
  }
  const res = new NextResponse(null, { status: 204 });
  return withCors(request, res);
}
