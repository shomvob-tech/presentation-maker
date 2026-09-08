/**
 * Google Sheets reader/writer for the usage log.
 *
 * SERVER ONLY — this reads the service-account private key. Never import it
 * from a "use client" module. (`server-only` isn't installed in this project,
 * so this comment is the guard.)
 *
 * This is the only file that knows the storage backend is Google Sheets.
 * Everything upstream deals in `AuditRow`, so swapping to a real database
 * later is a change to this file and nothing else.
 *
 * Auth is a hand-rolled service-account JWT rather than `googleapis`: it's
 * ~40 lines, and the serverless bundles here already carry Chromium weight
 * and a 60s ceiling.
 */

import { createSign } from "node:crypto";
import {
  AUDIT_COLUMNS,
  toRow,
  type AuditColumn,
  type AuditRow,
} from "./events";

const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const SHEETS_API = "https://sheets.googleapis.com/v4/spreadsheets";
const SCOPE = "https://www.googleapis.com/auth/spreadsheets";

const TOKEN_TTL_SECONDS = 3600;
/** Refresh a few minutes early rather than racing the expiry. */
const TOKEN_REFRESH_MARGIN_MS = 5 * 60 * 1000;

type AuditConfig = {
  clientEmail: string;
  privateKey: string;
  spreadsheetId: string;
  tabName: string;
};

/**
 * Vercel mangles the real newlines in a PEM, so the key is stored base64.
 * `GOOGLE_PRIVATE_KEY` with escaped \n is accepted as a fallback for anyone
 * who pastes it in raw.
 */
function readPrivateKey(): string | null {
  const encoded = process.env.GOOGLE_PRIVATE_KEY_B64?.trim();
  if (encoded) return Buffer.from(encoded, "base64").toString("utf8");

  const raw = process.env.GOOGLE_PRIVATE_KEY?.trim();
  if (raw) return raw.replace(/\\n/g, "\n");

  return null;
}

function readConfig(): AuditConfig | null {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
  const privateKey = readPrivateKey();
  const spreadsheetId = process.env.AUDIT_SHEET_ID?.trim();

  if (!clientEmail || !privateKey || !spreadsheetId) return null;

  return {
    clientEmail,
    privateKey,
    spreadsheetId,
    tabName: process.env.AUDIT_SHEET_TAB?.trim() || "events",
  };
}

/**
 * True when all three env vars are present. Call sites use this to stay quiet
 * on a machine that hasn't been configured — a missing key should never mean a
 * console full of warnings on every click.
 */
export function isAuditConfigured(): boolean {
  return readConfig() !== null;
}

function requireConfig(): AuditConfig {
  const config = readConfig();
  if (!config) {
    throw new Error(
      "Audit log is not configured. Set GOOGLE_SERVICE_ACCOUNT_EMAIL, " +
        "GOOGLE_PRIVATE_KEY_B64, and AUDIT_SHEET_ID (see .env.local).",
    );
  }
  return config;
}

function base64Url(input: string | Buffer): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function buildAssertion(config: AuditConfig): string {
  const issuedAt = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64Url(
    JSON.stringify({
      iss: config.clientEmail,
      scope: SCOPE,
      aud: TOKEN_ENDPOINT,
      iat: issuedAt,
      exp: issuedAt + TOKEN_TTL_SECONDS,
    }),
  );

  const signer = createSign("RSA-SHA256");
  signer.update(header + "." + claims);
  const signature = base64Url(signer.sign(config.privateKey));

  return header + "." + claims + "." + signature;
}

/**
 * Cached in module scope, which on serverless means per warm instance — worst
 * case a cold start pays for one extra token request.
 */
let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(config: AuditConfig): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.value;
  }

  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: buildAssertion(config),
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      ("Google token request failed (" + response.status + "). " + detail).trim(),
    );
  }

  const body = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
  };

  if (!body.access_token) {
    throw new Error("Google token response contained no access_token.");
  }

  const lifetimeMs = (body.expires_in ?? TOKEN_TTL_SECONDS) * 1000;
  cachedToken = {
    value: body.access_token,
    expiresAt: Date.now() + lifetimeMs - TOKEN_REFRESH_MARGIN_MS,
  };

  return cachedToken.value;
}

async function sheetsFetch(
  path: string,
  init: RequestInit & { config?: AuditConfig } = {},
): Promise<unknown> {
  const config = init.config ?? requireConfig();
  const token = await getAccessToken(config);

  const response = await fetch(SHEETS_API + "/" + config.spreadsheetId + path, {
    ...init,
    headers: {
      ...init.headers,
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    // A 403 here is almost always the sheet not being shared with the service
    // account — say so rather than making someone read raw JSON.
    const hint =
      response.status === 403
        ? " Is the sheet shared with " + config.clientEmail + " as an Editor?"
        : "";
    throw new Error(
      ("Sheets API " + response.status + " on " + path + "." + hint + " " + detail).trim(),
    );
  }

  return response.json().catch(() => ({}));
}

/**
 * Appends one row. `valueInputOption=RAW` matters: client names are user
 * input, and USER_ENTERED would evaluate a name starting with "=" as a
 * formula inside our own log.
 */
export async function appendAuditRow(row: AuditRow): Promise<void> {
  const config = requireConfig();
  const range = encodeURIComponent(config.tabName + "!A1");

  await sheetsFetch(
    "/values/" + range + ":append?valueInputOption=RAW&insertDataOption=INSERT_ROWS",
    {
      method: "POST",
      body: JSON.stringify({ values: [toRow(row)] }),
      config,
    },
  );
}

/**
 * Append-and-forget. Writes are best-effort by design: there is no retry
 * queue, so a failed append is lost and only shows up in the server log.
 * Logging must never be able to break a proposal export.
 */
export async function safeAppendAuditRow(row: AuditRow): Promise<boolean> {
  if (!isAuditConfigured()) return false;

  try {
    await appendAuditRow(row);
    return true;
  } catch (error) {
    console.warn(
      "[audit] append failed:",
      error instanceof Error ? error.message : error,
    );
    return false;
  }
}

// ---------------------------------------------------------------------------
// Reading — used by the dashboard at /dashboard.
// ---------------------------------------------------------------------------

/** Spreadsheet column letter for a 1-based index: 1 -> A, 27 -> AA. */
function columnLetter(index: number): string {
  let letters = "";
  let remaining = index;

  while (remaining > 0) {
    const remainder = (remaining - 1) % 26;
    letters = String.fromCharCode(65 + remainder) + letters;
    remaining = Math.floor((remaining - remainder - 1) / 26);
  }

  return letters;
}

const KNOWN_COLUMNS = new Set<string>(AUDIT_COLUMNS);

/**
 * Maps the sheet's header row onto schema columns by name, so a column
 * inserted by hand shifts nothing. Falls back to schema order if row 1 doesn't
 * look like a header at all — a sheet that never had `npm run audit:init` run
 * against it still reads correctly.
 */
function mapHeader(header: string[]): (AuditColumn | null)[] {
  const mapped = header.map((cell) => {
    const name = cell.trim();
    return KNOWN_COLUMNS.has(name) ? (name as AuditColumn) : null;
  });

  return mapped.some(Boolean) ? mapped : [...AUDIT_COLUMNS];
}

/**
 * Reads the whole log. The dashboard aggregates in memory rather than pushing
 * work into the sheet: the volume here is a few thousand rows, and keeping the
 * maths in TypeScript means the metric definitions live next to the schema
 * instead of in cell formulas nobody can review.
 *
 * `no-store` because a dashboard showing a cached snapshot of a live log is
 * worse than useless.
 */
export async function readAuditRows(): Promise<AuditRow[]> {
  const config = requireConfig();
  const range = encodeURIComponent(
    config.tabName + "!A:" + columnLetter(AUDIT_COLUMNS.length),
  );

  const body = (await sheetsFetch(
    "/values/" + range + "?majorDimension=ROWS&valueRenderOption=UNFORMATTED_VALUE",
    { method: "GET", config, cache: "no-store" },
  )) as { values?: (string | number | boolean)[][] };

  const values = body.values ?? [];
  // Header only, or an untouched sheet.
  if (values.length < 2) return [];

  const columns = mapHeader(values[0].map((cell) => String(cell ?? "")));

  return values.slice(1).map((cells) => {
    const row: AuditRow = {};

    columns.forEach((column, index) => {
      if (!column) return;
      const cell = cells[index];
      if (cell === undefined || cell === null || cell === "") return;
      row[column] = typeof cell === "number" ? cell : String(cell);
    });

    return row;
  });
}

// ---------------------------------------------------------------------------
// One-time setup — used by scripts/init-audit-sheet.mts, not at runtime.
// ---------------------------------------------------------------------------

type SheetProperties = {
  sheetId: number;
  title: string;
  gridProperties?: { columnCount?: number; rowCount?: number };
};

async function getTabProperties(config: AuditConfig): Promise<SheetProperties> {
  const body = (await sheetsFetch(
    "?fields=sheets(properties(sheetId,title,gridProperties))",
    { method: "GET", config },
  )) as { sheets?: { properties?: SheetProperties }[] };

  const tab = body.sheets
    ?.map((sheet) => sheet.properties)
    .find((properties) => properties?.title === config.tabName);

  if (!tab) {
    const found =
      body.sheets
        ?.map((sheet) => sheet.properties?.title)
        .filter(Boolean)
        .join(", ") || "none";
    throw new Error(
      'No tab named "' + config.tabName + '" in the spreadsheet. Found: ' +
        found + ". Rename the tab, or set AUDIT_SHEET_TAB to match.",
    );
  }

  return tab;
}

/**
 * A new sheet is 26 columns wide and the schema needs more. Rows grow on
 * append by themselves; columns do not.
 */
export async function prepareSheet(): Promise<{
  tabName: string;
  columnsAdded: number;
}> {
  const config = requireConfig();
  const tab = await getTabProperties(config);
  const existingColumns = tab.gridProperties?.columnCount ?? 0;
  const columnsAdded = Math.max(0, AUDIT_COLUMNS.length - existingColumns);

  const requests: unknown[] = [];

  if (columnsAdded > 0) {
    requests.push({
      appendDimension: {
        sheetId: tab.sheetId,
        dimension: "COLUMNS",
        length: columnsAdded,
      },
    });
  }

  requests.push({
    updateSheetProperties: {
      properties: {
        sheetId: tab.sheetId,
        gridProperties: { frozenRowCount: 1 },
      },
      fields: "gridProperties.frozenRowCount",
    },
  });

  await sheetsFetch(":batchUpdate", {
    method: "POST",
    body: JSON.stringify({ requests }),
    config,
  });

  return { tabName: config.tabName, columnsAdded };
}

/** Overwrites row 1 with the column names, in schema order. */
export async function writeHeaderRow(): Promise<void> {
  const config = requireConfig();
  const range = encodeURIComponent(config.tabName + "!A1");

  await sheetsFetch("/values/" + range + "?valueInputOption=RAW", {
    method: "PUT",
    body: JSON.stringify({ values: [[...AUDIT_COLUMNS]] }),
    config,
  });
}
