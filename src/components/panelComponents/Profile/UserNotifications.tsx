import { format, startOfMonth } from "date-fns";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  commonDateOptions,
  DateRangeKey,
  NotificationBackgroundColors,
  NotificationType,
} from "../../../types";
import { dateRanges } from "../../../utils/api/dateRanges";
import { useGetAllLocations } from "../../../utils/api/location";
import { useGetUserAllNotifications } from "../../../utils/api/notification";
import { useGetAllUserRoles, useGetUsers } from "../../../utils/api/user";
import { getItem } from "../../../utils/getItem";
import SwitchButton from "../common/SwitchButton";
import { InputTypes } from "../shared/types";
import GenericTable from "../Tables/GenericTable";

type FormElementsState = {
  [key: string]: any;
};

const UserNotifications = () => {
  const { t } = useTranslation();
  const users = useGetUsers();
  const roles = useGetAllUserRoles();
  const initialFilterPanelFormElements = {
    before: "",
    after: format(startOfMonth(new Date()), "yyyy-MM-dd"),
  };
  const [filterPanelFormElements, setFilterPanelFormElements] =
    useState<FormElementsState>(initialFilterPanelFormElements);
  const notifications = useGetUserAllNotifications({
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
    };
  });
  const [rows, setRows] = useState(allRows);
  const columns = [
    { key: t("Created At"), isSortable: true },
    { key: t("Message"), isSortable: true },
  ];
  const rowKeys = [
    { key: "formattedDate" },
    {
      key: "message",
      node: (row: any) => {
        return (
          <p
            className=" rounded-md text-sm ml-2 px-2 py-1 "
            style={{
              backgroundColor:
                NotificationBackgroundColors[row.type as NotificationType] ||
                "#CCCCCC",
            }}
          >
            {row.message}
          </p>
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
          title={t("Notifications")}
          isActionsActive={false}
          isToolTipEnabled={false}
        />
      </div>
    </>
  );
};

export default UserNotifications;
