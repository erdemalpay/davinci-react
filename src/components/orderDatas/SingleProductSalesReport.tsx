import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useOrderContext } from "../../context/Order.context";
import { Location, MenuItem, Table, TURKISHLIRA } from "../../types";
import { useGetLocations } from "../../utils/api/location";
import { useGetCategories } from "../../utils/api/menu/category";
import { useGetOrders } from "../../utils/api/order/order";
import { formatAsLocalDate } from "../../utils/format";
import { LocationInput } from "../../utils/panelInputs";
import { passesFilter } from "../../utils/passesFilter";
import GenericTable from "../panelComponents/Tables/GenericTable";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { InputTypes } from "../panelComponents/shared/types";
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
  const locations = useGetLocations();
  const [showFilters, setShowFilters] = useState(false);
  if (!orders || !categories || !locations) {
    return null;
  }
  const { filterPanelFormElements, setFilterPanelFormElements } =
    useOrderContext();
  const [tableKey, setTableKey] = useState(0);
  const allRows = orders.reduce((acc, order) => {
    if (!order || order?.paidQuantity === 0) return acc;
    // location filter
    if (
      filterPanelFormElements.location !== "" &&
      filterPanelFormElements.location !== (order?.location as Location)?._id
    ) {
      return acc;
    }
    // other filters
    if (
      (filterPanelFormElements.before !== "" &&
        (order?.table as Table)?.date > filterPanelFormElements.before) ||
      (filterPanelFormElements.after !== "" &&
        (order?.table as Table)?.date < filterPanelFormElements.after) ||
      !passesFilter(
        filterPanelFormElements?.category,
        (order?.item as MenuItem)?.category as number
      )
    ) {
      return acc;
    }
    acc.push({
      item: (order?.item as MenuItem)?._id,
      itemName: (order?.item as MenuItem)?.name,
      unitPrice: order?.unitPrice,
      paidQuantity: order?.paidQuantity,
      discount: order?.discountPercentage
        ? (order?.discountPercentage ?? 0) *
          order?.paidQuantity *
          order?.unitPrice *
          (1 / 100)
        : (order?.discountAmount ?? 0) * order?.paidQuantity,
      amount: order?.paidQuantity * order?.unitPrice,
      location: (order?.location as Location)?._id,
      date: (order?.table as Table)?.date,
      formattedDate: formatAsLocalDate((order?.table as Table)?.date),
      category:
        categories?.find(
          (category) => category?._id === (order?.item as MenuItem)?.category
        )?.name ?? "",
      categoryId: (order?.item as MenuItem)?.category as number,
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
  allRows.length > 0 &&
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
        return <p className={`${row?.className}`}>{row.itemName}</p>;
      },
    },
    {
      key: "paidQuantity",
      node: (row: any) => {
        return <p className={`${row?.className}`}>{row.paidQuantity}</p>;
      },
    },
    { key: "category", className: "min-w-32 pr-2" },
    {
      key: "date",
      className: "min-w-32 pr-2",
      node: (row: any) => {
        return row.formattedDate;
      },
    },
    {
      key: "unitPrice",
      node: (row: any) => {
        return (
          <p className={`${row?.className}`}>
            {row.unitPrice > 0 && row.unitPrice + " " + TURKISHLIRA}
          </p>
        );
      },
    },
    {
      key: "discount",
      node: (row: any) => {
        return (
          <p className={`${row?.className}`}>
            {row.discount !== 0 ? row.discount + " " + TURKISHLIRA : ""}
          </p>
        );
      },
    },
    {
      key: "amount",
      node: (row: any) => {
        return (
          <p className={`${row?.className}`}>
            {row.amount + " " + TURKISHLIRA}
          </p>
        );
      },
    },
    {
      key: "totalAmountWithDiscount",
      node: (row: any) => {
        return (
          <p className={`${row?.className}`}>
            {row.totalAmountWithDiscount + " " + TURKISHLIRA}
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
      placeholder: t("Category"),
      required: true,
    },
    {
      type: InputTypes.DATE,
      formKey: "after",
      label: t("Start Date"),
      placeholder: t("Start Date"),
      required: true,
      isDatePicker: true,
    },
    {
      type: InputTypes.DATE,
      formKey: "before",
      label: t("End Date"),
      placeholder: t("End Date"),
      required: true,
      isDatePicker: true,
    },
  ];
  const filterPanel = {
    isFilterPanelActive: showFilters,
    inputs: filterPanelInputs,
    formElements: filterPanelFormElements,
    setFormElements: setFilterPanelFormElements,
    closeFilters: () => setShowFilters(false),
  };
  const filters = [
    {
      label: t("Show Filters"),
      isUpperSide: true,
      node: <SwitchButton checked={showFilters} onChange={setShowFilters} />,
    },
  ];
  useEffect(() => {
    setRows(allRows);
    setTableKey((prev) => prev + 1);
  }, [orders, orders, categories, filterPanelFormElements]);
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
