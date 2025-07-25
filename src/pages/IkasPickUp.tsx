import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  MdOutlineCheckBox,
  MdOutlineCheckBoxOutlineBlank,
} from "react-icons/md";
import { Header } from "../components/header/Header";
import GenericTable from "../components/panelComponents/Tables/GenericTable";
import SwitchButton from "../components/panelComponents/common/SwitchButton";
import { InputTypes } from "../components/panelComponents/shared/types";
import { useOrderContext } from "../context/Order.context";
import { useUserContext } from "../context/User.context";
import {
  DateRangeKey,
  OrderStatus,
  Table,
  commonDateOptions,
  orderFilterStatusOptions,
} from "../types";
import { dateRanges } from "../utils/api/dateRanges";
import { useGetAllLocations } from "../utils/api/location";
import { useGetCategories } from "../utils/api/menu/category";
import { useGetMenuItems } from "../utils/api/menu/menu-item";
import {
  useGetIkasPickUpOrders,
  useOrderMutations,
} from "../utils/api/order/order";
import { useGetUsers } from "../utils/api/user";
import { getItem } from "../utils/getItem";
import { LocationInput } from "../utils/panelInputs";

const IkasPickUp = () => {
  const { t } = useTranslation();
  const orders = useGetIkasPickUpOrders();
  const locations = useGetAllLocations();
  const users = useGetUsers();
  const { user } = useUserContext();
  const categories = useGetCategories();
  const { updateOrder } = useOrderMutations();
  const items = useGetMenuItems();
  const [tableKey, setTableKey] = useState(0);
  const {
    ikasPickUpFilterPanelFormElements,
    setIkasPickUpFilterPanelFormElements,
    initialIkasPickUpFilterPanelFormElements,
    showOrderDataFilters,
    setShowOrderDataFilters,
    showPickedOrders,
    setShowPickedOrders,
  } = useOrderContext();
  const allRows = orders
    ?.filter((order) => {
      if (!order || !order?.createdAt) {
        return false;
      }
      if (
        order?.ikasId !== null &&
        order?.ikasId !== undefined &&
        order?.ikasId !== "" &&
        order?.ikasCustomer &&
        order?.status !== OrderStatus.CANCELLED
      ) {
        if (!showPickedOrders) {
          return !order?.isIkasCustomerPicked;
        }
        return true;
      }
    })
    ?.map((order) => {
      const createHour = format(order.createdAt, "HH:mm") ?? "";
      const deliveryHour =
        order?.deliveredAt && order?.deliveredAt !== order?.createdAt
          ? format(order?.deliveredAt, "HH:mm")
          : "";
      return {
        ...order,
        isReturned: order?.isReturned,
        date: format(order.createdAt, "yyyy-MM-dd"),
        formattedDate: format(order.createdAt, "dd-MM-yyyy"),
        createdAt: createHour,
        deliveredBy: getItem(order?.deliveredBy, users)?.name ?? "",
        deliveredByUserId: order?.deliveredBy ?? "",
        deliveredAt: deliveryHour !== createHour ? deliveryHour : "",
        item: getItem(order?.item, items)?.name ?? "",
        location: getItem(order?.ikasCustomer?.location, locations)?.name ?? "",
        locationId: order?.ikasCustomer?.location ?? "",
        quantity: order?.quantity ?? "",
        tableId: (order?.table as Table)?._id ?? "",
        tableName: (order?.table as Table)?.name ?? "",
        amount: order?.unitPrice * order?.quantity,
        note: order?.note ?? "",
        ikasId: order?.ikasId,
        customerFirstName: order?.ikasCustomer?.firstName ?? "",
        customerLastName: order?.ikasCustomer?.lastName ?? "",
        customerEmail: order?.ikasCustomer?.email ?? "",
        customerPhone: order?.ikasCustomer?.phone ?? "",
        statusLabel: orderFilterStatusOptions.find(
          (status) => status.value === order?.status
        )?.label,
        isIkasCustomerPicked: order?.isIkasCustomerPicked ?? false,
      };
    });
  const [rows, setRows] = useState(allRows);
  const columns = [
    { key: t("Date"), isSortable: true, correspondingKey: "formattedDate" },
    {
      key: t("Created At"),
      isSortable: true,
      correspondingKey: "createdAt",
    },
    { key: t("Name"), isSortable: true, correspondingKey: "customerFirstName" },
    {
      key: t("Last Name"),
      isSortable: true,
      correspondingKey: "customerLastName",
    },
    { key: "Email", isSortable: true, correspondingKey: "customerEmail" },
    { key: t("Phone"), isSortable: true, correspondingKey: "customerPhone" },
    { key: t("Product"), isSortable: true, correspondingKey: "item" },
    { key: t("Quantity"), isSortable: true, correspondingKey: "quantity" },
    { key: t("Amount"), isSortable: true, correspondingKey: "amount" },
    { key: t("Location"), isSortable: true, correspondingKey: "location" },
    {
      key: t("Delivered By"),
      isSortable: true,
      correspondingKey: "deliveredBy",
    },
    {
      key: t("Delivered At"),
      isSortable: true,
      correspondingKey: "deliveredAt",
    },
    { key: t("Action"), isSortable: false },
  ];
  const rowKeys = [
    {
      key: "date",
      node: (row: any) => {
        return (
          <p className={`${row?.className} min-w-32 pr-2`}>
            {row.formattedDate}
          </p>
        );
      },
    },
    { key: "createdAt" },
    { key: "customerFirstName", className: "min-w-32 pr-2" },
    { key: "customerLastName", className: "min-w-32 pr-2" },
    { key: "customerEmail", className: "min-w-32 pr-2" },
    { key: "customerPhone", className: "min-w-32 pr-2" },
    { key: "item", className: "min-w-40 pr-2" },
    {
      key: "quantity",
      node: (row: any) => {
        return (
          <p
            className={`min-w-32 pr-2 ${row.className}`}
            key={row._id + "quantity"}
          >
            {row.quantity}
          </p>
        );
      },
    },
    {
      key: "amount",
      node: (row: any) => (
        <p
          className={`min-w-32 pr-2 ${row.className}`}
          key={row._id + "amount"}
        >
          {row.amount} ₺
        </p>
      ),
    },
    { key: "location" },
    { key: "deliveredBy" },
    { key: "deliveredAt" },
    {
      key: "isIkasCustomerPicked",
      node: (row: any) => {
        return row?.isIkasCustomerPicked ? (
          <MdOutlineCheckBox
            id="ikas-pickup-checkbox"
            key={row._id + "ikas-pickup-checkbox"}
            className="my-auto mx-auto text-2xl cursor-pointer hover:scale-105"
            onClick={() => {
              updateOrder({
                id: row._id,
                updates: {
                  isIkasCustomerPicked: false,
                },
              });
            }}
          />
        ) : (
          <MdOutlineCheckBoxOutlineBlank
            id="ikas-pickup-checkbox"
            key={row._id + "ikas-pickup-checkbox"}
            className="my-auto mx-auto text-2xl cursor-pointer hover:scale-105"
            onClick={() => {
              updateOrder({
                id: row._id,
                updates: {
                  isIkasCustomerPicked: true,
                  deliveredAt: new Date(),
                  deliveredBy: user?._id,
                },
              });
            }}
          />
        );
      },
    },
  ];
  const filterPanelInputs = [
    LocationInput({
      locations: locations,
      required: true,
      isMultiple: true,
    }),
    {
      type: InputTypes.SELECT,
      formKey: "date",
      label: t("Date"),
      options: commonDateOptions.map((option) => {
        return {
          value: option.value,
          label: t(option.label),
        };
      }),
      placeholder: t("Date"),
      required: true,
      additionalOnChange: ({
        value,
        label,
      }: {
        value: string;
        label: string;
      }) => {
        const dateRange = dateRanges[value as DateRangeKey];
        if (dateRange) {
          setIkasPickUpFilterPanelFormElements({
            ...ikasPickUpFilterPanelFormElements,
            ...dateRange(),
          });
        }
      },
    },
    {
      type: InputTypes.DATE,
      formKey: "after",
      label: t("Start Date"),
      placeholder: t("Start Date"),
      required: true,
      isDatePicker: true,
      invalidateKeys: [{ key: "date", defaultValue: "" }],
      isOnClearActive: false,
    },
    {
      type: InputTypes.DATE,
      formKey: "before",
      label: t("End Date"),
      placeholder: t("End Date"),
      required: true,
      isDatePicker: true,
      invalidateKeys: [{ key: "date", defaultValue: "" }],
      isOnClearActive: false,
    },
    {
      type: InputTypes.SELECT,
      formKey: "category",
      label: t("Category"),
      options: categories?.map((category) => {
        return {
          value: category?._id,
          label: category?.name,
        };
      }),
      isMultiple: true,
      placeholder: t("Category"),
      required: true,
    },
    {
      type: InputTypes.SELECT,
      formKey: "createdBy",
      label: t("Created By"),
      options: users
        ?.filter((user) => user.active)
        ?.map((user) => ({
          value: user._id,
          label: user.name,
        })),
      placeholder: t("Created By"),
      required: true,
    },
    {
      type: InputTypes.SELECT,
      formKey: "preparedBy",
      label: t("Prepared By"),
      options: users
        ?.filter((user) => user.active)
        ?.map((user) => ({
          value: user._id,
          label: user.name,
        })),
      placeholder: t("Prepared By"),
      required: true,
    },
    {
      type: InputTypes.SELECT,
      formKey: "deliveredBy",
      label: t("Delivered By"),
      options: users
        ?.filter((user) => user.active)
        ?.map((user) => ({
          value: user._id,
          label: user.name,
        })),
      placeholder: t("Delivered By"),
      required: true,
    },
  ];
  const filterPanel = {
    isFilterPanelActive: showOrderDataFilters,
    inputs: filterPanelInputs,
    formElements: ikasPickUpFilterPanelFormElements,
    setFormElements: setIkasPickUpFilterPanelFormElements,
    closeFilters: () => setShowOrderDataFilters(false),
    additionalFilterCleanFunction: () => {
      setIkasPickUpFilterPanelFormElements(
        initialIkasPickUpFilterPanelFormElements
      );
    },
  };
  const filters = [
    {
      label: t("Show Picked Orders"),
      isUpperSide: true,
      node: (
        <SwitchButton
          checked={showPickedOrders}
          onChange={() => {
            setShowPickedOrders(!showPickedOrders);
          }}
        />
      ),
    },
    {
      label: t("Show Filters"),
      isUpperSide: true,
      node: (
        <SwitchButton
          checked={showOrderDataFilters}
          onChange={() => {
            setShowOrderDataFilters(!showOrderDataFilters);
          }}
        />
      ),
    },
  ];

  useEffect(() => {
    setRows(allRows);
    setTableKey((prev) => prev + 1);
  }, [
    orders,
    locations,
    users,
    items,
    categories,
    showPickedOrders,
    showOrderDataFilters,
  ]);
  return (
    <>
      <Header showLocationSelector={false} />
      <div className="flex flex-col gap-2 mt-5 ">
        <div className="w-[95%] mx-auto mb-auto ">
          <GenericTable
            key={tableKey}
            title={t("Ikas Pick Up")}
            columns={columns}
            rowKeys={rowKeys as any}
            rows={rows}
            isActionsActive={false}
            filterPanel={filterPanel}
            filters={filters}
            isExcel={true}
            excelFileName={"IkasPickUp.xlsx"}
            rowClassNameFunction={(row: any) => {
              if (row?.isReturned) {
                return "bg-red-200";
              }
              return "";
            }}
          />
        </div>
      </div>
    </>
  );
};

export default IkasPickUp;
