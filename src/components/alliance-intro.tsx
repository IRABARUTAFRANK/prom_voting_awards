"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const INTRO_MS = 10_000;
const STORAGE_KEY = "alliance_intro_seen";

type Phase = "hidden" | "intro" | "done";

export function AllianceIntro({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<Phase>("hidden");

  useEffect(() => {
    if (sessionStorage.getItem(STORAGE_KEY)) {
      setPhase("done");
      return;
    }
    sessionStorage.setItem(STORAGE_KEY, "1");
    setPhase("intro");
    const timer = window.setTimeout(() => setPhase("done"), INTRO_MS);
    return () => window.clearTimeout(timer);
  }, []);

  if (phase === "hidden") {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black">
        <div className="h-10 w-10 animate-pulse rounded-full bg-amber-500/20" />
      </div>
    );
  }

  if (phase === "intro") {
    return (
      <div
        className="alliance-intro fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black px-6 text-center"
        role="presentation"
        aria-hidden
      >
        <div className="alliance-intro-glow pointer-events-none absolute inset-0" />
        <p className="alliance-intro-text-1 text-sm font-medium uppercase tracking-[0.35em] text-amber-200/80 sm:text-base">
          Brought to you by
        </p>
        <div className="alliance-intro-logo relative mt-8 h-40 w-40 sm:h-52 sm:w-52">
          <Image
            src="/alliance-logo.png"
            alt="The Alliance"
            fill
            className="object-contain drop-shadow-[0_0_40px_rgba(251,191,36,0.35)]"
            priority
          />
        </div>
        <h1 className="alliance-intro-text-2 mt-8 font-serif text-3xl font-bold tracking-wide text-amber-100 sm:text-4xl">
          THE Alliance
        </h1>
        <p className="alliance-intro-text-3 mt-4 text-sm text-amber-200/50">
          Promo Awards Vote &apos;26
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
