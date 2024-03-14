import { useEffect, useState } from "react";
import { useGetAllUsers } from "../../utils/api/user";
import GenericTable from "../panelComponents/Tables/GenericTable";

type KnownGamesCountUser = {
  mentor: string;
  gameCount: number;
};

const KnownGamesCount = () => {
  const users = useGetAllUsers();
  const [tableKey, setTableKey] = useState(1);
  const [rows, setRows] = useState<KnownGamesCountUser[]>([]);
  const columns = [
    { key: "Mentor", isSortable: true },
    { key: "Game Count", isSortable: true },
  ];
  useEffect(() => {
    const processedUsers = users
      .filter((user) => user.userGames.length > 0)
      .sort((a, b) => b.userGames.length - a.userGames.length)
      .map((user) => ({
        mentor: user.name,
        gameCount: user.userGames.length,
      }));

    setRows(processedUsers);
    setTableKey((prev) => prev + 1);
  }, [users]);

  const rowKeys = [
    { key: "mentor", className: "min-w-32 pr-1" },
    { key: "gameCount", className: "min-w-32 " },
  ];

  return (
    <>
      <div className="w-[95%] mx-auto ">
        <GenericTable
          key={tableKey}
          rowKeys={rowKeys}
          columns={columns}
          rows={rows}
          title="Known Games Count"
        />
      </div>
    </>
  );
};

export default KnownGamesCount;
