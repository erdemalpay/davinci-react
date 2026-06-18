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
import { CheckSwitch } from "../common/CheckSwitch";

type Props = {
  targetUserId: string;
  isManagerView: boolean;
};

const typeIconClass = "text-xl";

const NotificationPreferences = ({ targetUserId, isManagerView }: Props) => {
  const { t } = useTranslation();
  const { user: panelUser } = useUserContext();
  const targetUser = useGetUserWithId(targetUserId);
  const notifications = useGetEventNotifications();
  const locations = useGetAllLocations();

  const { mutate: toggleMute } = useToggleNotificationMuteMutation();

  const targetedNotifications = useMemo(() => {
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

  const renderLocationChip = (notification: Notification) => {
    const locIds = notification.selectedLocations ?? [];
    if (locIds.length === 0) {
      return (
        <span className="text-xs text-gray-500">{t("All Locations")}</span>
      );
    }
    const names = locIds
      .map((id) => getItem(id, locations)?.name)
      .filter(Boolean)
      .join(", ");
    return (
      <span className="text-xs text-gray-700 font-medium">
        📍 {names || t("All Locations")}
      </span>
    );
  };

  const renderEventLabel = (eventValue: string | undefined) => {
    if (!eventValue) return "";
    const opt = notificationEventsOptions.find((o) => o.value === eventValue);
    return opt ? t(opt.label) : eventValue;
  };

  if (!targetUser) return <></>;

  return (
    <div className="w-[95%] mx-auto flex flex-col gap-3 mt-2">
      <h3 className="text-base font-semibold text-gray-800">
        {t("Notification Preferences")}
      </h3>

      {targetedNotifications.length === 0 ? (
        <div className="flex items-center justify-center py-12 text-center text-sm text-gray-500 border border-dashed border-gray-300 rounded-lg">
          {t("No notification rules targeting this user")}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {targetedNotifications.map((notification) => {
            const muted = (notification.mutedBy ?? []).includes(targetUserId);
            const isOn = !muted;
            const eventColors = notification.event
              ? NotificationEventColors[notification.event]
              : null;
            const solidColor =
              eventColors?.solid ??
              NotificationColors[notification.type as NotificationType] ??
              "#64748B";
            return (
              <div
                key={notification._id}
                className="grid grid-cols-[auto,1fr,auto] gap-3 items-center bg-white border border-gray-200 rounded-lg px-4 py-3 hover:border-gray-300 transition-colors"
              >
                <div
                  className="flex items-center justify-center h-10 w-10 rounded-lg"
                  style={{
                    backgroundColor: solidColor + "20",
                    color: solidColor,
                  }}
                  title={t(notification.type)}
                >
                  {getNotificationTypeIcon(
                    notification.type as NotificationType,
                    typeIconClass
                  )}
                </div>
                <div className="flex flex-col gap-1 min-w-0">
                  <span
                    className="self-start inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold text-white"
                    style={{ backgroundColor: solidColor }}
                  >
                    {renderEventLabel(notification.event)}
                  </span>
                  {renderLocationChip(notification)}
                </div>
                <CheckSwitch
                  checked={isOn}
                  onChange={() => handleToggle(notification, isOn)}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NotificationPreferences;
