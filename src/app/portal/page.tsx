"use client";

import { useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatCodeForDisplay } from "@/lib/utils";
import { CheckCircle2, Clock, Copy, KeyRound } from "lucide-react";

type PortalResult =
  | { status: "PENDING"; fullName: string; message: string }
  | { status: "APPROVED"; fullName: string; code: string; message: string }
  | { status: "APPROVED"; fullName: string; codeAlreadyRevealed: true; message: string };

export default function PortalPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PortalResult | null>(null);
  const [copied, setCopied] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch("/api/portal/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not check status.");
        return;
      }
      setResult(data as PortalResult);
    } finally {
      setLoading(false);
    }
  }

  if (result?.status === "APPROVED" && "code" in result && result.code) {
    const display = formatCodeForDisplay(result.code);
    return (
      <div className="flex min-h-full flex-col">
        <SiteHeader />
        <main className="mx-auto max-w-lg flex-1 px-4 py-12">
          <Card className="border-emerald-500/30 text-center">
            <KeyRound className="mx-auto h-12 w-12 text-emerald-400" />
            <h1 className="mt-4 text-2xl font-bold text-white">Approved — your voter code</h1>
            <p className="mt-2 text-white/60">
              Hi <strong className="text-white">{result.fullName}</strong>. Save this code — it is
              shown <strong className="text-white">only once</strong>.
            </p>
            <p className="mt-6 font-mono text-3xl font-bold tracking-wider text-emerald-200">
              {display}
            </p>
            <Button
              className="mt-6"
              variant="secondary"
              onClick={() => {
                navigator.clipboard.writeText(result.code);
                setCopied(true);
              }}
            >
              <Copy className="h-4 w-4" />
              {copied ? "Copied!" : "Copy code"}
            </Button>
            <p className="mt-6 text-sm text-emerald-100/70">{result.message}</p>
            <Link href="/login" className="mt-6 inline-block text-emerald-300 hover:text-white">
              Go to voter login →
            </Link>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="mx-auto max-w-md flex-1 px-4 py-12">
        <Card>
          <h1 className="text-2xl font-bold text-white">Voter portal</h1>
          <p className="mt-2 text-sm text-white/55">
            After you register, an admin verifies you are Senior Six. Enter your school email here
            to check approval status and receive your access code once approved.
          </p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-sm text-white/70">School email</label>
              <Input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@school.edu"
              />
            </div>
            {error && <p className="text-sm text-red-300">{error}</p>}
            {result?.status === "PENDING" && (
              <div className="rounded-xl border border-amber-400/25 bg-amber-500/10 p-4 text-sm text-amber-100/90">
                <Clock className="mb-2 h-5 w-5 text-amber-300" />
                <p>
                  <strong>{result.fullName}</strong> — {result.message}
                </p>
              </div>
            )}
            {result?.status === "APPROVED" && "codeAlreadyRevealed" in result && (
              <div className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 p-4 text-sm text-emerald-100/90">
                <CheckCircle2 className="mb-2 h-5 w-5 text-emerald-300" />
                <p>
                  <strong>{result.fullName}</strong> — {result.message}
                </p>
                <Link href="/login" className="mt-3 inline-block text-emerald-300 hover:text-white">
                  Go to voter login →
                </Link>
              </div>
            )}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Checking…" : "Check status"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-white/45">
            Not registered?{" "}
            <Link href="/register" className="text-emerald-300 hover:text-white">
              Register first
            </Link>
          </p>
        </Card>
      </main>
    </div>
  );
}
