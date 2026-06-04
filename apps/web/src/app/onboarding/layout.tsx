export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getSessionClerkId } from "@/lib/session";
import { getOrCreateDbUser } from "@/lib/auth";
import { checkDatabaseConnection } from "@/lib/db-health";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userId = await getSessionClerkId();
  if (!userId) redirect("/sign-up");

  const db = await checkDatabaseConnection();
  if (!db.ok) {
    redirect("/sign-up?error=database");
  }

  await getOrCreateDbUser();

  return (
    <div className="min-h-screen bg-[var(--background)]">{children}</div>
  );
}
