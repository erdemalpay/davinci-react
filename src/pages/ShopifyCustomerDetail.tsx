import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { MdOutlineAccountCircle, MdOutlineShoppingCart } from "react-icons/md";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Select from "react-select";
import ShopifyCustomerOrders from "../components/consumer/ShopifyCustomerOrders";
import ShopifyCustomerSummary from "../components/consumer/ShopifyCustomerSummary";
import { Header } from "../components/header/Header";
import PageNavigator from "../components/panelComponents/PageNavigator/PageNavigator";
import UnifiedTabPanel from "../components/panelComponents/TabPanel/UnifiedTabPanel";
import { useGeneralContext } from "../context/General.context";
import { Routes } from "../navigation/constants";
import { ShopifyAdminCustomer } from "../types";
import { useGetShopifyCustomerById, useGetShopifyCustomers } from "../utils/api/shopify";

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
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [dropdownSearch, setDropdownSearch] = useState("");
  const { setCurrentPage, setSearchQuery, setSortConfigKey } = useGeneralContext();
  const location = useLocation();
  const { customerId } = useParams<{ customerId: string }>();

  // Capture on mount — UnifiedTabPanel does a replace navigate to add ?tab=
  // which clears location.state, so we freeze it in component state.
  const [stateCustomer] = useState<ShopifyAdminCustomer | undefined>(
    (location.state as { customer?: ShopifyAdminCustomer } | null)?.customer
  );

  const stateCustomerMatchesRoute =
    stateCustomer?.id.split("/").pop() === customerId;

  const fetchedCustomer = useGetShopifyCustomerById(
    stateCustomerMatchesRoute ? undefined : customerId
  );
  const customer = stateCustomerMatchesRoute ? stateCustomer : fetchedCustomer;

  const searchResult = useGetShopifyCustomers(1, 20, dropdownSearch || undefined);
  const customerOptions = useMemo(
    () =>
      (searchResult?.data ?? []).map((c) => ({
        value: c.id.split("/").pop() ?? c.id,
        label: `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim() || c.defaultEmailAddress?.emailAddress || c.id,
      })),
    [searchResult]
  );

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
        <div className="w-[95%] mx-auto">
          <div className="sm:w-1/4">
            <Select
              options={customerOptions}
              value={
                customer
                  ? {
                      value: customer.id.split("/").pop() ?? customer.id,
                      label: customerName,
                    }
                  : null
              }
              onInputChange={(val) => setDropdownSearch(val)}
              filterOption={() => true}
              onChange={(selected) => {
                if (!selected) return;
                setCurrentPage(1);
                setSearchQuery("");
                setSortConfigKey(null);
                navigate(`/shopify-customer/${selected.value}`);
              }}
              placeholder={t("Select a customer")}
              styles={{
                control: (base) => ({
                  ...base,
                  border: "1px solid #E2E8F0",
                  borderRadius: "4px",
                }),
                option: (base, state) => ({
                  ...base,
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  color: "#4B5563",
                  cursor: "pointer",
                  backgroundColor: state.isSelected ? "#EDF7FF" : base.backgroundColor,
                }),
                placeholder: (base) => ({
                  ...base,
                  color: "#b0b5ba",
                  fontSize: "14px",
                  fontWeight: 400,
                }),
                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
              }}
              menuPosition="fixed"
            />
          </div>
        </div>
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
