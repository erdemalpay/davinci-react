import { format, startOfYear } from "date-fns";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  MdCheckCircle,
  MdError,
  MdInfo,
  MdShoppingCart,
  MdWarning,
} from "react-icons/md";
import {
  DateRangeKey,
  Notification,
  NotificationBackgroundColors,
  NotificationColors,
  NotificationEventColors,
  NotificationType,
  commonDateOptions,
  notificationEventsOptions,
} from "../../../types";
import { dateRanges } from "../../../utils/api/dateRanges";
import { useGetAllLocations } from "../../../utils/api/location";
import { useGetUserAllNotifications } from "../../../utils/api/notification";
import { useGetAllUserRoles, useGetUsers } from "../../../utils/api/user";
import { getItem } from "../../../utils/getItem";
import SwitchButton from "../common/SwitchButton";
import { InputTypes } from "../shared/types";
import GenericTable from "../Tables/GenericTable";
import CustomTooltip from "../Tables/Tooltip";

type FormElementsState = {
  [key: string]: string;
};

const typeIconClass = "text-sm sm:text-base h-6 w-6";

const typeIconMap: Record<NotificationType, JSX.Element> = {
  [NotificationType.INFORMATION]: <MdInfo className={typeIconClass} />,
  [NotificationType.WARNING]: <MdWarning className={typeIconClass} />,
  [NotificationType.ERROR]: <MdError className={typeIconClass} />,
  [NotificationType.SUCCESS]: <MdCheckCircle className={typeIconClass} />,
  [NotificationType.ORDER]: <MdShoppingCart className={typeIconClass} />,
};

const UserNotifications = () => {
  const { t } = useTranslation();
  const users = useGetUsers();
  const roles = useGetAllUserRoles();
  const initialFilterPanelFormElements = {
    before: "",
    after: format(startOfYear(new Date()), "yyyy-MM-dd"),
    type: "",
    event: "",
  };
  const [filterPanelFormElements, setFilterPanelFormElements] =
    useState<FormElementsState>(initialFilterPanelFormElements);
  const notifications = useGetUserAllNotifications({
    after: filterPanelFormElements.after,
    before: filterPanelFormElements.before,
    type: filterPanelFormElements.type,
    event: filterPanelFormElements.event,
  });
  const [showFilters, setShowFilters] = useState(false);
  const locations = useGetAllLocations();
  const [tableKey, setTableKey] = useState(0);
  const mapNotificationToRow = (notification: Notification) => ({
    ...notification,
    createdBy: getItem(notification?.createdBy, users)?.name ?? "",
    formattedDate: format(new Date(notification.createdAt), "dd-MM-yyyy"),
    hour: format(new Date(notification.createdAt), "HH:mm"),
  });
  type NotificationRow = ReturnType<typeof mapNotificationToRow>;
  const allRows = notifications.map(mapNotificationToRow);
  const [rows, setRows] = useState<NotificationRow[]>(allRows);
  const columns = [
    { key: t("Date"), isSortable: true },
    { key: t("Created At"), isSortable: true },
    { key: t("Message"), isSortable: true },
    { key: t("Type"), isSortable: true },
    { key: t("Triggered Event"), isSortable: true },
  ];
  const rowKeys = [
    { key: "formattedDate" },
    { key: "hour" },
    {
      key: "message",
      node: (row: NotificationRow) => {
        return (
          <p
            className="rounded-md text-sm ml-2 px-2 py-1 "
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
    {
      key: "type",
      node: (row: NotificationRow) => {
        const type = row?.type as NotificationType | undefined;
        const solidColor = type ? NotificationColors[type] : undefined;
        const icon = type ? typeIconMap[type] : null;
        const tooltipContent = (
          <div className="flex flex-col gap-1  text-[11px] sm:text-xs">
            <span className="font-semibold text-gray-800">
              {t("Notification Type")}
            </span>
            <span className="text-gray-600">{type ? t(type) : "-"}</span>
          </div>
        );

        return (
          <CustomTooltip content={tooltipContent}>
            <div
              className="flex  h-10 w-10 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-gray-200 shadow-sm"
              style={{
                backgroundColor: solidColor ? `${solidColor}15` : "#F1F5F9",
                color: solidColor ?? "#0F172A",
              }}
            >
              {icon ?? <MdInfo className={typeIconClass} />}
            </div>
          </CustomTooltip>
        );
      },
    },
    {
      key: "event",
      node: (row: NotificationRow) => {
        if (!row?.event) {
          return <span className="text-xs text-gray-400">-</span>;
        }
        const eventColors = NotificationEventColors[row.event] ?? null;
        const fallbackColor =
          NotificationColors[row.type as NotificationType] ?? "#64748B";
        const badgeColor = eventColors?.solid ?? fallbackColor;

        return (
          <span
            className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] sm:text-xs font-semibold shadow-sm"
            style={{
              backgroundColor: badgeColor,
              color: "#FFFFFF",
            }}
          >
            {t(row.event)}
          </span>
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
      additionalOnChange: ({ value }: { value: string; label: string }) => {
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
