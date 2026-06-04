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
    <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#00C853]/20 text-sm font-semibold text-[#00C853]">
        {email[0]?.toUpperCase() ?? "T"}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[#F5F5F5]">Test User</p>
        <p className="truncate text-xs text-[#B0B0B0]">{email}</p>
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
