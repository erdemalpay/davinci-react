import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useOrderContext } from "../../context/Order.context";
import {
  commonDateOptions,
  DateRangeKey,
  OrderStatus,
  TURKISHLIRA,
} from "../../types";
import { dateRanges } from "../../utils/api/dateRanges";
import { Paths } from "../../utils/api/factory";
import { useGetLocations } from "../../utils/api/location";
import { useGetCategories } from "../../utils/api/menu/category";
import { useGetMenuItems } from "../../utils/api/menu/menu-item";
import { useGetOrders } from "../../utils/api/order/order";
import { getItem } from "../../utils/getItem";
import { LocationInput } from "../../utils/panelInputs";
import { passesFilter } from "../../utils/passesFilter";
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
  const categories = useGetCategories();
  const items = useGetMenuItems();
  const locations = useGetLocations();
  const [showFilters, setShowFilters] = useState(false);
  const queryClient = useQueryClient();
  if (!orders || !categories || !locations) {
    return null;
  }
  const {
    filterPanelFormElements,
    setFilterPanelFormElements,
    initialFilterPanelFormElements,
  } = useOrderContext();
  const [tableKey, setTableKey] = useState(0);
  const allRows = orders
    ?.filter((order) => order.status !== OrderStatus.CANCELLED)
    ?.reduce((acc, order) => {
      if (!order || order.paidQuantity === 0) return acc;

      // Location filter
      if (
        filterPanelFormElements.location !== "" &&
        filterPanelFormElements.location !== order.location
      ) {
        return acc;
      }

      // Date filters
      const zonedTime = toZonedTime(order.createdAt, "UTC");
      const orderDate = new Date(zonedTime);
      if (
        filterPanelFormElements?.category?.length > 0 &&
        !filterPanelFormElements?.category?.some((category: any) =>
          passesFilter(category, getItem(order?.item, items)?.category)
        )
      ) {
        return acc;
      }

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
          collapsibleRows: existingEntry.itemQuantity.map(
            (itemQuantityIteration) => ({
              product: itemQuantityIteration.itemName,
              quantity: itemQuantityIteration.quantity,
            })
          ),
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
            {row?.discount > 0 && row?.discount?.toFixed(2) + " " + TURKISHLIRA}
          </p>
        );
      },
    },
    {
      key: "amount",
      node: (row: any) => {
        return (
          <p className={`${row?.className}`} key={"amount" + row?.item}>
            {row?.amount?.toFixed(2) + " " + TURKISHLIRA}
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
            {row?.totalAmountWithDiscount?.toFixed(2) + " " + TURKISHLIRA}
          </p>
        );
      },
    },
  ];

  const filterPanelInputs = [
    LocationInput({ locations: locations, required: true }),
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
  ];
  const filterPanel = {
    isFilterPanelActive: showFilters,
    inputs: filterPanelInputs,
    formElements: filterPanelFormElements,
    setFormElements: setFilterPanelFormElements,
    additionalFilterCleanFunction: () => {
      setFilterPanelFormElements(initialFilterPanelFormElements);
    },
    closeFilters: () => {
      setShowFilters(false);
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
      node: <SwitchButton checked={showFilters} onChange={setShowFilters} />,
    },
  ];
  useEffect(() => {
    setRows(allRows);
    setTableKey((prev) => prev + 1);
  }, [orders, categories, filterPanelFormElements, locations, items]);
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
