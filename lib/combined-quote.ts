/**
 * Quotation arithmetic for the combined HRIS + device proposal.
 *
 * The one thing this file exists to prevent: adding a monthly subscription to
 * a one-off hardware cost and printing the sum as a single price. The two
 * halves are kept apart all the way through — `recurringLines` / `oneTimeLines`
 * build them, `monthlyTotal` / `oneTimeTotal` total them separately, and the
 * only figure that combines the two is `firstInvoiceTotal`, which is labelled
 * as exactly what it is.
 *
 * Per-line maths and formatting come from device-quote.ts so the hardware rows
 * total identically here and in the standalone device quotation.
 *
 * All figures are ex-VAT. VAT is a terms clause in this format, not a table
 * row — see the note on `vatPercent` in combined-session.ts.
 */

import { lineTotal } from "./device-quote";
import type { CombinedProposalDetails } from "./combined-session";

/** A row of the combined commercial table, from either half. */
export type QuoteLine = {
  /** Stable React key. Hardware rows reuse their line-item id. */
  key: string;
  description: string;
  brand: string;
  modelNo: string;
  uom: string;
  quantity: number;
  unitPrice: number;
};

/** Printed in the brand/model columns for rows that have no hardware. */
const NOT_APPLICABLE = "—";

const SHOMVOB_BRAND = "Shomvob HR";

/**
 * The monthly half. The subscription is always present; field tracking only
 * when a per-employee fee was entered.
 *
 * Field tracking is expressed as quantity = headcount rather than a single
 * "Per User X BDT" cell, which is how the HRIS proposal prints it today. The
 * client gets the actual monthly figure instead of having to multiply.
 */
export function recurringLines(details: CombinedProposalDetails): QuoteLine[] {
  const lines: QuoteLine[] = [
    {
      key: "hris-subscription",
      description: `HRIS subscription — ${details.employeeCount} employees`,
      brand: SHOMVOB_BRAND,
      modelNo: NOT_APPLICABLE,
      uom: "Month",
      quantity: 1,
      unitPrice: details.mrcFee,
    },
  ];

  if (details.fieldTrackingFee !== undefined && details.fieldTrackingFee > 0) {
    lines.push({
      key: "field-tracking",
      description: "Field employee tracking",
      brand: SHOMVOB_BRAND,
      modelNo: NOT_APPLICABLE,
      uom: "User",
      quantity: details.employeeCount,
      unitPrice: details.fieldTrackingFee,
    });
  }

  return lines;
}

/** The one-time half: rollout charge if present, then the hardware. */
export function oneTimeLines(details: CombinedProposalDetails): QuoteLine[] {
  const lines: QuoteLine[] = [];

  if (details.rolloutCharge !== undefined && details.rolloutCharge > 0) {
    lines.push({
      key: "rollout-charge",
      description: "Software rollout, configuration & training",
      brand: SHOMVOB_BRAND,
      modelNo: NOT_APPLICABLE,
      uom: "Nos.",
      quantity: 1,
      unitPrice: details.rolloutCharge,
    });
  }

  for (const item of details.lineItems) {
    lines.push({
      key: item.id,
      description: item.description,
      brand: item.brand,
      modelNo: item.modelNo,
      uom: item.uom,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    });
  }

  return lines;
}

function sumLines(lines: QuoteLine[]): number {
  return lines.reduce((total, line) => total + lineTotal(line), 0);
}

/** What the client pays every month, ex-VAT. */
export function monthlyTotal(details: CombinedProposalDetails): number {
  return sumLines(recurringLines(details));
}

/** Hardware, installation and rollout — paid once, ex-VAT. */
export function oneTimeTotal(details: CombinedProposalDetails): number {
  return sumLines(oneTimeLines(details));
}

/**
 * Day one: everything one-time plus the first month's subscription. The only
 * place the two halves are added together, and the table labels it as such.
 */
export function firstInvoiceTotal(details: CombinedProposalDetails): number {
  return oneTimeTotal(details) + monthlyTotal(details);
}
