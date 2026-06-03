"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AUTO_REFRESH_MS } from "@/lib/refresh-interval";

/** Re-fetch server components on public/admin pages every 2 minutes. */
export function useAutoPageRefresh(enabled = true) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => router.refresh(), AUTO_REFRESH_MS);
    return () => clearInterval(id);
  }, [router, enabled]);
}
