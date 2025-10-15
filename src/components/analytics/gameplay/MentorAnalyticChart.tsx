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
import { FormElementsState } from "../../../types";
import { Paths } from "../../../utils/api/factory";
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
      dateFilter: dateFilter,
      startDate: startDate,
      endDate: endDate || "",
      location: location,
      itemLimit: itemLimit.toString(),
    });

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
    // Update filter panel form elements to reflect the new dates
    setFilterPanelFormElements((prev) => ({
      ...prev,
      startDate: newStartDate,
      endDate: newEndDate || "",
    }));
  }, [dateFilter]);

  useEffect(() => {
    queryClient.invalidateQueries([Paths.Gameplays, "query"]);
  }, [startDate, endDate, itemLimit, queryClient]);

  // Sync filter panel with parent state
  useEffect(() => {
    // If dateFilter is cleared, set it to default (Single Day = "1")
    if (!filterPanelFormElements.dateFilter || filterPanelFormElements.dateFilter === "") {
      setFilterPanelFormElements((prev) => ({
        ...prev,
        dateFilter: "1",
      }));
      return;
    }

    if (filterPanelFormElements.dateFilter !== dateFilter) {
      setDateFilter(filterPanelFormElements.dateFilter as DateFilter);
    }

    // If startDate changed manually, switch to MANUAL mode and update
    if (filterPanelFormElements.startDate !== startDate) {
      if (dateFilter !== DateFilter.MANUAL) {
        setDateFilter(DateFilter.MANUAL);
        setFilterPanelFormElements((prev) => ({
          ...prev,
          dateFilter: DateFilter.MANUAL,
        }));
      }
      setStartDate(filterPanelFormElements.startDate);
    }

    if (
      filterPanelFormElements.endDate !== (endDate || "") &&
      dateFilter === DateFilter.MANUAL
    ) {
      setEndDate(filterPanelFormElements.endDate);
    }
    if (filterPanelFormElements.location !== location) {
      setLocation(filterPanelFormElements.location);
    }
    if (
      filterPanelFormElements.itemLimit &&
      Number(filterPanelFormElements.itemLimit) !== itemLimit
    ) {
      setItemLimit(Number(filterPanelFormElements.itemLimit));
    }
  }, [filterPanelFormElements]);

  const dateFilterOptions = [
    { value: "1", label: t("Single Day") },
    { value: "2", label: t("This Week") },
    { value: "3", label: t("Last Week") },
    { value: "4", label: t("This Month") },
    { value: "5", label: t("Last Month") },
    { value: "0", label: t("Manual") },
  ];

  const locationOptions = [
    { value: "1,2", label: t("All") },
    { value: "1", label: "Bahçeli" },
    { value: "2", label: "Neorama" },
  ];

  const filterPanelInputs = [
    {
      type: InputTypes.SELECT,
      formKey: "dateFilter",
      label: t("Date Filter"),
      options: dateFilterOptions,
      placeholder: t("Date Filter"),
      required: false,
    },
    {
      type: InputTypes.DATE,
      formKey: "startDate",
      label: t("Start Date"),
      placeholder: t("Start Date"),
      required: false,
      isDatePicker: true,
    },
    {
      type: InputTypes.SELECT,
      formKey: "location",
      label: t("Location"),
      options: locationOptions,
      placeholder: t("Location"),
      required: false,
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
