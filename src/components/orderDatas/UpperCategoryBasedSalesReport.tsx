import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useOrderContext } from "../../context/Order.context";
import {
  commonDateOptions,
  DateRangeKey,
  orderFilterStatusOptions,
  OrderStatus,
  TURKISHLIRA,
} from "../../types";
import { dateRanges } from "../../utils/api/dateRanges";
import { Paths } from "../../utils/api/factory";
import { useGetAllLocations } from "../../utils/api/location";
import { useGetCategories } from "../../utils/api/menu/category";
import { useGetMenuItems } from "../../utils/api/menu/menu-item";
import { useGetUpperCategories } from "../../utils/api/menu/upperCategory";
import { useGetOrders } from "../../utils/api/order/order";
import { useGetOrderDiscounts } from "../../utils/api/order/orderDiscount";
import { useGetUsers } from "../../utils/api/user";
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
  const users = useGetUsers();
  const locations = useGetAllLocations();
  const discounts = useGetOrderDiscounts();
  const queryClient = useQueryClient();
  if (!orders || !categories || !locations || !upperCategories) {
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
  const allCategoryRows = orders
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
  const totalRow = {
    name: t("Total"),
    className: "font-semibold",
    isSortable: false,
    paidQuantity: allRows.reduce((acc, row) => acc + row.paidQuantity, 0),
    discount: allRows.reduce((acc, row) => acc + row.discount, 0),
    amount: allRows.reduce((acc, row) => acc + row.amount, 0),
    totalAmountWithDiscount: allRows.reduce(
      (acc, row) => acc + row.totalAmountWithDiscount,
      0
    ),
    percentageGeneralAmount: allRows.reduce(
      (acc, row) => acc + row.percentageGeneralAmount,
      0
    ),
    collapsible: {
      collapsibleHeader: t("Categories"),
      collapsibleColumns: [
        { key: t("Category"), isSortable: false },
        { key: t("Percentage"), isSortable: false },
        { key: t("Quantity"), isSortable: false },
        { key: t("Discount"), isSortable: false },
        { key: t("Total Amount"), isSortable: false },
        { key: t("General Amount"), isSortable: false },
        { key: t("Percentage General Amount"), isSortable: false },
      ],
      collapsibleRows: [],
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

  // Push the total row at the end of the allRows array
  if (allRows.length > 0) {
    allRows.push(totalRow as any);
  }
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
      node: (row: any) => {
        return <p className={`min-w-32 pr-2 ${row?.className}`}>{row?.name}</p>;
      },
    },
    {
      key: "paidQuantity",
      node: (row: any) => {
        return <p className={`${row?.className}`}>{row?.paidQuantity}</p>;
      },
    },
    {
      key: "discount",
      node: (row: any) => {
        return (
          <p className={`${row?.className}`}>
            {row?.discount > 0 && row?.discount?.toFixed(2) + " " + TURKISHLIRA}
          </p>
        );
      },
    },
    {
      key: "amount",
      node: (row: any) => {
        return (
          <p className={`${row?.className}`}>
            {row?.amount?.toFixed(2) + " " + TURKISHLIRA}
          </p>
        );
      },
    },
    {
      key: "totalAmountWithDiscount",
      node: (row: any) => {
        return (
          <p className={`${row?.className}`}>
            {row?.totalAmountWithDiscount?.toFixed(2) + " " + TURKISHLIRA}
          </p>
        );
      },
    },
    {
      key: "percentageGeneralAmount",
      node: (row: any) => {
        return (
          <p className={`${row?.className}`}>
            {row?.percentageGeneralAmount?.toFixed(2) + " " + TURKISHLIRA}
          </p>
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
    categories,
    filterPanelFormElements,
    locations,
    items,
    upperCategories,
    users,
    discounts,
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
