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
  Users,
  UserCircle,
  Swords,
  Bot,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/notifications/notification-bell";

const DEV_MODE = process.env.NEXT_PUBLIC_ALLOW_DEV_AUTH === "true";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/marketplace", label: "Marketplace", icon: Store },
  { href: "/builder", label: "Builder", icon: Wrench },
  { href: "/trade", label: "Trade", icon: TrendingUp },
  { href: "/bots", label: "Bots", icon: Bot },
  { href: "/portfolio", label: "Portfolio", icon: Wallet },
  { href: "/leaderboard", label: "Leaders", icon: Trophy },
  { href: "/compete", label: "Compete", icon: Swords },
  { href: "/friends", label: "Friends", icon: Users },
  { href: "/profile", label: "Profile", icon: UserCircle },
];

const mobileNav = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/marketplace", label: "Algo", icon: Store },
  { href: "/trade", label: "Trade", icon: TrendingUp },
  { href: "/bots", label: "Bots", icon: Bot },
  { href: "/portfolio", label: "Portfolio", icon: Wallet },
  { href: "/profile", label: "More", icon: UserCircle },
];

function NavLink({
  item,
  active,
  mobile,
}: {
  item: (typeof nav)[number];
  active: boolean;
  mobile?: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "aux-nav-item",
        mobile ? "aux-mobile-tab" : "flex-col md:flex-row",
        active && "aux-nav-item-active"
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span className={mobile ? "aux-mobile-tab-label" : undefined}>{item.label}</span>
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="aux-app-shell min-h-screen md:pl-[var(--sidebar-width)]">
      <header className="aux-mobile-topbar md:hidden">
        <Link href="/dashboard" className="aux-mobile-topbar-brand">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border-strong)] bg-[var(--accent-muted)] text-sm text-accent">
            A
          </div>
          <span className="text-sm text-foreground">Auxano</span>
        </Link>
        <div className="flex shrink-0 items-center gap-2">
          <NotificationBell />
          {DEV_MODE ? (
            <DevUserMenu email="test@gmail.com" compact />
          ) : (
            <UserButton appearance={{ elements: { avatarBox: "h-9 w-9" } }} />
          )}
        </div>
      </header>

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
        <nav className="aux-mobile-tabbar md:flex md:flex-col md:gap-1 md:overflow-visible md:px-4 md:py-4">
          {nav.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={pathname.startsWith(item.href)}
              mobile={false}
            />
          ))}
          {mobileNav.map((item) => (
            <NavLink
              key={`mobile-${item.href}`}
              item={item}
              active={pathname.startsWith(item.href)}
              mobile
            />
          ))}
        </nav>
        <div className="hidden md:mt-auto md:block md:space-y-3 md:p-4">
          <div className="flex items-center justify-between gap-2 px-1">
            <span className="text-xs text-[var(--foreground-muted)]">Alerts</span>
            <NotificationBell />
          </div>
          {DEV_MODE ? (
            <DevUserMenu email="test@gmail.com" />
          ) : (
            <UserButton appearance={{ elements: { avatarBox: "h-10 w-10" } }} />
          )}
        </div>
      </aside>

      <div className="fixed right-6 top-6 z-40 hidden items-center gap-2 md:flex">
        <NotificationBell />
        {DEV_MODE ? <DevUserMenu email="test@gmail.com" /> : <UserButton />}
      </div>

      <main className="aux-app-main aux-container px-[var(--page-padding-x)] py-[var(--page-padding-y)]">
        {children}
      </main>
    </div>
  );
}
