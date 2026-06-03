"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { PageBanner } from "@/components/page-banner";
import { LiveStatusBar } from "@/components/live-status-bar";
import { LiveVoteResults, type LiveResultPosition } from "@/components/live-vote-results";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLiveRefresh } from "@/hooks/use-live-refresh";
import { AUTO_REFRESH_MS } from "@/lib/refresh-interval";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { Loader2, Radio } from "lucide-react";

type LiveResponse = {
  finalVoteOpen: boolean;
  totalBallots: number;
  results: LiveResultPosition[];
  error?: string;
};

export default function LiveSessionPage() {
  const router = useRouter();
  useAuthGuard("/login");
  const [data, setData] = useState<LiveResponse | null>(null);
  const [initialLoad, setInitialLoad] = useState(true);
  const [blocked, setBlocked] = useState("");

  const load = useCallback(async () => {
    const r = await fetch("/api/voter/live-results", { cache: "no-store" });
    if (r.status === 401) {
      router.replace("/login");
      return;
    }
    const json = await r.json();
    if (!r.ok) {
      setBlocked(json.error ?? "Live session is not available yet.");
      setData(null);
      setInitialLoad(false);
      return;
    }
    setBlocked("");
    setData(json);
    setInitialLoad(false);
  }, [router]);

  const { refresh, refreshing, lastUpdated } = useLiveRefresh(load, {
    intervalMs: AUTO_REFRESH_MS,
  });

  if (initialLoad && !data && !blocked) {
    return (
      <div className="flex min-h-screen items-center justify-center page-bg">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="mx-auto max-w-2xl flex-1 px-4 py-8">
        <Link href="/dashboard" className="text-sm text-emerald-300 hover:text-white">
          ← Dashboard
        </Link>

        <div className="mt-4">
          <PageBanner
            variant="vote"
            title="Live voting session"
            subtitle="Vote counts and percentages per award — refresh to see the latest totals."
          />
        </div>

        <div className="mt-4 flex items-center gap-2 text-sm text-teal-200/80">
          <Radio className="h-4 w-4 text-teal-400" />
          {data?.finalVoteOpen
            ? "Final voting is open — results update as ballots are cast."
            : "Session snapshot — voting may be closed; totals reflect ballots received."}
        </div>

        <div className="mt-4">
          <LiveStatusBar
            onRefresh={refresh}
            refreshing={refreshing}
            lastUpdated={lastUpdated}
            intervalMs={AUTO_REFRESH_MS}
          />
        </div>

        {blocked ? (
          <Card className="mt-8">
            <p className="text-amber-100">{blocked}</p>
            <Link href="/dashboard" className="mt-4 inline-block">
              <Button variant="secondary">Back to dashboard</Button>
            </Link>
          </Card>
        ) : data ? (
          <div className="mt-8">
            <LiveVoteResults results={data.results} totalBallots={data.totalBallots} />
          </div>
        ) : null}
      </main>
    </div>
  );
}
