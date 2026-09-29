"use client";

import { useMemo, useState } from "react";
import type { TransactionRecord } from "@/lib/wasmEngine";

function money(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

const PAGE_SIZE = 15;

export function LedgerTable({ rows }: { rows: TransactionRecord[] }) {
  const [filter, setFilter] = useState<"ALL" | "MATCHED" | "UNMATCHED">("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const counts = useMemo(() => {
    let matched = 0, unmatched = 0;
    for (const r of rows) r.status === "MATCHED" ? matched++ : unmatched++;
    return { all: rows.length, matched, unmatched };
  }, [rows]);

  const filtered = useMemo(() =>
    rows.filter((r) => {
      const matchFilter = filter === "ALL" ? true : r.status === filter;
      const matchSearch = !search ||
        r.id.toLowerCase().includes(search.toLowerCase()) ||
        r.memo.toLowerCase().includes(search.toLowerCase());
      return matchFilter && matchSearch;
    }), [rows, filter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const FilterBtn = ({
    f, label, count,
  }: { f: "ALL" | "MATCHED" | "UNMATCHED"; label: string; count: number }) => {
    const active = filter === f;
    const styles = {
      ALL: { active: { background: "orangered", color: "white" } },
      MATCHED: { active: { background: "orangered", color: "white" } },
      UNMATCHED: { active: { background: "orangered", color: "white" } },
    }[f];
    return (
      <button
        onClick={() => { setFilter(f); setPage(1); }}
        className="rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200"
        style={active ? styles.active : { color: "#52525b" }}
      >
        {label} <span className="ml-1 font-mono opacity-70">({count})</span>
      </button>
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
      <div className="pointer-events-none absolute -left-20 -top-20 h-56 w-56 rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(244,63,94,0.06) 0%, transparent 70%)" }} />

      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 pb-5"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: "orangered" }}>
              Chronological Audit Trail
            </span>
            <span className="rounded-full border px-2 py-0.5 font-mono text-[10px]"
              style={{ borderColor: "rgba(244,63,94,0.25)", background: "orangered", color: "#fda4af" }}>
              DoublyLinkedList [O(1)]
            </span>
          </div>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-orange-600">Reconciled Transaction Stream</h2>
          <p className="mt-1 text-xs text-500">Preserves strict chronological order using bidirectional node linkages.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Filter tabs */}
          <div className="flex rounded-xl border p-1"
            style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(10,10,12,0.5)" }}>
            <FilterBtn f="ALL"       label="All"       count={counts.all} />
            <FilterBtn f="MATCHED"   label="Matched"   count={counts.matched} />
            <FilterBtn f="UNMATCHED" label="Unmatched" count={counts.unmatched} />
          </div>

          {/* Search */}
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search ID or memo…"
              className="input-glass pl-8 text-xs"
              style={{ width: "200px" }}
            />
            <svg className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="mt-4 max-h-[460px] overflow-auto rounded-xl border"
        style={{ borderColor: "rgba(255,255,255,0.05)" }}>
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="sticky top-0 border-b text-[10px]"
            style={{
              background: "orangered",
              backdropFilter: "blur(12px)",
              borderColor: "rgba(255,255,255,0.06)",
            }}>
            <tr>
              {["#", "Transaction ID", "Post Date", "Amount", "Status", "Memo / Counterparty"].map((h) => (
                <th key={h} className="px-4 py-3 font-semibold uppercase tracking-wider text-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pagedRows.map((row, i) => {
              const isMatched = row.status === "MATCHED";
              return (
                <tr
                  key={`${row.id}-${i}`}
                  className="border-b font-mono transition-colors duration-150 hover:bg-crimson-500/[0.025]"
                  style={{ borderColor: "rgba(255,255,255,0.04)" }}
                >
                  <td className="px-4 py-3 text-xs text-600">#{(currentPage - 1) * PAGE_SIZE + i + 1}</td>
                  <td className="px-4 py-3 text-xs font-semibold text-zinc-200">{row.id}</td>
                  <td className="px-4 py-3 text-xs text-500">{row.date}</td>
                  <td className="px-4 py-3 text-xs font-bold" style={{ color: isMatched ? "#4ade80" : "#fb7185" }}>
                    {money(row.amount)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-sans text-[10px] font-medium"
                      style={{
                        borderColor: isMatched ? "rgba(74,222,128,0.2)" : "rgba(244,63,94,0.25)",
                        background: isMatched ? "rgba(74,222,128,0.08)" : "rgba(244,63,94,0.10)",
                        color: isMatched ? "#4ade80" : "#fb7185",
                      }}>
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: isMatched ? "#4ade80" : "#f43f5e" }} />
                      {row.status}
                    </span>
                  </td>
                  <td className="max-w-xs truncate px-4 py-3 font-sans text-xs text-400">{row.memo}</td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="py-12 text-center font-sans text-sm text-600">
                  No records to display. Upload CSV files to stream the audit trail.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filtered.length > PAGE_SIZE && (
        <div className="mt-4 flex items-center justify-between pt-3 text-xs"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <span className="text-600">
            Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length}
          </span>
          <div className="flex items-center gap-2">
            {[
              { label: "← Prev", action: () => setPage((p) => Math.max(1, p - 1)), disabled: currentPage === 1 },
              { label: "Next →", action: () => setPage((p) => Math.min(totalPages, p + 1)), disabled: currentPage === totalPages },
            ].map(({ label, action, disabled }) => (
              <button
                key={label}
                onClick={action}
                disabled={disabled}
                className="rounded-lg border px-3 py-1 font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-30 hover:text-100"
                style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)", color: "#71717a" }}
              >
                {label}
              </button>
            ))}
            <span className="font-mono text-400">{currentPage} / {totalPages}</span>
          </div>
        </div>
      )}
    </section>
  );
}
