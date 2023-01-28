import { useContext } from "react";
import { LocationContext } from "../../context/LocationContext";
import { Bars3Icon } from "@heroicons/react/24/outline";
import {
  Menu,
  MenuHandler,
  MenuList,
  MenuItem,
} from "@material-tailwind/react";
import { useNavigate } from "react-router-dom";

export function PageSelector() {
  const { selectedLocationId } = useContext(LocationContext);
  const navigate = useNavigate();

  const routes = [
    {
      name: "Tables",
      path: `/${selectedLocationId}`,
    },
    {
      name: "Reservations",
      path: `/${selectedLocationId}/reservations`,
    },
    {
      name: "Gameplays",
      path: "/gameplays",
    },
    {
      name: "Games",
      path: "/games",
    },
    {
      name: "Memberships",
      path: "/memberships",
    },
    {
      name: "Rewards",
      path: "/rewards",
    },
    {
      name: "Users",
      path: "/users",
    },
    {
      name: "Visits",
      path: "/visits",
    },
    {
      name: "Menu",
      path: "/menu",
    },
    {
      name: "Analytics",
      path: "/analytics",
    },
  ];

  return (
    <Menu>
      <MenuHandler>
        <button className="text-sm text-white">
          <Bars3Icon className="h-5 w-5" />
        </button>
      </MenuHandler>
      <MenuList>
        {routes.map((route) => (
          <MenuItem
            key={route.name}
            onClick={() => {
              navigate(route.path);
            }}
          >
            {route.name}
          </MenuItem>
        ))}
      </MenuList>
    </Menu>
  );
}
