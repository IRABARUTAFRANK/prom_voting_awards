"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { PageBanner } from "@/components/page-banner";
import { LiveStatusBar } from "@/components/live-status-bar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PersonSearch, PersonOption } from "@/components/person-search";
import { useLiveRefresh } from "@/hooks/use-live-refresh";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { Loader2 } from "lucide-react";

type Position = { id: string; title: string; description: string };

export default function NominatePage() {
  const router = useRouter();
  useAuthGuard("/login");
  const [positions, setPositions] = useState<Position[]>([]);
  const [picks, setPicks] = useState<Record<string, PersonOption | null>>({});
  const [blocked, setBlocked] = useState("");
  const [initialLoad, setInitialLoad] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const r = await fetch("/api/voter/me", { cache: "no-store" });
    if (r.status === 401) {
      router.replace("/login");
      return;
    }
    const d = await r.json();
    if (!d?.settings?.nominationOpen) {
      router.replace("/dashboard");
      return;
    }
    if (!d.voter.canParticipate) {
      setBlocked("Awaiting admin approval. Go to your dashboard and refresh.");
      setPositions([]);
      setInitialLoad(false);
      return;
    }
    if (d.voter.status === "NOMINATION_SUBMITTED" || d.voter.status === "FINAL_VOTED") {
      router.replace("/dashboard");
      return;
    }
    setBlocked("");
    setPositions(d.positions);
    setPicks((prev) => {
      const initial: Record<string, PersonOption | null> = { ...prev };
      for (const p of d.positions) {
        if (!(p.id in initial)) initial[p.id] = null;
      }
      return initial;
    });
    setInitialLoad(false);
  }, [router]);

  const { refresh, refreshing, lastUpdated } = useLiveRefresh(load, {
    intervalMs: 6000,
  });

  const selectedIds = Object.values(picks)
    .filter(Boolean)
    .map((p) => p!.id);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const nominations = positions.map((pos) => ({
      positionId: pos.id,
      nomineeId: picks[pos.id]?.id,
    }));
    if (nominations.some((n) => !n.nomineeId)) {
      setError("Select one person from the list for every award.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/nominations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nominations }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed");
        return;
      }
      router.push("/dashboard");
    } finally {
      setSubmitting(false);
    }
  }

  if (initialLoad) {
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
            variant="nominate"
            title="Phase 1 — Nomination form"
            subtitle="Select your preferred candidate for each award from the school database."
          />
        </div>

        <div className="mt-4">
          <LiveStatusBar
            onRefresh={refresh}
            refreshing={refreshing}
            lastUpdated={lastUpdated}
          />
        </div>

        {blocked ? (
          <Card className="mt-8">
            <p className="text-amber-100">{blocked}</p>
          </Card>
        ) : (
          <form onSubmit={submit} className="relative mt-8 space-y-6">
            {positions.map((pos, i) => (
              <Card key={pos.id} className="relative overflow-visible focus-within:z-[100]">
                <span className="text-xs font-medium uppercase tracking-wider text-emerald-400/80">
                  Award {i + 1} of {positions.length}
                </span>
                <h2 className="mt-1 font-semibold text-emerald-50">{pos.title}</h2>
                <p className="text-sm text-emerald-200/50">{pos.description}</p>
                <div className="mt-4">
                  <PersonSearch
                    value={picks[pos.id] ?? null}
                    onChange={(person) =>
                      setPicks((prev) => ({ ...prev, [pos.id]: person }))
                    }
                    excludeIds={selectedIds.filter((id) => id !== picks[pos.id]?.id)}
                  />
                </div>
              </Card>
            ))}
            {error && <p className="rounded-lg bg-red-500/15 px-4 py-2 text-red-200">{error}</p>}
            <Button type="submit" disabled={submitting} className="w-full py-3 text-base">
              {submitting ? "Submitting…" : "Submit nominations"}
            </Button>
          </form>
        )}
      </main>
    </div>
  );
}
