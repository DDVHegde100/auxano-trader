export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { getOrCreateDbUser } from "@/lib/auth";
import { getSessionClerkId } from "@/lib/session";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userId = await getSessionClerkId();
  if (!userId) redirect("/sign-in");

  const user = await getOrCreateDbUser();
  if (user && !user.onboardingComplete) {
    redirect("/onboarding");
  }

  return <AppShell>{children}</AppShell>;
}
