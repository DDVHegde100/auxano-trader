"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Link2, Share2, Printer } from "lucide-react";

type ShareCardActionsProps = {
  publicUrl: string;
  imageUrl: string;
  title: string;
  text: string;
};

export function ShareCardActions({
  publicUrl,
  imageUrl,
  title,
  text,
}: ShareCardActionsProps) {
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setStatus("Link copied");
      setTimeout(() => {
        setCopied(false);
        setStatus(null);
      }, 2000);
    } catch {
      setStatus("Could not copy — select link manually");
    }
  }

  async function nativeShare() {
    if (!navigator.share) {
      await copyLink();
      return;
    }
    try {
      await navigator.share({
        title,
        text,
        url: publicUrl,
      });
      setStatus("Shared");
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setStatus("Share cancelled or unavailable");
      }
    }
  }

  function downloadPng() {
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = `auxano-${title.replace(/\s+/g, "-").toLowerCase()}.png`;
    a.target = "_blank";
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setStatus("Downloading PNG…");
  }

  function printCard() {
    window.print();
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={nativeShare} className="gap-2">
          <Share2 className="h-4 w-4" />
          Share
        </Button>
        <Button type="button" variant="secondary" onClick={downloadPng} className="gap-2">
          <Download className="h-4 w-4" />
          Download PNG
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={copyLink}
          className="gap-2"
          disabled={copied}
        >
          <Link2 className="h-4 w-4" />
          {copied ? "Copied" : "Copy link"}
        </Button>
        <Button type="button" variant="ghost" onClick={printCard} className="gap-2 print:hidden">
          <Printer className="h-4 w-4" />
          Print / PDF
        </Button>
      </div>
      {status && (
        <p className="text-sm text-[var(--foreground-muted)]">{status}</p>
      )}
      <p className="break-all text-xs text-[var(--foreground-muted)]">{publicUrl}</p>
    </div>
  );
}
