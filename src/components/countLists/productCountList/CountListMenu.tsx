import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaArchive, FaClipboardList } from "react-icons/fa";
import { FaSitemap } from "react-icons/fa6";
import { useGeneralContext } from "../../../context/General.context";
import { useUserContext } from "../../../context/User.context";
import { CountListPageTabEnum, RoleEnum } from "../../../types";
import { useGetAccountCountLists } from "../../../utils/api/account/countList";
import { Tab } from "../../panelComponents/shared/types";
import TabPanel from "../../panelComponents/TabPanel/TabPanel";
import CountArchive from "./CountArchive";
import CountListProducts from "./CountListProducts";
import CountLists from "./CountLists";

const CountListMenu = () => {
  const { t, i18n } = useTranslation();
  const { user } = useUserContext();
  const [tabPanelKey, setTabPanelKey] = useState(0);

  const {
    setCurrentPage,
    setExpandedRows,
    setSearchQuery,
    countListActiveTab,
    setCountListActiveTab,
  } = useGeneralContext();
  const countLists = useGetAccountCountLists();
  const [tabs, setTabs] = useState<Tab[]>([]);

  useEffect(() => {
    setTabs([
      {
        number: CountListPageTabEnum.COUNTARCHIVE,
        label: t("Count Archive"),
        icon: <FaArchive />,
        content: <CountArchive />,
        isDisabled: false,
      },
      {
        number: CountListPageTabEnum.COUNTLISTS,
        label: t("Count Lists"),
        icon: <FaClipboardList />,
        content: <CountLists />,
        isDisabled: user
          ? ![RoleEnum.MANAGER, RoleEnum.CATERINGMANAGER].includes(
              user.role._id
            )
          : true,
      },
      {
        number: CountListPageTabEnum.COUNTLISTPRODUCTS,
        label: t("Count List Products"),
        icon: <FaSitemap />,
        content: <CountListProducts />,
        isDisabled: user
          ? ![RoleEnum.MANAGER, RoleEnum.CATERINGMANAGER].includes(
              user.role._id
            )
          : true,
      },
    ]);
    setTabPanelKey((prev) => prev + 1);
  }, [countLists.length, i18n.language]);

  return (
    <>
      <TabPanel
        key={tabPanelKey}
        tabs={tabs.sort((a, b) => a.number - b.number)}
        activeTab={countListActiveTab}
        setActiveTab={setCountListActiveTab}
        additionalOpenAction={() => {
          setCurrentPage(1);
          setExpandedRows({});
          setSearchQuery("");
        }}
      />
    </>
  );
};

export default CountListMenu;
