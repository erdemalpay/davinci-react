import { Switch } from "@headlessui/react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { BiCategoryAlt } from "react-icons/bi";
import { CiViewList } from "react-icons/ci";
import {
  FaFileInvoiceDollar,
  FaMagnifyingGlassLocation,
} from "react-icons/fa6";
import { FiArchive } from "react-icons/fi";
import { LuPackageOpen } from "react-icons/lu";
import { RiProductHuntLine } from "react-icons/ri";
import { SiImprovmx } from "react-icons/si";
import { SlBasketLoaded } from "react-icons/sl";
import { TbBrandBlogger, TbWeight, TbZoomMoney } from "react-icons/tb";
import { VscTypeHierarchy } from "react-icons/vsc";
import Brand from "../components/accounting/Brand";
import CountArchive from "../components/accounting/CountArchive";
import CountLists from "../components/accounting/CountLists";
import ExpenseCategory from "../components/accounting/ExpenseCategory";
import ExpenseType from "../components/accounting/ExpenseType";
import Invoice from "../components/accounting/Invoice";
import PackageType from "../components/accounting/PackageType";
import Product from "../components/accounting/Product";
import Stock from "../components/accounting/Stock";
import StockLocations from "../components/accounting/StockLocation";
import StockType from "../components/accounting/StockType";
import Unit from "../components/accounting/Unit";
import Vendor from "../components/accounting/Vendor";
import { Header } from "../components/header/Header";
import TabPanel from "../components/panelComponents/TabPanel/TabPanel";
import { useGeneralContext } from "../context/General.context";
import { AccountingPageTabEnum } from "../types";

export default function Accounting() {
  const { t } = useTranslation();
  const [tableKey, setTableKey] = useState<number>(0);

  const {
    setCurrentPage,
    setSearchQuery,
    accountingActiveTab,
    setAccountingActiveTab,
    showAccountingConstants,
    setShowAccountingConstants,
  } = useGeneralContext();

  const tabs = [
    {
      number: AccountingPageTabEnum.EXPENSETYPE,
      label: t("Expense Types"),
      icon: <TbZoomMoney className="text-lg font-thin" />,
      content: <ExpenseType />,
      isDisabled: showAccountingConstants,
    },
    {
      number: AccountingPageTabEnum.EXPENSECATEGORY,
      label: t("Expense Categories"),
      icon: <BiCategoryAlt className="text-lg font-thin" />,
      content: <ExpenseCategory />,
      isDisabled: showAccountingConstants,
    },
    {
      number: AccountingPageTabEnum.UNIT,
      label: t("Units"),
      icon: <TbWeight className="text-lg font-thin" />,
      content: <Unit />,
      isDisabled: showAccountingConstants,
    },
    {
      number: AccountingPageTabEnum.VENDOR,
      label: t("Vendors"),
      icon: <SiImprovmx className="text-lg font-thin" />,
      content: <Vendor />,
      isDisabled: showAccountingConstants,
    },
    {
      number: AccountingPageTabEnum.BRAND,
      label: t("Brands"),
      icon: <TbBrandBlogger className="text-lg font-thin" />,
      content: <Brand />,
      isDisabled: showAccountingConstants,
    },
    {
      number: AccountingPageTabEnum.PACKAGETYPE,
      label: t("Package Types"),
      icon: <LuPackageOpen className="text-lg font-thin" />,
      content: <PackageType />,
      isDisabled: showAccountingConstants,
    },
    {
      number: AccountingPageTabEnum.PRODUCT,
      label: t("Products"),
      icon: <RiProductHuntLine className="text-lg font-thin" />,
      content: <Product />,
      isDisabled: showAccountingConstants,
    },
    {
      number: AccountingPageTabEnum.STOCKTYPE,
      label: t("Stock Types"),
      icon: <VscTypeHierarchy className="text-lg font-thin" />,
      content: <StockType />,
      isDisabled: showAccountingConstants,
    },
    {
      number: AccountingPageTabEnum.STOCKLOCATION,
      label: t("Stock Locations"),
      icon: <FaMagnifyingGlassLocation className="text-lg font-thin" />,
      content: <StockLocations />,
      isDisabled: showAccountingConstants,
    },

    {
      number: AccountingPageTabEnum.INVOICE,
      label: t("Expenses"),
      icon: <FaFileInvoiceDollar className="text-lg font-thin" />,
      content: <Invoice />,
      isDisabled: false,
    },
    {
      number: AccountingPageTabEnum.COUNTLIST,
      label: t("Count Lists"),
      icon: <CiViewList className="text-lg font-thin" />,
      content: <CountLists />,
      isDisabled: false,
    },
    {
      number: AccountingPageTabEnum.COUNTARCHIVE,
      label: t("Count Archives"),
      icon: <FiArchive className="text-lg font-thin" />,
      content: <CountArchive />,
      isDisabled: false,
    },
    {
      number: AccountingPageTabEnum.STOCK,
      label: t("Stocks"),
      icon: <SlBasketLoaded className="text-lg font-thin" />,
      content: <Stock />,
      isDisabled: false,
    },
  ];
  useEffect(() => {
    setTableKey((prev) => prev + 1);
  }, [accountingActiveTab, showAccountingConstants]);

  return (
    <>
      <Header showLocationSelector={false} />
      <div className="flex flex-col gap-2 mt-5 ">
        <div className="w-[90%] mx-auto flex justify-end">
          <div className="flex flex-row gap-2 justify-center items-center">
            <p className=" text-lg font-medium">{t("Show Constants")}</p>
            <Switch
              checked={!showAccountingConstants}
              onChange={() => {
                setShowAccountingConstants(!showAccountingConstants);
                if (!showAccountingConstants) {
                  setAccountingActiveTab(AccountingPageTabEnum.INVOICE);
                } else {
                  setAccountingActiveTab(0);
                }
              }}
              className={`${
                !showAccountingConstants ? "bg-green-500" : "bg-red-500"
              }
           ml-auto relative inline-flex h-[20px] w-[36px] min-w-[36px] border-[1px] cursor-pointer rounded-full border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
            >
              <span
                aria-hidden="true"
                className={`${
                  !showAccountingConstants ? "translate-x-4" : "translate-x-0"
                }
            pointer-events-none inline-block h-[18px] w-[18px] transform rounded-full bg-white transition duration-200 ease-in-out`}
              />
            </Switch>
          </div>
        </div>

        <TabPanel
          key={tableKey}
          tabs={tabs}
          activeTab={accountingActiveTab}
          setActiveTab={setAccountingActiveTab}
          additionalOpenAction={() => {
            setCurrentPage(1);
            setSearchQuery("");
          }}
        />
      </div>
    </>
  );
}
