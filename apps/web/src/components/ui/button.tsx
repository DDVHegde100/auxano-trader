import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-normal transition-all duration-[var(--duration-fast)] ease-[var(--ease-out)] focus-visible:outline-none disabled:pointer-events-none disabled:opacity-45 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--gradient-accent)] text-[var(--antique-white)] border border-[rgba(255,237,216,0.12)] shadow-[var(--shadow-md)] hover:brightness-105",
        primary:
          "bg-[var(--gradient-accent)] text-[var(--antique-white)] border border-[rgba(255,237,216,0.12)] shadow-[var(--shadow-md)] hover:brightness-105",
        secondary:
          "bg-[var(--accent-muted)] text-[var(--foreground)] border border-[var(--border-default)] hover:border-[var(--border-strong)] hover:bg-[rgba(188,138,95,0.28)]",
        ghost:
          "text-[var(--foreground-secondary)] hover:bg-[var(--accent-muted)] hover:text-[var(--foreground)]",
        danger:
          "bg-[var(--negative-muted)] text-[var(--soft-apricot)] border border-[rgba(139,94,52,0.35)] hover:brightness-110",
        accent:
          "bg-[var(--accent-muted)] text-[var(--accent)] border border-[var(--border-strong)]",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-9 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
