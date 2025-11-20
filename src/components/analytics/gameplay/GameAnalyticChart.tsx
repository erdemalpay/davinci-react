import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Paths } from "../../../utils/api/factory";
import { useGetGames } from "../../../utils/api/game";
import { useGetGameplayAnalytics } from "../../../utils/api/gameplay";
import { useGetUsersMinimal } from "../../../utils/api/user";
import { colors } from "../../../utils/color";
import { DateFilter, getStartEndDates } from "../../../utils/dateUtil";
import { EditableText } from "../../common/EditableText";
import { InputWithLabel } from "../../common/InputWithLabel";

export interface GameCount {
  name: string;
  count: number;
}

export function GameAnalyticChart() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const games = useGetGames();
  const [dateFilter, setDateFilter] = useState(DateFilter.SINGLE_DAY);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string | undefined>("");
  const [location, setLocation] = useState<string>("1,2");
  const [mentor, setMentor] = useState<string>("");
  const [itemLimit, setItemLimit] = useState(5);
  const users = useGetUsersMinimal();

  const { data: gameAnalytics } = useGetGameplayAnalytics(
    "game",
    itemLimit,
    startDate,
    location,
    endDate,
    mentor
  );

  const [gameData, setGameData] = useState<GameCount[]>([]);

  useEffect(() => {
    if (!gameAnalytics) return;
    if (!games?.length) return;
    const data = gameAnalytics.map((gameplayAnalytic) => {
      const game = games.find((game) => game._id === gameplayAnalytic._id);
      return {
        name: game ? game.name : gameplayAnalytic._id,
        count: gameplayAnalytic.playCount,
      } as GameCount;
    });
    data.sort((a, b) => b.count - a.count);
    setGameData(data);
  }, [gameAnalytics, games]);

  useEffect(() => {
    if (dateFilter === DateFilter.MANUAL) return;
    const { startDate, endDate } = getStartEndDates(dateFilter);
    setStartDate(startDate);
    setEndDate(endDate);
  }, [dateFilter]);

  useEffect(() => {
    queryClient.invalidateQueries([Paths.Gameplays, "query"]);
  }, [startDate, endDate, itemLimit, queryClient]);

  return (
    <div className="p-4 pb-[200px] w-auto lg:w-1/2 border-2 h-[140%]">
      <h1 className="text-xl mb-4">Gameplay By Games</h1>
      <div className="flex flex-col w-1/2 mb-4">
        <label className="flex items-center text-xs">Date Filter:</label>
        <select
          onChange={(value) => setDateFilter(value.target.value as DateFilter)}
          className="py-2 border-b-[1px] border-b-grey-300 focus:outline-none text-sm"
          value={dateFilter}
        >
          <option value="1">{t("Single Day")}</option>
          <option value="2">{t("This Week")}</option>
          <option value="3">{t("Last Week")}</option>
          <option value="4">{t("This Month")}</option>
          <option value="5">{t("Last Month")}</option>
          <option value="0">{t("Manual")}</option>
        </select>
      </div>
      <div className="flex gap-2 w-full mb-4">
        <InputWithLabel
          type="date"
          name="Start Date"
          label={t("Start Date")}
          value={startDate}
          onChange={(event) => {
            setStartDate((event.target as HTMLInputElement).value);
            if (dateFilter === DateFilter.SINGLE_DAY) {
              setEndDate((event.target as HTMLInputElement).value);
            } else {
              setDateFilter(DateFilter.MANUAL);
            }
          }}
        />
        <InputWithLabel
          type="date"
          name="End Date"
          label={t("End Date")}
          value={endDate}
          onChange={(event) => {
            setEndDate((event.target as HTMLInputElement).value);
            setDateFilter(DateFilter.MANUAL);
          }}
          hidden={!endDate || dateFilter === DateFilter.SINGLE_DAY}
        />
      </div>
      <div className="flex w-full justify-between gap-2">
        <div className="flex flex-col w-1/2">
          <label className="flex items-center text-xs ">{t("Location")}:</label>
          <select
            onChange={(value) => setLocation(value.target.value)}
            className="py-2 border-b-[1px] border-b-grey-300 focus:outline-none text-sm"
            value={location}
          >
            <option value="1,2">{t("All")}</option>
            <option value="1">Bahçeli</option>
            <option value="2">Neorama</option>
          </select>
        </div>
        <div className="flex flex-col w-1/2">
          <label className="flex items-center text-xs ">{t("Mentor")}:</label>
          <select
            onChange={(value) => setMentor(value.target.value)}
            className="py-2 border-b-[1px] border-b-grey-300 focus:outline-none text-sm"
            value={mentor}
          >
            <option value="">{t("All")}</option>
            {users?.map((mentor) => (
              <option key={mentor._id} value={mentor._id}>
                {mentor.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col w-1/2">
          <label className="flex items-center text-xs">
            {t("Number of items")}:
          </label>
          <EditableText
            name="name"
            type="number"
            text={itemLimit.toString()}
            onUpdate={(event) =>
              setItemLimit(Number((event.target as HTMLInputElement).value))
            }
            item={itemLimit}
            inactiveStyle="border-b-[1px]"
          />
        </div>
      </div>
      {gameData?.length ? (
        <ResponsiveContainer className={"w-[600px] h-[400px]"}>
          <BarChart
            data={gameData}
            margin={{
              top: 50,
              right: 30,
              left: 20,
              bottom: 100,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-30} textAnchor="end" interval={0} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#8884d8" label={{ position: "top" }}>
              {gameData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % 10]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex w-full h-2/3 justify-center items-center border-2 mt-4">
          <h1>{t("No Data Available")}</h1>
        </div>
      )}
    </div>
  );
}
