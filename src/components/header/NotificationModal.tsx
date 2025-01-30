import { format } from "date-fns";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { NotificationType } from "../../types";
import { useGetUserNewNotifications } from "../../utils/api/notification";
const NotificationModal = ({ onClose }: { onClose: () => void }) => {
  const { t } = useTranslation();
  const notifications = useGetUserNewNotifications();
  const modalRef = useRef<HTMLDivElement | null>(null);
  if (!notifications) return null;
  const NotificationBackgroundColors: Record<NotificationType, string> = {
    [NotificationType.INFORMATION]: "#79a8ce",
    [NotificationType.WARNING]: "#e8c185",
    [NotificationType.ERROR]: "#e56d64",
    [NotificationType.SUCCESS]: "#92e895",
    [NotificationType.ORDER]: "#de8dec",
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [onClose]);
  return (
    <div
      ref={modalRef}
      className="flex flex-col gap-2  overflow-auto no-scrollbar "
    >
      {/* header */}
      <div className="text-lg font-bold">{t("Notifications")}</div>
      {/* notifications */}
      <div className="flex flex-col gap-2 overflow-auto no-scrollbar max-h-[80vh]">
        {notifications.map((notification) => (
          <div
            key={notification._id}
            className="flex flex-col gap-0.5 border-b border-b-slate-200 py-1 rounded-md px-2  "
            style={{
              backgroundColor:
                NotificationBackgroundColors[
                  notification.type as NotificationType
                ] || "#CCCCCC",
            }}
          >
            {/* date and mark as read */}
            <div className="flex flex-row justify-between gap-2">
              {/* date */}
              <p className="text-white text-sm">
                {format(notification.createdAt, "dd-MM-yyyy")}
              </p>
              {/* mark as read */}
            </div>

            {/* message */}
            <div className="text-sm   rounded-md text-white ">
              {notification.message}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationModal;
