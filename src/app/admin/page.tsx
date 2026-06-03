"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageAutoRefresh } from "@/components/page-auto-refresh";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, LayoutDashboard } from "lucide-react";

export default function AdminPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => {
        if (r.ok) setAuthed(true);
      })
      .finally(() => setChecking(false));
  }, []);

  useEffect(() => {
    if (!checking && authed) {
      router.replace("/admin/dashboard");
    }
  }, [checking, authed, router]);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      setError("Wrong password");
      return;
    }
    router.replace("/admin/dashboard");
  }

  if (checking || authed) {
    return (
      <div className="flex min-h-screen items-center justify-center page-bg">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 page-bg">
      <PageAutoRefresh />
      <Card className="w-full max-w-md">
        <div className="mb-4 flex items-center gap-2 text-white">
          <LayoutDashboard className="h-6 w-6 text-emerald-400" />
          <h1 className="text-xl font-bold">Admin login</h1>
        </div>
        <form onSubmit={login} className="space-y-4">
          <Input
            type="password"
            placeholder="Admin password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="text-sm text-red-300">{error}</p>}
          <Button type="submit" className="w-full">
            Sign in
          </Button>
        </form>
        <Link href="/" className="mt-4 block text-center text-sm text-emerald-200/50 hover:text-white">
          ← Home
        </Link>
      </Card>
    </div>
  );
}
