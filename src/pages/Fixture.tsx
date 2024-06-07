import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FaFileArchive } from "react-icons/fa";
import { GiTakeMyMoney } from "react-icons/gi";
import { useNavigate, useParams } from "react-router-dom";
import SelectInput from "../components/common/SelectInput";
import FixtureExpenses from "../components/fixture/FixtureExpenses";
import FixtureStockHistory from "../components/fixture/FixtureStockHistory";
import { Header } from "../components/header/Header";
import TabPanel from "../components/panelComponents/TabPanel/TabPanel";
import { useGeneralContext } from "../context/General.context";
import { AccountFixture, FixturePageTabEnum } from "../types";
import { useGetAccountFixtures } from "../utils/api/account/fixture";

export default function Fixture() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<number>(0);
  const { fixtureId } = useParams();
  const { setCurrentPage, setRowsPerPage, setSearchQuery, setSortConfigKey } =
    useGeneralContext();
  const [tabPanelKey, setTabPanelKey] = useState(0);
  const [selectedFixture, setSelectedFixture] = useState<AccountFixture>();
  const fixtures = useGetAccountFixtures();
  const currentFixture = fixtures?.find((fixture) => fixture._id === fixtureId);
  const { t, i18n } = useTranslation();
  const fixtureOptions = fixtures?.map((f) => {
    return {
      value: f._id,
      label: f.name,
    };
  });

  if (!currentFixture) return <></>;
  const tabs = [
    {
      number: FixturePageTabEnum.FIXTUREEXPENSES,
      label: t("Fixture Expenses"),
      icon: <GiTakeMyMoney className="text-lg font-thin" />,
      content: <FixtureExpenses selectedFixture={currentFixture} />,
      isDisabled: false,
    },
    {
      number: FixturePageTabEnum.FIXTURESTOCKHISTORY,
      label: t("Fixture Stock History"),
      icon: <FaFileArchive className="text-lg font-thin" />,
      content: <FixtureStockHistory selectedFixture={currentFixture} />,
      isDisabled: false,
    },
  ];
  return (
    <>
      <Header showLocationSelector={false} />
      <div className="flex flex-col gap-4">
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
          key={tabPanelKey + i18n.language}
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
