import { createHmac, timingSafeEqual } from "crypto";
import {
  DEV_TEST_CLERK_ID,
  DEV_TEST_EMAIL,
  DEV_TEST_NAME,
  DEV_TEST_USERNAME,
  isDevTestCredentials,
} from "@auxano/shared";

const DEV_AUTH_ENABLED =
  process.env.ALLOW_DEV_AUTH === "true" ||
  process.env.NODE_ENV === "development";

const SECRET =
  process.env.DEV_AUTH_SECRET ?? "auxano-dev-secret-change-in-production";

export function devAuthEnabled() {
  return DEV_AUTH_ENABLED;
}

export function createDevToken(): string {
  const payload = Buffer.from(
    JSON.stringify({
      sub: DEV_TEST_CLERK_ID,
      email: DEV_TEST_EMAIL,
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
    })
  ).toString("base64url");

  const sig = createHmac("sha256", SECRET).update(payload).digest("base64url");
  return `dev.${payload}.${sig}`;
}

export function verifyDevToken(token: string): string | null {
  if (!DEV_AUTH_ENABLED || !token.startsWith("dev.")) return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const payload = parts[1];
  const sig = parts[2];
  const expected = createHmac("sha256", SECRET).update(payload).digest("base64url");

  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (data.exp && data.exp < Date.now()) return null;
    return data.sub as string;
  } catch {
    return null;
  }
}

export function validateDevLogin(email: string, password: string) {
  if (!DEV_AUTH_ENABLED) {
    return { ok: false as const, error: "Dev auth is disabled" };
  }
  if (!isDevTestCredentials(email, password)) {
    return { ok: false as const, error: "Invalid test credentials" };
  }
  return {
    ok: true as const,
    token: createDevToken(),
    user: {
      clerkId: DEV_TEST_CLERK_ID,
      email: DEV_TEST_EMAIL,
      name: DEV_TEST_NAME,
      username: DEV_TEST_USERNAME,
    },
  };
}
