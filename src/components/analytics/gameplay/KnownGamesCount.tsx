import { useEffect, useState } from "react";
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
  const [tableKey, setTableKey] = useState(1);
  const [rows, setRows] = useState<KnownGamesCountUser[]>([]);
  const [showInactiveUsers, setShowInactiveUsers] = useState(false);
  const columns = [
    { key: t("Mentor"), isSortable: true },
    { key: t("Game Count"), isSortable: true },
  ];
  useEffect(() => {
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
    setRows(processedUsers);
    setTableKey((prev) => prev + 1);
  }, [users, showInactiveUsers]);

  const rowKeys = [
    { key: "mentor", className: "min-w-32 pr-1" },
    { key: "gameCount", className: "min-w-32 " },
  ];
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

  return (
    <>
      <div className="w-[95%] mx-auto ">
        <GenericTable
          key={tableKey}
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
