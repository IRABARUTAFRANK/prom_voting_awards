import Image from "next/image";
import { cn } from "@/lib/utils";

type BannerVariant = "home" | "nominate" | "vote" | "dashboard";

const overlays: Record<BannerVariant, string> = {
  home: "from-emerald-950/90 via-emerald-900/70 to-transparent",
  nominate: "from-emerald-950/95 via-teal-900/75 to-emerald-950/40",
  vote: "from-emerald-950/95 via-green-900/80 to-transparent",
  dashboard: "from-emerald-950/90 via-emerald-900/65 to-transparent",
};

export function PageBanner({
  variant = "home",
  title,
  subtitle,
  className,
}: {
  variant?: BannerVariant;
  title: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-emerald-400/20 shadow-xl shadow-emerald-950/40",
        className,
      )}
    >
      <Image
        src="/class_2026.png"
        alt="Hope Haven Christian School Class of 2026"
        width={1200}
        height={400}
        className="h-44 w-full object-cover object-top sm:h-52"
        priority={variant === "home"}
      />
      <div className={cn("absolute inset-0 bg-gradient-to-r", overlays[variant])} />
      <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8">
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{title}</h1>
        {subtitle && (
          <p className="mt-2 max-w-lg text-sm text-emerald-100/85 sm:text-base">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
