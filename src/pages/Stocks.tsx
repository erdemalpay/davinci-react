import { useTranslation } from "react-i18next";
import { FiArchive } from "react-icons/fi";
import {
  GiArchiveResearch,
  GiEatingPelican,
  GiGreatPyramid,
} from "react-icons/gi";
import { SlBasketLoaded } from "react-icons/sl";
import CountArchive from "../components/accounting/CountArchive";
import FixtureStock from "../components/accounting/FixtureStock";
import ProductStockHistory from "../components/accounting/ProductStockHistory";
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
      label: t("Product Stocks"),
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
      number: StocksPageTabEnum.COUNTARCHIVE,
      label: t("Count Archives"),
      icon: <FiArchive className="text-lg font-thin" />,
      content: <CountArchive />,
      isDisabled: false,
    },
    {
      number: StocksPageTabEnum.PRODUCTSTOCKHISTORY,
      label: t("Product Stock History"),
      icon: <GiArchiveResearch className="text-lg font-thin" />,
      content: <ProductStockHistory />,
      isDisabled: false,
    },
  ];
  return (
    <>
      <Header showLocationSelector={false} />
      <div className="flex flex-col gap-2 mt-5 ">
        <TabPanel
          // to be able to control the tab panel moving underline we need to delete the isDisabled ones from the number
          tabs={tabs?.map((tab) => ({
            ...tab,
            number: tab.number - tabs?.filter((t) => t?.isDisabled)?.length,
          }))}
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
