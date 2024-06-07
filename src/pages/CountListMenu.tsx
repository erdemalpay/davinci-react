import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import CountArchive from "../components/accounting/CountArchive";
import CountLists from "../components/accounting/CountLists";
import { Header } from "../components/header/Header";
import { Tab } from "../components/panelComponents/shared/types";
import TabPanel from "../components/panelComponents/TabPanel/TabPanel";
import { useGeneralContext } from "../context/General.context";
import { useUserContext } from "../context/User.context";
import { CountListPageTabEnum, RoleEnum } from "../types";
import { useGetAccountCountLists } from "../utils/api/account/countList";

const CountListMenu = () => {
  const { t } = useTranslation();
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
        icon: null,
        content: <CountArchive />,
        isDisabled: false,
      },
      {
        number: CountListPageTabEnum.COUNTLISTS,
        label: t("Count Lists"),
        icon: null,
        content: <CountLists />,
        isDisabled: user
          ? ![RoleEnum.MANAGER, RoleEnum.CATERINGMANAGER].includes(
              user.role._id
            )
          : true,
      },
    ]);
    setTabPanelKey((prev) => prev + 1);
  }, [countLists.length]);

  return (
    <>
      <Header showLocationSelector={false} />
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
