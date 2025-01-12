import {
  GiArchiveResearch,
  GiEatingPelican,
  GiGreatPyramid,
} from "react-icons/gi";
// import CountArchive from "../components/accounting/CountArchive";
import { BsTrash2Fill } from "react-icons/bs";
import { FaGamepad } from "react-icons/fa";
import { MdOutlineCompare } from "react-icons/md";
import GameStock from "../components/accounting/GameStock";
import GameStockLocation from "../components/accounting/GameStockLocation";
import ProductStockHistory from "../components/accounting/ProductStockHistory";
import Stock from "../components/accounting/Stock";
import { Header } from "../components/header/Header";
import TabPanel from "../components/panelComponents/TabPanel/TabPanel";
import EnterConsumption from "../components/stocks/EnterConsumption";
import IkasStockComparision from "../components/stocks/IkasStockComparision";
import LossProduct from "../components/stocks/LossProduct";
import { useGeneralContext } from "../context/General.context";
import { useUserContext } from "../context/User.context";
import { StocksPageTabEnum } from "../types";
import { useGetPanelControlPages } from "../utils/api/panelControl/page";

export const StockPageTabs = [
  {
    number: StocksPageTabEnum.STOCK,
    label: "Product Stocks",
    icon: <GiGreatPyramid className="text-lg font-thin" />,
    content: <Stock />,
    isDisabled: false,
  },
  {
    number: StocksPageTabEnum.GAMESTOCK,
    label: "Game Stocks",
    icon: <FaGamepad className="text-lg font-thin" />,
    content: <GameStock />,
    isDisabled: false,
  },
  {
    number: StocksPageTabEnum.GAMESTOCKBYLOCATION,
    label: "Game Stocks by Location",
    icon: <FaGamepad className="text-lg font-thin" />,
    content: <GameStockLocation />,
    isDisabled: false,
  },
  {
    number: StocksPageTabEnum.IKASSTOCKCOMPARISION,
    label: "Ikas Stock Comparision",
    icon: <MdOutlineCompare className="text-lg font-thin" />,
    content: <IkasStockComparision />,
    isDisabled: false,
  },
  {
    number: StocksPageTabEnum.ENTERCONSUMPTION,
    label: "Consumption",
    icon: <GiEatingPelican className="text-xl font-thin" />,
    content: <EnterConsumption />,
    isDisabled: false,
  },
  {
    number: StocksPageTabEnum.LOSSPRODUCT,
    label: "Loss Product",
    icon: <BsTrash2Fill className="text-xl font-thin" />,
    content: <LossProduct />,
    isDisabled: false,
  },
  {
    number: StocksPageTabEnum.PRODUCTSTOCKHISTORY,
    label: "Product Stock History",
    icon: <GiArchiveResearch className="text-lg font-thin" />,
    content: <ProductStockHistory />,
    isDisabled: false,
  },
];
export default function Stocks() {
  const {
    setCurrentPage,
    setSearchQuery,
    stocksActiveTab,
    setStocksActiveTab,
  } = useGeneralContext();
  const currentPageId = "stocks";
  const pages = useGetPanelControlPages();
  const { user } = useUserContext();
  if (!user || pages.length === 0) return <></>;
  const currentPageTabs = pages.find(
    (page) => page._id === currentPageId
  )?.tabs;
  const tabs = StockPageTabs.map((tab) => {
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
