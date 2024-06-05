import { useTranslation } from "react-i18next";
import { FaAnchor, FaServicestack } from "react-icons/fa";
import { FaMagnifyingGlassLocation } from "react-icons/fa6";
import { LuPackageOpen } from "react-icons/lu";
import { MdOutlinePayment } from "react-icons/md";
import { RiProductHuntLine } from "react-icons/ri";
import { SiImprovmx } from "react-icons/si";
import { TbBrandBlogger, TbWeight, TbZoomMoney } from "react-icons/tb";
import Brand from "../components/accounting/Brand";
import ExpenseType from "../components/accounting/ExpenseType";
import Fixture from "../components/accounting/Fixture";
import PackageType from "../components/accounting/PackageType";
import PaymentMethods from "../components/accounting/PaymentMethod";
import Product from "../components/accounting/Product";
import Service from "../components/accounting/Service";
import StockLocations from "../components/accounting/StockLocation";
import Unit from "../components/accounting/Unit";
import Vendor from "../components/accounting/Vendor";
import { Header } from "../components/header/Header";
import TabPanel from "../components/panelComponents/TabPanel/TabPanel";
import { useGeneralContext } from "../context/General.context";
import { AccountingPageTabEnum } from "../types";

export default function Accounting() {
  const { t, i18n } = useTranslation();
  const {
    setCurrentPage,
    setSearchQuery,
    accountingActiveTab,
    setAccountingActiveTab,
  } = useGeneralContext();

  const tabs = [
    {
      number: AccountingPageTabEnum.EXPENSETYPE,
      label: t("Expense Types"),
      icon: <TbZoomMoney className="text-lg font-thin" />,
      content: <ExpenseType />,
      isDisabled: false,
    },

    {
      number: AccountingPageTabEnum.UNIT,
      label: t("Units"),
      icon: <TbWeight className="text-lg font-thin" />,
      content: <Unit />,
      isDisabled: false,
    },
    {
      number: AccountingPageTabEnum.VENDOR,
      label: t("Vendors"),
      icon: <SiImprovmx className="text-lg font-thin" />,
      content: <Vendor />,
      isDisabled: false,
    },
    {
      number: AccountingPageTabEnum.BRAND,
      label: t("Brands"),
      icon: <TbBrandBlogger className="text-lg font-thin" />,
      content: <Brand />,
      isDisabled: false,
    },
    {
      number: AccountingPageTabEnum.PACKAGETYPE,
      label: t("Package Types"),
      icon: <LuPackageOpen className="text-lg font-thin" />,
      content: <PackageType />,
      isDisabled: false,
    },
    {
      number: AccountingPageTabEnum.PRODUCT,
      label: t("Products"),
      icon: <RiProductHuntLine className="text-lg font-thin" />,
      content: <Product />,
      isDisabled: false,
    },
    {
      number: AccountingPageTabEnum.FIXTURES,
      label: t("Fixtures"),
      icon: <FaAnchor className="text-lg font-thin" />,
      content: <Fixture />,
      isDisabled: false,
    },
    {
      number: AccountingPageTabEnum.SERVICES,
      label: t("Services"),
      icon: <FaServicestack className="text-lg font-thin" />,
      content: <Service />,
      isDisabled: false,
    },
    {
      number: AccountingPageTabEnum.PAYMENTMETHODS,
      label: t("Payment Methods"),
      icon: <MdOutlinePayment className="text-lg font-thin" />,
      content: <PaymentMethods />,
      isDisabled: false,
    },
    {
      number: AccountingPageTabEnum.STOCKLOCATION,
      label: t("Stock Locations"),
      icon: <FaMagnifyingGlassLocation className="text-lg font-thin" />,
      content: <StockLocations />,
      isDisabled: false,
    },
  ];

  return (
    <>
      <Header showLocationSelector={false} />
      <TabPanel
        key={i18n.language}
        tabs={tabs?.map((tab) => ({
          ...tab,
          number: tab.number - tabs?.filter((t) => t?.isDisabled)?.length,
        }))}
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
