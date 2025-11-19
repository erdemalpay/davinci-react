import { GiSevenPointedStar } from "react-icons/gi";
import { MdHistory } from "react-icons/md";
import { Header } from "../components/header/Header";
import UnifiedTabPanel from "../components/panelComponents/TabPanel/UnifiedTabPanel";
import ConsumerPointHistoryComponent from "../components/points/ConsumerPointHistory";
import ConsumerPointComponent from "../components/points/ConsumerPoints";
import UsersPointComponent from "../components/points/UsersPoint";
import UsersPointHistoryComponent from "../components/points/UsersPointHistory";
import { useGeneralContext } from "../context/General.context";
import { useUserContext } from "../context/User.context";
import { PointsPageTabEnum } from "../types";
import { useGetPanelControlPages } from "../utils/api/panelControl/page";

export const PointsPageTabs = [
  {
    number: PointsPageTabEnum.USERSPOINT,
    label: "Users Points",
    icon: <GiSevenPointedStar className="text-lg font-thin" />,
    content: <UsersPointComponent />,
    isDisabled: false,
  },
  {
    number: PointsPageTabEnum.CONSUMERSPOINT,
    label: "Consumers Points",
    icon: <GiSevenPointedStar className="text-lg font-thin" />,
    content: <ConsumerPointComponent />,
    isDisabled: false,
  },

  {
    number: PointsPageTabEnum.USERSPOINTHISTORY,
    label: "Users Point History",
    icon: <MdHistory className="text-lg font-thin" />,
    content: <UsersPointHistoryComponent />,
    isDisabled: false,
  },
  {
    number: PointsPageTabEnum.CONSUMERPOINTHISTORY,
    label: "Consumer Point History",
    icon: <MdHistory className="text-lg font-thin" />,
    content: <ConsumerPointHistoryComponent />,
    isDisabled: false,
  },
];

export default function Points() {
  const {
    setCurrentPage,
    setSearchQuery,
    pointsActiveTab,
    setPointsActiveTab,
  } = useGeneralContext();
  const currentPageId = "points";
  const pages = useGetPanelControlPages();
  const { user } = useUserContext();
  if (!user || pages.length === 0) return <></>;
  const currentPageTabs = pages.find(
    (page) => page._id === currentPageId
  )?.tabs;
  const tabs = PointsPageTabs.map((tab) => {
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
      <div className="flex flex-col gap-2 mt-5">
        <UnifiedTabPanel
          tabs={tabs}
          activeTab={pointsActiveTab}
          setActiveTab={setPointsActiveTab}
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
