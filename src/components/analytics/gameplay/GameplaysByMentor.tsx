import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FormElementsState } from "../../../types";
import { useGetGames } from "../../../utils/api/game";
import {
  GameplayGroupFilter,
  useGetGameplaysGroups,
} from "../../../utils/api/gameplay";
import { useGetAllUsers } from "../../../utils/api/user";
import GenericTable from "../../panelComponents/Tables/GenericTable";
import SwitchButton from "../../panelComponents/common/SwitchButton";
import { InputTypes } from "../../panelComponents/shared/types";

export interface SecondGroupRow {
  field: string;
  count: number;
}

export interface GameplayGroupRow {
  mentor: string;
  mentorId: string;
  total: number;
  secondary: SecondGroupRow[];
  uniqueGamesCount: number;
  collapsible?: {
    collapsibleColumns: { key: string; isSortable: boolean }[];
    collapsibleRowKeys: { key: string }[];
    collapsibleRows: { game: string; count: number }[];
  };
}

export default function GameplaysByMentor() {
  const { t } = useTranslation();
  const [gameplayGroupRows, setGameplayGroupRows] = useState<
    GameplayGroupRow[]
  >([]);
  const [filterData, setFilterData] = useState<GameplayGroupFilter>({
    groupBy: "mentor,game",
  });
  const [showInactiveUsers, setShowInactiveUsers] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [tableKey, setTableKey] = useState(0);
  const [filterPanelFormElements, setFilterPanelFormElements] =
    useState<FormElementsState>({
      startDate: "",
      endDate: "",
      mentor: "",
    });
  const { data } = useGetGameplaysGroups(filterData);
  const games = useGetGames();
  const users = useGetAllUsers();

  const columns = [
    { key: t("Mentor"), isSortable: true, correspondingKey: "mentor" },
    {
      key: t("Total Gameplays"),
      isSortable: true,
      correspondingKey: "total",
    },
    {
      key: t("Unique Games"),
      isSortable: true,
      correspondingKey: "uniqueGamesCount",
    },
  ];

  const rowKeys = [
    { key: "mentor" },
    { key: "total" },
    { key: "uniqueGamesCount" },
  ];

  const filters = [
    {
      label: t("Show Inactive Users"),
      isUpperSide: true,
      node: (
        <SwitchButton
          checked={showInactiveUsers}
          onChange={() => {
            setShowInactiveUsers(!showInactiveUsers);
          }}
        />
      ),
    },
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
      formKey: "mentor",
      label: t("Mentor"),
      options: (showInactiveUsers
        ? users
        : users.filter((user) => user.active)
      ).map((user) => ({
        value: user._id,
        label: user.name,
      })),
      placeholder: t("Mentor"),
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
          const user = users.find((u) => u._id === _id);
          if (!showInactiveUsers && user && !user.active) {
            return null;
          }

          const collapsibleRows = secondary.map((sec) => {
            const game = games.find((g) => String(g._id) === String(sec.field));
            return {
              game: game?.name || sec.field,
              count: sec.count,
            };
          });

          return {
            mentor: user?.name || `${_id}`,
            mentorId: _id,
            total,
            secondary,
            uniqueGamesCount: secondary.length,
            collapsible: {
              collapsibleColumns: [
                { key: t("Game"), isSortable: true },
                { key: t("Count"), isSortable: true },
              ],
              collapsibleRowKeys: [{ key: "game" }, { key: "count" }],
              collapsibleRows,
            },
          };
        })
        .filter((row) => row !== null)
        .filter((row) => {
          if (!filterPanelFormElements.mentor) return true;
          return row?.mentorId === filterPanelFormElements.mentor;
        });

      const nonNullFormattedData: GameplayGroupRow[] =
        formattedData as GameplayGroupRow[];
      nonNullFormattedData.sort((a, b) => b.total - a.total);
      setGameplayGroupRows(nonNullFormattedData);
      setTableKey((prev) => prev + 1);
    }
  }, [data, users, filterPanelFormElements.mentor, showInactiveUsers, games]);

  useEffect(() => {
    const newFilterData: GameplayGroupFilter = {
      groupBy: "mentor,game",
    };
    if (filterPanelFormElements.startDate) {
      newFilterData.startDate = filterPanelFormElements.startDate;
    }
    if (filterPanelFormElements.endDate) {
      newFilterData.endDate = filterPanelFormElements.endDate;
    }
    setFilterData(newFilterData);
  }, [filterPanelFormElements.startDate, filterPanelFormElements.endDate]);
  return (
    <div className="w-[95%] mx-auto">
      <GenericTable
        key={tableKey}
        rowKeys={rowKeys}
        columns={columns}
        rows={gameplayGroupRows}
        title={t("Gameplays by Mentors")}
        filters={filters}
        filterPanel={filterPanel}
        isActionsActive={false}
        isCollapsible={true}
        isSearch={true}
      />
    </div>
  );
}
