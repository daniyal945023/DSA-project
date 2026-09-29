const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const engineDir = path.join(root, "cpp_engine");
const outDir = path.join(root, "public", "wasm");
fs.mkdirSync(outDir, { recursive: true });

const sources = [
  "wasm_bindings.cpp",
  "src/CustomHashTable.cpp",
  "src/CustomMaxHeap.cpp",
  "src/CustomDoublyLinkedList.cpp",
  "src/CustomTrie.cpp",
  "src/CustomAVLTree.cpp",
  "src/ReconciliationEngine.cpp"
];

const exported = [
  "_init_engine",
  "_load_csv_data",
  "_get_summary_stats",
  "_get_top_discrepancies",
  "_get_ledger",
  "_search_memo_prefix",
  "_query_amount_range",
  "_export_report_csv",
  "_free_string",
  "_malloc",
  "_free"
];

const exportedLiteral = `[${exported.map((n) => `"${n}"`).join(",")}]`;

const emArgs = [
  "-std=c++17",
  "-O3",
  "-Iinclude",
  ...sources,
  "-s",
  "WASM=1",
  "-s",
  "MODULARIZE=1",
  "-s",
  "EXPORT_NAME=createEngineModule",
  "-s",
  `EXPORTED_FUNCTIONS=${exportedLiteral}`,
  "-s",
  'EXPORTED_RUNTIME_METHODS=["ccall","cwrap","UTF8ToString","stringToUTF8","lengthBytesUTF8","HEAPU8"]',
  "-s",
  "ALLOW_MEMORY_GROWTH=1",
  "-s",
  "FORCE_FILESYSTEM=1",
  "-s",
  "ENVIRONMENT=web,worker",
  "-o",
  "../public/wasm/engine.js"
];

function run(command, args, cwd, useShell) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    shell: Boolean(useShell),
    windowsHide: true
  });
  return result.status === 0;
}

const emccCmd = process.platform === "win32" ? "emcc.bat" : "emcc";
if (run(emccCmd, emArgs, engineDir, process.platform === "win32")) {
  console.log("Built WASM with local emcc -> public/wasm/");
  process.exit(0);
}

const dockerArgs = [
  "run",
  "--rm",
  "-v",
  `${root}:/src`,
  "emscripten/emsdk:3.1.64",
  "emcc",
  "-std=c++17",
  "-O3",
  "-I/src/cpp_engine/include",
  "/src/cpp_engine/wasm_bindings.cpp",
  "/src/cpp_engine/src/CustomHashTable.cpp",
  "/src/cpp_engine/src/CustomMaxHeap.cpp",
  "/src/cpp_engine/src/CustomDoublyLinkedList.cpp",
  "/src/cpp_engine/src/CustomTrie.cpp",
  "/src/cpp_engine/src/CustomAVLTree.cpp",
  "/src/cpp_engine/src/ReconciliationEngine.cpp",
  "-s",
  "WASM=1",
  "-s",
  "MODULARIZE=1",
  "-s",
  "EXPORT_NAME=createEngineModule",
  "-s",
  `EXPORTED_FUNCTIONS=${exportedLiteral}`,
  "-s",
  'EXPORTED_RUNTIME_METHODS=["ccall","cwrap","UTF8ToString","stringToUTF8","lengthBytesUTF8","HEAPU8"]',
  "-s",
  "ALLOW_MEMORY_GROWTH=1",
  "-s",
  "FORCE_FILESYSTEM=1",
  "-s",
  "ENVIRONMENT=web,worker",
  "-o",
  "/src/public/wasm/engine.js"
];

if (run("docker", dockerArgs, root, false)) {
  console.log("Built WASM with emscripten/emsdk Docker image -> public/wasm/");
  process.exit(0);
}

console.error("Could not find emcc or Docker. Install Emscripten or Docker, then retry npm run build:wasm.");
process.exit(1);
