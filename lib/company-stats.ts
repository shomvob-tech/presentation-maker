/**
 * Company-wide credibility stats used across proposal pages (cover strip,
 * COO letter opening, etc.). Single source of truth — do not hardcode these
 * values in page components.
 */
export const COMPANY_STATS = {
  organizationsServed: "100+",
  foundedYear: 2024,
  platformAvailability: "98%+",
  yearsExperience: "4+",
  payrollOnTime: "100%",
} as const;
