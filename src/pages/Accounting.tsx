import { useEffect, useState } from "react";
import { FaFileInvoiceDollar } from "react-icons/fa6";
import { RiProductHuntLine } from "react-icons/ri";
import { SiImprovmx } from "react-icons/si";
import { TbBrandBlogger, TbWeight, TbZoomMoney } from "react-icons/tb";
import Product from "../components/accounting/Product";
import Unit from "../components/accounting/Unit";
import { Header } from "../components/header/Header";

import Brand from "../components/accounting/Brand";
import ExpenseType from "../components/accounting/ExpenseType";
import Invoice from "../components/accounting/Invoice";
import Vendor from "../components/accounting/Vendor";
import TabPanel from "../components/panelComponents/TabPanel/TabPanel";

export default function Accounting() {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [tabPanelKey, setTabPanelKey] = useState<number>(0);

  const tabs = [
    {
      number: 0,
      label: "Expense Types",
      icon: <TbZoomMoney className="text-lg font-thin" />,
      content: <ExpenseType />,
      isDisabled: false,
    },
    {
      number: 1,
      label: "Units",
      icon: <TbWeight className="text-lg font-thin" />,
      content: <Unit />,
      isDisabled: false,
    },
    {
      number: 2,
      label: "Vendors",
      icon: <SiImprovmx className="text-lg font-thin" />,
      content: <Vendor />,
      isDisabled: false,
    },
    {
      number: 3,
      label: "Brands",
      icon: <TbBrandBlogger className="text-lg font-thin" />,
      content: <Brand />,
      isDisabled: false,
    },
    {
      number: 4,
      label: "Products",
      icon: <RiProductHuntLine className="text-lg font-thin" />,
      content: <Product />,
      isDisabled: false,
    },
    {
      number: 5,
      label: "Invoices",
      icon: <FaFileInvoiceDollar className="text-lg font-thin" />,
      content: <Invoice />,
      isDisabled: false,
    },
  ];
  useEffect(() => {
    setTabPanelKey((prev) => prev + 1);
  }, [activeTab]);
  return (
    <>
      <Header showLocationSelector={false} />
      <TabPanel
        key={tabPanelKey}
        tabs={tabs}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
    </>
  );
}
