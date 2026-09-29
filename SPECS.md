# AGENT INSTRUCTION: Enterprise Financial Reconciliation & Discrepancy Engine

## 1. Project Overview
Build a high-performance Enterprise Financial Reconciliation Engine in C++ compiled to WebAssembly (WASM), paired with an interactive modern dashboard built using Next.js (App Router) and Tailwind CSS. The engine automates the high-volume matching of bank statement CSVs against internal General Ledger CSVs, surfacing financial discrepancies, high-risk items, and vendor memo lookups.

---

## 2. STRICT Academic C++ Rules & Constraints
1. **NO STL Containers:** Do NOT use `std::vector`, `std::unordered_map`, `std::map`, `std::list`, `std::queue`, `std::stack`, or `std::string_view`.
2. **NO Smart Pointers:** Do NOT use `std::unique_ptr` or `std::shared_ptr`.
3. **Raw Memory Management Only:** Use raw pointers (`T*`), raw dynamic arrays, manual allocation (`new` / `new[]`), and manual deallocation (`delete` / `delete[]`) in class destructors to guarantee zero memory leaks.
4. **Custom Data Structures Implemented From Scratch:**
   - `CustomHashTable`: Separate chaining using raw singly-linked list nodes for O(1) exact ID/Amount transaction matching.
   - `CustomMaxHeap`: Dynamic raw array implementation with manual capacity growth (2x doubling) for high-priority discrepancy queuing (ranked by dollar amount).
   - `CustomDoublyLinkedList`: Chronological transaction ledger and audit trail with raw `head`, `tail`, `prev`, `next` pointers.
   - `CustomTrie`: Prefix tree using raw pointer child arrays (`TrieNode* children[128]`) for auto-completing vendor string search on messy bank memos.
   - `CustomAVLTree`: Self-balancing search tree using raw pointers for fast dollar range queries (e.g., transactions between $1,000 and $5,000).
5. **C++ Standard File Handling Allowed:** Standard C++ file streams (`std::ifstream` and `std::ofstream`) are allowed for CSV parsing and report generation. Parsing tokens must use raw C-string operations (e.g., manual character scans, `strncpy`, or C string utilities).

---

## 3. Deployment Architecture (100% Free - WASM + Vercel)
- Compile the raw C++ code into WebAssembly (`.wasm` & `.js` wrapper) using Emscripten (`emcc`).
- Use Emscripten's built-in Virtual File System (MEMFS) so C++ file I/O operations (`std::ifstream` and `std::ofstream`) run seamlessly inside the browser without needing a paid backend server.
- Host the complete Next.js application (including static WASM assets) on Vercel's free tier.

---

## 4. Proposed Repository Directory Structure

cpp_reconciliation_app/
├── cpp_engine/
│   ├── include/
│   │   ├── CustomHashTable.hpp
│   │   ├── CustomMaxHeap.hpp
│   │   ├── CustomDoublyLinkedList.hpp
│   │   ├── CustomTrie.hpp
│   │   ├── CustomAVLTree.hpp
│   │   └── ReconciliationEngine.hpp
│   ├── src/
│   │   ├── CustomHashTable.cpp
│   │   ├── CustomMaxHeap.cpp
│   │   ├── CustomDoublyLinkedList.cpp
│   │   ├── CustomTrie.cpp
│   │   ├── CustomAVLTree.cpp
│   │   └── ReconciliationEngine.cpp
│   ├── main.cpp                 # Local CLI test harness for native testing
│   ├── wasm_bindings.cpp       # Emscripten / WebAssembly bindings
│   └── Makefile                 # Local g++ & Emscripten build rules
├── public/
│   ├── wasm/                    # Output directory for engine.wasm and engine.js
│   └── sample_data/            # Pre-populated bank_feed.csv & general_ledger.csv
├── src/
│   ├── app/                     # Next.js App Router (page.tsx, layout.tsx)
│   ├── components/              # Dashboard components (Upload, Table, Stats, Search)
│   └── lib/                     # WASM loader utility hook
└── README.md

---

## 5. Implementation Steps for Agent

### Phase 1: Core C++ Data Structures
Implement each data structure in `cpp_engine/` using clean `.hpp` headers and `.cpp` implementation files. Write a standalone `main.cpp` to run unit tests for memory leaks, insertion, deletion, and searches.

### Phase 2: Reconciliation Logic & File Handling
1. **Define Struct:** `struct TransactionRecord { char id[32]; char date[16]; double amount; char memo[128]; char status[16]; };`
2. **File Ingestion:** Read CSV lines using `std::ifstream`. Manually parse CSV tokens without using `std::stringstream`.
3. **Reconciliation Core:**
   - Load General Ledger into `CustomHashTable`.
   - Read Bank Feed transactions line-by-line:
     - If exact match found in `CustomHashTable`, push to `CustomDoublyLinkedList` marked as "MATCHED".
     - If no match found, push to `CustomMaxHeap` (ranked by dollar value) and mark as "UNMATCHED".
   - Populate `CustomTrie` with all bank memo strings for auto-complete vendor lookups.
   - Insert matched items into `CustomAVLTree` for financial range searches.
4. **File Export:** Generate `reconciliation_report.csv` using `std::ofstream` listing matched vs. unmatched totals.

### Phase 3: WebAssembly Integration
1. Write `wasm_bindings.cpp` exposing C-style functions (`extern "C"`) or Embind wrappers:
   - `init_engine()`
   - `load_csv_data(const char* bank_csv_str, const char* gl_csv_str)`
   - `get_summary_stats()`
   - `get_top_discrepancies()`
   - `search_memo_prefix(const char* prefix)`
   - `export_report_csv()`
2. Add build script in `Makefile` to generate `public/wasm/engine.js` and `public/wasm/engine.wasm`.

### Phase 4: Next.js Dashboard UI
1. Create a modern financial dashboard with Tailwind CSS:
   - **Header & Metric Cards:** Total Volume, Match Rate %, Unreconciled Dollar Value, Processing Speed (ms).
   - **Drag-and-Drop File Ingestion:** Allow users to upload bank and GL CSVs or load pre-populated sample files.
   - **Discrepancy Action Center:** Interactive queue pulling items directly from the C++ `MaxHeap`.
   - **Live Trie Vendor Search:** Search input utilizing the C++ `Trie` to filter vendor strings in real-time.
   - **Export Button:** Download generated reconciliation report CSV directly from WASM memory.

### Phase 5: Build Scripts & Documentation
1. Create a `build-wasm` script in `package.json` to compile C++ via Docker or local Emscripten.
2. Ensure Next.js correctly serves static `.wasm` files from `public/wasm`.
3. Provide a simple setup section in `README.md` detailing how to run locally and deploy to Vercel.

---

## 6. Execution Instructions
Start by generating **Phase 1** (the raw C++ headers and source files for the custom data structures) and verifying their strict adherence to zero STL/smart-pointer constraints. Once verified, move sequentially through Phases 2, 3, 4, and 5.
