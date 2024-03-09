import { ArrowDownIcon, ArrowUpIcon } from "@heroicons/react/24/outline";
import { Input } from "@material-tailwind/react";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { Autocomplete } from "../components/common/Autocomplete";
import { Header } from "../components/header/Header";
import GenericTable from "../components/panelComponents/Tables/GenericTable";
import { Caption, H5 } from "../components/panelComponents/Typography";
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

export default function NewGameplays() {
  const [gameplays, setGameplays] = useState<GameplayRow[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [filterData, setFilterData] = useState<GameplayFilter>({
    limit: 10,
    page: 1,
  });
  const [tableKey, setTableKey] = useState(0);
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
    setTableKey((prev) => prev + 1);
  }, [data]);

  const columns = [
    {
      key: "Game",
      isSortable: false,
      node: () => (
        <th
          className="font-bold text-left cursor-pointer"
          onClick={() => handleSort("game")}
        >
          <div className="flex gap-x-2 pl-3  items-center py-3  min-w-8">
            <H5>Game</H5>
            {filterData.sort === "game" &&
              (filterData.asc === 1 ? (
                <ArrowUpIcon className="h-4 w-4 my-auto" />
              ) : (
                <ArrowDownIcon className="h-4 w-4 my-auto" />
              ))}
          </div>
        </th>
      ),
    },
    {
      key: "Game Mentor",
      isSortable: false,
      node: () => (
        <th
          className="font-bold text-left cursor-pointer"
          onClick={() => handleSort("mentor")}
        >
          <div className="flex gap-x-2   items-center py-3  min-w-8">
            <H5>Game Mentor</H5>
            {filterData.sort === "mentor" &&
              (filterData.asc === 1 ? (
                <ArrowUpIcon className="h-4 w-4 my-auto" />
              ) : (
                <ArrowDownIcon className="h-4 w-4 my-auto" />
              ))}
          </div>
        </th>
      ),
    },
    {
      key: "Player Count",
      isSortable: false,
      node: () => (
        <th
          className="font-bold text-left cursor-pointer"
          onClick={() => handleSort("playerCount")}
        >
          <div className="flex gap-x-2   items-center py-3  min-w-8">
            <H5>Player Count</H5>
            {filterData.sort === "playerCount" &&
              (filterData.asc === 1 ? (
                <ArrowUpIcon className="h-4 w-4 my-auto" />
              ) : (
                <ArrowDownIcon className="h-4 w-4 my-auto" />
              ))}
          </div>
        </th>
      ),
    },
    {
      key: "Date",
      isSortable: false,
      node: () => (
        <th
          className="font-bold text-left cursor-pointer"
          onClick={() => handleSort("date")}
        >
          <div className="flex gap-x-2   items-center py-3  min-w-8">
            <H5>Date</H5>
            {filterData.sort === "date" &&
              (filterData.asc === 1 ? (
                <ArrowUpIcon className="h-4 w-4 my-auto" />
              ) : (
                <ArrowDownIcon className="h-4 w-4 my-auto" />
              ))}
          </div>
        </th>
      ),
    },
  ];
  const rowKeys = [
    {
      key: "game",
      className: "min-w-32 pr-1",
    },
    {
      key: "mentor",
      className: "min-w-20 pr-1",
    },
    { key: "playerCount" },
    {
      key: "date",
      className: "min-w-32",
      node: (row: GameplayRow) => {
        return format(new Date(row.date), "dd-MM-yyyy");
      },
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
      <div className="w-[90%] mx-auto my-10 ">
        <div className="flex flex-col w-full mb-6">
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
        <GenericTable
          key={tableKey}
          rows={gameplays}
          rowKeys={rowKeys}
          actions={[]}
          columns={columns}
          title="GamePlays"
          isSearch={false}
          isRowsPerPage={false}
          isPagination={false}
        />
        <div className="ml-auto flex flex-row justify-between w-fit mt-2 gap-4 __className_a182b8">
          {/* rows per page */}
          <div className="flex flex-row gap-2 px-6 items-center">
            <Caption>Rows per page:</Caption>
            <select
              className=" rounded-md py-2 flex items-center focus:outline-none h-8 text-xs cursor-pointer"
              value={filterData?.limit}
              onChange={(value) =>
                handleLimitSelection(value.target.value as unknown as number)
              }
            >
              <option value={10}>10</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
          {/* pagination */}
          <div className=" flex flex-row gap-2 items-center">
            <Caption>
              {((filterData.page || 1) - 1) * filterData.limit + 1} -{" "}
              {((filterData.page || 1) - 1) * filterData.limit +
                gameplays.length}
              {" of "}
              {totalItems}
            </Caption>
            <div className="flex flex-row gap-4">
              <button
                onClick={() => handlePageChange(-1)}
                className="cursor-pointer"
              >
                {"<"}
              </button>
              <button
                onClick={() => handlePageChange(1)}
                className="cursor-pointer"
              >
                {">"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
