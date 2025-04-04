import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useGetStoreLocations } from "../../../utils/api/location";
import { useGetTablePlayerCounts } from "../../../utils/api/table";
import { formatAsLocalDate } from "../../../utils/format";
import GenericTable from "../../panelComponents/Tables/GenericTable";
import SwitchButton from "../../panelComponents/common/SwitchButton";
import { InputTypes } from "../../panelComponents/shared/types";

type FormElementsState = {
  [key: string]: any;
};
const TablePlayerCount = () => {
  const { t } = useTranslation();
  const now = new Date();
  const currentMonth = (now.getMonth() + 1).toString().padStart(2, "0");
  const currentYear = now.getFullYear().toString();
  const initialFilterPanelFormElements = {
    monthYear: currentMonth + "-" + currentYear,
  };
  const [showFilters, setShowFilters] = useState(false);
  const locations = useGetStoreLocations();
  const [tableKey, setTableKey] = useState(0);
  const [filterPanelFormElements, setFilterPanelFormElements] =
    useState<FormElementsState>(initialFilterPanelFormElements);
  const [month, year] = filterPanelFormElements.monthYear.split("-");
  const tablePlayerCounts = useGetTablePlayerCounts(month, year);
  const allRows = tablePlayerCounts;
  const [rows, setRows] = useState<any[]>(allRows);
  const columns = [{ key: t("Date"), isSortable: true }];
  const rowKeys = [
    {
      key: "date",
      className: `min-w-32`,
      node: (row: any) => {
        return formatAsLocalDate(row.date);
      },
    },
  ];
  for (const location of locations) {
    columns.push({ key: location?.name, isSortable: true });
    rowKeys.push({
      key: String(location._id),
      node: (row: any) => {
        return row?.countsByLocation?.[location._id?.toString()] ?? "";
      },
      className: `min-w-32`,
    });
  }
  const filters = [
    {
      label: t("Show Filters"),
      isUpperSide: true,
      node: <SwitchButton checked={showFilters} onChange={setShowFilters} />,
    },
  ];
  const filterPanelInputs = [
    {
      type: InputTypes.MONTHYEAR,
      formKey: "monthYear",
      label: t("Date"),
      required: true,
    },
  ];
  const filterPanel = {
    isFilterPanelActive: showFilters,
    inputs: filterPanelInputs,
    formElements: filterPanelFormElements,
    setFormElements: setFilterPanelFormElements,
    closeFilters: () => setShowFilters(false),
  };
  useEffect(() => {
    setRows(allRows);
    setTableKey((prev) => prev + 1);
  }, [tablePlayerCounts, locations, filterPanelFormElements]);
  return (
    <div className="w-[95%] mx-auto">
      <GenericTable
        key={tableKey}
        filterPanel={filterPanel}
        rowKeys={rowKeys}
        columns={columns}
        isActionsActive={false}
        rows={rows}
        filters={filters}
        title={t("Table Player Counts")}
      />
    </div>
  );
};

export default TablePlayerCount;
