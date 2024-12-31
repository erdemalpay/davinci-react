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
import { useGetStoreLocations } from "../../utils/api/location";
import { useGetCategories } from "../../utils/api/menu/category";
import { useGetMenuItems } from "../../utils/api/menu/menu-item";
import { useGetUpperCategories } from "../../utils/api/menu/upperCategory";
import { useGetOrders } from "../../utils/api/order/order";
import { getItem } from "../../utils/getItem";
import { LocationInput } from "../../utils/panelInputs";
import ButtonFilter from "../panelComponents/common/ButtonFilter";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { InputTypes } from "../panelComponents/shared/types";
import GenericTable from "../panelComponents/Tables/GenericTable";

type OrderWithPaymentInfo = {
  item: number;
  paidQuantity: number;
  discount: number;
  amount: number;
  location: number;
  date: string;
  categoryId: number;
  totalAmountWithDiscount: number;
};

const UpperCategoryBasedSalesReport = () => {
  const { t } = useTranslation();
  const orders = useGetOrders();
  const upperCategories = useGetUpperCategories();
  const categories = useGetCategories();
  const items = useGetMenuItems();
  const locations = useGetStoreLocations();
  const [showFilters, setShowFilters] = useState(false);
  const queryClient = useQueryClient();
  if (!orders || !categories || !locations || !upperCategories) {
    return null;
  }
  const {
    filterPanelFormElements,
    setFilterPanelFormElements,
    initialFilterPanelFormElements,
  } = useOrderContext();
  const [tableKey, setTableKey] = useState(0);
  const allCategoryRows = orders
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
      } else {
        acc.push({
          item: order?.item,
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
          categoryId: getItem(order?.item, items)?.category ?? 0,
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
  const allRows = upperCategories
    ?.map((upperCategory) => {
      return {
        ...upperCategory,
        paidQuantity: upperCategory?.categoryGroup?.reduce(
          (acc, categoryGroupItem) => {
            const category = allCategoryRows?.find(
              (categoryRow) =>
                categoryRow.categoryId === categoryGroupItem?.category
            );
            return acc + (category?.paidQuantity ?? 0);
          },
          0
        ),
        discount: upperCategory?.categoryGroup?.reduce(
          (acc, categoryGroupItem) => {
            const category = allCategoryRows?.find(
              (categoryRow) =>
                categoryRow.categoryId === categoryGroupItem?.category
            );
            return acc + (category?.discount ?? 0);
          },
          0
        ),
        amount: upperCategory?.categoryGroup?.reduce(
          (acc, categoryGroupItem) => {
            const category = allCategoryRows?.find(
              (categoryRow) =>
                categoryRow.categoryId === categoryGroupItem?.category
            );
            return acc + (category?.amount ?? 0);
          },
          0
        ),
        totalAmountWithDiscount: upperCategory?.categoryGroup?.reduce(
          (acc, categoryGroupItem) => {
            const category = allCategoryRows?.find(
              (categoryRow) =>
                categoryRow.categoryId === categoryGroupItem?.category
            );
            return acc + (category?.totalAmountWithDiscount ?? 0);
          },
          0
        ),
        percentageGeneralAmount: upperCategory?.categoryGroup?.reduce(
          (acc, categoryGroupItem) => {
            const category = allCategoryRows?.find(
              (categoryRow) =>
                categoryRow.categoryId === categoryGroupItem?.category
            );
            return (
              acc +
              (category?.totalAmountWithDiscount ?? 0) *
                categoryGroupItem?.percentage *
                0.01
            );
          },
          0
        ),
        collapsible: {
          collapsibleHeader: t("Categories"),
          collapsibleColumns: [
            { key: t("Category"), isSortable: true },
            { key: t("Percentage"), isSortable: true },
            { key: t("Quantity"), isSortable: true },
            { key: t("Discount"), isSortable: true },
            { key: t("Total Amount"), isSortable: true },
            { key: t("General Amount"), isSortable: true },
            { key: t("Percentage General Amount"), isSortable: true },
          ],
          collapsibleRows: upperCategory?.categoryGroup
            ?.map((categoryGroupItem) => {
              const category = allCategoryRows?.find(
                (categoryRow) =>
                  categoryRow.categoryId === categoryGroupItem?.category
              );

              return {
                category: getItem(categoryGroupItem?.category, categories)
                  ?.name,
                percentage: categoryGroupItem?.percentage,
                quantity: category?.paidQuantity ?? 0,
                discount: category?.discount ?? 0,
                totalAmount: category?.amount ?? 0,
                generalAmount: category?.totalAmountWithDiscount ?? 0,
                percentageGeneralAmount:
                  (category?.totalAmountWithDiscount ?? 0) *
                  categoryGroupItem?.percentage *
                  0.01,
              };
            })
            .sort((a, b) => b.quantity - a.quantity)
            ?.filter((row) => row.quantity > 0),
          collapsibleRowKeys: [
            { key: "category" },
            { key: "percentage" },
            { key: "quantity" },
            { key: "discount" },
            { key: "totalAmount" },
            { key: "generalAmount" },
            { key: "percentageGeneralAmount" },
          ],
        },
      };
    })
    ?.filter((row) => row.paidQuantity > 0)
    ?.sort((a, b) => b.paidQuantity - a.paidQuantity);
  const [rows, setRows] = useState(allRows);
  const columns = [
    { key: t("Name"), isSortable: true },
    { key: t("Quantity"), isSortable: true },
    { key: t("Discount"), isSortable: true },
    { key: t("Total Amount"), isSortable: true },
    { key: t("General Amount"), isSortable: true },
    { key: t("Percentage General Amount"), isSortable: true },
  ];
  const rowKeys = [
    {
      key: "name",
      className: "min-w-32 pr-2",
    },
    {
      key: "paidQuantity",
      node: (row: any) => {
        return <p>{row?.paidQuantity}</p>;
      },
    },
    {
      key: "discount",
      node: (row: any) => {
        return (
          <p>
            {row?.discount > 0 && row?.discount?.toFixed(2) + " " + TURKISHLIRA}
          </p>
        );
      },
    },
    {
      key: "amount",
      node: (row: any) => {
        return <p>{row?.amount?.toFixed(2) + " " + TURKISHLIRA}</p>;
      },
    },
    {
      key: "totalAmountWithDiscount",
      node: (row: any) => {
        return (
          <p>{row?.totalAmountWithDiscount?.toFixed(2) + " " + TURKISHLIRA}</p>
        );
      },
    },
    {
      key: "percentageGeneralAmount",
      node: (row: any) => {
        return (
          <p>{row?.percentageGeneralAmount?.toFixed(2) + " " + TURKISHLIRA}</p>
        );
      },
    },
  ];

  const filterPanelInputs = [
    LocationInput({ locations: locations, required: true }),
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
    closeFilters: () => setShowFilters(false),
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
      node: <SwitchButton checked={showFilters} onChange={setShowFilters} />,
    },
  ];
  useEffect(() => {
    setRows(allRows);
    setTableKey((prev) => prev + 1);
  }, [
    orders,
    categories,
    filterPanelFormElements,
    locations,
    items,
    upperCategories,
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
          title={t("Upper Category Based Sales")}
          isActionsActive={false}
          isCollapsible={true}
        />
      </div>
    </>
  );
};

export default UpperCategoryBasedSalesReport;
