import { Switch } from "@headlessui/react";
import { Input } from "@material-tailwind/react";
import { useEffect, useState } from "react";
import { User } from "../../types";
import { useGetGames } from "../../utils/api/game";
import {
  GameplayGroupFilter,
  useGetGameplaysGroups,
} from "../../utils/api/gameplay";
import { useGetAllUsers } from "../../utils/api/user";
import { Autocomplete } from "../common/Autocomplete";
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

export default function GameplaysByMentor() {
  const [gameplayGroupRows, setGameplayGroupRows] = useState<
    GameplayGroupRow[]
  >([]);
  const [filterData, setFilterData] = useState<GameplayGroupFilter>({
    groupBy: "mentor,game",
  });
  const [showInactiveUsers, setShowInactiveUsers] = useState(false);

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
          .map(({ secondary, total, _id }) => {
            const user = users.find((u) => u._id === _id);
            if (!showInactiveUsers && user && !user.active) {
              return null;
            }
            return {
              mentor: user?.name || `${_id}`,
              total,
              secondary,
              open: false,
            };
          })
          .filter((row) => row !== null)
          .filter((row) => !mentorFilter || row?.mentor === mentorFilter.name);
        const nonNullFormattedData: GameplayGroupRow[] =
          formattedData as GameplayGroupRow[];
        nonNullFormattedData.sort((a, b) => b.total - a.total);
        return nonNullFormattedData;
      });
    }
  }, [data, users, mentorFilter, showInactiveUsers]);

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
      <div className="w-[95%] flex flex-col gap-8 px-4 py-4 border border-gray-200 rounded-lg bg-white shadow-sm mx-auto __className_a182b8  ">
        <div className="mb-5 rounded-tl-lg rounded-tr-lg">
          <div className="flex items-center justify-between mb-4">
            <p className="text-base lg:text-2xl font-medium leading-normal text-gray-800">
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
                  suggestions={
                    showInactiveUsers
                      ? users
                      : users.filter((user) => user.active)
                  }
                  handleSelection={handleMentorSelection}
                  showSelected
                />
              </div>
              {/* show inactive users filter */}
              <div className="ml-auto mt-4 flex flex-row gap-2 justify-between items-center">
                <p>Show Inactive Users</p>
                <Switch
                  checked={showInactiveUsers}
                  onChange={() => setShowInactiveUsers((value) => !value)}
                  className={`${
                    showInactiveUsers ? "bg-green-500" : "bg-red-500"
                  }
          relative inline-flex h-[20px] w-[36px] min-w-[36px] border-[1px] cursor-pointer rounded-full border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
                >
                  <span
                    aria-hidden="true"
                    className={`${
                      showInactiveUsers ? "translate-x-4" : "translate-x-0"
                    }
            pointer-events-none inline-block h-[18px] w-[18px] transform rounded-full bg-white transition duration-200 ease-in-out`}
                  />
                </Switch>
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
    </>
  );
}
