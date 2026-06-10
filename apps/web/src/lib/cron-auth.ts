/** Validates Vercel cron or manual ops trigger. */
export function assertCronAuthorized(req: Request): void {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("CRON_SECRET not configured");
    }
    return;
  }
  const auth = req.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return;
  const header = req.headers.get("x-cron-secret");
  if (header === secret) return;
  throw new Error("Unauthorized cron");
}
