import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useUserContext } from "../../../context/User.context";
import { useFilterContext } from "../../../context/Filter.context";
import {
  ActionEnum,
  DisabledConditionEnum,
} from "../../../types";
import { useGetStoreLocations } from "../../../utils/api/location";
import { useGetTablePlayerCounts } from "../../../utils/api/table";
import { formatAsLocalDate } from "../../../utils/format";
import { useGetDisabledConditions } from "../../../utils/api/panelControl/disabledCondition";
import { getItem } from "../../../utils/getItem";
import GenericTable from "../../panelComponents/Tables/GenericTable";
import SwitchButton from "../../panelComponents/common/SwitchButton";
import { InputTypes } from "../../panelComponents/shared/types";

const TablePlayerCount = () => {
  const { t } = useTranslation();
  const locations = useGetStoreLocations();
  const {
    filterTablePlayerCountPanelFormElements,
    setFilterTablePlayerCountPanelFormElements,
    showTablePlayerCountFilters,
    setShowTablePlayerCountFilters,
  } = useFilterContext();
  const { user } = useUserContext();
  const disabledConditions = useGetDisabledConditions();
  const [month, year] =
    filterTablePlayerCountPanelFormElements.monthYear.split("-");
  const tablePlayerCounts = useGetTablePlayerCounts(month, year);

  const tablePlayerCountsDisabledCondition = useMemo(() => {
    return getItem(
      DisabledConditionEnum.ANALYTICS_TABLEPLAYERCOUNTS,
      disabledConditions
    );
  }, [disabledConditions]);

  const rows = useMemo(() => {
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
    return allRows || [];
  }, [tablePlayerCounts, locations]);

  const columns = useMemo(() => {
    const baseColumns = [
      { key: t("Date"), isSortable: true, correspondingKey: "formattedDate" },
    ];

    for (const location of locations) {
      baseColumns.push({
        key: location?.name,
        isSortable: true,
        correspondingKey: location._id.toString(),
      });
    }

    return baseColumns;
  }, [t, locations]);

  const rowKeys = useMemo(() => {
    const baseRowKeys = [
      {
        key: "date",
        className: `min-w-32`,
        node: (row: any) => {
          return formatAsLocalDate(row.date);
        },
      },
    ];

    for (const location of locations) {
      baseRowKeys.push({
        key: location._id.toString(),
        className: `min-w-32`,
      } as any);
    }

    return baseRowKeys;
  }, [locations]);

  const filters = useMemo(
    () => [
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
    ],
    [t, showTablePlayerCountFilters, setShowTablePlayerCountFilters]
  );

  const filterPanelInputs = useMemo(
    () => [
      {
        type: InputTypes.MONTHYEAR,
        formKey: "monthYear",
        label: t("Date"),
        required: true,
      },
    ],
    [t]
  );

  const filterPanel = useMemo(
    () => ({
      isFilterPanelActive: showTablePlayerCountFilters,
      inputs: filterPanelInputs,
      formElements: filterTablePlayerCountPanelFormElements,
      setFormElements: setFilterTablePlayerCountPanelFormElements,
      closeFilters: () => setShowTablePlayerCountFilters(false),
    }),
    [
      showTablePlayerCountFilters,
      filterPanelInputs,
      filterTablePlayerCountPanelFormElements,
      setFilterTablePlayerCountPanelFormElements,
      setShowTablePlayerCountFilters,
    ]
  );

  return (
    <div className="w-[95%] mx-auto">
      <GenericTable
        filterPanel={filterPanel}
        rowKeys={rowKeys}
        columns={columns}
        isActionsActive={false}
        rows={rows}
        filters={filters}
        isExcel={
          !tablePlayerCountsDisabledCondition?.actions?.some(
            (ac) =>
              ac.action === ActionEnum.EXCEL &&
              user?.role?._id &&
              !ac?.permissionsRoles?.includes(user?.role?._id)
          )
        }
        excelFileName={t("TablePlayerCounts.xlsx")}
        title={t("Table Player Counts")}
      />
    </div>
  );
};

export default TablePlayerCount;
