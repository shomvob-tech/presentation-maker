/**
 * Event schema for the usage log.
 *
 * Every event is one row in a single Google Sheet tab. `AUDIT_COLUMNS` is the
 * only source of truth for column order — both the sheet writer and
 * scripts/init-audit-sheet.mts read it, so the header row and the rows beneath
 * it cannot drift apart.
 *
 * Rows use the column names as object keys (snake_case, unlike the rest of the
 * codebase) on purpose: it makes `toRow` a straight lookup with no mapping
 * table to keep in sync, and it means an unknown key sent by a client is
 * silently dropped rather than shifting every column after it.
 *
 * Deliberately NOT computed here: deal value, averages, rates. Those are
 * formulas in the sheet. The only two derived values we do store are
 * `preview_count` and `fields_changed_since_last_preview`, because both need
 * prior client state that can't be reconstructed from the log after the fact.
 */

export const AUDIT_COLUMNS = [
  // Identity of the event itself
  "event_id",
  "ts_utc",
  "ts_local",
  "event",
  "doc_type",

  // Who/where — a browser, not a person. See notes-plans/ discussion.
  "device_id",
  "session_id",
  "draft_id",

  // Effort signals
  "preview_count",
  "first_input_at",
  "last_input_at",

  // Document values
  "client_name",
  "employee_count",
  "mrc_fee",

  // Module / feature selection
  "module_count",
  "modules",
  "modules_added_vs_default",
  "modules_removed_vs_default",
  "recommended_modules",
  "optional_sections",

  // Friction signals
  "fields_changed_since_last_preview",
  "validation_failed_fields",

  // Export outcome (server-stamped for export_result)
  "export_method",
  "export_result",
  "export_ms",
  "page_count",

  // Environment
  "user_agent",
  "app_version",

  // Full snapshot — new form fields land here instead of shifting columns
  "payload_json",
] as const;

export type AuditColumn = (typeof AUDIT_COLUMNS)[number];

export type AuditEventName =
  | "builder_opened"
  | "form_touched"
  | "validation_failed"
  | "previewed"
  | "export_clicked"
  | "export_result";

export type AuditDocType = "proposal" | "sla" | "device";

/** A single sheet row. Missing columns are written as empty cells. */
export type AuditRow = Partial<Record<AuditColumn, string | number>>;

/**
 * What the browser sends to /api/track. The server stamps `ts_utc`,
 * `ts_local`, `user_agent`, and `app_version` itself so they can't be forged
 * and the client doesn't need to know the deployment.
 */
export type AuditClientPayload = AuditRow & {
  event: AuditEventName;
  doc_type: AuditDocType;
};

/** Google Sheets rejects cells over 50k characters. Truncate well short. */
export const MAX_CELL_CHARS = 45_000;

function clampCell(value: string | number): string | number {
  if (typeof value !== "string" || value.length <= MAX_CELL_CHARS) return value;
  return `${value.slice(0, MAX_CELL_CHARS)}…[truncated]`;
}

/** Flattens a row into sheet order. Unknown keys are dropped by construction. */
export function toRow(row: AuditRow): (string | number)[] {
  return AUDIT_COLUMNS.map((column) => {
    const value = row[column];
    return value === undefined || value === null ? "" : clampCell(value);
  });
}

const EVENT_NAMES = new Set<string>([
  "builder_opened",
  "form_touched",
  "validation_failed",
  "previewed",
  "export_clicked",
  "export_result",
]);

/**
 * Shape check for whatever arrives at /api/track. Intentionally permissive
 * about the optional columns — a bad value should cost us one odd cell, never
 * a dropped event.
 */
export function isAuditClientPayload(
  value: unknown,
): value is AuditClientPayload {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.event === "string" &&
    EVENT_NAMES.has(row.event) &&
    (row.doc_type === "proposal" ||
      row.doc_type === "sla" ||
      row.doc_type === "device")
  );
}

/** Sortable local time (Asia/Dhaka) for eyeballing the sheet: YYYY-MM-DD HH:mm:ss. */
export function toDhakaTimestamp(date: Date): string {
  return date
    .toLocaleString("sv-SE", { timeZone: "Asia/Dhaka" })
    .replace(",", "");
}
