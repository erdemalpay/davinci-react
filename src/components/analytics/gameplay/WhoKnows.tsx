import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useGetGames } from "../../../utils/api/game";
import { useGetAllUsers } from "../../../utils/api/user";
import { Autocomplete } from "../../common/Autocomplete";
import GenericTable from "../../panelComponents/Tables/GenericTable";
import SwitchButton from "../../panelComponents/common/SwitchButton";

type WhoKnowsUser = {
  mentor: string;
};

const WhoKnows = () => {
  const { t } = useTranslation();
  const users = useGetAllUsers();
  const games = useGetGames();
  const [search, setSearch] = useState(0);
  const [showInactiveUsers, setShowInactiveUsers] = useState(false);

  const rows = useMemo(() => {
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

    return processedUsers;
  }, [users, search, showInactiveUsers]);

  const columns = useMemo(() => [{ key: t("Mentor"), isSortable: true }], [t]);

  const filters = useMemo(
    () => [
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
    ],
    [t, showInactiveUsers]
  );

  const rowKeys = useMemo(
    () => [{ key: "mentor", className: "min-w-32 pr-1" }],
    []
  );

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
