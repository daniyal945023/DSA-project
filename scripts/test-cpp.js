const { spawnSync } = require("child_process");
const path = require("path");

const engineDir = path.resolve(__dirname, "..", "cpp_engine");
const sources = [
  "main.cpp",
  "src/CustomHashTable.cpp",
  "src/CustomMaxHeap.cpp",
  "src/CustomDoublyLinkedList.cpp",
  "src/CustomTrie.cpp",
  "src/CustomAVLTree.cpp",
  "src/ReconciliationEngine.cpp"
];

const out = process.platform === "win32" ? "recon_cli.exe" : "recon_cli";
const compile = spawnSync(
  "g++",
  ["-std=c++17", "-Wall", "-Wextra", "-O2", "-Iinclude", ...sources, "-o", out],
  { cwd: engineDir, stdio: "inherit", shell: process.platform === "win32" }
);

if (compile.status !== 0) {
  process.exit(compile.status || 1);
}

const run = spawnSync(process.platform === "win32" ? `.\\${out}` : `./${out}`, [], {
  cwd: engineDir,
  stdio: "inherit",
  shell: true
});
process.exit(run.status || 0);
