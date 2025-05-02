import { format, startOfMonth } from "date-fns";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useFilterContext } from "../../context/Filter.context";
import { DateRangeKey, commonDateOptions } from "../../types";
import { dateRanges } from "../../utils/api/dateRanges";
import { useGetStoreLocations } from "../../utils/api/location";
import { useGetUsers } from "../../utils/api/user";
import { useGetUniqueVisits } from "../../utils/api/visit";
import { formatAsLocalDate } from "../../utils/format";
import { getItem } from "../../utils/getItem";
import { LocationInput } from "../../utils/panelInputs";
import GenericTable from "../panelComponents/Tables/GenericTable";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { InputTypes } from "../panelComponents/shared/types";

const VisitScheduleOverview = () => {
  const { t } = useTranslation();
  const [tableKey, setTableKey] = useState(0);
  const users = useGetUsers();
  const locations = useGetStoreLocations();
  const initialFilterPanelFormElements = {
    date: "",
    after: format(startOfMonth(new Date()), "yyyy-MM-dd"),
    before: "",
    user: "",
    location: "",
  };
  const {
    filterVisitScheduleOverviewPanelFormElements,
    setFilterVisitScheduleOverviewPanelFormElements,
    showVisitScheduleOverviewFilters,
    setShowVisitScheduleOverviewFilters,
  } = useFilterContext();
  const visits = useGetUniqueVisits(
    filterVisitScheduleOverviewPanelFormElements.after,
    filterVisitScheduleOverviewPanelFormElements.before
  );
  const allRows = visits
    ?.filter((visit) => {
      if (filterVisitScheduleOverviewPanelFormElements.user !== "") {
        return visit.user === filterVisitScheduleOverviewPanelFormElements.user;
      }
      if (filterVisitScheduleOverviewPanelFormElements.location !== "") {
        return (
          visit.location ===
          filterVisitScheduleOverviewPanelFormElements.location
        );
      }
      return true;
    })
    ?.map((visit) => {
      const foundUser = getItem(visit.user, users);
      if (!foundUser) return null;
      const isPartTime = visit.startHour >= "14:30";
      return {
        visitDate: formatAsLocalDate(visit.date),
        userName: foundUser.name,
        userType: isPartTime ? "PartTime" : "FullTime",
      };
    })
    ?.filter((row) => row !== null)
    ?.reduce((acc: any, curr: any) => {
      let userEntry = acc.find(
        (entry: any) => entry.userName === curr.userName
      );
      if (!userEntry) {
        userEntry = {
          userName: curr.userName,
          partTime: 0,
          fullTime: 0,
        };
        acc.push(userEntry);
      }
      if (curr.userType === "PartTime") {
        userEntry.partTime += 1;
      } else {
        userEntry.fullTime += 1;
      }
      return acc;
    }, []);
  const [rows, setRows] = useState(allRows);
  const columns = [
    { key: t("User"), isSortable: true, correspondingKey: "userName" },
    { key: "Part Time", isSortable: true, correspondingKey: "partTime" },
    { key: "Full Time", isSortable: true, correspondingKey: "fullTime" },
  ];
  const rowKeys = [
    { key: "userName" },
    { key: "partTime" },
    { key: "fullTime" },
  ];
  const filters = [
    {
      label: t("Show Filters"),
      isUpperSide: true,
      node: (
        <SwitchButton
          checked={showVisitScheduleOverviewFilters}
          onChange={() => {
            setShowVisitScheduleOverviewFilters(
              !showVisitScheduleOverviewFilters
            );
          }}
        />
      ),
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
          setFilterVisitScheduleOverviewPanelFormElements({
            ...filterVisitScheduleOverviewPanelFormElements,
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
    isFilterPanelActive: showVisitScheduleOverviewFilters,
    inputs: filterPanelInputs,
    formElements: filterVisitScheduleOverviewPanelFormElements,
    setFormElements: setFilterVisitScheduleOverviewPanelFormElements,
    closeFilters: () => setShowVisitScheduleOverviewFilters(false),
    additionalFilterCleanFunction: () => {
      setFilterVisitScheduleOverviewPanelFormElements(
        initialFilterPanelFormElements
      );
    },
  };
  useEffect(() => {
    setRows(allRows);
    setTableKey((prev) => prev + 1);
  }, [visits, filterVisitScheduleOverviewPanelFormElements, users, locations]);
  return (
    <>
      <div className="w-[95%] my-5 mx-auto ">
        <GenericTable
          key={tableKey}
          rowKeys={rowKeys}
          columns={columns}
          rows={rows}
          isActionsActive={false}
          filterPanel={filterPanel}
          filters={filters}
          isExcel={true}
          excelFileName={"VisitSchedule.xlsx"}
          title={t("Visit Schedule Overview")}
        />
      </div>
    </>
  );
};
export default VisitScheduleOverview;
