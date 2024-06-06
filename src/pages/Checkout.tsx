import { useTranslation } from "react-i18next";
import { GiMoneyStack, GiPayMoney, GiReceiveMoney } from "react-icons/gi";
import { IoCashOutline } from "react-icons/io5";
import Cashout from "../components/checkout/Cashout";
import CheckoutControlPage from "../components/checkout/CheckoutControl";
import Expense from "../components/checkout/Expense";
import Income from "../components/checkout/Income";
import { Header } from "../components/header/Header";
import TabPanel from "../components/panelComponents/TabPanel/TabPanel";
import { useGeneralContext } from "../context/General.context";
import { CheckoutPageTabEnum } from "../types";

export default function Checkout() {
  const { t, i18n } = useTranslation();
  const {
    setCurrentPage,
    setSearchQuery,
    checkoutActiveTab,
    setCheckoutActiveTab,
    setSortConfigKey,
  } = useGeneralContext();

  const tabs = [
    {
      number: CheckoutPageTabEnum.INCOME,
      label: t("Income"),
      icon: <GiReceiveMoney className="text-lg font-thin" />,
      content: <Income />,
      isDisabled: false,
    },
    {
      number: CheckoutPageTabEnum.EXPENSE,
      label: t("Expense"),
      icon: <GiPayMoney className="text-lg font-thin" />,
      content: <Expense />,
      isDisabled: false,
    },
    {
      number: CheckoutPageTabEnum.CASHOUT,
      label: t("Cashout"),
      icon: <IoCashOutline className="text-lg font-thin" />,
      content: <Cashout />,
      isDisabled: false,
    },
    {
      number: CheckoutPageTabEnum.CHECKOUTCONTROL,
      label: t("Checkout Control"),
      icon: <GiMoneyStack className="text-lg font-thin" />,
      content: <CheckoutControlPage />,
      isDisabled: false,
    },
  ];

  return (
    <>
      <Header showLocationSelector={false} />
      <TabPanel
        key={i18n.language}
        tabs={tabs}
        activeTab={checkoutActiveTab}
        setActiveTab={setCheckoutActiveTab}
        additionalOpenAction={() => {
          setCurrentPage(1);
          setSearchQuery("");
          setSortConfigKey(null);
        }}
      />
    </>
  );
}
