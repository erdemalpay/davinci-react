import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FormElementsState } from "../../types";
import {
  GameBatchFIFO,
  useGetAccountProducts,
  useGetGameBatchesWithFIFO,
} from "../../utils/api/account/product";
import { useGetAllLocations } from "../../utils/api/location";
import { formatAsLocalDate } from "../../utils/format";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { InputTypes } from "../panelComponents/shared/types";
import GenericTable from "../panelComponents/Tables/GenericTable";

const GameBatchesFIFO = () => {
  const { t } = useTranslation();
  const products = useGetAccountProducts();
  const locations = useGetAllLocations();
  const [showFilters, setShowFilters] = useState(false);
  const [filterFormElements, setFilterFormElements] =
    useState<FormElementsState>({
      location: 6,
    });
  const gameBatches = useGetGameBatchesWithFIFO(filterFormElements.location);

  // Group batches by productId and create rows with embedded collapsible data
  const rows = useMemo(() => {
    if (!gameBatches || gameBatches.length === 0) return [];

    const groupedByProduct = gameBatches.reduce((acc, batch) => {
      if (!acc[batch.productId]) {
        acc[batch.productId] = [];
      }
      acc[batch.productId].push(batch);
      return acc;
    }, {} as Record<string, GameBatchFIFO[]>);

    return Object.entries(groupedByProduct).map(([productId, batches]) => {
      const sortedBatches = batches.sort(
        (a, b) =>
          new Date(a.purchaseDate).getTime() -
          new Date(b.purchaseDate).getTime()
      );

      const totalPurchased = sortedBatches.reduce(
        (sum, b) => sum + b.purchasedQuantity,
        0
      );
      const totalRemaining = sortedBatches.reduce(
        (sum, b) => sum + b.remainingQuantity,
        0
      );
      const foundProduct = products?.find((p) => p._id === productId);

      return {
        _id: productId,
        productId,
        productName: foundProduct?.name ?? productId,
        totalPurchased,
        totalRemaining,
        batchCount: sortedBatches.length,
        collapsible: {
          collapsibleHeader: t("Batch Details"),
          collapsibleColumns: [
            { key: t("Quantity"), isSortable: false },
            { key: t("Start Date"), isSortable: false },
            { key: t("End Date"), isSortable: false },
            { key: t("Duration (days)"), isSortable: false },
            { key: t("Avg Sales/Day"), isSortable: false },
            { key: t("Remaining"), isSortable: false },
          ],
          collapsibleRows: sortedBatches.map((batch) => ({
            purchasedQuantity: batch.purchasedQuantity,
            startDate: batch.startDate,
            endDate: batch.endDate,
            duration: batch.duration,
            averageSalesPerDay: batch.averageSalesPerDay,
            remainingQuantity: batch.remainingQuantity,
          })),
          collapsibleRowKeys: [
            { key: "purchasedQuantity" },
            {
              key: "startDate",
              node: (batch: any) => formatAsLocalDate(batch.startDate),
            },
            {
              key: "endDate",
              node: (batch: any) => formatAsLocalDate(batch.endDate),
            },
            { key: "duration" },
            {
              key: "averageSalesPerDay",
              node: (batch: any) => batch.averageSalesPerDay.toFixed(2),
            },
            { key: "remainingQuantity" },
          ],
        },
      };
    });
  }, [gameBatches, products, t]);

  const columns = useMemo(
    () => [
      { key: t("Game"), isSortable: true },
      { key: t("Total Purchased"), isSortable: true },
      { key: t("Total Remaining"), isSortable: true },
      { key: t("Batches"), isSortable: false },
    ],
    [t]
  );

  const rowKeys = useMemo(
    () => [
      { key: "productName" },
      { key: "totalPurchased" },
      { key: "totalRemaining" },
      {
        key: "batchCount",
        node: (row: any) => (
          <span>
            {row.batchCount} {t("batches")}
          </span>
        ),
      },
    ],
    [t]
  );
  const filterPanelInputs = useMemo(
    () => [
      {
        type: InputTypes.SELECT,
        formKey: "location",
        label: t("Location"),
        options: locations.map((input) => ({
          value: input._id,
          label: input.name,
        })),
        placeholder: t("Location"),
        required: true,
      },
    ],
    [locations, t]
  );
  const filters = useMemo(
    () => [
      {
        label: t("Show Filters"),
        isUpperSide: true,
        node: (
          <SwitchButton
            checked={showFilters}
            onChange={() => {
              setShowFilters(!showFilters);
            }}
          />
        ),
      },
    ],
    [t, showFilters, setShowFilters]
  );
  const filterPanel = useMemo(
    () => ({
      isFilterPanelActive: showFilters,
      inputs: filterPanelInputs,
      formElements: filterFormElements,
      setFormElements: setFilterFormElements,
      closeFilters: () => setShowFilters(false),
    }),
    [
      showFilters,
      filterPanelInputs,
      filterFormElements,
      setFilterFormElements,
      setShowFilters,
    ]
  );

  return (
    <div className="w-[95%] mx-auto">
      <GenericTable
        rowKeys={rowKeys}
        columns={columns}
        rows={rows}
        filterPanel={filterPanel}
        filters={filters}
        title={t("Game Batches (FIFO)")}
        isActionsActive={false}
        isCollapsible={true}
      />
    </div>
  );
};

export default GameBatchesFIFO;
