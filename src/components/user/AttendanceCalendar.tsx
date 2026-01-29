import { ResponsiveCalendar } from "@nivo/calendar";
import { addDays, format, startOfYear } from "date-fns";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import useIsSmallScreen from "../../hooks/useIsSmallScreen";
import { LocationShiftType } from "../../types";

const VISIT_TYPE = {
  FULLTIME: "fulltime",
  PARTTIME: "parttime",
  UNKNOWN: "unknown",
  EXCLUDED: "excluded",
} as const;

type VisitType = (typeof VISIT_TYPE)[keyof typeof VISIT_TYPE];

interface CategorizedVisit {
  _id: number;
  location: number;
  date: string;
  user: string;
  startHour: string;
  finishHour?: string;
  visitType: VisitType;
}

interface CalendarData {
  day: string;
  value: number;
  visitType: VisitType;
  isSelected: boolean;
}

interface AttendanceCalendarProps {
  visits: any[];
  shifts: any[];
  locations: any[];
  userId: string;
  onAttendanceChange: (attendance: {
    fullTimeAttendance: number;
    partTimeAttendance: number;
    unknownAttendance: number;
  }) => void;
}

const AttendanceCalendar = ({
  visits,
  shifts,
  locations,
  userId,
  onAttendanceChange,
}: AttendanceCalendarProps) => {
  const { t } = useTranslation();
  const isSmallScreen = useIsSmallScreen();
  const [showFullTime, setShowFullTime] = useState(true);
  const [showPartTime, setShowPartTime] = useState(true);
  const [showUnknown, setShowUnknown] = useState(true);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  // Categorize visits by type
  const categorizedVisits: CategorizedVisit[] =
    visits?.map((visit) => {
      const foundShift = shifts
        ?.find(
          (shift) =>
            shift.day === visit.date &&
            shift.location === visit.location &&
            shift.shifts?.some((s: any) => s.user?.includes(userId))
        )
        ?.shifts?.find((shift: any) => shift.user?.includes(userId));

      let visitType: VisitType = VISIT_TYPE.UNKNOWN;
      if (foundShift) {
        const foundLocation = locations?.find(
          (location) => location._id === visit.location
        );
        if (foundLocation) {
          const foundShiftType = foundLocation.shifts?.find(
            (shift: any) => shift.shift === foundShift.shift && shift.isActive
          )?.type;
          if (foundShiftType === LocationShiftType.FULLTIME) {
            visitType = VISIT_TYPE.FULLTIME;
          } else if (foundShiftType === LocationShiftType.PARTTIME) {
            visitType = VISIT_TYPE.PARTTIME;
          }
        }
      }
      return { ...visit, visitType };
    }) || [];

  // Calculate attendance based on selected filters
  const filteredVisits = categorizedVisits.filter((visit) => {
    if (selectedDays.includes(visit.date)) return false; // Exclude selected days
    if (visit.visitType === VISIT_TYPE.FULLTIME && !showFullTime) return false;
    if (visit.visitType === VISIT_TYPE.PARTTIME && !showPartTime) return false;
    if (visit.visitType === VISIT_TYPE.UNKNOWN && !showUnknown) return false;
    return true;
  });

  let fullTimeAttendance = 0;
  let partTimeAttendance = 0;
  let unknownAttendance = 0;

  filteredVisits.forEach((visit) => {
    if (visit.visitType === VISIT_TYPE.FULLTIME) {
      fullTimeAttendance++;
    } else if (visit.visitType === VISIT_TYPE.PARTTIME) {
      partTimeAttendance++;
    } else {
      unknownAttendance++;
    }
  });

  // Notify parent component of attendance changes
  React.useEffect(() => {
    onAttendanceChange({
      fullTimeAttendance,
      partTimeAttendance,
      unknownAttendance,
    });
  }, [
    fullTimeAttendance,
    partTimeAttendance,
    unknownAttendance,
    onAttendanceChange,
  ]);

  // Create calendar data from visits
  const visitCalendarData = categorizedVisits.reduce(
    (acc: CalendarData[], visit) => {
      const existingDay = acc.find((item) => item.day === visit.date);
      const isSelected = selectedDays.includes(visit.date);

      // Use 0-based sequential values for proper color mapping
      let value: number;
      if (isSelected) {
        value = 3; // Excluded days - purple (highest priority)
      } else if (visit.visitType === VISIT_TYPE.FULLTIME) {
        value = 2; // Full-time - green
      } else if (visit.visitType === VISIT_TYPE.PARTTIME) {
        value = 1; // Part-time - blue
      } else {
        value = 0; // Unknown - red
      }

      if (existingDay) {
        // If selected, always use value 3, otherwise take the max
        existingDay.value = isSelected ? 3 : Math.max(existingDay.value, value);
        existingDay.isSelected = isSelected;
        existingDay.visitType = isSelected
          ? VISIT_TYPE.EXCLUDED
          : existingDay.visitType;
      } else {
        acc.push({
          day: visit.date,
          value: value,
          visitType: isSelected ? VISIT_TYPE.EXCLUDED : visit.visitType,
          isSelected: isSelected,
        });
      }
      return acc;
    },
    []
  );

  const handleDayClick = (data: { day?: string; value?: number }) => {
    if (data?.day) {
      const dayValue = data.day;
      setSelectedDays((prev) => {
        if (prev.includes(dayValue)) {
          return prev.filter((d) => d !== dayValue);
        } else {
          return [...prev, dayValue];
        }
      });
    }
  };

  if (!visitCalendarData || visitCalendarData.length === 0) {
    return null;
  }

  return (
    <div className="border p-3 rounded-lg border-gray-200 bg-white w-full">
      <h3 className="text-base sm:text-lg font-semibold mb-2">
        {t("Attendance Calendar")}
      </h3>
      <p className="text-sm text-gray-600 mb-3">
        {t("Click on days to exclude them from attendance calculations")}
      </p>
      {/* Filter toggles */}
      <div className="flex flex-wrap items-center gap-4 mb-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showFullTime}
            onChange={(e) => setShowFullTime(e.target.checked)}
            className="w-4 h-4 cursor-pointer"
          />
          <span className="text-sm">{t("Full-time")}</span>
          <div className="w-4 h-4" style={{ backgroundColor: "#22c55e" }}></div>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showPartTime}
            onChange={(e) => setShowPartTime(e.target.checked)}
            className="w-4 h-4 cursor-pointer"
          />
          <span className="text-sm">{t("Part-time")}</span>
          <div className="w-4 h-4" style={{ backgroundColor: "#3b82f6" }}></div>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showUnknown}
            onChange={(e) => setShowUnknown(e.target.checked)}
            className="w-4 h-4 cursor-pointer"
          />
          <span className="text-sm">{t("Unknown")}</span>
          <div className="w-4 h-4" style={{ backgroundColor: "#ef4444" }}></div>
        </label>
        {selectedDays.length > 0 && (
          <button
            onClick={() => setSelectedDays([])}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            {t("Clear Selected Days")} ({selectedDays.length})
          </button>
        )}
      </div>
      <div className="w-full overflow-x-scroll">
        <div
          style={{
            height: isSmallScreen ? "15rem" : "18rem",
            minWidth: isSmallScreen ? "60.25rem" : "100%",
          }}
        >
          <ResponsiveCalendar
            key={`calendar-${selectedDays.length}`}
            data={visitCalendarData}
            from={format(addDays(startOfYear(new Date()), 1), "yyyy-MM-dd")}
            to={format(new Date(), "yyyy-MM-dd")}
            emptyColor="#eeeeee"
            minValue={0}
            maxValue={3}
            colors={["#ef4444", "#3b82f6", "#22c55e", "#a855f7"]}
            margin={
              isSmallScreen
                ? { top: 5, right: 5, bottom: 20, left: 25 }
                : { top: 5, right: 10, bottom: 20, left: 30 }
            }
            yearSpacing={isSmallScreen ? 30 : 40}
            monthBorderColor="#ffffff"
            dayBorderWidth={isSmallScreen ? 0.5 : 1}
            dayBorderColor="#ffffff"
            monthSpacing={isSmallScreen ? 0.25 : 0.5}
            legends={[]}
            onClick={handleDayClick}
            tooltip={({ day }) => (
              <div
                style={{
                  background: "white",
                  padding: "4px 8px",
                  border: "1px solid #ccc",
                  borderRadius: "6px",
                  fontSize: "16px",
                  minWidth: "120px",
                }}
              >
                <strong>{day}</strong>
              </div>
            )}
          />
        </div>
      </div>
    </div>
  );
};

export default AttendanceCalendar;
