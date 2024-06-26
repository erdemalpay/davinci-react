import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useGetGames } from "../../../utils/api/game";
import { useGetAllUsers } from "../../../utils/api/user";
import { Autocomplete } from "../../common/Autocomplete";
import GenericTable from "../../panelComponents/Tables/GenericTable";
import SwitchButton from "../../panelComponents/common/SwitchButton";

type WhoKnowsUser = {
  mentor: string;
};
type Props = {};

const WhoKnows = ({}: Props) => {
  const { t } = useTranslation();
  const users = useGetAllUsers();
  const games = useGetGames();
  const [tableKey, setTableKey] = useState(1);
  const [rows, setRows] = useState<WhoKnowsUser[]>([]);
  const [search, setSearch] = useState(0);
  const [showInactiveUsers, setShowInactiveUsers] = useState(false);

  const columns = [{ key: t("Mentor"), isSortable: true }];
  useEffect(() => {
    const usersActive = showInactiveUsers
      ? users
      : users.filter((user) => user.active);
    const processedUsers = search
      ? usersActive
          .filter(
            (user) => user.userGames.filter((g) => g.game === search).length > 0
          )
          .map((user) => ({
            mentor: user.name,
            gameCount: user.userGames.length,
          }))
      : usersActive
          .filter((user) => user.userGames.length > 0)
          .sort((a, b) => b.userGames.length - a.userGames.length)
          .map((user) => ({
            mentor: user.name,
            gameCount: user.userGames.length,
          }));

    setRows(processedUsers);
    setTableKey((prev) => prev + 1);
  }, [users, search, showInactiveUsers]);
  const filters = [
    {
      label: t("Show Inactive Users"),
      isUpperSide: false,
      node: (
        <SwitchButton
          checked={showInactiveUsers}
          onChange={setShowInactiveUsers}
        />
      ),
    },
  ];
  const rowKeys = [{ key: "mentor", className: "min-w-32 pr-1" }];

  return (
    <>
      <div className="w-[95%] mx-auto ">
        <div className="w-80 ">
          <Autocomplete
            name="game"
            label={t("Game")}
            suggestions={games}
            handleSelection={(game) => setSearch(game._id)}
            showSelected
            handleReset={() => setSearch(0)}
          />
        </div>
        <GenericTable
          key={tableKey}
          rowKeys={rowKeys}
          columns={columns}
          rows={rows}
          filters={filters}
          isActionsActive={false}
          title={t("Who Knows?")}
          isSearch={false}
        />
      </div>
    </>
  );
};

export default WhoKnows;
