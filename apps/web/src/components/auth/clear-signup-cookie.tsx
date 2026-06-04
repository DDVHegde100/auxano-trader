"use client";

import { useEffect } from "react";
import { clearSignupOnboardingCookie } from "@/lib/onboarding-storage";

/** Sign-in should never force the post–sign-up onboarding path. */
export function ClearSignupOnboardingCookie() {
  useEffect(() => {
    clearSignupOnboardingCookie();
  }, []);
  return null;
}
