import { useAuth } from "@clerk/clerk-expo";
import { apiFetch } from "@/src/lib/api";

export function useAuthenticatedFetch() {
  const { getToken } = useAuth();

  return async function fetchAuth<T>(path: string, init?: RequestInit): Promise<T> {
    const token = await getToken();
    return apiFetch<T>(path, { ...init, token: token ?? undefined });
  };
}
