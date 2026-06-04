import { API_URL } from "./api";

export type ApiHealthSummary = {
  status: "healthy" | "degraded" | "unhealthy";
  ready: boolean;
  apiBaseUrl: string;
  message?: string;
};

export async function fetchApiHealth(): Promise<ApiHealthSummary> {
  try {
    const [healthRes, readyRes] = await Promise.all([
      fetch(`${API_URL}/api/health?market=0`, {
        headers: { Accept: "application/json" },
      }),
      fetch(`${API_URL}/api/ready`, {
        headers: { Accept: "application/json" },
      }),
    ]);

    const health = await healthRes.json();
    const ready = await readyRes.json();

    return {
      status: health.status ?? "unhealthy",
      ready: readyRes.ok && ready.ready === true,
      apiBaseUrl: health.mobile?.apiBaseUrl ?? API_URL,
      message: health.status !== "healthy" ? health.checks?.[0]?.message : undefined,
    };
  } catch (e) {
    return {
      status: "unhealthy",
      ready: false,
      apiBaseUrl: API_URL,
      message: e instanceof Error ? e.message : "Cannot reach API",
    };
  }
}
