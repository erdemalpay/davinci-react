import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useGetGames } from "../../../utils/api/game";
import { useGetUsers } from "../../../utils/api/user";
import { formatAsLocalDate } from "../../../utils/format";
import { passesFilter } from "../../../utils/passesFilter";
import SwitchButton from "../../panelComponents/common/SwitchButton";
import { InputTypes } from "../../panelComponents/shared/types";
import GenericTable from "../../panelComponents/Tables/GenericTable";

type FormElementsState = {
  [key: string]: any;
};
const LearnedGames = () => {
  const { t } = useTranslation();
  const users = useGetUsers();
  if (!users) return null;
  const [tableKey, setTableKey] = useState(0);
  const games = useGetGames();
  const [showFilters, setShowFilters] = useState(false);
  const [filterPanelFormElements, setFilterPanelFormElements] =
    useState<FormElementsState>({
      user: "",
      game: "",
      after: "",
      before: "",
    });
  const columns = [
    { key: t("User"), isSortable: true },
    { key: t("Game"), isSortable: true },
    { key: t("Learn Date"), isSortable: true },
  ];

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
    isFilterPanelActive: showFilters,
    inputs: filterPanelInputs,
    formElements: filterPanelFormElements,
    setFormElements: setFilterPanelFormElements,
    closeFilters: () => setShowFilters(false),
  };
  const filters = [
    {
      label: t("Show Filters"),
      isUpperSide: true,
      node: <SwitchButton checked={showFilters} onChange={setShowFilters} />,
    },
  ];
  useEffect(() => {
    const filteredRows = allRows.filter((row) => {
      if (!row?.learnDate) {
        return false;
      }
      return (
        (filterPanelFormElements.before === "" ||
          row.learnDate <= filterPanelFormElements.before) &&
        (filterPanelFormElements.after === "" ||
          row.learnDate >= filterPanelFormElements.after) &&
        passesFilter(filterPanelFormElements.user, row.userId) &&
        passesFilter(filterPanelFormElements.game, row.gameId)
      );
    });
    setRows(filteredRows);
    setTableKey((prev) => prev + 1);
  }, [users, games, filterPanelFormElements]);

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
