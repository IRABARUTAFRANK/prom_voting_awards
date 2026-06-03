"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Re-validates session after logout so the browser back button cannot restore a cached portal. */
export function useAuthGuard(redirectTo = "/login") {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      const r = await fetch("/api/voter/me", { cache: "no-store" });
      if (cancelled) return;
      if (r.status === 401) {
        router.replace(redirectTo);
      }
    }

    void verify();

    function onPageShow(event: PageTransitionEvent) {
      if (event.persisted) {
        void verify();
      }
    }

    window.addEventListener("pageshow", onPageShow);
    return () => {
      cancelled = true;
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [redirectTo, router]);
}
