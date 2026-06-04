import { createClerkClient } from "@clerk/backend";
import type { HealthCheckResult } from "./types";

export async function checkClerkConnection(): Promise<HealthCheckResult> {
  const publishable = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();
  const secret = process.env.CLERK_SECRET_KEY?.trim();

  if (!publishable || !secret) {
    return {
      id: "clerk",
      name: "Clerk authentication",
      status: "fail",
      message: "CLERK_SECRET_KEY or NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY missing",
    };
  }

  const start = Date.now();
  try {
    const clerk = createClerkClient({ secretKey: secret });
    const list = await clerk.users.getUserList({ limit: 1 });
    const keyMode = secret.startsWith("sk_live_")
      ? "live"
      : secret.startsWith("sk_test_")
        ? "test"
        : "unknown";

    return {
      id: "clerk",
      name: "Clerk authentication",
      status: "pass",
      latencyMs: Date.now() - start,
      message: `API reachable (${keyMode} keys)`,
      details: {
        keyMode,
        sampleUserCount: list.totalCount ?? list.data.length,
        webhookConfigured: Boolean(process.env.CLERK_WEBHOOK_SECRET),
      },
    };
  } catch (e) {
    return {
      id: "clerk",
      name: "Clerk authentication",
      status: "fail",
      latencyMs: Date.now() - start,
      message: e instanceof Error ? e.message : "Clerk API unreachable",
    };
  }
}
