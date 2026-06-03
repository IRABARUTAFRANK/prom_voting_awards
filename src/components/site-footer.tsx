import Image from "next/image";
import { Heart } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mx-auto mt-8 max-w-5xl px-4 py-6 text-center text-sm text-emerald-200/60">
      Made with{" "}
      <Heart
        className="mx-0.5 inline h-3.5 w-3.5 fill-rose-600 text-rose-600"
        aria-hidden
      />{" "}
      by{" "}
      <span className="inline-flex items-center gap-1.5 align-middle">
        <Image
          src="/ifrank-logo.png"
          alt=""
          width={28}
          height={28}
          className="inline-block rounded object-contain"
        />
        I.Frank
      </span>{" "}
      &amp;{" "}
      <span className="inline-flex items-center gap-1.5 align-middle">
        <Image
          src="/brhema-logo.png"
          alt=""
          width={28}
          height={28}
          className="inline-block rounded object-contain"
        />
        B.Rhema
      </span>
    </footer>
  );
}
