import { FaArchive, FaClipboardList } from "react-icons/fa";
import { FaSitemap } from "react-icons/fa6";
import CountArchive from "../components/countLists/CountArchive";
import CountListProducts from "../components/countLists/CountListProducts";
import CountListsComponent from "../components/countLists/CountLists";
import { Header } from "../components/header/Header";
import UnifiedTabPanel from "../components/panelComponents/TabPanel/UnifiedTabPanel";
import { useGeneralContext } from "../context/General.context";
import { useUserContext } from "../context/User.context";
import { CountListPageTabEnum } from "../types";
import { useGetPanelControlPages } from "../utils/api/panelControl/page";
export const CountListsPageTabs = [
  {
    number: CountListPageTabEnum.COUNTARCHIVE,
    label: "Count Archive",
    icon: <FaArchive />,
    content: <CountArchive />,
    isDisabled: false,
  },
  {
    number: CountListPageTabEnum.COUNTLISTS,
    label: "Count Lists",
    icon: <FaClipboardList />,
    content: <CountListsComponent />,
    isDisabled: false,
  },
  {
    number: CountListPageTabEnum.COUNTLISTPRODUCTS,
    label: "Count List Products",
    icon: <FaSitemap />,
    content: <CountListProducts />,
    isDisabled: false,
  },
];

export default function CountLists() {
  const {
    setCurrentPage,
    setSearchQuery,
    countListActiveTab,
    setCountListActiveTab,
  } = useGeneralContext();
  const pages = useGetPanelControlPages();
  const { user } = useUserContext();
  const currentPageId = "count_lists";
  if (!user || (pages && pages?.length === 0)) return <></>;
  const currentPageTabs = pages.find(
    (page) => page._id === currentPageId
  )?.tabs;

  const tabs = CountListsPageTabs.map((tab) => {
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
        <UnifiedTabPanel
          tabs={tabs}
          activeTab={countListActiveTab}
          setActiveTab={setCountListActiveTab}
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
