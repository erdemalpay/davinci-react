import { Link } from "react-router-dom";
import user1 from "../../components/panelComponents/assets/profile/user-1.jpg";
import { Routes } from "../../navigation/constants";
import { useGetUser } from "../../utils/api/user";
import { LocationSelector } from "./LocationSelector";
import { PageSelector } from "./PageSelector";
import logo from "./logo.svg";

interface HeaderProps {
  showLocationSelector?: boolean;
  allowedLocations?: number[];
}

export function Header({
  showLocationSelector = true,
  allowedLocations,
}: HeaderProps) {
  const user = useGetUser();
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
            <span className="text-white ml-2">{user?.name}</span>
            <PageSelector />
          </div>
        </div>
      </nav>
    </div>
  );
}
