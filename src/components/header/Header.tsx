import { Link } from "react-router-dom";
import user1 from "../../components/panelComponents/assets/profile/user-1.jpg";
import { useUserContext } from "../../context/User.context";
import { Routes } from "../../navigation/constants";
import { LocationSelector } from "./LocationSelector";
import { PageSelector } from "./PageSelector";
import logo from "./logo.svg";
interface HeaderProps {
  showLocationSelector?: boolean;
}

export function Header({ showLocationSelector = true }: HeaderProps) {
  const { user } = useUserContext();

  return (
    <div className="sticky top-0 z-50">
      <nav className="w-full bg-gray-800 shadow">
        <div className="px-2 lg:px-6 h-16 flex justify-between mx-2 lg:mx-20">
          <div className="flex flex-row gap-8 items-center">
            <Link to={Routes.Tables}>
              <img
                src={logo}
                alt="profile"
                className="w-10 h-10 rounded-full"
              />
            </Link>
            <Link to={Routes.Tables}>
              <span className="text-base text-white font-bold tracking-normal leading-tight">
                Da Vinci Panel
              </span>
            </Link>
          </div>
          <div className="w-auto h-full flex items-center justify-end gap-x-4">
            <Link to={Routes.Profile}>
              <img
                src={user?.imageUrl ?? user1}
                alt="profile"
                className="w-10 h-10 rounded-full"
              />
            </Link>
            {showLocationSelector && <LocationSelector />}
            <span className="text-white ml-2">{user?.name}</span>
            <PageSelector />
          </div>
        </div>
      </nav>
    </div>
  );
}
