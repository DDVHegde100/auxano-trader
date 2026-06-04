"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DevUserMenu({ email }: { email: string }) {
  const router = useRouter();

  async function signOut() {
    await fetch("/api/auth/dev-logout", { method: "POST" });
    router.push("/sign-in");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-[var(--border-default)] bg-[var(--accent-muted)] px-3 py-2">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent-muted)] text-sm font-normal text-accent">
        {email[0]?.toUpperCase() ?? "T"}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-foreground">Test User</p>
        <p className="truncate text-xs text-muted">{email}</p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={signOut}
        aria-label="Sign out"
      >
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  );
}
