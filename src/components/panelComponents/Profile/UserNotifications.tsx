import { format, startOfYear } from "date-fns";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  MdCheckCircle,
  MdError,
  MdInfo,
  MdShoppingCart,
  MdWarning,
} from "react-icons/md";
import { useUserContext } from "../../../context/User.context";
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
import { useGetUserAllNotifications } from "../../../utils/api/notification";
import { useGetUsers } from "../../../utils/api/user";
import { getItem } from "../../../utils/getItem";
import { getNotificationLanguageMessage } from "../../../utils/notification";
import GenericTable from "../Tables/GenericTable";
import CustomTooltip from "../Tables/Tooltip";
import SwitchButton from "../common/SwitchButton";
import { InputTypes } from "../shared/types";

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
  const { user } = useUserContext();
  const users = useGetUsers();
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
  const mapNotificationToRow = (notification: Notification) => ({
    ...notification,
    createdBy: getItem(notification?.createdBy, users)?.name ?? "",
    formattedDate: format(new Date(notification.createdAt), "dd-MM-yyyy"),
    hour: format(new Date(notification.createdAt), "HH:mm"),
  });
  type NotificationRow = ReturnType<typeof mapNotificationToRow>;

  const rows = useMemo(() => {
    return notifications.map(mapNotificationToRow);
  }, [notifications, users]);

  const columns = useMemo(
    () => [
      { key: t("Date"), isSortable: true },
      { key: t("Created At"), isSortable: true },
      { key: t("Message"), isSortable: true },
      { key: t("Type"), isSortable: true },
      { key: t("Triggered Event"), isSortable: true },
    ],
    [t]
  );

  const rowKeys = useMemo(
    () => [
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
              {getNotificationLanguageMessage(user?.language, row)}
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
              className={`w-fit rounded-md text-sm  px-2 py-1 font-semibold `}
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
    ],
    [t, user]
  );

  const filterPanelInputs = useMemo(
    () => [
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
    ],
    [t, filterPanelFormElements, setFilterPanelFormElements]
  );

  const filterPanel = useMemo(
    () => ({
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
    }),
    [
      showFilters,
      filterPanelInputs,
      filterPanelFormElements,
      setFilterPanelFormElements,
      initialFilterPanelFormElements,
    ]
  );

  const filters = useMemo(
    () => [
      {
        label: t("Show Filters"),
        isUpperSide: true,
        node: <SwitchButton checked={showFilters} onChange={setShowFilters} />,
      },
    ],
    [t, showFilters]
  );

  return (
    <>
      <div className="w-[95%] mx-auto ">
        <GenericTable
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
