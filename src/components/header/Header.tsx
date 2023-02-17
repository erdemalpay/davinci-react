import { ArrowLeftOnRectangleIcon } from "@heroicons/react/24/outline";
import { ChatBubbleBottomCenterTextIcon } from "@heroicons/react/24/solid";
import { Tooltip } from "@material-tailwind/react";
import Cookies from "js-cookie";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUserContext } from "../../context/User.context";
import { BaseRoutes } from "../../navigation/routes";
import { LocationSelector } from "./LocationSelector";
import { PageSelector } from "./PageSelector";

interface HeaderProps {
  showLocationSelector?: boolean;
}

export function Header({ showLocationSelector = true }: HeaderProps) {
  const [show, setShow] = useState(false);
  const navigate = useNavigate();
  const { user } = useUserContext();

  function logout() {
    Cookies.remove("jwt");
    navigate("/login");
  }

  return (
    <div className="sticky top-0 z-50">
      <nav className="w-full bg-gray-800 shadow">
        <div className="px-2 lg:px-6 h-16 flex justify-between mx-2 lg:mx-20">
          <div className="flex items-center">
            <Link to={BaseRoutes.Tables}>
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
          <div className="hidden items-center relative">
            <ul className="p-2 w-64 border-r bg-white absolute top-0 -ml-2 rounded right-0 shadow mt-12 hidden">
              <li className="cursor-pointer text-gray-600 text-sm leading-3 tracking-normal py-2 hover:text-indigo-700 focus:text-indigo-700 focus:outline-none">
                <div className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="icon icon-tabler icon-tabler-user"
                    width={20}
                    height={20}
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path stroke="none" d="M0 0h24v24H0z" />
                    <circle cx={12} cy={7} r={4} />
                    <path d="M6 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" />
                  </svg>
                  <span className="ml-2">Profile</span>
                </div>
              </li>
              <li className="flex xl:hidden cursor-pointer text-gray-600 text-sm leading-3 tracking-normal mt-2 py-2 hover:text-indigo-700 focus:text-indigo-700 focus:outline-none">
                <div className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="icon icon-tabler icon-tabler-grid"
                    width={20}
                    height={20}
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path stroke="none" d="M0 0h24v24H0z" />
                    <rect x={4} y={4} width={6} height={6} rx={1} />
                    <rect x={14} y={4} width={6} height={6} rx={1} />
                    <rect x={4} y={14} width={6} height={6} rx={1} />
                    <rect x={14} y={14} width={6} height={6} rx={1} />
                  </svg>
                  <span className="ml-2">Dashboard</span>
                </div>
              </li>
              <li className="xl:hidden  cursor-pointer text-gray-600 text-sm leading-3 tracking-normal mt-2 py-2 hover:text-indigo-700 focus:text-indigo-700 focus:outline-none flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="icon icon-tabler icon-tabler-help"
                  width={20}
                  height={20}
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path stroke="none" d="M0 0h24v24H0z" />
                  <circle cx={12} cy={12} r={9} />
                  <line x1={12} y1={17} x2={12} y2="17.01" />
                  <path d="M12 13.5a1.5 1.5 0 0 1 1 -1.5a2.6 2.6 0 1 0 -3 -4" />
                </svg>
                <span className="ml-2">Products</span>
              </li>
              <li className="flex xl:hidden cursor-pointer text-gray-600 text-sm leading-3 tracking-normal mt-2 py-2 hover:text-indigo-700 items-center focus:text-indigo-700 focus:outline-none">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="icon icon-tabler icon-tabler-settings"
                  width={20}
                  height={20}
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path stroke="none" d="M0 0h24v24H0z" />
                  <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <circle cx={12} cy={12} r={3} />
                </svg>
                <span className="ml-2">Performance</span>
              </li>
            </ul>
            <div className="xl:hidden" onClick={() => setShow(!show)}>
              <svg
                aria-label="Main Menu"
                aria-haspopup="true"
                xmlns="http://www.w3.org/2000/svg"
                className="icon icon-tabler icon-tabler-menu"
                width={32}
                height={32}
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="#fff"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path stroke="none" d="M0 0h24v24H0z" />
                <line x1={4} y1={8} x2={20} y2={8} />
                <line x1={4} y1={16} x2={20} y2={16} />
              </svg>
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
}
