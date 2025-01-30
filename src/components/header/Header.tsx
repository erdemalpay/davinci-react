import { MdOutlineNotificationsNone } from "react-icons/md";
import { Link } from "react-router-dom";
import user1 from "../../components/panelComponents/assets/profile/user-1.jpg";
import { useGeneralContext } from "../../context/General.context";
import { Routes } from "../../navigation/constants";
import { useGetUserNewNotifications } from "../../utils/api/notification";
import { useGetUser } from "../../utils/api/user";
import { LocationSelector } from "./LocationSelector";
import logo from "./logo.svg";
import NotificationModal from "./NotificationModal";
import { PageSelector } from "./PageSelector";

interface HeaderProps {
  showLocationSelector?: boolean;
  allowedLocations?: number[];
}

export function Header({
  showLocationSelector = true,
  allowedLocations,
}: HeaderProps) {
  const user = useGetUser();
  const notifications = useGetUserNewNotifications();
  const { isNotificationOpen, setIsNotificationOpen } = useGeneralContext();
  const handleScrollToTop = () => {
    if (location.pathname === Routes.Tables) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="sticky top-0 z-50">
      <nav className="w-full bg-gray-800 shadow">
        <div className="px-2 lg:px-6 h-16 flex justify-between mx-2 lg:mx-20">
          <div className="flex flex-row gap-8 items-center">
            <Link to={Routes.Tables} onClick={handleScrollToTop}>
              <img
                src={logo}
                alt="profile"
                className="w-10 h-10 rounded-full"
              />
            </Link>
            <Link to={Routes.Tables} className="hidden sm:block">
              <span className="text-base text-white font-bold tracking-normal leading-tight">
                Da Vinci Panel
              </span>
            </Link>
          </div>
          <div className="w-auto h-full flex items-center justify-end gap-x-2 sm:gap-x-4">
            <Link to={Routes.Profile}>
              <img
                src={user?.imageUrl ?? user1}
                alt="profile"
                className="w-10 h-10 rounded-full"
              />
            </Link>
            {showLocationSelector && (
              <LocationSelector allowedLocations={allowedLocations} />
            )}
            <div
              onClick={(e) => {
                e.stopPropagation();
                setIsNotificationOpen(!isNotificationOpen);
              }}
              className="relative cursor-pointer hover:scale-105"
            >
              <MdOutlineNotificationsNone className="text-2xl text-white " />
              {notifications.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-white  text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border ">
                  {notifications.length}
                </span>
              )}
            </div>
            {isNotificationOpen && (
              <div className="absolute top-12 right-2 flex flex-col gap-2 bg-white rounded-md py-4 px-2 mx-auto border-t border-gray-200 drop-shadow-lg z-10 min-w-64 max-w-[90%] sm:max-w-[40%]">
                <NotificationModal
                  onClose={() => {
                    setIsNotificationOpen(false);
                  }}
                />
              </div>
            )}

            <span className="text-white ml-2">{user?.name}</span>
            <PageSelector />
          </div>
        </div>
      </nav>
    </div>
  );
}
