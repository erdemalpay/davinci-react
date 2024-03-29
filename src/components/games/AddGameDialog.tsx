import { Input } from "@material-tailwind/react";
import { UseMutateFunction } from "@tanstack/react-query";
import { useState } from "react";
import { Game } from "../../types";
import { useGetGameDetails } from "../../utils/api/game";

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
    <div
      className={`__className_a182b8 fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-50 ${
        !isOpen && "hidden"
      }`}
    >
      <div className="bg-white rounded-md shadow-lg  w-11/12 md:w-1/3 max-w-full max-h-[90vh] z-50 overflow-visible">
        <div className="rounded-tl-md rounded-tr-md px-4 py-6 flex flex-col gap-4 justify-between">
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
          <div className="ml-auto flex flex-row gap-4">
            <button
              onClick={close}
              className="inline-block bg-red-400 hover:bg-red-600 text-white text-sm py-2 px-3 rounded-md cursor-pointer my-auto w-fit"
            >
              Cancel
            </button>
            <button
              disabled={!gameDetails}
              className={`inline-block ${
                !gameDetails ? "bg-gray-500" : "bg-blue-500 hover:bg-blue-600"
              } text-white text-sm py-2 px-3 rounded-md cursor-pointer my-auto w-fit`}
              onClick={handleCreate}
            >
              Add Game
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
