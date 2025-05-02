import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useFilterContext } from "../../../context/Filter.context";
import { useGetStoreLocations } from "../../../utils/api/location";
import { useGetTablePlayerCounts } from "../../../utils/api/table";
import { formatAsLocalDate } from "../../../utils/format";
import GenericTable from "../../panelComponents/Tables/GenericTable";
import SwitchButton from "../../panelComponents/common/SwitchButton";
import { InputTypes } from "../../panelComponents/shared/types";

const TablePlayerCount = () => {
  const { t } = useTranslation();
  const locations = useGetStoreLocations();
  const [tableKey, setTableKey] = useState(0);
  const {
    filterTablePlayerCountPanelFormElements,
    setFilterTablePlayerCountPanelFormElements,
    showTablePlayerCountFilters,
    setShowTablePlayerCountFilters,
  } = useFilterContext();
  const [month, year] =
    filterTablePlayerCountPanelFormElements.monthYear.split("-");
  const tablePlayerCounts = useGetTablePlayerCounts(month, year);
  const allRows = tablePlayerCounts?.map((tablePlayerCount) => {
    return {
      ...tablePlayerCount,
      formattedDate: formatAsLocalDate(tablePlayerCount.date),
      ...locations?.reduce((acc, location) => {
        acc[location._id.toString()] =
          tablePlayerCount?.countsByLocation?.[location._id.toString()] ?? "";
        return acc;
      }, {} as Record<string, any>),
    };
  });
  const [rows, setRows] = useState<any[]>(allRows);
  const columns = [
    { key: t("Date"), isSortable: true, correspondingKey: "formattedDate" },
  ];
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
    columns.push({
      key: location?.name,
      isSortable: true,
      correspondingKey: location._id.toString(),
    });
    rowKeys.push({
      key: location._id.toString(),
      className: `min-w-32`,
    } as any);
  }
  const filters = [
    {
      label: t("Show Filters"),
      isUpperSide: true,
      node: (
        <SwitchButton
          checked={showTablePlayerCountFilters}
          onChange={() => {
            setShowTablePlayerCountFilters(!showTablePlayerCountFilters);
          }}
        />
      ),
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
    isFilterPanelActive: showTablePlayerCountFilters,
    inputs: filterPanelInputs,
    formElements: filterTablePlayerCountPanelFormElements,
    setFormElements: setFilterTablePlayerCountPanelFormElements,
    closeFilters: () => setShowTablePlayerCountFilters(false),
  };
  useEffect(() => {
    setRows(allRows);
    setTableKey((prev) => prev + 1);
  }, [tablePlayerCounts, locations, filterTablePlayerCountPanelFormElements]);
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
        isExcel={true}
        excelFileName={t("TablePlayerCounts.xlsx")}
        title={t("Table Player Counts")}
      />
    </div>
  );
};

export default TablePlayerCount;
