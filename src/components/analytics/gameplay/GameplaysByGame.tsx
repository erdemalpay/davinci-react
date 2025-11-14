import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { DateRangeKey, FormElementsState } from "../../../types";
import { dateRanges } from "../../../utils/api/dateRanges";
import { useGetGames } from "../../../utils/api/game";
import {
  GameplayGroupFilter,
  useGetGameplaysGroups,
} from "../../../utils/api/gameplay";
import { useGetStoreLocations } from "../../../utils/api/location";
import { useGetAllUsers } from "../../../utils/api/user";
import GenericTable from "../../panelComponents/Tables/GenericTable";
import SwitchButton from "../../panelComponents/common/SwitchButton";
import { InputTypes } from "../../panelComponents/shared/types";

interface SecondGroupRow {
  field: string;
  count: number;
}

interface GameplayGroupRow {
  game: string;
  gameId: string;
  total: number;
  secondary: SecondGroupRow[];
  uniqueMentorsCount: number;
  collapsible?: {
    collapsibleColumns: { key: string; isSortable: boolean }[];
    collapsibleRowKeys: { key: string }[];
    collapsibleRows: { mentor: string; count: number }[];
  };
}

export default function GameplaysByGames() {
  const { t } = useTranslation();
  const [showFilters, setShowFilters] = useState(false);
  const locations = useGetStoreLocations();
  const [filterPanelFormElements, setFilterPanelFormElements] =
    useState<FormElementsState>({
      date: "",
      startDate: "",
      endDate: "",
      game: "",
      location: "",
    });

  // Sync end date with start date when "Single Day" is selected
  useEffect(() => {
    if (filterPanelFormElements.date === "singleDay" && filterPanelFormElements.startDate) {
      if (filterPanelFormElements.endDate !== filterPanelFormElements.startDate) {
        setFilterPanelFormElements((prev) => ({
          ...prev,
          endDate: prev.startDate,
        }));
      }
    }
  }, [filterPanelFormElements.startDate, filterPanelFormElements.date]);

  const filterData = useMemo(() => {
    const newFilterData: GameplayGroupFilter = {
      groupBy: "game,mentor",
      location: filterPanelFormElements.location,
    };
    if (filterPanelFormElements.startDate) {
      newFilterData.startDate = filterPanelFormElements.startDate;
    }
    if (filterPanelFormElements.endDate) {
      newFilterData.endDate = filterPanelFormElements.endDate;
    }
    return newFilterData;
  }, [
    filterPanelFormElements.startDate,
    filterPanelFormElements.endDate,
    filterPanelFormElements.location,
  ]);

  const { data } = useGetGameplaysGroups(filterData);
  const games = useGetGames();
  const users = useGetAllUsers();

  const gameplayGroupRows = useMemo(() => {
    if (!data) return [];

    const formattedData = data
      .map(({ secondary, total, _id }) => {
        const game = games.find((g) => String(g._id) === String(_id));

        const collapsibleRows = secondary.map((sec) => {
          const user = users.find((u) => u._id === sec.field);
          return {
            mentor: user?.name || sec.field,
            count: sec.count,
          };
        });

        return {
          game: game?.name || `${_id}`,
          gameId: _id,
          total,
          secondary,
          uniqueMentorsCount: secondary.length,
          collapsible: {
            collapsibleColumns: [
              { key: t("Mentor"), isSortable: true },
              { key: t("Count"), isSortable: true },
            ],
            collapsibleRowKeys: [{ key: "mentor" }, { key: "count" }],
            collapsibleRows,
          },
        };
      })
      .filter((row) => {
        if (!filterPanelFormElements.game) return true;
        return row?.gameId === filterPanelFormElements.game;
      });

    formattedData.sort((a, b) => Number(b.total) - Number(a.total));
    return formattedData;
  }, [data, games, users, filterPanelFormElements.game, t]);

  const locationOptions = useMemo(() => {
    return locations.map((loc) => ({
      value: loc._id,
      label: loc.name,
    }));
  }, [locations]);

  const columns = useMemo(
    () => [
      { key: t("Game"), isSortable: true, correspondingKey: "game" },
      {
        key: t("Total Gameplays"),
        isSortable: true,
        correspondingKey: "total",
      },
      {
        key: t("Unique Mentors"),
        isSortable: true,
        correspondingKey: "uniqueMentorsCount",
      },
    ],
    [t]
  );

  const rowKeys = useMemo(
    () => [{ key: "game" }, { key: "total" }, { key: "uniqueMentorsCount" }],
    []
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
    [t, showFilters]
  );

  const customDateOptions = [
    { value: "singleDay", label: t("Single Day") },
    { value: "thisWeek", label: t("This Week") },
    { value: "lastWeek", label: t("Last Week") },
    { value: "thisMonth", label: t("This Month") },
    { value: "lastMonth", label: t("Last Month") },
    { value: "manual", label: t("Manual") },
  ];

  const filterPanelInputs = useMemo(
    () => [
      {
        type: InputTypes.SELECT,
        formKey: "date",
        label: t("Date"),
        options: customDateOptions,
        placeholder: t("Date"),
        required: false,
        additionalOnChange: ({ value }: { value: string }) => {
          if (value === "manual") {
            setFilterPanelFormElements((prev) => ({ ...prev, date: value }));
            return;
          }

          const dateRange = value === "singleDay" ? dateRanges.today() : dateRanges[value as DateRangeKey]?.();
          if (dateRange) {
            setFilterPanelFormElements((prev) => ({
              ...prev,
              date: value,
              startDate: dateRange.after,
              endDate: dateRange.before,
            }));
          }
        },
      },
      {
        type: InputTypes.DATE,
        formKey: "startDate",
        label: t("Start Date"),
        placeholder: t("Start Date"),
        required: false,
        isDatePicker: true,
        isOnClearActive: false,
        additionalOnChange: ({ value }: { value: string }) => {
          setFilterPanelFormElements((prev) =>
            prev.date === "singleDay"
              ? { ...prev, startDate: value, endDate: value }
              : prev
          );
        },
      },
      {
        type: InputTypes.DATE,
        formKey: "endDate",
        label: t("End Date"),
        placeholder: t("End Date"),
        required: false,
        isDatePicker: true,
        isOnClearActive: false,
      },
      {
        type: InputTypes.SELECT,
        formKey: "game",
        label: t("Game"),
        options: games.map((game) => ({
          value: game._id,
          label: game.name,
        })),
        placeholder: t("Game"),
        required: false,
      },
      {
        type: InputTypes.SELECT,
        formKey: "location",
        label: t("Location"),
        options: locationOptions,
        placeholder: t("Location"),
        required: false,
      },
    ],
    [t, games, locationOptions]
  );

  const filterPanel = useMemo(
    () => ({
      isFilterPanelActive: showFilters,
      inputs: filterPanelInputs,
      formElements: filterPanelFormElements,
      setFormElements: setFilterPanelFormElements,
      closeFilters: () => setShowFilters(false),
    }),
    [
      showFilters,
      filterPanelInputs,
      filterPanelFormElements,
      setFilterPanelFormElements,
    ]
  );

  return (
    <div className="w-[95%] mx-auto">
      <GenericTable
        rowKeys={rowKeys}
        columns={columns}
        rows={gameplayGroupRows}
        title={t("Gameplays by Games")}
        filters={filters}
        filterPanel={filterPanel}
        isActionsActive={false}
        isCollapsible={true}
        isSearch={true}
      />
    </div>
  );
}
