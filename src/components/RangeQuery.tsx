"use client";

import { useMemo } from "react";
import type { TransactionRecord } from "@/lib/wasmEngine";

function money(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

type Props = {
  min: string;
  max: string;
  rows: TransactionRecord[];
  onMin: (v: string) => void;
  onMax: (v: string) => void;
  onQuery: () => void;
};

const PRESETS = [
  { label: "< $250",       min: "0",    max: "250"   },
  { label: "$250 – $1k",   min: "250",  max: "1000"  },
  { label: "$1k – $5k",    min: "1000", max: "5000"  },
  { label: "$5k – $25k",   min: "5000", max: "25000" },
  { label: "All ($0 – $50k)", min: "0", max: "50000" },
];

export function RangeQuery({ min, max, rows, onMin, onMax, onQuery }: Props) {
  const totalQueriedSum = useMemo(() => rows.reduce((sum, r) => sum + r.amount, 0), [rows]);

  const applyPreset = (pMin: string, pMax: string) => { onMin(pMin); onMax(pMax); };

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
      <div className="pointer-events-none absolute -left-16 -top-16 h-52 w-52 rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(244,63,94,0.07) 0%, transparent 70%)" }} />

      <div className="flex items-start justify-between pb-4"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: "orangered" }}>
              AVL Balance Range Scan
            </span>
            <span className="rounded-full border px-2 py-0.5 font-mono text-[10px]"
              style={{ borderColor: "rgba(244,63,94,0.25)", background: "orangered", color: "#fda4af" }}>
              CustomAVLTree [O(log N + K)]
            </span>
          </div>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-orange-600">Matched Transactions by Dollar Band</h2>
          <p className="mt-1 text-xs text-500">Self-balancing BST pruned to search interval [Min, Max].</p>
        </div>

        {rows.length > 0 && (
          <div className="text-right">
            <span className="block font-mono text-sm font-semibold" style={{ color: "#fb7185" }}>
              {money(totalQueriedSum)}
            </span>
            <span className="text-[10px] text-600">
              {rows.length} row{rows.length === 1 ? "" : "s"}
            </span>
          </div>
        )}
      </div>

      <div className="mt-4">
        <div className="flex flex-wrap items-center gap-3">
          {[
            { label: "Min $", value: min, onChange: onMin, ph: "1000" },
            { label: "Max $", value: max, onChange: onMax, ph: "5000" },
          ].map(({ label, value, onChange, ph }) => (
            <div key={label} className="flex items-center gap-2">
              <label className="font-mono text-xs text-500">{label}</label>
              <input
                type="number"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="input-glass w-28 font-mono text-sm"
                placeholder={ph}
              />
            </div>
          ))}

          <button onClick={onQuery} className="btn-red">
            Scan Range
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-[11px] text-600">Presets:</span>
          {PRESETS.map((p) => {
            const active = min === p.min && max === p.max;
            return (
              <button
                key={p.label}
                type="button"
                onClick={() => applyPreset(p.min, p.max)}
                className="rounded-lg border px-2.5 py-1 font-mono text-[11px] transition-all duration-200"
                style={{
                  borderColor: active ? "rgba(244,63,94,0.5)" : "rgba(255,255,255,0.06)",
                  background: active ? "rgba(244,63,94,0.12)" : "rgba(255,255,255,0.02)",
                  color: 'orangered',
                }}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 max-h-52 overflow-auto rounded-xl border p-2"
        style={{ background: "orangered", borderColor: "rgba(255,255,255,0.05)" }}>
        {rows.length > 0 ? (
          <ul className="space-y-1.5">
            {rows.map((row, i) => (
              <li
                key={`${row.id}-${i}`}
                className="flex items-center justify-between rounded-lg border px-3 py-2 font-mono text-xs transition-all duration-150"
                style={{ borderColor: "rgba(255,255,255,0.05)", background: "rgba(18,18,22,0.6)" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(244,63,94,0.2)";
                  (e.currentTarget as HTMLElement).style.background = "rgba(244,63,94,0.04)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.05)";
                  (e.currentTarget as HTMLElement).style.background = "rgba(18,18,22,0.6)";
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-200">{row.id}</span>
                  <span className="max-w-[180px] truncate font-sans text-[11px] text-600">{row.memo}</span>
                </div>
                <span className="font-semibold" style={{ color: "#4ade80" }}>{money(row.amount)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="py-6 text-center text-xs text-600">
            Click &quot;Scan Range&quot; to execute AVL subtree walk between ${min} and ${max}.
          </div>
        )}
      </div>
    </section>
  );
}
