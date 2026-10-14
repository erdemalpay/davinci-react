import { StockHistoryStatusEnum } from "../types";

// Envantere kutu üretmiş tüketim, stok geçmişi rozetinde ayrı etiketle gösterilir.
export const getStockHistoryStatusLabel = (
  row: { status: string; hasInventory?: boolean },
  label: string
) =>
  row.status === StockHistoryStatusEnum.CONSUMPTION && row.hasInventory
    ? "Inventory Consumption"
    : label;
