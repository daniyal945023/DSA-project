# Enterprise Financial Reconciliation Engine

C++ matching core compiled to WebAssembly, with a Next.js dashboard for bank-to-general-ledger reconciliation. The engine uses only raw pointers and custom structures: hash table, max-heap, doubly linked list, trie, and AVL tree.

See [SPECS.md](SPECS.md) for full project requirements and [PROGRESS.md](PROGRESS.md) for detailed implementation milestones.

## Architecture

- **CustomHashTable** — separate chaining for O(1) exact ID + amount matching
- **CustomMaxHeap** — unreconciled items ranked by dollar magnitude
- **CustomDoublyLinkedList** — chronological bank audit trail
- **CustomTrie** — vendor memo prefix search (`children[128]`)
- **CustomAVLTree** — matched-amount range queries
- **MEMFS** — `std::ifstream` / `std::ofstream` inside the browser
- **Vercel** — static Next.js hosting, no paid backend

CSV tokenizing uses raw C-string scans. No STL containers, `std::string_view`, or smart pointers.

## Prerequisites

- Node.js 18+
- `g++` for native structure tests
- [Emscripten](https://emscripten.org/) (`emcc` on PATH) **or** Docker (uses `emscripten/emsdk`)

## Local setup

```bash
npm install
npm run test:cpp
npm run build:wasm
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Load sample CSVs (or drop your own) and run reconciliation.

CSV columns: `id,date,amount,memo`

## WASM output

`npm run build:wasm` writes:

- `public/wasm/engine.js`
- `public/wasm/engine.wasm`

The dashboard loads those files from `/wasm`. Next.js serves them as static assets.

## Deploy on Vercel (free)

1. Build WASM locally so `public/wasm/` is committed, **or** add `npm run build:wasm` to CI if Emscripten is installed.
2. Push the repo and import it in Vercel.
3. Framework preset: Next.js. Build command: `npm run build`. Output: default.

Vercel does not include `emcc`. Commit the generated `engine.js` / `engine.wasm` for a zero-config deploy.

## Native CLI

```bash
cd cpp_engine
make test
```

On Windows without Make:

```bash
npm run test:cpp
```

The harness checks insert/find/delete on each structure, then runs a fixture reconciliation and writes `reconciliation_report.csv`.
