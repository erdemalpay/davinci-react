import {
  MdOutlineCompare,
  MdOutlineMail,
  MdOutlinePriceChange,
} from "react-icons/md";
import { Header } from "../components/header/Header";
import UnifiedTabPanel from "../components/panelComponents/TabPanel/UnifiedTabPanel";
import HepsiBuradaPriceComparision from "../components/stocks/HepsiBuradaPriceComparision";
import HepsiBuradaStockComparision from "../components/stocks/HepsiBuradaStockComparision";
import ShopifyPriceComparision from "../components/stocks/ShopifyPriceComparision";
import ShopifyStockComparision from "../components/stocks/ShopifyStockComparision";
import TrendyolStockComparision from "../components/stocks/TrendyolStockComparision";
import { useGeneralContext } from "../context/General.context";
import { useUserContext } from "../context/User.context";
import { IntegrationPageTabEnum } from "../types";
import { useGetPanelControlPages } from "../utils/api/panelControl/page";
import BackInStock from "./BackInStock";
import MailLogs from "./MailLogs";
import MailSubscriptions from "./MailSubscriptions";

export const IntegrationPageTabs = [
  {
    number: IntegrationPageTabEnum.SHOPIFYSTOCKCOMPARISION,
    label: "Shopify Stock Comparision",
    icon: <MdOutlineCompare className="text-lg font-thin" />,
    content: <ShopifyStockComparision />,
    isDisabled: false,
  },
  {
    number: IntegrationPageTabEnum.SHOPIFYPRICECOMPARISION,
    label: "Shopify Price Comparision",
    icon: <MdOutlinePriceChange className="text-lg font-thin" />,
    content: <ShopifyPriceComparision />,
    isDisabled: false,
  },
  {
    number: IntegrationPageTabEnum.TRENDYOLSTOCKCOMPARISION,
    label: "Trendyol Stock Comparision",
    icon: <MdOutlineCompare className="text-lg font-thin" />,
    content: <TrendyolStockComparision />,
    isDisabled: false,
  },
  {
    number: IntegrationPageTabEnum.HEPSIBURADAPRICECOMPARISION,
    label: "HepsiBurada Price Comparision",
    icon: <MdOutlinePriceChange className="text-lg font-thin" />,
    content: <HepsiBuradaPriceComparision />,
    isDisabled: false,
  },
  {
    number: IntegrationPageTabEnum.HEPSIBURADASTOCKCOMPARISION,
    label: "HepsiBurada Stock Comparision",
    icon: <MdOutlineCompare className="text-lg font-thin" />,
    content: <HepsiBuradaStockComparision />,
    isDisabled: false,
  },
  {
    number: IntegrationPageTabEnum.BACKINSTOCK,
    label: "Back In Stock",
    icon: <MdOutlineCompare className="text-lg font-thin" />,
    content: <BackInStock />,
    isDisabled: false,
  },
  {
    number: IntegrationPageTabEnum.MAILSUBSCRIPTIONS,
    label: "Mail Subscriptions",
    icon: <MdOutlineMail className="text-lg font-thin" />,
    content: <MailSubscriptions />,
    isDisabled: false,
  },
  {
    number: IntegrationPageTabEnum.MAILLOGS,
    label: "Mail Logs",
    icon: <MdOutlineMail className="text-lg font-thin" />,
    content: <MailLogs />,
    isDisabled: false,
  },
];

export default function Integration() {
  const {
    setCurrentPage,
    setSearchQuery,
    integrationActiveTab,
    setIntegrationActiveTab,
  } = useGeneralContext();
  const currentPageId = "integration";
  const pages = useGetPanelControlPages();
  const { user } = useUserContext();
  if (!user || pages.length === 0) return <></>;
  const currentPageTabs = pages.find(
    (page) => page._id === currentPageId
  )?.tabs;
  const tabs = IntegrationPageTabs.map((tab) => {
    const foundTab = currentPageTabs?.find((item) => item.name === tab.label);
    return {
      ...tab,
      isDisabled: foundTab
        ? !foundTab.permissionRoles?.includes(user.role._id)
        : false, // Show tabs that aren't configured in backend yet
    };
  });
  return (
    <>
      <Header showLocationSelector={false} />
      <div className="flex flex-col gap-2 mt-5 ">
        <UnifiedTabPanel
          tabs={tabs}
          activeTab={integrationActiveTab}
          setActiveTab={setIntegrationActiveTab}
          additionalOpenAction={() => {
            setCurrentPage(1);
            setSearchQuery("");
          }}
          allowOrientationToggle={true}
        />
      </div>
    </>
  );
}
