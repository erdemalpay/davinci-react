import { Switch } from "@headlessui/react";
import { useEffect, useState } from "react";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { toast } from "react-toastify";
import { CheckSwitch } from "../components/common/CheckSwitch";
import { ConfirmationDialog } from "../components/common/ConfirmationDialog";
import { AddGameDialog } from "../components/games/AddGameDialog";
import { Header } from "../components/header/Header";
import GenericAddEditPanel from "../components/panelComponents/FormElements/GenericAddEditPanel";
import GenericTable from "../components/panelComponents/Tables/GenericTable";
import {
  FormKeyTypeEnum,
  InputTypes,
} from "../components/panelComponents/shared/types";
import type { Game } from "../types";
import { useGameMutations, useGetGames } from "../utils/api/game";

const inputs = [
  {
    type: InputTypes.TEXT,
    formKey: "name",
    label: "Name",
    placeholder: "Name",
    required: true,
  },
];
const formKeys = [{ key: "name", type: FormKeyTypeEnum.STRING }];
export default function NewGames() {
  const games = useGetGames();
  const { updateGame, deleteGame, createGame } = useGameMutations();
  const [tableKey, setTableKey] = useState(0);
  const [isEnableEdit, setIsEnableEdit] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
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
      isDisabled: !isEnableEdit,
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
    {
      name: "Edit",
      isDisabled: !isEnableEdit,

      icon: <FiEdit />,
      className: "text-blue-500 cursor-pointer text-xl",
      isModal: true,
      setRow: setRowToAction,
      modal: rowToAction ? (
        <GenericAddEditPanel
          isOpen={isEditModalOpen}
          close={() => setIsEditModalOpen(false)}
          inputs={inputs}
          formKeys={formKeys}
          submitItem={updateGame as any}
          isEditMode={true}
          topClassName="flex flex-col gap-2 "
          itemToEdit={{ id: rowToAction._id, updates: rowToAction }}
        />
      ) : null,

      isModalOpen: isEditModalOpen,
      setIsModal: setIsEditModalOpen,

      isPath: false,
    },
  ];

  const filters = [
    {
      label: "Enable Edit",
      isUpperSide: false,
      node: (
        <Switch
          checked={isEnableEdit}
          onChange={() => setIsEnableEdit((value) => !value)}
          className={`${isEnableEdit ? "bg-green-500" : "bg-red-500"}
          relative inline-flex h-[20px] w-[36px] min-w-[36px] border-[1px] cursor-pointer rounded-full border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
        >
          <span
            aria-hidden="true"
            className={`${isEnableEdit ? "translate-x-4" : "translate-x-0"}
            pointer-events-none inline-block h-[18px] w-[18px] transform rounded-full bg-white transition duration-200 ease-in-out`}
          />
        </Switch>
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
          columns={
            isEnableEdit
              ? [...columns, { key: "Action", isSortable: false }]
              : columns
          }
          filters={filters}
          title="Games"
          addButton={addButton}
        />
      </div>
    </>
  );
}
