import { useTranslation } from "react-i18next";
import { CiViewList } from "react-icons/ci";
import { FiArchive } from "react-icons/fi";
import { GiEatingPelican, GiGreatPyramid } from "react-icons/gi";
import { SlBasketLoaded } from "react-icons/sl";
import CountArchive from "../components/accounting/CountArchive";
import CountLists from "../components/accounting/CountLists";
import FixtureStock from "../components/accounting/FixtureStock";
import Stock from "../components/accounting/Stock";
import { Header } from "../components/header/Header";
import TabPanel from "../components/panelComponents/TabPanel/TabPanel";
import EnterConsumption from "../components/stocks/EnterConsumption";
import { useGeneralContext } from "../context/General.context";
import { StocksPageTabEnum } from "../types";

export default function Stocks() {
  const { t } = useTranslation();
  const {
    setCurrentPage,
    setSearchQuery,
    stocksActiveTab,
    setStocksActiveTab,
  } = useGeneralContext();
  const tabs = [
    {
      number: StocksPageTabEnum.STOCK,
      label: t("Stocks"),
      icon: <GiGreatPyramid className="text-lg font-thin" />,
      content: <Stock />,
      isDisabled: false,
    },
    {
      number: StocksPageTabEnum.FIXTURESTOCK,
      label: t("Fixture Stocks"),
      icon: <SlBasketLoaded className="text-lg font-thin" />,
      content: <FixtureStock />,
      isDisabled: false,
    },
    {
      number: StocksPageTabEnum.ENTERCONSUMPTION,
      label: t("Enter Consumption"),
      icon: <GiEatingPelican className="text-xl font-thin" />,
      content: <EnterConsumption />,
      isDisabled: false,
    },
    {
      number: StocksPageTabEnum.COUNTLIST,
      label: t("Count Lists"),
      icon: <CiViewList className="text-lg font-thin" />,
      content: <CountLists />,
      isDisabled: false,
    },
    {
      number: StocksPageTabEnum.COUNTARCHIVE,
      label: t("Count Archives"),
      icon: <FiArchive className="text-lg font-thin" />,
      content: <CountArchive />,
      isDisabled: false,
    },
  ];
  return (
    <>
      <Header showLocationSelector={false} />
      <div className="flex flex-col gap-2 mt-5 ">
        <TabPanel
          tabs={tabs}
          activeTab={stocksActiveTab}
          setActiveTab={setStocksActiveTab}
          additionalOpenAction={() => {
            setCurrentPage(1);
            setSearchQuery("");
          }}
        />
      </div>
    </>
  );
}