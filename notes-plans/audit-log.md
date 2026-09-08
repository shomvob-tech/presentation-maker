# Usage log (audit log)

Context document. Explains what the usage log captures and what each metric is
derived from. It does not document the wider proposal/SLA system.

## What it is

A capture-only event log for the proposal and SLA builders. Every meaningful
click appends one row to a Google Sheet. The objective is to understand **how
much the tool is used and where users hit friction** — not to attribute work to
individuals.

It is an **event log, not an audit log in the compliance sense**. There is no
retry queue: a failed write is lost and only appears in the server log. Good
enough for understanding usage; do not describe it as a complete record.

**Capture only.** Rates, averages, deal values and time-saved figures are
deliberately *not* computed at write time — those belong in sheet formulas or a
BI tool later. The two exceptions are `preview_count` and
`fields_changed_since_last_preview`, which exist only because they need prior
browser state that cannot be reconstructed from the log afterwards.

## Where the data goes

One Google Sheet, one tab (`events`), one row per event, append-only. Written
server-side with a service account; `valueInputOption=RAW` so a client name
beginning with `=` can never become a formula inside the log.

## Events

| Event | Fires when | Side |
|---|---|---|
| `builder_opened` | A builder form mounts | client |
| `form_touched` | First keystroke in a draft (once per draft) | client |
| `validation_failed` | Preview/export blocked by validation | client |
| `previewed` | "Preview Proposal" / SLA preview clicked | client |
| `export_clicked` | "Print as PDF" or "Download PDF" clicked | client |
| `export_result` | The PDF API route finished or failed | server |

`doc_type` is `proposal` or `sla` — both products share one tab.

## The three ids

- **`device_id`** — a random UUID per browser, in `localStorage`. Identifies a
  **browser, not a person**. Cleared storage, a new laptop, or an incognito
  window all produce a new id.
- **`session_id`** — one sitting; rolls over after 30 minutes idle.
- **`draft_id`** — one document. Minted when a builder form mounts (the form
  always mounts blank), and stable across every preview and export in that
  visit. **This is the unit of aggregation** — count distinct `draft_id`, never
  rows.

## Columns

```
event_id, ts_utc, ts_local, event, doc_type,
device_id, session_id, draft_id,
preview_count, first_input_at, last_input_at,
client_name, employee_count, mrc_fee,
module_count, modules, modules_added_vs_default, modules_removed_vs_default,
recommended_modules, optional_sections,
fields_changed_since_last_preview, validation_failed_fields,
export_method, export_result, export_ms, page_count,
user_agent, app_version, payload_json
```

Notes on specific columns:

- `ts_utc` is ISO-8601 UTC; `ts_local` is the same moment in Asia/Dhaka as
  sortable `YYYY-MM-DD HH:mm:ss`.
- `mrc_fee` holds the monthly fee for both products (`monthlyFee` on SLAs).
- `modules` holds module ids on proposals and feature labels on SLAs.
- `export_method` is `print` or `api`. `export_result` is `success`,
  `no_pages_found`, or `error: <message>`.
- `payload_json` is the full document snapshot, so new form fields land there
  instead of shifting columns. The problem statement's rich text is replaced by
  `problemStatementChars` — the markup is multi-kilobyte and has no analytical
  value.
- `app_version` is the deploy's short commit SHA, or `local`.

## What each metric derives from

**Proposals and SLAs built** — count distinct `draft_id` where
`event = 'export_clicked'`, split by `doc_type`. Counting rows instead would
multiply one document by however many times it was previewed. `previewed` gives
you drafts *started*, which is a different and also useful number — keep the two
clearly labelled.

**Edits before download** — read `preview_count` off the `export_clicked` row.
It is a running total for that draft, so no cross-row work is needed. It counts
preview clicks, which conflates real iteration with "the render looked wrong, I
clicked again" — directionally useful, not exact.

**Which fields people keep re-typing** — `fields_changed_since_last_preview` on
each `previewed` row after the first. Fields that appear on nearly every
proposal are ones whose **defaults are wrong**; this is the actionable version of
the edit count.

**Module selection rate** — `modules` and `module_count` on `previewed` rows.
Read `modules_added_vs_default` and `modules_removed_vs_default` alongside them:
the form pre-selects a default set, so raw popularity is contaminated. A module
that is consistently *removed* should leave the default; one consistently
*added* should join it. `recommended_modules` is what the existing recommender
would have picked — comparing it to `modules` says whether that recommender is
worth wiring into the form or deleting.

**Abandonment** — a `draft_id` with a `form_touched` row and no `previewed` row.
Inferred at read time on purpose; nothing tries to detect the tab closing,
because unload events are unreliable and would produce worse data.

**Where users get stuck** — `validation_failed_fields`, counted by field name.

**Which parts of the form are dead** — `optional_sections`, listing only the
optional sections a document actually used (rollout charge, field tracking,
problem statement, trial account, prepared-by, client logo; on SLAs: employee
tracking, one-time fee, extra signatories).

**Export failures and speed** — `export_result`, `export_ms`, `page_count` on
`export_result` rows. This is the only place a render failure or a slow export
is visible; the user just sees a generic error.

**Effort per document** — `first_input_at` and `last_input_at` on the export
row. Use the difference, **not** the gap between `builder_opened` and the
export: people leave the tab open, so wall-clock is heavily inflated by idle
time. This is a bound on active effort, not a measurement.

## Known limits — read before drawing conclusions

1. **No identity.** Deliberate. `preparedBy` was rejected as an identity source
   because reps legitimately leave it blank to get the default "Shomvob
   Technologies" cover. `device_id` is a browser, so a shared machine merges two
   people and a cleared cache splits one. Do not present per-person numbers.
2. **"Downloaded" is not observable on the print path.** The main export calls
   `window.print()`, which opens an OS dialog and never reports whether the user
   saved or cancelled. `export_clicked` means *the dialog was opened*. Label the
   headline metric accordingly.
3. **A hard Vercel timeout writes no row.** `export_result` is written after the
   response; a killed function never gets there. A timeout looks like an
   `export_clicked` with no matching `export_result` for that `draft_id` — which
   is itself the way to detect it.
4. **The proposal's "Download PDF" button is not wired to the UI.** Only *Print
   as PDF* is reachable, so proposals produce `export_method: 'print'` and no
   server-side `export_result`. SLAs have both buttons and get full coverage.
5. **Writes are best-effort.** Ad blockers, offline clients, and quota errors
   all silently drop events. Server-side rows (`export_result`) are the most
   trustworthy.
6. **Duplicate rows are possible** from double-clicks. Dedupe on `event_id` when
   it matters.

## The dashboard

`/dashboard`, behind `/login`. One hardcoded account (`admin`), because the
dashboard shows aggregate usage of an internal tool and the log it reads has no
identity in it anyway — there is nothing per-user to gate. The session is an
HMAC-signed httpOnly cookie, twelve hours.

Every figure on it is derived at read time in `lib/audit/stats.ts` from the
metric definitions above, so changing what a number means is an edit to that
file. The whole tab is read on each load and aggregated in memory: at a few
thousand rows that is cheaper than maintaining formulas nobody can review, and
it keeps the definitions next to the schema.

Two conventions the numbers depend on:

- Anything counting documents counts distinct `draft_id`, never rows.
- Anything describing *what a document contained* — modules, optional sections —
  reads the **last `previewed` row** for that draft. A draft previewed five
  times writes five rows and only the last one describes the document that got
  exported.

The known limits below are reproduced on the page itself, because a number
without them invites the wrong conclusion.

## Files

- `lib/audit/events.ts` — column order (single source of truth) and event types
- `lib/audit/client.ts` — browser side: the ids, counters, field diff
- `lib/audit/sheets.ts` — the only file that knows about Google Sheets
- `lib/audit/stats.ts` — read-time metrics; knows nothing about Sheets
- `lib/audit/auth.ts` — dashboard sign-in (server only: holds the password)
- `app/api/track/route.ts` — receives client events
- `app/login/` — sign-in form and its server actions
- `app/dashboard/page.tsx` — the dashboard
- `scripts/init-audit-sheet.mts` — one-time sheet setup (`npm run audit:init`)

Config lives in `.env.local` (gitignored): `GOOGLE_SERVICE_ACCOUNT_EMAIL`,
`GOOGLE_PRIVATE_KEY_B64`, `AUDIT_SHEET_ID`, `AUDIT_SHEET_TAB`. Optionally
`DASHBOARD_SESSION_SECRET` — without it the cookie is signed with a constant
in the source, which is no weaker than the hardcoded password it guards, but
set it in production anyway.
