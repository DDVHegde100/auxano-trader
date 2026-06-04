export type CheckStatus = "pass" | "fail" | "warn";

export interface HealthCheckResult {
  id: string;
  name: string;
  status: CheckStatus;
  latencyMs?: number;
  message?: string;
  details?: Record<string, string | number | boolean>;
}

export interface SystemHealthReport {
  status: "healthy" | "degraded" | "unhealthy";
  service: string;
  version: string;
  environment: string;
  region?: string;
  timestamp: string;
  uptimeSeconds: number;
  checks: HealthCheckResult[];
  summary: {
    pass: number;
    warn: number;
    fail: number;
  };
  mobile: {
    apiBaseUrl: string;
    corsEnabled: boolean;
  };
}
