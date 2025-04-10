import { format, startOfYear } from "date-fns";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { DateRangeKey, commonDateOptions } from "../../types";
import { dateRanges } from "../../utils/api/dateRanges";
import { useGetAllLocations } from "../../utils/api/location";
import { useGetNotifications } from "../../utils/api/notification";
import { useGetAllUserRoles, useGetUsers } from "../../utils/api/user";
import { getItem } from "../../utils/getItem";
import GenericTable from "../panelComponents/Tables/GenericTable";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { InputTypes } from "../panelComponents/shared/types";

type FormElementsState = {
  [key: string]: any;
};

const AllNotifications = () => {
  const { t } = useTranslation();
  const users = useGetUsers();
  const roles = useGetAllUserRoles();
  const initialFilterPanelFormElements = {
    before: "",
    after: format(startOfYear(new Date()), "yyyy-MM-dd"),
  };
  const [filterPanelFormElements, setFilterPanelFormElements] =
    useState<FormElementsState>(initialFilterPanelFormElements);
  const notifications = useGetNotifications({
    after: filterPanelFormElements.after,
    before: filterPanelFormElements.before,
  });
  const [showFilters, setShowFilters] = useState(false);
  const locations = useGetAllLocations();
  const [tableKey, setTableKey] = useState(0);
  const allRows = notifications.map((notification) => {
    return {
      ...notification,
      createdBy: getItem(notification?.createdBy, users)?.name ?? "",
      formattedDate: format(new Date(notification.createdAt), "dd-MM-yyyy"),
      hour: format(new Date(notification.createdAt), "HH:mm"),
      type: t(notification.type),
    };
  });
  const [rows, setRows] = useState(allRows);
  const columns = [
    { key: t("Created By"), isSortable: true },
    { key: t("Date"), isSortable: true },
    { key: t("Created At"), isSortable: true },
    { key: t("Type"), isSortable: true },
    { key: t("Message"), isSortable: true },
    { key: t("Selected Users"), isSortable: true },
    { key: t("Selected Roles"), isSortable: true },
    { key: t("Selected Locations"), isSortable: true },
  ];
  const rowKeys = [
    { key: "createdBy" },
    { key: "formattedDate" },
    { key: "hour" },
    { key: "type" },
    { key: "message" },
    {
      key: "selectedUsers",
      node: (row: any) => {
        if (!row?.selectedUsers) return <></>;
        return (
          <div className="flex flex-row gap-2">
            {row.selectedUsers
              .map((user: any) => {
                const foundUser = getItem(user, users);
                return foundUser ? foundUser.name : "";
              })
              .filter(Boolean)
              .join(", ")}
          </div>
        );
      },
    },
    {
      key: "selectedRoles",
      node: (row: any) => {
        if (!row?.selectedRoles) return <></>;
        return (
          <div className="flex flex-row gap-2">
            {row.selectedRoles
              .map((role: any) => {
                const foundRole = getItem(role, roles);
                return foundRole ? foundRole.name : "";
              })
              .filter(Boolean)
              .join(", ")}
          </div>
        );
      },
    },
    {
      key: "selectedLocations",
      node: (row: any) => {
        if (!row?.selectedLocations) return <></>;
        return (
          <div className="flex flex-row gap-2">
            {row.selectedLocations
              .map((location: any) => {
                const foundLocation = getItem(location, locations);
                return foundLocation ? foundLocation.name : "";
              })
              .filter(Boolean)
              .join(", ")}
          </div>
        );
      },
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
    additionalFilterCleanFunction: () => {
      setFilterPanelFormElements(initialFilterPanelFormElements);
    },
    closeFilters: () => {
      setShowFilters(false);
    },
  };
  const filters = [
    {
      label: t("Show Filters"),
      isUpperSide: true,
      node: <SwitchButton checked={showFilters} onChange={setShowFilters} />,
    },
  ];
  useEffect(() => {
    setRows(allRows);
    setTableKey((prev) => prev + 1);
  }, [users, locations, notifications, roles]);
  return (
    <>
      <div className="w-[95%] mx-auto ">
        <GenericTable
          key={tableKey}
          rowKeys={rowKeys}
          columns={columns}
          rows={rows}
          filters={filters}
          filterPanel={filterPanel}
          title={t("All Notifications")}
          isActionsActive={false}
        />
      </div>
    </>
  );
};

export default AllNotifications;
