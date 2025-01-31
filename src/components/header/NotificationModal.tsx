import { format } from "date-fns";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { MdOutlineCheckBoxOutlineBlank } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { useGeneralContext } from "../../context/General.context";
import { ProfileTabEnum } from "../../pages/Profile";
import { NotificationBackgroundColors, NotificationType } from "../../types";
import {
  useGetUserNewNotifications,
  useMarkAsReadMutation,
} from "../../utils/api/notification";
const NotificationModal = ({ onClose }: { onClose: () => void }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const notifications = useGetUserNewNotifications();
  const { setProfileActiveTab } = useGeneralContext();
  const { mutate: markAsRead } = useMarkAsReadMutation();
  const modalRef = useRef<HTMLDivElement | null>(null);
  if (!notifications) return null;

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
      <div className="flex flex-row justify-between">
        <p className="text-lg font-bold">{t("Notifications")}</p>
        <button
          onClick={() => {
            setProfileActiveTab(ProfileTabEnum.NOTIFICATIONS);
            navigate("/profile");
            onClose();
          }}
          className="text-sm text-blue-500 hover:scale-105 pr-2"
        >
          {t("All Notifications")}
        </button>
      </div>
      {/* notifications */}
      <div className="flex flex-col gap-2 overflow-auto no-scrollbar max-h-[80vh]">
        {notifications?.map((notification) => (
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
            <div className="flex flex-row justify-between gap-2 ">
              {/* date */}
              <p className="text-white text-sm">
                {format(notification.createdAt, "dd-MM-yyyy")}
              </p>
              {/* mark as read */}
              <MdOutlineCheckBoxOutlineBlank
                onClick={() => {
                  markAsRead(notification._id);
                }}
                className="my-auto text-white text-2xl cursor-pointer hover:scale-105"
              />
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
