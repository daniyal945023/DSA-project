const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const sampleDir = path.join(root, "public", "sample_data");

const VENDORS = [
  "ACME CORP PAYROLL MARCH",
  "ACME CORP HEALTH BENEFITS",
  "AWS CLOUD SERVICES US-EAST-1",
  "AWS INFRA S3 STORAGE",
  "GOOGLE CLOUD PLATFORM COMPUTE",
  "GOOGLE WORKSPACE ENTERPRISE",
  "UBER TECHNOLOGIES RIDE SHARE",
  "UBER EATS CLIENT ENTERTAINMENT",
  "STRIPE PAYMENTS PROCESSING FEE",
  "MICROSOFT AZURE RESERVED INSTANCE",
  "SALESFORCE CRM ENTERPRISE SEATS",
  "DELL TECHNOLOGIES WORKSTATIONS",
  "DOCUSIGN ENTERPRISE SIGNATURES",
  "STARBUCKS CORP TEAM CATERING",
  "WEWORK SOMA HOT DESK ACCESS",
  "ORACLE CLOUD DATABASE LICENSING",
  "SLACK TECHNOLOGIES BUSINESS PLUS",
  "NVIDIA AI ENTERPRISE COMPUTE",
  "GITHUB ENTERPRISE ORG ACCESS",
  "FEDEX PRIORITY OVERNIGHT FREIGHT"
];

function generate(count = 2000, matchRate = 0.85) {
  const bankRows = ["id,date,amount,memo"];
  const glRows = ["id,date,amount,memo"];

  const matched = Math.floor(count * matchRate);
  const unmatchedBank = count - matched;
  const unmatchedGl = Math.floor(unmatchedBank * 0.7);

  let idCounter = 10000;

  for (let i = 0; i < matched; i++) {
    idCounter++;
    const id = `TXN-${idCounter}`;
    const day = (i % 28) + 1;
    const date = `2026-03-${day < 10 ? `0${day}` : day}`;
    const amount = (25 + Math.random() * 8000).toFixed(2);
    const vendor = VENDORS[i % VENDORS.length];
    bankRows.push(`${id},${date},${amount},${vendor}`);
    glRows.push(`${id},${date},${amount},${vendor}`);
  }

  for (let i = 0; i < unmatchedBank; i++) {
    idCounter++;
    const id = `TXN-${idCounter}`;
    const day = (i % 28) + 1;
    const date = `2026-03-${day < 10 ? `0${day}` : day}`;
    const isBig = i % 8 === 0;
    const amount = (isBig ? 15000 + Math.random() * 30000 : 50 + Math.random() * 2000).toFixed(2);
    const vendor = `${VENDORS[(i + 4) % VENDORS.length]} UNMATCHED`;
    bankRows.push(`${id},${date},${amount},${vendor}`);
  }

  for (let i = 0; i < unmatchedGl; i++) {
    idCounter++;
    const id = `TXN-${idCounter}`;
    const day = (i % 28) + 1;
    const date = `2026-03-${day < 10 ? `0${day}` : day}`;
    const isBig = i % 6 === 0;
    const amount = (isBig ? 12000 + Math.random() * 25000 : 80 + Math.random() * 1500).toFixed(2);
    const vendor = `GL ACCRUAL TIMING GAP #${i + 1}`;
    glRows.push(`${id},${date},${amount},${vendor}`);
  }

  return { bankCsv: bankRows.join("\n"), glCsv: glRows.join("\n") };
}

const count = parseInt(process.argv[2], 10) || 2000;
console.log(`Generating synthetic enterprise dataset with ${count} transactions...`);

const { bankCsv, glCsv } = generate(count);

fs.writeFileSync(path.join(sampleDir, "benchmark_bank_feed.csv"), bankCsv, "utf8");
fs.writeFileSync(path.join(sampleDir, "benchmark_general_ledger.csv"), glCsv, "utf8");

console.log(`Wrote public/sample_data/benchmark_bank_feed.csv (${bankCsv.split("\n").length - 1} rows)`);
console.log(`Wrote public/sample_data/benchmark_general_ledger.csv (${glCsv.split("\n").length - 1} rows)`);
console.log("Ready for high-volume stress testing!");
