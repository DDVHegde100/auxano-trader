"use client";

import { useEffect } from "react";
import { setSignupOnboardingCookie } from "@/lib/onboarding-storage";

/** Marks this session as post–sign-up so app shell only routes incomplete users to onboarding once. */
export function SignupOnboardingCookie() {
  useEffect(() => {
    setSignupOnboardingCookie();
  }, []);
  return null;
}
