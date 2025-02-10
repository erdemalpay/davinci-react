import { FaClipboardList, FaSitemap } from "react-icons/fa";
import ExpirationListProducts from "../components/expiration/ExpirationListProducts";
import ExpirationLists from "../components/expiration/ExpirationLists";
import { Header } from "../components/header/Header";
import TabPanel from "../components/panelComponents/TabPanel/TabPanel";
import { useGeneralContext } from "../context/General.context";
import { useUserContext } from "../context/User.context";
import { ExpirationPageTabEnum } from "../types";
import { useGetPanelControlPages } from "../utils/api/panelControl/page";

export const ExpirationTabs = [
  {
    number: ExpirationPageTabEnum.EXPIRATIONLISTS,
    label: "Expiration Lists",
    icon: <FaClipboardList className="text-lg font-thin" />,
    content: <ExpirationLists />,
    isDisabled: false,
  },
  {
    number: ExpirationPageTabEnum.EXPIRATIONLISTPRODUCTS,
    label: "Expiration List Products",
    icon: <FaSitemap />,
    content: <ExpirationListProducts />,
    isDisabled: false,
  },
];
export default function Expirations() {
  const { expirationActiveTab, setExpirationActiveTab } = useGeneralContext();
  const currentPageId = "expirations";
  const pages = useGetPanelControlPages();
  const { user } = useUserContext();
  if (!user || pages.length === 0) return <></>;
  const currentPageTabs = pages.find(
    (page) => page._id === currentPageId
  )?.tabs;
  const tabs = ExpirationTabs.map((tab) => {
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
      <TabPanel
        tabs={tabs}
        activeTab={expirationActiveTab}
        setActiveTab={setExpirationActiveTab}
      />
    </>
  );
}
