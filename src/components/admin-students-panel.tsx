"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { parseJsonResponse } from "@/lib/fetch-json";
import { Loader2, Printer, Upload, Users } from "lucide-react";

const CLASS_ORDER = ["S6 MCE", "S6 MCB", "S6 MPG", "S6 MPC", "S6 HGL", "S6 PCB"];
const ROSTER_CACHE_KEY = "prom_awards_roster_v2";

type StudentCode = {
  fullName: string;
  rosterIndex: number | null;
  code: string | null;
};

type CodesResponse = {
  classes: string[];
  byClass: Record<string, StudentCode[]>;
};

export function AdminStudentsPanel() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState("");
  const [codes, setCodes] = useState<CodesResponse | null>(null);
  const [selectedClass, setSelectedClass] = useState("");
  const [loading, setLoading] = useState(true);
  const [addForm, setAddForm] = useState({ firstName: "", lastName: "", className: "S6 MCE" });
  const [adding, setAdding] = useState(false);

  const loadCodes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/students/codes", { cache: "no-store" });
      if (!res.ok) return;
      const data = await parseJsonResponse<CodesResponse>(res);
      setCodes(data);
      const ordered =
        CLASS_ORDER.find((c) => data.classes.includes(c)) ?? data.classes[0] ?? "";
      setSelectedClass((prev) => prev || ordered);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCodes();
  }, [loadCodes]);

  async function loadOfficialRoster() {
    setImporting(true);
    setImportMsg("Replacing roster and generating codes… this may take up to a minute.");
    try {
      const res = await fetch("/api/admin/students/import-roster", { method: "POST" });
      const data = await parseJsonResponse<{ message?: string; error?: string }>(res);
      if (!res.ok) {
        setImportMsg(data.error ?? "Import failed");
        return;
      }
      sessionStorage.removeItem(ROSTER_CACHE_KEY);
      setImportMsg(data.message ?? "Official roster loaded.");
      await loadCodes();
    } catch (e) {
      setImportMsg(e instanceof Error ? e.message : "Import failed");
    } finally {
      setImporting(false);
    }
  }

  async function onImport(file: File) {
    setImporting(true);
    setImportMsg("");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/admin/students/import", { method: "POST", body: form });
      const data = await parseJsonResponse<{ message?: string; error?: string; imported?: number }>(
        res,
      );
      if (!res.ok) {
        setImportMsg(data.error ?? "Import failed");
        return;
      }
      sessionStorage.removeItem(ROSTER_CACHE_KEY);
      setImportMsg(data.message ?? `Imported ${data.imported} students.`);
      await loadCodes();
    } catch (e) {
      setImportMsg(e instanceof Error ? e.message : "Import failed");
    } finally {
      setImporting(false);
    }
  }

  async function addStudent(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    setImportMsg("");
    try {
      const res = await fetch("/api/admin/students/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });
      const data = await parseJsonResponse<{ message?: string; error?: string }>(res);
      if (!res.ok) {
        setImportMsg(data.error ?? "Could not add student");
        return;
      }
      sessionStorage.removeItem(ROSTER_CACHE_KEY);
      setImportMsg(data.message ?? "Student added.");
      setAddForm({ firstName: "", lastName: "", className: addForm.className });
      await loadCodes();
    } catch (e) {
      setImportMsg(e instanceof Error ? e.message : "Could not add student");
    } finally {
      setAdding(false);
    }
  }

  function printClass() {
    window.print();
  }

  const sortedClasses = codes
    ? [...codes.classes].sort((a, b) => {
        const ia = CLASS_ORDER.indexOf(a);
        const ib = CLASS_ORDER.indexOf(b);
        if (ia >= 0 && ib >= 0) return ia - ib;
        if (ia >= 0) return -1;
        if (ib >= 0) return 1;
        return a.localeCompare(b);
      })
    : [];

  const rows =
    selectedClass && codes?.byClass[selectedClass] ? codes.byClass[selectedClass] : [];

  return (
    <div className="mt-6 space-y-6">
      <Card>
        <h2 className="font-semibold text-white">Official S6 roster (136 students)</h2>
        <p className="mt-2 text-sm text-emerald-100/60">
          Replaces all old voters and loads the corrected list. Codes like{" "}
          <strong className="text-emerald-100">LY01</strong> = first 2 letters of first name + list
          number. Print one class at a time (S6 MCE, MCB, MPG, MPC, HGL, PCB).
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button disabled={importing} onClick={() => void loadOfficialRoster()}>
            {importing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Users className="h-4 w-4" />
            )}
            Load official roster into database
          </Button>
          <Button
            variant="secondary"
            disabled={importing}
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="h-4 w-4" />
            Upload Excel instead
          </Button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void onImport(f);
            e.target.value = "";
          }}
        />
        {importMsg && <p className="mt-3 text-sm text-emerald-200">{importMsg}</p>}
      </Card>

      <Card>
        <h2 className="font-semibold text-white">Add student not on the list</h2>
        <form onSubmit={addStudent} className="mt-3 grid gap-3 sm:grid-cols-2">
          <Input
            placeholder="First name"
            value={addForm.firstName}
            onChange={(e) => setAddForm((f) => ({ ...f, firstName: e.target.value }))}
            required
          />
          <Input
            placeholder="Last name"
            value={addForm.lastName}
            onChange={(e) => setAddForm((f) => ({ ...f, lastName: e.target.value }))}
            required
          />
          <Input
            className="sm:col-span-2"
            placeholder="Class e.g. S6 MCB"
            value={addForm.className}
            onChange={(e) => setAddForm((f) => ({ ...f, className: e.target.value }))}
            required
          />
          <Button type="submit" disabled={adding} className="sm:col-span-2">
            {adding ? "Adding…" : "Add student & generate code"}
          </Button>
        </form>
      </Card>

      <Card className="print:hidden">
        <h2 className="font-semibold text-white">Print codes by class</h2>
        {loading && <Loader2 className="mt-4 h-6 w-6 animate-spin text-emerald-400" />}
        {!loading && codes && codes.classes.length === 0 && (
          <p className="mt-2 text-sm text-white/50">Load the roster first.</p>
        )}
        {codes && codes.classes.length > 0 && (
          <>
            <div className="mt-4 flex flex-wrap gap-2">
              {sortedClasses.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedClass(c)}
                  className={`rounded-lg px-3 py-1.5 text-sm ${
                    selectedClass === c
                      ? "bg-emerald-600 text-white"
                      : "bg-emerald-950/50 text-emerald-100/70"
                  }`}
                >
                  {c} ({codes.byClass[c]?.length ?? 0})
                </button>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="secondary" onClick={printClass}>
                <Printer className="h-4 w-4" />
                Print {selectedClass}
              </Button>
            </div>
          </>
        )}
      </Card>

      <div className="print-class-sheet rounded-xl border border-white/10 bg-white/5 p-4 print:border-0 print:bg-white print:p-8 print:text-black">
        <div className="print:hidden">
          <h3 className="text-lg font-bold text-white">
            {selectedClass} — preview (use Print button)
          </h3>
        </div>
        <div className="hidden print:block print-class-section">
          <h3 className="text-xl font-bold text-black">{selectedClass}</h3>
          <p className="text-sm text-black/70">Promo Awards &apos;26 — voter login codes</p>
          <table className="mt-4 w-full text-left text-sm">
            <thead>
              <tr className="border-b border-black/30">
                <th className="p-2 w-12">#</th>
                <th className="p-2">Name</th>
                <th className="p-2 w-24">Code</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={`${r.rosterIndex}-${r.fullName}`} className="border-t border-black/15">
                  <td className="p-2 text-black/60">{r.rosterIndex ?? "—"}</td>
                  <td className="p-2 font-medium text-black">{r.fullName}</td>
                  <td className="p-2 font-mono text-lg font-bold text-black">{r.code ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="print:hidden">
          <table className="mt-4 w-full text-left text-sm">
            <thead>
              <tr className="text-white/60">
                <th className="p-2">#</th>
                <th className="p-2">Name</th>
                <th className="p-2">Code</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={`${r.rosterIndex}-${r.fullName}`} className="border-t border-white/10">
                  <td className="p-2 text-white/50">{r.rosterIndex ?? "—"}</td>
                  <td className="p-2 text-white">{r.fullName}</td>
                  <td className="p-2 font-mono font-semibold text-amber-200">{r.code ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-class-sheet,
          .print-class-sheet * {
            visibility: visible;
          }
          .print-class-sheet {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
