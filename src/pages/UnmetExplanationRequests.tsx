import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Header } from "../components/header/Header";
import GenericTable from "../components/panelComponents/Tables/GenericTable";
import SwitchButton from "../components/panelComponents/common/SwitchButton";
import { InputTypes } from "../components/panelComponents/shared/types";
import { useDataContext } from "../context/Data.context";
import {
  commonDateOptions,
  FormElementsState,
  GameAvailabilityStatus,
  UnmetExplanationRequest,
} from "../types";
import { useGetUnmetExplanationRequests } from "../utils/api/buttonCall";
import { dateRanges } from "../utils/api/dateRanges";
import { useGetAllLocations } from "../utils/api/location";
import { formatAsLocalDate } from "../utils/format";
import { getItem } from "../utils/getItem";

const statusLabels: Record<GameAvailabilityStatus, string> = {
  [GameAvailabilityStatus.BUSY]: "Everyone who knows the game was busy",
  [GameAvailabilityStatus.LATER]: "Someone who knows the game came later",
  [GameAvailabilityStatus.UNAVAILABLE]: "Nobody who knows the game that day",
};

// Explanation requests that couldn't be met right away, so managers can see
// which games need more people who can explain them.
export default function UnmetExplanationRequests() {
  const { t } = useTranslation();
  const locations = useGetAllLocations();
  const { games = [], users = [] } = useDataContext();

  const initialFilterPanelFormElements: FormElementsState = {
    location: "",
    date: "thisMonth",
    before: dateRanges.thisMonth().before,
    after: dateRanges.thisMonth().after,
  };
  const [filterPanelFormElements, setFilterPanelFormElements] =
    useState<FormElementsState>(initialFilterPanelFormElements);
  const [showFilters, setShowFilters] = useState(false);
  const requests = useGetUnmetExplanationRequests(filterPanelFormElements);

  const rows = useMemo(
    () =>
      requests.map((request: UnmetExplanationRequest) => {
        const outcome = !request.waited
          ? t("Picked another game or left")
          : request.explainedBy
          ? t("Explained by {{name}}", {
              name: getItem(request.explainedBy, users)?.name ?? "",
            })
          : request.callFinishHour
          ? t("Call closed without assignment")
          : t("Waiting");
        return {
          ...request,
          locationName: getItem(request.location, locations)?.name ?? "",
          gameName: getItem(request.game, games)?.name ?? request.game,
          statusLabel:
            t(statusLabels[request.status]) +
            (request.availableFrom ? ` (${request.availableFrom})` : ""),
          waitedLabel: request.waited ? t("Yes") : t("No"),
          outcome,
        };
      }),
    [requests, locations, games, users, t]
  );

  const columns = useMemo(
    () => [
      { key: t("Date"), isSortable: true },
      { key: t("Hour"), isSortable: true },
      { key: t("Location"), isSortable: true },
      { key: t("Table Name"), isSortable: true },
      { key: t("Game"), isSortable: true },
      { key: t("Reason"), isSortable: true },
      { key: t("Waited"), isSortable: true },
      { key: t("Outcome"), isSortable: false },
    ],
    [t]
  );

  const rowKeys = useMemo(
    () => [
      {
        key: "date",
        className: "min-w-32",
        node: (row: UnmetExplanationRequest) => formatAsLocalDate(row.date),
      },
      { key: "hour" },
      { key: "locationName", className: "min-w-32" },
      { key: "tableName" },
      { key: "gameName", className: "min-w-40" },
      { key: "statusLabel", className: "min-w-48" },
      { key: "waitedLabel" },
      { key: "outcome", className: "min-w-40" },
    ],
    []
  );

  const filterPanelInputs = useMemo(
    () => [
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
      {
        type: InputTypes.SELECT,
        formKey: "date",
        label: t("Date"),
        options: commonDateOptions?.map((option) => ({
          value: option.value,
          label: t(option.label),
        })),
        placeholder: t("Date"),
        required: true,
      },
      {
        type: InputTypes.DATE,
        formKey: "after",
        label: t("Start Date"),
        placeholder: t("Start Date"),
        required: true,
        isDatePicker: true,
        invalidateKeys: [{ key: "date", defaultValue: "" }],
        isOnClearActive: false,
      },
      {
        type: InputTypes.DATE,
        formKey: "before",
        label: t("End Date"),
        placeholder: t("End Date"),
        required: true,
        isDatePicker: true,
        invalidateKeys: [{ key: "date", defaultValue: "" }],
        isOnClearActive: false,
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
      additionalFilterCleanFunction: () => {
        setFilterPanelFormElements(initialFilterPanelFormElements);
      },
    }),
    [
      showFilters,
      filterPanelInputs,
      filterPanelFormElements,
      initialFilterPanelFormElements,
    ]
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
          title={t("Unmet Explanation Requests")}
          isActionsActive={false}
        />
      </div>
    </>
  );
}
