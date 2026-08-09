/**
 * Module highlights — single source of truth for:
 *  1. The checkbox labels in Clientdetails2.tsx's module selection
 *  2. The bullet content the (deferred) Section 3A page component will render
 *
 * Content is hardcoded and finalized, inspired by notes-plans/module_list.md
 * but written in client-facing language rather than copied verbatim from the
 * feature export. Update bullets here — nowhere else should duplicate them.
 *
 * "Core" platform features (dashboard, approval flow, notifications, org
 * structure) are intentionally NOT a selectable module — they're baseline
 * capabilities every client gets regardless of selection. Org structure and
 * device integration are broken out below as their own selectable items
 * instead, matching how earlier proposals (Terraprime, Taza) treated them.
 */

export interface ModuleHighlight {
    id: string;
    label: string;
    bullets: [string, string, string, string];
  }
  
  export const MODULE_HIGHLIGHTS: ModuleHighlight[] = [
    {
      id: "employee-management",
      label: "Employee Management",
      bullets: [
        "Central employee directory with full profile history",
        "Bulk upload for onboarding new hires in one pass",
        "Probation tracking with automatic confirmation alerts",
        "Department- and branch-scoped access for managers",
      ],
    },
    {
      id: "attendance",
      label: "Attendance",
      bullets: [
        "Daily attendance overview across the full team",
        "Forget-attendance & late-waiver requests, approved in one place",
        "Remote and work-from-home attendance tracked the same way",
        "Date-range & monthly reports, ready for payroll",
      ],
    },
    {
      id: "leave",
      label: "Leave Management",
      bullets: [
        "Configurable leave types & policies per employee group",
        "Holiday calendar and bonus leave configuration",
        "Approval center for managers, on web or mobile",
        "Leave history reports for every employee",
      ],
    },
    {
      id: "payroll",
      label: "Payroll",
      bullets: [
        "Payroll dashboard, drafts, and payslip history",
        "Bonus types, policies, and off-cycle bonus runs",
        "Attendance and leave feed directly into each cycle",
        "Outstanding salary tracked until it's paid",
      ],
    },
    {
      id: "roster",
      label: "Roster & Scheduling",
      bullets: [
        "Shift scheduling by team or department",
        "Capacity overview and capacity planning",
        "Working-hour patterns, time slots, and week setup",
        "Groups for floor, warehouse, or office staff",
      ],
    },
    {
      id: "device-integration",
      label: "Device Integration",
      bullets: [
        "Biometric face or fingerprint clock-in/out",
        "Automatic sync into the Attendance module",
        "No manual sign-in sheet or register involved",
        "Tamper-resistant attendance record",
      ],
    },
    {
      id: "access-configuration",
      label: "Access Configuration",
      bullets: [
        "Org structure — levels, business lines, locations",
        "Role-based approver templates & approval flow",
        "Company-wide settings and location-based access rules",
        "Control over who can approve what, and where",
      ],
    },
    {
      id: "ewa",
      label: "Earned Wage Access (EWA)",
      bullets: [
        "Employees access earned wages before payday",
        "Configurable limits per employee or policy",
        "Fully integrated with attendance and payroll records",
        "Available directly from the mobile app",
      ],
    },
    {
      id: "expense-management",
      label: "Expense Management",
      bullets: [
        "Expense submission with monthly summaries",
        "Approval center for manager sign-off",
        "Track requests from submission to reimbursement",
        "Mobile app access for on-the-go claims",
      ],
    },
    {
      id: "assets",
      label: "Asset Management",
      bullets: [
        "Central overview of all company assets",
        "Custom asset types for your equipment or inventory",
        "Assign and track assets per employee",
        "Mobile access for on-the-go checks",
      ],
    },
    {
      id: "document-management",
      label: "Document Management",
      bullets: [
        "Reusable templates for HR documents",
        "Configurable variables for fast document generation",
        "Consistent formatting across the organization",
        "One place for every generated document",
      ],
    },
    {
      id: "policy-management",
      label: "Policy Management",
      bullets: [
        "Central policy list, always up to date",
        "Create and publish new policies in minutes",
        "Mobile access so policies reach everyone",
        "Clear record of what's been published and when",
      ],
    },
    {
      id: "visit-management",
      label: "Visit Management",
      bullets: [
        "Configurable visit types for your workflows",
        "Simple visit creation and tracking",
        "Mobile app access for field-based teams",
        "A clear record of every visit logged",
      ],
    },
    {
      id: "announcements",
      label: "Announcements",
      bullets: [
        "Company-wide announcements in one place",
        "Simple creation and publishing workflow",
        "Delivered straight to the mobile app",
        "A running record of everything communicated",
      ],
    },
    {
      id: "employee-tracking",
      label: "Employee Tracking",
      bullets: [
        "Live location tracking for field staff",
        "Full tracking history, not just live status",
        "Daily and employee-level reports",
        "Configurable tracking settings per role",
      ],
    },
  ];