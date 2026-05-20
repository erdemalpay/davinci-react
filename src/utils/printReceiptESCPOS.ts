// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import ReceiptPrinterEncoder from "@point-of-sale/receipt-printer-encoder";
import { MenuItem, Order, OrderStatus } from "../types";
import { getItem } from "./getItem";

type BuildReceiptParams = {
  orders: Order[];
  items: MenuItem[];
  title?: string;
  showNotes?: boolean;
};

export const buildReceiptData = ({
  orders,
  items,
  title = "DA VINCI BOARD GAME CAFE",
  showNotes = true,
}: BuildReceiptParams): Uint8Array | null => {
  const filteredOrders = (orders ?? []).filter(
    (order) => order?.status !== OrderStatus.CANCELLED
  );
  if (filteredOrders.length === 0) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let enc: any = new ReceiptPrinterEncoder({ language: "esc-pos", columns: 32 })
    .initialize()
    .align("center")
    .bold(true)
    .line(title)
    .bold(false)
    .rule({ style: "single" });

  for (const order of filteredOrders) {
    const quantity = Number(order?.quantity ?? 0);
    const itemName = getItem(order?.item, items)?.name || "Ürün";
    enc = enc
      .align("left")
      .bold(true)
      .line(`(${quantity}) ${itemName}`)
      .bold(false);
    if (showNotes && order?.note) {
      enc = enc.line(`  - ${order.note}`);
    }
  }

  return enc.newline(3).cut("partial").encode();
};
