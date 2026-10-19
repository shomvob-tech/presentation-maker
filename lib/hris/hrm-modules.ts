/**
 * HRM module ids (what HRIS sends in `selectedModules`) and the builder
 * highlight cards each one renders as. Source: notes-plans/module_id.txt.
 *
 * HRM sells modules as packages, so ids are coarser than the builder's: `core`
 * is a bundle of several builder modules. The HRIS path never renders a
 * builder module HRM doesn't sell (roster, device-integration,
 * access-configuration, ewa), and validation never consults the public
 * builder's SELECTABLE_MODULES.
 *
 * Relative imports only, so scripts can load this without path aliases.
 */

import { MODULE_HIGHLIGHTS } from "../module-highlights";

export const HRM_MODULE_IDS = [
  "core",
  "payroll",
  "expense_management",
  "asset_management",
  "document_management",
  "visit_management",
  "employee_tracking",
] as const;

export type HrmModuleId = (typeof HRM_MODULE_IDS)[number];

export type HrmModule = {
  id: HrmModuleId;
  label: string;
  /** Metadata only: the commercial page shows one MRC total from `mrcFee`. */
  pricingBasis: "per_employee_month" | "flat_month";
  /** Builder highlight ids rendered for this module, in card order. */
  builderIds: readonly string[];
};

/** Package order. Rendering always follows this order. */
export const HRM_MODULES: readonly HrmModule[] = [
  {
    id: "core",
    label: "Core HRIS bundle",
    pricingBasis: "per_employee_month",
    // Reimbursement Management is also part of core but has no copy yet; it
    // joins this list in the Reimbursement PR (plan §7.5).
    builderIds: [
      "employee-management",
      "leave",
      "attendance",
      "policy-management",
      "announcements",
    ],
  },
  { id: "payroll", label: "Payroll", pricingBasis: "per_employee_month", builderIds: ["payroll"] },
  {
    id: "expense_management",
    label: "Expense Management",
    pricingBasis: "per_employee_month",
    builderIds: ["expense-management"],
  },
  { id: "asset_management", label: "Assets", pricingBasis: "per_employee_month", builderIds: ["assets"] },
  {
    id: "document_management",
    label: "Document Management",
    pricingBasis: "flat_month",
    builderIds: ["document-management"],
  },
  {
    id: "visit_management",
    label: "Visit Management",
    pricingBasis: "per_employee_month",
    builderIds: ["visit-management"],
  },
  {
    id: "employee_tracking",
    label: "Employee Tracking",
    pricingBasis: "per_employee_month",
    builderIds: ["employee-tracking"],
  },
];

const VALID_IDS = new Set<string>(HRM_MODULE_IDS);

/**
 * Strict: a non-empty array of the 7 ids, `core` included, no duplicates.
 * Any order is accepted; the result is always package order so the same
 * selection always renders the same PDF.
 */
export function validateHrmModules(
  value: unknown,
): { ok: true; value: HrmModuleId[] } | { ok: false; message: string } {
  if (
    !Array.isArray(value) ||
    value.length === 0 ||
    value.some((id) => typeof id !== "string")
  ) {
    return { ok: false, message: "selectedModules must be a non-empty array of module ids" };
  }

  const ids = value as string[];
  const unknown = ids.filter((id) => !VALID_IDS.has(id));
  if (unknown.length > 0) {
    return {
      ok: false,
      message: `Unknown module id(s): ${unknown.join(", ")}. Valid ids: ${HRM_MODULE_IDS.join(", ")}`,
    };
  }

  const duplicates = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
  if (duplicates.length > 0) {
    return { ok: false, message: `Duplicate module id(s): ${duplicates.join(", ")}` };
  }

  if (!ids.includes("core")) {
    return { ok: false, message: 'selectedModules must include "core"' };
  }

  return { ok: true, value: HRM_MODULE_IDS.filter((id) => ids.includes(id)) };
}

/** Builder highlight ids to render, deduped, in package then card order. */
export function expandHrmModules(ids: readonly HrmModuleId[]): string[] {
  const builderIds = HRM_MODULES.filter((module) => ids.includes(module.id)).flatMap(
    (module) => module.builderIds,
  );
  return [...new Set(builderIds)];
}

/** Every builder id the HRIS path can render — for the content guard in tests. */
export function allHrmBuilderIds(): string[] {
  return expandHrmModules(HRM_MODULE_IDS);
}

/** True when every rendered card has copy (the guard test asserts this). */
export function hrmBuilderIdsWithoutCopy(): string[] {
  const known = new Set(MODULE_HIGHLIGHTS.map((module) => module.id));
  return allHrmBuilderIds().filter((id) => !known.has(id));
}
