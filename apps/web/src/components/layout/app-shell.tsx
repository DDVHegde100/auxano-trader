"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { DevUserMenu } from "@/components/layout/dev-user-menu";
import {
  LayoutDashboard,
  Store,
  Wrench,
  Wallet,
  Trophy,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

const DEV_MODE = process.env.NEXT_PUBLIC_ALLOW_DEV_AUTH === "true";

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
    <div className="aux-app-shell min-h-screen pb-24 md:pb-0 md:pl-[var(--sidebar-width)]">
      <aside className="aux-sidebar fixed bottom-0 left-0 right-0 z-50 border-t md:bottom-auto md:top-0 md:flex md:h-screen md:w-[var(--sidebar-width)] md:flex-col md:border-r md:border-t-0">
        <div className="hidden p-6 md:block">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--border-strong)] bg-[var(--accent-muted)] text-lg text-accent">
              A
            </div>
            <div>
              <p className="text-base text-foreground">Auxano</p>
              <p className="text-xs text-muted">Paper Trading OS</p>
            </div>
          </Link>
        </div>
        <nav className="flex justify-around px-2 py-3 md:flex-col md:gap-1 md:px-4 md:py-4">
          {nav.map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "aux-nav-item flex-col md:flex-row",
                  active && "aux-nav-item-active"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
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
      <main className="aux-app-main aux-container px-[var(--page-padding-x)] py-[var(--page-padding-y)]">
        {children}
      </main>
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
