import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/solid";
import { Input } from "@material-tailwind/react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { useForm } from "../../hooks/useForm";
import { Game, Gameplay, Table, User } from "../../types";
import { useCreateGameplayMutation } from "../../utils/api/gameplay";
import { Autocomplete } from "../common/Autocomplete";

export function CreateGameplayDialog({
  isOpen,
  close,
  gameplay,
  table,
  mentors,
  games,
}: {
  isOpen: boolean;
  close: () => void;
  gameplay: Partial<Gameplay>;
  table: Table;
  mentors: User[];
  games: Game[];
}) {
  const { t } = useTranslation();
  const { data, setData, handleUpdate } = useForm(gameplay as Gameplay);

  const { mutate: createGameplay } = useCreateGameplayMutation();

  async function handleCreate() {
    // We were using async version to wait for response before closing
    // But since we are optimistically update data, that seemed redundant to me so I removed
    // May revert back later if needed
    createGameplay({ table: table._id as number, payload: data });
    toast.success(t("New gameplay added to table {{tableName}}", { tableName: table.name }));
    close();
  }

  function handleMentorSelection(mentor: User) {
    setData({ ...data, mentor });
  }

  function handleGameSelection(game: Game) {
    setData({ ...data, game: game?._id });
  }

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
          className="z-20 fixed w-full flex justify-center inset-0"
        >
          <div
            onClick={close}
            className="w-full h-full bg-gray-500 bg-opacity-50 z-0 absolute inset-0"
          />
          <div className="mx-auto container">
            <div className="flex items-center justify-center h-full w-full">
              <div className="bg-white rounded-md shadow fixed overflow-y-auto sm:h-auto w-10/12 md:w-8/12 lg:w-1/2 2xl:w-2/5">
                <div className="bg-gray-100 rounded-tl-md rounded-tr-md px-4 md:px-8 md:py-4 py-7 flex items-center justify-between">
                  <p className="text-base font-semibold">{t("Create Gameplay")}</p>
                  <button onClick={close} className="focus:outline-none">
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
                <div className="px-4 lg:px-10 flex flex-col mt-4 gap-2">
                  <Input
                    variant="standard"
                    name="name"
                    label={t("Table Name")}
                    type="text"
                    value={table.name}
                    readOnly
                  />
                  <Input
                    variant="standard"
                    name="playerCount"
                    label={t("Player Count")}
                    type="number"
                    min={0}
                    value={data.playerCount}
                    onChange={handleUpdate}
                  />
                  <Autocomplete
                    name="mentor"
                    label={t("Mentor")}
                    suggestions={mentors}
                    handleSelection={handleMentorSelection}
                    initialValue={mentors.find((mentor) => mentor._id === "dv")}
                    showSelected
                  />
                  <Autocomplete
                    name="game"
                    label={t("Game")}
                    suggestions={games}
                    handleSelection={handleGameSelection}
                    showSelected
                  />
                  <div className="flex flex-col lg:flex-row gap-2 mt-4">
                    <Input
                      variant="standard"
                      name="startHour"
                      label={t("Start Time")}
                      type="time"
                      defaultValue={data.startHour}
                      onChange={handleUpdate}
                    />
                    <Input
                      variant="standard"
                      name="finishHour"
                      label={t("End Time")}
                      type="time"
                      defaultValue={data.finishHour}
                      onChange={handleUpdate}
                    />
                  </div>
                  <div className="flex items-center justify-between my-4">
                    <button
                      onClick={close}
                      className="px-6 py-3 bg-gray-400 hover:bg-gray-500 shadow rounded text-sm text-white"
                    >
                      {t("Cancel")}
                    </button>
                    <button
                      className="px-6 py-3 bg-gray-800 hover:bg-opacity-80 shadow rounded text-sm text-white disabled:bg-gray-300"
                      onClick={handleCreate}
                      disabled={!(data.mentor && data.game)}
                    >
                      {t("Create")}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
