import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { MdOutlineAccountCircle, MdOutlineShoppingCart } from "react-icons/md";
import { useLocation, useParams } from "react-router-dom";
import ShopifyCustomerOrders from "../components/consumer/ShopifyCustomerOrders";
import ShopifyCustomerSummary from "../components/consumer/ShopifyCustomerSummary";
import { Header } from "../components/header/Header";
import PageNavigator from "../components/panelComponents/PageNavigator/PageNavigator";
import UnifiedTabPanel from "../components/panelComponents/TabPanel/UnifiedTabPanel";
import { useGeneralContext } from "../context/General.context";
import { Routes } from "../navigation/constants";
import { ShopifyAdminCustomer } from "../types";
import { useGetShopifyCustomerById } from "../utils/api/shopify";

export const ShopifyCustomerDetailPageTabs = [
  {
    number: 0,
    label: "Customer Summary",
    icon: <MdOutlineAccountCircle className="text-lg font-thin" />,
    content: <ShopifyCustomerSummary />,
    isDisabled: false,
  },
  {
    number: 1,
    label: "Orders",
    icon: <MdOutlineShoppingCart className="text-lg font-thin" />,
    content: <ShopifyCustomerOrders />,
    isDisabled: false,
  },
];

export default function ShopifyCustomerDetail() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(0);
  const { setCurrentPage, setSearchQuery, setSortConfigKey } = useGeneralContext();
  const location = useLocation();
  const { customerId } = useParams<{ customerId: string }>();

  // Capture on mount — UnifiedTabPanel does a replace navigate to add ?tab=
  // which clears location.state, so we freeze it in component state.
  const [stateCustomer] = useState<ShopifyAdminCustomer | undefined>(
    (location.state as { customer?: ShopifyAdminCustomer } | null)?.customer
  );

  const fetchedCustomer = useGetShopifyCustomerById(stateCustomer ? undefined : customerId);
  const customer = stateCustomer ?? fetchedCustomer;

  const customerName = customer
    ? `${customer.firstName ?? ""} ${customer.lastName ?? ""}`.trim() || "-"
    : "-";

  const pageNavigations = useMemo(
    () => [
      {
        name: t("Shopify Customers"),
        path: Routes.Consumers,
        canBeClicked: true,
        additionalSubmitFunction: () => {
          setCurrentPage(1);
          setSortConfigKey(null);
          setSearchQuery("");
        },
      },
      {
        name: customerName,
        path: "",
        canBeClicked: false,
      },
    ],
    [t, customerName, setCurrentPage, setSearchQuery, setSortConfigKey]
  );

  const tabs = useMemo(
    () => [
      {
        number: 0,
        label: t("Orders"),
        icon: <MdOutlineShoppingCart className="text-lg font-thin" />,
        content: <ShopifyCustomerOrders customer={customer} />,
        isDisabled: false,
      },
      {
        number: 1,
        label: t("Customer Summary"),
        icon: <MdOutlineAccountCircle className="text-lg font-thin" />,
        content: <ShopifyCustomerSummary customer={customer} />,
        isDisabled: false,
      },
    ],
    [t, customer]
  );

  return (
    <>
      <Header showLocationSelector={false} />
      <PageNavigator navigations={pageNavigations} />
      <div className="flex flex-col gap-4 mt-5">
        <UnifiedTabPanel
          tabs={tabs}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          additionalOpenAction={() => {
            setCurrentPage(1);
            setSearchQuery("");
          }}
          allowOrientationToggle={true}
        />
      </div>
    </>
  );
}
