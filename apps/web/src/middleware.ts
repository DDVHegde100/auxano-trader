import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/health",
  "/api/market/quotes",
  "/api/market/live",
  "/api/market/(.*)",
  "/api/algorithms/presets",
  "/api/algorithms/rate",
  "/api/algorithms/presets/(.*)",
  "/api/auth/dev-login",
]);

const clerk = clerkMiddleware(async (auth, req) => {
  const isApiWithBearer =
    req.nextUrl.pathname.startsWith("/api/") &&
    req.headers.get("authorization")?.startsWith("Bearer ");

  if (isApiWithBearer) return;

  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

/** Dev mode: skip Clerk entirely so test@gmail.com login works without Clerk keys */
function devMiddleware(_req: NextRequest) {
  return NextResponse.next();
}

export default process.env.ALLOW_DEV_AUTH === "true" ? devMiddleware : clerk;

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
