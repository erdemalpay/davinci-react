import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { IoCheckmark, IoCloseOutline } from "react-icons/io5";
import { toast } from "react-toastify";
import { CheckSwitch } from "../components/common/CheckSwitch";
import { ConfirmationDialog } from "../components/common/ConfirmationDialog";
import { AddGameDialog } from "../components/games/AddGameDialog";
import { Header } from "../components/header/Header";
import GenericAddEditPanel from "../components/panelComponents/FormElements/GenericAddEditPanel";

import GenericTable from "../components/panelComponents/Tables/GenericTable";
import SwitchButton from "../components/panelComponents/common/SwitchButton";
import {
  FormKeyTypeEnum,
  InputTypes,
} from "../components/panelComponents/shared/types";
import type { Game } from "../types";
import { useGameMutations, useGetGames } from "../utils/api/game";

const formKeys = [{ key: "name", type: FormKeyTypeEnum.STRING }];
export default function Games() {
  const { t } = useTranslation();

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
  const inputs = [
    {
      type: InputTypes.TEXT,
      formKey: "name",
      label: t("Name"),
      placeholder: t("Name"),
      required: true,
    },
  ];
  const columns = [
    { key: "", isSortable: false },
    { key: t("Name"), isSortable: true },
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
        ) : row?.locations?.includes(1) ? (
          <IoCheckmark className="text-blue-500 text-2xl" />
        ) : (
          <IoCloseOutline className="text-red-800 text-2xl" />
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
        ) : row?.locations?.includes(2) ? (
          <IoCheckmark className="text-blue-500 text-2xl" />
        ) : (
          <IoCloseOutline className="text-red-800 text-2xl" />
        ),
    },
  ];
  const actions = [
    {
      name: t("Delete"),
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
          title={t("Delete Game")}
          text={`${rowToAction.name} ${t("GeneralDeleteMessage")}`}
        />
      ) : null,
      className: "text-red-500 cursor-pointer text-2xl",
      isModal: true,
      isModalOpen: isCloseAllConfirmationDialogOpen,
      setIsModal: setIsCloseAllConfirmationDialogOpen,
      isPath: false,
    },
    {
      name: t("Edit"),
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
      label: t("Enable Edit"),
      isUpperSide: false,
      node: <SwitchButton checked={isEnableEdit} onChange={setIsEnableEdit} />,
    },
  ];
  const addButton = {
    name: t("Add Game"),
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
      <div className="w-[98%] mx-auto my-10">
        <GenericTable
          key={tableKey}
          rows={games}
          rowKeys={rowKeys}
          actions={actions}
          isActionsActive={isEnableEdit}
          columns={
            isEnableEdit
              ? [...columns, { key: t("Action"), isSortable: false }]
              : columns
          }
          filters={filters}
          title={t("Games")}
          addButton={addButton}
        />
      </div>
    </>
  );
}
