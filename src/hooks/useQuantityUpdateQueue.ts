import { useEffect, useRef, useState } from "react";
import { Order } from "../types";
import { useOrderMutations } from "../utils/api/order/order";

type PendingQuantity = {
  quantity: number;
  paidQuantity?: number;
};

const QUANTITY_UPDATE_DELAY_MS = 300;

// Debounced quantity clicks for order list rows, like the number buttons in
// TextInput (isDebounce). A second request for an order never starts before
// the first ends: the server refunds stock from the quantity difference.
export function useQuantityUpdateQueue(
  tableOrders: Order[] | undefined,
  updateOrder: ReturnType<typeof useOrderMutations>["updateOrder"]
) {
  const [pendingQuantities, setPendingQuantities] = useState<
    Record<number, PendingQuantity>
  >({});
  const [settledCount, setSettledCount] = useState(0);
  const pendingQuantitiesRef = useRef<Record<number, PendingQuantity>>({});
  const quantityTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>(
    {}
  );
  const quantityUpdatingOrderIds = useRef(new Set<number>());

  const removePendingQuantity = (orderId: number) => {
    delete pendingQuantitiesRef.current[orderId];
    setPendingQuantities((prev) => {
      const next = { ...prev };
      delete next[orderId];
      return next;
    });
  };
  const sendQuantity = (orderId: number) => {
    const target = pendingQuantitiesRef.current[orderId];
    if (!target || quantityUpdatingOrderIds.current.has(orderId)) return;
    quantityUpdatingOrderIds.current.add(orderId);
    updateOrder(
      { id: orderId, updates: target },
      {
        onError: () => removePendingQuantity(orderId),
        onSettled: () => {
          quantityUpdatingOrderIds.current.delete(orderId);
          const latest = pendingQuantitiesRef.current[orderId];
          if (latest && latest.quantity !== target.quantity) {
            sendQuantity(orderId);
          }
          setSettledCount((prev) => prev + 1);
        },
      }
    );
  };
  const queueQuantityUpdate = (orderId: number, target: PendingQuantity) => {
    pendingQuantitiesRef.current[orderId] = target;
    setPendingQuantities((prev) => ({ ...prev, [orderId]: target }));
    clearTimeout(quantityTimers.current[orderId]);
    quantityTimers.current[orderId] = setTimeout(() => {
      delete quantityTimers.current[orderId];
      sendQuantity(orderId);
    }, QUANTITY_UPDATE_DELAY_MS);
  };
  const getQuantityBase = (order: Order): PendingQuantity =>
    pendingQuantities[order?._id] ?? {
      quantity: order?.quantity,
      paidQuantity: order?.paidQuantity,
    };

  useEffect(() => {
    setPendingQuantities((prev) => {
      const next = { ...prev };
      let changed = false;
      Object.keys(prev).forEach((key) => {
        const orderId = Number(key);
        if (
          quantityTimers.current[orderId] ||
          quantityUpdatingOrderIds.current.has(orderId)
        ) {
          return;
        }
        const serverOrder = tableOrders?.find((o) => o._id === orderId);
        if (!serverOrder || serverOrder.quantity === prev[orderId].quantity) {
          delete next[orderId];
          delete pendingQuantitiesRef.current[orderId];
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [tableOrders, settledCount]);
  useEffect(
    () => () => {
      Object.keys(quantityTimers.current).forEach((key) => {
        clearTimeout(quantityTimers.current[Number(key)]);
        sendQuantity(Number(key));
      });
    },
    []
  );

  return { getQuantityBase, queueQuantityUpdate };
}
