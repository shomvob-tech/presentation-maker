import AboutShomvobSlide from "../components/AboutShomvobSlide";
import AttendanceManagementSlide from "../components/AttendanceManagementSlide";
import EmployeeManagement_1 from "../components/EmployeeManagement_1";
import EmployeeManagement_2 from "../components/EmployeeManagement_2";
import EmployeeRequestWorkflowsSlide from "../components/EmployeeRequestWorkflowsSlide";
import HrChallengesSlide from "../components/HrChallengesSlide";
import ManagementDashboardSlide from "../components/ManagementDashboardSlide";
import Onboarding_1 from "../components/Onboarding_1";
import Onboarding_2 from "../components/Onboarding_2";
import PayrollManagementSlide from "../components/PayrollManagementSlide";
import { GenericPresentationBranding } from "../components/PresentationBrandingContext";
import ScheduleRosterSlide from "../components/ScheduleRosterSlide";
import ShomvobIntroductionSlide from "../components/ShomvobIntroductionSlide";
import ThankYouSlide from "../components/ThankYouSlide";
import TitleSlideDesignThree from "../components/TitleSlideDesignThree";
import UnifiedLeaveManagementSlide from "../components/UnifiedLeaveManagementSlide";

export default function GenericPresentation() {
  return (
    <GenericPresentationBranding>
      <div className="flex flex-col">
        <TitleSlideDesignThree />
        <ShomvobIntroductionSlide />
        <AboutShomvobSlide />
        <HrChallengesSlide genericCopy />
        <EmployeeManagement_1 />
        <EmployeeManagement_2 />
        <Onboarding_1 />
        <Onboarding_2 />
        <AttendanceManagementSlide />
        <UnifiedLeaveManagementSlide />
        <PayrollManagementSlide />
        <ScheduleRosterSlide />
        <EmployeeRequestWorkflowsSlide />
        <ManagementDashboardSlide />
        <ThankYouSlide />
      </div>
    </GenericPresentationBranding>
  );
}
