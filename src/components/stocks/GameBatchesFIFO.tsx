import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  GameBatchFIFO,
  useGetAccountProducts,
  useGetGameBatchesWithFIFO,
} from "../../utils/api/account/product";
import { useGetAllLocations } from "../../utils/api/location";
import { formatAsLocalDate } from "../../utils/format";
import GenericTable from "../panelComponents/Tables/GenericTable";

// Batches of the online depot (Neorama Depo). A batch is used up when its
// games leave the depot, whether sold or transferred to another location.

const average = (values: number[]) =>
  values.length
    ? Math.round(values.reduce((sum, v) => sum + v, 0) / values.length)
    : null;

const GameBatchesFIFO = () => {
  const { t } = useTranslation();
  const products = useGetAccountProducts();
  const locations = useGetAllLocations();
  const gameBatches = useGetGameBatchesWithFIFO();

  const rows = useMemo(() => {
    if (!gameBatches || gameBatches.length === 0) return [];
    const locationName = (id: number | null) =>
      id === null
        ? t("Unknown")
        : locations?.find((l) => l._id === id)?.name ?? String(id);

    const groupedByProduct = gameBatches.reduce((acc, batch) => {
      if (!acc[batch.productId]) acc[batch.productId] = [];
      acc[batch.productId].push(batch);
      return acc;
    }, {} as Record<string, GameBatchFIFO[]>);

    return Object.entries(groupedByProduct).map(([productId, batches]) => {
      const sortedBatches = [...batches].sort((a, b) => a.batchNo - b.batchNo);
      const finished = sortedBatches.filter(
        (b) => !b.isActive && b.duration !== null
      );
      const foundProduct = products?.find((p) => p._id === productId);
      const avgDuration = average(finished.map((b) => b.duration as number));
      const avgDuration90 = average(
        finished
          .filter((b) => b.duration90 !== null)
          .map((b) => b.duration90 as number)
      );

      return {
        _id: productId,
        productId,
        productName: foundProduct?.name ?? productId,
        batchCount: sortedBatches.length,
        totalPurchased: sortedBatches.reduce(
          (sum, b) => sum + b.purchasedQuantity,
          0
        ),
        totalRemaining: sortedBatches.reduce(
          (sum, b) => sum + b.remainingQuantity,
          0
        ),
        avgDuration: avgDuration ?? "",
        avgDuration90: avgDuration90 ?? "",
        collapsible: {
          collapsibleHeader: t("Batch Details"),
          collapsibleColumns: [
            { key: "#", isSortable: false },
            { key: t("Arrival Date"), isSortable: false },
            { key: t("Quantity"), isSortable: false },
            { key: t("Sold"), isSortable: false },
            { key: t("Transferred"), isSortable: false },
            { key: t("Other"), isSortable: false },
            { key: t("Returned"), isSortable: false },
            { key: t("Remaining"), isSortable: false },
            { key: t("Sales Start"), isSortable: false },
            { key: t("Sold Out"), isSortable: false },
            { key: t("Days to Sell Out"), isSortable: false },
            { key: t("Days to 90%"), isSortable: false },
            { key: t("Days in Depot"), isSortable: false },
            { key: t("Avg/Day"), isSortable: false },
          ],
          collapsibleRows: sortedBatches.map((batch) => ({
            ...batch,
            transferText: batch.transferredQuantity
              ? `${batch.transferredQuantity} (${batch.transfers
                  .map((tr) => `${locationName(tr.location)} ${tr.quantity}`)
                  .join(", ")})`
              : "0",
          })),
          collapsibleRowKeys: [
            { key: "batchNo" },
            {
              key: "purchaseDate",
              node: (b: GameBatchFIFO) => formatAsLocalDate(b.purchaseDate),
            },
            { key: "purchasedQuantity" },
            { key: "soldQuantity" },
            { key: "transferText" },
            { key: "otherOutQuantity" },
            { key: "returnedQuantity" },
            { key: "remainingQuantity" },
            {
              key: "sellStartDate",
              node: (b: GameBatchFIFO) =>
                b.sellStartDate ? formatAsLocalDate(b.sellStartDate) : "-",
            },
            {
              key: "endDate",
              node: (b: GameBatchFIFO) =>
                b.endDate ? (
                  formatAsLocalDate(b.endDate)
                ) : (
                  <span className="text-green-600">{t("In stock")}</span>
                ),
            },
            {
              key: "duration",
              node: (b: GameBatchFIFO) =>
                b.duration === null
                  ? "-"
                  : `${b.duration}${b.isActive ? "+" : ""}`,
            },
            {
              key: "duration90",
              node: (b: GameBatchFIFO) => b.duration90 ?? "-",
            },
            {
              key: "shelfDuration",
              node: (b: GameBatchFIFO) =>
                `${b.shelfDuration}${b.isActive ? "+" : ""}`,
            },
            {
              key: "averageSalesPerDay",
              node: (b: GameBatchFIFO) => b.averageSalesPerDay.toFixed(2),
            },
          ],
        },
      };
    });
  }, [gameBatches, products, locations, t]);

  const columns = useMemo(
    () => [
      { key: t("Game"), isSortable: true },
      { key: t("Batches"), isSortable: true },
      { key: t("Total Purchased"), isSortable: true },
      { key: t("Total Remaining"), isSortable: true },
      { key: t("Avg. Days to Sell Out"), isSortable: true },
      { key: t("Avg. Days to 90%"), isSortable: true },
    ],
    [t]
  );

  const rowKeys = useMemo(
    () => [
      { key: "productName" },
      { key: "batchCount" },
      { key: "totalPurchased" },
      { key: "totalRemaining" },
      { key: "avgDuration" },
      { key: "avgDuration90" },
    ],
    []
  );

  return (
    <div className="w-[95%] mx-auto">
      <p className="text-sm text-gray-600 mb-2">
        {t(
          "Neorama Depot batches. A batch is used up when its games leave the depot, sold or transferred. Days are counted from the first game leaving the batch."
        )}
      </p>
      <GenericTable
        rowKeys={rowKeys}
        columns={columns}
        rows={rows}
        title={t("Game Batches (FIFO)")}
        isActionsActive={false}
        isCollapsible={true}
      />
    </div>
  );
};

export default GameBatchesFIFO;
