import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocationContext } from "../../../context/Location.context";
import { useShiftContext } from "../../../context/Shift.context";
import { DateRangeKey, commonDateOptions } from "../../../types";
import { dateRanges } from "../../../utils/api/dateRanges";
import { useGetStoreLocations } from "../../../utils/api/location";
import { useGetUserShifts } from "../../../utils/api/shift";
import { useGetUser, useGetUsers } from "../../../utils/api/user";
import { convertDateFormat } from "../../../utils/format";
import Loading from "../../common/Loading";
import GenericTable from "../../panelComponents/Tables/GenericTable";
import SwitchButton from "../../panelComponents/common/SwitchButton";
import { InputTypes } from "../../panelComponents/shared/types";

const UserShifts = () => {
  const { t } = useTranslation();
  const [tableKey, setTableKey] = useState(0);
  const users = useGetUsers();
  const locations = useGetStoreLocations();
  const { selectedLocationId } = useLocationContext();
  const user = useGetUser();
  if(!user) return <Loading/>
  const shifts = useGetUserShifts(user?._id);
  const [showFilters, setShowFilters] = useState(false);
  const {
    filterPanelFormElements,
    setFilterPanelFormElements,
    initialFilterPanelFormElements,
  } = useShiftContext();
  const allRows = shifts?.map((shift) => {
    const dayName = new Date(shift.day).toLocaleDateString("en-US", {
      weekday: "long",
    });
    return {
      ...shift,
      formattedDay:
        convertDateFormat(shift.day) + "  " + "(" + t(dayName) + ")",
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
  locations?.forEach((location) => {
    columns.push({
      key: location.name,
      isSortable: true,
      correspondingKey: `${location._id}`,
    });
    rowKeys.push({
      key: `${location._id}`,
      node: (row: any) => {
        if (row.location === location._id) {
          return row?.shifts?.filter((shift:any)=>shift.user?.includes(user._id))
            ?.map((shiftItem: any) => shiftItem.shift)
            .join(', ');
        }
      }
    });
    
  })
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
  }, [shifts, users, locations, selectedLocationId, user]);

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
          user.name + " "+
          t("Shifts")
        }
        filterPanel={filterPanel as any}
      />
    </div>
  );
};

export default UserShifts;
