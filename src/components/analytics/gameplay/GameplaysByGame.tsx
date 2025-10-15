import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FormElementsState } from "../../../types";
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
  const [gameplayGroupRows, setGameplayGroupRows] = useState<
    GameplayGroupRow[]
  >([]);
  const [filterData, setFilterData] = useState<GameplayGroupFilter>({
    groupBy: "game,mentor",
    location: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const locations = useGetStoreLocations();
  const [tableKey, setTableKey] = useState(0);
  const [filterPanelFormElements, setFilterPanelFormElements] =
    useState<FormElementsState>({
      startDate: "",
      endDate: "",
      game: "",
      location: "",
    });

  const { data } = useGetGameplaysGroups(filterData);
  const games = useGetGames();
  const users = useGetAllUsers();

  const locationOptions = locations.map((loc) => {
    return { value: loc._id, label: loc.name };
  });

  const columns = [
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
  ];

  const rowKeys = [
    { key: "game" },
    { key: "total" },
    { key: "uniqueMentorsCount" },
  ];

  const filters = [
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
  ];

  const filterPanelInputs = [
    {
      type: InputTypes.DATE,
      formKey: "startDate",
      label: t("After"),
      placeholder: t("After"),
      required: false,
      isDatePicker: true,
    },
    {
      type: InputTypes.DATE,
      formKey: "endDate",
      label: t("Before"),
      placeholder: t("Before"),
      required: false,
      isDatePicker: true,
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
  ];

  const filterPanel = {
    isFilterPanelActive: showFilters,
    inputs: filterPanelInputs,
    formElements: filterPanelFormElements,
    setFormElements: setFilterPanelFormElements,
    closeFilters: () => setShowFilters(false),
  };
  useEffect(() => {
    if (data) {
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
      setGameplayGroupRows(formattedData);
      setTableKey((prev) => prev + 1);
    }
  }, [data, games, users, filterPanelFormElements.game]);

  useEffect(() => {
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
    setFilterData(newFilterData);
  }, [
    filterPanelFormElements.startDate,
    filterPanelFormElements.endDate,
    filterPanelFormElements.location,
  ]);
  return (
    <div className="w-[95%] mx-auto">
      <GenericTable
        key={tableKey}
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
