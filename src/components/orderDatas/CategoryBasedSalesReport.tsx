import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useGeneralContext } from "../../context/General.context";
import { Location, MenuItem, Table, TURKISHLIRA } from "../../types";
import { useGetLocations } from "../../utils/api/location";
import { useGetCategories } from "../../utils/api/menu/category";
import { useGetOrders } from "../../utils/api/order/order";
import { useGetAllOrderPayments } from "../../utils/api/order/orderPayment";
import { LocationInput } from "../../utils/panelInputs";
import { passesFilter } from "../../utils/passesFilter";
import GenericTable from "../panelComponents/Tables/GenericTable";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { InputTypes } from "../panelComponents/shared/types";

type Props = {};
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
};
type FormElementsState = {
  [key: string]: any;
};
const CategoryBasedSalesReport = (props: Props) => {
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
        return;
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
        return;
      }
      const existingEntry = acc.find(
        (item) => item.categoryId === (foundOrder.item as MenuItem).category
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
        const existingItem = existingEntry.itemQuantity.find(
          (itemQuantityIteration) =>
            itemQuantityIteration.itemId === (foundOrder.item as MenuItem)._id
        );
        if (existingItem) {
          existingEntry.itemQuantity = [
            ...existingEntry.itemQuantity.filter(
              (itemQuantityIteration) =>
                itemQuantityIteration.itemId !== existingItem.itemId
            ),
            {
              itemId: existingItem.itemId,
              itemName: existingItem.itemName,
              quantity: existingItem.quantity + orderPaymentItem.paidQuantity,
            },
          ];
        } else {
          existingEntry.itemQuantity.push({
            itemId: (foundOrder.item as MenuItem)._id,
            itemName: (foundOrder.item as MenuItem).name,
            quantity: orderPaymentItem.paidQuantity,
          });
        }
        existingEntry.collapsible = {
          collapsibleHeader: t("Products"),
          collapsibleColumns: [
            { key: t("Product"), isSortable: true },
            { key: t("Quantity"), isSortable: true },
          ],
          collapsibleRows: existingEntry.itemQuantity?.map(
            (itemQuantityIteration) => ({
              product: itemQuantityIteration.itemName,
              quantity: itemQuantityIteration.quantity,
            })
          ),
          collapsibleRowKeys: [{ key: "product" }, { key: "quantity" }],
        };
      } else {
        acc.push({
          item: (foundOrder.item as MenuItem)._id,
          itemName: (foundOrder.item as MenuItem).name,
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
          itemQuantity: [
            {
              itemId: (foundOrder.item as MenuItem)._id,
              itemName: (foundOrder.item as MenuItem).name,
              quantity: orderPaymentItem.paidQuantity,
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
                product: (foundOrder.item as MenuItem).name,
                quantity: orderPaymentItem.paidQuantity,
              },
            ],
            collapsibleRowKeys: [{ key: "product" }, { key: "quantity" }],
          },
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
  }, [] as OrderWithPaymentInfo[]);
  orderWithInfo.length > 0 &&
    orderWithInfo.push({
      item: 0,
      itemName: "Toplam",
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
      category: " ",
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
  const [rows, setRows] = useState(orderWithInfo);
  const columns = [
    { key: t("Category"), isSortable: true },
    { key: t("Quantity"), isSortable: true },
    { key: t("Discount"), isSortable: true },
    { key: t("Total Amount"), isSortable: true },
    { key: t("General Amount"), isSortable: true },
  ];
  const rowKeys = [
    { key: "category", className: "min-w-32 pr-2" },

    {
      key: "paidQuantity",
      node: (row: any) => {
        return (
          <p key={"paidQuantity" + row.item} className={`${row?.className}`}>
            {row.paidQuantity}
          </p>
        );
      },
    },
    {
      key: "discount",
      node: (row: any) => {
        return (
          <p className={`${row?.className}`} key={"discount" + row.item}>
            {row.discount + " " + TURKISHLIRA}
          </p>
        );
      },
    },
    {
      key: "amount",
      node: (row: any) => {
        return (
          <p className={`${row?.className}`} key={"amount" + row.item}>
            {row.amount + " " + TURKISHLIRA}
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
            key={"totalAmountWithDiscount" + row.item}
          >
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
          title={t("Category Based Sales Report")}
          isActionsActive={false}
          isCollapsible={true}
        />
      </div>
    </>
  );
};

export default CategoryBasedSalesReport;
