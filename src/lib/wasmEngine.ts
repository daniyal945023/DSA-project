export type TransactionRecord = {
  id: string;
  date: string;
  amount: number;
  memo: string;
  status: string;
};

export type SummaryStats = {
  bankCount: number;
  glCount: number;
  matchedCount: number;
  unmatchedBankCount: number;
  unmatchedGlCount: number;
  totalBankVolume: number;
  matchedVolume: number;
  unmatchedBankVolume: number;
  unmatchedGlVolume: number;
  matchRate: number;
  processMs: number;
  unreconciledValue: number;
};

type EmscriptenModule = {
  ccall: (name: string, ret: string | null, args: string[], values: unknown[]) => unknown;
  UTF8ToString: (ptr: number) => string;
  _free_string: (ptr: number) => void;
};

declare global {
  interface Window {
    createEngineModule?: (opts?: Record<string, unknown>) => Promise<EmscriptenModule>;
  }
}

let modulePromise: Promise<EmscriptenModule> | null = null;

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.body.appendChild(script);
  });
}

export async function getEngine(): Promise<EmscriptenModule> {
  if (!modulePromise) {
    modulePromise = (async () => {
      await loadScript("/wasm/engine.js");
      if (!window.createEngineModule) {
        throw new Error("WASM glue loaded but createEngineModule is missing");
      }
      return window.createEngineModule({
        locateFile: (path: string) => `/wasm/${path}`
      });
    })();
  }
  return modulePromise;
}

function callString(mod: EmscriptenModule, name: string, argTypes: string[] = [], args: unknown[] = []): string {
  const ptr = mod.ccall(name, "number", argTypes, args) as number;
  if (!ptr) {
    return "";
  }
  const text = mod.UTF8ToString(ptr);
  mod._free_string(ptr);
  return text;
}

export async function initEngine(): Promise<void> {
  const mod = await getEngine();
  mod.ccall("init_engine", null, [], []);
}

export async function loadCsvData(bankCsv: string, glCsv: string): Promise<boolean> {
  const mod = await getEngine();
  const ok = mod.ccall("load_csv_data", "number", ["string", "string"], [bankCsv, glCsv]) as number;
  return ok === 1;
}

export async function getSummaryStats(): Promise<SummaryStats> {
  const mod = await getEngine();
  return JSON.parse(callString(mod, "get_summary_stats")) as SummaryStats;
}

export async function getTopDiscrepancies(): Promise<TransactionRecord[]> {
  const mod = await getEngine();
  return JSON.parse(callString(mod, "get_top_discrepancies") || "[]") as TransactionRecord[];
}

export async function getLedger(): Promise<TransactionRecord[]> {
  const mod = await getEngine();
  return JSON.parse(callString(mod, "get_ledger") || "[]") as TransactionRecord[];
}

export async function searchMemoPrefix(prefix: string): Promise<string[]> {
  const mod = await getEngine();
  return JSON.parse(callString(mod, "search_memo_prefix", ["string"], [prefix]) || "[]") as string[];
}

export async function queryAmountRange(minAmount: number, maxAmount: number): Promise<TransactionRecord[]> {
  const mod = await getEngine();
  return JSON.parse(
    callString(mod, "query_amount_range", ["number", "number"], [minAmount, maxAmount]) || "[]"
  ) as TransactionRecord[];
}

export async function exportReportCsv(): Promise<string> {
  const mod = await getEngine();
  return callString(mod, "export_report_csv");
}

export async function engineAvailable(): Promise<boolean> {
  try {
    await getEngine();
    return true;
  } catch {
    modulePromise = null;
    return false;
  }
}
