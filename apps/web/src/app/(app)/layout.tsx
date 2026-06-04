export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { getOrCreateDbUser } from "@/lib/auth";
import { getSessionClerkId } from "@/lib/session";
import { checkDatabaseConnection } from "@/lib/db-health";
import {
  ensureSignInOnboardingSkipped,
  shouldForceOnboarding,
} from "@/lib/onboarding-policy";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userId = await getSessionClerkId();
  if (!userId) redirect("/sign-in");

  const db = await checkDatabaseConnection();
  if (!db.ok) {
    redirect("/sign-in?error=database");
  }

  let user;
  try {
    user = await getOrCreateDbUser();
  } catch {
    redirect("/sign-in?error=account");
  }

  if (user) {
    user = await ensureSignInOnboardingSkipped(user);
    if (await shouldForceOnboarding(user)) {
      redirect("/onboarding");
    }
  }

  return <AppShell>{children}</AppShell>;
}
