import TitleSlideDesignThree from "./components/TitleSlideDesignThree";
import ShomvobIntroductionSlide from "./components/ShomvobIntroductionSlide";
import AboutShomvobSlide from "./components/AboutShomvobSlide";
import HrChallengesSlide from "./components/HrChallengesSlide";
import EmployeeJourneyRoadmap from "./components/EmployeeJourneyRoadmap";
import EmployeeLoginSlide from "./components/EmployeeLoginSlide";
import AttendanceManagementSlide from "./components/AttendanceManagementSlide";
import LeaveManagementSlide from "./components/LeaveManagementSlide";
import LeaveSelfServiceSlide from "./components/LeaveSelfServiceSlide";
import PayrollManagementSlide from "./components/PayrollManagementSlide";
import ScheduleRosterSlide from "./components/ScheduleRosterSlide";
import EmployeeManagementSlide from "./components/EmployeeManagementSlide";
import EmployeeRequestWorkflowsSlide from "./components/EmployeeRequestWorkflowsSlide";
import ManagementDashboardSlide from "./components/ManagementDashboardSlide";
import ThankYouSlide from "./components/ThankYouSlide";

export default function Home() {
  return (
    <div className="flex flex-col">
      <TitleSlideDesignThree />
      <ShomvobIntroductionSlide />
      <AboutShomvobSlide />
      <HrChallengesSlide />
      <EmployeeJourneyRoadmap />
      <EmployeeLoginSlide />
      <AttendanceManagementSlide />
      <LeaveManagementSlide />
      <LeaveSelfServiceSlide />
      <PayrollManagementSlide />
      <ScheduleRosterSlide />
      <EmployeeManagementSlide />
      <EmployeeRequestWorkflowsSlide />
      <ManagementDashboardSlide />
      <ThankYouSlide />
    </div>
  );
}
