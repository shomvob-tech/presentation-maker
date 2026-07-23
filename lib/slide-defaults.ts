import type { ModuleSlideDefaults, SlidePointContent } from "./presentation-content";
import { MODULE_SLIDE_MAP } from "./points-generator";

/** Module ids that currently have a dedicated slide component. */
export const MODULES_WITH_SLIDE_DEFAULTS = Object.keys(
  MODULE_SLIDE_MAP,
) as ModuleSlideDefaults["moduleId"][];

const employeeManagement: SlidePointContent[] = [
  {
    title: "Automated Probation Tracking & Alerts",
    description:
      "Every probation timeline is tracked automatically, with upcoming confirmation alerts so no employee falls through the cracks.",
  },
  {
    title: "One-Click Confirmation",
    description:
      "Promote an employee from probation to permanent in a single click, backed by performance-based confirmation.",
  },
  {
    title: "Department-Scoped Management Access",
    description:
      "HR and line/branch managers only see and manage employees within their own department or branch.",
  },
  {
    title: "Employment Increment Journey",
    description:
      "Raise, review, and approve salary or role increments through one structured, logged workflow.",
  },
];

const attendance: SlidePointContent[] = [
  {
    title: "One-Tap Check-In & Check-Out",
    description: "Fast, simple attendance from any location.",
  },
  {
    title: "GPS-Enabled Attendance",
    description: "Location-verified attendance for greater accuracy.",
  },
  {
    title: "Real-Time Attendance Recording",
    description: "Instant workforce visibility across the organization.",
  },
  {
    title: "Automated Payroll Integration",
    description: "Attendance seamlessly drives payroll calculations.",
  },
];

const leave: SlidePointContent[] = [
  {
    title: "Centralized Management",
    description: "Manage policies, requests, and approvals from one place.",
  },
  {
    title: "Automated Tracking",
    description: "Monitor balances, accruals, and leave usage automatically.",
  },
  {
    title: "Split Leave by Type",
    description:
      "For a 5-day approval, HR can assign 3 days as casual leave and the remaining 2 to another leave category.",
  },
  {
    title: "Holiday Calendar",
    description: "Use built-in public holidays for accurate leave planning.",
  },
  {
    title: "Employee Self-Service",
    description: "Employees can submit leave requests in a few simple steps.",
  },
  {
    title: "Real-Time Balance",
    description: "View available leave and request history instantly.",
  },
];

const payroll: SlidePointContent[] = [
  {
    title: "Late Deduction",
    description:
      "Automatically calculate late penalties from attendance records.",
  },
  {
    title: "Leave Deduction",
    description: "Apply policy-based deductions when paid leave is unavailable.",
  },
  {
    title: "Absent Deduction",
    description: "Convert unapproved absences into accurate payroll adjustments.",
  },
  {
    title: "Flexible Deduction",
    description: "Deduct from salary or leave balance based on company policy.",
  },
  {
    title: "Flexible Pay Cycles",
    description: "Run monthly, bi-weekly, fixed-date, or hourly payroll.",
  },
  {
    title: "Flexible Pay Structure",
    description: "Calculate compensation by pay grade or individual salary.",
  },
  {
    title: "Bonus Management",
    description: "Add overtime, attendance, and custom bonuses in one place.",
  },
  {
    title: "Payroll Generation",
    description: "Generate final payroll from attendance, leave, and pay rules.",
  },
];

const schedule: SlidePointContent[] = [
  {
    title: "Flexible Shift Creation",
    description:
      "Define shift timings and combine them into reusable weekly or rotating patterns.",
  },
  {
    title: "Branch & Department Customization",
    description:
      "Configure different schedules for departments, branches, or employee groups.",
  },
  {
    title: "Bulk & Individual Assignment",
    description: "Assign one employee or hundreds to a schedule in a few clicks.",
  },
  {
    title: "Drag-and-Drop Rescheduling",
    description: "See the full week at a glance and reassign anyone, anytime.",
  },
];

const recruitment: SlidePointContent[] = [
  {
    title: "Employee Requisition in a Few Clicks",
    description:
      "Line/branch managers raise a request for a new hire directly in the system, routed straight to HR for approval.",
  },
  {
    title: "Resignation, Self-Service",
    description:
      "Employees submit resignation requests directly from the mobile app — no paper forms required.",
  },
  {
    title: "Built-In Approval Workflow",
    description: "Every request moves through a clear, auditable chain of approvals.",
  },
  {
    title: "Complete Request History",
    description:
      "HR keeps a full, searchable record of every requisition and resignation, from request to final decision.",
  },
];

const dashboard: SlidePointContent[] = [
  {
    title: "Customizable Widgets",
    description:
      "HR and management choose exactly which metrics to track — attendance, leave, probation, increments, requests, and more.",
  },
  {
    title: "Real-Time Attendance & Leave Overview",
    description:
      "A live view of who's in, who's on leave, and workforce trends across every branch.",
  },
  {
    title: "Requisition & Increment Tracking at a Glance",
    description:
      "See open hiring requests and pending increment approvals without digging through separate reports.",
  },
  {
    title: "Centralized Workforce Insights",
    description: "Monitor key HR metrics from a single, unified dashboard.",
  },
];

export const SLIDE_DEFAULTS: Record<string, ModuleSlideDefaults> = {
  "employee-management": {
    moduleId: "employee-management",
    points: employeeManagement,
  },
  attendance: {
    moduleId: "attendance",
    points: attendance,
  },
  leave: {
    moduleId: "leave",
    points: leave,
  },
  payroll: {
    moduleId: "payroll",
    points: payroll,
  },
  schedule: {
    moduleId: "schedule",
    points: schedule,
  },
  recruitment: {
    moduleId: "recruitment",
    points: recruitment,
  },
  dashboard: {
    moduleId: "dashboard",
    points: dashboard,
  },
};
