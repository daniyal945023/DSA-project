"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
import { DiscrepancyQueue } from "@/components/DiscrepancyQueue";
import { FileDrop } from "@/components/FileDrop";
import { LedgerTable } from "@/components/LedgerTable";
import { MetricCards, type MetricItem } from "@/components/MetricCards";
import { RangeQuery } from "@/components/RangeQuery";
import { VendorSearch } from "@/components/VendorSearch";
import { DsaInspector } from "@/components/DsaInspector";
import { generateSyntheticFeeds } from "@/lib/dataGenerator";
import {
  engineAvailable,
  exportReportCsv,
  getLedger,
  getSummaryStats,
  getTopDiscrepancies,
  initEngine,
  loadCsvData,
  queryAmountRange,
  searchMemoPrefix,
  type SummaryStats,
  type TransactionRecord
} from "@/lib/wasmEngine";

function money(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

const emptyStats: SummaryStats = {
  bankCount: 0, glCount: 0, matchedCount: 0,
  unmatchedBankCount: 0, unmatchedGlCount: 0,
  totalBankVolume: 0, matchedVolume: 0,
  unmatchedBankVolume: 0, unmatchedGlVolume: 0,
  matchRate: 0, processMs: 0, unreconciledValue: 0
};

export default function HomePage() {
  const [bankCsv, setBankCsv] = useState("");
  const [glCsv, setGlCsv] = useState("");
  const [bankName, setBankName] = useState("");
  const [glName, setGlName] = useState("");
  const [stats, setStats] = useState<SummaryStats>(emptyStats);
  const [discrepancies, setDiscrepancies] = useState<TransactionRecord[]>([]);
  const [ledger, setLedger] = useState<TransactionRecord[]>([]);
  const [rangeRows, setRangeRows] = useState<TransactionRecord[]>([]);
  const [prefix, setPrefix] = useState("ACME");
  const [hits, setHits] = useState<string[]>([]);
  const [minAmt, setMinAmt] = useState("1000");
  const [maxAmt, setMaxAmt] = useState("5000");
  const [busy, setBusy] = useState(false);
  const [engineReady, setEngineReady] = useState<boolean | null>(null);
  const [message, setMessage] = useState(
    "Ready. Click 'Load Sample Feeds' or drop your statement CSVs to begin reconciliation."
  );
  const [wallMs, setWallMs] = useState(0);

  useEffect(() => {
    engineAvailable().then(setEngineReady);
  }, []);

  const refresh = useCallback(async () => {
    const [nextStats, nextDisc, nextLedger, nextRange] = await Promise.all([
      getSummaryStats(), getTopDiscrepancies(), getLedger(),
      queryAmountRange(Number(minAmt), Number(maxAmt))
    ]);
    setStats(nextStats); setDiscrepancies(nextDisc);
    setLedger(nextLedger); setRangeRows(nextRange);
    if (prefix) setHits(await searchMemoPrefix(prefix));
  }, [prefix, minAmt, maxAmt]);

  const runEngine = useCallback(async () => {
    if (!bankCsv || !glCsv) {
      setMessage("Both a bank feed and a general ledger CSV are required.");
      return;
    }
    setBusy(true);
    try {
      const ready = await engineAvailable();
      if (!ready) { setMessage("WASM engine missing. Run `npm run build:wasm` then restart."); return; }
      await initEngine();
      const t0 = performance.now();
      const ok = await loadCsvData(bankCsv, glCsv);
      setWallMs(performance.now() - t0);
      if (!ok) { setMessage("Engine rejected CSV. Ensure format: id,date,amount,memo"); return; }
      await refresh();
      setMessage("Reconciliation complete — executed in WebAssembly using C++ MEMFS file streams.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Engine failed.");
    } finally {
      setBusy(false);
    }
  }, [bankCsv, glCsv, refresh]);

  const loadSamples = useCallback(async () => {
    try {
      const [bank, gl] = await Promise.all([
        fetch("/sample_data/bank_feed.csv").then(r => r.text()),
        fetch("/sample_data/general_ledger.csv").then(r => r.text())
      ]);
      setBankCsv(bank); setGlCsv(gl);
      setBankName("bank_feed.csv"); setGlName("general_ledger.csv");
      setMessage("Enterprise sample CSVs loaded. Click 'Run Reconciliation' to match feeds.");
    } catch {
      setMessage("Failed to load sample CSV files from public/sample_data.");
    }
  }, []);

  const loadSynthetic = useCallback((count: number) => {
    const { bankCsv: bCsv, glCsv: gCsv } = generateSyntheticFeeds(count, 85);
    setBankCsv(bCsv); setGlCsv(gCsv);
    setBankName(`synthetic_bank_${count}.csv`); setGlName(`synthetic_gl_${count}.csv`);
    setMessage(`Generated ${count} synthetic transactions (~85% match rate). Click 'Run Reconciliation' to benchmark.`);
  }, []);

  const onPrefix = useCallback(async (value: string) => {
    setPrefix(value);
    if (!value) { setHits([]); return; }
    try { setHits(await searchMemoPrefix(value)); } catch { setHits([]); }
  }, []);

  const onExport = useCallback(async () => {
    try {
      const csv = await exportReportCsv();
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "reconciliation_report.csv"; a.click();
      URL.revokeObjectURL(url);
    } catch { setMessage("Failed to export report CSV from WASM memory."); }
  }, []);

  const metrics: MetricItem[] = useMemo(() => [
    {
      label: "Total Bank Volume",
      value: money(stats.totalBankVolume),
      hint: `${stats.bankCount} bank · ${stats.glCount} ledger lines`,
      
      variant: "red",
      icon: "wallet"
    },
    {
      label: "Exact Match Rate",
      value: `${stats.matchRate.toFixed(1)}%`,
      hint: `${stats.matchedCount} exact ID + amount matches`,
      badge: `${stats.matchedCount}/${stats.bankCount || 0}`,
      variant: "rose",
      icon: "chart"
    },
    {
      label: "Unreconciled Value",
      value: money(stats.unreconciledValue),
      hint: `${stats.unmatchedBankCount} bank + ${stats.unmatchedGlCount} GL gaps`,
   
      variant: "gray",
      icon: "alert"
    },
    {
      label: "Engine Speed",
      value: `${Math.max(stats.processMs, Math.round(wallMs))} ms`,
      hint: "Client-side C++ execution in browser WASM",
    
      variant: "neutral",
      icon: "bolt"
    }
  ], [stats, wallMs]);

  return (
    <main className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 animate-fade-in">

      {/* ── Header ── */}
      <header className="mb-8 flex flex-wrap items-start justify-between gap-6 pb-8"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div>
          <div className="flex items-center gap-3">
            {/* Logo badge */}
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl font-mono text-lg font-bold  shadow-lg"
              style={{
                background: "orangered",
                boxShadow: "0 0 24px rgba(244,63,94,0.4), 0 4px 12px rgba(0,0,0,0.4)"
              }}>
              Æ
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                
               
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-100 sm:text-4xl">
                Aether <span className="text-orange-600">Reconciliation Engine</span>
              </h1>
            </div>
          </div>
          
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          
          <button
            onClick={() => void runEngine()}
            disabled={busy || !bankCsv || !glCsv}
            className="btn-red flex items-center gap-2 disabled:pointer-events-none"
          >
            {busy ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Reconciling…
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Run Reconciliation
              </>
            )}
          </button>
          <button
            onClick={() => void onExport()}
            disabled={ledger.length === 0}
            className="btn-outline-red disabled:pointer-events-none"
          >
            Export CSV
          </button> 
        </div>
      </header>

      {/* ── Status Bar ── */}
      <div
        className="mb-6 flex items-center justify-between rounded-xl px-4 py-3 text-xs"
        style={{
          background: "orangered",
          border: "1px solid rgba(255,255,255,0.06)",
          backdropFilter: "blur(16px)",
        }}
      >
        <div className="flex items-center gap-2.5">
          <span className="h-2 w-2 rounded-full animate-pulse" style={{ background: "yellow", boxShadow: "0 0 6px #f43f5e" }} />
          <span className="text-400">{message}</span>
        </div>
        <div className="hidden items-center gap-3 font-mono text-[11px] text-600 sm:flex">
          <span>MEMFS Virtual I/O</span>
          <span>·</span>
          <span>Zero Server Backend</span>
        </div>
      </div>

      {/* ── Metric Cards ── */}
      <MetricCards items={metrics} />

      {/* ── File Drop Zone ── */}
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <FileDrop
          label="Bank Feed Statement CSV"
          fileName={bankName} fileText={bankCsv}
          onText={(text, name) => { setBankCsv(text); setBankName(name); }}
          onClear={() => { setBankCsv(""); setBankName(""); }}
          samplePath="/sample_data/bank_feed.csv" sampleName="bank_feed.csv"
        />
        <FileDrop
          label="Internal General Ledger CSV"
          fileName={glName} fileText={glCsv}
          onText={(text, name) => { setGlCsv(text); setGlName(name); }}
          onClear={() => { setGlCsv(""); setGlName(""); }}
          samplePath="/sample_data/general_ledger.csv" sampleName="general_ledger.csv"
        />
      </div>

      {/* ── Discrepancy Queue ── */}
      <div className="mt-6">
        <DiscrepancyQueue rows={discrepancies} />
      </div>

      {/* ── Trie + AVL Grid ── */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <VendorSearch prefix={prefix} hits={hits} onPrefix={(v) => void onPrefix(v)} />
        <RangeQuery
          min={minAmt} max={maxAmt} rows={rangeRows}
          onMin={setMinAmt} onMax={setMaxAmt}
          onQuery={() => { void queryAmountRange(Number(minAmt), Number(maxAmt)).then(setRangeRows); }}
        />
      </div>

      {/* ── Ledger Table ── */}
      <div className="mt-6">
        <LedgerTable rows={ledger} />
      </div>

      {/* ── DSA Inspector ── */}
      <div className="mt-6">
        <DsaInspector />
      </div>

      {/* ── Footer ── */}
      <footer className="mt-14 pb-8 pt-6 text-center text-xs text-zinc-700"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        Enterprise Financial Reconciliation Engine · Academic C++ &amp; WebAssembly Architecture · Next.js 14
      </footer>
    </main>
  );
}
