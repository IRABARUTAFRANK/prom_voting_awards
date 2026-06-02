import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-xl border border-emerald-400/20 bg-emerald-950/30 px-4 py-3 text-emerald-50 placeholder:text-emerald-200/35 outline-none transition focus:border-emerald-400/50 focus:ring-4 focus:ring-emerald-500/15",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
