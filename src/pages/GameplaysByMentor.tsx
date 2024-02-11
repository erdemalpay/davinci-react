import { Input } from "@material-tailwind/react";
import { useEffect, useState } from "react";
import { Autocomplete } from "../components/common/Autocomplete";
import { Header } from "../components/header/Header";
import { User } from "../types";
import { useGetGames } from "../utils/api/game";
import {
  GameplayGroupFilter,
  useGetGameplaysGroups,
} from "../utils/api/gameplay";
import { useGetAllUsers } from "../utils/api/user";

export interface SecondGroupRow {
  field: string;
  count: number;
}

export interface GameplayGroupRow {
  mentor: string;
  total: number;
  secondary: SecondGroupRow[];
  open: boolean;
}

export default function Gameplays() {
  const [gameplayGroupRows, setGameplayGroupRows] = useState<
    GameplayGroupRow[]
  >([]);
  const [filterData, setFilterData] = useState<GameplayGroupFilter>({
    groupBy: "mentor,game",
  });

  const [mentorFilter, setMentorFilter] = useState<User | null>();

  const { data } = useGetGameplaysGroups(filterData);
  const games = useGetGames();
  const users = useGetAllUsers();

  function updateRows(row: GameplayGroupRow) {
    setGameplayGroupRows((rows) => {
      const newRows = rows.map((item) => {
        let obj: GameplayGroupRow = item;
        if (item.mentor === row.mentor) {
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
        const formattedData = data
          .map(({ secondary, total, _id }) => ({
            mentor: users.find((u) => u._id === _id)?.name || `${_id}`,
            total,
            secondary,
            open: false,
          }))
          .filter((row) => row.mentor === mentorFilter?.name || !mentorFilter);

        formattedData.sort((a, b) => Number(b.total) - Number(a.total));
        return formattedData;
      });
    }
  }, [data, games, filterData, mentorFilter]);

  const columns = [
    {
      id: "game",
      header: "Game",
      cell: (row: GameplayGroupRow) => (
        <button className="truncate w-full text-left">{`${row.mentor} (${row.secondary.length}/${row.total})`}</button>
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
                {row?.secondary.map((second, index) => {
                  const game = games.find(
                    (game) => String(game._id) === String(second.field)
                  );
                  return (
                    <div
                      className={`pl-4 text-sm text-gray-600 text-center ${
                        index % 2 === 1 ? "bg-gray-100" : ""
                      }`}
                      key={second.field}
                    >
                      <tr className="w-full">
                        {game?.name || second.field} ({second.count})
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

  function handleMentorSelection(mentor: User) {
    setMentorFilter(mentor);
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
                Gameplays by Mentors
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
                    name="mentor"
                    label="Mentor"
                    suggestions={users}
                    handleSelection={handleMentorSelection}
                    showSelected
                  />
                </div>
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
                        className="font-bold text-left cursor-pointer w-1/2"
                      >
                        <div className="flex gap-x-2">{column.header}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="w-full">
                  {gameplayGroupRows.map((row) => (
                    <tr
                      key={row.mentor}
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
