import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useUserContext } from "../../context/User.context";
import {
  Notification,
  NotificationColors,
  NotificationEventColors,
  NotificationType,
  notificationEventsOptions,
} from "../../types";
import { useGetAllLocations } from "../../utils/api/location";
import {
  useGetEventNotifications,
  useToggleNotificationMuteMutation,
} from "../../utils/api/notification";
import { useGetUserWithId } from "../../utils/api/user";
import { getItem } from "../../utils/getItem";
import { isTargetedBy } from "../../utils/notification";
import { getNotificationTypeIcon } from "../../utils/notificationIcons";
import GenericTable from "../panelComponents/Tables/GenericTable";
import SwitchButton from "../panelComponents/common/SwitchButton";

type Props = {
  targetUserId: string;
  isManagerView: boolean;
};

const typeIconClass = "text-sm sm:text-base h-6 w-6";

const NotificationPreferences = ({ targetUserId, isManagerView }: Props) => {
  const { t } = useTranslation();
  const { user: panelUser } = useUserContext();
  const targetUser = useGetUserWithId(targetUserId);
  const notifications = useGetEventNotifications();
  const locations = useGetAllLocations();
  const { mutate: toggleMute } = useToggleNotificationMuteMutation();

  const rows = useMemo(() => {
    if (!targetUser) return [] as Notification[];
    return notifications
      .filter((n) => n.isActive)
      .filter((n) => isTargetedBy(targetUser._id, targetUser.role._id, n));
  }, [notifications, targetUser]);

  const handleToggle = (notification: Notification, currentlyOn: boolean) => {
    const effectiveUserId = isManagerView ? targetUserId : panelUser?._id;
    if (!effectiveUserId) return;
    toggleMute({
      id: notification._id,
      userId: effectiveUserId,
      mute: currentlyOn,
    });
  };

  const renderLocationNames = (notification: Notification) => {
    const locIds = notification.selectedLocations ?? [];
    if (locIds.length === 0) return t("All Locations");
    return (
      locIds
        .map((id) => getItem(id, locations)?.name)
        .filter(Boolean)
        .join(", ") || t("All Locations")
    );
  };

  const renderEventLabel = (eventValue: string | undefined) => {
    if (!eventValue) return "";
    const opt = notificationEventsOptions.find((o) => o.value === eventValue);
    return opt ? t(opt.label) : eventValue;
  };

  const columns = useMemo(
    () => [
      { key: t("Type"), isSortable: false },
      { key: t("Triggered Event"), isSortable: false },
      { key: t("Location"), isSortable: false },
      { key: t("Status"), isSortable: false },
    ],
    [t]
  );

  const rowKeys = useMemo(
    () => [
      {
        key: "type",
        node: (row: Notification) => {
          const type = row?.type as NotificationType | undefined;
          const solidColor = type ? NotificationColors[type] : undefined;
          return (
            <div
              className="flex h-10 w-10 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-gray-200 shadow-sm"
              style={{
                backgroundColor: solidColor ? `${solidColor}15` : "#F1F5F9",
                color: solidColor ?? "#0F172A",
              }}
              title={type ? t(type) : "-"}
            >
              {getNotificationTypeIcon(type, typeIconClass)}
            </div>
          );
        },
      },
      {
        key: "event",
        node: (row: Notification) => {
          if (!row?.event) {
            return <span className="text-xs text-gray-400">-</span>;
          }
          const eventColors = NotificationEventColors[row.event] ?? null;
          const badgeColor =
            eventColors?.solid ??
            NotificationColors[row.type as NotificationType] ??
            "#64748B";
          return (
            <span
              className="w-fit rounded-md text-sm px-2 py-1 font-semibold"
              style={{ backgroundColor: badgeColor, color: "#FFFFFF" }}
            >
              {renderEventLabel(row.event)}
            </span>
          );
        },
      },
      {
        key: "location",
        node: (row: Notification) => (
          <span className="text-sm text-gray-700">
            {renderLocationNames(row)}
          </span>
        ),
      },
      {
        key: "mute",
        node: (row: Notification) => {
          const isOn = !(row.mutedBy ?? []).includes(targetUserId);
          return (
            <SwitchButton
              checked={isOn}
              onChange={() => handleToggle(row, isOn)}
            />
          );
        },
      },
    ],
    [t, targetUserId, locations]
  );

  if (!targetUser) return <></>;

  return (
    <div className="w-[95%] mx-auto ">
      <GenericTable
        rowKeys={rowKeys}
        columns={columns}
        rows={rows}
        title={t("Notification Preferences")}
        isActionsActive={false}
        isToolTipEnabled={false}
      />
    </div>
  );
};

export default NotificationPreferences;
