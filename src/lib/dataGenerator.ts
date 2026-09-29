/**
 * Synthetic Transaction Generator for High-Volume Stress Testing
 * Generates realistic Bank Feed and General Ledger CSV payloads.
 */

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
  "FEDEX PRIORITY OVERNIGHT FREIGHT",
  "SHELL OIL FLEET REFUELING",
  "DELTA AIR LINES EXECUTIVE TRAVEL",
  "MCKINSEY & COMPANY CONSULTING",
  "GOLDMAN SACHS TREASURY WIRE"
];

function round2(num: number): number {
  return Math.round(num * 100) / 100;
}

export function generateSyntheticFeeds(
  count: number = 1000,
  matchRatePercent: number = 85
): { bankCsv: string; glCsv: string } {
  const bankRows: string[] = ["id,date,amount,memo"];
  const glRows: string[] = ["id,date,amount,memo"];

  const matchedCount = Math.floor((count * matchRatePercent) / 100);
  const unmatchedBankCount = count - matchedCount;
  const unmatchedGlCount = Math.floor(unmatchedBankCount * 0.7);

  let txnCounter = 10000;

  // 1. Matched transactions (present in both bank and GL with identical ID and Amount)
  for (let i = 0; i < matchedCount; i++) {
    txnCounter++;
    const id = `TXN-${txnCounter}`;
    const day = (i % 28) + 1;
    const date = `2026-03-${day < 10 ? `0${day}` : day}`;
    const amount = round2(20 + Math.random() * 8500);
    const vendor = VENDORS[i % VENDORS.length];

    bankRows.push(`${id},${date},${amount.toFixed(2)},${vendor}`);
    glRows.push(`${id},${date},${amount.toFixed(2)},${vendor}`);
  }

  // 2. Bank-only discrepancies (money cleared bank, but not recorded in GL)
  for (let i = 0; i < unmatchedBankCount; i++) {
    txnCounter++;
    const id = `TXN-${txnCounter}`;
    const day = (i % 28) + 1;
    const date = `2026-03-${day < 10 ? `0${day}` : day}`;
    // Generate occasional large high-dollar impact item to test Max-Heap priority
    const isHighImpact = i % 8 === 0;
    const amount = round2(
      isHighImpact
        ? 15000 + Math.random() * 35000
        : 50 + Math.random() * 2500
    );
    const vendor = `${VENDORS[(i + 3) % VENDORS.length]} UNMATCHED`;

    bankRows.push(`${id},${date},${amount.toFixed(2)},${vendor}`);
  }

  // 3. GL-only residual discrepancies (recorded in GL, but not yet posted to bank)
  for (let i = 0; i < unmatchedGlCount; i++) {
    txnCounter++;
    const id = `TXN-${txnCounter}`;
    const day = (i % 28) + 1;
    const date = `2026-03-${day < 10 ? `0${day}` : day}`;
    const isHighImpact = i % 6 === 0;
    const amount = round2(
      isHighImpact
        ? 12000 + Math.random() * 28000
        : 80 + Math.random() * 1800
    );
    const vendor = `GL ACCRUAL TIMING GAP #${i + 1}`;

    glRows.push(`${id},${date},${amount.toFixed(2)},${vendor}`);
  }

  return {
    bankCsv: bankRows.join("\n"),
    glCsv: glRows.join("\n")
  };
}
