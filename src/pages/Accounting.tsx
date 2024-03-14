import { Switch } from "@headlessui/react";
import { useState } from "react";
import { FaFileInvoiceDollar } from "react-icons/fa6";
import { RiProductHuntLine } from "react-icons/ri";
import { SiImprovmx } from "react-icons/si";
import { TbBrandBlogger, TbWeight, TbZoomMoney } from "react-icons/tb";
import Brand from "../components/accounting/Brand";
import ExpenseType from "../components/accounting/ExpenseType";
import Invoice from "../components/accounting/Invoice";
import Product from "../components/accounting/Product";
import Unit from "../components/accounting/Unit";
import Vendor from "../components/accounting/Vendor";
import { Header } from "../components/header/Header";
import TabPanel from "../components/panelComponents/TabPanel/TabPanel";

export default function Accounting() {
  const [activeTab, setActiveTab] = useState<number>(0);

  const [showConstants, setShowConstants] = useState<boolean>(true);
  const tabs = [
    {
      number: 0,
      label: "Expense Types",
      icon: <TbZoomMoney className="text-lg font-thin" />,
      content: <ExpenseType />,
      isDisabled: showConstants,
    },
    {
      number: 1,
      label: "Units",
      icon: <TbWeight className="text-lg font-thin" />,
      content: <Unit />,
      isDisabled: showConstants,
    },
    {
      number: 2,
      label: "Vendors",
      icon: <SiImprovmx className="text-lg font-thin" />,
      content: <Vendor />,
      isDisabled: showConstants,
    },
    {
      number: 3,
      label: "Brands",
      icon: <TbBrandBlogger className="text-lg font-thin" />,
      content: <Brand />,
      isDisabled: showConstants,
    },
    {
      number: 4,
      label: "Products",
      icon: <RiProductHuntLine className="text-lg font-thin" />,
      content: <Product />,
      isDisabled: showConstants,
    },
    {
      number: 5,
      label: "Invoices",
      icon: <FaFileInvoiceDollar className="text-lg font-thin" />,
      content: <Invoice />,
      isDisabled: false,
    },
  ];

  return (
    <>
      <Header showLocationSelector={false} />
      <div className="flex flex-col gap-2 mt-5 ">
        <div className="w-[90%] mx-auto flex justify-end">
          <div className="flex flex-row gap-2 justify-center items-center">
            <p className=" text-lg font-medium">Show Constants</p>
            <Switch
              checked={!showConstants}
              onChange={() => {
                setShowConstants((value) => !value);
                if (!showConstants) {
                  setActiveTab(5);
                } else {
                  setActiveTab(0);
                }
              }}
              className={`${!showConstants ? "bg-green-500" : "bg-red-500"}
           ml-auto relative inline-flex h-[20px] w-[36px] min-w-[36px] border-[1px] cursor-pointer rounded-full border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
            >
              <span
                aria-hidden="true"
                className={`${
                  !showConstants ? "translate-x-4" : "translate-x-0"
                }
            pointer-events-none inline-block h-[18px] w-[18px] transform rounded-full bg-white transition duration-200 ease-in-out`}
              />
            </Switch>
          </div>
        </div>

        <TabPanel
          key={activeTab + showConstants.toString()}
          tabs={tabs}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      </div>
    </>
  );
}
