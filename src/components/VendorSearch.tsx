"use client";

type Props = {
  prefix: string;
  hits: string[];
  onPrefix: (value: string) => void;
};

const SUGGESTIONS = ["ACME", "AWS", "UBER", "GOOGLE", "DELL", "STARBUCKS", "DOCUSIGN", "NETFLIX"];

export function VendorSearch({ prefix, hits, onPrefix }: Props) {
  const highlightPrefix = (text: string, p: string) => {
    if (!p) return text;
    const idx = text.toLowerCase().indexOf(p.toLowerCase());
    if (idx === -1) return text;
    const before = text.slice(0, idx);
    const match = text.slice(idx, idx + p.length);
    const after = text.slice(idx + p.length);
    return (
      <span>
        {before}
        <span className="rounded px-1 py-0.5 font-bold" style={{ background: "rgba(244,63,94,0.15)", color: "#fda4af" }}>
          {match}
        </span>
        {after}
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
      <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(244,63,94,0.08) 0%, transparent 70%)" }} />

      <div className="flex items-start justify-between pb-4"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: "orangered" }}>
              Live Trie Vendor Lookup
            </span>
            <span className="rounded-full border px-2 py-0.5 font-mono text-[10px]"
              style={{ borderColor: "rgba(244,63,94,0.25)", background: "orangered", color: "#fda4af" }}>
              CustomTrie [O(L)]
            </span>
          </div>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-orange-600">Prefix Search on Bank Memos</h2>
          <p className="mt-1 text-xs text-500">Real-time prefix tree traversal using 128 raw pointer children per node.</p>
        </div>
        {prefix && (
          <span className="rounded-lg border px-2.5 py-1 font-mono text-xs"
            style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(10,10,12,0.6)", color: "#fb7185" }}>
            {hits.length} hit{hits.length === 1 ? "" : "s"}
          </span>
        )}
      </div>

      <div className="mt-4">
        <div className="relative">
          <input
            type="text"
            value={prefix}
            onChange={(e) => onPrefix(e.target.value)}
            placeholder="Type vendor prefix (e.g. ACME, UBER, AWS)…"
            className="input-glass w-full pl-10 font-mono"
          />
          <svg className="absolute left-3.5 top-3 h-4 w-4 text-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {prefix && (
            <button
              onClick={() => onPrefix("")}
              className="absolute right-3.5 top-2.5 text-[11px] text-500 transition hover:text-crimson-400"
            >
              Clear
            </button>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-[11px] text">Quick chips:</span>
          {SUGGESTIONS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => onPrefix(tag)}
              className="rounded-lg border px-2.5 py-1 font-mono text-[11px] transition-all duration-200"
              style={{
                borderColor: prefix.toUpperCase() === tag ? "rgba(244,63,94,0.5)" : "rgba(255,255,255,0.06)",
                background: prefix.toUpperCase() === tag ? "rgba(244,63,94,0.12)" : "rgba(255,255,255,0.02)",
                color: 'orangered',
              }}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 max-h-52 overflow-auto rounded-xl border p-2"
        style={{ background: "orangered", borderColor: "rgba(255,255,255,0.05)" }}>
        {hits.length > 0 ? (
          <ul className="space-y-1.5">
            {hits.map((hit, idx) => (
              <li
                key={`${hit}-${idx}`}
                className="flex items-center justify-between rounded-lg border px-3 py-2 font-mono text-xs transition-all duration-150"
                style={{
                  borderColor: "rgba(255,255,255,0.05)",
                  background: "rgba(18,18,22,0.6)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(244,63,94,0.2)";
                  (e.currentTarget as HTMLElement).style.background = "rgba(244,63,94,0.04)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.05)";
                  (e.currentTarget as HTMLElement).style.background = "rgba(18,18,22,0.6)";
                }}
              >
                <span className="text-200">{highlightPrefix(hit, prefix)}</span>
                <span className="font-sans text-[10px] text-600">Trie match</span>
              </li>
            ))}
          </ul>
        ) : prefix ? (
          <div className="py-6 text-center text-xs text-600">
            No memos found starting with &quot;{prefix}&quot;.
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-600">
            Type above or click a chip to traverse Trie prefix branches.
          </div>
        )}
      </div>
    </section>
  );
}
