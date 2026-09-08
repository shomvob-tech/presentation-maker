/**
 * One-time setup for the usage-log spreadsheet.
 *
 *   npm run audit:init              widen the grid, freeze row 1, write headers
 *   npm run audit:init -- --test-row   ...and append one dummy event
 *
 * Run this instead of typing the header row by hand: the columns come straight
 * from AUDIT_COLUMNS, so the header can't end up one position out of step with
 * the rows written underneath it.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { AUDIT_COLUMNS, toDhakaTimestamp } from "../lib/audit/events.ts";
import {
  appendAuditRow,
  isAuditConfigured,
  prepareSheet,
  writeHeaderRow,
} from "../lib/audit/sheets.ts";

/**
 * Minimal .env.local loader — neither node nor tsx reads it for a plain
 * script, and this avoids adding dotenv for one command. Existing environment
 * variables win, so CI or a shell export can override the file.
 */
function loadEnvLocal(): void {
  let contents: string;
  try {
    contents = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
  } catch {
    return;
  }

  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;

    const key = trimmed.slice(0, separator).trim();
    if (process.env[key] !== undefined) continue;

    let value = trimmed.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

async function main(): Promise<void> {
  loadEnvLocal();

  if (!isAuditConfigured()) {
    console.error(
      "Missing configuration. Set GOOGLE_SERVICE_ACCOUNT_EMAIL, " +
        "GOOGLE_PRIVATE_KEY_B64, and AUDIT_SHEET_ID in .env.local.",
    );
    process.exitCode = 1;
    return;
  }

  const { tabName, columnsAdded } = await prepareSheet();
  console.log(
    "Prepared tab \"" + tabName + "\" — " +
      (columnsAdded > 0
        ? "added " + columnsAdded + " column(s), froze row 1."
        : "already wide enough, froze row 1."),
  );

  await writeHeaderRow();
  console.log("Wrote " + AUDIT_COLUMNS.length + " headers to row 1.");

  if (process.argv.includes("--test-row")) {
    const now = new Date();
    await appendAuditRow({
      event_id: "init-test-" + now.getTime(),
      ts_utc: now.toISOString(),
      ts_local: toDhakaTimestamp(now),
      event: "builder_opened",
      doc_type: "proposal",
      device_id: "init-script",
      client_name: "TEST ROW — safe to delete",
      app_version: "local",
    });
    console.log("Appended one test row. Delete it once you've seen it land.");
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
