import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaArchive, FaClipboardList } from "react-icons/fa";
import { FaSitemap } from "react-icons/fa6";
import CountListFixtures from "../components/fixtureCountList/CountListFixtures";
import FixtureCountArchive from "../components/fixtureCountList/FixtureCountArchive";
import FixtureCountLists from "../components/fixtureCountList/FixtureCountLists";
import { Header } from "../components/header/Header";
import { Tab } from "../components/panelComponents/shared/types";
import TabPanel from "../components/panelComponents/TabPanel/TabPanel";
import { useGeneralContext } from "../context/General.context";
import { useUserContext } from "../context/User.context";
import { FixtureCountListPageTabEnum, RoleEnum } from "../types";
import { useGetAccountFixtureCountLists } from "../utils/api/account/fixtureCountList";

const FixtureCountListMenu = () => {
  const { t } = useTranslation();
  const { user } = useUserContext();
  const [tabPanelKey, setTabPanelKey] = useState(0);

  const {
    setCurrentPage,
    setExpandedRows,
    setSearchQuery,
    fixtureCountListActiveTab,
    setFixtureCountListActiveTab,
  } = useGeneralContext();
  const countLists = useGetAccountFixtureCountLists();
  const [tabs, setTabs] = useState<Tab[]>([]);

  useEffect(() => {
    setTabs([
      {
        number: FixtureCountListPageTabEnum.FIXTURECOUNTARCHIVE,
        label: t("Fixture Count Archive"),
        icon: <FaArchive />,
        content: <FixtureCountArchive />,
        isDisabled: false,
      },
      {
        number: FixtureCountListPageTabEnum.FIXTURECOUNTLISTS,
        label: t("Fixture Count Lists"),
        icon: <FaClipboardList />,
        content: <FixtureCountLists />,
        isDisabled: user
          ? ![RoleEnum.MANAGER, RoleEnum.CATERINGMANAGER].includes(
              user.role._id
            )
          : true,
      },
      {
        number: FixtureCountListPageTabEnum.COUNTLISTFIXTURES,
        label: t("Count List Fixtures"),
        icon: <FaSitemap />,
        content: <CountListFixtures />,
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
        activeTab={fixtureCountListActiveTab}
        setActiveTab={setFixtureCountListActiveTab}
        additionalOpenAction={() => {
          setCurrentPage(1);
          setExpandedRows({});
          setSearchQuery("");
        }}
      />
    </>
  );
};

export default FixtureCountListMenu;
