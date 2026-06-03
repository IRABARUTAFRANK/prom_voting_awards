"use client";

import { useCallback, useEffect, useState } from "react";
import { Input } from "./ui/input";
import { cn } from "@/lib/utils";
import { UserCheck } from "lucide-react";

export type PersonOption = { id: string; fullName: string; email: string | null };

type Props = {
  value: PersonOption | null;
  onChange: (person: PersonOption | null) => void;
  disabled?: boolean;
  excludeIds?: string[];
};

export function PersonSearch({ value, onChange, disabled, excludeIds = [] }: Props) {
  const [query, setQuery] = useState(value?.fullName ?? "");
  const [results, setResults] = useState<PersonOption[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const search = useCallback(
    async (q: string) => {
      if (q.trim().length < 1) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/people/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        const filtered = (data.people as PersonOption[]).filter(
          (p) => !excludeIds.includes(p.id),
        );
        setResults(filtered);
      } finally {
        setLoading(false);
      }
    },
    [excludeIds],
  );

  useEffect(() => {
    if (value) {
      setQuery(value.fullName);
      return;
    }
    const t = setTimeout(() => search(query), 250);
    return () => clearTimeout(t);
  }, [query, value, search]);

  return (
    <div className={cn("relative", open && "z-[200]")}>
      <p className="mb-2 flex items-center gap-1.5 text-xs text-emerald-200/70">
        <UserCheck className="h-3.5 w-3.5" />
        Type a name, then pick from the school list — no free typing
      </p>
      <Input
        disabled={disabled}
        placeholder="e.g. Ali, Gra, Hen…"
        value={query}
        onChange={(e) => {
          onChange(null);
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
      />
      {value && (
        <div className="mt-2 flex items-center justify-between rounded-lg bg-emerald-500/15 px-3 py-2 text-sm text-emerald-100">
          <span>Selected: <strong>{value.fullName}</strong></span>
          <button
            type="button"
            className="text-xs text-emerald-300 hover:text-white"
            onClick={() => {
              onChange(null);
              setQuery("");
            }}
          >
            Change
          </button>
        </div>
      )}
      {open && !value && query.length >= 1 && (
        <ul className="absolute z-[300] mt-1 max-h-48 w-full overflow-auto rounded-xl border border-emerald-400/30 bg-emerald-950 py-1 shadow-2xl ring-1 ring-emerald-400/20">
          {loading && <li className="px-4 py-2 text-sm text-emerald-200/50">Searching…</li>}
          {!loading && results.length === 0 && (
            <li className="px-4 py-2 text-sm text-emerald-200/50">
              No match — ask admin to add this student to the roster
            </li>
          )}
          {results.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                className="w-full px-4 py-2.5 text-left text-sm hover:bg-emerald-600/25"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(p);
                  setQuery(p.fullName);
                  setOpen(false);
                }}
              >
                <span className="font-medium text-white">{p.fullName}</span>
                {p.email && (
                  <span className="ml-2 text-xs text-emerald-200/40">{p.email}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
