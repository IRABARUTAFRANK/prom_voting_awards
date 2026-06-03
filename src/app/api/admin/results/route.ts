import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { getFinalVoteResults } from "@/lib/vote-results";

export async function GET() {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;

  const computed = await getFinalVoteResults();
  const results = computed.map((r) => ({
    position: { title: r.title, description: r.description },
    ranked: r.ranked.map(({ fullName, votes, percent }) => ({
      fullName,
      votes,
      percent,
    })),
    winner: r.winner
      ? {
          fullName: r.winner.fullName,
          votes: r.winner.votes,
          percent: r.winner.percent,
        }
      : null,
  }));

  return NextResponse.json({ results });
}
