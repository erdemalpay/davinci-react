import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useOrderContext } from "../../context/Order.context";
import {
  DateRangeKey,
  OrderStatus,
  TURKISHLIRA,
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
import { useGetUsers } from "../../utils/api/user";
import { getItem } from "../../utils/getItem";
import { LocationInput } from "../../utils/panelInputs";
import GenericTable from "../panelComponents/Tables/GenericTable";
import ButtonFilter from "../panelComponents/common/ButtonFilter";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { InputTypes } from "../panelComponents/shared/types";

type ItemQuantity = {
  itemId: number;
  itemName: string;
  quantity: number;
};
type OrderWithPaymentInfo = {
  item: number;
  itemName: string;
  paidQuantity: number;
  discount: number;
  amount: number;
  location: number;
  date: string;
  category: string;
  categoryId: number;
  totalAmountWithDiscount: number;
  itemQuantity: ItemQuantity[];
  collapsible: any;
  className?: string;
  isSortable?: boolean;
};

const CategoryBasedSalesReport = () => {
  const { t } = useTranslation();
  const orders = useGetOrders();
  const categories = useGetAllCategories();
  const items = useGetMenuItems();
  const sellLocations = useGetSellLocations();
  const discounts = useGetOrderDiscounts();
  const users = useGetUsers();
  const queryClient = useQueryClient();
  if (!orders || !categories || !sellLocations) {
    return null;
  }
  const {
    filterPanelFormElements,
    setFilterPanelFormElements,
    initialFilterPanelFormElements,
    showOrderDataFilters,
    setShowOrderDataFilters,
  } = useOrderContext();
  const [tableKey, setTableKey] = useState(0);
  const allRows = orders
    ?.filter((order) => order.status !== OrderStatus.CANCELLED)
    ?.reduce((acc, order) => {
      if (!order || order.paidQuantity === 0) return acc;
      // Date filters
      const zonedTime = toZonedTime(order.createdAt, "UTC");
      const orderDate = new Date(zonedTime);
      const existingEntry = acc.find(
        (item) => item?.categoryId === getItem(order?.item, items)?.category
      );
      if (existingEntry) {
        existingEntry.paidQuantity +=
          order.status !== OrderStatus.RETURNED
            ? order.paidQuantity
            : -order.quantity;
        existingEntry.discount += order?.discountPercentage
          ? (order?.discountPercentage ?? 0) *
            order.paidQuantity *
            order.unitPrice *
            0.01
          : (order?.discountAmount ?? 0) * order.paidQuantity;
        existingEntry.amount += order.paidQuantity * order.unitPrice;
        existingEntry.totalAmountWithDiscount =
          existingEntry.totalAmountWithDiscount +
          order.paidQuantity * order.unitPrice -
          (order?.discountPercentage
            ? (order?.discountPercentage ?? 0) *
              order.paidQuantity *
              order.unitPrice *
              0.01
            : (order?.discountAmount ?? 0) * order.paidQuantity);
        const existingItem = existingEntry.itemQuantity.find(
          (itemQuantityIteration) =>
            itemQuantityIteration.itemId === getItem(order?.item, items)?._id
        );
        if (existingItem) {
          existingEntry.itemQuantity = existingEntry.itemQuantity.map(
            (itemQuantityIteration) =>
              itemQuantityIteration.itemId === existingItem.itemId
                ? {
                    ...itemQuantityIteration,
                    quantity:
                      itemQuantityIteration.quantity +
                      (order.status !== OrderStatus.RETURNED
                        ? order.paidQuantity
                        : -order.quantity),
                  }
                : itemQuantityIteration
          );
        } else {
          existingEntry.itemQuantity.push({
            itemId: order?.item,
            itemName: getItem(order?.item, items)?.name ?? "",
            quantity:
              order.status !== OrderStatus.RETURNED
                ? order.paidQuantity
                : -order.quantity,
          });
        }
        existingEntry.collapsible = {
          collapsibleHeader: t("Products"),
          collapsibleColumns: [
            { key: t("Product"), isSortable: true },
            { key: t("Quantity"), isSortable: true },
          ],
          collapsibleRows: existingEntry.itemQuantity
            .map((itemQuantityIteration) => ({
              product: itemQuantityIteration.itemName,
              quantity: itemQuantityIteration.quantity,
            }))
            .sort((a, b) => b.quantity - a.quantity),
          collapsibleRowKeys: [{ key: "product" }, { key: "quantity" }],
        };
      } else {
        acc.push({
          item: order?.item,
          itemName: getItem(order?.item, items)?.name ?? "",
          paidQuantity:
            order.status !== OrderStatus.RETURNED
              ? order.paidQuantity
              : -order.quantity,
          location: order.location,
          discount: order?.discountPercentage
            ? (order?.discountPercentage ?? 0) *
              order.paidQuantity *
              order.unitPrice *
              0.01
            : (order?.discountAmount ?? 0) * order.paidQuantity,
          amount: order.paidQuantity * order.unitPrice,
          date: format(orderDate, "yyyy-MM-dd"),
          category:
            categories?.find(
              (category) =>
                category?._id === getItem(order?.item, items)?.category
            )?.name ?? "",
          categoryId: getItem(order?.item, items)?.category ?? 0,
          itemQuantity: [
            {
              itemId: order?.item,
              itemName: getItem(order?.item, items)?.name ?? "",
              quantity:
                order.status !== OrderStatus.RETURNED
                  ? order.paidQuantity
                  : -order.quantity,
            },
          ],
          collapsible: {
            collapsibleHeader: t("Products"),
            collapsibleColumns: [
              { key: t("Unit Price"), isSortable: true },
              { key: t("Quantity"), isSortable: true },
            ],
            collapsibleRows: [
              {
                product: getItem(order?.item, items)?.name,
                quantity:
                  order.status !== OrderStatus.RETURNED
                    ? order.paidQuantity
                    : -order.quantity,
              },
            ],
            collapsibleRowKeys: [{ key: "product" }, { key: "quantity" }],
          },
          totalAmountWithDiscount:
            order.paidQuantity * order.unitPrice -
            (order?.discountPercentage
              ? (order?.discountPercentage ?? 0) *
                order.paidQuantity *
                order.unitPrice *
                0.01
              : (order?.discountAmount ?? 0) * order.paidQuantity),
        });
      }
      return acc;
    }, [] as OrderWithPaymentInfo[]);
  if (allRows.length > 0) {
    allRows.sort((a, b) => b.paidQuantity - a.paidQuantity);
    allRows.push({
      item: 0,
      itemName: "",
      paidQuantity: allRows.reduce((acc, item) => acc + item.paidQuantity, 0),
      className: "font-semibold",
      discount: allRows.reduce((acc, item) => acc + item.discount, 0),
      amount: allRows.reduce((acc, item) => acc + item.amount, 0),
      totalAmountWithDiscount: allRows.reduce(
        (acc, item) => acc + item.totalAmountWithDiscount,
        0
      ),
      location: 4,
      date: "",
      category: t("Total"),
      isSortable: false,
      categoryId: 0,
      itemQuantity: [],
      collapsible: {
        collapsibleHeader: t("Products"),
        collapsibleColumns: [
          { key: t("Product"), isSortable: true },
          { key: t("Quantity"), isSortable: true },
        ],
        collapsibleRows: [],
        collapsibleRowKeys: [{ key: "product" }, { key: "quantity" }],
      },
    });
  }

  const [rows, setRows] = useState(allRows);
  const columns = [
    { key: t("Category"), isSortable: true },
    { key: t("Quantity"), isSortable: true },
    { key: t("Discount"), isSortable: true },
    { key: t("Total Amount"), isSortable: true },
    { key: t("General Amount"), isSortable: true },
  ];
  const rowKeys = [
    {
      key: "category",
      className: "min-w-32 pr-2",
      node: (row: any) => {
        return <p className={`${row?.className}`}>{row?.category}</p>;
      },
    },

    {
      key: "paidQuantity",
      node: (row: any) => {
        return (
          <p key={"paidQuantity" + row?.item} className={`${row?.className}`}>
            {row?.paidQuantity}
          </p>
        );
      },
    },
    {
      key: "discount",
      node: (row: any) => {
        return (
          <p className={`${row?.className}`} key={"discount" + row?.item}>
            {row?.discount > 0 && row?.discount?.toFixed(2).replace(/\.?0*$/, "") + " " + TURKISHLIRA}
          </p>
        );
      },
    },
    {
      key: "amount",
      node: (row: any) => {
        return (
          <p className={`${row?.className}`} key={"amount" + row?.item}>
            {row?.amount?.toFixed(2).replace(/\.?0*$/, "") + " " + TURKISHLIRA}
          </p>
        );
      },
    },
    {
      key: "totalAmountWithDiscount",
      node: (row: any) => {
        return (
          <p
            className={`${row?.className}`}
            key={"totalAmountWithDiscount" + row?.item}
          >
            {row?.totalAmountWithDiscount?.toFixed(2).replace(/\.?0*$/, "") + " " + TURKISHLIRA}
          </p>
        );
      },
    },
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
    additionalFilterCleanFunction: () => {
      setFilterPanelFormElements(initialFilterPanelFormElements);
    },
    closeFilters: () => {
      setShowOrderDataFilters(false);
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
    categories,
    filterPanelFormElements,
    sellLocations,
    discounts,
    items,
    users,
  ]);
  return (
    <>
      <div className="w-[95%] mx-auto ">
        <GenericTable
          key={tableKey}
          rowKeys={rowKeys}
          columns={columns}
          rows={rows}
          filters={filters}
          filterPanel={filterPanel}
          title={t("Category Based Sales")}
          isActionsActive={false}
          isCollapsible={true}
        />
      </div>
    </>
  );
};

export default CategoryBasedSalesReport;
