import { subDays } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import SwitchButton from "../components/panelComponents/common/SwitchButton";
import { DateInput } from "../components/common/DateInput2";
import { Header } from "../components/header/Header";
import KitchenMenuPage from "../components/menu/KitchenMenuPage";
import SingleOrdersPage from "../components/orders/SingleOrdersPage";
import UnifiedTabPanel from "../components/panelComponents/TabPanel/UnifiedTabPanel";
import { useDataContext } from "../context/Data.context";
import { useGeneralContext } from "../context/General.context";
import { useLocationContext } from "../context/Location.context";
import { useOrderContext } from "../context/Order.context";
import { useUserContext } from "../context/User.context";
import {
  useGetAllCategories,
  useUpdateKitchenCategoryMutation,
} from "../utils/api/menu/category";
import { useKitchenMutations } from "../utils/api/menu/kitchen";
import { useGetGivenDateOrders } from "../utils/api/order/order";
import { useGetPanelControlPages } from "../utils/api/panelControl/page";
import { useGetDisabledConditions } from "../utils/api/panelControl/disabledCondition";
import { MinimalUser } from "../utils/api/user";
import { formatDate, parseDate } from "../utils/dateUtil";
import { getItem } from "../utils/getItem";
import { isActionDisabled } from "../utils/permissions";
import { ActionEnum, DisabledConditionEnum } from "../types";

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
  const { kitchens, users = [], visits = [] } = useDataContext();
  const pages = useGetPanelControlPages();
  const { user } = useUserContext();
  const { selectedLocationId } = useLocationContext();
  const { mutate: updateKitchenCategory } = useUpdateKitchenCategoryMutation();
  const { updateKitchen } = useKitchenMutations();
  const categories = useGetAllCategories();
  const { todaysOrderDate, setTodaysOrderDate } = useOrderContext();
  const orders = useGetGivenDateOrders();
  const disabledConditions = useGetDisabledConditions();
  const [selectedActionUser, setSelectedActionUser] =
    useState<MinimalUser | null>(null);
  const currentActionUser = selectedActionUser || user;
  const actionUserOptions = useMemo(() => {
    const activeVisitUsers = (visits ?? [])
      .filter(
        (visit) => !visit?.finishHour && visit.location === selectedLocationId
      )
      .map((visit) => getItem(visit.user, users))
      .filter((u): u is MinimalUser => u !== undefined);
    return user
      ? [user, ...activeVisitUsers.filter((u) => u._id !== user._id)]
      : activeVisitUsers;
  }, [visits, users, selectedLocationId, user]);
  const ordersOrdersDisabledCondition = useMemo(() => {
    return getItem(DisabledConditionEnum.ORDERS_ORDERS, disabledConditions);
  }, [disabledConditions]);
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
        content: (
          <SingleOrdersPage
            kitchen={kitchen} orders={orders} actionUser={currentActionUser ?? user} />
        ),
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
  }, [orders, kitchens, pages, user, todaysOrderDate, currentActionUser]);
  useEffect(() => {
    setTabPanelKey((prev) => prev + 1);
  }, [kitchens, pages, user, todaysOrderDate]);
  const allowedLocations = useMemo(() => {
    return (
      tabs.find((tab) => tab.number === ordersActiveTab)?.kitchen?.locations ||
      []
    );
  }, [ordersActiveTab, tabs, categories]);
  const activeKitchen = tabs.find((tab) => tab.number === ordersActiveTab)?.kitchen;

  const tabPanelFilters = [
    <div
      key={"tabPanelFilters"}
      className="flex flex-row gap-4 items-center ml-auto"
    >
      {activeKitchen &&
        !isActionDisabled(ordersOrdersDisabledCondition, ActionEnum.AUTO_PRINT, user) && (
          <div className="flex flex-row items-center gap-2">
            <p className="font-medium text-md">{t("Auto Print")}</p>
            <SwitchButton
              checked={activeKitchen.isPrintEnabled ?? false}
              onChange={() => {
                updateKitchen({
                  id: activeKitchen._id,
                  updates: { isPrintEnabled: !activeKitchen.isPrintEnabled },
                });
              }}
            />
          </div>
        )}
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
                <SwitchButton
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
      <div className="hidden sm:flex flex-row items-center w-fit ml-auto text-3xl  ">
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
      {actionUserOptions.length > 0 && (
        <div className="flex flex-row flex-wrap gap-2 px-4 py-2">
          {actionUserOptions.map((activeUser) => (
            <a
              key={activeUser._id}
              onClick={() => setSelectedActionUser(activeUser)}
              className={`px-4 py-2 rounded-lg focus:outline-none cursor-pointer font-medium border border-gray-300 ${
                activeUser._id === currentActionUser?._id
                  ? "bg-gray-200 hover:bg-gray-300 text-red-300 hover:text-red-500 shadow-md focus:outline-none"
                  : "bg-white hover:bg-gray-200 text-gray-600 hover:text-red-500"
              }`}
            >
              {activeUser.name}
            </a>
          ))}
        </div>
      )}
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
