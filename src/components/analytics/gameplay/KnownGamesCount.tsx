import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useGetAllUsers } from "../../../utils/api/user";
import GenericTable from "../../panelComponents/Tables/GenericTable";
import SwitchButton from "../../panelComponents/common/SwitchButton";

type KnownGamesCountUser = {
  mentor: string;
  gameCount: number;
};

const KnownGamesCount = () => {
  const { t } = useTranslation();
  const users = useGetAllUsers();
  const [showInactiveUsers, setShowInactiveUsers] = useState(false);

  const rows = useMemo(() => {
    const processedUsers = showInactiveUsers
      ? users
          .filter((user) => user.userGames.length > 0)
          .sort((a, b) => b.userGames.length - a.userGames.length)
          .map((user) => ({
            mentor: user.name,
            gameCount: user.userGames.length,
          }))
      : users
          .filter((user) => user.active)
          .filter((user) => user.userGames.length > 0)
          .sort((a, b) => b.userGames.length - a.userGames.length)
          .map((user) => ({
            mentor: user.name,
            gameCount: user.userGames.length,
          }));
    return processedUsers;
  }, [users, showInactiveUsers]);

  const columns = useMemo(
    () => [
      { key: t("Mentor"), isSortable: true },
      { key: t("Game Count"), isSortable: true },
    ],
    [t]
  );

  const rowKeys = useMemo(
    () => [
      { key: "mentor", className: "min-w-32 pr-1" },
      { key: "gameCount", className: "min-w-32 " },
    ],
    []
  );

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

  return (
    <>
      <div className="w-[95%] mx-auto ">
        <GenericTable
          rowKeys={rowKeys}
          columns={columns}
          isActionsActive={false}
          rows={rows}
          filters={filters}
          title={t("Known Games Count")}
        />
      </div>
    </>
  );
};

export default KnownGamesCount;
