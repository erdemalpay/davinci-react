import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";

import { useEffect, useState } from "react";
import { Autocomplete } from "../components/common/Autocomplete";
import { Input } from "../components/common/DInput";
import { Header } from "../components/header/Header";
import { Game, User } from "../types";
import { useGetGames } from "../utils/api/game";
import { GameplayFilter, useGetGameplays } from "../utils/api/gameplay";
import { useGetUsers } from "../utils/api/user";

interface GameplayRow {
  _id: number;
  game: string;
  mentor: string;
  playerCount: number;
  date: string;
}

export default function Gameplays() {
  const [gameplays, setGameplays] = useState<GameplayRow[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [filterData, setFilterData] = useState<GameplayFilter>({
    limit: 10,
    page: 1,
  });

  const { data } = useGetGameplays(filterData);
  const games = useGetGames();
  const users = useGetUsers();

  useEffect(() => {
    if (data) {
      const { items, totalCount } = data;
      setGameplays(
        items.map((gameplay) => ({
          _id: gameplay?._id || 0,
          game: (gameplay?.game as Game)?.name,
          mentor: gameplay?.mentor?.name,
          playerCount: gameplay?.playerCount,
          date: gameplay?.date,
        }))
      );
      setTotalItems(totalCount);
    }
  }, [data]);

  const columns = [
    {
      id: "game",
      header: "Game",
      cell: (row: GameplayRow) => row.game,
    },
    {
      id: "mentor",
      header: "Game Mentor",
      cell: (row: GameplayRow) => row.mentor,
    },
    {
      id: "playerCount",
      header: "Player Count",
      cell: (row: GameplayRow) => row.playerCount,
    },
    {
      id: "date",
      header: "Date",
      cell: (row: GameplayRow) => row.date,
    },
  ];

  function handleMentorSelection(mentor: User) {
    if (!mentor) {
      setFilterData({ ...filterData, mentor: undefined, page: 1 });
    } else {
      setFilterData({ ...filterData, mentor: mentor._id, page: 1 });
    }
  }

  function handleGameSelection(game: Game) {
    setFilterData({ ...filterData, game: game?._id, page: 1 });
  }

  function handleStartDateSelection(event: React.FormEvent<HTMLInputElement>) {
    setFilterData({
      ...filterData,
      startDate: (event.target as HTMLInputElement).value,
      page: 1,
    });
  }

  function handleEndDateSelection(event: React.FormEvent<HTMLInputElement>) {
    setFilterData({
      ...filterData,
      endDate: (event.target as HTMLInputElement).value,
      page: 1,
    });
  }

  function handleLimitSelection(value: number) {
    setFilterData({
      ...filterData,
      limit: value,
    });
  }

  function handlePageChange(value: number) {
    const newPage = filterData.page + value;
    if (newPage > 0 && newPage <= Math.ceil(totalItems / filterData.limit)) {
      setFilterData({
        ...filterData,
        page: newPage,
      });
    }
  }

  function handleSort(value: string) {
    if (filterData.sort === value) {
      if (filterData.asc === 1) {
        // if sorted ascending, convert to descending
        setFilterData({
          ...filterData,
          asc: -1,
        });
      } else {
        // if sorted descending remove sort
        setFilterData({
          ...filterData,
          asc: undefined,
          sort: undefined,
        });
      }
    } else {
      // if not sorted by this field, sort it by this field
      setFilterData({
        ...filterData,
        asc: 1,
        sort: value,
      });
    }
  }

  return (
    <>
      <Header showLocationSelector={false} />

      <div className="flex flex-col gap-4 mx-0 lg:mx-20">
        {/* Query part */}
        <div className="bg-white shadow w-full px-6 py-5 mt-4">
          <div className="mb-5 rounded-tl-lg rounded-tr-lg">
            <div className="flex items-center justify-between mb-4">
              <p className="text-base lg:text-2xl font-bold leading-normal text-gray-800">
                Gameplays
              </p>
            </div>
            <div className="flex items-center mt-4 sm:mt-0">
              <div className="flex flex-col w-full">
                <div className="flex flex-col lg:flex-row justify-between w-full gap-x-4">
                  <Autocomplete
                    name="mentor"
                    label="Game Mentor"
                    suggestions={users}
                    handleSelection={handleMentorSelection}
                    showSelected
                  />
                  <Autocomplete
                    name="game"
                    label="Game"
                    suggestions={games}
                    handleSelection={handleGameSelection}
                    showSelected
                  />
                </div>
                <div className="flex flex-col lg:flex-row gap-2 mt-4">
                  <Input
                    variant="standard"
                    name="startDay"
                    label="After"
                    type="date"
                    onChange={handleStartDateSelection}
                  />
                  <Input
                    variant="standard"
                    name="endDay"
                    label="Before"
                    type="date"
                    onChange={handleEndDateSelection}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="">
            <div className="w-full overflow-x-auto">
              <div className="flex flex-row justify-between w-full mt-2 gap-4">
                <span className="flex items-center justify-end">
                  {"Rows per page:"}
                  <select
                    onChange={(value) =>
                      handleLimitSelection(
                        value.target.value as unknown as number
                      )
                    }
                    className="py-2 border-b-[1px] border-b-grey-300 focus:outline-none text-sm"
                    value={filterData?.limit}
                  >
                    <option value={10}>10</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </span>
                <span className="flex justify-end text-base items-center">
                  <button className="focus:outline-none">
                    <ChevronLeftIcon
                      className="h-6 w-6"
                      onClick={() => handlePageChange(-1)}
                    />
                  </button>

                  {`Page: ${filterData.page} of ${Math.ceil(
                    totalItems / filterData.limit
                  )}`}
                  <button className="focus:outline-none">
                    <ChevronRightIcon
                      className="h-6 w-6"
                      onClick={() => handlePageChange(1)}
                    />
                  </button>
                </span>
                <span className="hidden lg:flex items-center">
                  Showing: {((filterData.page || 1) - 1) * filterData.limit + 1}{" "}
                  -{" "}
                  {((filterData.page || 1) - 1) * filterData.limit +
                    gameplays.length}
                  {" of "}
                  {totalItems}
                </span>
              </div>
              <table className="w-full whitespace-nowrap">
                <thead>
                  <tr className="h-10 w-full text-sm leading-none text-gray-600">
                    {columns.map((column) => (
                      <th
                        key={column.id}
                        className="font-bold text-left cursor-pointer"
                        onClick={() => handleSort(column.id)}
                      >
                        <div className="flex gap-x-2">
                          {column.header}
                          {filterData.sort === column.id &&
                            (filterData.asc === 1 ? (
                              <ArrowUpIcon className="h-4 w-4" />
                            ) : (
                              <ArrowDownIcon className="h-4 w-4" />
                            ))}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="w-full">
                  {gameplays.map((gameplay) => (
                    <tr
                      key={gameplay._id}
                      className="h-10 text-sm leading-none text-gray-700 border-b border-t border-gray-200 bg-white hover:bg-gray-100"
                    >
                      {columns.map((column) => {
                        return (
                          <td key={column.id} className="">
                            {column.cell(gameplay)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
