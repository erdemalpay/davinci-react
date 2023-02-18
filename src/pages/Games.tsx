import { TrashIcon } from "@heroicons/react/24/solid";

import { FormEvent, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { CheckSwitch } from "../components/common/CheckSwitch";
import { EditableText } from "../components/common/EditableText";
import { Pagination } from "../components/common/Pagination";
import { AddGameDialog } from "../components/games/AddGameDialog";
import { Header } from "../components/header/Header";
import type { Game } from "../types";
import { useGameMutations, useGetGames } from "../utils/api/game";

export default function Games() {
  const games = useGetGames();
  const { updateGame, deleteGame, createGame } = useGameMutations();

  const [textFilter, setTextFilter] = useState("");
  const [filteredGames, setFilteredGames] = useState<Game[]>([]);
  const [page, setPage] = useState(1);
  const [gamePerPage, setGamePerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [gamesCount, setGamesCount] = useState(0);
  const [showGameImages, setShowGameImages] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [isAddGameDialogOpen, setIsAddGameDialogOpen] = useState(false);

  useEffect(() => {
    if (!games) return;
    const filteredGames = games.filter((game) => {
      return game.name
        .replace("İ", "I")
        .toLowerCase()
        .replace(/\s+/g, "")
        .includes(textFilter.toLowerCase().replace(/\s+/g, ""));
    });
    setGamesCount(filteredGames.length);
    setFilteredGames(
      filteredGames.slice(gamePerPage * (page - 1), gamePerPage * page)
    );
    setTotalPages(Math.ceil(filteredGames.length / gamePerPage));
  }, [page, games, gamesCount, gamePerPage, textFilter]);

  const handleClick = (num: number) => {
    let newPage = num;
    if (num <= 0) newPage = 1;
    if (num > totalPages) newPage = totalPages;
    setPage(newPage);
  };

  function handleLimitSelection(value: number) {
    setGamePerPage(value);
    setPage(1);
  }

  function updateGameHandler(event: FormEvent<HTMLInputElement>, item?: Game) {
    if (!item) return;
    const target = event.target as HTMLInputElement;
    if (!target.value) return;
    updateGame({
      id: item._id,
      updates: { [target.name]: target.value },
    });
  }

  /* function handleSetExpansion(game: Game) {
    updateGame({
      id: game._id,
      updates: { expansion: !game.expansion },
    });
    toast.success(`Game ${game.name} updated`);
  } */

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

  return (
    <>
      <Header showLocationSelector={false} />
      <div className="mx-2 lg:mx-20 my:2 lg:my-10">
        <div className="overflow-x-auto sm:rounded-lg">
          <Pagination
            page={page}
            limitPerPage={gamePerPage}
            itemsCount={gamesCount}
            totalPages={totalPages}
            handleClick={handleClick}
            handleLimitSelection={handleLimitSelection}
          ></Pagination>
          <div className="flex flex-col-reverse lg:flex-row justify-between gap-4 items-center mb-4">
            <div className="flex justify-end gap-4 items-center">
              <input
                type="text"
                id="table-search"
                className="block p-2 ml-4 pl-4 w-80 text-sm text-gray-900 rounded-lg border border-gray-300"
                placeholder="Search for games"
                value={textFilter}
                onChange={(event) => setTextFilter(event.target.value)}
              />
            </div>
            <div className="flex justify-end gap-4 items-center">
              <h1 className="text-md">Enable Edit Mode</h1>
              <CheckSwitch
                checked={editMode}
                onChange={() => setEditMode((value) => !value)}
                checkedBg="bg-red-500"
              ></CheckSwitch>
              <h1 className="text-md">Show Game Covers</h1>
              <CheckSwitch
                checked={showGameImages}
                onChange={() => setShowGameImages((value) => !value)}
              ></CheckSwitch>
              <button
                onClick={() => setIsAddGameDialogOpen(true)}
                className="py-2 bg-white transition duration-150 ease-in-out hover:border-gray-900 hover:text-gray-900 rounded border border-gray-800 text-gray-800 px-2 lg:px-6 text-sm"
              >
                Add New Game
              </button>
            </div>
          </div>
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className={`${showGameImages ? "block" : "hidden"} py-3 px-6`}
                >
                  Image
                </th>
                <th scope="col" className="py-3 px-6">
                  Name
                </th>
                {/* <th scope="col" className="py-3 px-6">
                  Expansion
                </th> */}
                <th scope="col" className="py-3 px-6">
                  Bahçeli
                </th>
                <th scope="col" className="py-3 px-6">
                  Neorama
                </th>
                <th scope="col" className="py-3 px-6">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredGames.map((game) => (
                <tr
                  key={game._id}
                  className="bg-w hite border-b hover:bg-gray-100"
                >
                  <td
                    className={`${
                      showGameImages ? "block" : "hidden"
                    } py-2 px-2 lg:px-6`}
                  >
                    <img src={game.thumbnail} alt={game.name} />
                  </td>
                  <td className="py-2 px-2 lg:px-6 font-medium text-gray-900 lg:whitespace-nowrap">
                    <EditableText
                      text={game.name}
                      onUpdate={updateGameHandler}
                      name="name"
                      item={game}
                    ></EditableText>
                  </td>
                  {/* <td className="py-2 px-6">
                    <CheckSwitch
                      checked={game.expansion}
                      onChange={() => handleSetExpansion(game)}
                    ></CheckSwitch>
                  </td> */}
                  <td className="py-2 px-2 lg:px-6">
                    {editMode ? (
                      <CheckSwitch
                        checked={game.locations?.includes(1)}
                        onChange={() => handleLocationUpdate(game, 1)}
                      ></CheckSwitch>
                    ) : game.locations?.includes(1) ? (
                      <div className="text-blue-500">Yes</div>
                    ) : (
                      <h2 className="text-red-500">No</h2>
                    )}
                  </td>
                  <td className="p-2 lg:px-6">
                    {editMode ? (
                      <CheckSwitch
                        checked={game.locations?.includes(2)}
                        onChange={() => handleLocationUpdate(game, 2)}
                      ></CheckSwitch>
                    ) : game.locations?.includes(2) ? (
                      <div className="text-blue-500 py-3">Yes</div>
                    ) : (
                      <h2 className="text-red-500 py-3">No</h2>
                    )}
                  </td>
                  <td className={`py-2 px-2 lg:px-6 ${!editMode && "hidden"}`}>
                    <button onClick={() => deleteGame(game._id)}>
                      <TrashIcon className="text-red-500 w-6 h-6" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {isAddGameDialogOpen && (
        <AddGameDialog
          isOpen={isAddGameDialogOpen}
          close={() => setIsAddGameDialogOpen(false)}
          createGame={createGame}
        />
      )}
    </>
  );
}
