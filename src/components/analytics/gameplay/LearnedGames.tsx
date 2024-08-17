import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useGetGames } from "../../../utils/api/game";

import { useGetUsers } from "../../../utils/api/user";
import { formatAsLocalDate } from "../../../utils/format";
import GenericTable from "../../panelComponents/Tables/GenericTable";

const LearnedGames = () => {
  const { t } = useTranslation();
  const users = useGetUsers();
  if (!users) return null;
  const [tableKey, setTableKey] = useState(0);
  const games = useGetGames();

  const columns = [
    { key: t("User"), isSortable: true },
    { key: t("Game"), isSortable: true },
    { key: t("Learn Date"), isSortable: true },
  ];

  const allRows = users
    .flatMap((user) =>
      user?.userGames?.map((item) => {
        return {
          game: games?.find((game) => game._id === item.game)?.name,
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

  useEffect(() => {
    setRows(allRows);
    setTableKey((prev) => prev + 1);
  }, [users, games]);

  return (
    <div className="w-[95%] mx-auto ">
      <GenericTable
        key={tableKey}
        columns={columns}
        rows={rows}
        rowKeys={rowKeys}
        title={t("Learned Games")}
        isActionsActive={false}
      />
    </div>
  );
};

export default LearnedGames;
