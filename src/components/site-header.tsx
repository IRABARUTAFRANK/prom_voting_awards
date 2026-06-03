import Link from "next/link";
import Image from "next/image";
import { Award } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="border-b border-emerald-400/15 bg-emerald-950/40 backdrop-blur-lg">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-3 font-bold text-white">
          <span className="relative flex h-10 w-10 overflow-hidden rounded-xl ring-2 ring-emerald-400/30 bg-emerald-950/20">
            <Image src="/alliance-logo.png" alt="Alliance logo" width={40} height={40} className="object-cover" />
          </span>
          <span className="bg-gradient-to-r from-emerald-100 to-teal-200 bg-clip-text text-transparent">
            Promo Awards &apos;26
          </span>
        </Link>
        <nav className="flex gap-4 text-sm">
          <Link href="/register" className="text-emerald-200/90 hover:text-white">
            Register
          </Link>
          <Link href="/login" className="text-emerald-200/90 hover:text-white">
            Login
          </Link>
          <Link
            href="/admin"
            className="flex items-center gap-1 text-emerald-100/50 hover:text-emerald-100"
          >
            <Award className="h-3.5 w-3.5" />
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}
