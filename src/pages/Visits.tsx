import { CiViewTable } from "react-icons/ci";
import { FaPhoenixFramework } from "react-icons/fa";
import { GiEgyptianWalk } from "react-icons/gi";
import {
  MdChangeCircle,
  MdFreeBreakfast,
  MdOutlineAdminPanelSettings,
  MdOutlinePerson,
  MdOutlineSchedule,
} from "react-icons/md";
import { SlCalender } from "react-icons/sl";
import { Header } from "../components/header/Header";
import UnifiedTabPanel from "../components/panelComponents/TabPanel/UnifiedTabPanel";
import AllBreaks from "../components/visits/AllBreaks";
import AllVisits from "../components/visits/AllVisits";
import ChangeRequestManagement from "../components/visits/ChangeRequestManagement";
import DailyVisit from "../components/visits/DailyVisit";
import ShiftChange from "../components/visits/ShiftChange";
import Shifts from "../components/visits/Shifts";
import UserChangeRequestTab from "../components/visits/UserChangeRequestTab";
import VisitChart from "../components/visits/VisitChart";
import VisitScheduleOverview from "../components/visits/VisitScheduleOverview";
import { useFilterContext } from "../context/Filter.context";
import { useGeneralContext } from "../context/General.context";
import { useUserContext } from "../context/User.context";
import { VisitPageTabEnum } from "../types";
import { useGetPanelControlPages } from "../utils/api/panelControl/page";

export const VisitPageTabs = [
  {
    number: VisitPageTabEnum.DAILYVISIT,
    label: "Daily Visit",
    icon: <CiViewTable className="text-lg font-thin" />,
    content: <DailyVisit />,
    isDisabled: false,
  },
  {
    number: VisitPageTabEnum.VISITCHART,
    label: "Visit Chart",
    icon: <SlCalender className="text-lg font-thin" />,
    content: <VisitChart />,
    isDisabled: false,
  },
  {
    number: VisitPageTabEnum.VISITSCHEDULEOVERVIEW,
    label: "Visit Schedule Overview",
    icon: <MdOutlineSchedule className="text-lg font-thin" />,
    content: <VisitScheduleOverview />,
    isDisabled: false,
  },
  {
    number: VisitPageTabEnum.ALLVISITS,
    label: "All Visits",
    icon: <GiEgyptianWalk className="text-lg font-thin" />,
    content: <AllVisits />,
    isDisabled: false,
  },
  {
    number: VisitPageTabEnum.SHIFTS,
    label: "Shifts",
    icon: <FaPhoenixFramework className="text-lg font-thin" />,
    content: <Shifts />,
    isDisabled: false,
  },
  {
    number: VisitPageTabEnum.SHIFTCHANGE,
    label: "ShiftChange",
    icon: <MdChangeCircle className="text-lg font-thin" />,
    content: <ShiftChange />,
    isDisabled: false,
  },
  {
    number: VisitPageTabEnum.USERCHANGEREQUESTTAB,
    label: "UserChangeRequestTab",
    icon: <MdOutlinePerson className="text-lg font-thin" />,
    content: <UserChangeRequestTab />,
    isDisabled: false,
  },
  {
    number: VisitPageTabEnum.CHANGEREQUESTMANAGEMENT,
    label: "ChangeRequestManagement",
    icon: <MdOutlineAdminPanelSettings className="text-lg font-thin" />,
    content: <ChangeRequestManagement />,
    isDisabled: false,
  },
  {
    number: VisitPageTabEnum.ALLBREAKS,
    label: "All Breaks",
    icon: <MdFreeBreakfast className="text-lg font-thin" />,
    content: <AllBreaks />,
    isDisabled: false,
  },
];
export default function Visits() {
  const { resetGeneralContext } = useGeneralContext();
  const { visitsActiveTab, setVisitsActiveTab } = useFilterContext();
  const currentPageId = "shifts";
  const pages = useGetPanelControlPages();
  const { user } = useUserContext();
  if (!user || pages.length === 0) return <></>;
  const currentPageTabs = pages.find(
    (page) => page._id === currentPageId
  )?.tabs;
  const tabs = VisitPageTabs.map((tab) => {
    return {
      ...tab,
      isDisabled: currentPageTabs
        ?.find((item) => item.name === tab.label)
        ?.permissionRoles?.includes(user.role._id)
        ? false
        : true,
    };
  });
  return (
    <>
      <Header showLocationSelector={true} />
      <div className="flex flex-col gap-2 mt-5 ">
        <UnifiedTabPanel
          tabs={tabs}
          activeTab={visitsActiveTab}
          setActiveTab={setVisitsActiveTab}
          additionalOpenAction={() => {
            resetGeneralContext();
          }}
          allowOrientationToggle={true}
        />
      </div>
    </>
  );
}
