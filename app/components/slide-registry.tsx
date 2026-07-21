import type { ComponentType } from "react";
import TitleSlideDesignThree from "./TitleSlideDesignThree";
import ShomvobIntroductionSlide from "./ShomvobIntroductionSlide";
import AboutShomvobSlide from "./AboutShomvobSlide";
import ThankYouSlide from "./ThankYouSlide";
import EmployeeManagementSlide from "./EmployeeManagementSlide";
import AttendanceManagementSlide from "./AttendanceManagementSlide";
import UnifiedLeaveManagementSlide from "./UnifiedLeaveManagementSlide";
import PayrollManagementSlide from "./PayrollManagementSlide";
import ScheduleRosterSlide from "./ScheduleRosterSlide";
import EmployeeRequestWorkflowsSlide from "./EmployeeRequestWorkflowsSlide";
import ManagementDashboardSlide from "./ManagementDashboardSlide";

/**
 * Maps every slide key used by the points generator (see
 * lib/points-generator.ts) to the component that renders it. Keys "title",
 * "intro", "about", and "thankyou" are the mandatory slides present in every
 * generated presentation; the rest correspond to knowledge_base.json module
 * ids that already have a dedicated slide component.
 */
export const SLIDE_COMPONENTS: Record<string, ComponentType> = {
  title: TitleSlideDesignThree,
  intro: ShomvobIntroductionSlide,
  about: AboutShomvobSlide,
  "employee-management": EmployeeManagementSlide,
  attendance: AttendanceManagementSlide,
  leave: UnifiedLeaveManagementSlide,
  payroll: PayrollManagementSlide,
  schedule: ScheduleRosterSlide,
  recruitment: EmployeeRequestWorkflowsSlide,
  dashboard: ManagementDashboardSlide,
  thankyou: ThankYouSlide,
};
