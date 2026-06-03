"use client";

import { Card } from "@/components/ui/card";

export type LiveResultPosition = {
  positionId: string;
  title: string;
  description: string;
  totalVotes: number;
  ranked: Array<{
    personId: string;
    fullName: string;
    votes: number;
    percent: number;
  }>;
  winner: { fullName: string; votes: number; percent: number } | null;
};

type Props = {
  results: LiveResultPosition[];
  totalBallots?: number;
};

export function LiveVoteResults({ results, totalBallots }: Props) {
  if (!results.length) {
    return (
      <Card>
        <p className="text-emerald-100/70">No award positions configured yet.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {totalBallots !== undefined && (
        <p className="text-sm text-emerald-200/60">
          {totalBallots} voter{totalBallots === 1 ? "" : "s"} have submitted a final ballot.
        </p>
      )}
      {results.map((pos) => (
        <Card key={pos.positionId}>
          <h2 className="font-semibold text-teal-100">{pos.title}</h2>
          <p className="text-sm text-emerald-200/45">{pos.description}</p>
          <p className="mt-1 text-xs text-emerald-200/40">
            {pos.totalVotes} vote{pos.totalVotes === 1 ? "" : "s"} counted for this award
          </p>
          {pos.ranked.length === 0 ? (
            <p className="mt-4 text-sm text-emerald-100/50">No votes yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {pos.ranked.map((c, i) => (
                <li key={c.personId}>
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="font-medium text-white">
                      {i + 1}. {c.fullName}
                      {pos.winner?.fullName === c.fullName && c.votes > 0 && (
                        <span className="ml-2 text-xs text-teal-300">leading</span>
                      )}
                    </span>
                    <span className="shrink-0 text-emerald-200/70">
                      {c.votes} ({c.percent}%)
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-emerald-950/80">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                      style={{ width: `${Math.max(c.percent, c.votes > 0 ? 4 : 0)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      ))}
    </div>
  );
}
