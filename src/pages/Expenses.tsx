import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaFileInvoiceDollar } from "react-icons/fa6";
import Invoice from "../components/accounting/Invoice";
import { Header } from "../components/header/Header";
import TabPanel from "../components/panelComponents/TabPanel/TabPanel";
import { useGeneralContext } from "../context/General.context";
import { ExpensesPageTabEnum } from "../types";

export default function Expenses() {
  const { t } = useTranslation();
  const [tableKey, setTableKey] = useState<number>(0);
  const {
    setCurrentPage,
    setSearchQuery,
    expensesActiveTab,
    setExpensesActiveTab,
  } = useGeneralContext();

  const tabs = [
    {
      number: ExpensesPageTabEnum.INVOICE,
      label: t("Invoices"),
      icon: <FaFileInvoiceDollar className="text-lg font-thin" />,
      content: <Invoice />,
      isDisabled: false,
    },
  ];
  useEffect(() => {
    setTableKey((prev) => prev + 1);
  }, [expensesActiveTab]);

  return (
    <>
      <Header showLocationSelector={false} />
      <div className="flex flex-col gap-2 mt-5 ">
        <TabPanel
          key={tableKey}
          tabs={tabs}
          activeTab={expensesActiveTab}
          setActiveTab={setExpensesActiveTab}
          additionalOpenAction={() => {
            setCurrentPage(1);
            setSearchQuery("");
          }}
        />
      </div>
    </>
  );
}
