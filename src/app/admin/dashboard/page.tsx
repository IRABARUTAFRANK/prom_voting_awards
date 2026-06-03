"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LiveStatusBar } from "@/components/live-status-bar";
import { useLiveRefresh } from "@/hooks/use-live-refresh";
import { Loader2 } from "lucide-react";

type Stats = {
  settings: {
    registrationOpen: boolean;
    nominationOpen: boolean;
    finalVoteOpen: boolean;
    minApprovedVoters: number;
    schoolEmailDomain: string;
  };
  counts: {
    pending: number;
    approved: number;
    nominationDone: number;
    finalVoted: number;
    approvedTotal: number;
  };
};

type Voter = {
  id: string;
  fullName: string;
  email: string;
  status: string;
};

type Position = {
  id: string;
  title: string;
  description: string;
  active: boolean;
  sortOrder: number;
};

type ShortlistData = {
  positions: Array<{
    id: string;
    title: string;
    finalists: Array<{ personId: string; person: { fullName: string }; source: string }>;
  }>;
  tallies: Array<{
    positionId: string;
    counts: Array<{ personId: string; fullName: string; count: number }>;
    preview: { needsAdmin: boolean; tieNote?: string };
  }>;
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [voters, setVoters] = useState<Voter[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [shortlist, setShortlist] = useState<ShortlistData | null>(null);
  const [results, setResults] = useState<{
    results: Array<{
      position: { title: string };
      winner: { fullName: string; votes: number } | null;
      ranked: Array<{ fullName: string; votes: number }>;
    }>;
  } | null>(null);
  const [tab, setTab] = useState<"overview" | "voters" | "positions" | "shortlist" | "results">(
    "overview",
  );
  const [initialLoad, setInitialLoad] = useState(true);
  const [schoolDomain, setSchoolDomain] = useState("");
  const [minApprovedInput, setMinApprovedInput] = useState("");
  const [newPos, setNewPos] = useState({ title: "", description: "", slug: "" });
  const [rosterLine, setRosterLine] = useState("");

  const load = useCallback(async () => {
    const [s, v, p, sl] = await Promise.all([
      fetch("/api/admin/stats"),
      fetch("/api/admin/voters"),
      fetch("/api/admin/positions"),
      fetch("/api/admin/shortlist"),
    ]);
    if (s.status === 401) {
      router.replace("/admin");
      return;
    }
    const statsJson = await s.json();
    setStats(statsJson);
    setSchoolDomain(statsJson.settings.schoolEmailDomain ?? "");
    setMinApprovedInput(String(statsJson.settings.minApprovedVoters ?? ""));
    setVoters((await v.json()).voters);
    setPositions((await p.json()).positions);
    setShortlist(await sl.json());
    setInitialLoad(false);
  }, [router]);

  const { refresh, refreshing, lastUpdated } = useLiveRefresh(load, {
    intervalMs: 6000,
  });

  async function patchSettings(data: Record<string, unknown>) {
    await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    refresh();
  }

  async function approveAll() {
    await fetch("/api/admin/voters/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approveAllPending: true }),
    });
    refresh();
  }

  async function approveOne(voterId: string) {
    await fetch("/api/admin/voters/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ voterIds: [voterId] }),
    });
    refresh();
  }

  async function releasePhase1() {
    await patchSettings({ nominationOpen: true, finalVoteOpen: false });
  }

  async function releasePhase2() {
    await patchSettings({ finalVoteOpen: true });
  }

  async function autoShortlistAll() {
    await fetch("/api/admin/shortlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    refresh();
  }

  async function loadResults() {
    const r = await fetch("/api/admin/results");
    setResults(await r.json());
    setTab("results");
  }

  async function addPosition(e: React.FormEvent) {
    e.preventDefault();
    const slug =
      newPos.slug ||
      newPos.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
    await fetch("/api/admin/positions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newPos, slug }),
    });
    setNewPos({ title: "", description: "", slug: "" });
    refresh();
  }

  async function importRoster() {
    const rows = rosterLine
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [fullName, email] = line.split(",").map((s) => s.trim());
        return { fullName, email: email || undefined };
      });
    await fetch("/api/admin/roster", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows }),
    });
    setRosterLine("");
    alert(`Imported ${rows.length} rows`);
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin");
  }

  if (initialLoad && !stats) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  if (!stats) return null;

  const tabs = [
    ["overview", "Overview"],
    ["voters", "Voters"],
    ["positions", "Positions"],
    ["shortlist", "Shortlist"],
    ["results", "Results"],
  ] as const;

  return (
    <div className="min-h-screen px-4 py-8 page-bg">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Admin dashboard</h1>
            <p className="text-white/50">Promo Awards &apos;26 control panel</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <LiveStatusBar
              onRefresh={refresh}
              refreshing={refreshing}
              lastUpdated={lastUpdated}
            />
            <Link href="/">
              <Button variant="ghost">Site</Button>
            </Link>
            <Button variant="secondary" onClick={logout}>
              Log out
            </Button>
          </div>
        </div>

        <nav className="mt-6 flex flex-wrap gap-2">
          {tabs.map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setTab(id);
                if (id === "results") loadResults();
              }}
              className={`rounded-lg px-4 py-2 text-sm font-medium ${
                tab === id ? "bg-emerald-600 text-white" : "bg-emerald-950/50 text-emerald-100/70"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        {tab === "overview" && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <p className="text-sm text-white/50">Pending</p>
              <p className="text-3xl font-bold">{stats.counts.pending}</p>
            </Card>
            <Card>
              <p className="text-sm text-white/50">Approved</p>
              <p className="text-3xl font-bold">{stats.counts.approved}</p>
            </Card>
            <Card>
              <p className="text-sm text-white/50">Phase 1 done</p>
              <p className="text-3xl font-bold">{stats.counts.nominationDone}</p>
            </Card>
            <Card>
              <p className="text-sm text-white/50">Final voted</p>
              <p className="text-3xl font-bold">{stats.counts.finalVoted}</p>
            </Card>

            <Card className="sm:col-span-2 lg:col-span-4">
              <h2 className="font-semibold text-white">How to run (testing or full school)</h2>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-emerald-100/65">
                <li>Students register with name + email (Senior Six verification is manual).</li>
                <li>Approve voters — they receive an access code in the voter portal.</li>
                <li>Release Phase 1 when you are ready (not automatic at 100).</li>
                <li>After nominations, auto-shortlist top 4; add ties manually.</li>
                <li>Release Phase 2 for live final voting among the 4 finalists.</li>
              </ol>
              <h2 className="mt-6 font-semibold text-white">Phases</h2>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button
                  variant={stats.settings.registrationOpen ? "primary" : "secondary"}
                  onClick={() =>
                    patchSettings({ registrationOpen: !stats.settings.registrationOpen })
                  }
                >
                  Registration {stats.settings.registrationOpen ? "ON" : "OFF"}
                </Button>
                <Button
                  variant={stats.settings.nominationOpen ? "primary" : "secondary"}
                  onClick={() =>
                    patchSettings({ nominationOpen: !stats.settings.nominationOpen })
                  }
                >
                  Phase 1 (Nomination) {stats.settings.nominationOpen ? "ON" : "OFF"}
                </Button>
                <Button
                  variant={stats.settings.finalVoteOpen ? "primary" : "secondary"}
                  onClick={() =>
                    patchSettings({ finalVoteOpen: !stats.settings.finalVoteOpen })
                  }
                >
                  Phase 2 (Final) {stats.settings.finalVoteOpen ? "ON" : "OFF"}
                </Button>
                <Button variant="primary" onClick={releasePhase1}>
                  Release Phase 1 for students
                </Button>
                <Button variant="primary" onClick={releasePhase2}>
                  Release Phase 2 (live vote)
                </Button>
              </div>
              <p className="mt-3 text-xs text-white/40">
                Goal (planning only): {stats.settings.minApprovedVoters} approved · Current:{" "}
                {stats.counts.approvedTotal} — you decide when to open each phase.
              </p>
            </Card>

            <Card className="sm:col-span-2 lg:col-span-4">
              <h2 className="font-semibold text-white">Built-in vote pages</h2>
              <p className="mt-1 text-sm text-emerald-100/55">
                Phase 1: <strong className="text-emerald-200">/nominate</strong> — students pick
                names from the roster. Phase 2: <strong className="text-emerald-200">/vote</strong>{" "}
                — students pick one of 4 finalists. No Google Forms needed.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Input
                  className="max-w-sm"
                  placeholder="School email domain e.g. school.edu"
                  value={schoolDomain}
                  onChange={(e) => setSchoolDomain(e.target.value)}
                />
                <Button
                  onClick={() => patchSettings({ schoolEmailDomain: schoolDomain })}
                >
                  Save email domain
                </Button>
                <Input
                  className="max-w-sm"
                  placeholder="Min approved voters"
                  value={minApprovedInput}
                  onChange={(e) => setMinApprovedInput(e.target.value)}
                />
                <Button onClick={() => patchSettings({ minApprovedVoters: Number(minApprovedInput) })}>
                  Save target
                </Button>
                <Button onClick={() => patchSettings({ minApprovedVoters: 100 })}>
                  Set goal to 100 (production)
                </Button>
              </div>
            </Card>
          </div>
        )}

        {tab === "voters" && (
          <div className="mt-6">
            <Button onClick={approveAll} className="mb-4">
              Approve all pending ({stats.counts.pending})
            </Button>
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/5 text-white/60">
                  <tr>
                    <th className="p-3">Name</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {voters.map((v) => (
                    <tr key={v.id} className="border-t border-white/5">
                      <td className="p-3 text-white">{v.fullName}</td>
                      <td className="p-3 text-white/60">{v.email}</td>
                      <td className="p-3 text-emerald-200">{v.status}</td>
                      <td className="p-3">
                        {v.status === "PENDING" ? (
                          <Button className="px-3 py-1.5 text-xs" onClick={() => approveOne(v.id)}>
                            Approve
                          </Button>
                        ) : (
                          <span className="text-white/30">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "positions" && (
          <div className="mt-6 space-y-6">
            {positions.map((p) => (
              <Card key={p.id}>
                <h3 className="font-semibold text-white">{p.title}</h3>
                <p className="text-sm text-white/50">{p.description}</p>
                <p className="mt-1 text-xs text-white/30">
                  {p.active ? "Active" : "Inactive"} · order {p.sortOrder}
                </p>
              </Card>
            ))}
            <Card>
              <h3 className="font-semibold text-white">Add position</h3>
              <form onSubmit={addPosition} className="mt-4 space-y-3">
                <Input
                  placeholder="Title"
                  value={newPos.title}
                  onChange={(e) => setNewPos((n) => ({ ...n, title: e.target.value }))}
                  required
                />
                <Input
                  placeholder="Description"
                  value={newPos.description}
                  onChange={(e) => setNewPos((n) => ({ ...n, description: e.target.value }))}
                  required
                />
                <Button type="submit">Add</Button>
              </form>
            </Card>
            <Card>
              <h3 className="font-semibold text-white">Import roster (CSV lines)</h3>
              <p className="text-xs text-white/40">Format: Full Name, email@school.edu (one per line)</p>
              <textarea
                className="mt-2 w-full rounded-xl border border-emerald-400/20 bg-emerald-950/30 p-3 text-sm text-emerald-50"
                rows={5}
                value={rosterLine}
                onChange={(e) => setRosterLine(e.target.value)}
              />
              <Button className="mt-2" onClick={importRoster}>
                Import
              </Button>
            </Card>
          </div>
        )}

        {tab === "shortlist" && shortlist && (
          <div className="mt-6 space-y-6">
            <Button onClick={autoShortlistAll}>
              Auto-select top nominees for all positions
            </Button>
            {shortlist.positions.map((pos) => {
              const tally = shortlist.tallies.find((t) => t.positionId === pos.id);
              return (
                <Card key={pos.id}>
                  <h3 className="font-semibold text-white">{pos.title}</h3>
                  {tally?.preview.needsAdmin && (
                    <p className="mt-1 text-sm text-amber-300">
                      {tally.preview.tieNote ?? "Admin action needed to reach 4 finalists"}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-white/40">Nomination counts:</p>
                  <ul className="mt-1 text-sm text-white/70">
                    {tally?.counts.slice(0, 8).map((c) => (
                      <li key={c.personId}>
                        {c.fullName} — {c.count}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-xs text-white/40">
                    Finalists ({pos.finalists.length}/4):
                  </p>
                  <ul className="text-sm text-emerald-200">
                    {pos.finalists.map((f) => (
                      <li key={f.personId}>
                        {f.person.fullName}{" "}
                        <span className="text-white/30">({f.source})</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              );
            })}
          </div>
        )}

        {tab === "results" && results && (
          <div className="mt-6 space-y-4">
            {results.results?.map((r) => (
                <Card key={r.position.title}>
                  <h3 className="font-semibold text-white">{r.position.title}</h3>
                  {r.winner ? (
                    <p className="mt-2 text-lg text-teal-200">
                      Winner: {r.winner.fullName} ({r.winner.votes} votes)
                    </p>
                  ) : (
                    <p className="text-white/50">No votes yet</p>
                  )}
                  <ul className="mt-2 text-sm text-white/60">
                    {r.ranked.map((x) => (
                      <li key={x.fullName}>
                        {x.fullName}: {x.votes}
                      </li>
                    ))}
                  </ul>
                </Card>
              ),
            )}
          </div>
        )}
      </div>
    </div>
  );
}
