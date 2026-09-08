import { after, type NextRequest } from "next/server";
import {
  isAuditClientPayload,
  toDhakaTimestamp,
  type AuditRow,
} from "@/lib/audit/events";
import { safeAppendAuditRow } from "@/lib/audit/sheets";

// node:crypto is used to sign the service-account JWT, so this cannot run on
// the Edge runtime.
export const runtime = "nodejs";

// The Sheets append happens in `after()`, off the response path. A short
// ceiling keeps a hung Google call from holding a function open.
export const maxDuration = 15;

/**
 * Big enough for a full proposal snapshot, small enough that this public
 * endpoint can't be used to fill the spreadsheet's cell budget.
 */
const MAX_BODY_CHARS = 32_000;

/** Columns the server owns — a client is not allowed to set these. */
const SERVER_OWNED = [
  "ts_utc",
  "ts_local",
  "user_agent",
  "app_version",
] as const;

function appVersion(): string {
  const sha = process.env.VERCEL_GIT_COMMIT_SHA;
  return sha ? sha.slice(0, 7) : "local";
}

/**
 * Receives one usage event and appends it to the log.
 *
 * Always answers 202, even for a payload it discards: the browser fires these
 * without awaiting them, and there is nothing useful it could do with an
 * error. Failures are the server's problem, visible in the server log.
 */
export async function POST(request: NextRequest) {
  const accepted = new Response(null, { status: 202 });

  // Same-origin only. A server-to-server caller sends no Origin header at all,
  // which is allowed; a browser on another site sends one that won't match.
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) return accepted;

  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return accepted;
  }

  if (raw.length > MAX_BODY_CHARS) return accepted;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return accepted;
  }

  if (!isAuditClientPayload(parsed)) return accepted;

  const submitted = { ...parsed } as Record<string, unknown>;
  for (const column of SERVER_OWNED) delete submitted[column];

  const now = new Date();
  const row: AuditRow = {
    ...(submitted as AuditRow),
    ts_utc: now.toISOString(),
    ts_local: toDhakaTimestamp(now),
    user_agent: request.headers.get("user-agent") ?? "",
    app_version: appVersion(),
  };

  after(() => safeAppendAuditRow(row));

  return accepted;
}
