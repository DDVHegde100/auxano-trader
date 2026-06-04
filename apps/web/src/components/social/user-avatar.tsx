import { cn } from "@/lib/utils";

export function UserAvatar({
  name,
  username,
  avatarUrl,
  size = "md",
  className,
}: {
  name?: string | null;
  username?: string | null;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const label =
    name?.charAt(0)?.toUpperCase() ??
    username?.charAt(0)?.toUpperCase() ??
    "?";
  const dim =
    size === "sm" ? "h-9 w-9 text-sm" : size === "lg" ? "h-14 w-14 text-xl" : "h-11 w-11 text-base";

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name ?? username ?? "User"}
        className={cn("rounded-full border border-white/10 object-cover", dim, className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--accent-muted)] font-semibold text-accent",
        dim,
        className
      )}
    >
      {label}
    </div>
  );
}
