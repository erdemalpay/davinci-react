import { format, startOfMonth } from "date-fns";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { HiOutlineTrash } from "react-icons/hi2";
import { useFilterContext } from "../../context/Filter.context";
import { useUserContext } from "../../context/User.context";
import { DateRangeKey, RoleEnum, commonDateOptions } from "../../types";
import { dateRanges } from "../../utils/api/dateRanges";
import { useGetStoreLocations } from "../../utils/api/location";
import { useGetUsers } from "../../utils/api/user";
import { useGetFilteredVisits, useVisitMutation } from "../../utils/api/visit";
import { convertDateFormat } from "../../utils/format";
import { getItem } from "../../utils/getItem";
import { LocationInput } from "../../utils/panelInputs";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import GenericTable from "../panelComponents/Tables/GenericTable";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { InputTypes } from "../panelComponents/shared/types";

const AllVisits = () => {
  const { t } = useTranslation();
  const [tableKey, setTableKey] = useState(0);
  const { user } = useUserContext();
  const users = useGetUsers();
  const locations = useGetStoreLocations();
  const { deleteVisit } = useVisitMutation();
  const isDisabledCondition =
    user && ![RoleEnum.MANAGER].includes(user?.role?._id);
  const [
    isCloseAllConfirmationDialogOpen,
    setIsCloseAllConfirmationDialogOpen,
  ] = useState(false);
  const [rowToAction, setRowToAction] = useState<any>();
  const initialFilterPanelFormElements = {
    date: "",
    after: format(startOfMonth(new Date()), "yyyy-MM-dd"),
    before: "",
    user: "",
    location: "",
  };
  const {
    filterAllVisitsPanelFormElements,
    setFilterAllVisitsPanelFormElements,
    showAllVisitsFilters,
    setShowAllVisitsFilters,
  } = useFilterContext();
  const visits = useGetFilteredVisits(
    filterAllVisitsPanelFormElements.after,
    filterAllVisitsPanelFormElements.before
  );
  const allRows = visits
    ?.filter((visit) => {
      if (filterAllVisitsPanelFormElements.user !== "") {
        return visit.user === filterAllVisitsPanelFormElements.user;
      }
      if (filterAllVisitsPanelFormElements.location !== "") {
        return visit.location === filterAllVisitsPanelFormElements.location;
      }
      return true;
    })
    ?.map((visit) => {
      const foundUser = getItem(visit.user, users);
      const foundLocation = getItem(visit.location, locations);
      return {
        ...visit,
        formattedDate: convertDateFormat(visit.date),
        userName: foundUser?.name,
        locationName: foundLocation?.name,
        userRole: foundUser?.role?.name,
        finishHour: visit?.finishHour ?? " ",
      };
    });
  const [rows, setRows] = useState(allRows);
  const columns = [
    { key: t("User"), isSortable: true, correspondingKey: "userName" },
    { key: t("Role"), isSortable: true, correspondingKey: "userRole" },
    { key: t("Location"), isSortable: true, correspondingKey: "locationName" },
    { key: t("Date"), isSortable: true, correspondingKey: "formattedDate" },
    { key: t("Start Hour"), isSortable: true, correspondingKey: "startHour" },
    { key: t("Finish Hour"), isSortable: true, correspondingKey: "finishHour" },
  ];
  if (!isDisabledCondition) {
    columns.push({ key: t("Actions"), isSortable: false } as any);
  }
  const rowKeys = [
    { key: "userName" },
    { key: "userRole" },
    { key: "locationName" },
    {
      key: "date",
      node: (row: any) => {
        return <p className="min-w-32 pr-2">{row.formattedDate}</p>;
      },
    },
    { key: "startHour" },
    { key: "finishHour" },
  ];
  const filters = [
    {
      label: t("Show Filters"),
      isUpperSide: true,
      node: (
        <SwitchButton
          checked={showAllVisitsFilters}
          onChange={() => {
            setShowAllVisitsFilters(!showAllVisitsFilters);
          }}
        />
      ),
    },
  ];
  const actions = [
    {
      name: t("Delete"),
      icon: <HiOutlineTrash />,
      setRow: setRowToAction,
      modal: rowToAction ? (
        <ConfirmationDialog
          isOpen={isCloseAllConfirmationDialogOpen}
          close={() => setIsCloseAllConfirmationDialogOpen(false)}
          confirm={() => {
            deleteVisit(rowToAction?._id);
            setIsCloseAllConfirmationDialogOpen(false);
          }}
          title={t("Delete Visit")}
          text={`${t("Visit")} ${t("GeneralDeleteMessage")}`}
        />
      ) : null,
      className: "text-red-500 cursor-pointer text-2xl ",
      isModal: true,
      isModalOpen: isCloseAllConfirmationDialogOpen,
      setIsModal: setIsCloseAllConfirmationDialogOpen,
      isPath: false,
      isDisabled: isDisabledCondition,
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
          setFilterAllVisitsPanelFormElements({
            ...filterAllVisitsPanelFormElements,
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
    isFilterPanelActive: showAllVisitsFilters,
    inputs: filterPanelInputs,
    formElements: filterAllVisitsPanelFormElements,
    setFormElements: setFilterAllVisitsPanelFormElements,
    closeFilters: () => setShowAllVisitsFilters(false),
    additionalFilterCleanFunction: () => {
      setFilterAllVisitsPanelFormElements(initialFilterPanelFormElements);
    },
  };
  useEffect(() => {
    setRows(allRows);
    setTableKey((prev) => prev + 1);
  }, [visits, filterAllVisitsPanelFormElements, users, locations]);
  return (
    <>
      <div className="w-[95%] my-5 mx-auto ">
        <GenericTable
          key={tableKey}
          rowKeys={rowKeys}
          columns={columns}
          rows={rows}
          isActionsActive={!isDisabledCondition}
          filterPanel={filterPanel}
          filters={filters}
          title={t("All Visits")}
          actions={!isDisabledCondition ? actions : []}
          isExcel={true}
          excelFileName={`Visits.xlsx`}
        />
      </div>
    </>
  );
};
export default AllVisits;
