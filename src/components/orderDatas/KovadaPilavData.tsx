import { useQueryClient } from "@tanstack/react-query";
import { differenceInMinutes, format } from "date-fns";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useGeneralContext } from "../../context/General.context";
import { useOrderContext } from "../../context/Order.context";
import {
  DateRangeKey,
  KOVADAPILAVCATEGORYID,
  RoleEnum,
  Table,
  commonDateOptions,
  orderFilterStatusOptions,
} from "../../types";
import { dateRanges } from "../../utils/api/dateRanges";
import { Paths } from "../../utils/api/factory";
import { useGetSellLocations } from "../../utils/api/location";
import { useGetAllCategories } from "../../utils/api/menu/category";
import { useGetMenuItems } from "../../utils/api/menu/menu-item";
import { useGetOrders } from "../../utils/api/order/order";
import { useGetOrderDiscounts } from "../../utils/api/order/orderDiscount";
import { useGetTables } from "../../utils/api/table";
import { useGetUser, useGetUsers } from "../../utils/api/user";
import { convertDateFormat, formatDateInTurkey } from "../../utils/format";
import { getItem } from "../../utils/getItem";
import { LocationInput } from "../../utils/panelInputs";
import OrderPaymentModal from "../orders/orderPayment/OrderPaymentModal";
import GenericTable from "../panelComponents/Tables/GenericTable";
import ButtonFilter from "../panelComponents/common/ButtonFilter";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { InputTypes } from "../panelComponents/shared/types";

const KovadaPilavData = () => {
  const { t } = useTranslation();
  const orders = useGetOrders([KOVADAPILAVCATEGORYID]);
  const sellLocations = useGetSellLocations();
  const queryClient = useQueryClient();
  const users = useGetUsers();
  const user = useGetUser();
  const categories = useGetAllCategories();
  const [rowToAction, setRowToAction] = useState<any>({});
  const discounts = useGetOrderDiscounts();
  const [isOrderPaymentModalOpen, setIsOrderPaymentModalOpen] = useState(false);
  const { setExpandedRows } = useGeneralContext();
  const { resetOrderContext } = useOrderContext();
  const tables = useGetTables();
  const items = useGetMenuItems();
  const [tableKey, setTableKey] = useState(0);
  const {
    filterPanelFormElements,
    setFilterPanelFormElements,
    initialFilterPanelFormElements,
    showOrderDataFilters,
    setShowOrderDataFilters,
  } = useOrderContext();
  if (!orders || !sellLocations || !users || !discounts) {
    return null;
  }
  const allRows = orders
    ?.filter(
      (order) =>
        !(
          order?.ikasId !== null &&
          order?.ikasId !== undefined &&
          order?.ikasId !== ""
        )
    )
    ?.map((order) => {
      if (!order || !order?.createdAt) {
        return null;
      }
      const confirmationTime = order?.confirmedAt
        ? differenceInMinutes(
            order?.confirmedAt ?? order?.createdAt,
            order?.createdAt
          )
        : 0;
      const preparationTime = order?.preparedAt
        ? differenceInMinutes(
            order?.preparedAt,
            order?.confirmedAt ?? order?.createdAt
          )
        : 0;
      const deliveryTime =
        order?.deliveredAt && order?.preparedAt
          ? differenceInMinutes(order?.deliveredAt, order?.preparedAt)
          : 0;
      return {
        _id: order?._id,
        isReturned: order?.isReturned,
        date: formatDateInTurkey(order.createdAt),
        formattedDate: convertDateFormat(format(order.createdAt, "yyyy-MM-dd")),
        createdBy: getItem(order?.createdBy, users)?.name ?? "",
        createdByUserId: order?.createdBy ?? "",
        createdAt: format(order.createdAt, "HH:mm") ?? "",
        preparedBy: getItem(order?.preparedBy, users)?.name ?? "",
        preparedByUserId: order?.preparedBy ?? "",
        confirmationTime: confirmationTime,
        preparationTime: preparationTime,
        cancelledBy: getItem(order?.cancelledBy, users)?.name ?? "",
        cancelledByUserId: order?.cancelledBy ?? "",
        cancelledAt: order?.cancelledAt
          ? format(order?.cancelledAt, "HH:mm")
          : "",
        deliveredBy: getItem(order?.deliveredBy, users)?.name ?? "",
        deliveredByUserId: order?.deliveredBy ?? "",
        deliveryTime: deliveryTime,
        totalTime: confirmationTime + preparationTime + deliveryTime,
        discountId: order?.discount ?? "",
        discountNote: order?.discountNote ?? "",
        discountAmount: order?.discountAmount
          ? order?.discountAmount
          : parseFloat(
              (
                (order?.unitPrice *
                  order?.quantity *
                  (order?.discountPercentage ?? 0)) /
                100
              ).toFixed(2)
            ),
        discountName:
          discounts?.find((discount) => discount?._id === order?.discount)
            ?.name ?? "",
        item: getItem(order?.item, items)?.name ?? "",
        location: getItem(order?.location, sellLocations)?.name ?? "",
        locationId: order?.location ?? "",
        quantity: order?.quantity ?? "",
        tableId: (order?.table as Table)?._id ?? "",
        tableName: (order?.table as Table)?.name ?? "",
        amount: order?.unitPrice * order?.quantity,
        note: order?.note ?? "",
        status: t(order?.status),
        paymentMethod: order?.paymentMethod,
        statusLabel: orderFilterStatusOptions.find(
          (status) => status.value === order?.status
        )?.label,
      };
    })
    ?.filter((item) => item !== null);
  const totalRow = {
    _id: "total",
    className: "font-semibold",
    isSortable: false,
    quantity: allRows?.reduce((acc, row: any) => acc + row.quantity, 0),
    amount: allRows?.reduce((acc, row: any) => acc + row.amount, 0),
    discountAmount: allRows?.reduce(
      (acc, row: any) => acc + row.discountAmount,
      0
    ),
    formattedDate: "Total",
  };
  allRows?.push(totalRow as any);
  const [rows, setRows] = useState(allRows);
  const columns = [
    { key: t("Date"), isSortable: true, correspondingKey: "formattedDate" },
    ...(user?.role?._id === RoleEnum.MANAGER
      ? [
          { key: t("Table Id"), isSortable: true, correspondingKey: "tableId" },
          {
            key: t("Table Name"),
            isSortable: true,
            correspondingKey: "tableName",
          },
        ]
      : []),
    { key: t("Product"), isSortable: true, correspondingKey: "item" },
    { key: t("Quantity"), isSortable: true, correspondingKey: "quantity" },
    ...(user?.role?._id === RoleEnum.MANAGER
      ? [{ key: t("Amount"), isSortable: true, correspondingKey: "amount" }]
      : []),

    {
      key: t("Discount"),
      isSortable: true,
      correspondingKey: "discountName",
    },

    {
      key: t("Discount Amount"),
      isSortable: true,
      correspondingKey: "discountAmount",
    },
    {
      key: t("Discount Note"),
      isSortable: true,
      correspondingKey: "discountNote",
    },
    { key: t("Note"), isSortable: true, correspondingKey: "note" },
    { key: t("Created At"), isSortable: true, correspondingKey: "createdAt" },
    { key: t("Created By"), isSortable: true, correspondingKey: "createdBy" },
    {
      key: t("Confirmed In"),
      isSortable: true,
      correspondingKey: "confirmationTime",
    },
    {
      key: t("Prepared In"),
      isSortable: true,
      correspondingKey: "preparationTime",
    },
    {
      key: t("Delivered In"),
      isSortable: true,
      correspondingKey: "deliveryTime",
    },
    {
      key: t("Total"),
      isSortable: true,
      correspondingKey: "totalTime",
    },
    {
      key: t("Cancelled At"),
      isSortable: true,
      correspondingKey: "cancelledAt",
    },
    {
      key: t("Cancelled By"),
      isSortable: true,
      correspondingKey: "cancelledBy",
    },
    { key: t("Location"), isSortable: true, correspondingKey: "location" },
    { key: t("Status"), isSortable: true, correspondingKey: "status" },
  ];
  const rowKeys = [
    {
      key: "date",
      node: (row: any) => {
        return <p className={`${row?.className} min-w-32 pr-2`}>{row.date}</p>;
      },
    },
    ...(user?.role?._id === RoleEnum.MANAGER
      ? [
          {
            key: "tableId",
            node: (row: any) => {
              return (
                <p
                  className="text-blue-700  w-fit  cursor-pointer hover:text-blue-500 transition-transform"
                  onClick={() => {
                    setRowToAction(row);
                    setIsOrderPaymentModalOpen(true);
                  }}
                >
                  {row.tableId}
                </p>
              );
            },
          },
          { key: "tableName", className: "min-w-40 pr-2" },
        ]
      : []),
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
    ...(user?.role?._id === RoleEnum.MANAGER
      ? [
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
        ]
      : []),
    { key: "discountName" },
    {
      key: "discountAmount",
      node: (row: any) => (
        <p
          className={`min-w-32 pr-2 ${row.className}`}
          key={row._id + "discountAmount"}
        >
          {Number(row.discountAmount) !== 0 && row?.discount
            ? row.discountAmount + "₺"
            : "-"}
        </p>
      ),
    },
    { key: "discountNote", className: "min-w-32 pr-2" },
    { key: "note", className: "min-w-32 pr-2" },
    { key: "createdAt" },
    { key: "createdBy" },
    {
      key: "confirmationTime",
      node: (row: any) => {
        return (
          <p className={`${row?.className} min-w-32 pr-2`}>
            {row.confirmationTime} dk
          </p>
        );
      },
    },
    {
      key: "preparationTime",
      node: (row: any) => {
        return (
          <p className={`${row?.className} min-w-32 pr-2`}>
            {row.preparationTime} dk
          </p>
        );
      },
    },
    {
      key: "deliveryTime",
      node: (row: any) => {
        return (
          <p className={`${row?.className} min-w-32 pr-2`}>
            {row.deliveryTime} dk
          </p>
        );
      },
    },
    {
      key: "totalTime",
      node: (row: any) => {
        return (
          <p className={`${row?.className} min-w-32 pr-2`}>
            {row.totalTime} dk
          </p>
        );
      },
    },
    { key: "cancelledAt" },
    { key: "cancelledBy" },
    { key: "location", className: "min-w-32 pr-2" },
    { key: "statusLabel", className: "min-w-32 pr-2" },
  ];
  const filterPanelInputs = [
    LocationInput({
      locations: sellLocations,
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
          setFilterPanelFormElements({
            ...filterPanelFormElements,
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
      formKey: "status",
      label: t("Status"),
      options: orderFilterStatusOptions.map((option) => {
        return {
          value: option.value,
          label: t(option.label),
        };
      }),
      placeholder: t("Status"),
      required: true,
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
      isDisabled: true,
    },
    {
      type: InputTypes.SELECT,
      formKey: "discount",
      label: t("Discount"),
      options: discounts.map((discount) => {
        return {
          value: discount._id,
          label: discount.name,
        };
      }),
      placeholder: t("Discount"),
      required: true,
    },
    {
      type: InputTypes.SELECT,
      formKey: "createdBy",
      label: t("Created By"),
      options: users
        .filter((user) => user.active)
        .map((user) => ({
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
        .filter((user) => user.active)
        .map((user) => ({
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
        .filter((user) => user.active)
        .map((user) => ({
          value: user._id,
          label: user.name,
        })),
      placeholder: t("Delivered By"),
      required: true,
    },
    {
      type: InputTypes.SELECT,
      formKey: "cancelledBy",
      label: t("Cancelled By"),
      options: users
        .filter((user) => user.active)
        .map((user) => ({
          value: user._id,
          label: user.name,
        })),
      placeholder: t("Cancelled By"),
      required: true,
    },
  ];
  const filterPanel = {
    isFilterPanelActive: showOrderDataFilters,
    inputs: filterPanelInputs,
    formElements: filterPanelFormElements,
    setFormElements: setFilterPanelFormElements,
    closeFilters: () => setShowOrderDataFilters(false),
    additionalFilterCleanFunction: () => {
      setFilterPanelFormElements(initialFilterPanelFormElements);
    },
  };
  const filters = [
    {
      isUpperSide: false,
      node: (
        <ButtonFilter
          buttonName={t("Refresh Data")}
          onclick={() => {
            queryClient.invalidateQueries([`${Paths.Order}/query`]);
            queryClient.invalidateQueries([`${Paths.Order}/collection/query`]);
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
    sellLocations,
    users,
    filterPanelFormElements,
    discounts,
    items,
    categories,
    tables,
  ]);
  return (
    <>
      <div className="w-[95%] mx-auto mb-auto ">
        <GenericTable
          key={tableKey}
          title={"Kovada Pilav"}
          columns={columns}
          rowKeys={rowKeys}
          rows={rows}
          isActionsActive={false}
          filterPanel={filterPanel}
          filters={filters}
          isExcel={true}
          excelFileName={"KovadaPilav.xlsx"}
          rowClassNameFunction={(row: any) => {
            if (row?.isReturned) {
              return "bg-red-200";
            }
            return "";
          }}
        />
        {isOrderPaymentModalOpen && rowToAction && (
          <OrderPaymentModal
            tableId={rowToAction.tableId}
            tables={tables}
            isAddOrderActive={false}
            close={() => {
              setExpandedRows({});
              resetOrderContext();
              setIsOrderPaymentModalOpen(false);
            }}
          />
        )}
      </div>
    </>
  );
};

export default KovadaPilavData;
