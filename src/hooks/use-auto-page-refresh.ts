"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const TWO_MINUTES_MS = 120_000;

/** Re-fetch server components on public/admin pages every 2 minutes. */
export function useAutoPageRefresh(enabled = true) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => router.refresh(), TWO_MINUTES_MS);
    return () => clearInterval(id);
  }, [router, enabled]);
}
