import {
  PlusIcon,
  FlagIcon,
  TrashIcon,
  LockOpenIcon,
} from "@heroicons/react/24/solid";
import { FormEvent, useState } from "react";
import { Tooltip } from "@material-tailwind/react";
import { Gameplay, Table, User, Game } from "../../types";
import { CreateGameplayDialog } from "./CreateGameplayDialog";
import { InputWithLabel } from "../common/InputWithLabel";
import { CardAction } from "../common/CardAction";
import { format } from "date-fns";
import { getDuration } from "../../utils/time";
import {
  useCloseTableMutation,
  useReopenTableMutation,
  useTableMutations,
} from "../../utils/api/table";
import { EditGameplayDialog } from "./EditGameplayDialog";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import { toast } from "react-toastify";
import { EditableText } from "../common/EditableText";

export interface TableCardProps {
  table: Table;
  mentors: User[];
  games: Game[];
}

export function TableCard({ table, mentors, games }: TableCardProps) {
  const [isGameplayDialogOpen, setIsGameplayDialogOpen] = useState(false);
  const [isEditGameplayDialogOpen, setIsEditGameplayDialogOpen] =
    useState(false);
  const [isDeleteConfirmationDialogOpen, setIsDeleteConfirmationDialogOpen] =
    useState(false);
  const [isCloseConfirmationDialogOpen, setIsCloseConfirmationDialogOpen] =
    useState(false);

  const [selectedGameplay, setSelectedGameplay] = useState<Gameplay>();
  const { updateTable, deleteTable } = useTableMutations();
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

  const gameplayTemplate: Gameplay = {
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
    deleteTable(table._id);
    setIsDeleteConfirmationDialogOpen(false);
    toast.success(`Table ${table.name} deleted`);
  }

  return (
    <div
      className="bg-white rounded-md shadow sm:h-auto break-inside-avoid mb-4 group"
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
          <Tooltip content="Delete">
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
            label="Start Time"
            type="time"
            value={table.startHour}
            onChange={updateTableHandler}
          />
          <InputWithLabel
            name="finishHour"
            label="End Time"
            type="time"
            value={table.finishHour}
            onChange={updateTableHandler}
          />
        </div>
        <div className="flex flex-col gap-4">
          <InputWithLabel
            name="playerCount"
            label="Player Count"
            type="number"
            defaultValue={table.playerCount}
            onChange={updateTableHandler}
          />
        </div>
        <div className="flex flex-col space-y-2 mt-2">
          {table.gameplays?.map((gameplay) => {
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
        </div>
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
        title="Delete Table"
        text="This table and gameplays in it will be deleted. Are you sure to continue?"
      />
      <ConfirmationDialog
        isOpen={isCloseConfirmationDialogOpen}
        close={() => setIsCloseConfirmationDialogOpen(false)}
        confirm={finishTable}
        title="Close Table"
        text="Table is being closed. Are you sure?"
      />
    </div>
  );
}
