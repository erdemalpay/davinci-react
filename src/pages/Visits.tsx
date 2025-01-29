import { useState } from "react";
import { CiViewTable } from "react-icons/ci";
import { GiEgyptianWalk } from "react-icons/gi";
import { MdOutlineSchedule } from "react-icons/md";
import { SlCalender } from "react-icons/sl";
import { Header } from "../components/header/Header";
import TabPanel from "../components/panelComponents/TabPanel/TabPanel";
import AllVisits from "../components/visits/AllVisits";
import DailyVisit from "../components/visits/DailyVisit";
import VisitChart from "../components/visits/VisitChart";
import VisitScheduleOverview from "../components/visits/VisitScheduleOverview";
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
];
export default function Visits() {
  const { setCurrentPage, setSearchQuery } = useGeneralContext();
  const [activeTab, setActiveTab] = useState(VisitPageTabEnum.DAILYVISIT);
  const currentPageId = "visits";
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
      <Header showLocationSelector={false} />
      <div className="flex flex-col gap-2 mt-5 ">
        <TabPanel
          tabs={tabs}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          additionalOpenAction={() => {
            setCurrentPage(1);
            setSearchQuery("");
          }}
        />
      </div>
    </>
  );
}
