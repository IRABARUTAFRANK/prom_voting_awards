import Image from "next/image";
import { cn } from "@/lib/utils";

type BannerVariant = "home" | "nominate" | "vote" | "dashboard";

const banners: Record<
  BannerVariant,
  { src: string; alt: string; overlay: string }
> = {
  home: {
    src: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200&q=80",
    alt: "Students celebrating graduation",
    overlay: "from-emerald-950/90 via-emerald-900/70 to-transparent",
  },
  nominate: {
    src: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&q=80",
    alt: "Friends together",
    overlay: "from-emerald-950/95 via-teal-900/75 to-emerald-950/40",
  },
  vote: {
    src: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1200&q=80",
    alt: "Celebration lights",
    overlay: "from-emerald-950/95 via-green-900/80 to-transparent",
  },
  dashboard: {
    src: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=1200&q=80",
    alt: "Event celebration",
    overlay: "from-emerald-950/90 via-emerald-900/65 to-transparent",
  },
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
  const b = banners[variant];
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-emerald-400/20 shadow-xl shadow-emerald-950/40",
        className,
      )}
    >
      <Image
        src={b.src}
        alt={b.alt}
        width={1200}
        height={400}
        className="h-44 w-full object-cover sm:h-52"
        priority={variant === "home"}
      />
      <div className={cn("absolute inset-0 bg-gradient-to-r", b.overlay)} />
      <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8">
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{title}</h1>
        {subtitle && (
          <p className="mt-2 max-w-lg text-sm text-emerald-100/85 sm:text-base">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
