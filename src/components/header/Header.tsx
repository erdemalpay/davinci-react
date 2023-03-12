import { ArrowLeftOnRectangleIcon } from "@heroicons/react/24/outline";
import { ChatBubbleBottomCenterTextIcon } from "@heroicons/react/24/solid";
import { Tooltip } from "@material-tailwind/react";
import Cookies from "js-cookie";
import { Link, useNavigate } from "react-router-dom";
import { useUserContext } from "../../context/User.context";
import { Routes } from "../../navigation/constants";
import { LocationSelector } from "./LocationSelector";
import { PageSelector } from "./PageSelector";

interface HeaderProps {
  showLocationSelector?: boolean;
}

export function Header({ showLocationSelector = true }: HeaderProps) {
  const navigate = useNavigate();
  const { user, setUser } = useUserContext();

  function logout() {
    Cookies.remove("jwt");
    setUser(undefined);
    navigate("/login");
  }

  return (
    <div className="sticky top-0 z-50">
      <nav className="w-full bg-gray-800 shadow">
        <div className="px-2 lg:px-6 h-16 flex justify-between mx-2 lg:mx-20">
          <div className="flex items-center">
            <Link to={Routes.Tables}>
              <span className="text-base text-white font-bold tracking-normal leading-tight">
                Da Vinci Panel
              </span>
            </Link>
          </div>
          <div className="w-auto h-full flex items-center justify-end gap-x-4">
            {showLocationSelector && <LocationSelector />}
            <Tooltip content="Feedback" placement="bottom">
              <a
                href="https://feedback.davinciboardgame.com"
                target="_blank"
                rel="noreferrer"
                className="focus:outline-none text-white text-sm rounded-sm flex gap-2"
              >
                {<ChatBubbleBottomCenterTextIcon className="h-5 w-5" />}
              </a>
            </Tooltip>
            <PageSelector />
            <span className="text-white ml-2">{user?.name}</span>
            <Tooltip content="Logout" placement="bottom">
              <button onClick={logout} className=" text-white">
                <ArrowLeftOnRectangleIcon className="h-5 w-5" />
              </button>
            </Tooltip>
          </div>
        </div>
      </nav>
    </div>
  );
}
