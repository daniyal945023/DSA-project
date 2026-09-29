"use client";

import { useCallback, useMemo, useState } from "react";

type Props = {
  label: string;
  fileName?: string;
  fileText?: string;
  onText: (text: string, name: string) => void;
  onClear?: () => void;
  samplePath?: string;
  sampleName?: string;
};

export function FileDrop({ label, fileName, fileText, onText, onClear, samplePath, sampleName }: Props) {
  const [dragging, setDragging] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const readFile = useCallback(async (file: File) => {
    onText(await file.text(), file.name);
  }, [onText]);

  const previewRows = useMemo(() => {
    if (!fileText) return [];
    return fileText.trim().split(/\r?\n/).slice(0, 4).map((l) =>
      l.split(",").map((p) => p.replace(/^"|"$/g, "").trim())
    );
  }, [fileText]);

  const rowCount = useMemo(() => {
    if (!fileText) return 0;
    return Math.max(0, fileText.trim().split(/\r?\n/).length - 1);
  }, [fileText]);

  const loadSample = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!samplePath || !sampleName) return;
    const text = await fetch(samplePath).then((r) => r.text());
    onText(text, sampleName);
  };

  return (
    <div
      className={`group relative flex flex-col justify-between rounded-2xl border p-5 transition-all duration-300 ${
        dragging
          ? "scale-[1.01]"
          : fileName
          ? "hover:-translate-y-0.5"
          : "hover:border-orange-500"
      }`}
      style={{
  background: dragging
    ? "rgba(244,63,94,0.06)"
    : "rgba(255,255,255,0.10)",
  borderColor: dragging
    ? "rgba(244,63,94,0.5)"
    : fileName
    ? "rgba(244,63,94,0.2)"
    : "rgba(255,255,255,0.12)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  boxShadow: dragging
    ? "0 0 22px rgba(244,63,94,0.14), 0 8px 24px rgba(88, 56, 40, 0.10)"
    : "0 10px 24px rgba(88, 56, 40, 0.10), inset 0 1px 0 rgba(255,255,255,0.14)"
}}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) void readFile(file);
      }}
    >
      {/* Red corner glow when active */}
      {fileName && (
        <div
          className="pointer-events-none absolute right-0 top-0 h-24 w-24 rounded-full blur-2xl"
          style={{ background: "radial-gradient(circle, rgba(244,63,94,0.12) 0%, transparent 70%)" }}
        />
      )}

      <div className="relative flex items-start justify-between">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-orange-600">
            {label}
          </span>
          <h3 className="mt-1 flex items-center gap-2 text-sm font-semibold text-200">
            {fileName ? (
              <>
                <span
                  className="inline-block h-2 w-2 rounded-full animate-pulse"
                  style={{ background: "#f43f5e", boxShadow: "0 0 6px #f43f5e" }}
                />
                {fileName}
              </>
            ) : (
              "Upload CSV statement"
            )}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {fileName ? (
            <>
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="btn-ghost text-[11px] px-2.5 py-1"
              >
                {showPreview ? "Hide" : "Preview"}
              </button>
              {onClear && (
                <button
                  type="button"
                  onClick={onClear}
                  className="rounded-lg border px-2.5 py-1 text-[11px] font-medium text-orange-500 transition-all duration-200 hover:bg-orange-500"
                  style={{ borderColor: "rgba(244,63,94,0.25)" }}
                >
                  Clear
                </button>
              )}
            </>
          ) : samplePath ? (
            <button type="button" onClick={loadSample} className="btn-outline-red text-[11px]">
              Load Sample
            </button>
          ) : null}
        </div>
      </div>

      {!fileName ? (
        <label
          className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed py-8 transition-all duration-200 hover:border-orange-500"
          style={{
            borderColor: "rgba(255,255,255,0.06)",
            background: "rgba(255,255,255,0.015)",
          }}
        >
          <svg className="h-9 w-9 text-600 transition-colors duration-200 group-hover:text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <span className="mt-2 text-sm text-400 transition-colors duration-200 group-hover:text-300">
            Drop CSV or <span className="text-orange-500 underline">browse</span>
          </span>
          <span className="mt-1 font-mono text-[11px] text-600">id, date, amount, memo</span>
          <input type="file" accept=".csv,text/csv" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) void readFile(f); }} />
        </label>
      ) : (
        <div className="relative mt-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-500">
              Ingested <strong className="font-mono text-orange-500">{rowCount}</strong> records
            </span>
            <span className="badge-red">CSV Ready</span>
          </div>

          {showPreview && previewRows.length > 0 && (
            <div className="mt-3 animate-fade-in overflow-x-auto rounded-xl border p-2 font-mono text-xs"
              style={{ background: "rgba(10,10,12,0.7)", borderColor: "rgba(255,255,255,0.05)" }}>
              <table className="w-full text-left">
                <tbody>
                  {previewRows.map((cols, i) => (
                    <tr key={i} className={`border-b ${i === 0 ? "text-500" : "text-300"}`}
                      style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                      {cols.map((col, j) => (
                        <td key={j} className="whitespace-nowrap px-2 py-1">{col}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
