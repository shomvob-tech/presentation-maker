/**
 * Quotation arithmetic for the biometric device proposal.
 *
 * Kept apart from the storage module (device-session.ts) for the same reason
 * sla-fees.ts is kept apart from sla-session.ts: the builder form, the
 * quotation page, and the audit payload all need the same totals, and a
 * component recomputing them inline is how a preview and an exported PDF end
 * up disagreeing about the grand total.
 *
 * `formatQuoteAmount` deliberately does NOT reuse `formatBdt` from
 * sla-fees.ts. That one appends " BDT" and drops the decimals on a whole
 * number, which is right for a prose fee line and wrong for a price column —
 * the source quotation prints a bare, always-2-decimal figure under a header
 * that already says the currency once.
 */

import type { DeviceLineItem } from "./device-session";

export function lineTotal(item: Pick<DeviceLineItem, "quantity" | "unitPrice">): number {
  const { quantity, unitPrice } = item;
  if (!Number.isFinite(quantity) || !Number.isFinite(unitPrice)) return 0;
  return quantity * unitPrice;
}

export function subTotal(items: DeviceLineItem[]): number {
  return items.reduce((total, item) => total + lineTotal(item), 0);
}

export function vatAmount(items: DeviceLineItem[], vatPercent: number): number {
  if (!Number.isFinite(vatPercent) || vatPercent <= 0) return 0;
  return (subTotal(items) * vatPercent) / 100;
}

/**
 * Sub-total plus VAT. At 0% this equals the sub-total, which is what the
 * source quotation shows: a TOTAL and a GRAND TOTAL of the same figure under
 * an "Excluding VAT & AIT" note.
 */
export function grandTotal(items: DeviceLineItem[], vatPercent: number): number {
  return subTotal(items) + vatAmount(items, vatPercent);
}

/** "12,000.00" — grouped, always two decimals, no currency suffix. */
export function formatQuoteAmount(amount: number): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safe);
}
