import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const variants: Record<Variant, string> = {
  primary:
    "bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-900/40 hover:from-emerald-500 hover:to-teal-400",
  secondary:
    "bg-emerald-950/50 text-emerald-50 border border-emerald-400/25 hover:bg-emerald-900/40 backdrop-blur",
  ghost: "text-emerald-200 hover:bg-emerald-500/10",
  danger: "bg-red-600/90 text-white hover:bg-red-500",
};

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }
>(({ className, variant = "primary", ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition disabled:opacity-50 disabled:pointer-events-none",
      variants[variant],
      className,
    )}
    {...props}
  />
));
Button.displayName = "Button";
