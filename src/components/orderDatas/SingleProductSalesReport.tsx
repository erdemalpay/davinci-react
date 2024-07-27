import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useGeneralContext } from "../../context/General.context";
import { Location, MenuItem, Table, TURKISHLIRA } from "../../types";
import { useGetLocations } from "../../utils/api/location";
import { useGetCategories } from "../../utils/api/menu/category";
import { useGetOrders } from "../../utils/api/order/order";
import { useGetAllOrderPayments } from "../../utils/api/order/orderPayment";
import { formatAsLocalDate } from "../../utils/format";
import { LocationInput } from "../../utils/panelInputs";
import { passesFilter } from "../../utils/passesFilter";
import GenericTable from "../panelComponents/Tables/GenericTable";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { InputTypes } from "../panelComponents/shared/types";

type Props = {};
type UnitPriceQuantity = {
  unitPrice: number;
  quantity: number;
};
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
};
type FormElementsState = {
  [key: string]: any;
};
const SingleProductSalesReport = (props: Props) => {
  const { t } = useTranslation();
  const orderPayments = useGetAllOrderPayments();
  const orders = useGetOrders();
  const categories = useGetCategories();
  const locations = useGetLocations();
  const [showFilters, setShowFilters] = useState(false);
  if (!orderPayments || !orders || !categories || !locations) {
    return null;
  }
  const [filterPanelFormElements, setFilterPanelFormElements] =
    useState<FormElementsState>({
      location: "",
      category: "",
      before: "",
      after: "",
    });
  const { setExpandedRows } = useGeneralContext();
  const [tableKey, setTableKey] = useState(0);
  const orderWithInfo = orderPayments.reduce((acc, orderPayment) => {
    if (!orderPayment.orders) return acc;
    orderPayment.orders.forEach((orderPaymentItem) => {
      const foundOrder = orders.find(
        (orderItem) => orderItem._id === orderPaymentItem.order
      );
      if (!foundOrder || orderPaymentItem.paidQuantity === 0) return;
      // location filter
      if (
        filterPanelFormElements.location !== "" &&
        filterPanelFormElements.location !==
          (foundOrder.location as Location)._id
      ) {
        return acc;
      }
      // other filters
      if (
        (filterPanelFormElements.before !== "" &&
          (foundOrder.table as Table).date > filterPanelFormElements.before) ||
        (filterPanelFormElements.after !== "" &&
          (foundOrder.table as Table).date < filterPanelFormElements.after) ||
        !passesFilter(
          filterPanelFormElements.category,
          (foundOrder.item as MenuItem).category as number
        )
      ) {
        return acc;
      }

      acc.push({
        item: (foundOrder.item as MenuItem)._id,
        itemName: (foundOrder.item as MenuItem).name,
        unitPrice: foundOrder.unitPrice,
        paidQuantity: orderPaymentItem.paidQuantity,
        discount:
          (orderPaymentItem?.discountPercentage ?? 0) *
          orderPaymentItem.paidQuantity *
          foundOrder.unitPrice *
          (1 / 100),
        amount: orderPaymentItem.paidQuantity * foundOrder.unitPrice,
        location: (foundOrder.location as Location)._id,
        date: (foundOrder.table as Table).date,
        formattedDate: formatAsLocalDate((foundOrder.table as Table).date),
        category:
          categories.find(
            (category) =>
              category._id === (foundOrder.item as MenuItem).category
          )?.name ?? "",
        categoryId: (foundOrder.item as MenuItem).category as number,
        totalAmountWithDiscount:
          orderPaymentItem.paidQuantity * foundOrder.unitPrice -
          (orderPaymentItem?.discountPercentage ?? 0) *
            orderPaymentItem.paidQuantity *
            foundOrder.unitPrice *
            (1 / 100),
      });
    });
    return acc;
  }, [] as OrderWithPaymentInfo[]);
  orderWithInfo.length > 0 &&
    orderWithInfo.push({
      item: 0,
      itemName: "Toplam",
      unitPrice: 0,
      paidQuantity: orderWithInfo.reduce(
        (acc, item) => acc + item.paidQuantity,
        0
      ),
      className: "font-semibold",
      discount: orderWithInfo.reduce((acc, item) => acc + item.discount, 0),
      amount: orderWithInfo.reduce((acc, item) => acc + item.amount, 0),
      totalAmountWithDiscount: orderWithInfo.reduce(
        (acc, item) => acc + item.totalAmountWithDiscount,
        0
      ),
      location: 4,
      date: "",
      formattedDate: "",
      category: " ",
      categoryId: 0,
    });
  const [rows, setRows] = useState(orderWithInfo);
  const columns = [
    { key: t("Product Name"), isSortable: true },
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
    { key: "category" },
    {
      key: "date",
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
      options: categories.map((category) => {
        return {
          value: category._id,
          label: category.name,
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
    setRows(orderWithInfo);
    setExpandedRows({});
    setTableKey((prev) => prev + 1);
  }, [orders, orderPayments, categories, filterPanelFormElements]);
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
          title={t("Product Based Sales Report")}
          isActionsActive={false}
        />
      </div>
    </>
  );
};

export default SingleProductSalesReport;
