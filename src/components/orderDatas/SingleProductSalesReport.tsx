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
import { useGetAllLocations } from "../../utils/api/location";
import { useGetCategories } from "../../utils/api/menu/category";
import { useGetMenuItems } from "../../utils/api/menu/menu-item";
import { useGetOrders } from "../../utils/api/order/order";
import { getItem } from "../../utils/getItem";
import { LocationInput } from "../../utils/panelInputs";
import { passesFilter } from "../../utils/passesFilter";
import ButtonFilter from "../panelComponents/common/ButtonFilter";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { InputTypes } from "../panelComponents/shared/types";
import GenericTable from "../panelComponents/Tables/GenericTable";

type OrderWithPaymentInfo = {
  item: number;
  itemName: string;
  unitPrice: number;
  paidQuantity: number;
  discount: number;
  amount: number;
  location: number;
  date: string;
  category: string;
  categoryId: number;
  totalAmountWithDiscount: number;
  className?: string;
  formattedDate: string;
  isSortable?: boolean;
};
const SingleProductSalesReport = () => {
  const { t } = useTranslation();
  const orders = useGetOrders();
  const categories = useGetCategories();
  const locations = useGetAllLocations();
  const items = useGetMenuItems();
  const queryClient = useQueryClient();
  if (!orders || !categories || !locations) {
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
      if (!order || order?.paidQuantity === 0) return acc;
      // location filter
      if (
        filterPanelFormElements?.location !== "" &&
        filterPanelFormElements?.location !== order?.location
      ) {
        return acc;
      }
      // other filters
      if (
        filterPanelFormElements?.category?.length > 0 &&
        !filterPanelFormElements?.category?.some((category: any) =>
          passesFilter(category, getItem(order?.item, items)?.category)
        )
      ) {
        return acc;
      }
      const zonedTime = toZonedTime(order.createdAt, "UTC");
      const orderDate = new Date(zonedTime);
      acc.push({
        item: order?.item,
        itemName: getItem(order?.item, items)?.name ?? "",
        unitPrice: order?.unitPrice,
        paidQuantity:
          order?.status !== OrderStatus.RETURNED
            ? order?.paidQuantity
            : -order?.quantity,
        discount: order?.discountPercentage
          ? (order?.discountPercentage ?? 0) *
            order?.paidQuantity *
            order?.unitPrice *
            (1 / 100)
          : (order?.discountAmount ?? 0) * order?.paidQuantity,
        amount: order?.paidQuantity * order?.unitPrice,
        location: order?.location,
        date: format(orderDate, "yyyy-MM-dd"),
        formattedDate: order?.createdAt ? format(orderDate, "dd-MM-yyyy") : "",
        category:
          categories?.find(
            (category) =>
              category?._id === getItem(order?.item, items)?.category
          )?.name ?? "",
        categoryId: getItem(order?.item, items)?.category as number,
        totalAmountWithDiscount:
          order?.paidQuantity * order?.unitPrice -
          (order?.discountPercentage
            ? (order?.discountPercentage ?? 0) *
              order?.paidQuantity *
              order?.unitPrice *
              (1 / 100)
            : (order?.discountAmount ?? 0) * order?.paidQuantity),
      });
      return acc;
    }, [] as OrderWithPaymentInfo[]);
  if (allRows.length > 0) {
    allRows.sort((a, b) => b.paidQuantity - a.paidQuantity);
    allRows.push({
      item: 0,
      itemName: t("Total"),
      isSortable: false,
      unitPrice: 0,
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
      formattedDate: "",
      category: " ",
      categoryId: 0,
    });
  }
  const [rows, setRows] = useState(allRows);
  const columns = [
    { key: t("Product"), isSortable: true },
    { key: t("Quantity"), isSortable: true },
    { key: t("Category"), isSortable: true },
    { key: t("Date"), isSortable: true },
    { key: t("Unit Price"), isSortable: true },
    { key: t("Discount"), isSortable: true },
    { key: t("Total Amount"), isSortable: true },
    { key: t("General Amount"), isSortable: true },
  ];
  const rowKeys = [
    {
      key: "itemName",
      className: "min-w-fit pr-2",
      node: (row: any) => {
        return <p className={`${row?.className}`}>{row?.itemName}</p>;
      },
    },
    {
      key: "paidQuantity",
      node: (row: any) => {
        return <p className={`${row?.className}`}>{row?.paidQuantity}</p>;
      },
    },
    { key: "category", className: "min-w-32 pr-2" },
    {
      key: "date",
      className: "min-w-32 pr-2",
      node: (row: any) => {
        return row?.formattedDate;
      },
    },
    {
      key: "unitPrice",
      node: (row: any) => {
        return (
          <p className={`${row?.className}`}>
            {row?.unitPrice > 0 &&
              row?.unitPrice?.toFixed(2) + " " + TURKISHLIRA}
          </p>
        );
      },
    },
    {
      key: "discount",
      node: (row: any) => {
        return (
          <p className={`${row?.className}`}>
            {row?.discount !== 0
              ? row?.discount?.toFixed(2) + " " + TURKISHLIRA
              : ""}
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
  }, [orders, categories, filterPanelFormElements, locations]);
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
          title={t("Product Based Sales")}
          isActionsActive={false}
        />
      </div>
    </>
  );
};

export default SingleProductSalesReport;
