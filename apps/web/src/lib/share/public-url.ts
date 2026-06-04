/** Canonical public base URL for share links and OG tags. */
export function getPublicAppUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (url) return url.replace(/\/$/, "");
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  }
  return "https://auxano-red.vercel.app";
}

export function portfolioSharePath(username: string, period = "week"): string {
  return `/u/${encodeURIComponent(username.toLowerCase())}/${period}`;
}

export function portfolioShareUrl(username: string, period = "week"): string {
  return `${getPublicAppUrl()}${portfolioSharePath(username, period)}`;
}

export function strategySharePath(slug: string): string {
  return `/share/s/${encodeURIComponent(slug)}`;
}

export function strategyShareUrl(slug: string): string {
  return `${getPublicAppUrl()}${strategySharePath(slug)}`;
}

export function shareImageApiUrl(params: Record<string, string>): string {
  const q = new URLSearchParams(params).toString();
  return `${getPublicAppUrl()}/api/share/image?${q}`;
}
