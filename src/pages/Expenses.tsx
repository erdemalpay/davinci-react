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
import { useUserContext } from "../context/User.context";
import { ExpensesPageTabEnum } from "../types";
import { useGetPanelControlPages } from "../utils/api/panelControl/page";
export const ExpensePageTabs = [
  {
    number: ExpensesPageTabEnum.INVOICE,
    label: "Product Expenses",
    icon: <FaFileInvoiceDollar className="text-lg font-thin" />,
    content: <Invoice />,
    isDisabled: false,
  },
  {
    number: ExpensesPageTabEnum.FIXTUREINVOICE,
    label: "Fixture Expenses",
    icon: <GiAnchor className="text-lg font-thin" />,
    content: <FixtureInvoice />,
    isDisabled: false,
  },
  {
    number: ExpensesPageTabEnum.SERVICEINVOICE,
    label: "Service Expenses",
    icon: <MdOutlineLocalLaundryService className="text-lg font-thin" />,
    content: <ServiceInvoice />,
    isDisabled: false,
  },
  {
    number: ExpensesPageTabEnum.ALLEXPENSES,
    label: "All Expenses",
    icon: <GrMoney className="text-lg font-thin" />,
    content: <AllExpenses />,
    isDisabled: false,
  },
];
export default function Expenses() {
  const {
    setCurrentPage,
    setSearchQuery,
    expensesActiveTab,
    setExpensesActiveTab,
  } = useGeneralContext();
  const currentPageId = "expenses";
  const pages = useGetPanelControlPages();
  const { user } = useUserContext();
  if (!user || pages.length === 0) return <></>;
  const currentPageTabs = pages.find(
    (page) => page._id === currentPageId
  )?.tabs;
  const tabs = ExpensePageTabs.map((tab) => {
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
      <div className="flex flex-col gap-2 mt-5 ">
        <TabPanel
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
