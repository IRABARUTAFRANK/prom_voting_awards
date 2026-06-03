"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { PageBanner } from "@/components/page-banner";
import { LiveStatusBar } from "@/components/live-status-bar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLiveRefresh } from "@/hooks/use-live-refresh";
import { AUTO_REFRESH_MS } from "@/lib/refresh-interval";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { BarChart3, ClipboardList, Loader2, Trophy } from "lucide-react";

type MeResponse = {
  voter: {
    fullName: string;
    status: string;
    canParticipate: boolean;
  };
  settings: {
    nominationOpen: boolean;
    finalVoteOpen: boolean;
    liveResultsVisibleToVoters: boolean;
    minApprovedVoters: number;
  };
  approvedCount: number;
  finalistsReady: boolean;
};

const statusLabels: Record<string, string> = {
  APPROVED: "Approved — waiting for admin to open Phase 1 (nominations)",
  NOMINATION_SUBMITTED: "Phase 1 done — wait for top 4 finalists per award",
  FINAL_VOTED: "All done — thanks for voting!",
};

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<MeResponse | null>(null);
  const [initialLoad, setInitialLoad] = useState(true);

  useAuthGuard("/login");

  const load = useCallback(async () => {
    const r = await fetch("/api/voter/me", { cache: "no-store" });
    if (r.status === 401) {
      router.replace("/login");
      return;
    }
    const d = await r.json();
    setData(d);
    setInitialLoad(false);
  }, [router]);

  const { refresh, refreshing, lastUpdated } = useLiveRefresh(load, {
    intervalMs: AUTO_REFRESH_MS,
  });

  async function logout() {
    await fetch("/api/voter/logout", { method: "POST", cache: "no-store" });
    window.location.replace("/");
  }

  if (initialLoad && !data) {
    return (
      <div className="flex min-h-screen items-center justify-center page-bg">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  if (!data) return null;

  const { voter, settings, approvedCount } = data;
  const approved = voter.canParticipate;
  const canNominate =
    approved &&
    voter.status !== "FINAL_VOTED" &&
    voter.status !== "NOMINATION_SUBMITTED" &&
    settings.nominationOpen;
  const canFinalVote =
    approved &&
    voter.status !== "FINAL_VOTED" &&
    settings.finalVoteOpen &&
    data.finalistsReady;

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="mx-auto max-w-2xl flex-1 px-4 py-8">
        <PageBanner
          variant="dashboard"
          title={`Welcome, ${voter.fullName.split(" ")[0]}`}
          subtitle={statusLabels[voter.status] ?? voter.status}
        />

        <div className="mt-4">
          <LiveStatusBar
            onRefresh={refresh}
            refreshing={refreshing}
            lastUpdated={lastUpdated}
            intervalMs={AUTO_REFRESH_MS}
          />
        </div>

        <div className="mt-4 flex justify-end">
          <Button variant="ghost" onClick={logout}>
            Log out
          </Button>
        </div>

        <Card className="mt-6">
          <p className="text-sm text-emerald-200/60">Approved voters (informational)</p>
          <p className="text-2xl font-bold text-white">
            {approvedCount}
            <span className="text-base font-normal text-emerald-200/40">
              {" "}
              / {settings.minApprovedVoters} goal
            </span>
          </p>
          <p className="mt-1 text-xs text-emerald-200/45">
            The goal is for planning only. Admin decides when to approve you and open each phase.
          </p>
        </Card>

        {approved && voter.status === "APPROVED" && !settings.nominationOpen && (
          <Card className="mt-4 border-amber-400/25">
            <p className="text-amber-100/90">
              You are approved and logged in. The admin has <strong>not released</strong> the
              nomination form yet — please wait here. This page refreshes automatically when Phase
              1 opens.
            </p>
          </Card>
        )}

        {approved &&
          voter.status === "NOMINATION_SUBMITTED" &&
          !settings.finalVoteOpen && (
            <Card className="mt-4 border-amber-400/25">
              <p className="text-amber-100/90">
                Phase 1 is complete. The admin has <strong>not released</strong> the final vote form
                yet — please wait here until Phase 2 opens.
              </p>
            </Card>
          )}

        {approved && settings.nominationOpen && voter.status === "APPROVED" && (
          <Card className="mt-6 border-emerald-400/25">
            <div className="flex items-start gap-3">
              <ClipboardList className="mt-1 h-8 w-8 shrink-0 text-emerald-400" />
              <div>
                <h2 className="font-semibold text-white">Phase 1 — Nomination form</h2>
                <p className="mt-2 text-sm text-emerald-100/65">
                  Choose one classmate per award from the Senior Six roster. Type a letter or two,
                  then pick the correct person from the list.
                </p>
                <Link href="/nominate" className="mt-4 inline-block">
                  <Button>Open nomination form →</Button>
                </Link>
              </div>
            </div>
          </Card>
        )}

        {canNominate === false &&
          approved &&
          settings.nominationOpen &&
          voter.status === "NOMINATION_SUBMITTED" && (
            <Card className="mt-6">
              <p className="text-emerald-100/80">
                Phase 1 complete. Top nominees are counted automatically; admin confirms the 4
                finalists per award. You will see Phase 2 here when the admin opens final voting.
              </p>
            </Card>
          )}

        {approved && settings.finalVoteOpen && !data.finalistsReady && (
          <Card className="mt-6 border-amber-400/20">
            <p className="text-amber-100/90">
              Final voting is open, but finalists are not ready for every award yet. Refresh
              shortly — admin may still be confirming the top 4.
            </p>
          </Card>
        )}

        {canFinalVote && (
          <Card className="mt-6 border-teal-400/25">
            <div className="flex items-start gap-3">
              <Trophy className="mt-1 h-8 w-8 shrink-0 text-teal-300" />
              <div>
                <h2 className="font-semibold text-white">Phase 2 — Final vote (live)</h2>
                <p className="mt-2 text-sm text-emerald-100/65">
                  Pick one winner from the 4 finalists for each position. This page updates
                  automatically while the session is open.
                </p>
                <Link href="/vote" className="mt-4 inline-block">
                  <Button>Open final vote form →</Button>
                </Link>
              </div>
            </div>
          </Card>
        )}

        {settings.finalVoteOpen &&
          settings.liveResultsVisibleToVoters &&
          approved && (
          <Card className="mt-6 border-teal-400/25">
            <div className="flex items-start gap-3">
              <BarChart3 className="mt-1 h-8 w-8 shrink-0 text-teal-300" />
              <div>
                <h2 className="font-semibold text-white">Live voting session</h2>
                <p className="mt-2 text-sm text-emerald-100/65">
                  Watch vote counts and percentages for each award update as ballots come in.
                  Use refresh on the live page to see the latest totals.
                </p>
                <Link href="/live" className="mt-4 inline-block">
                  <Button>Open live results →</Button>
                </Link>
              </div>
            </div>
          </Card>
        )}

        {settings.finalVoteOpen &&
          !settings.liveResultsVisibleToVoters &&
          approved &&
          voter.status !== "FINAL_VOTED" && (
            <Card className="mt-6 border-white/10">
              <p className="text-sm text-emerald-100/65">
                Live results are visible to admins only. The admin has not turned on public live
                results for voters.
              </p>
            </Card>
          )}

        {voter.status === "FINAL_VOTED" && (
          <Card className="mt-6 border-emerald-400/30 bg-emerald-500/10">
            <p className="text-emerald-50">You have completed voting. See you at the party!</p>
          </Card>
        )}
      </main>
    </div>
  );
}
