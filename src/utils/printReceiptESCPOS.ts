// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import ReceiptPrinterEncoder from "@point-of-sale/receipt-printer-encoder";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { MenuItem, Order, OrderStatus } from "../types";
import { getItem } from "./getItem";

export const buildNewOrderReceipt = (): Uint8Array => {
  return new ReceiptPrinterEncoder({ language: "esc-pos", columns: 32 })
    .initialize()
    .align("center")
    .bold(true)
    .line("YENI SIPARIS")
    .bold(false)
    .newline(3)
    .cut("partial")
    .encode();
};

type BuildReceiptParams = {
  orders: Order[];
  items: MenuItem[];
  tableName?: string;
  title?: string;
  showNotes?: boolean;
  printedAt?: Date;
};

const loadLogoCanvas = (): Promise<HTMLCanvasElement | null> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, 128, 128);
        ctx.drawImage(img, 0, 0, 128, 128);
        resolve(canvas);
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = "/logo.svg";
  });
};

export const buildReceiptData = async ({
  orders,
  items,
  tableName,
  title = "DA VINCI BOARD GAME CAFE",
  showNotes = true,
  printedAt = new Date(),
}: BuildReceiptParams): Promise<Uint8Array | null> => {
  const filteredOrders = (orders ?? []).filter(
    (order) => order?.status !== OrderStatus.CANCELLED
  );
  if (filteredOrders.length === 0) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let enc: any = new ReceiptPrinterEncoder({ language: "esc-pos", columns: 32 })
    .initialize()
    .align("center");

  // Logo
  const logo = await loadLogoCanvas();
  if (logo) {
    enc = enc.image(logo, 128, 128, "threshold");
  }

  // Başlık
  enc = enc.bold(true).line(title).bold(false).rule({ style: "single" });

  // Masa adı
  if (tableName) {
    enc = enc
      .align("left")
      .bold(true)
      .line(`Masa : ${tableName}`)
      .bold(false);
  }

  // Tarih
  const formattedDate = format(printedAt, "dd.MM.yyyy HH:mm", { locale: tr });
  enc = enc.align("left").line(`Tarih: ${formattedDate}`).rule({ style: "single" });

  // Siparişler
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
