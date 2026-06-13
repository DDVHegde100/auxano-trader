/** Extract a user-facing message from Clerk API errors. */
export function clerkErrorMessage(e: unknown): string {
  if (e && typeof e === "object" && "errors" in e) {
    const errors = (e as { errors: { longMessage?: string; message?: string }[] })
      .errors;
    const first = errors?.[0];
    if (first) {
      return first.longMessage ?? first.message ?? "Something went wrong";
    }
  }
  if (e instanceof Error && e.message) return e.message;
  return "Something went wrong";
}

/** Normalize a 6-digit email verification code from user input. */
export function normalizeVerificationCode(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 6);
}
