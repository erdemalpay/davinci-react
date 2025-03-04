import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useShiftContext } from "../../../context/Shift.context";
import { DateRangeKey, commonDateOptions } from "../../../types";
import { dateRanges } from "../../../utils/api/dateRanges";
import { useGetStoreLocations } from "../../../utils/api/location";
import { useGetLocationShifts } from "../../../utils/api/shift";
import { useGetUser, useGetUsers } from "../../../utils/api/user";
import { convertDateFormat, formatAsLocalDate } from "../../../utils/format";
import { getItem } from "../../../utils/getItem";
import GenericTable from "../../panelComponents/Tables/GenericTable";
import SwitchButton from "../../panelComponents/common/SwitchButton";
import { InputTypes } from "../../panelComponents/shared/types";

type Props = {
  shiftLocation: number;
};
const LocationShift = ({ shiftLocation }: Props) => {
  const { t } = useTranslation();
  const [tableKey, setTableKey] = useState(0);
  const users = useGetUsers();
  const locations = useGetStoreLocations();
  const shifts = useGetLocationShifts(shiftLocation);
  const user = useGetUser();
  const [showFilters, setShowFilters] = useState(false);
  const {
    filterPanelFormElements,
    setFilterPanelFormElements,
    initialFilterPanelFormElements,
  } = useShiftContext();
  const foundLocation = getItem(shiftLocation, locations);
  const allRows = shifts?.map((shift) => {
    const shiftMapping = shift?.shifts?.reduce((acc, shiftValue) => {
      if (shiftValue.shift && shiftValue.user) {
        acc[shiftValue.shift] = shiftValue.user;
      }
      return acc;
    }, {} as { [key: string]: string[] });
    const dayName = new Date(shift.day).toLocaleDateString("en-US", {
      weekday: "long",
    });
    return {
      ...shift,
      formattedDay:
        convertDateFormat(shift.day) + "  " + "(" + t(dayName) + ")",
      ...shiftMapping,
    };
  });
  const [rows, setRows] = useState(allRows);
  const columns = [
    { key: t("Date"), isSortable: true, correspondingKey: "formattedDay" },
  ];
  const rowKeys = [
    {
      key: "day",
      node: (row: any) => <p className="min-w-32 pr-2">{row.formattedDay}</p>,
    },
  ];
  if (foundLocation?.shifts && foundLocation?.shifts?.length > 0) {
    for (const shift of foundLocation.shifts) {
      columns.push({ key: shift, isSortable: false, correspondingKey: shift });
      rowKeys.push({
        key: shift,
        node: (row: any) => {
          const shiftValue = row[shift];
          if (Array.isArray(shiftValue)) {
            return (
              <div>
                {shiftValue.map((shiftUser: string, index: number) => {
                  if (shiftUser !== user?._id) return <></>;
                  return (
                    <p key={`${row.day}${user?._id}${index}`}>{user?.name}</p>
                  );
                })}
              </div>
            );
          } else if (shiftValue) {
            if (shiftValue !== user?._id) return <></>;
            return <p key={`${row.day}${user?._id}-single`}>{user?.name}</p>;
          }
          return <></>;
        },
      });
    }
  }
  const filters = [
    {
      label: t("Show Filters"),
      isUpperSide: true,
      node: <SwitchButton checked={showFilters} onChange={setShowFilters} />,
    },
  ];
  const filterPanelInputs = [
    {
      type: InputTypes.SELECT,
      formKey: "date",
      label: t("Date"),
      options: commonDateOptions.map((option) => {
        return {
          value: option.value,
          label: t(option.label),
        };
      }),
      placeholder: t("Date"),
      required: true,
      additionalOnChange: ({
        value,
        label,
      }: {
        value: string;
        label: string;
      }) => {
        const dateRange = dateRanges[value as DateRangeKey];
        if (dateRange) {
          setFilterPanelFormElements({
            ...filterPanelFormElements,
            ...dateRange(),
          });
        }
      },
    },
    {
      type: InputTypes.DATE,
      formKey: "after",
      label: t("Start Date"),
      placeholder: t("Start Date"),
      required: true,
      isDatePicker: true,
      invalidateKeys: [{ key: "date", defaultValue: "" }],
      isOnClearActive: false,
    },
    {
      type: InputTypes.DATE,
      formKey: "before",
      label: t("End Date"),
      placeholder: t("End Date"),
      required: true,
      isDatePicker: true,
      invalidateKeys: [{ key: "date", defaultValue: "" }],
      isOnClearActive: false,
    },
  ];
  const filterPanel = {
    isFilterPanelActive: showFilters,
    inputs: filterPanelInputs,
    formElements: filterPanelFormElements,
    setFormElements: setFilterPanelFormElements,
    closeFilters: () => setShowFilters(false),
    additionalFilterCleanFunction: () => {
      setFilterPanelFormElements(initialFilterPanelFormElements);
    },
  };
  useEffect(() => {
    setRows(allRows);
    setTableKey((prev) => prev + 1);
  }, [shifts, users, locations, shiftLocation, user]);

  return (
    <div className="w-[95%] my-5 mx-auto">
      <GenericTable
        key={tableKey}
        rowKeys={rowKeys}
        columns={columns}
        rows={rows}
        isActionsActive={false}
        filters={filters}
        title={
          getItem(shiftLocation, locations)?.name +
          "  " +
          formatAsLocalDate(filterPanelFormElements.after) +
          "-" +
          formatAsLocalDate(filterPanelFormElements.before) +
          "  " +
          t("Shifts")
        }
        isExcel={true}
        filterPanel={filterPanel as any}
        excelFileName={`${
          getItem(shiftLocation, locations)?.name +
          formatAsLocalDate(filterPanelFormElements.after) +
          formatAsLocalDate(filterPanelFormElements.before)
        }.xlsx`}
      />
    </div>
  );
};

export default LocationShift;
