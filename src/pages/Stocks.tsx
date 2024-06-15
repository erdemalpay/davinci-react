import { useTranslation } from "react-i18next";
import { FaFileArchive } from "react-icons/fa";
import {
  GiArchiveResearch,
  GiEatingPelican,
  GiGreatPyramid,
} from "react-icons/gi";
import { SlBasketLoaded } from "react-icons/sl";
// import CountArchive from "../components/accounting/CountArchive";
import FixtureStock from "../components/accounting/FixtureStock";
import FixtureStockHistory from "../components/accounting/FixtureStockHistory";
import ProductStockHistory from "../components/accounting/ProductStockHistory";
import Stock from "../components/accounting/Stock";
import { Header } from "../components/header/Header";
import TabPanel from "../components/panelComponents/TabPanel/TabPanel";
import EnterConsumption from "../components/stocks/EnterConsumption";
import { useGeneralContext } from "../context/General.context";
import { useUserContext } from "../context/User.context";
import { RoleEnum, StocksPageTabEnum } from "../types";

export default function Stocks() {
  const { i18n } = useTranslation();
  const { user } = useUserContext();
  const {
    setCurrentPage,
    setSearchQuery,
    stocksActiveTab,
    setStocksActiveTab,
  } = useGeneralContext();
  const tabs = [
    {
      number: StocksPageTabEnum.STOCK,
      label: "Product Stocks",
      icon: <GiGreatPyramid className="text-lg font-thin" />,
      content: <Stock />,
      isDisabled: false,
    },
    {
      number: StocksPageTabEnum.FIXTURESTOCK,
      label: "Fixture Stocks",
      icon: <SlBasketLoaded className="text-lg font-thin" />,
      content: <FixtureStock />,
      isDisabled: false,
    },
    {
      number: StocksPageTabEnum.ENTERCONSUMPTION,
      label: "Enter Consumption",
      icon: <GiEatingPelican className="text-xl font-thin" />,
      content: <EnterConsumption />,
      isDisabled: false,
    },
    {
      number: StocksPageTabEnum.PRODUCTSTOCKHISTORY,
      label: "Product Stock History",
      icon: <GiArchiveResearch className="text-lg font-thin" />,
      content: <ProductStockHistory />,
      isDisabled: user
        ? ![
            RoleEnum.MANAGER,
            RoleEnum.GAMEMANAGER,
            RoleEnum.CATERINGMANAGER,
          ].includes(user?.role?._id)
        : true,
    },
    {
      number: StocksPageTabEnum.FIXTURESTOCKHISTORY,
      label: "Fixture Stock History",
      icon: <FaFileArchive className="text-lg font-thin" />,
      content: <FixtureStockHistory />,
      isDisabled: user
        ? ![
            RoleEnum.MANAGER,
            RoleEnum.GAMEMANAGER,
            RoleEnum.CATERINGMANAGER,
          ].includes(user?.role?._id)
        : true,
    },
  ];
  return (
    <>
      <Header showLocationSelector={false} />
      <div className="flex flex-col gap-2 mt-5 ">
        <TabPanel
          key={i18n.language}
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
