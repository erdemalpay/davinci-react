import { scaleOrdinal } from "d3-scale";
import { schemeCategory10 } from "d3-scale-chromatic";

export const colors = scaleOrdinal(schemeCategory10).range();

export function getCountStockBgColor(row: {
  stockQuantity: number;
  countQuantity: number;
  // Pazaryeri siparişlerine ayrılmış ama hâlâ rafta duran adet; sayımda
  // görülmesi beklendiği için stoğa eklenir.
  reservedQuantity?: number;
}): string {
  const expected =
    Number(row.stockQuantity) + Number(row.reservedQuantity ?? 0);
  if (expected === Number(row.countQuantity)) return "bg-blue-100";
  if (expected > Number(row.countQuantity)) return "bg-red-100";
  return "bg-green-100";
}
