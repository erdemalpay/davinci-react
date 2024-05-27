import { useTranslation } from "react-i18next";
import { FaFileInvoiceDollar } from "react-icons/fa6";
import { GiAnchor } from "react-icons/gi";
import { GrMoney } from "react-icons/gr";
import { MdOutlineLocalLaundryService } from "react-icons/md";
import AllExpenses from "../components/accounting/AllExpenses";
import FixtureInvoice from "../components/accounting/FixtureInvoice";
import Invoice from "../components/accounting/Invoice";
import ServiceInvoice from "../components/accounting/ServiceInvoice";
import { Header } from "../components/header/Header";
import TabPanel from "../components/panelComponents/TabPanel/TabPanel";
import { useGeneralContext } from "../context/General.context";
import { ExpensesPageTabEnum } from "../types";

export default function Expenses() {
  const { t, i18n } = useTranslation();
  const {
    setCurrentPage,
    setSearchQuery,
    expensesActiveTab,
    setExpensesActiveTab,
  } = useGeneralContext();
  const tabs = [
    {
      number: ExpensesPageTabEnum.INVOICE,
      label: t("Product Expenses"),
      icon: <FaFileInvoiceDollar className="text-lg font-thin" />,
      content: <Invoice />,
      isDisabled: false,
    },
    {
      number: ExpensesPageTabEnum.FIXTUREINVOICE,
      label: t("Fixture Expenses"),
      icon: <GiAnchor className="text-lg font-thin" />,
      content: <FixtureInvoice />,
      isDisabled: false,
    },
    {
      number: ExpensesPageTabEnum.SERVICEINVOICE,
      label: t("Service Expenses"),
      icon: <MdOutlineLocalLaundryService className="text-lg font-thin" />,
      content: <ServiceInvoice />,
      isDisabled: false,
    },
    {
      number: ExpensesPageTabEnum.ALLEXPENSES,
      label: t("All Expenses"),
      icon: <GrMoney className="text-lg font-thin" />,
      content: <AllExpenses />,
      isDisabled: false,
    },
  ];
  return (
    <>
      <Header showLocationSelector={false} />
      <div className="flex flex-col gap-2 mt-5 ">
        <TabPanel
          key={i18n.language}
          tabs={tabs?.map((tab) => ({
            ...tab,
            number: tab.number - tabs?.filter((t) => t?.isDisabled)?.length,
          }))}
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
