import { Dialog, Transition } from "@headlessui/react";
import { TrashIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { Input } from "@material-tailwind/react";
import { FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { Gameplay, Table, User } from "../../types";
import { MinimalGame } from "../../utils/api/game";
import {
  useDeleteGameplayMutation,
  useUpdateGameplayMutation,
} from "../../utils/api/gameplay";
import { Autocomplete } from "../common/Autocomplete";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import { GenericButton } from "../common/GenericButton";
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
  games: MinimalGame[];
}) {
  const { t } = useTranslation();
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
    toast.success(t("Gameplay updated"));
  }

  function handleGameSelection(game: MinimalGame) {
    if (!game || !gameplay._id) return;
    updateGameplay({
      tableId: table._id,
      id: gameplay._id,
      updates: { game: game._id },
    });
    toast.success(t("Gameplay updated"));
  }

  function handleMentorSelection(mentor: User) {
    if (!mentor) return;
    updateGameplay({
      tableId: table._id,
      id: gameplay._id,
      updates: { mentor: mentor._id },
    });
    toast.success(t("Gameplay updated"));
  }

  function removeGameplay() {
    deleteGameplay({
      tableId: table._id,
      id: gameplay._id,
    });
    toast.success(t("Gameplay deleted"));
    close();
  }

  const selectedGame = games.find((game) => game._id === gameplay.game);
  const selectedMentor =
    mentors.find((mentor) => mentor._id === gameplay.mentor) ||
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
                  <p className="text-base font-semibold">
                    {t("Update Gameplay")}
                  </p>
                  <div className="flex flex-row justify-end gap-4">
                    <GenericButton
                      onClick={() => setIsConfirmationDialogOpen(true)}
                      variant="icon"
                    >
                      <TrashIcon className="h-6 w-6" />
                    </GenericButton>
                    <GenericButton onClick={close} variant="icon">
                      <XMarkIcon className="h-6 w-6" />
                    </GenericButton>
                  </div>
                </div>
                <div className="px-4 md:px-10 md:pt-4 md:pb-4 pb-8">
                  <div className="flex flex-col gap-4">
                    <div>
                      <Input
                        name="name"
                        variant="standard"
                        label={t("Table Name")}
                        type="text"
                        value={table.name}
                        readOnly
                      />
                    </div>
                    <div>
                      <Autocomplete
                        name="game"
                        label={t("Game")}
                        suggestions={games}
                        handleSelection={handleGameSelection}
                        initialValue={selectedGame}
                        showSelected
                      />
                    </div>
                    <div>
                      <Autocomplete
                        name="mentor"
                        label={t("Mentor")}
                        suggestions={mentors}
                        handleSelection={handleMentorSelection}
                        initialValue={selectedMentor}
                        showSelected
                      />
                    </div>
                    <Input
                      name="playerCount"
                      variant="standard"
                      label={t("Player Count")}
                      type="number"
                      defaultValue={gameplay.playerCount}
                      onChange={updateGameplayHandler}
                    />
                  </div>
                  <div className="mt-2 flex gap-2">
                    <TimeInputWithLabel
                      name="startHour"
                      label={t("Start Time")}
                      defaultValue={gameplay.startHour}
                      onChange={updateGameplayHandler}
                    />
                    <TimeInputWithLabel
                      name="finishHour"
                      label={t("End Time")}
                      defaultValue={gameplay.finishHour}
                      onChange={updateGameplayHandler}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <ConfirmationDialog
          confirm={removeGameplay}
          close={() => setIsConfirmationDialogOpen(false)}
          isOpen={isConfirmationDialogOpen}
          title={t("Delete Gameplay")}
          text={t("Are you sure to delete this gameplay?")}
        />
      </Dialog>
    </Transition>
  );
}
