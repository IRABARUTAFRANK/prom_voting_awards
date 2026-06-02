"use client";

import { useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatCodeForDisplay } from "@/lib/utils";
import { Copy, CheckCircle2 } from "lucide-react";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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
      setCode(data.code);
    } finally {
      setLoading(false);
    }
  }

  if (code) {
    const display = formatCodeForDisplay(code);
    return (
      <div className="flex min-h-full flex-col">
        <SiteHeader />
        <main className="mx-auto max-w-lg flex-1 px-4 py-12">
          <Card className="border-emerald-500/30 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400" />
            <h1 className="mt-4 text-2xl font-bold text-white">You&apos;re registered</h1>
            <p className="mt-2 text-white/60">
              Save this code — it is shown <strong className="text-white">only once</strong>.
            </p>
            <p className="mt-6 font-mono text-3xl font-bold tracking-wider text-emerald-200">
              {display}
            </p>
            <Button
              className="mt-6"
              variant="secondary"
              onClick={() => {
                navigator.clipboard.writeText(code);
                setCopied(true);
              }}
            >
              <Copy className="h-4 w-4" />
              {copied ? "Copied!" : "Copy code"}
            </Button>
            <p className="mt-6 text-sm text-amber-200/90">
              Status: waiting for admin approval. You cannot vote until approved.
            </p>
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
          <h1 className="text-2xl font-bold text-white">Register to vote</h1>
          <p className="mt-2 text-sm text-white/55">
            Use your real name and school email. A unique code will be generated for you.
          </p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-sm text-white/70">Full name</label>
              <Input
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Jane Uwera"
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
              {loading ? "Registering…" : "Register"}
            </Button>
          </form>
        </Card>
      </main>
    </div>
  );
}
