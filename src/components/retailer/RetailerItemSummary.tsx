import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { FormElementsState } from "../../types";
import {
  RetailerCollectionItemSummaryItem,
  useGetRetailerCollectionItemSummary,
} from "../../utils/api/account/retailer";
import GenericTable from "../panelComponents/Tables/GenericTable";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { InputTypes } from "../panelComponents/shared/types";

type RetailerItemSummaryRow = RetailerCollectionItemSummaryItem & {
  itemIdDisplay: string;
};

const RetailerItemSummary = () => {
  const { t } = useTranslation();
  const { retailerId } = useParams();

  const initialFilterFormElements = useMemo(
    () => ({
      after: "",
      before: "",
    }),
    []
  );

  const [showFilters, setShowFilters] = useState(false);
  const [filterFormElements, setFilterFormElements] =
    useState<FormElementsState>(initialFilterFormElements);

  const retailerItemSummaryData = useGetRetailerCollectionItemSummary(retailerId, {
    after: (filterFormElements.after as string) || undefined,
    before: (filterFormElements.before as string) || undefined,
  });

  const rows = useMemo<RetailerItemSummaryRow[]>(
    () =>
      (retailerItemSummaryData?.items ?? []).map((item) => ({
        ...item,
        itemIdDisplay: String(item.itemId ?? "-"),
      })),
    [retailerItemSummaryData]
  );

  const columns = useMemo(
    () => [
      { key: t("Item"), isSortable: true, correspondingKey: "itemName" },
      {
        key: t("Quantity"),
        isSortable: true,
        correspondingKey: "quantity",
      },
    ],
    [t]
  );

  const rowKeys = useMemo(
    () => [
      { key: "itemName", className: "min-w-56 font-medium" },
      { key: "quantity", className: "min-w-24" },
    ],
    []
  );

  const filterPanelInputs = useMemo(
    () => [
      {
        type: InputTypes.DATE,
        formKey: "after",
        label: t("Start Date"),
        placeholder: t("Start Date"),
        required: true,
        isDatePicker: true,
        isOnClearActive: false,
      },
      {
        type: InputTypes.DATE,
        formKey: "before",
        label: t("End Date"),
        placeholder: t("End Date"),
        required: true,
        isDatePicker: true,
        isOnClearActive: false,
      },
    ],
    [t]
  );

  const tableFilters = useMemo(
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
    [showFilters, t]
  );

  const filterPanel = useMemo(
    () => ({
      isFilterPanelActive: showFilters,
      inputs: filterPanelInputs,
      formElements: filterFormElements,
      setFormElements: setFilterFormElements,
      closeFilters: () => setShowFilters(false),
      additionalFilterCleanFunction: () => {
        setFilterFormElements(initialFilterFormElements);
      },
    }),
    [
      filterFormElements,
      filterPanelInputs,
      initialFilterFormElements,
      showFilters,
    ]
  );

  return (
    <div className="w-[95%] mx-auto my-6">
      <GenericTable<RetailerItemSummaryRow>
        title={
          retailerItemSummaryData?.retailer?.name || t("Retailer Item Summary")
        }
        rows={rows}
        columns={columns}
        rowKeys={rowKeys}
        filters={tableFilters}
        filterPanel={filterPanel}
        isActionsActive={false}
        isPagination={false}
      />
    </div>
  );
};

export default RetailerItemSummary;
