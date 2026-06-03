"use client";

import { useCallback, useEffect, useState } from "react";

type Options = {
  /** Poll interval in ms; 0 disables polling */
  intervalMs?: number;
  enabled?: boolean;
};

export function useLiveRefresh(
  fetcher: () => Promise<void>,
  { intervalMs = 6000, enabled = true }: Options = {},
) {
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetcher();
      setLastUpdated(new Date());
    } finally {
      setRefreshing(false);
    }
  }, [fetcher]);

  useEffect(() => {
    if (!enabled) return;
    refresh();
    if (!intervalMs) return;
    const id = setInterval(refresh, intervalMs);
    return () => clearInterval(id);
  }, [refresh, intervalMs, enabled]);

  return { refresh, refreshing, lastUpdated };
}
