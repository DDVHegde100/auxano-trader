import { useEffect } from "react";
import { useRouter } from "expo-router";
import { useAppAuth } from "@/src/hooks/useAuth";

/** Redirects to sign-in when session is missing. Returns true when authenticated. */
export function useRequireAuth(): boolean {
  const { isLoaded, isSignedIn } = useAppAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace("/(auth)/sign-in");
    }
  }, [isLoaded, isSignedIn, router]);

  return isLoaded && isSignedIn;
}
