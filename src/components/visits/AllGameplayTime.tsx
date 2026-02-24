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

  const calculateDuration = (startHour?: string, finishHour?: string) => {
    if (!startHour) return { minutes: 0, formatted: t("N/A") };

    const startTime = new Date();
    const [startH, startM] = startHour.split(":").map(Number);
    startTime.setHours(startH, startM, 0, 0);

    const endTime = new Date();
    if (finishHour) {
      const [endH, endM] = finishHour.split(":").map(Number);
      endTime.setHours(endH, endM, 0, 0);
    }

    if (!finishHour) return { minutes: 0, formatted: t("Active") };

    const diffMs = endTime.getTime() - startTime.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;

    let formatted = "";
    if (hours > 0) {
      formatted = `${hours}h ${minutes}m`;
    } else {
      formatted = `${minutes}m`;
    }

    return { minutes: diffMinutes, formatted };
  };

  const rows = useMemo(() => {
    const allRows =
      gameplayTimeData?.data?.map((gameplayTime) => {
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

        const duration = calculateDuration(
          gameplayTime.startHour,
          gameplayTime.finishHour
        );

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
          duration: duration.formatted,
          durationMinutes: duration.minutes,
          gameName: game?.name ?? t("N/A"),
          playerCount: gameplay?.playerCount ?? t("N/A"),
        };
      }) ?? [];

    // Group by user, location, and date to calculate daily duration
    const groupedRows = new Map<string, any[]>();
    allRows.forEach((row) => {
      const userId =
        typeof row.user === "object" ? row.user._id : row.user;
      const locationId =
        typeof row.location === "object" ? row.location._id : row.location;
      const key = `${userId}-${locationId}-${row.date}`;
      if (!groupedRows.has(key)) {
        groupedRows.set(key, []);
      }
      groupedRows.get(key)!.push(row);
    });

    // Create collapsible rows with daily duration
    const collapsibleRows: any[] = [];
    groupedRows.forEach((groupRows) => {
      const firstRow = groupRows[0];
      const dailyDurationMinutes = groupRows.reduce(
        (sum, row) => sum + (row.durationMinutes || 0),
        0
      );
      const hours = Math.floor(dailyDurationMinutes / 60);
      const minutes = dailyDurationMinutes % 60;
      const dailyDurationFormatted =
        hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

      collapsibleRows.push({
        ...firstRow,
        dailyDuration: dailyDurationFormatted,
        dailyDurationMinutes: dailyDurationMinutes,
        collapsible: {
          collapsibleHeader: `${firstRow.userDisplayName} - ${firstRow.formattedDate}`,
          collapsibleColumns: [
            { key: t("Table"), isSortable: false },
            { key: t("Start Time"), isSortable: false },
            { key: t("End Time"), isSortable: false },
            { key: t("Duration"), isSortable: false },
            { key: t("Game"), isSortable: false },
            { key: t("Player Count"), isSortable: false },
          ],
          collapsibleRows: groupRows,
          collapsibleRowKeys: [
            { key: "tableName" },
            { key: "startHour", node: (row: any) => row.startHour || t("N/A") },
            {
              key: "finishHour",
              node: (row: any) => row.finishHour || t("Active"),
            },
            { key: "duration" },
            { key: "gameName" },
            { key: "playerCount" },
          ],
        },
      });
    });

    return collapsibleRows;
  }, [gameplayTimeData, users, locations, games, t]);

  const columns = useMemo(
    () => [
      { key: t("User"), isSortable: true, correspondingKey: "user" },
      { key: t("Location"), isSortable: true, correspondingKey: "location" },
      { key: t("Date"), isSortable: true, correspondingKey: "date" },
      { key: t("Daily Duration"), isSortable: true },
    ],
    [t]
  );

  const rowKeys = useMemo(
    () => [
      { key: "userDisplayName" },
      { key: "locationDisplayName" },
      { key: "formattedDate" },
      { 
        key: "dailyDurationMinutes",
        node: (row: any) => row.dailyDuration
      },
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
          isCollapsible={true}
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
