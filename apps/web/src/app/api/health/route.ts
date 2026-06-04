import { NextResponse } from "next/server";
import { checkDatabaseConnection } from "@/lib/db-health";

export async function GET() {
  const db = await checkDatabaseConnection();
  const clerkConfigured = Boolean(
    process.env.CLERK_SECRET_KEY &&
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  );

  return NextResponse.json({
    status: db.ok ? "ok" : "degraded",
    service: "auxano",
    version: "1.0.0",
    database: db,
    auth: {
      provider: "clerk",
      configured: clerkConfigured,
      devAuth: process.env.ALLOW_DEV_AUTH === "true",
    },
  });
}
