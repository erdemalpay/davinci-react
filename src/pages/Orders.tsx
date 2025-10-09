import { subDays } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import { CheckSwitch } from "../components/common/CheckSwitch";
import { DateInput } from "../components/common/DateInput2";
import { Header } from "../components/header/Header";
import FarmMenu from "../components/menu/FarmMenu";
import KovadaPilavMenu from "../components/menu/KovadaPilavMenu";
import SingleOrdersPage from "../components/orders/SingleOrdersPage";
import TabPanel from "../components/panelComponents/TabPanel/TabPanel";
import { useGeneralContext } from "../context/General.context";
import { useOrderContext } from "../context/Order.context";
import { useUserContext } from "../context/User.context";
import {
  FARMBURGERCATEGORYID,
  KOVADAPILAVCATEGORYID,
  RoleEnum,
} from "../types";
import {
  useGetCategories,
  useUpdateFarmCategoryMutation,
} from "../utils/api/menu/category";
import { useGetKitchens } from "../utils/api/menu/kitchen";
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
  const kitchens = useGetKitchens();
  const pages = useGetPanelControlPages();
  const { user } = useUserContext();
  const { mutate: updateFarmCategory } = useUpdateFarmCategoryMutation();
  const categories = useGetCategories();
  const { todaysOrderDate, setTodaysOrderDate } = useOrderContext();
  const orders = useGetGivenDateOrders();
  const handleDecrementDate = (prevDate: string) => {
    const date = parseDate(prevDate);
    const newDate = subDays(date, 1);
    setTodaysOrderDate(formatDate(newDate));
  };

  const farmBurgerCategory = useMemo(() => {
    return categories?.find(
      (category) => category._id === FARMBURGERCATEGORYID
    );
  }, [categories, FARMBURGERCATEGORYID]);
  const kovadaPilavCategory = useMemo(() => {
    return categories?.find(
      (category) => category._id === KOVADAPILAVCATEGORYID
    );
  }, [categories, KOVADAPILAVCATEGORYID]);
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
      {
        number: kitchens?.length ?? 0,
        label: "Farm Menu",
        content: <FarmMenu />,
        isDisabled: false,
        kitchen: null,
      },
      {
        number: (kitchens?.length ?? 0) + 1,
        label: "Kovada Pilav Menu",
        content: <KovadaPilavMenu />,
        isDisabled: false,
        kitchen: null,
      },
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
      {user?.role?._id === RoleEnum.KITCHEN2 && (
        <div className="flex flex-row items-center gap-2">
          <p className="font-medium text-md">{t("Farm Burger Activity")}</p>
          <CheckSwitch
            checked={farmBurgerCategory?.active ?? false}
            onChange={() => {
              updateFarmCategory({
                id: FARMBURGERCATEGORYID,
                updates: {
                  active: !farmBurgerCategory?.active,
                },
              });
            }}
          />
        </div>
      )}
      {user?.role?._id === RoleEnum.KITCHEN3 && (
        <div className="flex flex-row items-center gap-2">
          <p className="font-medium text-md">{t("Kovada Pilav Activity")}</p>
          <CheckSwitch
            checked={kovadaPilavCategory?.active ?? false}
            onChange={() => {
              updateFarmCategory({
                id: KOVADAPILAVCATEGORYID,
                updates: {
                  active: !kovadaPilavCategory?.active,
                },
              });
            }}
          />
        </div>
      )}
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
      <TabPanel
        key={tabPanelKey}
        tabs={tabs ?? []}
        activeTab={ordersActiveTab}
        filters={tabPanelFilters}
        setActiveTab={setOrdersActiveTab}
        additionalOpenAction={() => {
          setCurrentPage(1);
          setSearchQuery("");
        }}
      />
    </>
  );
}

export default Orders;
