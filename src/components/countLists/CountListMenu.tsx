import { useEffect, useState } from "react";
import { FaArchive, FaClipboardList } from "react-icons/fa";
import { FaSitemap } from "react-icons/fa6";
import { useGeneralContext } from "../../context/General.context";
import { useUserContext } from "../../context/User.context";
import { CountListPageTabEnum, RoleEnum } from "../../types";
import { useGetAccountCountLists } from "../../utils/api/account/countList";
import TabPanel from "../panelComponents/TabPanel/TabPanel";
import { Tab } from "../panelComponents/shared/types";
import CountArchive from "./CountArchive";
import CountListProducts from "./CountListProducts";
import CountLists from "./CountLists";

const CountListMenu = () => {
  const { user } = useUserContext();
  const [tabPanelKey, setTabPanelKey] = useState(0);
  const { countListActiveTab, setCountListActiveTab } = useGeneralContext();
  const countLists = useGetAccountCountLists();
  const [tabs, setTabs] = useState<Tab[]>([]);
  useEffect(() => {
    setTabs([
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
        content: <CountLists />,
        isDisabled: false,
      },
      {
        number: CountListPageTabEnum.COUNTLISTPRODUCTS,
        label: "Count List Products",
        icon: <FaSitemap />,
        content: <CountListProducts />,
        isDisabled: user ? ![RoleEnum.MANAGER].includes(user.role._id) : true,
      },
    ]);
    setTabPanelKey((prev) => prev + 1);
  }, [countLists.length]);
  return (
    <>
      <TabPanel
        key={tabPanelKey}
        tabs={tabs.sort((a, b) => a.number - b.number)}
        activeTab={countListActiveTab}
        setActiveTab={setCountListActiveTab}
      />
    </>
  );
};

export default CountListMenu;
