"use client";

import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { Input } from "./ui/input";
import { cn } from "@/lib/utils";
import { UserCheck } from "lucide-react";

export type PersonOption = {
  id: string;
  fullName: string;
  email: string | null;
  className?: string | null;
};

const ROSTER_CACHE_KEY = "prom_awards_roster_v2";

type Props = {
  value: PersonOption | null;
  onChange: (person: PersonOption | null) => void;
  onTypedName?: (name: string) => void;
  disabled?: boolean;
  excludeIds?: string[];
};

export function PersonSearch({
  value,
  onChange,
  onTypedName,
  disabled,
  excludeIds = [],
}: Props) {
  const listId = useId().replace(/:/g, "");
  const [query, setQuery] = useState(value?.fullName ?? "");
  const [allPeople, setAllPeople] = useState<PersonOption[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const cached = sessionStorage.getItem(ROSTER_CACHE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as PersonOption[];
        if (parsed.length > 0) {
          setAllPeople(parsed);
          setLoading(false);
        }
      } catch {
        /* ignore */
      }
    }

    (async () => {
      try {
        const res = await fetch("/api/people/list");
        if (!res.ok) return;
        const data = await res.json();
        const people = (data.people ?? []) as PersonOption[];
        if (!cancelled && people.length > 0) {
          setAllPeople(people);
          sessionStorage.setItem(ROSTER_CACHE_KEY, JSON.stringify(people));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const excludeSet = useMemo(() => new Set(excludeIds), [excludeIds]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pool = allPeople.filter((p) => !excludeSet.has(p.id));
    if (!q) return pool;
    return pool.filter((p) => p.fullName.toLowerCase().includes(q));
  }, [allPeople, query, excludeSet]);

  const notifyTyped = useCallback(
    (name: string) => {
      onTypedName?.(name.trim());
    },
    [onTypedName],
  );

  useEffect(() => {
    if (value) setQuery(value.fullName);
  }, [value]);

  return (
    <div className={cn("relative", open && "z-[200]")}>
      <p className="mb-2 flex items-center gap-1.5 text-xs text-emerald-200/70">
        <UserCheck className="h-3.5 w-3.5" />
        Pick from the list or type a student&apos;s full name exactly
      </p>
      <Input
        disabled={disabled}
        placeholder="Type to filter names…"
        value={query}
        list={listId}
        autoComplete="off"
        onChange={(e) => {
          const next = e.target.value;
          onChange(null);
          setQuery(next);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          setTimeout(() => setOpen(false), 200);
          if (!value && query.trim()) notifyTyped(query);
        }}
      />
      <datalist id={listId}>
        {allPeople.map((p) => (
          <option key={p.id} value={p.fullName} />
        ))}
      </datalist>
      {value && (
        <div className="mt-2 flex items-center justify-between rounded-lg bg-emerald-500/15 px-3 py-2 text-sm text-emerald-100">
          <span>
            Selected: <strong>{value.fullName}</strong>
            {value.className && (
              <span className="ml-2 text-xs text-emerald-200/50">({value.className})</span>
            )}
          </span>
          <button
            type="button"
            className="text-xs text-emerald-300 hover:text-white"
            onClick={() => {
              onChange(null);
              setQuery("");
              notifyTyped("");
            }}
          >
            Change
          </button>
        </div>
      )}
      {open && !value && (
        <ul className="absolute z-[300] mt-1 max-h-64 w-full overflow-auto rounded-xl border border-emerald-400/30 bg-emerald-950 py-1 shadow-2xl ring-1 ring-emerald-400/20">
          {loading && allPeople.length === 0 && (
            <li className="px-4 py-2 text-sm text-emerald-200/50">Loading roster…</li>
          )}
          {!loading && results.length === 0 && (
            <li className="px-4 py-2 text-sm text-emerald-200/50">
              No match — type the full name exactly or ask admin to add this student
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
                  notifyTyped(p.fullName);
                }}
              >
                <span className="font-medium text-white">{p.fullName}</span>
                {p.className && (
                  <span className="ml-2 text-xs text-emerald-200/40">{p.className}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
      {!loading && allPeople.length > 0 && open && !value && !query && (
        <p className="mt-1 text-xs text-emerald-200/45">
          {allPeople.length} students — type to filter
        </p>
      )}
    </div>
  );
}
