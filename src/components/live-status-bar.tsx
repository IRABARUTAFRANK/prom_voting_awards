"use client";

import { Button } from "@/components/ui/button";
import { Loader2, Radio } from "lucide-react";

type Props = {
  onRefresh: () => void;
  refreshing: boolean;
  lastUpdated: Date | null;
  /** Poll interval in ms; omit when manualOnly */
  intervalMs?: number;
  /** When true, only manual refresh (no auto interval). */
  manualOnly?: boolean;
};

export function LiveStatusBar({
  onRefresh,
  refreshing,
  lastUpdated,
  intervalMs = 120_000,
  manualOnly = false,
}: Props) {
  const minutes = intervalMs / 60_000;
  const statusLabel = manualOnly
    ? "Click Refresh now to update"
    : `Auto-updates every ${minutes} min · Refresh now anytime`;

  return (
    <div className="flex flex-wrap items-center justify-end gap-2 text-sm text-emerald-200/60">
      <span className="flex items-center gap-1.5">
        <Radio
          className={`h-3.5 w-3.5 text-emerald-400 ${manualOnly ? "" : "animate-pulse"}`}
        />
        {manualOnly ? "Manual refresh" : "Live"} · {statusLabel}
        {lastUpdated && (
          <span className="text-emerald-200/40">
            · last {lastUpdated.toLocaleTimeString()}
          </span>
        )}
      </span>
      <Button variant="ghost" className="px-3 py-1.5 text-xs" onClick={onRefresh} disabled={refreshing}>
        {refreshing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          "Refresh now"
        )}
      </Button>
    </div>
  );
}
