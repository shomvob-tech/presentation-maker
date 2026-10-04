import type { ComponentType } from "react";
import type { DeckSlideKey, DeckSlideProps } from "@/lib/deck-catalog";
import AboutShomvobSlide from "../AboutShomvobSlide";
import AttendanceManagementSlide from "../AttendanceManagementSlide";
import EmployeeManagement_1 from "../EmployeeManagement_1";
import EmployeeManagement_2 from "../EmployeeManagement_2";
import EmployeeRequestWorkflowsSlide from "../EmployeeRequestWorkflowsSlide";
import ManagementDashboardSlide from "../ManagementDashboardSlide";
import Onboarding_1 from "../Onboarding_1";
import Onboarding_2 from "../Onboarding_2";
import PayrollManagementSlide from "../PayrollManagementSlide";
import ScheduleRosterSlide from "../ScheduleRosterSlide";
import ShomvobIntroductionSlide from "../ShomvobIntroductionSlide";
import ThankYouSlide from "../ThankYouSlide";
import TitleSlideDesignThree from "../TitleSlideDesignThree";
import UnifiedLeaveManagementSlide from "../UnifiedLeaveManagementSlide";

/**
 * The component behind every key in lib/deck-catalog.ts. A Record over the
 * key union, so adding a key there without a slide here fails the type check.
 *
 * These are the /300ltd sample's slides, unchanged in layout. HrChallengesSlide
 * is deliberately absent: its copy is about one multi-brand client, so it is
 * not in the deck.
 */
export const DECK_SLIDES: Record<DeckSlideKey, ComponentType<DeckSlideProps>> = {
  title: TitleSlideDesignThree,
  intro: ShomvobIntroductionSlide,
  about: AboutShomvobSlide,
  "employee-management-capabilities": EmployeeManagement_1,
  "employee-management-workflow": EmployeeManagement_2,
  "onboarding-capabilities": Onboarding_1,
  "onboarding-journey": Onboarding_2,
  attendance: AttendanceManagementSlide,
  leave: UnifiedLeaveManagementSlide,
  payroll: PayrollManagementSlide,
  schedule: ScheduleRosterSlide,
  requests: EmployeeRequestWorkflowsSlide,
  dashboard: ManagementDashboardSlide,
  "thank-you": ThankYouSlide,
};
