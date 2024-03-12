import { useEffect, useState } from "react";
import { useGetGames } from "../../utils/api/game";
import { useGetAllUsers } from "../../utils/api/user";
import { Autocomplete } from "../common/Autocomplete";
import GenericTable from "../panelComponents/Tables/GenericTable";

type KnownGamesCountUser = {
  mentor: string;
  gameCount: number;
};
type Props = {};

const KnownGamesCount = ({}: Props) => {
  const users = useGetAllUsers();
  const games = useGetGames();
  const [tableKey, setTableKey] = useState(1);
  const [rows, setRows] = useState<KnownGamesCountUser[]>([]);
  const [search, setSearch] = useState(0);
  const columns = [
    { key: "Mentor", isSortable: true },
    { key: "Game Count", isSortable: true },
  ];
  useEffect(() => {
    const processedUsers = search
      ? users
          .filter(
            (user) => user.userGames.filter((g) => g.game === search).length > 0
          )
          .map((user) => ({
            mentor: user.name,
            gameCount: user.userGames.length,
          }))
      : users
          .filter((user) => user.userGames.length > 0)
          .sort((a, b) => b.userGames.length - a.userGames.length)
          .map((user) => ({
            mentor: user.name,
            gameCount: user.userGames.length,
          }));

    setRows(processedUsers);
    setTableKey((prev) => prev + 1);
  }, [users, search]);

  const rowKeys = [
    { key: "mentor", className: "min-w-32 pr-1" },
    { key: "gameCount", className: "min-w-32 " },
  ];

  return (
    <>
      <div className="w-[95%] mx-auto ">
        <div className="w-80 ">
          <Autocomplete
            name="game"
            label="Game"
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
          title="Known Games Count"
          isSearch={false}
        />
      </div>
    </>
  );
};

export default KnownGamesCount;
