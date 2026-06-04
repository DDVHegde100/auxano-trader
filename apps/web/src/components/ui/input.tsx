import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-sm text-[#F5F5F5] backdrop-blur-xl placeholder:text-[#B0B0B0]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20",
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Input.displayName = "Input";

export { Input };
