import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { MenuItem, Order, OrderStatus } from "../types";
import { getItem } from "./getItem";

type PrintTableReceiptParams = {
  tableName: string;
  orders: Order[];
  items: MenuItem[];
  title?: string;
  printedAt?: Date;
  showLogo?: boolean;
  showDate?: boolean;
  showTableInfo?: boolean;
  showNotes?: boolean;
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const formatNoteHtml = (note?: string) => {
  if (!note) return "";
  return escapeHtml(note).replace(/\n/g, "<br />");
};

export const printTableReceipt = ({
  tableName,
  orders,
  items,
  title = "DA VINCI BOARD GAME CAFE",
  printedAt = new Date(),
  showLogo = true,
  showDate = true,
  showTableInfo = true,
  showNotes = true,
}: PrintTableReceiptParams) => {
  const filteredOrders = (orders ?? []).filter(
    (order) => order?.status !== OrderStatus.CANCELLED
  );
  if (filteredOrders.length === 0) return;

  const printFrame = document.createElement("iframe");
  printFrame.style.visibility = "hidden";
  printFrame.style.position = "absolute";
  printFrame.style.width = "0";
  printFrame.style.height = "0";
  document.body.appendChild(printFrame);

  const content = filteredOrders
    .map((order) => {
      const quantity = Number(order?.quantity ?? 0);
      const itemName = getItem(order?.item, items)?.name || "Ürün";
      const noteHtml = showNotes ? formatNoteHtml(order?.note) : "";

      return `<div class="item-block">
        <div class="item-row">
          <span class="item-name">(${quantity}) ${escapeHtml(itemName)}</span>
        </div>
        ${noteHtml ? `<div class="item-note">- ${noteHtml}</div>` : ""}
      </div>`;
    })
    .join("");

  const formattedDate = format(printedAt, "dd MMMM yyyy EEEE HH:mm", {
    locale: tr,
  });
  const safeTableName = escapeHtml(tableName);


  const logoSection = showLogo
    ? `<div class="logo-row"><img class="logo" src="/logo.svg" alt="Logo" /></div>`
    : "";
  const dateSection = showDate
    ? `<div class="section bold">Tarih: ${formattedDate}</div>`
    : "";
  const tableInfoSection = showTableInfo
    ? `<div class="section bold">${safeTableName} numaralı masa</div><div class="divider"></div>`
    : "";

  const htmlContent = `
    <html>
      <head>
        <title>Print Receipt</title>
        <style>
          * { box-sizing: border-box; }
          @page { margin: 6mm; }
          body { font-family: 'Courier New', Courier, monospace; margin: 0; padding: 8px; background: #fff; color: #000; }
          .receipt { width: 320px; margin: 0 auto; }
          .logo-row { display: flex; justify-content: center; margin-bottom: 4px; }
          .logo { width: 56px; height: 56px; object-fit: contain; }
          .title { text-align: center; font-size: 13px; font-weight: bold; border-bottom: 2px solid black; padding-bottom: 10px; }
          .section { margin-top: 6px; font-size: 14px; }
          .section.bold { font-weight: 700; }
          .divider { border-top: 1px dashed #000; margin: 6px 0; }
          .header-row, .item-row, .total-row { display: flex; justify-content: space-between; font-size: 14px; }
          .item-row { font-weight: 700; }
          .item-note { font-size: 10px; margin-left: 8px; margin-top: 2px; }
          .total-row { font-weight: 700; margin-top: 6px; }
          .original-price { text-decoration: line-through; margin-left: auto; margin-right: 10px; color: #666; }
        </style>
      </head>
      <body>
        <div class="receipt">
          ${logoSection}
          <div class="title">${escapeHtml(title)}</div>
          ${dateSection}
          ${showDate || showTableInfo ? '<div class="divider"></div>' : ""}
          ${tableInfoSection}
          ${content}
        </div>
      </body>
    </html>
  `;

  printFrame.srcdoc = htmlContent;

  printFrame.onload = () => {
    printFrame.contentWindow?.print();
    setTimeout(() => {
      document.body.removeChild(printFrame);
    }, 100);
  };
};
