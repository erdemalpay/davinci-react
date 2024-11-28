import { AiOutlinePercentage } from "react-icons/ai";
import { FaServicestack } from "react-icons/fa";
import { FaKitchenSet } from "react-icons/fa6";
import { MdOutlinePayment } from "react-icons/md";
import { RiProductHuntLine } from "react-icons/ri";
import { SiImprovmx } from "react-icons/si";
import { TbBrandBlogger, TbZoomMoney } from "react-icons/tb";
import Brand from "../components/accounting/Brand";
import ExpenseType from "../components/accounting/ExpenseType";
import KitchenPage from "../components/accounting/Kitchen";
import OrderDiscountPage from "../components/accounting/OrderDiscountPage";
import PaymentMethods from "../components/accounting/PaymentMethod";
import Product from "../components/accounting/Product";
import Service from "../components/accounting/Service";
import Vendor from "../components/accounting/Vendor";
import { Header } from "../components/header/Header";
import TabPanel from "../components/panelComponents/TabPanel/TabPanel";
import { useGeneralContext } from "../context/General.context";
import { useUserContext } from "../context/User.context";
import { AccountingPageTabEnum } from "../types";
import { useGetPanelControlPages } from "../utils/api/panelControl/page";

export const AccountingPageTabs = [
  {
    number: AccountingPageTabEnum.EXPENSETYPE,
    label: "Expense Types",
    icon: <TbZoomMoney className="text-lg font-thin" />,
    content: <ExpenseType />,
    isDisabled: false,
  },
  {
    number: AccountingPageTabEnum.VENDOR,
    label: "Vendors",
    icon: <SiImprovmx className="text-lg font-thin" />,
    content: <Vendor />,
    isDisabled: false,
  },
  {
    number: AccountingPageTabEnum.BRAND,
    label: "Brands",
    icon: <TbBrandBlogger className="text-lg font-thin" />,
    content: <Brand />,
    isDisabled: false,
  },
  {
    number: AccountingPageTabEnum.PRODUCT,
    label: "Products",
    icon: <RiProductHuntLine className="text-lg font-thin" />,
    content: <Product />,
    isDisabled: false,
  },
  {
    number: AccountingPageTabEnum.SERVICES,
    label: "Services",
    icon: <FaServicestack className="text-lg font-thin" />,
    content: <Service />,
    isDisabled: false,
  },
  {
    number: AccountingPageTabEnum.DISCOUNTS,
    label: "Discounts",
    icon: <AiOutlinePercentage className="text-lg font-thin" />,
    content: <OrderDiscountPage />,
    isDisabled: false,
  },
  {
    number: AccountingPageTabEnum.PAYMENTMETHODS,
    label: "Payment Methods",
    icon: <MdOutlinePayment className="text-lg font-thin" />,
    content: <PaymentMethods />,
    isDisabled: false,
  },
  {
    number: AccountingPageTabEnum.KITCHENS,
    label: "Kitchens",
    icon: <FaKitchenSet className="text-lg font-thin" />,
    content: <KitchenPage />,
    isDisabled: false,
  },
];
export default function Accounting() {
  const {
    setCurrentPage,
    setSearchQuery,
    accountingActiveTab,
    setAccountingActiveTab,
  } = useGeneralContext();
  const currentPageId = "constants";
  const pages = useGetPanelControlPages();
  const { user } = useUserContext();
  if (!user || pages.length === 0) return <></>;
  const currentPageTabs = pages.find(
    (page) => page._id === currentPageId
  )?.tabs;
  const tabs = AccountingPageTabs.map((tab) => {
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
      <TabPanel
        tabs={tabs}
        activeTab={accountingActiveTab}
        setActiveTab={setAccountingActiveTab}
        additionalOpenAction={() => {
          setCurrentPage(1);
          setSearchQuery("");
        }}
      />
    </>
  );
}
