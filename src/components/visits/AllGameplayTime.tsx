import { format, startOfYear } from "date-fns";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useGeneralContext } from "../../context/General.context";
import {
  DateRangeKey,
  FormElementsState,
  commonDateOptions,
} from "../../types";
import { dateRanges } from "../../utils/api/dateRanges";
import { useGetGames } from "../../utils/api/game";
import { useGetGameplayTimes } from "../../utils/api/gameplaytime";
import { useGetStoreLocations } from "../../utils/api/location";
import { useGetUsersMinimal } from "../../utils/api/user";
import { formatAsLocalDate } from "../../utils/format";
import { getItem } from "../../utils/getItem";
import GenericTable from "../panelComponents/Tables/GenericTable";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { InputTypes } from "../panelComponents/shared/types";

const AllGameplayTime = () => {
  const { t } = useTranslation();
  const users = useGetUsersMinimal();
  const games = useGetGames();
  const { rowsPerPage, currentPage, setCurrentPage } = useGeneralContext();
  const initialFilterPanelFormElements = {
    before: "",
    after: format(startOfYear(new Date()), "yyyy-MM-dd"),
    user: "",
    location: "",
    gameplay: "",
    sort: "",
    asc: 1,
    search: "",
  };
  const [filterPanelFormElements, setFilterPanelFormElements] =
    useState<FormElementsState>(initialFilterPanelFormElements);
  const gameplayTimeData = useGetGameplayTimes(
    currentPage,
    rowsPerPage,
    filterPanelFormElements
  );
  const [showFilters, setShowFilters] = useState(false);
  const locations = useGetStoreLocations();

  const rows = useMemo(() => {
    return (
      gameplayTimeData?.data?.map((gameplayTime) => {
        const calculateDuration = () => {
          if (!gameplayTime.startHour) return t("N/A");

          const startTime = new Date();
          const [startHour, startMinute] = gameplayTime.startHour
            .split(":")
            .map(Number);
          startTime.setHours(startHour, startMinute, 0, 0);

          const endTime = new Date();
          if (gameplayTime.finishHour) {
            const [endHour, endMinute] = gameplayTime.finishHour
              .split(":")
              .map(Number);
            endTime.setHours(endHour, endMinute, 0, 0);
          }

          if (!gameplayTime.finishHour) return t("Active");

          const diffMs = endTime.getTime() - startTime.getTime();
          const diffMinutes = Math.floor(diffMs / (1000 * 60));
          const hours = Math.floor(diffMinutes / 60);
          const minutes = diffMinutes % 60;

          if (hours > 0) {
            return `${hours}h ${minutes}m`;
          }
          return `${minutes}m`;
        };

        // Handle populated gameplay object
        const gameplay =
          typeof gameplayTime.gameplay === "object"
            ? gameplayTime.gameplay
            : null;
        const game =
          gameplay && typeof gameplay.game === "object"
            ? gameplay.game
            : typeof gameplay?.game === "number"
            ? getItem(gameplay.game, games)
            : null;

        return {
          ...gameplayTime,
          userDisplayName: getItem(gameplayTime?.user, users)?.name ?? "",
          locationDisplayName:
            getItem(gameplayTime?.location, locations)?.name ?? "",
          tableName:
            typeof gameplayTime.table === "object"
              ? gameplayTime.table?.name
              : t("N/A"),
          formattedDate: formatAsLocalDate(gameplayTime.date),
          duration: calculateDuration(),
          gameName: game?.name ?? t("N/A"),
          playerCount: gameplay?.playerCount ?? t("N/A"),
        };
      }) ?? []
    );
  }, [gameplayTimeData, users, locations, games, t]);

  const columns = useMemo(
    () => [
      { key: t("User"), isSortable: true, correspondingKey: "user" },
      { key: t("Location"), isSortable: true, correspondingKey: "location" },
      { key: t("Table"), isSortable: true, correspondingKey: "table" },
      { key: t("Date"), isSortable: true, correspondingKey: "date" },
      { key: t("Start Time"), isSortable: true, correspondingKey: "startHour" },
      { key: t("End Time"), isSortable: true, correspondingKey: "finishHour" },
      { key: t("Duration"), isSortable: false },
      { key: t("Game"), isSortable: false },
      { key: t("Player Count"), isSortable: false },
    ],
    [t]
  );

  const rowKeys = useMemo(
    () => [
      { key: "userDisplayName" },
      { key: "locationDisplayName" },
      { key: "tableName" },
      { key: "formattedDate" },
      { key: "startHour", node: (row: any) => row.startHour || t("N/A") },
      {
        key: "finishHour",
        node: (row: any) => row.finishHour || t("Active"),
      },
      { key: "duration" },
      { key: "gameName" },
      { key: "playerCount" },
    ],
    [t]
  );

  const filterPanelInputs = useMemo(
    () => [
      {
        type: InputTypes.SELECT,
        formKey: "user",
        label: t("User"),
        options: users?.map((user) => ({
          value: user._id,
          label: user.name,
        })),
        placeholder: t("User"),
        isMultiple: false,
        required: false,
      },
      {
        type: InputTypes.SELECT,
        formKey: "location",
        label: t("Location"),
        options: locations?.map((location) => ({
          value: location._id,
          label: location.name,
        })),
        placeholder: t("Location"),
        isMultiple: false,
        required: false,
      },
      {
        type: InputTypes.SELECT,
        formKey: "date",
        label: t("Date"),
        options: commonDateOptions.map((option) => {
          return {
            value: option.value,
            label: t(option.label),
          };
        }),
        placeholder: t("Date"),
        required: true,
        additionalOnChange: ({
          value,
          label,
        }: {
          value: string;
          label: string;
        }) => {
          const dateRange = dateRanges[value as DateRangeKey];
          if (dateRange) {
            setFilterPanelFormElements({
              ...filterPanelFormElements,
              ...dateRange(),
            });
          }
        },
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
    [t, users, locations, filterPanelFormElements, setFilterPanelFormElements]
  );

  const filterPanel = useMemo(
    () => ({
      isFilterPanelActive: showFilters,
      inputs: filterPanelInputs,
      formElements: filterPanelFormElements,
      setFormElements: setFilterPanelFormElements,
      additionalFilterCleanFunction: () => {
        setFilterPanelFormElements(initialFilterPanelFormElements);
      },
      closeFilters: () => {
        setShowFilters(false);
      },
    }),
    [
      showFilters,
      filterPanelInputs,
      filterPanelFormElements,
      setFilterPanelFormElements,
      initialFilterPanelFormElements,
    ]
  );

  const filters = useMemo(
    () => [
      {
        label: t("Show Filters"),
        isUpperSide: true,
        node: <SwitchButton checked={showFilters} onChange={setShowFilters} />,
      },
    ],
    [t, showFilters]
  );

  const outsideSort = useMemo(
    () => ({
      filterPanelFormElements: filterPanelFormElements,
      setFilterPanelFormElements: setFilterPanelFormElements,
    }),
    [filterPanelFormElements]
  );

  const pagination = useMemo(() => {
    return gameplayTimeData
      ? {
          totalPages: gameplayTimeData.totalPages,
          totalRows: gameplayTimeData.totalNumber,
        }
      : null;
  }, [gameplayTimeData]);

  useMemo(() => {
    setCurrentPage(1);
  }, [filterPanelFormElements, setCurrentPage]);

  const outsideSearchProps = useMemo(() => {
    return {
      t,
      filterPanelFormElements,
      setFilterPanelFormElements,
    };
  }, [t, filterPanelFormElements, setFilterPanelFormElements]);

  return (
    <>
      <div className="w-[95%] mx-auto ">
        <GenericTable
          rowKeys={rowKeys}
          columns={columns}
          rows={rows}
          filters={filters}
          filterPanel={filterPanel}
          title={t("All Gameplay Time")}
          isActionsActive={false}
          isSearch={false}
          outsideSortProps={outsideSort}
          outsideSearchProps={outsideSearchProps}
          {...(pagination && { pagination })}
          isAllRowPerPageOption={false}
        />
      </div>
    </>
  );
};

export default AllGameplayTime;
