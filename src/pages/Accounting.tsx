import { AiOutlinePercentage } from "react-icons/ai";
import { BiSolidCategoryAlt } from "react-icons/bi";
import { FaServicestack } from "react-icons/fa";
import { FaKitchenSet } from "react-icons/fa6";
import { GrActions } from "react-icons/gr";
import { IoStorefrontSharp } from "react-icons/io5";
import { MdEditNote, MdOutlinePayment } from "react-icons/md";
import { RiProductHuntLine } from "react-icons/ri";
import { SiImprovmx } from "react-icons/si";
import { TbBrandBlogger, TbCategoryPlus, TbZoomMoney } from "react-icons/tb";
import Actions from "../components/accounting/Actions";
import Brand from "../components/accounting/Brand";
import ExpenseType from "../components/accounting/ExpenseType";
import KitchenPage from "../components/accounting/Kitchen";
import LocationPage from "../components/accounting/Location";
import OrderDiscountPage from "../components/accounting/OrderDiscountPage";
import OrderNotes from "../components/accounting/OrderNotes";
import PaymentMethods from "../components/accounting/PaymentMethod";
import Product from "../components/accounting/Product";
import ProductCategoriesPage from "../components/accounting/ProductCategories";
import Service from "../components/accounting/Service";
import UpperCategories from "../components/accounting/UpperCategories";
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
    number: AccountingPageTabEnum.PRODUCTCATEGORIES,
    label: "Ikas Categories",
    icon: <BiSolidCategoryAlt className="text-lg font-thin" />,
    content: <ProductCategoriesPage />,
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
  {
    number: AccountingPageTabEnum.LOCATIONS,
    label: "Locations",
    icon: <IoStorefrontSharp className="text-lg font-thin" />,
    content: <LocationPage />,
    isDisabled: false,
  },
  {
    number: AccountingPageTabEnum.UPPERCATEGORIES,
    label: "Upper Categories",
    icon: <TbCategoryPlus className="text-lg font-thin" />,
    content: <UpperCategories />,
    isDisabled: false,
  },
  {
    number: AccountingPageTabEnum.ORDERNOTES,
    label: "Order Notes",
    icon: <MdEditNote className="text-lg font-thin" />,
    content: <OrderNotes />,
    isDisabled: false,
  },
  {
    number: AccountingPageTabEnum.ACTIONS,
    label: "Actions",
    icon: <GrActions className="text-lg font-thin" />,
    content: <Actions />,
    isDisabled: false,
  },
];
export default function Accounting() {
  const { accountingActiveTab, setAccountingActiveTab } = useGeneralContext();
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
      />
    </>
  );
}
