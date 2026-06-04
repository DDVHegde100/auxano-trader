"use client";

import { ClerkProvider } from "@clerk/nextjs";

export function AppProviders({
  children,
  devAuth,
}: {
  children: React.ReactNode;
  devAuth: boolean;
}) {
  if (devAuth) return <>{children}</>;

  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!}
    >
      {children}
    </ClerkProvider>
  );
}
