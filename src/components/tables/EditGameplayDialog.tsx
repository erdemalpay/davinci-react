import { Dialog, Transition } from "@headlessui/react";
import { TrashIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { Input } from "@material-tailwind/react";
import { FormEvent, useState } from "react";
import { toast } from "react-toastify";
import { Game, Gameplay, Table, User } from "../../types";
import {
  useDeleteGameplayMutation,
  useUpdateGameplayMutation,
} from "../../utils/api/gameplay";
import { Autocomplete } from "../common/Autocomplete";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import { TimeInputWithLabel } from "../common/TimeInputWithLabel";

export function EditGameplayDialog({
  isOpen,
  close,
  table,
  gameplay,
  mentors,
  games,
}: {
  isOpen: boolean;
  close: () => void;
  table: Table;
  gameplay: Gameplay;
  mentors: User[];
  games: Game[];
}) {
  const { mutate: updateGameplay } = useUpdateGameplayMutation();
  const { mutate: deleteGameplay } = useDeleteGameplayMutation();

  const [isConfirmationDialogOpen, setIsConfirmationDialogOpen] =
    useState(false);

  function updateGameplayHandler(event: FormEvent<HTMLInputElement>) {
    const target = event.target as HTMLInputElement;
    if (!target.value || !gameplay._id) return;

    updateGameplay({
      tableId: table._id,
      id: gameplay._id,
      updates: { [target.name]: target.value },
    });
    toast.success("Gameplay updated");
  }

  function handleGameSelection(game: Game) {
    if (!game || !gameplay._id) return;
    updateGameplay({
      tableId: table._id,
      id: gameplay._id,
      updates: { game: game._id },
    });
    toast.success("Gameplay updated");
  }

  function handleMentorSelection(mentor: User) {
    if (!mentor) return;
    updateGameplay({
      tableId: table._id,
      id: gameplay._id,
      updates: { mentor },
    });
    toast.success("Gameplay updated");
  }

  function removeGameplay() {
    deleteGameplay({
      tableId: table._id,
      id: gameplay._id,
    });
    toast.success("Gameplay deleted");
    close();
  }

  const selectedGame = games.find((game) => game._id === gameplay.game);
  const selectedMentor =
    mentors.find((mentor) => mentor._id === gameplay.mentor?._id) ||
    mentors.find((mentor) => mentor._id === "dv");

  return (
    <Transition
      show={isOpen}
      enter="transition duration-100 ease-out"
      enterFrom="transform scale-95 opacity-0"
      enterTo="transform scale-100 opacity-100"
      leave="transition duration-75 ease-out"
      leaveFrom="transform scale-100 opacity-100"
      leaveTo="transform scale-95 opacity-0"
    >
      <Dialog onClose={() => close()}>
        <Dialog.Overlay />
        <div
          id="popup"
          className="z-50 fixed w-full flex justify-center inset-0"
        >
          <div
            onClick={close}
            className="w-full h-full bg-gray-900 bg-opacity-50 z-0 absolute inset-0"
          />
          <div className="mx-auto container">
            <div className="flex items-center justify-center h-full w-full">
              <div className="bg-white rounded-md shadow fixed overflow-y-auto sm:h-auto w-10/12 md:w-8/12 lg:w-1/2 2xl:w-2/5">
                <div className="bg-gray-100 rounded-tl-md rounded-tr-md px-4 md:px-8 md:py-4 py-7 flex items-center justify-between">
                  <p className="text-base font-semibold">Update Gameplay</p>
                  <div className="flex flex-row justify-end gap-4">
                    <button
                      onClick={() => setIsConfirmationDialogOpen(true)}
                      className="focus:outline-none "
                    >
                      <TrashIcon className="h-6 w-6" />
                    </button>
                    <button onClick={close} className="focus:outline-none">
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>
                </div>
                <div className="px-4 md:px-10 md:pt-4 md:pb-4 pb-8">
                  <div className="flex flex-col gap-4">
                    <div>
                      <Input
                        name="name"
                        variant="standard"
                        label="Table Name"
                        type="text"
                        value={table.name}
                        readOnly
                      />
                    </div>
                    <div>
                      <Autocomplete
                        name="game"
                        label="Game"
                        suggestions={games}
                        handleSelection={handleGameSelection}
                        initialValue={selectedGame}
                        showSelected
                      />
                    </div>
                    <div>
                      <Autocomplete
                        name="mentor"
                        label="Mentor"
                        suggestions={mentors}
                        handleSelection={handleMentorSelection}
                        initialValue={selectedMentor}
                        showSelected
                      />
                    </div>
                    <Input
                      name="playerCount"
                      variant="standard"
                      label="Player Count"
                      type="number"
                      defaultValue={gameplay.playerCount}
                      onChange={updateGameplayHandler}
                    />
                  </div>
                  <div className="mt-2 flex gap-2">
                    <TimeInputWithLabel
                      name="startHour"
                      label="Start Time"
                      defaultValue={gameplay.startHour}
                      onChange={updateGameplayHandler}
                    />
                    <TimeInputWithLabel
                      name="finishHour"
                      label="End Time"
                      defaultValue={gameplay.finishHour}
                      onChange={updateGameplayHandler}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Dialog>
      <ConfirmationDialog
        confirm={removeGameplay}
        close={() => setIsConfirmationDialogOpen(false)}
        isOpen={isConfirmationDialogOpen}
        title="Delete Gameplay"
        text={"Are you sure to delete this gameplay?"}
      />
    </Transition>
  );
}
