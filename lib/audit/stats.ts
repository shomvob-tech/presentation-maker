/**
 * Read-time metrics for the usage log.
 *
 * The log itself stays capture-only (see notes-plans/audit-log.md): nothing
 * here is written back, and nothing here needs to be. Every figure the
 * dashboard shows is derived from rows exactly as they come out of the sheet,
 * so a metric definition can be changed by editing this file and reloading.
 *
 * Three rules from that document are load-bearing here:
 *
 *  1. `draft_id` is the unit of aggregation. Counting rows would multiply one
 *     document by however many times it was previewed.
 *  2. There is no identity in the log. `device_id` is a browser, so the only
 *     thing computed from it is a distinct count, labelled as browsers.
 *  3. `export_clicked` on the print path means *the dialog opened*, not that a
 *     file was saved. The naming here says "exports started" for that reason.
 *
 * This file knows nothing about Google Sheets.
 */

import type { AuditColumn, AuditDocType, AuditRow } from "./events";

export type Tally = { label: string; count: number };

/** A count split by product, since both share one tab. */
export type DocSplit = { proposal: number; sla: number; total: number };

export type NumberSummary = {
  samples: number;
  mean: number;
  median: number;
  min: number;
  max: number;
};

export type ModuleStats = {
  /** Documents this is drawn from — drafts with at least one preview. */
  documents: number;
  selected: Tally[];
  added: Tally[];
  removed: Tally[];
  perDocument: NumberSummary | null;
};

export type AuditStats = {
  rowCount: number;
  draftCount: number;
  /** Browsers, not people. See limit 1 in notes-plans/audit-log.md. */
  distinctBrowsers: number;
  firstEventAt: string | null;
  lastEventAt: string | null;
  eventCounts: Tally[];

  /** Distinct drafts that reached each stage. */
  touched: DocSplit;
  started: DocSplit;
  exportsStarted: DocSplit;
  abandoned: DocSplit;

  previewsBeforeExport: NumberSummary | null;
  previewDistribution: Tally[];

  retypedFields: Tally[];
  stuckFields: Tally[];

  modules: { proposal: ModuleStats; sla: ModuleStats };
  optionalSections: { proposal: Tally[]; sla: Tally[] };

  recommender: { compared: number; exactMatches: number; meanOverlap: number };

  exportOutcomes: Tally[];
  exportDurationMs: NumberSummary | null;
  pageCount: NumberSummary | null;
  /** API exports with no matching `export_result` — the timeout signature. */
  suspectedTimeouts: number;

  activeEffortMs: NumberSummary | null;
  mrcFee: NumberSummary | null;
};

// ---------------------------------------------------------------------------
// Cell readers. Every column can be blank; none of these may throw.
// ---------------------------------------------------------------------------

function text(row: AuditRow, column: AuditColumn): string {
  const value = row[column];
  return value === undefined || value === null ? "" : String(value).trim();
}

function num(row: AuditRow, column: AuditColumn): number | null {
  const value = row[column];
  if (value === undefined || value === null || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/** List columns are written as ", "-joined strings by the client. */
function list(row: AuditRow, column: AuditColumn): string[] {
  return text(row, column)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function docTypeOf(row: AuditRow): AuditDocType | null {
  const value = text(row, "doc_type");
  return value === "proposal" || value === "sla" ? value : null;
}

// ---------------------------------------------------------------------------
// Small aggregation helpers.
// ---------------------------------------------------------------------------

function bump(counts: Map<string, number>, key: string): void {
  counts.set(key, (counts.get(key) ?? 0) + 1);
}

function toTally(counts: Map<string, number>, limit?: number): Tally[] {
  const sorted = [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

  return limit === undefined ? sorted : sorted.slice(0, limit);
}

function summarize(values: number[]): NumberSummary | null {
  if (values.length === 0) return null;

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  return {
    samples: sorted.length,
    mean: sorted.reduce((total, value) => total + value, 0) / sorted.length,
    median:
      sorted.length % 2 === 1
        ? sorted[middle]
        : (sorted[middle - 1] + sorted[middle]) / 2,
    min: sorted[0],
    max: sorted[sorted.length - 1],
  };
}

function split(drafts: Draft[], predicate: (draft: Draft) => boolean): DocSplit {
  const matching = drafts.filter(predicate);
  const proposal = matching.filter((d) => d.docType === "proposal").length;
  const sla = matching.filter((d) => d.docType === "sla").length;
  return { proposal, sla, total: matching.length };
}

// ---------------------------------------------------------------------------
// Per-draft rollup — one entry per document.
// ---------------------------------------------------------------------------

type Draft = {
  docType: AuditDocType;
  events: Set<string>;
  /** Highest `preview_count` seen on an export_clicked row for this draft. */
  previewsAtExport: number | null;
  exportMethods: Set<string>;
  /** last_input_at − first_input_at on the export row, in ms. */
  activeMs: number | null;
  mrcFee: number | null;
  /**
   * The last `previewed` row. Used wherever the question is "what did this
   * document end up containing" — modules, optional sections — because a draft
   * previewed five times contributes five rows and only the final one
   * describes the document that was exported.
   */
  lastPreview: AuditRow | null;
};

function buildDrafts(rows: AuditRow[]): Map<string, Draft> {
  const drafts = new Map<string, Draft>();

  for (const row of rows) {
    const draftId = text(row, "draft_id");
    const docType = docTypeOf(row);
    if (!draftId || !docType) continue;

    const draft: Draft = drafts.get(draftId) ?? {
      docType,
      events: new Set<string>(),
      previewsAtExport: null,
      exportMethods: new Set<string>(),
      activeMs: null,
      mrcFee: null,
      lastPreview: null,
    };

    const event = text(row, "event");
    draft.events.add(event);

    const fee = num(row, "mrc_fee");
    if (fee !== null) draft.mrcFee = fee;

    if (event === "previewed") {
      draft.lastPreview = row;
    }

    if (event === "export_clicked") {
      const method = text(row, "export_method");
      if (method) draft.exportMethods.add(method);

      // Running total for the draft, so the largest is the one that counts.
      const previews = num(row, "preview_count");
      if (previews !== null) {
        draft.previewsAtExport = Math.max(draft.previewsAtExport ?? 0, previews);
      }

      const activeMs = spanMs(text(row, "first_input_at"), text(row, "last_input_at"));
      if (activeMs !== null) draft.activeMs = activeMs;
    }

    drafts.set(draftId, draft);
  }

  return drafts;
}

/** Milliseconds between two ISO timestamps, or null if either is unusable. */
function spanMs(from: string, to: string): number | null {
  if (!from || !to) return null;
  const start = Date.parse(from);
  const end = Date.parse(to);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return null;
  return end - start;
}

// ---------------------------------------------------------------------------
// Module / optional-section stats, computed per document.
// ---------------------------------------------------------------------------

function moduleStats(drafts: Draft[]): ModuleStats {
  const selected = new Map<string, number>();
  const added = new Map<string, number>();
  const removed = new Map<string, number>();
  const counts: number[] = [];
  let documents = 0;

  for (const draft of drafts) {
    const row = draft.lastPreview;
    if (!row) continue;

    documents += 1;
    for (const id of list(row, "modules")) bump(selected, id);
    for (const id of list(row, "modules_added_vs_default")) bump(added, id);
    for (const id of list(row, "modules_removed_vs_default")) bump(removed, id);

    const count = num(row, "module_count");
    if (count !== null) counts.push(count);
  }

  return {
    documents,
    selected: toTally(selected),
    added: toTally(added),
    removed: toTally(removed),
    perDocument: summarize(counts),
  };
}

function optionalSectionStats(drafts: Draft[]): Tally[] {
  const counts = new Map<string, number>();

  for (const draft of drafts) {
    if (!draft.lastPreview) continue;
    for (const section of list(draft.lastPreview, "optional_sections")) {
      bump(counts, section);
    }
  }

  return toTally(counts);
}

/**
 * How often the existing recommender would have picked what the rep actually
 * picked. Proposals only — SLAs carry no `recommended_modules`. Overlap is
 * Jaccard (shared ÷ combined), so a recommender that gets four of five right
 * scores 0.8 rather than 0.
 */
function recommenderAgreement(drafts: Draft[]): {
  compared: number;
  exactMatches: number;
  meanOverlap: number;
} {
  let compared = 0;
  let exactMatches = 0;
  let overlapTotal = 0;

  for (const draft of drafts) {
    const row = draft.lastPreview;
    if (!row) continue;

    const recommended = new Set(list(row, "recommended_modules"));
    if (recommended.size === 0) continue;

    const chosen = new Set(list(row, "modules"));
    compared += 1;

    const shared = [...chosen].filter((id) => recommended.has(id)).length;
    const combined = new Set([...chosen, ...recommended]).size;

    if (shared === chosen.size && shared === recommended.size) exactMatches += 1;
    overlapTotal += combined === 0 ? 0 : shared / combined;
  }

  return {
    compared,
    exactMatches,
    meanOverlap: compared === 0 ? 0 : overlapTotal / compared,
  };
}

// ---------------------------------------------------------------------------
// Entry points.
// ---------------------------------------------------------------------------

/**
 * Keeps rows from the last `days` days by `ts_utc`. A row with an unreadable
 * timestamp is kept: dropping it would silently shrink the totals, and a bad
 * timestamp is a logging bug rather than a reason to lose the event.
 */
export function filterByDays(rows: AuditRow[], days: number | null): AuditRow[] {
  if (days === null || !Number.isFinite(days) || days <= 0) return rows;

  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

  return rows.filter((row) => {
    const at = Date.parse(text(row, "ts_utc"));
    return !Number.isFinite(at) || at >= cutoff;
  });
}

export function computeStats(rows: AuditRow[]): AuditStats {
  const drafts = [...buildDrafts(rows).values()];
  const proposals = drafts.filter((draft) => draft.docType === "proposal");
  const slas = drafts.filter((draft) => draft.docType === "sla");

  const eventCounts = new Map<string, number>();
  const browsers = new Set<string>();
  const retypedFields = new Map<string, number>();
  const stuckFields = new Map<string, number>();
  const exportOutcomes = new Map<string, number>();
  const exportDurations: number[] = [];
  const pageCounts: number[] = [];

  let firstEventAt: string | null = null;
  let lastEventAt: string | null = null;

  for (const row of rows) {
    const event = text(row, "event");
    if (event) bump(eventCounts, event);

    const device = text(row, "device_id");
    if (device) browsers.add(device);

    const timestamp = text(row, "ts_utc");
    if (timestamp) {
      if (firstEventAt === null || timestamp < firstEventAt) firstEventAt = timestamp;
      if (lastEventAt === null || timestamp > lastEventAt) lastEventAt = timestamp;
    }

    // Only previews after the first can have a diff — the first has nothing to
    // compare against and always writes an empty cell.
    if (event === "previewed") {
      for (const field of list(row, "fields_changed_since_last_preview")) {
        bump(retypedFields, field);
      }
    }

    if (event === "validation_failed") {
      for (const field of list(row, "validation_failed_fields")) {
        bump(stuckFields, field);
      }
    }

    if (event === "export_result") {
      const outcome = text(row, "export_result");
      // Distinct error strings would make a table of one-row entries; group
      // them so the failure rate is readable, and keep the specific messages
      // visible by leaving successes and known outcomes intact.
      bump(exportOutcomes, outcome.startsWith("error:") ? "error" : outcome || "(blank)");

      const duration = num(row, "export_ms");
      if (duration !== null) exportDurations.push(duration);

      const pages = num(row, "page_count");
      if (pages !== null) pageCounts.push(pages);
    }
  }

  const previewsBeforeExport = drafts
    .map((draft) => draft.previewsAtExport)
    .filter((value): value is number => value !== null);

  const previewDistribution = new Map<string, number>();
  for (const previews of previewsBeforeExport) {
    bump(previewDistribution, String(previews));
  }

  return {
    rowCount: rows.length,
    draftCount: drafts.length,
    distinctBrowsers: browsers.size,
    firstEventAt,
    lastEventAt,
    eventCounts: toTally(eventCounts),

    touched: split(drafts, (draft) => draft.events.has("form_touched")),
    started: split(drafts, (draft) => draft.events.has("previewed")),
    exportsStarted: split(drafts, (draft) => draft.events.has("export_clicked")),
    // Inferred at read time on purpose — nothing tries to detect the tab
    // closing, because unload events are unreliable.
    abandoned: split(
      drafts,
      (draft) => draft.events.has("form_touched") && !draft.events.has("previewed"),
    ),

    previewsBeforeExport: summarize(previewsBeforeExport),
    previewDistribution: [...previewDistribution.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => Number(a.label) - Number(b.label)),

    retypedFields: toTally(retypedFields),
    stuckFields: toTally(stuckFields),

    modules: { proposal: moduleStats(proposals), sla: moduleStats(slas) },
    optionalSections: {
      proposal: optionalSectionStats(proposals),
      sla: optionalSectionStats(slas),
    },

    recommender: recommenderAgreement(proposals),

    exportOutcomes: toTally(exportOutcomes),
    exportDurationMs: summarize(exportDurations),
    pageCount: summarize(pageCounts),
    // A killed function never writes its row, so an API export with no result
    // is the only visible trace of a hard timeout.
    suspectedTimeouts: drafts.filter(
      (draft) =>
        draft.exportMethods.has("api") && !draft.events.has("export_result"),
    ).length,

    activeEffortMs: summarize(
      drafts
        .map((draft) => draft.activeMs)
        .filter((value): value is number => value !== null),
    ),
    mrcFee: summarize(
      drafts
        .filter((draft) => draft.events.has("export_clicked"))
        .map((draft) => draft.mrcFee)
        .filter((value): value is number => value !== null),
    ),
  };
}
