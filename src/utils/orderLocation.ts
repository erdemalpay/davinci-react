import { OnlineLocationId, Table } from "../types";

// Online satış masasının siparişi seçili şubeye değil online satış konumuna yazılır.
export function getOrderLocation(
  table: Pick<Table, "isOnlineSale"> | undefined,
  locationId: number
) {
  return table?.isOnlineSale ? OnlineLocationId : locationId;
}
