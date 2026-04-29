import { useState } from "react";
import { MdEventNote, MdOutlineCalendarMonth } from "react-icons/md";
import MonthlyCafeActivities from "../components/activities/MonthlyCafeActivities";
import { Header } from "../components/header/Header";
import UnifiedTabPanel from "../components/panelComponents/TabPanel/UnifiedTabPanel";
import { useGeneralContext } from "../context/General.context";
import { ActivitiesPageTabEnum } from "../types";
import CafeActivity from "./CafeActivity";

export const ActivitiesPageTabs = [
  {
    number: ActivitiesPageTabEnum.CAFE_ACTIVITIES,
    label: "Cafe Activities",
    icon: <MdEventNote className="text-lg font-thin" />,
    content: <CafeActivity />,
    isDisabled: false,
  },
  {
    number: ActivitiesPageTabEnum.MONTHLY_CAFE_ACTIVITIES,
    label: "Monthly Cafe Activities",
    icon: <MdOutlineCalendarMonth className="text-lg font-thin" />,
    content: <MonthlyCafeActivities />,
    isDisabled: false,
  },
];

export default function Activities() {
  const [activeTab, setActiveTab] = useState<number>(0);
  const { setCurrentPage, setSearchQuery } = useGeneralContext();

  return (
    <>
      <Header showLocationSelector={false} />
      <div className="flex flex-col gap-2 mt-5">
        <UnifiedTabPanel
          tabs={ActivitiesPageTabs}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          additionalOpenAction={() => {
            setCurrentPage(1);
            setSearchQuery("");
          }}
          allowOrientationToggle={true}
        />
      </div>
    </>
  );
}
