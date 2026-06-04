import { cookies } from "next/headers";
import type { User } from "@auxano/database";
import { ONBOARDING_SIGNUP_COOKIE } from "@/lib/onboarding-storage";

/** True when user must complete the preference wizard (new sign-up only). */
export async function shouldForceOnboarding(user: User): Promise<boolean> {
  if (user.onboardingComplete) return false;
  const jar = await cookies();
  return jar.get(ONBOARDING_SIGNUP_COOKIE)?.value === "1";
}

/** Sign-in without the sign-up cookie: skip wizard and mark complete with safe defaults. */
export async function ensureSignInOnboardingSkipped(user: User): Promise<User> {
  if (user.onboardingComplete) return user;
  const force = await shouldForceOnboarding(user);
  if (force) return user;

  const { prisma } = await import("@auxano/database");
  return prisma.user.update({
    where: { id: user.id },
    data: {
      onboardingComplete: true,
      investingExperience: user.investingExperience ?? "BEGINNER",
      riskTolerance: user.riskTolerance ?? "MODERATE",
      financialGoal: user.financialGoal ?? "LEARNING",
    },
  });
}
