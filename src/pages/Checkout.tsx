import { GiMoneyStack, GiPayMoney, GiReceiveMoney } from "react-icons/gi";
import { IoCashOutline } from "react-icons/io5";
import Cashout from "../components/checkout/Cashout";
import CheckoutControlPage from "../components/checkout/CheckoutControl";
import Expense from "../components/checkout/Expense";
import Income from "../components/checkout/Income";
import { Header } from "../components/header/Header";
import UnifiedTabPanel from "../components/panelComponents/TabPanel/UnifiedTabPanel";
import { useGeneralContext } from "../context/General.context";
import { useUserContext } from "../context/User.context";
import { CheckoutPageTabEnum } from "../types";
import { useGetPanelControlPages } from "../utils/api/panelControl/page";
export const CheckoutPageTabs = [
  {
    number: CheckoutPageTabEnum.INCOME,
    label: "Income",
    icon: <GiReceiveMoney className="text-lg font-thin" />,
    content: <Income />,
    isDisabled: false,
  },
  {
    number: CheckoutPageTabEnum.EXPENSE,
    label: "Expense",
    icon: <GiPayMoney className="text-lg font-thin" />,
    content: <Expense />,
    isDisabled: false,
  },
  {
    number: CheckoutPageTabEnum.CASHOUT,
    label: "Cashout",
    icon: <IoCashOutline className="text-lg font-thin" />,
    content: <Cashout />,
    isDisabled: false,
  },
  {
    number: CheckoutPageTabEnum.CHECKOUTCONTROL,
    label: "Checkout Control",
    icon: <GiMoneyStack className="text-lg font-thin" />,
    content: <CheckoutControlPage />,
    isDisabled: false,
  },
];
export default function Checkout() {
  const {
    setCurrentPage,
    setSearchQuery,
    checkoutActiveTab,
    setCheckoutActiveTab,
    setSortConfigKey,
  } = useGeneralContext();
  const currentPageId = "checkout";
  const pages = useGetPanelControlPages();
  const { user } = useUserContext();
  if (!user || pages.length === 0) return <></>;
  const currentPageTabs = pages.find(
    (page) => page._id === currentPageId
  )?.tabs;
  const tabs = CheckoutPageTabs.map((tab) => {
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
      <Header />
      <UnifiedTabPanel
        tabs={tabs}
        activeTab={checkoutActiveTab}
        setActiveTab={setCheckoutActiveTab}
        additionalOpenAction={() => {
          setCurrentPage(1);
          setSearchQuery("");
          setSortConfigKey(null);
        }}
        allowOrientationToggle={true}
      />
    </>
  );
}
