"use client";

import { useState } from "react";

const STRUCTURES = [
  {
    name: "CustomHashTable",
    role: "Exact Transaction Matching",
    complexity: "O(1) Avg",
    space: "O(N)",
    desc: "Separate chaining hash table using raw singly-linked list nodes (HashNode*). Uses DJB2 string hashing on transaction IDs for instantaneous O(1) matching against General Ledger rows.",
    cCode: `struct HashNode { TransactionRecord record; HashNode* next; };
HashNode** buckets; // dynamic raw pointer array
size_t numBuckets;  // capacity doubles on load > 0.7`,
  },
  {
    name: "CustomMaxHeap",
    role: "Priority Discrepancy Queue",
    complexity: "O(log N)",
    space: "O(N)",
    desc: "Dynamic raw array implementation with automatic 2× capacity doubling. Prioritizes unreconciled gaps by absolute dollar magnitude |amount|, surfacing highest financial risks first.",
    cCode: `TransactionRecord* data;
int size, capacity;
void heapifyUp(int i);
void heapifyDown(int i);`,
  },
  {
    name: "CustomDoublyLinkedList",
    role: "Chronological Audit Trail",
    complexity: "O(1) Insert",
    space: "O(N)",
    desc: "Chronological ledger keeping bidirectional order. Features raw head, tail, prev, and next pointers with complete manual memory deallocation in destructor.",
    cCode: `struct DLLNode {
  TransactionRecord data;
  DLLNode* prev; DLLNode* next;
};
DLLNode* head; DLLNode* tail;`,
  },
  {
    name: "CustomTrie",
    role: "Live Vendor Memo Search",
    complexity: "O(L) Lookup",
    space: "O(128 × Nodes)",
    desc: "Prefix tree utilizing raw child pointer arrays (children[128]) per node. Enables zero-latency character-by-character vendor search across unstructured bank narrative memos.",
    cCode: `struct TrieNode {
  TrieNode* children[128];
  bool isEnd;
  char word[128];
};`,
  },
  {
    name: "CustomAVLTree",
    role: "Dollar Range Queries",
    complexity: "O(log N + K)",
    space: "O(N)",
    desc: "Self-balancing BST with raw left/right rotation balancing (LL, RR, LR, RL). Supports logarithmic range scans to retrieve all transactions within a dollar band.",
    cCode: `struct AVLNode {
  TransactionRecord record;
  AVLNode *left, *right;
  int height;
};
AVLNode* rotateLeft(AVLNode*);
AVLNode* rotateRight(AVLNode*);`,
  }
];

export function DsaInspector() {
  const [selected, setSelected] = useState(0);
  const active = STRUCTURES[selected];

  return (
    <div
      className="relative overflow-hidden rounded-2xl border p-6 transition-all duration-300"
     style={{
  background: "rgba(255,255,255,0.10)",
  borderColor: "rgba(255,255,255,0.12)",
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  boxShadow: "0 12px 28px rgba(88, 56, 40, 0.10), inset 0 1px 0 rgba(255,255,255,0.14)",
}}
    >
      {/* Background glow */}
      <div className="pointer-events-none absolute right-0 top-0 h-72 w-72 rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(244,63,94,0.07) 0%, transparent 70%)" }} />

      {/* Header */}
      <div className="pb-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: "orangered" }}>
                Academic DSA Architecture
              </span>
              <span className="rounded-full border px-2 py-0.5 font-mono text-[10px]"
                style={{ borderColor: "rgba(244,63,94,0.25)", background: "orangered", color: "#fda4af" }}>
                5 Raw C++ Structures
              </span>
            </div>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-orange-600">
              Data Structure Inspector
            </h2>
            
          </div>
          
        </div>

        {/* Tab Selector */}
        <div className="mt-4 flex flex-wrap gap-2">
          {STRUCTURES.map((s, i) => {
            const active = i === selected;
            return (
              <button
                key={s.name}
                onClick={() => setSelected(i)}
                className="rounded-xl border px-3.5 py-2 text-xs font-medium transition-all duration-200"
                style={{
                  borderColor: active ? "rgba(244,63,94,0.5)" : "rgba(255,255,255,0.06)",
                  background: active ? "orangered" : "rgba(255,255,255,0.02)",
                  color: 'black',
                  boxShadow: active ? "0 0 16px rgba(244,63,94,0.15)" : "none",
                  transform: active ? "translateY(-1px)" : "none",
                }}
              >
                {s.name.replace("Custom", "")}
              </button>
            );
          })}
        </div>
      </div>

      {/* Detail Panel */}
      <div className="mt-5 grid gap-6 lg:grid-cols-2">
        {/* Left: Info */}
        <div className="animate-fade-in space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-mono text-lg font-bold text-orange-600">{active.name}</h3>
              <p className="text-xs text-500">{active.role}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full border px-2.5 py-1 font-mono text-xs font-semibold"
                style={{ borderColor: "rgba(244,63,94,0.3)", background: "orangered", color: "black" }}>
                {active.complexity}
              </span>
              <span className="rounded-full border px-2.5 py-1 font-mono text-xs"
                style={{ borderColor: "rgba(255,255,255,0.08)", background: "orangered", color: "black" }}>
                Space {active.space}
              </span>
            </div>
          </div>

          <p className="text-sm leading-relaxed text-400">{active.desc}</p>

          {/* Compliance chips */}
         

          {/* Complexity table */}
          <div className="rounded-xl border overflow-hidden"
            style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <table className="w-full text-xs">
              <thead>
                <tr style={{ background: "orangered", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wider text-600 text-[10px]">Operation</th>
                  <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wider text-600 text-[10px]">Time</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Insert",    active.complexity],
                  ["Lookup",    active.complexity],
                  ["Delete",    active.complexity],
                  ["Space",     active.space],
                ].map(([op, val]) => (
                  <tr key={op} className="border-t" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                    <td className="px-4 py-2 font-mono text-500">{op}</td>
                    <td className="px-4 py-2 font-mono font-semibold" style={{ color: "orangered" }}>{val}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: C++ code */}
        <div className="animate-fade-in">
          <div className="flex items-center justify-between rounded-t-xl border-x border-t px-4 py-2"
            style={{ borderColor: "rgba(255,255,255,0.06)", background: "orangered" }}>
            <span className="font-mono text-[11px] text-600">struct definition · {active.name}.h</span>
            <div className="flex gap-1.5">
              {["#f43f5e","#fb923c","#4ade80"].map((c) => (
                <span key={c} className="h-2.5 w-2.5 rounded-full" style={{ background: c, opacity: 0.6 }} />
              ))}
            </div>
          </div>
          <pre
            className="overflow-x-auto rounded-b-xl border-x border-b px-5 py-5 font-mono text-xs leading-relaxed"
            style={{
              borderColor: "rgba(255,255,255,0.06)",
              background: "rgba(6,6,8,0.85)",
              color: "#fda4af",
            }}
          >
            <code>{active.cCode}</code>
          </pre>

          {/* Summary stat boxes */}
          
        </div>
      </div>
    </div>
  );
}
