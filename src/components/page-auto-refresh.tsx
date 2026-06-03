"use client";

import { useAutoPageRefresh } from "@/hooks/use-auto-page-refresh";

/** Auto router.refresh() every 2 minutes on public and admin login pages. */
export function PageAutoRefresh() {
  useAutoPageRefresh(true);
  return null;
}
