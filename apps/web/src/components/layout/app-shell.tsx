"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { DevUserMenu } from "@/components/layout/dev-user-menu";

const DEV_MODE = process.env.NEXT_PUBLIC_ALLOW_DEV_AUTH === "true";
import {
  LayoutDashboard,
  Store,
  Wrench,
  Wallet,
  Trophy,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/marketplace", label: "Marketplace", icon: Store },
  { href: "/builder", label: "Builder", icon: Wrench },
  { href: "/trade", label: "Trade", icon: TrendingUp },
  { href: "/portfolio", label: "Portfolio", icon: Wallet },
  { href: "/leaderboard", label: "Leaders", icon: Trophy },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#111111] pb-24 md:pb-0 md:pl-64">
      <aside className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.08] bg-[#1A1A1A]/95 backdrop-blur-2xl md:bottom-auto md:top-0 md:flex md:h-screen md:w-64 md:flex-col md:border-r md:border-t-0">
        <div className="hidden p-6 md:block">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-lg font-bold">
              A
            </div>
            <div>
              <p className="font-semibold text-[#F5F5F5]">Auxano</p>
              <p className="text-xs text-[#B0B0B0]">Paper Trading OS</p>
            </div>
          </Link>
        </div>
        <nav className="flex justify-around px-2 py-3 md:flex-col md:gap-1 md:px-4 md:py-2">
          {nav.map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl px-3 py-2 text-xs transition-all md:flex-row md:gap-3 md:px-4 md:py-3 md:text-sm",
                  active
                    ? "bg-white/[0.08] text-[#F5F5F5]"
                    : "text-[#B0B0B0] hover:bg-white/[0.04] hover:text-[#F5F5F5]"
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="hidden md:mt-auto md:block md:p-4">
          {DEV_MODE ? (
            <DevUserMenu email="test@gmail.com" />
          ) : (
            <UserButton
              appearance={{
                elements: { avatarBox: "h-10 w-10" },
              }}
            />
          )}
        </div>
      </aside>
      <main className="mx-auto max-w-6xl px-4 py-6 md:px-8">{children}</main>
      <div className="fixed right-4 top-4 z-40 md:hidden">
        {DEV_MODE ? (
          <DevUserMenu email="test@gmail.com" />
        ) : (
          <UserButton />
        )}
      </div>
    </div>
  );
}
