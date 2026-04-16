import { format } from "date-fns";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { OrderCollection, OrderCollectionItem, Table } from "../types";
import { useGetAccountPaymentMethods } from "../utils/api/account/paymentMethod";
import { useGetSellLocations } from "../utils/api/location";
import { useGetCollectionByTableId } from "../utils/api/order/orderCollection";
import { useGetUsersMinimal } from "../utils/api/user";
import { formatAsLocalDate, toIstDate } from "../utils/format";
import { getItem } from "../utils/getItem";

type NestedOrderItem = {
  _id?: number;
  name?: string;
};

type NestedOrderRef = {
  _id: number;
  item?: number | NestedOrderItem;
};

export type FormattedCollectionData = {
  date: string;
  tableId: number | undefined;
  tableName: string | undefined;
  hour: string;
  locationName: string | undefined;
  cashier: string | undefined;
  paymentMethod: string;
  amount: number;
  shopifyShippingAmount?: number;
  shopifyDiscountAmount?: number;
  cancelledBy: string | undefined;
  cancelledAt: string;
  cancelNote: string | undefined;
  status: string;
  orders: { product: string; quantity: number }[];
};

export function useFormattedCollectionData(
  selectedTableId: number | undefined,
  selectedCollectionId: number | undefined
): FormattedCollectionData | null {
  const { t } = useTranslation();
  const sellLocations = useGetSellLocations();
  const paymentMethods = useGetAccountPaymentMethods();
  const users = useGetUsersMinimal();
  const collectionDataRaw = useGetCollectionByTableId(selectedTableId);

  const collectionData: OrderCollection | undefined = Array.isArray(
    collectionDataRaw
  )
    ? collectionDataRaw.find((c) => c._id === selectedCollectionId)
    : collectionDataRaw;

  return useMemo(() => {
    if (
      !collectionData ||
      !collectionData.createdAt ||
      !collectionData.tableDate
    ) {
      return null;
    }

    const paymentMethod = paymentMethods.find(
      (method) =>
        method._id === collectionData.paymentMethod ||
        method.name === collectionData.paymentMethod
    );
    const resolveOrderProductName = (orderRef: number | NestedOrderRef) => {
      if (typeof orderRef === "object" && orderRef !== null) {
        const nestedItem = orderRef.item;
        if (typeof nestedItem === "object" && nestedItem !== null) {
          return nestedItem.name || "-";
        }
        return "-";
      }

      return "-";
    };
    const collectionDate = toIstDate(collectionData.tableDate);
    const istanbulTime = toIstDate(collectionData.createdAt);
    const cashier =
      users.find(
        (user) =>
          user._id === collectionData.createdBy ||
          user.name === collectionData.createdBy
      )?.name || collectionData.createdBy;

    return {
      date: formatAsLocalDate(format(collectionDate, "yyyy-MM-dd")),
      tableId: (collectionData.table as Table)?._id,
      tableName: (collectionData.table as Table)?.name,
      hour: format(istanbulTime, "HH:mm"),
      locationName: getItem(collectionData.location, sellLocations)?.name,
      cashier,
      paymentMethod: paymentMethod ? t(paymentMethod.name) : "",
      amount: collectionData.amount,
      shopifyShippingAmount: collectionData.shopifyShippingAmount,
      shopifyDiscountAmount: collectionData.shopifyDiscountAmount,
      cancelledBy: getItem(collectionData.cancelledBy, users)?.name,
      cancelledAt: collectionData.cancelledAt
        ? format(collectionData.cancelledAt, "HH:mm")
        : "",
      cancelNote: collectionData.cancelNote,
      status: collectionData.status,
      orders:
        collectionData.orders?.map(
          (orderCollectionItem: OrderCollectionItem) => {
            return {
              product: resolveOrderProductName(orderCollectionItem.order),
              quantity: orderCollectionItem.paidQuantity ?? 0,
            };
          }
        ) || [],
    };
  }, [collectionData, paymentMethods, sellLocations, users, t]);
}
