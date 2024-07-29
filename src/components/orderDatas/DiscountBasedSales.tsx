import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useGeneralContext } from "../../context/General.context";
import { Location, MenuItem, Table } from "../../types";
import { useGetLocations } from "../../utils/api/location";
import { useGetOrders } from "../../utils/api/order/order";
import { useGetOrderDiscounts } from "../../utils/api/order/orderDiscount";
import { useGetAllOrderPayments } from "../../utils/api/order/orderPayment";
import { LocationInput } from "../../utils/panelInputs";
import { passesFilter } from "../../utils/passesFilter";
import GenericTable from "../panelComponents/Tables/GenericTable";
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
  discountId: number;
  discountName: string;
  amount: number;
  location: number;
  date: string;
  totalAmountWithDiscount: number;
  itemQuantity: ItemQuantity[];
  collapsible: any;
  className?: string;
};
type FormElementsState = {
  [key: string]: any;
};
const DiscountBasedSales = () => {
  const { t } = useTranslation();
  const orderPayments = useGetAllOrderPayments();
  const discounts = useGetOrderDiscounts();
  const orders = useGetOrders();
  const locations = useGetLocations();
  const [showFilters, setShowFilters] = useState(false);
  if (!orderPayments || !orders || !locations || !discounts) {
    return null;
  }
  const [filterPanelFormElements, setFilterPanelFormElements] =
    useState<FormElementsState>({
      discount: "",
      location: "",
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
      if (
        !foundOrder ||
        !orderPaymentItem.discount ||
        orderPaymentItem.paidQuantity === 0
      )
        return;
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
          filterPanelFormElements.discount,
          orderPaymentItem.discount
        )
      ) {
        return;
      }
      const existingEntry = acc.find(
        (item) => item.discountId === orderPaymentItem.discount
      );

      if (existingEntry) {
        existingEntry.paidQuantity += orderPaymentItem.paidQuantity;
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
          discountId: orderPaymentItem.discount,
          discountName:
            discounts.find(
              (discount) => discount._id === orderPaymentItem.discount
            )?.name ?? "",
          amount: orderPaymentItem.paidQuantity * foundOrder.unitPrice,
          location: (foundOrder.location as Location)._id,
          date: (foundOrder.table as Table).date,
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
      itemName: "",
      paidQuantity: orderWithInfo.reduce(
        (acc, item) => acc + item.paidQuantity,
        0
      ),
      className: "font-semibold",
      discountId: 0,
      discountName: "Toplam",
      amount: orderWithInfo.reduce((acc, item) => acc + item.amount, 0),
      totalAmountWithDiscount: orderWithInfo.reduce(
        (acc, item) => acc + item.totalAmountWithDiscount,
        0
      ),
      location: 4,
      date: "",
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
    { key: t("Discount"), isSortable: true },
    { key: t("Quantity"), isSortable: true },
  ];
  const rowKeys = [
    {
      key: "discountName",
      node: (row: any) => {
        return <p className={`${row?.className}`}>{row.discountName}</p>;
      },
    },
    {
      key: "paidQuantity",
      node: (row: any) => {
        return (
          <p className={`${row?.className} text-center `}>{row.paidQuantity}</p>
        );
      },
    },
  ];

  const filterPanelInputs = [
    LocationInput({ locations: locations, required: true }),
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
  }, [orders, orderPayments, filterPanelFormElements]);
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
          title={t("Discount Based Sales")}
          isActionsActive={false}
          isCollapsible={true}
        />
      </div>
    </>
  );
};

export default DiscountBasedSales;
