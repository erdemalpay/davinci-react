import { subDays } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import { CheckSwitch } from "../components/common/CheckSwitch";
import { DateInput } from "../components/common/DateInput2";
import { Header } from "../components/header/Header";
import KitchenMenuPage from "../components/menu/KitchenMenuPage";
import SingleOrdersPage from "../components/orders/SingleOrdersPage";
import UnifiedTabPanel from "../components/panelComponents/TabPanel/UnifiedTabPanel";
import { useDataContext } from "../context/Data.context";
import { useGeneralContext } from "../context/General.context";
import { useOrderContext } from "../context/Order.context";
import { useUserContext } from "../context/User.context";
import {
  useGetAllCategories,
  useUpdateKitchenCategoryMutation,
} from "../utils/api/menu/category";
import { useGetGivenDateOrders } from "../utils/api/order/order";
import { useGetPanelControlPages } from "../utils/api/panelControl/page";
import { formatDate, parseDate } from "../utils/dateUtil";

type OrderTabType = {
  number: number;
  label: string;
  content: JSX.Element;
  isDisabled: boolean;
  kitchen: any;
};
function Orders() {
  const {
    setCurrentPage,
    setSearchQuery,
    ordersActiveTab,
    setOrdersActiveTab,
  } = useGeneralContext();
  const { t } = useTranslation();
  const currentPageId = "orders";
  const [tabPanelKey, setTabPanelKey] = useState(0);
  const { kitchens } = useDataContext();
  const pages = useGetPanelControlPages();
  const { user } = useUserContext();
  const { mutate: updateKitchenCategory } = useUpdateKitchenCategoryMutation();
  const categories = useGetAllCategories();
  const { todaysOrderDate, setTodaysOrderDate } = useOrderContext();
  const orders = useGetGivenDateOrders();
  const handleDecrementDate = (prevDate: string) => {
    const date = parseDate(prevDate);
    const newDate = subDays(date, 1);
    setTodaysOrderDate(formatDate(newDate));
  };
  const handleIncrementDate = (prevDate: string) => {
    const date = parseDate(prevDate);
    const newDate = new Date(date);
    newDate.setDate(date.getDate() + 1);
    setTodaysOrderDate(formatDate(newDate));
  };
  const [tabs, setTabs] = useState<OrderTabType[]>([]);
  useEffect(() => {
    if (!user || pages.length === 0 || !kitchens || !orders) return;
    const currentPageTabs = pages.find(
      (page) => page._id === currentPageId
    )?.tabs;

    const orderTabs = [
      ...(kitchens?.map((kitchen, index) => ({
        number: index,
        label: kitchen.name,
        content: <SingleOrdersPage kitchen={kitchen} orders={orders} />,
        isDisabled: false,
        kitchen: kitchen,
      })) ?? []),
      ...(categories ?? [])
        .filter((cat) => cat?.isKitchenMenu)
        .map((category, index) => ({
          number: (kitchens?.length ?? 0) + index,
          label: category.name + " " + "Menu",
          content: (
            <KitchenMenuPage
              categoryId={category._id}
              categoryName={category.name}
            />
          ),
          isDisabled: false,
          kitchen: null,
        })),
    ];
    const filteredTabs = orderTabs
      ?.filter((tab) =>
        currentPageTabs
          ?.find((item) => item.name === tab.label)
          ?.permissionRoles?.includes(user.role._id)
      )
      ?.map((tab, index) => ({
        ...tab,
        number: index,
      }));
    setTabs(filteredTabs ?? []);
    setTabPanelKey((prev) => prev + 1);
  }, [orders, kitchens, pages, user, todaysOrderDate]);
  const allowedLocations = useMemo(() => {
    return (
      tabs.find((tab) => tab.number === ordersActiveTab)?.kitchen?.locations ||
      []
    );
  }, [ordersActiveTab, tabs, categories]);
  const tabPanelFilters = [
    <div
      key={"tabPanelFilters"}
      className="flex flex-row gap-4 items-center ml-auto"
    >
      {kitchens &&
        kitchens.map((kitchen, index) => {
          if (
            kitchen?.selectedUsers &&
            kitchen.selectedUsers.includes(user?._id as string)
          ) {
            const foundCategory = categories?.find(
              (cat) => cat?.isKitchenMenu && cat.kitchen === kitchen._id
            );
            if (!foundCategory) return null;
            return (
              <div
                key={kitchen._id || index}
                className="flex flex-row items-center gap-2"
              >
                <p className="font-medium text-md">
                  {kitchen.name + " " + t("Activity")}
                </p>
                <CheckSwitch
                  checked={foundCategory?.active ?? false}
                  onChange={() => {
                    updateKitchenCategory({
                      id: foundCategory._id,
                      updates: {
                        active: !foundCategory?.active,
                      },
                    });
                  }}
                />
              </div>
            );
          }
          return null;
        })}
      <div className="flex flex-row items-center w-fit ml-auto text-3xl  ">
        <IoIosArrowBack
          className="text-xl"
          onClick={() => {
            handleDecrementDate(todaysOrderDate ?? "");
          }}
        />
        <DateInput
          date={parseDate(todaysOrderDate)}
          setDate={setTodaysOrderDate}
        />
        <IoIosArrowForward
          className="text-xl"
          onClick={() => {
            handleIncrementDate(todaysOrderDate ?? "");
          }}
        />
      </div>
    </div>,
  ];
  return (
    <>
      <Header showLocationSelector={true} allowedLocations={allowedLocations} />
      <UnifiedTabPanel
        key={tabPanelKey}
        tabs={tabs ?? []}
        activeTab={ordersActiveTab}
        filters={tabPanelFilters}
        setActiveTab={setOrdersActiveTab}
        additionalOpenAction={() => {
          setCurrentPage(1);
          setSearchQuery("");
        }}
        allowOrientationToggle={true}
        injectOrientationToggleToFilters={true}
        disableLanguageChange={true}
      />
    </>
  );
}

export default Orders;
