import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useFilterContext } from "../../../context/Filter.context";
import { useGetGames } from "../../../utils/api/game";
import { useGetUsers } from "../../../utils/api/user";
import { formatAsLocalDate } from "../../../utils/format";
import { passesFilter } from "../../../utils/passesFilter";
import GenericTable from "../../panelComponents/Tables/GenericTable";
import SwitchButton from "../../panelComponents/common/SwitchButton";
import { InputTypes } from "../../panelComponents/shared/types";

const LearnedGames = () => {
  const { t } = useTranslation();
  const users = useGetUsers();
  if (!users) return null;
  const [tableKey, setTableKey] = useState(0);
  const games = useGetGames();
  const {
    filterLearnedGamesPanelFormElements,
    setFilterLearnedGamesPanelFormElements,
    showLearnedGamesFilters,
    setShowLearnedGamesFilters,
  } = useFilterContext();
  const allRows = users
    .flatMap((user) =>
      user?.userGames?.map((item) => {
        const foundGame = games?.find((game) => game._id === item.game);
        return {
          game: foundGame?.name,
          gameId: foundGame?._id,
          userName: user.name,
          userId: user._id,
          learnDate: item.learnDate,
        };
      })
    )
    ?.sort(
      (a, b) =>
        new Date(b.learnDate).getTime() - new Date(a.learnDate).getTime()
    );
  const [rows, setRows] = useState(allRows);
  const columns = [
    { key: t("User"), isSortable: true },
    { key: t("Game"), isSortable: true },
    { key: t("Learn Date"), isSortable: true },
  ];
  const rowKeys = [
    {
      key: "userName",
    },
    {
      key: "game",
    },
    {
      key: "learnDate",
      className: `min-w-32   `,
      node: (row: any) => {
        return <p>{formatAsLocalDate(row.learnDate)}</p>;
      },
    },
  ];
  const filterPanelInputs = [
    {
      type: InputTypes.SELECT,
      formKey: "user",
      label: t("User"),
      options: users
        .filter((user) => user.active)
        .map((user) => ({
          value: user._id,
          label: user.name,
        })),
      placeholder: t("User"),
      required: true,
    },
    {
      type: InputTypes.SELECT,
      formKey: "game",
      label: t("Game"),
      options: games.map((game) => ({
        value: game._id,
        label: t(game.name),
      })),
      placeholder: t("Game"),
      required: true,
    },
    {
      type: InputTypes.DATE,
      formKey: "after",
      label: t("Start Date"),
      placeholder: t("Start Date"),
      required: true,
      isDatePicker: true,
    },
    {
      type: InputTypes.DATE,
      formKey: "before",
      label: t("End Date"),
      placeholder: t("End Date"),
      required: true,
      isDatePicker: true,
    },
  ];
  const filterPanel = {
    isFilterPanelActive: showLearnedGamesFilters,
    inputs: filterPanelInputs,
    formElements: filterLearnedGamesPanelFormElements,
    setFormElements: setFilterLearnedGamesPanelFormElements,
    closeFilters: () => setShowLearnedGamesFilters(false),
  };
  const filters = [
    {
      label: t("Show Filters"),
      isUpperSide: true,
      node: (
        <SwitchButton
          checked={showLearnedGamesFilters}
          onChange={() => {
            setShowLearnedGamesFilters(!showLearnedGamesFilters);
          }}
        />
      ),
    },
  ];
  useEffect(() => {
    const filteredRows = allRows.filter((row) => {
      if (!row?.learnDate) {
        return false;
      }
      return (
        (filterLearnedGamesPanelFormElements.before === "" ||
          row.learnDate <= filterLearnedGamesPanelFormElements.before) &&
        (filterLearnedGamesPanelFormElements.after === "" ||
          row.learnDate >= filterLearnedGamesPanelFormElements.after) &&
        passesFilter(filterLearnedGamesPanelFormElements.user, row.userId) &&
        passesFilter(filterLearnedGamesPanelFormElements.game, row.gameId)
      );
    });
    setRows(filteredRows);
    setTableKey((prev) => prev + 1);
  }, [users, games, filterLearnedGamesPanelFormElements]);

  return (
    <div className="w-[95%] mx-auto ">
      <GenericTable
        key={tableKey}
        columns={columns}
        filterPanel={filterPanel}
        filters={filters}
        rows={rows}
        rowKeys={rowKeys}
        title={t("Learned Games")}
        isActionsActive={false}
      />
    </div>
  );
};

export default LearnedGames;
