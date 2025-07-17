import { FaLayerGroup } from "react-icons/fa";
import { FaFileInvoiceDollar } from "react-icons/fa6";
import { GrMoney } from "react-icons/gr";
import { LuWallet } from "react-icons/lu";
import { MdOutlineLocalLaundryService, MdPayments } from "react-icons/md";
import AddVendorPayment from "../components/accounting/AddVendorPayment";
import AllExpenses from "../components/accounting/AllExpenses";
import Invoice from "../components/accounting/Invoice";
import ServiceInvoice from "../components/accounting/ServiceInvoice";
import BulkExpenseCreate from "../components/expense/BulkExpenseCreate";
import VendorPayment from "../components/expense/VendorPayment";
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
  {
    number: ExpensesPageTabEnum.VENDORPAYMENTS,
    label: "Vendor Payments",
    icon: <MdPayments className="text-lg font-thin" />,
    content: <VendorPayment />,
    isDisabled: false,
  },
  {
    number: ExpensesPageTabEnum.ADDVENDORPAYMENT,
    label: "Add Vendor Payment",
    icon: <LuWallet className="text-lg font-thin" />,
    content: <AddVendorPayment />,
    isDisabled: false,
  },
  {
    number: ExpensesPageTabEnum.BULKEXPENSECREATE,
    label: "Bulk Stock Expense Create",
    icon: <FaLayerGroup className="text-lg font-thin" />,
    content: <BulkExpenseCreate />,
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
