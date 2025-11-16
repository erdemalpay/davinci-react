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
import { DateRangeKey, FormElementsState } from "../../../types";
import { Paths } from "../../../utils/api/factory";
import { dateRanges } from "../../../utils/api/dateRanges";
import { useGetGameplayAnalytics } from "../../../utils/api/gameplay";
import { useGetUsers } from "../../../utils/api/user";
import { colors } from "../../../utils/color";
import { DateFilter, getStartEndDates } from "../../../utils/dateUtil";
import FilterPanel from "../../panelComponents/Tables/FilterPanel";
import SwitchButton from "../../panelComponents/common/SwitchButton";
import { InputTypes } from "../../panelComponents/shared/types";

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
  const { t } = useTranslation();

  const { data: gameAnalytics } = useGetGameplayAnalytics(
    "mentor",
    itemLimit,
    startDate,
    location,
    endDate
  );
  const users = useGetUsers();
  const [mentorData, setMentorData] = useState<GameCount[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filterPanelFormElements, setFilterPanelFormElements] =
    useState<FormElementsState>({
      date: "",
      dateFilter: "",
      startDate: "",
      endDate: "",
      location: "",
      itemLimit: "",
    });

  // Initialize filter panel with current values when first opened
  useEffect(() => {
    if (showFilters) {
      setFilterPanelFormElements({
        dateFilter: dateFilter,
        startDate: startDate,
        endDate: endDate || "",
        location: location,
        itemLimit: itemLimit.toString(),
      });
    }
  }, [showFilters]);

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
  }, [gameAnalytics, users, unique]);

  useEffect(() => {
    if (dateFilter === DateFilter.MANUAL) return;
    const { startDate: newStartDate, endDate: newEndDate } = getStartEndDates(dateFilter);
    setStartDate(newStartDate);
    setEndDate(newEndDate);
  }, [dateFilter]);

  useEffect(() => {
    queryClient.invalidateQueries([Paths.Gameplays, "query"]);
  }, [startDate, endDate, itemLimit, queryClient]);

  useEffect(() => {
    if (filterPanelFormElements.date === "singleDay" && filterPanelFormElements.startDate) {
      if (filterPanelFormElements.endDate !== filterPanelFormElements.startDate) {
        setFilterPanelFormElements((prev) => ({
          ...prev,
          endDate: prev.startDate,
        }));
      }
    }
  }, [filterPanelFormElements.startDate, filterPanelFormElements.date]);

  useEffect(() => {
    if (!showFilters) return;

    if (filterPanelFormElements.startDate && filterPanelFormElements.startDate !== startDate) {
      setStartDate(filterPanelFormElements.startDate);
    }
    if (filterPanelFormElements.endDate && filterPanelFormElements.endDate !== (endDate || "")) {
      setEndDate(filterPanelFormElements.endDate);
    }
    if (filterPanelFormElements.location && filterPanelFormElements.location !== location) {
      setLocation(filterPanelFormElements.location);
    }
    if (filterPanelFormElements.itemLimit && Number(filterPanelFormElements.itemLimit) !== itemLimit) {
      setItemLimit(Number(filterPanelFormElements.itemLimit));
    }
  }, [filterPanelFormElements, showFilters]);

  const locationOptions = [
    { value: "1,2", label: t("All") },
    { value: "1", label: "Bahçeli" },
    { value: "2", label: "Neorama" },
  ];

  const customDateOptions = [
    { value: "singleDay", label: t("Single Day") },
    { value: "thisWeek", label: t("This Week") },
    { value: "lastWeek", label: t("Last Week") },
    { value: "thisMonth", label: t("This Month") },
    { value: "lastMonth", label: t("Last Month") },
    { value: "manual", label: t("Manual") },
  ];

  const filterPanelInputs = [
    {
      type: InputTypes.SELECT,
      formKey: "location",
      label: t("Location"),
      options: locationOptions,
      placeholder: t("Location"),
      required: false,
    },
    {
      type: InputTypes.SELECT,
      formKey: "date",
      label: t("Date"),
      options: customDateOptions,
      placeholder: t("Date"),
      required: false,
      additionalOnChange: ({ value }: { value: string }) => {
        if (value === "manual") {
          setFilterPanelFormElements((prev) => ({ ...prev, date: value }));
          return;
        }

        const dateRange = value === "singleDay" ? dateRanges.today() : dateRanges[value as DateRangeKey]?.();
        if (dateRange) {
          setFilterPanelFormElements((prev) => ({
            ...prev,
            date: value,
            startDate: dateRange.after,
            endDate: dateRange.before,
          }));
        }
      },
    },
    {
      type: InputTypes.DATE,
      formKey: "startDate",
      label: t("Start Date"),
      placeholder: t("Start Date"),
      required: false,
      isDatePicker: true,
      isOnClearActive: false,
      additionalOnChange: ({ value }: { value: string }) => {
        setFilterPanelFormElements((prev) =>
          prev.date === "singleDay"
            ? { ...prev, startDate: value, endDate: value }
            : prev
        );
      },
    },
    {
      type: InputTypes.DATE,
      formKey: "endDate",
      label: t("End Date"),
      placeholder: t("End Date"),
      required: false,
      isDatePicker: true,
      isOnClearActive: false,
    },
    {
      type: InputTypes.NUMBER,
      formKey: "itemLimit",
      label: t("Number of items"),
      placeholder: t("Number of items"),
      required: false,
    },
  ];

  return (
    <div
      className={`mx-auto w-full ${
        showFilters ? "flex flex-row gap-2" : ""
      }`}
    >
      {showFilters && (
        <FilterPanel
          isFilterPanelActive={showFilters}
          inputs={filterPanelInputs}
          formElements={filterPanelFormElements}
          setFormElements={setFilterPanelFormElements}
          closeFilters={() => setShowFilters(false)}
        />
      )}
      <div className="w-full flex flex-col gap-4 px-4 py-4 border border-gray-200 rounded-lg bg-white shadow-sm">
        <div className="flex flex-row justify-between items-center">
          <p className="text-base lg:text-2xl font-medium leading-normal text-gray-800">
            {unique ? t("Unique") : ""} {t("Gameplay By Game Mentors")}
          </p>
          <div className="flex flex-row gap-4 items-center">
            <div className="flex flex-row gap-2 items-center">
              <label className="text-sm">{t("Show Filters")}</label>
              <SwitchButton
                checked={showFilters}
                onChange={() => {
                  setShowFilters(!showFilters);
                }}
              />
            </div>
          </div>
        </div>

        {mentorData?.length > 0 ? (
          <ResponsiveContainer width="100%" height={500}>
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
          <div className="flex w-full h-96 justify-center items-center border-2">
            <h1>{t("No Data Available")}</h1>
          </div>
        )}
      </div>
    </div>
  );
}