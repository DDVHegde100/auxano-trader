import type { HealthCheckResult } from "./types";

const REQUIRED_PROD = [
  "DATABASE_URL",
  "CLERK_SECRET_KEY",
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
] as const;

const RECOMMENDED_PROD = [
  "FINNHUB_API_KEY",
  "NEXT_PUBLIC_CLERK_SIGN_IN_URL",
  "NEXT_PUBLIC_CLERK_SIGN_UP_URL",
  "NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL",
  "NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL",
] as const;

export function checkEnvironment(): HealthCheckResult {
  const isVercel = Boolean(process.env.VERCEL);
  const isProd =
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production";

  const missing = REQUIRED_PROD.filter((k) => !process.env[k]?.trim());
  const devAuthOn =
    process.env.ALLOW_DEV_AUTH === "true" ||
    process.env.NEXT_PUBLIC_ALLOW_DEV_AUTH === "true";

  const issues: string[] = [];
  if (missing.length) issues.push(`Missing: ${missing.join(", ")}`);
  if (isProd && devAuthOn) issues.push("Dev auth enabled in production");
  if (
    isProd &&
    process.env.CLERK_SECRET_KEY?.startsWith("sk_test_")
  ) {
    issues.push("Clerk test secret key in production");
  }
  if (
    isProd &&
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.startsWith("pk_test_")
  ) {
    issues.push("Clerk test publishable key in production (warn)");
  }

  const recommendedMissing = RECOMMENDED_PROD.filter(
    (k) => !process.env[k]?.trim()
  );

  let status: HealthCheckResult["status"] = "pass";
  if (missing.length || (isProd && devAuthOn)) status = "fail";
  else if (recommendedMissing.length || issues.some((i) => i.includes("test")))
    status = "warn";

  return {
    id: "environment",
    name: "Environment configuration",
    status,
    message:
      issues.length > 0
        ? issues.join("; ")
        : recommendedMissing.length
          ? `Optional unset: ${recommendedMissing.join(", ")}`
          : "Required variables present",
    details: {
      nodeEnv: process.env.NODE_ENV ?? "unknown",
      vercelEnv: process.env.VERCEL_ENV ?? "n/a",
      onVercel: isVercel,
      devAuth: devAuthOn,
    },
  };
}
