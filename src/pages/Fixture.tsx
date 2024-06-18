import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FaFileArchive } from "react-icons/fa";
import { GiTakeMyMoney } from "react-icons/gi";
import { useNavigate, useParams } from "react-router-dom";
import SelectInput from "../components/common/SelectInput";
import FixtureExpenses from "../components/fixture/FixtureExpenses";
import FixtureStockHistory from "../components/fixture/FixtureStockHistory";
import { Header } from "../components/header/Header";
import PageNavigator from "../components/panelComponents/PageNavigator/PageNavigator";
import TabPanel from "../components/panelComponents/TabPanel/TabPanel";
import { useGeneralContext } from "../context/General.context";
import { useUserContext } from "../context/User.context";
import { Routes } from "../navigation/constants";
import { AccountFixture, FixturePageTabEnum } from "../types";
import { useGetAccountFixtures } from "../utils/api/account/fixture";
import { useGetPanelControlPages } from "../utils/api/panelControl/page";
export const FixturePageTabs = [
  {
    number: FixturePageTabEnum.FIXTUREEXPENSES,
    label: "Fixture Expenses",
    icon: <GiTakeMyMoney className="text-lg font-thin" />,
    content: <FixtureExpenses />,
    isDisabled: false,
  },
  {
    number: FixturePageTabEnum.FIXTURESTOCKHISTORY,
    label: "Fixture Stock History",
    icon: <FaFileArchive className="text-lg font-thin" />,
    content: <FixtureStockHistory />,
    isDisabled: false,
  },
];

export default function Fixture() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<number>(0);
  const { setCurrentPage, setRowsPerPage, setSearchQuery, setSortConfigKey } =
    useGeneralContext();
  const [tabPanelKey, setTabPanelKey] = useState(0);
  const [selectedFixture, setSelectedFixture] = useState<AccountFixture>();
  const fixtures = useGetAccountFixtures();
  const { fixtureId } = useParams();
  const currentFixture = fixtures?.find((fixture) => fixture._id === fixtureId);
  const { t } = useTranslation();
  const pageNavigations = [
    {
      name: t("Constants"),
      path: Routes.Accounting,
      canBeClicked: true,
      additionalSubmitFunction: () => {
        setCurrentPage(1);
        // setRowsPerPage(RowPerPageEnum.FIRST);
        setSortConfigKey(null);
        setSearchQuery("");
      },
    },
    {
      name: t("Fixture"),
      path: "",
      canBeClicked: false,
    },
  ];
  const fixtureOptions = fixtures?.map((f) => {
    return {
      value: f._id,
      label: f.name,
    };
  });
  if (!currentFixture) return <></>;
  const currentPageId = "fixture";
  const pages = useGetPanelControlPages();
  const { user } = useUserContext();
  if (!user || pages.length === 0) return <></>;
  const currentPageTabs = pages.find(
    (page) => page._id === currentPageId
  )?.tabs;
  const tabs = FixturePageTabs.map((tab) => {
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
      <PageNavigator navigations={pageNavigations} />
      <div className="flex flex-col gap-4 ">
        <div className="w-[95%] mx-auto">
          <div className="sm:w-1/4 ">
            <SelectInput
              options={fixtureOptions}
              value={
                selectedFixture
                  ? {
                      value: selectedFixture._id,
                      label: selectedFixture.name,
                    }
                  : {
                      value: currentFixture._id,
                      label: currentFixture.name,
                    }
              }
              onChange={(selectedOption) => {
                setSelectedFixture(
                  fixtures?.find((p) => p._id === selectedOption?.value)
                );
                setCurrentPage(1);
                // setRowsPerPage(RowPerPageEnum.FIRST);
                setSearchQuery("");
                setTabPanelKey(tabPanelKey + 1);
                setActiveTab(0);
                setSortConfigKey(null);
                navigate(`/fixture/${selectedOption?.value}`);
              }}
              placeholder={t("Select a fixture")}
            />
          </div>
        </div>

        <TabPanel
          key={tabPanelKey}
          tabs={tabs}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          additionalOpenAction={() => {
            setCurrentPage(1);
            setSearchQuery("");
          }}
        />
      </div>
    </>
  );
}
