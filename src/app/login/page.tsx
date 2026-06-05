"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageAutoRefresh } from "@/components/page-auto-refresh";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/voter/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Login failed");
        return;
      }
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-full flex-col">
      <PageAutoRefresh />
      <SiteHeader />
      <main className="mx-auto max-w-md flex-1 px-4 py-12">
        <Card>
          <h1 className="text-2xl font-bold text-white">Voter login</h1>
          <p className="mt-2 text-sm text-white/55">
            Enter the code your admin gave you (e.g. first two letters of your name plus two
            numbers). You will be signed in as that student automatically.
          </p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-sm text-white/70">Your voter code</label>
              <Input
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. AL42"
                className="font-mono tracking-widest"
                maxLength={12}
              />
            </div>
            {error && <p className="text-sm text-red-300">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Signing in…" : "Continue"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-white/45">
            <Link href="/" className="text-emerald-300 hover:text-white">
              ← Back to home
            </Link>
          </p>
        </Card>
      </main>
    </div>
  );
}
