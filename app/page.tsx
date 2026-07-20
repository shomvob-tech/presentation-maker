import TitleSlideDesignThree from "./components/TitleSlideDesignThree";
import ShomvobIntroductionSlide from "./components/ShomvobIntroductionSlide";
import AboutShomvobSlide from "./components/AboutShomvobSlide";
import HrChallengesSlide from "./components/HrChallengesSlide";
import EmployeeJourneyRoadmap from "./components/EmployeeJourneyRoadmap";
import EmployeeManagement_1 from "./components/EmployeeManagement_1";
import EmployeeManagement_2 from "./components/EmployeeManagement_2";
import Onboarding_1 from "./components/Onboarding_1";
import Onboarding_2 from "./components/Onboarding_2";
import EmployeeLoginSlide from "./components/EmployeeLoginSlide";
import AttendanceManagementSlide from "./components/AttendanceManagementSlide";
import UnifiedLeaveManagementSlide from "./components/UnifiedLeaveManagementSlide";
import PayrollManagementSlide from "./components/PayrollManagementSlide";
import ScheduleRosterSlide from "./components/ScheduleRosterSlide";
import EmployeeRequestWorkflowsSlide from "./components/EmployeeRequestWorkflowsSlide";
import ManagementDashboardSlide from "./components/ManagementDashboardSlide";
import Schedule2 from "./components/Schedule2";
import ThankYouSlide from "./components/ThankYouSlide";

export default function Home() {
  return (
    <div className="flex flex-col">
      <TitleSlideDesignThree />
      <ShomvobIntroductionSlide />
      <AboutShomvobSlide />
      <HrChallengesSlide />
      
      {/* <EmployeeJourneyRoadmap /> */}

      <EmployeeManagement_1 />
      <EmployeeManagement_2 />
      <Onboarding_1 />
      <Onboarding_2 />
      {/* <EmployeeLoginSlide /> */}
      <AttendanceManagementSlide />
      <UnifiedLeaveManagementSlide />
      <PayrollManagementSlide />
      <ScheduleRosterSlide />
      <Schedule2 />
      <EmployeeRequestWorkflowsSlide />
      <ManagementDashboardSlide />
      <ThankYouSlide />
    </div>
  );
}
