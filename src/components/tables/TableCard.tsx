import {
  FlagIcon,
  LockOpenIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/solid";
import { Tooltip } from "@material-tailwind/react";
import { format } from "date-fns";
import { FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { IoIosArrowUp } from "react-icons/io";
import { toast } from "react-toastify";
import { Game, Gameplay, Table, TableStatus, User } from "../../types";
import {
  useCloseTableMutation,
  useReopenTableMutation,
  useTableMutations,
} from "../../utils/api/table";
import { getDuration } from "../../utils/time";
import { CardAction } from "../common/CardAction";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import { EditableText } from "../common/EditableText";
import { InputWithLabel } from "../common/InputWithLabel";
import { CreateGameplayDialog } from "./CreateGameplayDialog";
import { EditGameplayDialog } from "./EditGameplayDialog";

export interface TableCardProps {
  table: Table;
  mentors: User[];
  games: Game[];
  showAllGameplays?: boolean;
}

export function TableCard({
  table,
  mentors,
  games,
  showAllGameplays = false,
}: TableCardProps) {
  const { t } = useTranslation();
  const [isGameplayDialogOpen, setIsGameplayDialogOpen] = useState(false);
  const [isEditGameplayDialogOpen, setIsEditGameplayDialogOpen] =
    useState(false);
  const [isDeleteConfirmationDialogOpen, setIsDeleteConfirmationDialogOpen] =
    useState(false);
  const [isCloseConfirmationDialogOpen, setIsCloseConfirmationDialogOpen] =
    useState(false);
  const [isGameplaysVisible, setIsGameplaysVisible] = useState(false);
  const [selectedGameplay, setSelectedGameplay] = useState<Gameplay>();
  const { updateTable } = useTableMutations();
  const { mutate: closeTable } = useCloseTableMutation();
  const { mutate: reopenTable } = useReopenTableMutation();

  const bgColor = table.finishHour ? "bg-gray-500" : "bg-gray-200";

  function createGameplay() {
    setSelectedGameplay(undefined);
    setIsGameplayDialogOpen(true);
  }

  function getGameName(id: number) {
    const game = games.find((game) => game._id === id);
    return game?.name || "";
  }

  function finishTable() {
    closeTable({
      id: table._id,
      updates: { finishHour: format(new Date(), "HH:mm") },
    });
    setIsCloseConfirmationDialogOpen(false);
    toast.success(`Table ${table.name} closed`);
  }

  function reopenTableBack() {
    reopenTable({
      id: table._id,
    });
    toast.success(`Table ${table.name} reopened`);
  }

  const date = table.date;
  const startHour = format(new Date(), "HH:mm");

  const gameplayTemplate: Partial<Gameplay> = {
    date,
    location: table.location as number,
    playerCount: table.playerCount,
    startHour,
    mentor: mentors[0],
  };

  function updateTableHandler(event: FormEvent<HTMLInputElement>) {
    const target = event.target as HTMLInputElement;
    if (!target.value) return;
    updateTable({
      id: table._id,
      updates: { [target.name]: target.value },
    });
    toast.success(`Table ${table.name} updated`);
  }

  function editGameplay(gameplay: Gameplay) {
    setSelectedGameplay(gameplay);
    setIsEditGameplayDialogOpen(true);
  }

  function handleTableDelete() {
    if (!table._id) return;
    updateTable({
      id: table._id,
      updates: { status: TableStatus.CANCELLED },
    });
    setIsDeleteConfirmationDialogOpen(false);
    toast.success(`Table ${table.name} deleted`);
  }

  return (
    <div
      className="bg-white rounded-md shadow sm:h-auto break-inside-avoid mb-4 group __className_a182b8"
      style={{ lineHeight: "8px" }}
    >
      <div
        className={`${bgColor} rounded-tl-md rounded-tr-md px-4 lg:px-6 lg:py-4 py-6 flex items-center justify-between mb-2`}
      >
        <p className="text-base font-semibold cursor-pointer w-full">
          <EditableText
            name="name"
            text={table.name}
            onUpdate={updateTableHandler}
          />
        </p>
        <div className="justify-end w-2/3 gap-4 flex lg:hidden lg:group-hover:flex">
          {!table.finishHour && (
            <Tooltip content="Add gameplay">
              <span className="text-{8px}">
                <CardAction onClick={createGameplay} IconComponent={PlusIcon} />
              </span>
            </Tooltip>
          )}
          {!table.finishHour && (
            <Tooltip content="Close">
              <span className="text-{8px}">
                <CardAction
                  onClick={() => setIsCloseConfirmationDialogOpen(true)}
                  IconComponent={FlagIcon}
                />
              </span>
            </Tooltip>
          )}
          {table.finishHour && (
            <Tooltip content="Reopen">
              <span className="text-{8px}">
                <CardAction
                  onClick={() => reopenTableBack()}
                  IconComponent={LockOpenIcon}
                />
              </span>
            </Tooltip>
          )}
          <Tooltip content={t("Delete")}>
            <span>
              <CardAction
                onClick={() => setIsDeleteConfirmationDialogOpen(true)}
                IconComponent={TrashIcon}
              />
            </span>
          </Tooltip>
        </div>
      </div>
      <div className={`px-4 lg:px-6 md:pb-4 pb-8`}>
        <div className="flex gap-4 flex-row">
          <InputWithLabel
            name="startHour"
            label={t("Start Time")}
            type="time"
            value={table.startHour}
            onChange={updateTableHandler}
          />
          <InputWithLabel
            name="finishHour"
            label={t("End Time")}
            type="time"
            value={table.finishHour}
            onChange={updateTableHandler}
          />
        </div>
        <div className="flex flex-col gap-4">
          <InputWithLabel
            name="playerCount"
            label={t("Player Count")}
            type="number"
            defaultValue={table.playerCount}
            onChange={updateTableHandler}
          />
          {/* total gameplays number  */}
          {!(isGameplaysVisible || showAllGameplays) && (
            <div
              className="flex flex-row justify-between items-center cursor-pointer py-2"
              onClick={() => {
                if (table?.gameplays?.length > 0) {
                  setIsGameplaysVisible(true);
                }
              }}
            >
              <p className="text-xs">Total Gameplays:</p>
              <p className="my-auto text-sm "> {table.gameplays?.length}</p>
            </div>
          )}
        </div>

        {/* table gameplays */}
        {(isGameplaysVisible || showAllGameplays) &&
          table.gameplays.length > 0 && (
            <div className="flex flex-col space-y-2 mt-2">
              {table.gameplays.map((gameplay) => {
                return (
                  <div
                    key={gameplay._id || gameplay.startHour}
                    className="flex justify-between text-xs cursor-pointer"
                    onClick={() => editGameplay(gameplay)}
                  >
                    <div className="flex w-4/5">
                      <div className="overflow-hidden whitespace-nowrap text-ellipsis text-xs mr-1">
                        {getGameName(gameplay.game as number)}
                      </div>
                      <h1 className="text-xs">({gameplay.playerCount})</h1>
                    </div>
                    <div className="flex">
                      {gameplay.mentor?._id !== "dv" ? (
                        <div className="bg-gray-300 rounded-full px-2 mr-1 whitespace-nowrap">
                          {gameplay.mentor?.name}
                        </div>
                      ) : (
                        <></>
                      )}

                      <h5 className="text-xs whitespace-nowrap">
                        {getDuration(
                          gameplay.date,
                          gameplay.startHour,
                          gameplay.finishHour
                        )}
                      </h5>
                    </div>
                  </div>
                );
              })}

              {!showAllGameplays && (
                <IoIosArrowUp
                  className="text-xl cursor-pointer mx-auto"
                  onClick={() => setIsGameplaysVisible(false)}
                />
              )}
            </div>
          )}
      </div>
      {isGameplayDialogOpen && (
        <CreateGameplayDialog
          isOpen={isGameplayDialogOpen}
          close={() => setIsGameplayDialogOpen(false)}
          gameplay={selectedGameplay || gameplayTemplate}
          table={table}
          mentors={mentors}
          games={games}
        />
      )}
      {selectedGameplay && isEditGameplayDialogOpen && (
        <EditGameplayDialog
          isOpen={isEditGameplayDialogOpen}
          close={() => {
            setIsEditGameplayDialogOpen(false);
          }}
          gameplay={selectedGameplay}
          table={table}
          mentors={mentors}
          games={games}
        />
      )}
      <ConfirmationDialog
        isOpen={isDeleteConfirmationDialogOpen}
        close={() => setIsDeleteConfirmationDialogOpen(false)}
        confirm={handleTableDelete}
        title={t("Delete Table")}
        text="This table and gameplays in it will be deleted. Are you sure to continue?"
      />
      <ConfirmationDialog
        isOpen={isCloseConfirmationDialogOpen}
        close={() => setIsCloseConfirmationDialogOpen(false)}
        confirm={finishTable}
        title={t("Close Table")}
        text="Table is being closed. Are you sure?"
      />
    </div>
  );
}
