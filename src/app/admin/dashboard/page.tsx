"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LiveStatusBar } from "@/components/live-status-bar";
import { useLiveRefresh } from "@/hooks/use-live-refresh";
import { parseJsonResponse } from "@/lib/fetch-json";
import { AUTO_REFRESH_MS } from "@/lib/refresh-interval";
import { DEFAULT_REMOVAL_MESSAGE } from "@/lib/voter-removal";
import { formatCodeForDisplay } from "@/lib/utils";
import { AdminStudentsPanel } from "@/components/admin-students-panel";
import { AdminChatPanel } from "@/components/admin-chat-panel";
import { Loader2 } from "lucide-react";

type Stats = {
  settings: {
    registrationOpen: boolean;
    nominationOpen: boolean;
    finalVoteOpen: boolean;
    liveResultsVisibleToVoters: boolean;
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
  className: string | null;
  email: string;
  status: string;
  loginCode: string | null;
  accessCodePlaintext: string | null;
  codeRevealedAt: string | null;
  lastLoginAt: string | null;
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
  const [tab, setTab] = useState<
    "overview" | "students" | "voters" | "positions" | "shortlist" | "results" | "chat"
  >("overview");
  const [initialLoad, setInitialLoad] = useState(true);
  const [schoolDomain, setSchoolDomain] = useState("");
  const [minApprovedInput, setMinApprovedInput] = useState("");
  const [newPos, setNewPos] = useState({ title: "", description: "", slug: "" });
  const [rosterLine, setRosterLine] = useState("");
  const [loadError, setLoadError] = useState("");

  const load = useCallback(async () => {
    setLoadError("");
    try {
      const [s, v, p, sl] = await Promise.all([
        fetch("/api/admin/stats", { cache: "no-store" }),
        fetch("/api/admin/voters", { cache: "no-store" }),
        fetch("/api/admin/positions", { cache: "no-store" }),
        fetch("/api/admin/shortlist", { cache: "no-store" }),
      ]);

      if ([s, v, p, sl].some((r) => r.status === 401)) {
        router.replace("/admin");
        return;
      }

      if (!s.ok) {
        const err = await parseJsonResponse<{ error?: string }>(s).catch(() => ({
          error: "Failed to load admin stats",
        }));
        throw new Error(err.error ?? "Failed to load admin stats");
      }
      if (!v.ok) {
        const err = await parseJsonResponse<{ error?: string }>(v).catch(() => ({
          error: "Failed to load voters",
        }));
        throw new Error(err.error ?? "Failed to load voters");
      }
      if (!p.ok) {
        throw new Error("Failed to load positions");
      }
      if (!sl.ok) {
        throw new Error("Failed to load shortlist");
      }

      const statsJson = await parseJsonResponse<Stats>(s);
      const votersJson = await parseJsonResponse<{ voters: Voter[] }>(v);
      const positionsJson = await parseJsonResponse<{ positions: Position[] }>(p);
      const shortlistJson = await parseJsonResponse<ShortlistData>(sl);

      setStats(statsJson);
      setSchoolDomain(statsJson.settings.schoolEmailDomain ?? "");
      setMinApprovedInput(String(statsJson.settings.minApprovedVoters ?? ""));
      setVoters(votersJson.voters);
      setPositions(positionsJson.positions);
      setShortlist(shortlistJson);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to load dashboard data");
    } finally {
      setInitialLoad(false);
    }
  }, [router]);

  const { refresh, refreshing, lastUpdated } = useLiveRefresh(load, {
    intervalMs: AUTO_REFRESH_MS,
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

  async function removeVoter(voterId: string, fullName: string) {
    const ok = window.confirm(
      `Remove ${fullName} from the voter list?\n\nThey will see:\n"${DEFAULT_REMOVAL_MESSAGE}"`,
    );
    if (!ok) return;
    const res = await fetch("/api/admin/voters/remove", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ voterId }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error ?? "Could not remove voter");
      return;
    }
    alert(data.message ?? "Voter removed.");
    refresh();
  }

  async function releasePhase1() {
    await patchSettings({ nominationOpen: true, finalVoteOpen: false });
  }

  async function releasePhase2() {
    await fetch("/api/admin/shortlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    await patchSettings({ finalVoteOpen: true });
  }

  async function addFinalist(positionId: string, personId: string) {
    const res = await fetch("/api/admin/shortlist", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ positionId, personId }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error ?? "Could not add finalist");
      return;
    }
    refresh();
  }

  async function removeFinalist(positionId: string, personId: string) {
    await fetch("/api/admin/shortlist", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ positionId, personId }),
    });
    refresh();
  }

  async function autoShortlistAll() {
    await fetch("/api/admin/shortlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    refresh();
  }

  const loadResults = useCallback(async () => {
    const r = await fetch("/api/admin/results", { cache: "no-store" });
    if (r.ok) setResults(await r.json());
  }, []);

  async function openResultsTab() {
    await loadResults();
    setTab("results");
  }

  useEffect(() => {
    if (tab !== "results") return;
    loadResults();
    const id = setInterval(loadResults, AUTO_REFRESH_MS);
    return () => clearInterval(id);
  }, [tab, loadResults]);

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
    ["students", "Students & codes"],
    ["chat", "Admin chat"],
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
              intervalMs={AUTO_REFRESH_MS}
            />
            <Link href="/">
              <Button variant="ghost">Site</Button>
            </Link>
            <Button variant="secondary" onClick={logout}>
              Log out
            </Button>
          </div>
        </div>

        {loadError && (
          <Card className="mt-6 border-red-400/30 bg-red-500/10">
            <p className="text-red-100">{loadError}</p>
            <p className="mt-2 text-sm text-red-200/70">
              If this mentions migrations, run{" "}
              <code className="rounded bg-black/30 px-1">npx prisma migrate deploy</code> in the
              project folder, then refresh.
            </p>
            <Button className="mt-3" variant="secondary" onClick={() => refresh()}>
              Try again
            </Button>
          </Card>
        )}

        <nav className="mt-6 flex flex-wrap gap-2">
          {tabs.map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                if (id === "results") void openResultsTab();
                else setTab(id);
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
                <li>Import the Senior Six Excel list (Students tab) — each student gets a login code.</li>
                <li>Print codes per class and hand them to students.</li>
                <li>Release Phase 1 when you are ready (not automatic at 100).</li>
                <li>After nominations, auto-select top 4 by count; override picks on Shortlist tab.</li>
                <li>Turn on &quot;Live results for voters&quot; if students should see /live.</li>
                <li>Release Phase 2 for final voting among the 4 finalists per award.</li>
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
                <Button
                  variant={
                    stats.settings.liveResultsVisibleToVoters ? "primary" : "secondary"
                  }
                  onClick={() =>
                    patchSettings({
                      liveResultsVisibleToVoters:
                        !stats.settings.liveResultsVisibleToVoters,
                    })
                  }
                >
                  Live results for voters{" "}
                  {stats.settings.liveResultsVisibleToVoters ? "ON" : "OFF"}
                </Button>
                <Button variant="primary" onClick={releasePhase1}>
                  Release Phase 1 for students
                </Button>
                <Button variant="primary" onClick={releasePhase2}>
                  Release Phase 2 (auto top 4 + open vote)
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

        {tab === "students" && <AdminStudentsPanel />}

        {tab === "chat" && <AdminChatPanel />}

        {tab === "voters" && (
          <div className="mt-6">
            <Card className="mb-4 border-amber-400/20">
              <p className="text-sm text-amber-100/90">
                Approving a voter generates an access code (shown in the table below for admin
                recovery). Students collect it once from the voter portal. If they forget it, use
                the code listed here after they have logged in at least once.
              </p>
            </Card>
            <Button onClick={approveAll} className="mb-4">
              Approve all pending ({stats.counts.pending})
            </Button>
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/5 text-white/60">
                  <tr>
                    <th className="p-3">Name</th>
                    <th className="p-3">Class</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Access code</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Last login</th>
                    <th className="p-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {voters.map((v) => (
                    <tr key={v.id} className="border-t border-white/5">
                      <td className="p-3 text-white">{v.fullName}</td>
                      <td className="p-3 text-white/60">{v.className ?? "—"}</td>
                      <td className="p-3 text-white/60">{v.email}</td>
                      <td className="p-3 font-mono text-xs text-amber-200/90">
                        {v.loginCode ?? v.accessCodePlaintext
                          ? formatCodeForDisplay(v.loginCode ?? v.accessCodePlaintext ?? "")
                          : "—"}
                      </td>
                      <td className="p-3 text-emerald-200">{v.status}</td>
                      <td className="p-3 text-xs text-white/50">
                        {v.lastLoginAt
                          ? new Date(v.lastLoginAt).toLocaleString()
                          : "—"}
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-2">
                          {v.status === "PENDING" && (
                            <Button
                              className="px-3 py-1.5 text-xs"
                              onClick={() => approveOne(v.id)}
                            >
                              Approve
                            </Button>
                          )}
                          <Button
                            className="px-3 py-1.5 text-xs"
                            variant="ghost"
                            onClick={() => removeVoter(v.id, v.fullName)}
                          >
                            Delete
                          </Button>
                        </div>
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
            <Card className="border-emerald-400/20">
              <p className="text-sm text-emerald-100/80">
                <strong>Auto-select</strong> picks up to four nominees with the highest nomination
                counts (ties may need your choice). Use <strong>Add</strong> / <strong>Remove</strong>{" "}
                below to override the final four before opening Phase 2.
              </p>
              <Button className="mt-4" onClick={autoShortlistAll}>
                Auto-select top nominees for all positions
              </Button>
            </Card>
            {shortlist.positions.map((pos) => {
              const tally = shortlist.tallies.find((t) => t.positionId === pos.id);
              const finalistIds = new Set(pos.finalists.map((f) => f.personId));
              const atCapacity = pos.finalists.length >= 4;
              return (
                <Card key={pos.id}>
                  <h3 className="font-semibold text-white">{pos.title}</h3>
                  {tally?.preview.needsAdmin && (
                    <p className="mt-1 text-sm text-amber-300">
                      {tally.preview.tieNote ?? "Admin action needed to reach 4 finalists"}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-white/40">Nomination counts (add to final 4):</p>
                  <ul className="mt-1 space-y-2 text-sm text-white/70">
                    {tally?.counts.map((c) => {
                      const isFinalist = finalistIds.has(c.personId);
                      return (
                        <li
                          key={c.personId}
                          className="flex flex-wrap items-center justify-between gap-2"
                        >
                          <span>
                            {c.fullName} — {c.count} nomination{c.count === 1 ? "" : "s"}
                          </span>
                          {isFinalist ? (
                            <span className="text-xs text-emerald-300">In final 4</span>
                          ) : (
                            <Button
                              className="px-2 py-1 text-xs"
                              variant="secondary"
                              disabled={atCapacity}
                              onClick={() => addFinalist(pos.id, c.personId)}
                            >
                              Add to final 4
                            </Button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                  <p className="mt-3 text-xs text-white/40">
                    Finalists ({pos.finalists.length}/4):
                  </p>
                  <ul className="mt-1 space-y-2 text-sm text-emerald-200">
                    {pos.finalists.map((f) => (
                      <li
                        key={f.personId}
                        className="flex flex-wrap items-center justify-between gap-2"
                      >
                        <span>
                          {f.person.fullName}{" "}
                          <span className="text-white/30">({f.source})</span>
                        </span>
                        <Button
                          className="px-2 py-1 text-xs"
                          variant="ghost"
                          onClick={() => removeFinalist(pos.id, f.personId)}
                        >
                          Remove
                        </Button>
                      </li>
                    ))}
                  </ul>
                  {pos.finalists.length < 4 && (
                    <p className="mt-2 text-xs text-amber-200/80">
                      Need {4 - pos.finalists.length} more finalist
                      {4 - pos.finalists.length === 1 ? "" : "s"} before Phase 2 voting.
                    </p>
                  )}
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
                      Leading: {r.winner.fullName} ({r.winner.votes} votes ·{" "}
                      {"percent" in r.winner ? `${r.winner.percent}%` : "—"})
                    </p>
                  ) : (
                    <p className="text-white/50">No votes yet</p>
                  )}
                  <ul className="mt-2 space-y-1 text-sm text-white/60">
                    {r.ranked.map((x) => (
                      <li key={x.fullName}>
                        {x.fullName}: {x.votes}
                        {"percent" in x ? ` (${x.percent}%)` : ""}
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
