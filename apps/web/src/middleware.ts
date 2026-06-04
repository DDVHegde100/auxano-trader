import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";
import { corsPreflightResponse, withCors } from "@/lib/cors";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/docs(.*)",
  "/api/health",
  "/api/ready",
  "/api/live",
  "/api/market/quotes",
  "/api/market/live",
  "/api/market/(.*)",
  "/api/market/search",
  "/api/algorithms/presets",
  "/api/algorithms/rate",
  "/api/algorithms/presets/(.*)",
  "/api/auth/dev-login",
  "/api/webhooks/clerk",
]);

const clerkHandler = clerkMiddleware(async (auth, req) => {
  const isApiWithBearer =
    req.nextUrl.pathname.startsWith("/api/") &&
    req.headers.get("authorization")?.startsWith("Bearer ");

  if (isApiWithBearer) return;

  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

function devMiddleware(_req: NextRequest) {
  return NextResponse.next();
}

async function runMiddleware(req: NextRequest, event: NextFetchEvent) {
  const isApi = req.nextUrl.pathname.startsWith("/api/");

  if (isApi) {
    const preflight = corsPreflightResponse(req);
    if (preflight) return preflight;
  }

  const handler =
    process.env.ALLOW_DEV_AUTH === "true" ? devMiddleware : clerkHandler;
  const response = await handler(req, event);

  if (isApi && response instanceof NextResponse) {
    return withCors(req, response);
  }
  return response;
}

export default runMiddleware;

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
