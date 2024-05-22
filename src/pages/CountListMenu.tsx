import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import CountArchive from "../components/accounting/CountArchive";
import CountLists from "../components/accounting/CountLists";
import CountList from "../components/countList/CountList";
import { Header } from "../components/header/Header";
import { Tab } from "../components/panelComponents/shared/types";
import TabPanel from "../components/panelComponents/TabPanel/TabPanel";
import { useGeneralContext } from "../context/General.context";
import { useGetAccountCountLists } from "../utils/api/account/countList";

const CountListMenu = () => {
  const { t } = useTranslation();
  const {
    setCurrentPage,
    setExpandedRows,
    setSearchQuery,
    countListActiveTab,
    setCountListActiveTab,
  } = useGeneralContext();
  const countLists = useGetAccountCountLists();
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [tabPanelKey, setTabPanelKey] = useState(0);

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
        content: <CountLists />,
        isDisabled: false,
      },
    ]);
    setTabPanelKey((prev) => prev + 1);
  }, [countLists.length]);

  return (
    <>
      <Header showLocationSelector={false} />
      {tabs.length > 0 && (
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
      )}
    </>
  );
};

export default CountListMenu;
