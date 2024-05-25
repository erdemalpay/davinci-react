import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import CountArchive from "../components/accounting/CountArchive";
import CountLists from "../components/accounting/CountLists";
import CountList from "../components/countList/CountList";
import { Header } from "../components/header/Header";
import { Tab } from "../components/panelComponents/shared/types";
import TabPanel from "../components/panelComponents/TabPanel/TabPanel";
import { useGeneralContext } from "../context/General.context";
import { useUserContext } from "../context/User.context";
import { RoleEnum } from "../types";
import { useGetAccountCountLists } from "../utils/api/account/countList";

const CountListMenu = () => {
  const { t } = useTranslation();
  const { user } = useUserContext();
  const [tabPanelKey, setTabPanelKey] = useState(0);
  const [actionActiveTab, setActionActiveTab] = useState(0);
  const {
    setCurrentPage,
    setExpandedRows,
    setSearchQuery,
    countListActiveTab,
    setCountListActiveTab,
  } = useGeneralContext();
  const countLists = useGetAccountCountLists();
  const [tabs, setTabs] = useState<Tab[]>([]);
  const handleActionActiveTabChange = (newTab: number) => {
    setActionActiveTab(newTab);
  };
  useEffect(() => {
    setTabs([
      ...countLists.map((countList, index) => ({
        number: index,
        label: countList.name,
        icon: null,
        content: <CountList countListId={countList._id} />,
        isDisabled: false,
      })),
      {
        number: countLists.length,
        label: t("Count Archive"),
        icon: null,
        content: <CountArchive />,
        isDisabled: false,
      },
      {
        number: countLists.length + 1,
        label: t("Count Lists"),
        icon: null,
        content: (
          <CountLists
            actionActiveTab={actionActiveTab}
            setActionActiveTab={handleActionActiveTabChange}
          />
        ),
        isDisabled: user
          ? ![RoleEnum.MANAGER, RoleEnum.CATERINGMANAGER].includes(
              user.role._id
            )
          : true,
      },
    ]);
    setTabPanelKey((prev) => prev + 1);
  }, [countLists.length, actionActiveTab]);

  return (
    <>
      <Header showLocationSelector={false} />
      <TabPanel
        key={tabPanelKey + actionActiveTab}
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
