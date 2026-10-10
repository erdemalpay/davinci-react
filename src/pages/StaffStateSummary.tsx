import { format } from "date-fns";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Header } from "../components/header/Header";
import GenericTable from "../components/panelComponents/Tables/GenericTable";
import SwitchButton from "../components/panelComponents/common/SwitchButton";
import { InputTypes } from "../components/panelComponents/shared/types";
import { useDataContext } from "../context/Data.context";
import { BreakTypeEnum, FormElementsState } from "../types";
import { useGetStaffStateSummary } from "../utils/api/break";
import { useGetAllLocations } from "../utils/api/location";
import { getItem } from "../utils/getItem";

// Columns of the summary, in order: the busy states, then explaining games
// and middleman.
const stateColumns: { key: string; label: string }[] = [
  { key: BreakTypeEnum.BREAK, label: "Break" },
  { key: BreakTypeEnum.RECOMMENDING_GAME, label: "Recommending a game" },
  { key: BreakTypeEnum.PREPARING_ORDER, label: "Preparing an order" },
  { key: BreakTypeEnum.TAKING_PAYMENT, label: "Taking a payment" },
  { key: BreakTypeEnum.OTHER, label: "Other" },
  { key: "EXPLAINING", label: "Explaining a game" },
  { key: "MIDDLEMAN", label: "Middleman" },
];

// 95 minutes -> "1:35".
const formatMinutes = (minutes = 0) =>
  `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, "0")}`;

// How long each person spent in each state on a day, for managers.
export default function StaffStateSummary() {
  const { t } = useTranslation();
  const locations = useGetAllLocations();
  const { users = [] } = useDataContext();
  const [filterPanelFormElements, setFilterPanelFormElements] =
    useState<FormElementsState>({
      date: format(new Date(), "yyyy-MM-dd"),
      location: "",
    });
  const [showFilters, setShowFilters] = useState(false);
  const summary =
    useGetStaffStateSummary(
      filterPanelFormElements.date,
      filterPanelFormElements.location || undefined
    ) ?? [];

  const rows = useMemo(
    () =>
      summary
        .map((row) => ({
          ...row,
          userName: getItem(row.user, users)?.name ?? row.user,
          ...Object.fromEntries(
            stateColumns.map(({ key }) => [
              key,
              formatMinutes(row.minutes[key]),
            ])
          ),
          total: formatMinutes(row.totalMinutes),
        }))
        .sort((a, b) => a.userName.localeCompare(b.userName)),
    [summary, users]
  );

  const columns = useMemo(
    () => [
      { key: t("Person"), isSortable: true },
      ...stateColumns.map(({ label }) => ({
        key: t(label),
        isSortable: false,
      })),
      { key: t("Total"), isSortable: false },
    ],
    [t]
  );

  const rowKeys = useMemo(
    () => [
      { key: "userName", className: "min-w-32" },
      ...stateColumns.map(({ key }) => ({ key, className: "font-mono" })),
      { key: "total", className: "font-mono font-semibold" },
    ],
    []
  );

  const filterPanelInputs = useMemo(
    () => [
      {
        type: InputTypes.DATE,
        formKey: "date",
        label: t("Date"),
        placeholder: t("Date"),
        required: true,
        isDatePicker: true,
        isOnClearActive: false,
      },
      {
        type: InputTypes.SELECT,
        formKey: "location",
        label: t("Location"),
        options: locations.map((location) => ({
          value: location._id,
          label: location.name,
        })),
        placeholder: t("Location"),
        required: false,
      },
    ],
    [t, locations]
  );

  const tableFilters = useMemo(
    () => [
      {
        label: t("Show Filters"),
        isUpperSide: true,
        node: <SwitchButton checked={showFilters} onChange={setShowFilters} />,
      },
    ],
    [t, showFilters]
  );

  const filterPanel = useMemo(
    () => ({
      isFilterPanelActive: showFilters,
      inputs: filterPanelInputs,
      formElements: filterPanelFormElements,
      setFormElements: setFilterPanelFormElements,
      closeFilters: () => setShowFilters(false),
      isApplyButtonActive: false,
    }),
    [showFilters, filterPanelInputs, filterPanelFormElements]
  );

  return (
    <>
      <Header showLocationSelector={false} />
      <div className="w-[98%] mx-auto my-10">
        <GenericTable
          rowKeys={rowKeys}
          filters={tableFilters}
          columns={columns}
          filterPanel={filterPanel}
          rows={rows}
          title={`${t("Staff State Summary")} – ${
            getItem(Number(filterPanelFormElements.location), locations)
              ?.name ?? t("All locations")
          } – ${filterPanelFormElements.date}`}
          isActionsActive={false}
        />
      </div>
    </>
  );
}
