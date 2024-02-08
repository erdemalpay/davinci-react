import { Input, Tooltip } from "@material-tailwind/react";
import { useEffect, useState } from "react";
import { Autocomplete } from "../components/common/Autocomplete";
import SelectInput from "../components/common/SelectInput";
import { Header } from "../components/header/Header";
import { Game } from "../types";
import { useGetGames } from "../utils/api/game";
import {
  GameplayGroupFilter,
  useGetGamePlaysGroupByLocation,
  useGetGameplaysGroups,
} from "../utils/api/gameplay";
import { useGetAllUsers } from "../utils/api/user";

interface SecondGroupRow {
  field: string;
  count: number;
}

interface GameplayGroupRow {
  game: string;
  total: number;
  secondary: SecondGroupRow[];
  open: boolean;
}
const locationOptions = [
  { value: "0", label: "All" },
  { value: "1", label: "Bahçeli" },
  { value: "2", label: "Neorama" },
];

export default function Gameplays() {
  const [gameplayGroupRows, setGameplayGroupRows] = useState<
    GameplayGroupRow[]
  >([]);
  const [locationFilter, setLocationFilter] = useState<number>(0);
  const [filterData, setFilterData] = useState<GameplayGroupFilter>({
    groupBy: "game,mentor",
  });

  const [gameFilter, setGameFilter] = useState<Game | null>();

  const { data } = useGetGameplaysGroups(filterData);
  const gameplaysWithLocation = useGetGamePlaysGroupByLocation().data;
  const games = useGetGames();
  const users = useGetAllUsers();

  function updateRows(row: GameplayGroupRow) {
    setGameplayGroupRows((rows) => {
      const newRows = rows.map((item) => {
        let obj: GameplayGroupRow = item;
        if (item.game === row.game) {
          obj = { ...item, open: !item.open };
        }
        return obj;
      });
      // newRows.sort((a, b) => Number(b.total) - Number(a.total));
      return newRows;
    });
  }

  useEffect(() => {
    if (data) {
      setGameplayGroupRows(() => {
        const formattedData =
          locationFilter === 0
            ? data
                .map(({ secondary, total, _id }) => ({
                  game:
                    games.find((game) => String(game._id) === String(_id))
                      ?.name || `${_id}`,
                  total,
                  secondary,
                  open: false,
                }))
                .filter((row) => row.game === gameFilter?.name || !gameFilter)
            : gameplaysWithLocation
            ? gameplaysWithLocation
                .filter((row) => row.location === locationFilter)
                .map(({ secondary, total, _id }) => ({
                  game:
                    games.find((game) => String(game._id) === String(_id))
                      ?.name || `${_id}`,
                  total,
                  secondary,
                  open: false,
                }))
                .filter((row) => row.game === gameFilter?.name || !gameFilter)
            : [];

        formattedData.sort((a, b) => Number(b.total) - Number(a.total));
        return formattedData;
      });
    }
  }, [data, games, filterData, gameFilter, locationFilter]);

  const columns = [
    {
      id: "game",
      header: "Game",
      cell: (row: GameplayGroupRow) => (
        <Tooltip
          content={`${row.game} (${
            row.open ? row.secondary.length : row.total
          })`}
        >
          <button className="truncate w-48 text-left">{`${row.game} (${
            row.open ? row.secondary.length : row.total
          })`}</button>
        </Tooltip>
      ),
    },
    {
      id: "mentor",
      header: "Mentor",
      cell: (row: GameplayGroupRow) => {
        if (row.open) {
          return (
            <table className="min-w-full divide-y divide-gray-200">
              <tbody className="bg-white divide-y divide-gray-200">
                {row.secondary.map((second, index) => {
                  const user = users.find((u) => u._id === second.field);
                  return (
                    <div
                      className={`pl-4 text-sm text-gray-600 text-center ${
                        index % 2 === 1 ? "bg-gray-100" : ""
                      }`}
                      key={second.field}
                    >
                      <tr className="w-full">
                        {user?.name || second.field} ({second.count})
                      </tr>
                    </div>
                  );
                })}
              </tbody>
            </table>
          );
        }
      },
    },
  ];

  function handleStartDateSelection(event: React.FormEvent<HTMLInputElement>) {
    setFilterData({
      ...filterData,
      startDate: (event.target as HTMLInputElement).value,
    });
  }

  function handleEndDateSelection(event: React.FormEvent<HTMLInputElement>) {
    setFilterData({
      ...filterData,
      endDate: (event.target as HTMLInputElement).value,
    });
  }

  function handleGameSelection(game: Game) {
    setGameFilter(game);
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
                Gameplays by Games
              </p>
            </div>
            <div className="flex items-center mt-4 sm:mt-0">
              <div className="flex flex-col w-full">
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
                <div className="mt-2">
                  <Autocomplete
                    name="game"
                    label="Game"
                    suggestions={games}
                    handleSelection={handleGameSelection}
                    showSelected
                  />
                </div>
                <SelectInput
                  label="Location"
                  options={locationOptions}
                  value={
                    locationOptions.find(
                      (option) => option.value === locationFilter.toString()
                    ) || null
                  }
                  onChange={(selectedOption) => {
                    setLocationFilter(Number(selectedOption?.value || "0"));
                  }}
                  placeholder="Select a location"
                />
              </div>
            </div>
          </div>
          <div className="">
            <div className="w-full overflow-x-auto">
              <table className="w-full whitespace-nowrap">
                <thead>
                  <tr className="h-10 w-full text-sm leading-none text-gray-600">
                    {columns.map((column) => (
                      <th
                        key={column.id}
                        className="font-bold text-left cursor-pointer w-3/4"
                      >
                        <div className="flex gap-x-2">{column.header}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="w-full">
                  {gameplayGroupRows.map((row) => (
                    <tr
                      key={row.game}
                      className="h-10 text-sm leading-none text-gray-700 border-b border-t border-gray-200 bg-white hover:bg-gray-100"
                    >
                      {columns.map((column) => {
                        return (
                          <td key={column.id} onClick={() => updateRows(row)}>
                            {column.cell(row)}
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
