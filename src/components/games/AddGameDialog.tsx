import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/solid";
import { UseMutateFunction } from "@tanstack/react-query";
import { useState } from "react";
import { Game } from "../../types";
import { useGetGameDetails } from "../../utils/api/game";
import { Input } from "../common/DInput";

export function AddGameDialog({
  isOpen,
  close,
  createGame,
}: {
  isOpen: boolean;
  close: () => void;
  createGame: UseMutateFunction<Game, unknown, Partial<Game>>;
}) {
  const [gameId, setGameId] = useState<number>();

  const { gameDetails } = useGetGameDetails(gameId || 0);

  async function handleCreate() {
    if (gameDetails) {
      createGame(gameDetails);
      close();
    }
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
          className="z-50 fixed w-full flex justify-center inset-0"
        >
          <div
            onClick={close}
            className="w-full h-full bg-gray-900 z-0 absolute inset-0"
          />
          <div className="mx-auto container">
            <div className="flex items-center justify-center h-full w-full">
              <div className="bg-white rounded-md shadow fixed overflow-y-auto sm:h-auto w-10/12 md:w-8/12 lg:w-1/2 2xl:w-2/5">
                <div className="bg-gray-100 rounded-tl-md rounded-tr-md px-4 md:px-8 md:py-4 py-7 flex items-center justify-between">
                  <p className="text-base font-semibold">Add New Game</p>
                  <button onClick={close} className="focus:outline-none">
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
                <div className="px-4 md:px-10 md:pt-4 md:pb-4 pb-8">
                  <div className="flex flex-col gap-4">
                    <Input
                      name="gameId"
                      variant="standard"
                      label="Game BGG ID"
                      type="number"
                      value={gameId}
                      onChange={(event) => setGameId(+event.target.value)}
                    />
                    <Input
                      variant="standard"
                      name="name"
                      label="Game Name"
                      type="text"
                      value={gameDetails?.name}
                      readOnly
                    />
                  </div>
                  <div className="flex items-center justify-between mt-9">
                    <button
                      onClick={close}
                      className="px-6 py-3 bg-gray-400 hover:bg-gray-500 shadow rounded text-sm text-white"
                    >
                      Cancel
                    </button>
                    <button
                      disabled={!gameDetails}
                      className="px-6 py-3 bg-gray-800 hover:bg-opacity-80 shadow rounded text-sm text-white disabled:bg-gray-300"
                      onClick={handleCreate}
                    >
                      Add Game
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
