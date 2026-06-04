"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { SystemHealthReport } from "@/lib/health";

export default function StatusPage() {
  const [report, setReport] = useState<SystemHealthReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then(setReport)
      .finally(() => setLoading(false));
    const iv = setInterval(() => {
      fetch("/api/health")
        .then((r) => r.json())
        .then(setReport);
    }, 30_000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="aux-container-narrow aux-stack py-16">
      <Link href="/" className="text-sm text-accent hover:underline">
        ← Home
      </Link>
      <header className="aux-section-header mt-6">
        <h1 className="aux-h1">System status</h1>
        <p>Live probes for database, Clerk, and market data.</p>
      </header>

      {loading && <p className="text-muted">Loading…</p>}

      {report && (
        <>
          <div
            className={`aux-pill ${
              report.status === "healthy"
                ? "border-[var(--positive)]"
                : report.status === "degraded"
                  ? "border-[var(--camel)]"
                  : "border-[var(--negative)]"
            }`}
          >
            <span className="text-lg font-medium capitalize">{report.status}</span>
            <span className="text-xs text-muted ml-3">
              {report.environment} · {report.timestamp}
            </span>
          </div>

          <p className="text-sm text-muted">
            Mobile API: <code>{report.mobile.apiBaseUrl}</code>
          </p>

          <div className="space-y-3">
            {report.checks.map((c) => (
              <div key={c.id} className="aux-card flex justify-between gap-4">
                <div>
                  <p className="font-medium">{c.name}</p>
                  <p className="text-xs text-muted mt-1">{c.message}</p>
                </div>
                <span
                  className={
                    c.status === "pass"
                      ? "text-positive text-sm uppercase"
                      : c.status === "warn"
                        ? "text-accent text-sm uppercase"
                        : "text-negative text-sm uppercase"
                  }
                >
                  {c.status}
                </span>
              </div>
            ))}
          </div>

          <div className="flex gap-4 text-sm">
            <Link href="/api/health" className="text-accent hover:underline" target="_blank">
              JSON health
            </Link>
            <Link href="/api/ready" className="text-accent hover:underline" target="_blank">
              Readiness
            </Link>
            <Link href="/api/live" className="text-accent hover:underline" target="_blank">
              Liveness
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
