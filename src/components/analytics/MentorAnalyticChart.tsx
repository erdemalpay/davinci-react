import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
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
import { Paths } from "../../utils/api/factory";
import { useGetGameplayAnalytics } from "../../utils/api/gameplay";
import { useGetUsers } from "../../utils/api/user";
import { colors } from "../../utils/color";
import { DateFilter, getStartEndDates } from "../../utils/dateUtil";
import { EditableText } from "../common/EditableText";
import { InputWithLabel } from "../common/InputWithLabel";

export interface GameCount {
  name: string;
  count: number;
}

export interface ChartProps {
  unique?: boolean;
  dateFilter: DateFilter;
  setDateFilter: (dateFilter: DateFilter) => void;
  startDate: string;
  setStartDate: (startDate: string) => void;
  endDate: string | undefined;
  setEndDate: (endDate: string | undefined) => void;
  location: string;
  setLocation: (location: string) => void;
  itemLimit: number;
  setItemLimit: (itemLimit: number) => void;
}

export function MentorAnalyticChart({
  unique = false,
  dateFilter,
  setDateFilter,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  location,
  setLocation,
  itemLimit,
  setItemLimit,
}: ChartProps) {
  const queryClient = useQueryClient();

  const { data: gameAnalytics } = useGetGameplayAnalytics(
    "mentor",
    itemLimit,
    startDate,
    location,
    endDate
  );
  const users = useGetUsers();
  const [mentorData, setMentorData] = useState<GameCount[]>([]);

  useEffect(() => {
    if (!gameAnalytics) return;
    if (!users?.length) return;
    const data = gameAnalytics.map((gameplayAnalytic) => {
      const game = users.find((user) => user._id === gameplayAnalytic._id);
      return {
        name: game ? game.name : gameplayAnalytic._id,
        count: unique
          ? gameplayAnalytic.uniqueCount
          : gameplayAnalytic.playCount,
      } as GameCount;
    });
    data.sort((a, b) => b.count - a.count);
    setMentorData(data);
  }, [gameAnalytics, users]);

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
    <div className="w-[90%] flex flex-col gap-8 px-4 py-4 border border-gray-200 rounded-lg bg-white shadow-sm mx-auto __className_a182b8  h-screen">
      <h1 className="text-xl mb-4">
        {unique ? "Unique " : ""}Gameplay By Game Mentors
      </h1>

      <div className="flex flex-col w-1/2 mb-4">
        <label className="flex items-center text-xs">Date Filter:</label>
        <select
          onChange={(value) => setDateFilter(value.target.value as DateFilter)}
          className="py-2 border-b-[1px] border-b-grey-300 focus:outline-none text-sm"
          value={dateFilter}
        >
          <option value="1">Single Day</option>
          <option value="2">This Week</option>
          <option value="3">Last Week</option>
          <option value="4">This Month</option>
          <option value="5">Last Month</option>
          <option value="0">Manual</option>
        </select>
      </div>
      <div className="flex gap-2 w-full mb-4">
        <InputWithLabel
          type="date"
          name="Start Date"
          label="Start Date"
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
          label="End Date"
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
          <label className="flex items-center text-xs ">Location:</label>
          <select
            onChange={(value) => setLocation(value.target.value)}
            className="py-2 border-b-[1px] border-b-grey-300 focus:outline-none text-sm"
            defaultValue="Canada"
          >
            <option value="1,2">All</option>
            <option value="1">Bahçeli</option>
            <option value="2">Neorama</option>
          </select>
        </div>
        <div className="flex flex-col w-1/2">
          <label className="flex items-center text-xs">Number of items:</label>
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
      {mentorData?.length ? (
        <ResponsiveContainer className={"w-[600px] h-[400px]"}>
          <BarChart
            data={mentorData}
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
              {mentorData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % 10]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex w-full h-2/3 justify-center items-center border-2 mt-4">
          <h1>No Data Available</h1>
        </div>
      )}
    </div>
  );
}
