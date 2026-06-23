"use client";

import { ClerkProvider } from "@clerk/nextjs";

const DEV_MODE = process.env.NEXT_PUBLIC_ALLOW_DEV_AUTH === "true";
const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";

export function AppProviders({ children }: { children: React.ReactNode }) {
  if (DEV_MODE || !publishableKey) {
    return <>{children}</>;
  }

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/onboarding"
      afterSignInUrl="/dashboard"
      afterSignUpUrl="/onboarding"
    >
      {children}
    </ClerkProvider>
  );
}
