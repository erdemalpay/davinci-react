import { ArrowDownIcon, ArrowUpIcon } from "@heroicons/react/24/outline";
import { Input } from "@material-tailwind/react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Autocomplete } from "../components/common/Autocomplete";
import { GenericButton } from "../components/common/GenericButton";
import { Header } from "../components/header/Header";
import GenericTable from "../components/panelComponents/Tables/GenericTable";
import { Caption, H5 } from "../components/panelComponents/Typography";
import { Game, Location, RowPerPageEnum, User } from "../types";
import { useGetGames } from "../utils/api/game";
import { GameplayFilter, useGetGameplays } from "../utils/api/gameplay";
import { useGetStoreLocations } from "../utils/api/location";
import { useGetUsers } from "../utils/api/user";
import { formatAsLocalDate } from "../utils/format";

interface GameplayRow {
  _id: number;
  game: string;
  mentor: string;
  playerCount: number;
  startHour: string;
  finishHour: string;
  locationName: string;
  date: string;
}

export default function NewGameplays() {
  const { t } = useTranslation();
  const [gameplays, setGameplays] = useState<GameplayRow[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [filterData, setFilterData] = useState<GameplayFilter>({
    limit: 10,
    page: 1,
  });
  const [tableKey, setTableKey] = useState(0);
  const { data } = useGetGameplays(filterData);
  const games = useGetGames();
  const locations = useGetStoreLocations();
  const users = useGetUsers();
  const columns = [
    {
      key: t("Game"),
      isSortable: false,
      node: () => (
        <th
          key="game"
          className="font-bold text-left cursor-pointer"
          onClick={() => handleSort("game")}
        >
          <div className="flex gap-x-2 pl-3  items-center py-3  min-w-8">
            <H5>{t("Game")}</H5>
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
      key: t("Game Mentor"),
      isSortable: false,
      node: () => (
        <th
          key="Game Mentor"
          className="font-bold text-left cursor-pointer"
          onClick={() => handleSort("mentor")}
        >
          <div className="flex gap-x-2   items-center py-3  min-w-8">
            <H5>{t("Game Mentor")}</H5>
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
      key: t("Player Count"),
      isSortable: false,
      node: () => (
        <th
          key="Player Count"
          className="font-bold text-left cursor-pointer"
          onClick={() => handleSort("playerCount")}
        >
          <div className="flex gap-x-2   items-center py-3  min-w-8">
            <H5>{t("Player Count")}</H5>
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
      key: t("Location"),
      isSortable: false,
      node: () => (
        <th
          key="location"
          className="font-bold text-left cursor-pointer"
          onClick={() => handleSort("location")}
        >
          <div className="flex gap-x-2 pl-3  items-center py-3  min-w-8">
            <H5>{t("Location")}</H5>
            {filterData.sort === "location" &&
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
      key: t("Start Hour"),
      isSortable: false,
      node: () => (
        <th
          key="startHour"
          className="font-bold text-left cursor-pointer"
          onClick={() => handleSort("startHour")}
        >
          <div className="flex gap-x-2   items-center py-3  min-w-8">
            <H5>{t("Start Hour")}</H5>
            {filterData.sort === "startHour" &&
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
      key: t("Finish Hour"),
      isSortable: false,
      node: () => (
        <th
          key="finishHour"
          className="font-bold text-left cursor-pointer"
          onClick={() => handleSort("finishHour")}
        >
          <div className="flex gap-x-2   items-center py-3  min-w-8">
            <H5>{t("Finish Hour")}</H5>
            {filterData.sort === "finishHour" &&
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
      key: t("Date"),
      isSortable: false,
      node: () => (
        <th
          key="Date"
          className="font-bold text-left cursor-pointer"
          onClick={() => handleSort("date")}
        >
          <div className="flex gap-x-2   items-center py-3  min-w-8">
            <H5>{t("Date")}</H5>
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
    { key: "locationName" },
    { key: "startHour" },
    { key: "finishHour" },
    {
      key: "date",
      className: "min-w-32",
      node: (row: GameplayRow) => {
        return formatAsLocalDate(row.date);
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
  function handleLocationSelection(location: Location) {
    setFilterData({ ...filterData, location: location?._id, page: 1 });
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
  useEffect(() => {
    if (data) {
      const { items, totalCount } = data;
      setGameplays(
        items.map((gameplay) => ({
          _id: gameplay?._id || 0,
          game: (gameplay?.game as Game)?.name,
          mentor: gameplay?.mentor?.name,
          playerCount: gameplay?.playerCount,
          locationName: gameplay?.location === 1 ? "Bahceli" : "Neorama",
          startHour: gameplay?.startHour || "",
          finishHour: gameplay?.finishHour || "",
          date: gameplay?.date,
        }))
      );
      setTotalItems(totalCount);
    }
    setTableKey((prev) => prev + 1);
  }, [data]);
  return (
    <>
      <Header showLocationSelector={false} />
      <div className="w-[98%] mx-auto my-10 ">
        <div className="flex flex-col w-full mb-6">
          <div className="flex flex-col lg:flex-row justify-between w-full gap-x-4">
            <Autocomplete
              name="mentor"
              label={t("Game Mentor")}
              suggestions={users}
              handleSelection={handleMentorSelection}
              showSelected
            />
            <Autocomplete
              name="game"
              label={t("Game")}
              suggestions={games}
              handleSelection={handleGameSelection}
              showSelected
            />
          </div>
          <div className="flex flex-col lg:flex-row gap-2 mt-4">
            <Autocomplete
              name="location"
              label={t("Location")}
              suggestions={locations}
              handleSelection={handleLocationSelection}
              showSelected
            />
            <Input
              variant="standard"
              name="startDay"
              label={t("After")}
              type="date"
              onChange={handleStartDateSelection}
            />
            <Input
              variant="standard"
              name="endDay"
              label={t("Before")}
              type="date"
              onChange={handleEndDateSelection}
            />
          </div>
        </div>
        <GenericTable
          key={tableKey}
          rows={gameplays}
          rowKeys={rowKeys}
          isActionsActive={false}
          columns={columns}
          title={t("GamePlays")}
          isSearch={false}
          isRowsPerPage={false}
          isPagination={false}
        />
        <div className="ml-auto flex flex-row justify-between w-fit mt-2 gap-4 __className_a182b8">
          {/* rows per page */}
          <div className="flex flex-row gap-2 px-6 items-center">
            <Caption>{t("Rows per page")}:</Caption>
            <select
              className=" rounded-md py-2 flex items-center focus:outline-none h-8 text-xs cursor-pointer"
              value={filterData?.limit}
              onChange={(value) =>
                handleLimitSelection(value.target.value as unknown as number)
              }
            >
              <option value={RowPerPageEnum.FIRST}>
                {RowPerPageEnum.FIRST}
              </option>
              <option value={RowPerPageEnum.SECOND}>
                {RowPerPageEnum.SECOND}
              </option>
              <option value={RowPerPageEnum.THIRD}>
                {RowPerPageEnum.THIRD}
              </option>
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
              <GenericButton
                onClick={() => handlePageChange(-1)}
                variant="ghost"
              >
                {"<"}
              </GenericButton>
              <GenericButton
                onClick={() => handlePageChange(1)}
                variant="ghost"
              >
                {">"}
              </GenericButton>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
