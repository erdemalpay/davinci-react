import { GiArchiveResearch } from "react-icons/gi";
import ProductStockHistoryReport from "../components/accounting/ProductStockHistoryReport";
import { Header } from "../components/header/Header";
import UnifiedTabPanel from "../components/panelComponents/TabPanel/UnifiedTabPanel";
import EnterConsumptionReport from "../components/stocks/EnterConsumptionReport";
import LossProductReport from "../components/stocks/LossProductReport";
import { useGeneralContext } from "../context/General.context";
import { useUserContext } from "../context/User.context";
import { StockHistoriesReportsPageTabEnum } from "../types";
import { useGetPanelControlPages } from "../utils/api/panelControl/page";

export const StockHistoriesReportsPageTabs = [
  {
    number: StockHistoriesReportsPageTabEnum.LOSSPRODUCTREPORT,
    label: "Loss Product Report",
    icon: <GiArchiveResearch className="text-lg font-thin" />,
    content: <LossProductReport />,
    isDisabled: false,
  },
  {
    number: StockHistoriesReportsPageTabEnum.ENTERCONSUMPTIONREPORT,
    label: "Consumption Report",
    icon: <GiArchiveResearch className="text-lg font-thin" />,
    content: <EnterConsumptionReport />,
    isDisabled: false,
  },
  {
    number: StockHistoriesReportsPageTabEnum.PRODUCTSTOCKHISTORYREPORT,
    label: "Product Stock History Report",
    icon: <GiArchiveResearch className="text-lg font-thin" />,
    content: <ProductStockHistoryReport />,
    isDisabled: false,
  },
];

export default function StockHistoriesReports() {
  const {
    setCurrentPage,
    setSearchQuery,
    stockHistoriesReportsActiveTab,
    setStockHistoriesReportsActiveTab,
  } = useGeneralContext();
  const currentPageId = "stock_histories_reports";
  const pages = useGetPanelControlPages();
  const { user } = useUserContext();
  if (!user || pages.length === 0) return <></>;
  const currentPageTabs = pages.find(
    (page) => page._id === currentPageId
  )?.tabs;
  const tabs = StockHistoriesReportsPageTabs.map((tab) => {
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
      <Header />
      <UnifiedTabPanel
        tabs={tabs}
        activeTab={stockHistoriesReportsActiveTab}
        setActiveTab={setStockHistoriesReportsActiveTab}
        additionalOpenAction={() => {
          setCurrentPage(1);
          setSearchQuery("");
        }}
      />
    </>
  );
}
