"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Send } from "lucide-react";

type Message = {
  id: string;
  author: string;
  body: string;
  createdAt: string;
};

export function AdminChatPanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [author, setAuthor] = useState("Admin");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/chat", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setMessages(data.messages ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
    const id = setInterval(load, 8000);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text) return;
    setSending(true);
    try {
      const res = await fetch("/api/admin/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text, author: author.trim() || "Admin" }),
      });
      if (res.ok) {
        setBody("");
        await load();
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <Card className="mt-6">
      <h2 className="font-semibold text-white">Admin team chat</h2>
      <p className="mt-1 text-sm text-emerald-100/55">
        Coordinate during voting — messages stay visible to all logged-in admins.
      </p>
      <div className="mt-4 max-h-72 overflow-y-auto rounded-xl border border-white/10 bg-black/20 p-3">
        {loading && <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />}
        {!loading && messages.length === 0 && (
          <p className="text-sm text-white/40">No messages yet. Post updates for other admins.</p>
        )}
        {messages.map((m) => (
          <div key={m.id} className="mb-3 border-b border-white/5 pb-3 last:border-0">
            <p className="text-xs text-emerald-300/80">
              <strong className="text-emerald-100">{m.author}</strong>
              {" · "}
              {new Date(m.createdAt).toLocaleString()}
            </p>
            <p className="mt-1 text-sm text-white/85 whitespace-pre-wrap">{m.body}</p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={send} className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Input
          placeholder="Your name"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          className="sm:max-w-[140px]"
        />
        <Input
          placeholder="Message to other admins…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" disabled={sending}>
          <Send className="h-4 w-4" />
          Send
        </Button>
      </form>
    </Card>
  );
}
