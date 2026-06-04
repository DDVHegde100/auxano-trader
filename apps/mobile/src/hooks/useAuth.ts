/**
 * Unified auth hook — dev test login OR Clerk.
 * Set EXPO_PUBLIC_USE_DEV_AUTH=true in apps/mobile/.env (default in run script).
 */
import { useAuth as useClerkAuth } from "@clerk/clerk-expo";
import { useDevAuth } from "@/src/context/DevAuthContext";

const USE_DEV = process.env.EXPO_PUBLIC_USE_DEV_AUTH === "true";

export function useAppAuth() {
  if (USE_DEV) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useDevAuth();
  }
  const clerk = useClerkAuth();
  return {
    isLoaded: clerk.isLoaded,
    isSignedIn: clerk.isSignedIn ?? false,
    getToken: clerk.getToken,
    signOut: () => clerk.signOut(),
    signIn: async (_email?: string, _password?: string) => {
      throw new Error("Set EXPO_PUBLIC_USE_DEV_AUTH=true for test login");
    },
  };
}

export { USE_DEV as isDevAuthMode };
