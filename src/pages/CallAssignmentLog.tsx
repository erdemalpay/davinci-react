import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Header } from "../components/header/Header";
import GenericTable from "../components/panelComponents/Tables/GenericTable";
import SwitchButton from "../components/panelComponents/common/SwitchButton";
import { InputTypes } from "../components/panelComponents/shared/types";
import { useDataContext } from "../context/Data.context";
import {
  AssignmentActionEnum,
  AssignmentEvent,
  commonDateOptions,
  DeclineReasonEnum,
  declineReasonLabels,
  FormElementsState,
  GmCallReasonEnum,
} from "../types";
import { useGetAssignmentEvents } from "../utils/api/buttonCall";
import { dateRanges } from "../utils/api/dateRanges";
import { useGetAllLocations } from "../utils/api/location";
import { formatAsLocalDate } from "../utils/format";
import { getItem } from "../utils/getItem";

const actionLabels: Record<AssignmentActionEnum, string> = {
  [AssignmentActionEnum.ASSIGNED]: "Assigned by the system",
  [AssignmentActionEnum.DECLINED]: "Declined",
  [AssignmentActionEnum.CLAIMED]: "Took over",
};

const actionColors: Record<AssignmentActionEnum, string> = {
  [AssignmentActionEnum.ASSIGNED]: "bg-gray-500",
  [AssignmentActionEnum.DECLINED]: "bg-red-500",
  [AssignmentActionEnum.CLAIMED]: "bg-blue-500",
};

const reasonLabels: Record<GmCallReasonEnum, string> = {
  [GmCallReasonEnum.RECOMMENDATION]: "Game recommendation",
  [GmCallReasonEnum.EXPLANATION]: "Game explanation",
  [GmCallReasonEnum.QUESTION]: "Question about the game",
};

// Who declined or took over which game master call, to follow how the
// automatic assignment works out in practice.
export default function CallAssignmentLog() {
  const { t } = useTranslation();
  const locations = useGetAllLocations();
  const { games = [], users = [] } = useDataContext();

  const initialFilterPanelFormElements: FormElementsState = {
    location: "",
    action: [AssignmentActionEnum.DECLINED, AssignmentActionEnum.CLAIMED],
    user: [],
    date: "thisMonth",
    before: dateRanges.thisMonth().before,
    after: dateRanges.thisMonth().after,
  };
  const [filterPanelFormElements, setFilterPanelFormElements] =
    useState<FormElementsState>(initialFilterPanelFormElements);
  const [showFilters, setShowFilters] = useState(false);
  const events = useGetAssignmentEvents(filterPanelFormElements);

  // "Other: <note>" and "I don't know the game: <game>"; just the reason
  // otherwise.
  const formatDeclineReason = (event: AssignmentEvent) => {
    if (!event.reason) return "";
    const label = t(declineReasonLabels[event.reason]);
    if (event.reason === DeclineReasonEnum.OTHER && event.note) {
      return `${label}: ${event.note}`;
    }
    if (event.reason === DeclineReasonEnum.DOESNT_KNOW_GAME && event.game) {
      const gameName = getItem(event.game, games)?.name;
      return gameName ? `${label}: ${gameName}` : label;
    }
    return label;
  };

  const rows = useMemo(() => {
    const actions: string[] = filterPanelFormElements.action ?? [];
    const selectedUsers: string[] = filterPanelFormElements.user ?? [];
    return events
      .filter(
        (event: AssignmentEvent) =>
          (actions.length === 0 || actions.includes(event.action)) &&
          (selectedUsers.length === 0 || selectedUsers.includes(event.user))
      )
      .map((event: AssignmentEvent) => ({
        ...event,
        locationName: getItem(event.location, locations)?.name ?? "",
        userName: getItem(event.user, users)?.name ?? event.user,
        fromUserName: event.fromUser
          ? getItem(event.fromUser, users)?.name ?? event.fromUser
          : "",
        reasonLabel: event.gmCallReason
          ? t(reasonLabels[event.gmCallReason])
          : "",
        gameName: event.game ? getItem(event.game, games)?.name ?? "" : "",
        declineReasonLabel: formatDeclineReason(event),
      }));
  }, [events, filterPanelFormElements, locations, users, games, t]);

  const columns = useMemo(
    () => [
      { key: t("Date"), isSortable: true },
      { key: t("Hour"), isSortable: true },
      { key: t("Location"), isSortable: true },
      { key: t("Table Name"), isSortable: true },
      { key: t("Action"), isSortable: true },
      { key: t("Person"), isSortable: true },
      { key: t("Taken over from"), isSortable: true },
      { key: t("Reason"), isSortable: true },
      { key: t("Game"), isSortable: true },
      { key: t("Decline reason"), isSortable: false },
    ],
    [t]
  );

  const rowKeys = useMemo(
    () => [
      {
        key: "date",
        className: "min-w-32",
        node: (row: AssignmentEvent) => formatAsLocalDate(row.date),
      },
      { key: "hour" },
      { key: "locationName", className: "min-w-32" },
      { key: "tableName" },
      {
        key: "action",
        className: "min-w-32",
        node: (row: AssignmentEvent) => (
          <div
            className={`w-fit rounded-md text-sm px-2 py-1 font-semibold text-white ${
              actionColors[row.action]
            }`}
          >
            {t(actionLabels[row.action])}
          </div>
        ),
      },
      { key: "userName", className: "min-w-32" },
      { key: "fromUserName", className: "min-w-32" },
      { key: "reasonLabel", className: "min-w-40" },
      { key: "gameName", className: "min-w-40" },
      { key: "declineReasonLabel", className: "min-w-48 whitespace-normal" },
    ],
    [t]
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
        formKey: "action",
        label: t("Action"),
        options: Object.values(AssignmentActionEnum).map((action) => ({
          value: action,
          label: t(actionLabels[action]),
        })),
        placeholder: t("Action"),
        isMultiple: true,
        required: false,
      },
      {
        type: InputTypes.SELECT,
        formKey: "user",
        label: t("Person"),
        options: users.map((user) => ({ value: user._id, label: user.name })),
        placeholder: t("Person"),
        isMultiple: true,
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
    [t, locations, users]
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
          title={t("Call Assignment Log")}
          isActionsActive={false}
        />
      </div>
    </>
  );
}
