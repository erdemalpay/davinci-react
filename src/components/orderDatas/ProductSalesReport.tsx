import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Location, MenuItem, Table } from "../../types";
import { useGetLocations } from "../../utils/api/location";
import { useGetCategories } from "../../utils/api/menu/category";
import { useGetOrders } from "../../utils/api/order/order";
import { useGetAllOrderPayments } from "../../utils/api/order/orderPayment";
import { passesFilter } from "../../utils/passesFilter";
import GenericTable from "../panelComponents/Tables/GenericTable";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { InputTypes } from "../panelComponents/shared/types";

type Props = {};
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
};
type FormElementsState = {
  [key: string]: any;
};
const ProductSalesReport = (props: Props) => {
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
  const [tableKey, setTableKey] = useState(0);
  const orderWithInfo: OrderWithPaymentInfo[] = orderPayments.reduce(
    (acc, orderPayment) => {
      if (!orderPayment.orders) return acc;
      orderPayment.orders.forEach((orderPaymentItem) => {
        const foundOrder = orders.find(
          (orderItem) => orderItem._id === orderPaymentItem.order
        );
        if (!foundOrder || orderPaymentItem.paidQuantity === 0) return;
        if (
          filterPanelFormElements.location !== "" &&
          filterPanelFormElements.location !==
            (foundOrder.location as Location)._id
        ) {
          return;
        }
        const existingEntry = acc.find(
          (item) =>
            item.item === (foundOrder.item as MenuItem)._id &&
            item.unitPrice === foundOrder.unitPrice
        );
        if (existingEntry) {
          existingEntry.paidQuantity += orderPaymentItem.paidQuantity;
          existingEntry.discount +=
            (orderPaymentItem?.discountPercentage ?? 0) *
            orderPaymentItem.paidQuantity *
            foundOrder.unitPrice *
            (1 / 100);
          existingEntry.amount +=
            orderPaymentItem.paidQuantity * foundOrder.unitPrice;
          existingEntry.totalAmountWithDiscount =
            existingEntry.totalAmountWithDiscount +
            orderPaymentItem.paidQuantity * foundOrder.unitPrice -
            (orderPaymentItem?.discountPercentage ?? 0) *
              orderPaymentItem.paidQuantity *
              foundOrder.unitPrice *
              (1 / 100);
        } else {
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
        }
      });

      return acc;
    },
    [] as OrderWithPaymentInfo[]
  );
  const [rows, setRows] = useState(orderWithInfo);

  const filterPanelInputs = [
    {
      type: InputTypes.SELECT,
      formKey: "location",
      label: t("Location"),
      options: locations.map((location) => {
        return {
          value: location._id,
          label: location.name,
        };
      }),

      placeholder: t("Location"),
      required: true,
    },
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
  const columns = [
    { key: t("Product Name"), isSortable: true },
    { key: t("Quantity"), isSortable: true },
    { key: t("Category"), isSortable: true },
    { key: t("Unit Price"), isSortable: true },
    { key: t("Discount"), isSortable: true },
    { key: t("Total Amount"), isSortable: true },
    { key: t("General Amount"), isSortable: true },
  ];
  const rowKeys = [
    { key: "itemName" },
    { key: "paidQuantity" },
    { key: "category" },
    { key: "unitPrice" },
    { key: "discount" },
    { key: "amount" },
    { key: "totalAmountWithDiscount" },
  ];

  useEffect(() => {
    const filteredRows = orderWithInfo.filter((row) => {
      return (
        (filterPanelFormElements.before === "" ||
          row.date <= filterPanelFormElements.before) &&
        (filterPanelFormElements.after === "" ||
          row.date >= filterPanelFormElements.after) &&
        passesFilter(filterPanelFormElements.category, row.categoryId)
      );
    });
    setRows(filteredRows);
    setTableKey((prev) => prev + 1);
  }, [orders, orderPayments, categories, filterPanelFormElements]);

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
          title={t("Product Sales Report")}
          isActionsActive={false}
        />
      </div>
    </>
  );
};

export default ProductSalesReport;
