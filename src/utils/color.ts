import { scaleOrdinal } from "d3-scale";
import { schemeCategory10 } from "d3-scale-chromatic";

export const colors = scaleOrdinal(schemeCategory10).range();

// Sayımda rafta görülmesi beklenen adet: stok ile pazaryeri siparişlerine
// ayrılmış ama henüz kargoya verilmemiş adetlerin toplamı.
export function getCountExpectedQuantity(row: {
  stockQuantity?: number;
  reservedQuantity?: number;
}): number {
  return Number(row.stockQuantity ?? 0) + Number(row.reservedQuantity ?? 0);
}

export function getCountStockBgColor(row: {
  stockQuantity: number;
  reservedQuantity?: number;
  countQuantity: number;
}): string {
  const expected = getCountExpectedQuantity(row);
  if (expected === Number(row.countQuantity)) return "bg-blue-100";
  if (expected > Number(row.countQuantity)) return "bg-red-100";
  return "bg-green-100";
}
