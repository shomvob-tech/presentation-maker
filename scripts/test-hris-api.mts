/**
 * Smoke test for POST /api/v1/hris/proposals — sends one sample proposal and
 * prints what came back. No browser involved, so CORS doesn't apply.
 *
 *   npm run test:hris-api
 *   npm run test:hris-api -- https://proposal-builder.shomvob.com
 *   npm run test:hris-api -- http://localhost:3000 my-company-id
 *
 * Reads HRIS_API_KEY from .env.local (or the environment). Running it twice
 * with the same company id should return version 1, then version 2.
 */

try {
  process.loadEnvFile(".env.local");
} catch {
  // No .env.local — fall back to whatever is already in the environment.
}

const baseUrl = process.argv[2] ?? "http://localhost:3000";
const companyId = process.argv[3] ?? "test-company";
const apiKey = process.env.HRIS_API_KEY?.trim();

if (!apiKey) {
  console.error("HRIS_API_KEY is not set (looked in .env.local and the environment).");
  process.exit(1);
}

const body = {
  companyId,
  clientName: "Test Company Ltd",
  requestedBy: "test-script",
  employeeCount: 250,
  mrcFee: 25000,
  rolloutCharge: 50000,
  selectedModules: ["attendance", "leave", "payroll", "roster", "employee-management"],
  problemStatementHeading: "Solving Your Specific Challenge",
  problemStatementText:
    "<p>Attendance is tracked on paper across three sites, and payroll takes a week to close.</p>",
  preparedByName: "Test Sender",
  preparedByEmail: "sender@example.com",
};

const url = `${baseUrl.replace(/\/+$/, "")}/api/v1/hris/proposals`;
console.log(`POST ${url} (companyId=${companyId})`);

const startedAt = Date.now();
const response = await fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json", "x-api-key": apiKey },
  body: JSON.stringify(body),
});
const text = await response.text();

console.log(`HTTP ${response.status} in ${((Date.now() - startedAt) / 1000).toFixed(1)}s`);
try {
  console.log(JSON.stringify(JSON.parse(text), null, 2));
} catch {
  console.log(text.slice(0, 2000));
}

process.exit(response.ok ? 0 : 1);
