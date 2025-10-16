import { format, startOfYear } from "date-fns";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useGeneralContext } from "../../context/General.context";
import { useUserContext } from "../../context/User.context";
import {
  DateRangeKey,
  NotificationType,
  commonDateOptions,
  notificationEventsOptions,
} from "../../types";
import { dateRanges } from "../../utils/api/dateRanges";
import { useGetAllLocations } from "../../utils/api/location";
import { useGetQueryNotifications } from "../../utils/api/notification";
import { useGetAllUserRoles, useGetUsers } from "../../utils/api/user";
import { getItem } from "../../utils/getItem";
import { getNotificationLanguageMessage } from "../../utils/notification";
import GenericTable from "../panelComponents/Tables/GenericTable";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { InputTypes } from "../panelComponents/shared/types";

type FormElementsState = {
  [key: string]: any;
};

const AllNotifications = () => {
  const { t } = useTranslation();
  const { user } = useUserContext();
  const users = useGetUsers();
  const roles = useGetAllUserRoles();
  const { rowsPerPage, currentPage, setCurrentPage } = useGeneralContext();
  const initialFilterPanelFormElements = {
    before: "",
    after: format(startOfYear(new Date()), "yyyy-MM-dd"),
    type: "",
    event: "",
    sort: "",
    asc: 1,
  };
  const [filterPanelFormElements, setFilterPanelFormElements] =
    useState<FormElementsState>(initialFilterPanelFormElements);
  const notificationPayload = useGetQueryNotifications(
    currentPage,
    rowsPerPage,
    filterPanelFormElements
  );
  const [showFilters, setShowFilters] = useState(false);
  const locations = useGetAllLocations();
  const [tableKey, setTableKey] = useState(0);
  const allRows =
    notificationPayload?.data?.map((notification) => {
      return {
        ...notification,
        createdBy: getItem(notification?.createdBy, users)?.name ?? "",
        formattedDate: format(new Date(notification.createdAt), "dd-MM-yyyy"),
        hour: format(new Date(notification.createdAt), "HH:mm"),
        type: t(notification.type),
      };
    }) ?? [];
  const [rows, setRows] = useState(allRows);
  const columns = [
    { key: t("Created By"), isSortable: true, correspondingKey: "createdBy" },
    { key: t("Date"), isSortable: true, correspondingKey: "createdAt" },
    { key: t("Created At"), isSortable: false },
    { key: t("Type"), isSortable: true, correspondingKey: "type" },
    { key: t("Triggered Event"), isSortable: true, correspondingKey: "event" },
    { key: t("Message"), isSortable: true, correspondingKey: "message" },
    {
      key: t("Selected Users"),
      isSortable: true,
      correspondingKey: "selectedUsers",
    },
    {
      key: t("Selected Roles"),
      isSortable: true,
      correspondingKey: "selectedRoles",
    },
    {
      key: t("Selected Locations"),
      isSortable: true,
      correspondingKey: "selectedLocations",
    },
  ];
  const rowKeys = [
    { key: "createdBy" },
    { key: "formattedDate" },
    { key: "hour" },
    {
      key: "type",
      node: (row: any) => {
        return t(row?.type);
      },
    },
    {
      key: "event",
    },
    {
      key: "message",
      node: (row: any) => {
        return getNotificationLanguageMessage(user?.language, row);
      },
    },
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
      formKey: "type",
      label: t("Type"),
      options: Object.values(NotificationType)?.map((notificationType) => {
        return {
          value: notificationType,
          label: t(notificationType),
        };
      }),
      placeholder: t("Type"),
      isMultiple: false,
      required: true,
    },
    {
      type: InputTypes.SELECT,
      formKey: "event",
      label: t("Triggered Event"),
      options: notificationEventsOptions.map((notificationEvent) => {
        return {
          value: notificationEvent.value,
          label: t(notificationEvent.label),
        };
      }),
      placeholder: t("Triggered Event"),
      required: false,
      isAutoFill: false,
    },
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
  const outsideSort = {
    filterPanelFormElements: filterPanelFormElements,
    setFilterPanelFormElements: setFilterPanelFormElements,
  };
  const pagination = notificationPayload
    ? {
        totalPages: notificationPayload.totalPages,
        totalRows: notificationPayload.totalNumber,
      }
    : null;

  useEffect(() => {
    setCurrentPage(1);
  }, [filterPanelFormElements]);

  useEffect(() => {
    setRows(allRows);
    setTableKey((prev) => prev + 1);
  }, [users, locations, notificationPayload, roles]);
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
          outsideSortProps={outsideSort}
          {...(pagination && { pagination })}
        />
      </div>
    </>
  );
};

export default AllNotifications;
