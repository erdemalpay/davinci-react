import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { IoCheckmark, IoCloseOutline } from "react-icons/io5";
import { CheckSwitch } from "../components/common/CheckSwitch";
import { ConfirmationDialog } from "../components/common/ConfirmationDialog";
import StarRating from "../components/common/StarRating";
import { AddGameDialog } from "../components/games/AddGameDialog";
import { Header } from "../components/header/Header";
import GenericAddEditPanel from "../components/panelComponents/FormElements/GenericAddEditPanel";
import GenericTable from "../components/panelComponents/Tables/GenericTable";
import SwitchButton from "../components/panelComponents/common/SwitchButton";
import {
  FormKeyTypeEnum,
  InputTypes,
} from "../components/panelComponents/shared/types";
import { useFilterContext } from "../context/Filter.context";
import { useUserContext } from "../context/User.context";
import { ActionEnum, DisabledConditionEnum, type Game } from "../types";
import { useGameMutations, useGetGames } from "../utils/api/game";
import { useGetStoreLocations } from "../utils/api/location";
import { useGetDisabledConditions } from "../utils/api/panelControl/disabledCondition";
import { getItem } from "../utils/getItem";

const formKeys = [{ key: "name", type: FormKeyTypeEnum.STRING }];
export default function Games() {
  const { t } = useTranslation();

  const games = useGetGames();
  const { updateGame, deleteGame, createGame } = useGameMutations();
  const { user } = useUserContext();
  const locations = useGetStoreLocations();
  const { isGameEnableEdit, setIsGameEnableEdit } = useFilterContext();
  const disabledConditions = useGetDisabledConditions();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddGameDialogOpen, setIsAddGameDialogOpen] = useState(false);
  const [rowToAction, setRowToAction] = useState<Game>();
  const [
    isCloseAllConfirmationDialogOpen,
    setIsCloseAllConfirmationDialogOpen,
  ] = useState(false);

  const gamesPageDisabledCondition = useMemo(() => {
    return getItem(DisabledConditionEnum.GAMES_GAMES, disabledConditions);
  }, [disabledConditions]);

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
  }

  const inputs = useMemo(
    () => [
      {
        type: InputTypes.TEXT,
        formKey: "name",
        label: t("Name"),
        placeholder: t("Name"),
        required: true,
      },
    ],
    [t]
  );

  const columns = useMemo(() => {
    const baseColumns = [
      { key: "", isSortable: false },
      { key: t("Name"), isSortable: true },
    ];

    for (const location of locations) {
      baseColumns.push({
        key: location.name,
        isSortable: false,
      });
    }

    return isGameEnableEdit
      ? [...baseColumns, { key: t("Action"), isSortable: false }]
      : baseColumns;
  }, [t, locations, isGameEnableEdit]);

  const rowKeys = useMemo(() => {
    const baseRowKeys = [
      {
        key: "thumbnail",
        isImage: true,
      },
      {
        key: "name",
        className: "min-w-32 pr-1",
      },
    ];

    for (const location of locations) {
      (baseRowKeys as any).push({
        key: location.name,
        node: (row: any) => {
          const isExist = row?.locations?.includes(location._id);
          if (isGameEnableEdit) {
            return (
              <CheckSwitch
                checked={isExist}
                onChange={() => handleLocationUpdate(row, location._id)}
              />
            );
          }
          return isExist ? (
            <IoCheckmark className="text-blue-500 text-2xl" />
          ) : (
            <IoCloseOutline className="text-red-800 text-2xl" />
          );
        },
      });
    }

    return baseRowKeys;
  }, [locations, isGameEnableEdit, updateGame]);

  const actions = useMemo(
    () => [
      {
        name: t("Delete"),
        isDisabled:
          gamesPageDisabledCondition?.actions?.some(
            (ac) =>
              ac.action === ActionEnum.DELETE &&
              user?.role?._id &&
              !ac?.permissionsRoles?.includes(user?.role?._id)
          ) ?? false,
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
        isDisabled:
          gamesPageDisabledCondition?.actions?.some(
            (ac) =>
              ac.action === ActionEnum.UPDATE &&
              user?.role?._id &&
              !ac?.permissionsRoles?.includes(user?.role?._id)
          ) ?? false,
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
      {
        name: "Star Rating",
        isDisabled:
          gamesPageDisabledCondition?.actions?.some(
            (ac) =>
              ac.action === ActionEnum.RATE &&
              user?.role?._id &&
              !ac?.permissionsRoles?.includes(user?.role?._id)
          ) ?? false,
        node: (row: any) => {
          return (
            <StarRating
              numberOfStars={row?.narrationDurationPoint}
              onChange={(value) => {
                updateGame({
                  id: row._id,
                  updates: { narrationDurationPoint: value },
                });
              }}
            />
          );
        },
      },
    ],
    [
      t,
      gamesPageDisabledCondition,
      user,
      rowToAction,
      isCloseAllConfirmationDialogOpen,
      deleteGame,
      isEditModalOpen,
      inputs,
      updateGame,
    ]
  );

  const isEnableEditDisabled = useMemo(() => {
    return (
      gamesPageDisabledCondition?.actions?.some(
        (ac) =>
          ac.action === ActionEnum.ENABLEEDIT &&
          user?.role?._id &&
          !ac?.permissionsRoles?.includes(user?.role?._id)
      ) ?? false
    );
  }, [gamesPageDisabledCondition, user]);

  const filters = useMemo(() => {
    return !isEnableEditDisabled
      ? [
          {
            label: t("Enable Edit"),
            isUpperSide: false,
            node: (
              <SwitchButton
                checked={isGameEnableEdit}
                onChange={() => {
                  setIsGameEnableEdit(!isGameEnableEdit);
                }}
              />
            ),
          },
        ]
      : [];
  }, [t, isEnableEditDisabled, isGameEnableEdit, setIsGameEnableEdit]);

  const addButton = useMemo(
    () => ({
      name: t("Add Game"),
      isDisabled:
        gamesPageDisabledCondition?.actions?.some(
          (ac) =>
            ac.action === ActionEnum.ADD &&
            user?.role?._id &&
            !ac?.permissionsRoles?.includes(user?.role?._id)
        ) ?? false,
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
    }),
    [t, gamesPageDisabledCondition, user, isAddGameDialogOpen, createGame]
  );

  return (
    <>
      <Header showLocationSelector={false} />
      <div className="w-[98%] mx-auto my-10">
        <GenericTable
          rows={games}
          rowKeys={rowKeys}
          actions={actions}
          isActionsActive={isGameEnableEdit}
          columns={columns}
          filters={filters}
          title={t("Games")}
          addButton={addButton}
        />
      </div>
    </>
  );
}
