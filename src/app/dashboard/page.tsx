"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { PageBanner } from "@/components/page-banner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ClipboardList, Loader2, Trophy } from "lucide-react";

type MeResponse = {
  voter: {
    fullName: string;
    status: string;
  };
  settings: {
    nominationOpen: boolean;
    finalVoteOpen: boolean;
    minApprovedVoters: number;
  };
  approvedCount: number;
};

const statusLabels: Record<string, string> = {
  PENDING: "Waiting for admin approval",
  APPROVED: "Ready — open Phase 1 nomination form",
  NOMINATION_SUBMITTED: "Phase 1 done — wait for top 4 finalists",
  FINAL_VOTED: "All done — thanks for voting!",
};

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/voter/me")
      .then((r) => {
        if (r.status === 401) {
          router.replace("/login");
          return null;
        }
        return r.json();
      })
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, [router]);

  async function logout() {
    await fetch("/api/voter/logout", { method: "POST" });
    router.push("/");
  }

  if (loading || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center page-bg">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  const { voter, settings, approvedCount } = data;
  const canNominate = voter.status === "APPROVED" && settings.nominationOpen;
  const canFinalVote =
    voter.status !== "FINAL_VOTED" &&
    voter.status !== "PENDING" &&
    settings.finalVoteOpen;

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="mx-auto max-w-2xl flex-1 px-4 py-8">
        <PageBanner
          variant="dashboard"
          title={`Welcome, ${voter.fullName.split(" ")[0]}`}
          subtitle={statusLabels[voter.status]}
        />

        <div className="mt-6 flex justify-end">
          <Button variant="ghost" onClick={logout}>
            Log out
          </Button>
        </div>

        <Card className="mt-6">
          <p className="text-sm text-emerald-200/60">Approved voters</p>
          <p className="text-2xl font-bold text-white">
            {approvedCount}
            <span className="text-base font-normal text-emerald-200/40">
              {" "}
              / {settings.minApprovedVoters} target
            </span>
          </p>
        </Card>

        {voter.status === "PENDING" && (
          <Card className="mt-4 border-amber-400/25">
            <p className="text-amber-100/90">
              Your registration is pending. An admin will approve you when enough students have
              registered.
            </p>
          </Card>
        )}

        {canNominate && (
          <Card className="mt-6 border-emerald-400/25">
            <div className="flex items-start gap-3">
              <ClipboardList className="mt-1 h-8 w-8 shrink-0 text-emerald-400" />
              <div>
                <h2 className="font-semibold text-white">Phase 1 — Nomination form</h2>
                <p className="mt-2 text-sm text-emerald-100/65">
                  Choose one classmate per award from the school roster. Names must be selected
                  from the list — type a few letters, then tap the correct person.
                </p>
                <Link href="/nominate" className="mt-4 inline-block">
                  <Button>Open nomination form →</Button>
                </Link>
              </div>
            </div>
          </Card>
        )}

        {voter.status === "NOMINATION_SUBMITTED" && !settings.finalVoteOpen && (
          <Card className="mt-6">
            <p className="text-emerald-100/80">
              Phase 1 complete. The system counts nominations and admins confirm the top 4 per
              award. You will vote on the final form when Phase 2 opens.
            </p>
          </Card>
        )}

        {canFinalVote && (
          <Card className="mt-6 border-teal-400/25">
            <div className="flex items-start gap-3">
              <Trophy className="mt-1 h-8 w-8 shrink-0 text-teal-300" />
              <div>
                <h2 className="font-semibold text-white">Phase 2 — Final vote form</h2>
                <p className="mt-2 text-sm text-emerald-100/65">
                  Pick one winner from the 4 finalists for each position (chosen by vote count +
                  admin).
                </p>
                <Link href="/vote" className="mt-4 inline-block">
                  <Button>Open final vote form →</Button>
                </Link>
              </div>
            </div>
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
