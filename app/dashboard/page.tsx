import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/audit/auth";
import { toDhakaTimestamp } from "@/lib/audit/events";
import { isAuditConfigured, readAuditRows } from "@/lib/audit/sheets";
import {
  computeStats,
  filterByDays,
  type AuditStats,
  type DocSplit,
  type NumberSummary,
  type Tally,
} from "@/lib/audit/stats";
import { logout } from "../login/actions";

export const metadata: Metadata = {
  title: "Usage log — dashboard",
  robots: { index: false, follow: false },
};

/** The Sheets read is the slow part; give it more than the default ceiling. */
export const maxDuration = 30;

const RANGES = [
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
  { label: "All time", days: null },
] as const;

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

function decimal(value: number, places = 1): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: places,
    maximumFractionDigits: places,
  });
}

function duration(ms: number): string {
  if (ms < 1000) return Math.round(ms) + " ms";
  if (ms < 60_000) return decimal(ms / 1000) + " s";

  const minutes = Math.floor(ms / 60_000);
  const seconds = Math.round((ms % 60_000) / 1000);
  return minutes + "m " + seconds + "s";
}

function timestamp(iso: string | null): string {
  if (!iso) return "—";
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? iso : toDhakaTimestamp(parsed);
}

/** "1 document", "3 documents" — the tables read badly without it. */
function plural(value: number, noun: string): string {
  return value + " " + noun + (value === 1 ? "" : "s");
}

function percent(part: number, whole: number): string {
  if (whole <= 0) return "—";
  return Math.round((part / whole) * 100) + "%";
}

// ---------------------------------------------------------------------------
// Presentational pieces
// ---------------------------------------------------------------------------

function Section({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        {note ? <p className="text-xs text-neutral-500">{note}</p> : null}
      </div>
      {children}
    </section>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded border border-neutral-200 p-3">
      <div className="text-xs uppercase tracking-wide text-neutral-500">
        {label}
      </div>
      <div className="text-2xl font-semibold tabular-nums">{value}</div>
      {hint ? <div className="text-xs text-neutral-500">{hint}</div> : null}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-neutral-500">{children}</p>;
}

function TallyTable({
  rows,
  head,
  total,
  limit,
  empty,
}: {
  rows: Tally[];
  head: string;
  /** When given, each count is also shown as a share of this. */
  total?: number;
  limit?: number;
  empty: string;
}) {
  if (rows.length === 0) return <Empty>{empty}</Empty>;

  const shown = limit === undefined ? rows : rows.slice(0, limit);

  return (
    <table className="w-full max-w-2xl border-collapse text-sm">
      <thead>
        <tr className="border-b border-neutral-300 text-left">
          <th className="py-1 pr-4 font-medium">{head}</th>
          <th className="py-1 pr-4 text-right font-medium">Count</th>
          {total === undefined ? null : (
            <th className="py-1 text-right font-medium">Share</th>
          )}
        </tr>
      </thead>
      <tbody>
        {shown.map((row) => (
          <tr key={row.label} className="border-b border-neutral-100">
            <td className="py-1 pr-4">{row.label}</td>
            <td className="py-1 pr-4 text-right tabular-nums">{row.count}</td>
            {total === undefined ? null : (
              <td className="py-1 text-right tabular-nums">
                {percent(row.count, total)}
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function SummaryLine({
  summary,
  format,
  empty,
  unit = "document",
}: {
  summary: NumberSummary | null;
  format: (value: number) => string;
  empty: string;
  /** What one sample is. Exports and documents are not the same count. */
  unit?: string;
}) {
  if (!summary) return <Empty>{empty}</Empty>;

  return (
    <p className="text-sm">
      median <strong>{format(summary.median)}</strong> · mean{" "}
      {format(summary.mean)} · min {format(summary.min)} · max{" "}
      {format(summary.max)}{" "}
      <span className="text-neutral-500">
        ({plural(summary.samples, unit)})
      </span>
    </p>
  );
}

function splitText(value: DocSplit): string {
  return (
    value.total +
    " (" +
    value.proposal +
    "P / " +
    value.sla +
    "S / " +
    value.device +
    "D / " +
    value.combined +
    "C / " +
    value.presentation +
    "Pr)"
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  // Checked here rather than in proxy.ts: this is the only page that needs it,
  // and a check next to the data can't be bypassed by a routing change.
  const session = await readSession();
  if (!session) redirect("/login");

  const { days: daysParam } = await searchParams;
  const parsedDays = Number(daysParam);
  const days =
    Number.isFinite(parsedDays) && parsedDays > 0 ? parsedDays : null;

  return (
    <div className="min-h-screen w-full bg-white text-neutral-900">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-8">
        <header className="flex flex-wrap items-baseline justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold">Usage log</h1>
            <p className="text-sm text-neutral-600">
              Proposal and SLA builders. Signed in as {session.username}.
            </p>
          </div>

          <div className="flex items-center gap-3 text-sm">
            {RANGES.map((range) => {
              const active = range.days === days;
              const href =
                range.days === null
                  ? "/dashboard"
                  : "/dashboard?days=" + range.days;

              return (
                <Link
                  key={range.label}
                  href={href}
                  className={
                    active
                      ? "font-semibold underline"
                      : "text-neutral-600 hover:underline"
                  }
                >
                  {range.label}
                </Link>
              );
            })}

            <form action={logout}>
              <button
                type="submit"
                className="text-neutral-600 hover:underline"
              >
                Sign out
              </button>
            </form>
          </div>
        </header>

        <Report days={days} />
      </main>
    </div>
  );
}

async function Report({ days }: { days: number | null }) {
  if (!isAuditConfigured()) {
    return (
      <p className="rounded border border-amber-300 bg-amber-50 p-3 text-sm">
        The usage log isn&apos;t configured on this deployment. Set{" "}
        <code>GOOGLE_SERVICE_ACCOUNT_EMAIL</code>,{" "}
        <code>GOOGLE_PRIVATE_KEY_B64</code> and <code>AUDIT_SHEET_ID</code> in{" "}
        <code>.env.local</code>, then reload.
      </p>
    );
  }

  let stats: AuditStats;
  try {
    stats = computeStats(filterByDays(await readAuditRows(), days));
  } catch (error) {
    // Almost always the sheet not being shared with the service account, and
    // that message already says so — show it rather than a blank page.
    return (
      <p className="rounded border border-red-300 bg-red-50 p-3 text-sm">
        Could not read the log:{" "}
        {error instanceof Error ? error.message : String(error)}
      </p>
    );
  }

  if (stats.rowCount === 0) {
    return <Empty>No events in this range.</Empty>;
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat
          label="Exports started"
          value={splitText(stats.exportsStarted)}
          hint="distinct drafts that hit Print or Download"
        />
        <Stat
          label="Drafts previewed"
          value={splitText(stats.started)}
          hint="distinct drafts that reached a preview"
        />
        <Stat
          label="Abandoned"
          value={splitText(stats.abandoned)}
          hint={
            "typed into, never previewed · " +
            percent(stats.abandoned.total, stats.touched.total) +
            " of drafts typed into"
          }
        />
        <Stat
          label="Distinct browsers"
          value={String(stats.distinctBrowsers)}
          hint="browsers, not people"
        />
      </div>

      <p className="text-xs text-neutral-500">
        {stats.rowCount} rows · {stats.draftCount} drafts ·{" "}
        {timestamp(stats.firstEventAt)} → {timestamp(stats.lastEventAt)}{" "}
        (Asia/Dhaka). P = proposal, S = SLA, D = device, C = combined HRIS + device,
        Pr = presentation.
      </p>

      <Section
        title="Edits before download"
        note="preview_count on the export row. Counts preview clicks, so it conflates real iteration with re-clicking a render that looked wrong."
      >
        <SummaryLine
          summary={stats.previewsBeforeExport}
          format={(value) => decimal(value) + " previews"}
          empty="No exports in this range."
        />
        <TallyTable
          rows={stats.previewDistribution}
          head="Previews before export"
          total={stats.exportsStarted.total}
          empty="No exports in this range."
        />
      </Section>

      <Section
        title="Fields people keep re-typing"
        note="Changed between one preview and the next. A field near the top of this list is one whose default is wrong."
      >
        <TallyTable
          rows={stats.retypedFields}
          head="Field"
          limit={15}
          empty="Nothing re-typed between previews yet."
        />
      </Section>

      <Section
        title="Where users get stuck"
        note="Fields named in validation_failed events."
      >
        <TallyTable
          rows={stats.stuckFields}
          head="Field"
          limit={15}
          empty="No validation failures in this range."
        />
      </Section>

      <Section
        title="Proposal modules"
        note={
          "From the last preview of each draft — a draft previewed five times still counts once. " +
          plural(stats.modules.proposal.documents, "document") +
          "."
        }
      >
        <SummaryLine
          summary={stats.modules.proposal.perDocument}
          format={(value) => decimal(value) + " modules"}
          empty="No proposal previews in this range."
        />
        <div className="grid gap-4 md:grid-cols-3">
          <TallyTable
            rows={stats.modules.proposal.selected}
            head="Selected"
            total={stats.modules.proposal.documents}
            limit={12}
            empty="—"
          />
          <TallyTable
            rows={stats.modules.proposal.added}
            head="Added vs default"
            total={stats.modules.proposal.documents}
            limit={12}
            empty="—"
          />
          <TallyTable
            rows={stats.modules.proposal.removed}
            head="Removed vs default"
            total={stats.modules.proposal.documents}
            limit={12}
            empty="—"
          />
        </div>
        <p className="text-xs text-neutral-500">
          Raw popularity is contaminated by the pre-selected default set. A
          module consistently <em>removed</em> should leave the default; one
          consistently <em>added</em> should join it.
        </p>
      </Section>

      <Section
        title="Would the recommender have been right?"
        note="recommended_modules vs what the rep actually picked, on proposals. Overlap is shared ÷ combined."
      >
        {stats.recommender.compared === 0 ? (
          <Empty>No previews carried a recommendation in this range.</Empty>
        ) : (
          <p className="text-sm">
            Exact match on{" "}
            <strong>
              {stats.recommender.exactMatches} of {stats.recommender.compared}
            </strong>{" "}
            documents (
            {percent(
              stats.recommender.exactMatches,
              stats.recommender.compared,
            )}
            ) · mean overlap {decimal(stats.recommender.meanOverlap * 100, 0)}%
          </p>
        )}
      </Section>

      <Section
        title="SLA features"
        note={plural(stats.modules.sla.documents, "document") + "."}
      >
        <TallyTable
          rows={stats.modules.sla.selected}
          head="Feature"
          total={stats.modules.sla.documents}
          limit={15}
          empty="No SLA previews in this range."
        />
      </Section>

      <Section
        title="Which parts of the form are dead"
        note="Optional sections a document actually used. A section near zero is a candidate for removal."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-medium">
              Proposal ({plural(stats.modules.proposal.documents, "document")})
            </h3>
            <TallyTable
              rows={stats.optionalSections.proposal}
              head="Section"
              total={stats.modules.proposal.documents}
              empty="No proposal previews in this range."
            />
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-medium">
              SLA ({plural(stats.modules.sla.documents, "document")})
            </h3>
            <TallyTable
              rows={stats.optionalSections.sla}
              head="Section"
              total={stats.modules.sla.documents}
              empty="No SLA previews in this range."
            />
          </div>
        </div>
      </Section>

      <Section
        title="Export failures and speed"
        note="Server-stamped export_result rows — the only place a render failure or slow export is visible. The user just sees a generic error."
      >
        <TallyTable
          rows={stats.exportOutcomes}
          head="Outcome"
          empty="No server-side exports in this range (proposals only reach the print path)."
        />
        <SummaryLine
          summary={stats.exportDurationMs}
          format={duration}
          unit="export"
          empty="No export timings in this range."
        />
        <SummaryLine
          summary={stats.pageCount}
          format={(value) => decimal(value, 0) + " pages"}
          unit="export"
          empty="No page counts in this range."
        />
        <p className="text-sm">
          Suspected timeouts: <strong>{stats.suspectedTimeouts}</strong>{" "}
          <span className="text-neutral-500">
            (API export clicked, no result row — a killed function never writes
            one)
          </span>
        </p>
      </Section>

      <Section
        title="Effort per document"
        note="last_input_at − first_input_at on the export row. A bound on active effort, not a measurement — and not wall-clock, because people leave the tab open."
      >
        <SummaryLine
          summary={stats.activeEffortMs}
          format={duration}
          empty="No exports with input timestamps in this range."
        />
      </Section>

      <Section title="Monthly fee on exported documents">
        <SummaryLine
          summary={stats.mrcFee}
          format={(value) => value.toLocaleString("en-US")}
          empty="No fees recorded in this range."
        />
      </Section>

      <Section title="Events">
        <TallyTable
          rows={stats.eventCounts}
          head="Event"
          total={stats.rowCount}
          empty="—"
        />
      </Section>

      <Section title="Read this before drawing conclusions">
        <ul className="max-w-3xl list-disc space-y-1 pl-5 text-sm text-neutral-700">
          <li>
            <strong>No identity.</strong> device_id is a browser: a shared
            machine merges two people, a cleared cache splits one. Nothing here
            is a per-person number.
          </li>
          <li>
            <strong>
              &ldquo;Exported&rdquo; is not &ldquo;downloaded.&rdquo;
            </strong>{" "}
            The print path calls window.print(), which opens an OS dialog and
            never reports whether the file was saved or the dialog cancelled.
          </li>
          <li>
            <strong>Proposals have no server-side outcome.</strong> Only{" "}
            <em>Print as PDF</em> is wired up on that form, so the failure and
            speed numbers above are effectively SLA-only.
          </li>
          <li>
            <strong>Writes are best-effort.</strong> Ad blockers, offline
            clients and quota errors drop events silently. Client-side rows
            undercount; server-side ones are the trustworthy half.
          </li>
          <li>
            <strong>Duplicates are possible</strong> from double-clicks. Drafts
            are deduplicated here, raw event counts are not.
          </li>
        </ul>
      </Section>
    </>
  );
}
