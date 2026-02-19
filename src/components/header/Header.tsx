import { MdOutlineNotificationsNone } from "react-icons/md";
import { Link } from "react-router-dom";
import { DateInput } from "../common/DateInput2";
import user1 from "../../components/panelComponents/assets/profile/user-1.jpg";
import { useGeneralContext } from "../../context/General.context";
import { Routes } from "../../navigation/constants";
import { useGetUserNewNotifications } from "../../utils/api/notification";
import { useGetUser } from "../../utils/api/user";
import { BreakButton } from "./BreakButton";
import { LocationSelector } from "./LocationSelector";
import logo from "./logo.svg";
import NotificationModal from "./NotificationModal";
import { PageSelector } from "./PageSelector";

export interface HeaderDateProps {
  date: Date;
  setDate: (date: string) => void;
}

interface HeaderProps {
  showLocationSelector?: boolean;
  allowedLocations?: number[];
  dateProps?: HeaderDateProps;
}

export function Header({
  showLocationSelector = true,
  allowedLocations,
  dateProps,
}: HeaderProps) {
  const notifications = useGetUserNewNotifications();
  const { isNotificationOpen, setIsNotificationOpen } = useGeneralContext();
  const user = useGetUser();
  const handleScrollToTop = () => {
    if (location.pathname === Routes.Tables) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="sticky top-0 z-50">
      <nav className="w-full bg-gray-800 shadow">
        <div className={`${dateProps ? "h-12 sm:h-16" : "h-16"} flex justify-between pl-2 lg:pl-4 pr-2 lg:pr-6 mr-2 lg:mr-20`}>
          <div className="flex flex-row gap-2 items-center">
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
            <Link to={Routes.Profile} className="flex items-center gap-2">
              <img
                src={user?.imageUrl ?? user1}
                alt="profile"
                className="w-10 h-10 rounded-full"
              />
              <span className="text-white hidden sm:inline">{user?.name}</span>
            </Link>
            {showLocationSelector && (
              <LocationSelector allowedLocations={allowedLocations} />
            )}
            <BreakButton />
            {dateProps && (
              <div className="sm:hidden">
                <DateInput date={dateProps.date} setDate={dateProps.setDate} compact />
              </div>
            )}
            <div
              onClick={(e) => {
                e.stopPropagation();
                setIsNotificationOpen(!isNotificationOpen);
              }}
              className="relative cursor-pointer hover:scale-110 transition-transform duration-200"
            >
              <MdOutlineNotificationsNone className="text-2xl sm:text-3xl text-white" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1.5 bg-red-500 text-white text-xs font-bold min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full border-2 border-gray-800 shadow-lg ">
                  {notifications.length}
                </span>
              )}
            </div>
            {isNotificationOpen && (
              <div className="absolute top-14 sm:top-16 right-2 sm:right-4 lg:right-8 flex flex-col gap-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-[100] w-[95%] sm:w-[450px] lg:w-[480px] p-4">
                <NotificationModal
                  onClose={() => {
                    setIsNotificationOpen(false);
                  }}
                />
              </div>
            )}
            <div className="lg:hidden">
              <PageSelector />
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
}
