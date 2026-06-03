"use client";

import { useState } from "react";
import Link from "next/link";
import { PageAutoRefresh } from "@/components/page-auto-refresh";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Shield } from "lucide-react";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [registeredName, setRegisteredName] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Registration failed");
        return;
      }
      setRegisteredName(data.fullName ?? fullName);
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex min-h-full flex-col">
        <PageAutoRefresh />
        <SiteHeader />
        <main className="mx-auto max-w-lg flex-1 px-4 py-12">
          <Card className="border-emerald-500/30 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400" />
            <h1 className="mt-4 text-2xl font-bold text-white">Registration submitted</h1>
            <p className="mt-2 text-white/60">
              Thanks, <strong className="text-white">{registeredName}</strong>. An admin will verify
              you are Senior Six before you can vote.
            </p>
            <p className="mt-4 text-sm text-amber-100/90">
              You will <strong>not</strong> receive a voter code yet. After admin approval, open the
              voter portal with your email to get your access code once.
            </p>
            <Link href="/portal" className="mt-6 inline-block">
              <Button>Go to voter portal</Button>
            </Link>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col">
      <PageAutoRefresh />
      <SiteHeader />
      <main className="mx-auto max-w-md flex-1 px-4 py-12">
        <Card>
          <h1 className="text-2xl font-bold text-white">Register to vote</h1>
          <p className="mt-2 flex items-start gap-2 text-sm text-white/55">
            <Shield className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
            Senior Six only. Enter your name and school email. An admin will confirm you are on the
            graduating class before you receive a voter code in the portal.
          </p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-sm text-white/70">Full name</label>
              <Input
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
              />
            </div>
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
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Submitting…" : "Submit registration"}
            </Button>
          </form>
        </Card>
      </main>
    </div>
  );
}
