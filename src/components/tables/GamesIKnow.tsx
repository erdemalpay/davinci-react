import { useState } from "react";
import { useUserContext } from "../../context/User.context";
import { Game, RowPerPageEnum, UserGameUpdateType } from "../../types";
import { useGetGames } from "../../utils/api/game";
import {
  updateUserGamesMutation,
  useGetUserWithId,
} from "../../utils/api/user";
import { CheckSwitch } from "../common/CheckSwitch";
import GenericTable from "../panelComponents/Tables/GenericTable";
type Props = {
  userId: string;
};

const GamesIKnow = ({ userId }: Props) => {
  const { user: panelUser } = useUserContext();
  if (!panelUser) return <></>;
  const { updateUserGame } = updateUserGamesMutation();
  const user = useGetUserWithId(userId);
  const games = useGetGames();
  const [rowsPerPage, setRowsPerPage] = useState(RowPerPageEnum.TEN);
  const [currentPage, setCurrentPage] = useState(1);

  const columns = ["Game", `${user?._id === panelUser?._id ? "Active" : ""}`];
  const rows =
    user?._id === panelUser?._id
      ? games
      : games.filter((game) => user?.games.includes(game._id));
  const rowKeys = [
    {
      key: "name",
    },
  ];

  function handleUpdateUserGame({
    gameId,
    updateType,
  }: {
    gameId: number;
    updateType: UserGameUpdateType;
  }) {
    updateUserGame({ gameId, updateType, userId });
  }
  const actions = [
    {
      name: "Toggle Active",
      isModal: false,
      isPath: false,
      icon: null,
      isDisabled: user?._id !== panelUser?._id,
      node: (row: Game) => (
        <CheckSwitch
          checked={user?.games.includes(row._id) ?? false}
          onChange={() => {
            if (user?.games.includes(row._id)) {
              handleUpdateUserGame({
                gameId: row._id,
                updateType: UserGameUpdateType.REMOVE,
              });
            } else {
              handleUpdateUserGame({
                gameId: row._id,
                updateType: UserGameUpdateType.ADD,
              });
            }
          }}
        ></CheckSwitch>
      ),
    },
  ];

  return (
    <div className="w-full  h-fit">
      <GenericTable
        columns={columns}
        rows={rows}
        rowKeys={rowKeys}
        actions={actions}
        rowsPerPage={rowsPerPage}
        setRowsPerPage={setRowsPerPage}
        currentPage={currentPage < 1 ? 1 : currentPage}
        setCurrentPage={setCurrentPage}
        title={`${
          user?._id === panelUser?._id
            ? "Games I Know"
            : `Games ${user?.name} Knows`
        }`}
      />
    </div>
  );
};

export default GamesIKnow;