import Constants from "expo-constants";

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  Constants.expoConfig?.extra?.apiUrl ??
  "http://localhost:3000";

export async function apiFetch<T>(
  path: string,
  options?: RequestInit & { token?: string }
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  };
  if (options?.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Request failed");
  return data as T;
}

export { API_URL };
