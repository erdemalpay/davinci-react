import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useShiftContext } from "../../context/Shift.context";
import { useGetStoreLocations } from "../../utils/api/location";
import { useGetShifts } from "../../utils/api/shift";
import { useGetUsers } from "../../utils/api/user";
import { convertDateFormat } from "../../utils/format";
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
    const foundLocation = getItem(shift.location, locations);
    return {
      ...shift,
      formattedDay: convertDateFormat(shift.day),
      locationName: foundLocation?.name,
      shifts: shift?.shifts?.map((shiftValue) => {
        const foundUser = getItem(shiftValue.user, users);
        return {
          ...shiftValue,
          userName: foundUser?.name,
        };
      }),
    };
  });

  const [rows, setRows] = useState(allRows);

  const columns = [
    { key: t("Date"), isSortable: true, correspondingKey: "formattedDay" },
    { key: t("Location"), isSortable: true, correspondingKey: "locationName" },
    { key: t("Shifts"), isSortable: false, correspondingKey: "shifts" },
  ];

  const rowKeys = [
    {
      key: "formattedDay",
      node: (row: any) => <p className="min-w-32 pr-2">{row.formattedDay}</p>,
    },
    { key: "locationName" },
    {
      key: "shifts",
      node: (row: any) => (
        <ul>
          {row.shifts.map((shift: any, index: number) => (
            <li key={index}>
              {shift.userName} - {shift.shift}
            </li>
          ))}
        </ul>
      ),
    },
  ];
  const filters = [
    {
      label: t("Show Filters"),
      isUpperSide: true,
      node: <SwitchButton checked={showFilters} onChange={setShowFilters} />,
    },
  ];
  const filterPanelInputs = [
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
        title={t("Shifts")}
        isExcel={true}
        filterPanel={filterPanel}
        excelFileName={`Shifts.xlsx`}
      />
    </div>
  );
};

export default Shifts;
