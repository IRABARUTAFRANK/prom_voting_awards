"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { SiteHeader } from "@/components/site-header";
import { PageBanner } from "@/components/page-banner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

type Finalist = { personId: string; person: { fullName: string } };
type Position = {
  id: string;
  title: string;
  description: string;
  finalists: Finalist[];
};

export default function VotePage() {
  const router = useRouter();
  const [positions, setPositions] = useState<Position[]>([]);
  const [choices, setChoices] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    fetch("/api/voter/me")
      .then((r) => {
        if (r.status === 401) router.replace("/login");
        return r.json();
      })
      .then((d) => {
        if (!d?.settings?.finalVoteOpen || d.voter.status === "FINAL_VOTED") {
          router.replace("/dashboard");
          return;
        }
        const withFour = d.positions.filter((p: Position) => p.finalists.length >= 4);
        if (withFour.length !== d.positions.length) {
          setError("Finalists are not ready for all positions yet. Check back soon.");
          setBlocked(true);
          setPositions(d.positions);
          return;
        }
        setPositions(d.positions);
      })
      .finally(() => setLoading(false));
  }, [router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const votes = positions.map((p) => ({
      positionId: p.id,
      personId: choices[p.id],
    }));
    if (votes.some((v) => !v.personId)) {
      setError("Select one finalist per award.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/final-vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ votes }),
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

  if (loading) {
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
            title="Phase 2 — Final vote"
            subtitle="Choose one winner from the 4 finalists for each award."
          />
        </div>

        {blocked ? (
          <Card className="mt-8">
            <p className="text-amber-100">{error}</p>
          </Card>
        ) : (
          <form onSubmit={submit} className="mt-8 space-y-6">
            {positions.map((pos) => (
              <Card key={pos.id}>
                <h2 className="font-semibold text-teal-100">{pos.title}</h2>
                <p className="text-sm text-emerald-200/45">{pos.description}</p>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {pos.finalists.map((f) => (
                    <label
                      key={f.personId}
                      className="flex cursor-pointer flex-col overflow-hidden rounded-xl border border-emerald-400/15 hover:border-emerald-400/40 has-[:checked]:border-emerald-400 has-[:checked]:ring-2 has-[:checked]:ring-emerald-500/30"
                    >
                      <div className="relative h-20 bg-emerald-950">
                        <Image
                          src={`https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80&sig=${f.personId}`}
                          alt=""
                          width={200}
                          height={80}
                          className="h-full w-full object-cover opacity-60"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-emerald-950/50 to-transparent" />
                      </div>
                      <div className="flex items-center gap-3 px-4 py-3">
                        <input
                          type="radio"
                          name={pos.id}
                          value={f.personId}
                          checked={choices[pos.id] === f.personId}
                          onChange={() =>
                            setChoices((c) => ({ ...c, [pos.id]: f.personId }))
                          }
                          className="accent-emerald-500"
                        />
                        <span className="font-medium text-white">{f.person.fullName}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </Card>
            ))}
            {error && !blocked && (
              <p className="rounded-lg bg-red-500/15 px-4 py-2 text-red-200">{error}</p>
            )}
            <Button type="submit" disabled={submitting} className="w-full py-3 text-base">
              {submitting ? "Submitting vote…" : "Submit final vote"}
            </Button>
          </form>
        )}
      </main>
    </div>
  );
}
