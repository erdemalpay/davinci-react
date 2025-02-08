import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useShiftContext } from "../../context/Shift.context";
import { DateRangeKey, commonDateOptions } from "../../types";
import { dateRanges } from "../../utils/api/dateRanges";
import { useGetStoreLocations } from "../../utils/api/location";
import { useGetShifts } from "../../utils/api/shift";
import { useGetUsers } from "../../utils/api/user";
import { convertDateFormat, formatAsLocalDate } from "../../utils/format";
import { getItem } from "../../utils/getItem";
import { LocationInput } from "../../utils/panelInputs";
import GenericTable from "../panelComponents/Tables/GenericTable";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { InputTypes } from "../panelComponents/shared/types";

const Shifts = () => {
  const { t } = useTranslation();
  const [tableKey, setTableKey] = useState(0);
  const users = useGetUsers();
  const locations = useGetStoreLocations();
  const shifts = useGetShifts();
  const [showFilters, setShowFilters] = useState(false);
  const {
    filterPanelFormElements,
    setFilterPanelFormElements,
    initialFilterPanelFormElements,
  } = useShiftContext();

  const allRows = shifts?.map((shift) => {
    const shiftMapping = shift.shifts?.reduce((acc, shiftValue) => {
      const foundUser = getItem(shiftValue.user, users);
      const userName = foundUser?.name;
      if (shiftValue.shift && userName) {
        acc[shiftValue.shift] = userName;
      }
      return acc;
    }, {} as { [key: string]: string });

    return {
      ...shift,
      formattedDay: convertDateFormat(shift.day),
      shiftMapping,
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
  const foundLocation = getItem(filterPanelFormElements?.location, locations);
  if (foundLocation?.shifts && foundLocation?.shifts?.length > 0) {
    for (const shift of foundLocation.shifts) {
      columns.push({ key: shift, isSortable: false, correspondingKey: shift });
      rowKeys.push({
        key: String(shift),
        node: (row: any) => {
          return <>{row.shift}</>;
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
    LocationInput({ locations: locations }),
    {
      type: InputTypes.SELECT,
      formKey: "user",
      label: t("User"),
      options: users.map((user) => {
        return {
          value: user._id,
          label: user.name,
        };
      }),
      placeholder: t("User"),
      required: true,
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
  }, [shifts, users, locations]);

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
          getItem(filterPanelFormElements.location, locations)?.name +
          "  " +
          formatAsLocalDate(filterPanelFormElements.after) +
          "-" +
          formatAsLocalDate(filterPanelFormElements.before) +
          "  " +
          t("Shifts")
        }
        isExcel={true}
        filterPanel={filterPanel}
        excelFileName={`Shifts.xlsx`}
      />
    </div>
  );
};

export default Shifts;
