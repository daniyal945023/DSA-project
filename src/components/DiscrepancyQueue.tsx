"use client";

import { useMemo, useState } from "react";
import type { TransactionRecord } from "@/lib/wasmEngine";

function money(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export function DiscrepancyQueue({ rows }: { rows: TransactionRecord[] }) {
  const [filterQuery, setFilterQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredRows = useMemo(() => {
    if (!filterQuery) return rows;
    const q = filterQuery.toLowerCase();
    return rows.filter(
      (r) =>
        r.id.toLowerCase().includes(q) ||
        r.memo.toLowerCase().includes(q) ||
        r.status.toLowerCase().includes(q)
    );
  }, [rows, filterQuery]);

  const totalDiscrepancySum = useMemo(
    () => filteredRows.reduce((acc, r) => acc + Math.abs(r.amount), 0),
    [filteredRows]
  );

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const getSeverityBadge = (amount: number) => {
    const abs = Math.abs(amount);
    if (abs >= 10000)
      return (
        <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium"
          style={{
  background: "rgba(255,255,255,0.10)",
  borderColor: "rgba(255,255,255,0.12)",
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  boxShadow: "0 12px 28px rgba(88, 56, 40, 0.10), inset 0 1px 0 rgba(255,255,255,0.14)",
}}>
          <span className="h-1.5 w-1.5 rounded-full bg-crimson-400 animate-pulse" style={{ background: "#f43f5e" }} />
          Critical
        </span>
      );
    if (abs >= 1000)
      return (
        <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium"
          style={{ borderColor: "rgba(251,146,60,0.35)", background: "rgba(251,146,60,0.10)", color: "#fdba74" }}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: "#fb923c" }} />
          High
        </span>
      );
    return (
      <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium"
        style={{ borderColor: "rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#a1a1aa" }}>
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: "#71717a" }} />
        Moderate
      </span>
    );
  };

  return (
    <section
      className="relative overflow-hidden rounded-2xl border p-6 transition-all duration-300"
     style={{
  background: "rgba(255,255,255,0.10)",
  borderColor: "rgba(255,255,255,0.12)",
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  boxShadow: "0 12px 28px rgba(88, 56, 40, 0.10), inset 0 1px 0 rgba(255,255,255,0.14)",
}}
    >
      {/* Red glow */}
      <div className="pointer-events-none absolute -right-24 -top-16 h-64 w-64 rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(244,63,94,0.1) 0%, transparent 70%)" }} />

      <div className="flex flex-wrap items-end justify-between gap-4 pb-5"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div>
          <div className="flex items-center gap-2">
            
            
          </div>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-orange-600">
            Priority Discrepancy Queue
          </h2>
          <p className="mt-1 text-xs text-500">
            Items ranked by absolute dollar magnitude via raw C++ Max-Heap.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Filter by ID or memo..."
              className="input-glass pl-8 text-xs"
              style={{ width: "220px" }}
            />
            <svg className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <div className="rounded-xl border px-3 py-1.5 font-mono text-xs"
            style={{ background: "rgba(10,10,12,0.6)", borderColor: "rgba(255,255,255,0.06)" }}>
            <span className="text-zinc-500">Total Gap: </span>
            <strong style={{ color: "#fb7185" }}>{money(totalDiscrepancySum)}</strong>
            <span className="ml-2 text-zinc-600">({filteredRows.length})</span>
          </div>
        </div>
      </div>

      <div className="mt-4 max-h-[440px] overflow-auto rounded-xl border"
        style={{ borderColor: "rgba(255,255,255,0.05)" }}>
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="sticky top-0 border-b text-xs"
            style={{
              background: "orangered",
              backdropFilter: "blur(12px)",
              borderColor: "rgba(255,255,255,0.06)",
            }}>
            <tr>
              {["Rank","Transaction ID","Date","Amount","Severity","Source","Memo",""].map((h) => (
                <th key={h} className="py-3 px-4 font-semibold uppercase tracking-wider text-zinc-600 text-[10px]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row, i) => (
              <tr
                key={`${row.id}-${row.status}-${i}`}
                className="border-b transition-colors duration-150 hover:bg-crimson-500/[0.03]"
                style={{ borderColor: "rgba(255,255,255,0.04)" }}
              >
                <td className="py-3 px-4">
                  <span className="rounded-md px-2 py-0.5 font-mono text-xs font-bold"
                    style={{ background: "rgba(244,63,94,0.1)", color: "#fb7185" }}>
                    #{i + 1}
                  </span>
                </td>
                <td className="py-3 px-4 font-mono text-xs text-zinc-200">{row.id}</td>
                <td className="py-3 px-4 text-xs text-500">{row.date}</td>
                <td className="py-3 px-4 font-mono text-xs font-semibold" style={{ color: "#fb7185" }}>
                  {money(row.amount)}
                </td>
                <td className="py-3 px-4">{getSeverityBadge(row.amount)}</td>
                <td className="py-3 px-4">
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-mono"
                    style={{
                      background: row.status === "GL_ONLY" ? "rgba(99,102,241,0.1)" : "rgba(244,63,94,0.1)",
                      color: row.status === "GL_ONLY" ? "#a5b4fc" : "#fda4af",
                      border: `1px solid ${row.status === "GL_ONLY" ? "rgba(99,102,241,0.2)" : "rgba(244,63,94,0.2)"}`,
                    }}>
                    {row.status === "GL_ONLY" ? "GL Only" : "Bank Only"}
                  </span>
                </td>
                <td className="py-3 px-4 max-w-[180px] truncate text-xs text-zinc-400">{row.memo}</td>
                <td className="py-3 px-4 text-right">
                  <button
                    onClick={() => copyToClipboard(row.id, `${row.id},${row.date},${row.amount},${row.memo},${row.status}`)}
                    className="rounded-lg border px-2.5 py-1 text-[11px] transition-all duration-150 hover:text-zinc-100"
                    style={{
                      borderColor: copiedId === row.id ? "rgba(244,63,94,0.35)" : "rgba(255,255,255,0.07)",
                      background: copiedId === row.id ? "rgba(244,63,94,0.1)" : "rgba(255,255,255,0.02)",
                      color: copiedId === row.id ? "#fda4af" : "#71717a",
                    }}
                  >
                    {copiedId === row.id ? "✓ Copied" : "Copy"}
                  </button>
                </td>
              </tr>
            ))}
            {filteredRows.length === 0 && (
              <tr>
                <td colSpan={8} className="py-14 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <svg className="h-9 w-9 text-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="font-medium text-orange-500">Zero open discrepancies</p>
                    <p className="text-xs text600">
                      {rows.length === 0
                        ? "Upload CSVs to initialize the Max-Heap engine."
                        : "No items match the active filter."}
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
