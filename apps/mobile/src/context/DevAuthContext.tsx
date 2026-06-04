import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { apiFetch } from "@/src/lib/api";
import { clearDevToken, getDevToken, saveDevToken } from "@/src/lib/dev-auth-store";
import { DEV_TEST_EMAIL, DEV_TEST_PASSWORD } from "@auxano/shared";

type DevUser = { id: string; email: string; name: string | null; username: string | null };

type DevAuthContextValue = {
  isLoaded: boolean;
  isSignedIn: boolean;
  user: DevUser | null;
  getToken: () => Promise<string | null>;
  signIn: (email?: string, password?: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const DevAuthContext = createContext<DevAuthContextValue | null>(null);

export function DevAuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [user, setUser] = useState<DevUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const stored = await getDevToken();
      if (stored) {
        setToken(stored);
        setUser({
          id: "dev",
          email: DEV_TEST_EMAIL,
          name: "Test User",
          username: "testuser",
        });
      }
      setIsLoaded(true);
    })();
  }, []);

  const getToken = useCallback(async () => token ?? getDevToken(), [token]);

  const signIn = useCallback(async (email = DEV_TEST_EMAIL, password = DEV_TEST_PASSWORD) => {
    const res = await apiFetch<{ token: string; user: DevUser }>("/api/auth/dev-login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    await saveDevToken(res.token);
    setToken(res.token);
    setUser(res.user);
  }, []);

  const signOut = useCallback(async () => {
    await clearDevToken();
    setToken(null);
    setUser(null);
  }, []);

  return (
    <DevAuthContext.Provider
      value={{
        isLoaded,
        isSignedIn: !!token,
        user,
        getToken,
        signIn,
        signOut,
      }}
    >
      {children}
    </DevAuthContext.Provider>
  );
}

export function useDevAuth() {
  const ctx = useContext(DevAuthContext);
  if (!ctx) throw new Error("useDevAuth must be used within DevAuthProvider");
  return ctx;
}
