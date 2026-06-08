import { scaleOrdinal } from "d3-scale";
import { schemeCategory10 } from "d3-scale-chromatic";

export const colors = scaleOrdinal(schemeCategory10).range();

export function getCountStockBgColor(row: {
  stockQuantity: number;
  countQuantity: number;
}): string {
  if (Number(row.stockQuantity) === Number(row.countQuantity)) return "bg-blue-100";
  if (Number(row.stockQuantity) > Number(row.countQuantity)) return "bg-red-100";
  return "bg-green-100";
}
