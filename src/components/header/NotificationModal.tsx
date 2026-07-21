import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";
import { tr } from "date-fns/locale";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { IoNavigate } from "react-icons/io5";
import {
  MdCheckBox,
  MdCheckCircle,
  MdError,
  MdInfo,
  MdOutlineCheckBoxOutlineBlank,
  MdShoppingCart,
  MdWarning,
} from "react-icons/md";
import { useNavigate } from "react-router-dom";
import {
  Notification,
  NotificationColors,
  NotificationEventColors,
  NotificationType,
  OptionType,
} from "../../types";
import {
  useGetUserNewNotifications,
  useMarkAsReadMutation,
} from "../../utils/api/notification";
import { useGetUser } from "../../utils/api/user";
import { getNotificationLanguageMessage } from "../../utils/notification";
import SelectInput from "../panelComponents/FormElements/SelectInput";

const OTHER_EVENT_KEY = "OTHER";

const NotificationModal = ({ onClose }: { onClose: () => void }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useGetUser();
  const notifications = useGetUserNewNotifications();
  const { mutate: markAsRead } = useMarkAsReadMutation();
  const modalRef = useRef<HTMLDivElement | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [eventFilters, setEventFilters] = useState<string[]>([]);

  useEffect(() => {
    if ((notifications?.length ?? 0) === 0) {
      setSelectedIds([]);
    }
  }, [notifications?.length]);

  const handleEventFiltersChange = (values: string[]) => {
    setEventFilters(values);
    setSelectedIds([]);
  };

  const eventSelectOptions: OptionType[] = useMemo(() => {
    const counts = new Map<string, number>();
    notifications?.forEach((notification) => {
      const key = notification.event ?? OTHER_EVENT_KEY;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });

    return Array.from(counts.entries())
      .sort(([, a], [, b]) => b - a)
      .map(([event, count]) => ({
        value: event,
        label: `${event === OTHER_EVENT_KEY ? t("Other") : t(event)} (${count})`,
      }));
  }, [notifications, t]);

  const filteredNotifications = useMemo(() => {
    if (eventFilters.length === 0) return notifications ?? [];
    return (notifications ?? []).filter((n) =>
      eventFilters.includes(n.event ?? OTHER_EVENT_KEY)
    );
  }, [notifications, eventFilters]);

  const handleMarkSelectedAsRead = () => {
    if (selectedIds.length === 0) return;
    markAsRead(selectedIds, {
      onSettled: () => {
        setSelectedIds([]);
      },
    });
  };

  const handleSelectAll = () => {
    if (filteredNotifications.length === 0) return;
    if (eventFilters.length === 0) {
      setSelectedIds([-1]);
    } else {
      setSelectedIds(filteredNotifications.map((n) => n._id));
    }
  };

  const toggleSelection = (notificationId: number) => {
    setSelectedIds((prev) => {
      if (prev.includes(-1)) {
        const allIds = filteredNotifications.map((n) => n._id);
        return allIds.filter((id) => id !== notificationId);
      }

      return prev.includes(notificationId)
        ? prev.filter((id) => id !== notificationId)
        : [...prev, notificationId];
    });
  };

  const getTypeIcon = (type: NotificationType) => {
    const iconClass = "text-lg sm:text-xl";
    switch (type) {
      case NotificationType.INFORMATION:
        return <MdInfo className={iconClass} />;
      case NotificationType.WARNING:
        return <MdWarning className={iconClass} />;
      case NotificationType.ERROR:
        return <MdError className={iconClass} />;
      case NotificationType.SUCCESS:
        return <MdCheckCircle className={iconClass} />;
      case NotificationType.ORDER:
        return <MdShoppingCart className={iconClass} />;
      default:
        return <MdInfo className={iconClass} />;
    }
  };

  const groupedNotifications = useMemo(() => {
    const today: Notification[] = [];
    const yesterday: Notification[] = [];
    const older: Notification[] = [];

    filteredNotifications.forEach((notification) => {
      const date = new Date(notification.createdAt);
      if (isToday(date)) {
        today.push(notification);
      } else if (isYesterday(date)) {
        yesterday.push(notification);
      } else {
        older.push(notification);
      }
    });

    return { today, yesterday, older };
  }, [filteredNotifications]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !event.composedPath().includes(modalRef.current)
      ) {
        onClose();
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [onClose]);

  const renderNotification = (notification: Notification) => {
    const eventColors = notification.event
      ? NotificationEventColors[notification.event]
      : null;

    const solidColor =
      eventColors?.solid ||
      NotificationColors[notification.type as NotificationType] ||
      "#CCCCCC";

    const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
      addSuffix: true,
      locale: tr,
    });

    return (
      <div
        key={notification._id + (user?.language ?? "")}
        className="group relative grid grid-cols-[auto,1fr] sm:grid-cols-[auto,1fr,auto] gap-3 rounded-xl px-4 py-3 transition-all duration-200 hover:shadow-lg hover:scale-[1.01] cursor-pointer bg-white border border-gray-200 hover:border-gray-300"
        onClick={(e) => {
          e.stopPropagation();
          toggleSelection(notification._id);
        }}
      >
        <div
          className="flex items-center justify-center w-11
           h-11 rounded-lg cursor-help flex-shrink-0 self-center"
          style={{
            backgroundColor: solidColor + "5",
            color: solidColor,
          }}
          title={t(notification.type)}
        >
          {getTypeIcon(notification.type as NotificationType)}
        </div>

        <div className="flex flex-col gap-2 justify-center">
          {notification.event && (
            <div
              className="inline-flex justify-between  w-fit gap-4 items-center self-start px-2 py-0.5 rounded font-medium text-[11px] sm:text-xs"
              style={{
                backgroundColor: solidColor,
                color: "white",
              }}
            >
              <span>{t(notification.event)}</span>
              {typeof notification?.message === "object" &&
                notification.message.params?.navigate && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();

                      if (
                        typeof notification?.message === "object" &&
                        notification.message.params?.navigate
                      ) {
                        navigate(notification.message.params.navigate);
                        onClose();
                      } else {
                        console.warn("Navigate path is undefined or invalid.");
                      }
                    }}
                  >
                    <IoNavigate className="text-lg sm:text-xl text-blue-500 " />
                  </button>
                )}
            </div>
          )}

          {notification.message && (
            <div className="text-gray-700 text-xs sm:text-sm leading-relaxed">
              {getNotificationLanguageMessage(user?.language, notification)}
            </div>
          )}

          <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
            <span>📅</span>
            <span>
              {format(new Date(notification.createdAt), "dd MMMM yyyy, HH:mm", {
                locale: tr,
              })}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 col-span-2 sm:col-span-1 sm:flex-col sm:items-end sm:justify-center sm:gap-2">
          <span className="text-xs text-gray-500 whitespace-nowrap font-medium">
            {timeAgo}
          </span>
          {selectedIds.includes(notification._id) ||
          selectedIds.includes(-1) ? (
            <MdCheckBox
              className="text-blue-500 text-xl cursor-pointer hover:scale-110 transition-all"
              title={t("Unselect")}
            />
          ) : (
            <MdOutlineCheckBoxOutlineBlank
              className="text-gray-400 hover:text-blue-500 text-xl cursor-pointer hover:scale-110 transition-all"
              title={t("Select")}
            />
          )}
        </div>
      </div>
    );
  };

  const renderGroupTitle = (title: string) => (
    <div className="flex items-center gap-2 px-1 py-1">
      <span className="text-xs sm:text-sm font-bold text-gray-700">
        {title}
      </span>
      <div className="flex-1 h-px bg-gray-300"></div>
    </div>
  );

  return (
    <div
      ref={modalRef}
      className="flex flex-col gap-3 max-h-[85vh] sm:max-h-[80vh]"
    >
      <div className="flex items-center justify-between gap-2 sm:gap-3 px-1 flex-wrap">
        <h3 className="text-base sm:text-lg font-bold text-gray-800 flex items-center gap-2 min-w-0 flex-shrink">
          <span>🔔</span>
          <span className="truncate">{t("Notifications")}</span>
          {(notifications?.length ?? 0) > 0 && (
            <span className="text-xs sm:text-sm font-semibold text-gray-600 flex-shrink-0">
              ({filteredNotifications.length})
            </span>
          )}
        </h3>
        {(notifications?.length ?? 0) > 0 && (
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {selectedIds.length === 0 ? (
              <>
                <button
                  onClick={() => {
                    navigate("/notifications?tab=all-notifications");
                    onClose();
                  }}
                  className="text-[10px] sm:text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline transition-all whitespace-nowrap"
                >
                  {t("All Notifications")}
                </button>
                <button
                  onClick={handleSelectAll}
                  className="text-[10px] sm:text-sm font-medium transition-all whitespace-nowrap px-2 sm:px-3 py-0.5 sm:py-1 rounded-md border border-blue-200 text-blue-600 hover:bg-blue-50"
                >
                  {t("Select all")}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleMarkSelectedAsRead}
                  className="text-[10px] sm:text-sm font-medium transition-all whitespace-nowrap px-2 sm:px-3 py-0.5 sm:py-1 rounded-md bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                >
                  {t("Mark as read")} (
                  {selectedIds.includes(-1)
                    ? notifications?.length ?? 0
                    : selectedIds.length}
                  )
                </button>
                <button
                  onClick={() => setSelectedIds([])}
                  className="text-[10px] sm:text-sm font-medium transition-all whitespace-nowrap px-2 sm:px-3 py-0.5 sm:py-1 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50"
                >
                  {t("Cancel")}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {eventSelectOptions.length > 1 && (
        <div className="px-1">
          <SelectInput
            isMultiple
            options={eventSelectOptions}
            value={eventSelectOptions.filter((option) =>
              eventFilters.includes(option.value)
            )}
            placeholder={t("All")}
            onChange={(selected) => {
              const values = (selected as OptionType[]).map(
                (option) => option.value
              );
              handleEventFiltersChange(values);
            }}
            isSortDisabled
            isAutoFill={false}
          />
        </div>
      )}

      <div className="flex flex-col gap-3 overflow-y-auto no-scrollbar pr-1">
        {filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-center">
            <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">🔔</div>
            <p className="text-sm sm:text-base font-semibold text-gray-700 mb-1">
              {(notifications?.length ?? 0) === 0
                ? t("No new notifications")
                : t("No notifications in this category")}
            </p>
            <p className="text-xs sm:text-sm text-gray-500">
              {t("You're all caught up!")}
            </p>
          </div>
        ) : (
          <>
            {groupedNotifications.today.length > 0 && (
              <div className="flex flex-col gap-2">
                {renderGroupTitle(t("Today"))}
                {groupedNotifications.today.map(renderNotification)}
              </div>
            )}

            {groupedNotifications.yesterday.length > 0 && (
              <div className="flex flex-col gap-2">
                {renderGroupTitle(t("Yesterday"))}
                {groupedNotifications.yesterday.map(renderNotification)}
              </div>
            )}

            {groupedNotifications.older.length > 0 && (
              <div className="flex flex-col gap-2">
                {renderGroupTitle(t("Earlier"))}
                {groupedNotifications.older.map(renderNotification)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default NotificationModal;
