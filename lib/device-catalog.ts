/**
 * Hardware catalogue for the biometric device proposal — the quotation
 * equivalent of module-highlights.ts, and offered the same way: a rep picks a
 * preset instead of retyping brand/model/price, then edits whatever differs.
 *
 * Every entry below is transcribed from the quotation Shomvob actually sent
 * (public/resources/Proposal_For_Fingerprint_Device.pdf). Nothing here is
 * invented: a preset carries a real brand, a real model number, and the price
 * that proposal quoted. Adding a device we have not actually quoted — or
 * guessing at a price to make the list look fuller — would put fabricated
 * commercial terms in front of a client, so new entries belong here only once
 * a real quotation has used them.
 *
 * Prices are a starting point, not a price list. They are the last quoted
 * figure and every one of them is editable in the builder, because hardware
 * cost moves between quotations.
 */

export interface DevicePresetItem {
  id: string;
  description: string;
  /** "N/A" for a service line, matching how the source quotation renders it. */
  brand: string;
  modelNo: string;
  /** Unit of measure. "Nos." throughout the source quotation. */
  uom: string;
  /** Last quoted unit price in BDT — editable per proposal. */
  unitPrice: number;
}

export const DEFAULT_UOM = "Nos.";

export const DEVICE_PRESETS: DevicePresetItem[] = [
  {
    id: "zkteco-sanseface-2a",
    description: "Biometric Access Control (Face, Finger and Card)",
    brand: "ZKTeco",
    modelNo: "SanseFace 2A",
    uom: DEFAULT_UOM,
    unitPrice: 12_000,
  },
  {
    id: "nexakey-nx-123x",
    description: "12V 3A Adapter For EM Lock",
    brand: "NexaKey",
    modelNo: "NX-123X",
    uom: DEFAULT_UOM,
    unitPrice: 600,
  },
  {
    id: "installation-testing",
    description: "Installation & Testing (Excluding Civil Work)",
    brand: "N/A",
    modelNo: "N/A",
    uom: DEFAULT_UOM,
    unitPrice: 3_000,
  },
];

export function findPreset(id: string): DevicePresetItem | undefined {
  return DEVICE_PRESETS.find((preset) => preset.id === id);
}
