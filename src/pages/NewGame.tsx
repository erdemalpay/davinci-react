import { useEffect, useState } from "react";
import { HiOutlineTrash } from "react-icons/hi2";
import { toast } from "react-toastify";
import { CheckSwitch } from "../components/common/CheckSwitch";
import { ConfirmationDialog } from "../components/common/ConfirmationDialog";
import { AddGameDialog } from "../components/games/AddGameDialog";
import { Header } from "../components/header/Header";
import GenericTable from "../components/panelComponents/Tables/GenericTable";
import type { Game } from "../types";
import { useGameMutations, useGetGames } from "../utils/api/game";

export default function NewGames() {
  const games = useGetGames();
  const { updateGame, deleteGame, createGame } = useGameMutations();
  const [tableKey, setTableKey] = useState(0);
  const [isEnableEdit, setIsEnableEdit] = useState(false);
  const [isAddGameDialogOpen, setIsAddGameDialogOpen] = useState(false);
  const [rowToAction, setRowToAction] = useState<Game>();
  const [
    isCloseAllConfirmationDialogOpen,
    setIsCloseAllConfirmationDialogOpen,
  ] = useState(false);
  function handleLocationUpdate(game: Game, location: number) {
    const newLocations = game.locations || [];
    // Add if it doesn't exist, remove otherwise
    const index = newLocations.indexOf(location);
    if (index === -1) {
      newLocations.push(location);
    } else {
      newLocations.splice(index, 1);
    }
    updateGame({
      id: game._id,
      updates: { locations: newLocations },
    });
    toast.success(`Game ${game.name} updated`);
  }

  const columns = [
    { key: "", isSortable: false },
    { key: "Name", isSortable: true },
    { key: "Bahçeli", isSortable: false },
    { key: "Neorama", isSortable: false },
    { key: "Action", isSortable: false },
  ];

  const rowKeys = [
    {
      key: "thumbnail",
      isImage: true,
    },
    {
      key: "name",
      className: "min-w-32 pr-1",
    },
    {
      key: "bahceli",
      node: (row: Game) =>
        isEnableEdit ? (
          <CheckSwitch
            checked={row.locations?.includes(1)}
            onChange={() => handleLocationUpdate(row, 1)}
          />
        ) : (
          <p
            className={`w-fit px-2 py-1 rounded-md text-white ${
              row.locations.includes(1) ? "bg-green-500" : "bg-red-500"
            }`}
          >
            {row.locations.includes(1) ? "Yes" : "No"}
          </p>
        ),
    },
    {
      key: "neorama",
      node: (row: Game) =>
        isEnableEdit ? (
          <CheckSwitch
            checked={row.locations?.includes(2)}
            onChange={() => handleLocationUpdate(row, 2)}
          />
        ) : (
          <p
            className={`w-fit px-2 py-1 rounded-md text-white ${
              row.locations.includes(2) ? "bg-green-500" : "bg-red-500"
            }`}
          >
            {row.locations.includes(2) ? "Yes" : "No"}
          </p>
        ),
    },
  ];
  const actions = [
    {
      name: "Delete",
      icon: <HiOutlineTrash />,
      setRow: setRowToAction,
      modal: rowToAction ? (
        <ConfirmationDialog
          isOpen={isCloseAllConfirmationDialogOpen}
          close={() => setIsCloseAllConfirmationDialogOpen(false)}
          confirm={() => {
            deleteGame(rowToAction?._id);
            setIsCloseAllConfirmationDialogOpen(false);
          }}
          title="Delete Game"
          text={`${rowToAction.name} will be deleted. Are you sure you want to continue?`}
        />
      ) : null,
      className: "text-red-500 cursor-pointer text-2xl",
      isModal: true,
      isModalOpen: isCloseAllConfirmationDialogOpen,
      setIsModal: setIsCloseAllConfirmationDialogOpen,
      isPath: false,
    },
  ];
  const filters = [
    {
      label: "Enable Edit",
      node: (
        <>
          <CheckSwitch
            checked={isEnableEdit}
            onChange={() => setIsEnableEdit((value) => !value)}
            checkedBg="bg-red-500"
          ></CheckSwitch>
        </>
      ),
    },
  ];
  const addButton = {
    name: `Add Game`,
    isModal: true,
    modal: (
      <AddGameDialog
        isOpen={isAddGameDialogOpen}
        close={() => setIsAddGameDialogOpen(false)}
        createGame={createGame}
      />
    ),
    isModalOpen: isAddGameDialogOpen,
    setIsModal: setIsAddGameDialogOpen,
    isPath: false,
    icon: null,
    className: "bg-blue-500 hover:text-blue-500 hover:border-blue-500",
  };
  useEffect(() => {
    setTableKey((prev) => prev + 1);
  }, [games, isEnableEdit]);

  return (
    <>
      <Header showLocationSelector={false} />
      <div className="w-[90%] mx-auto my-10">
        <GenericTable
          key={tableKey}
          rows={games}
          rowKeys={rowKeys}
          actions={actions}
          columns={columns}
          filters={filters}
          title="Games"
          addButton={addButton}
        />
      </div>
    </>
  );
}
