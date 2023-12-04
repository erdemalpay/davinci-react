import Analytics from "../pages/Analytics";
import ChangePassword from "../pages/ChangePassword";
import Gameplays from "../pages/Gameplays";
import GameplaysByGame from "../pages/GameplaysByGame";
import GameplaysByMentor from "../pages/GameplaysByMentor";
import Games from "../pages/Games";
import Memberships from "../pages/Memberships";
import Menu from "../pages/Menu";
import Reservations from "../pages/Reservations";
import Rewards from "../pages/Rewards";
import Tables from "../pages/Tables";
import User from "../pages/User";
import Users from "../pages/Users";
import Visits from "../pages/Visits";
import { RolePermissionEnum } from "../types";

export enum PublicRoutes {
  NotFound = "*",
  Login = "/login",
}

export enum Routes {
  ChangePassword = "/change-password",
  Games = "/games",
  Memberships = "/memberships",
  Reservations = "/reservations",
  Rewards = "/rewards",
  Tables = "/tables",
  Visits = "/visits",
  Menu = "/menu",
  User = "/user/:user",
  Users = "/users",
  Analytics = "/analytics",
  Gameplays = "/gameplays",
  GameplaysByGame = "/gameplays-by-game",
  GameplaysByMentor = "/gameplays-by-mentor",
}

export const allRoutes: {
  [K in RolePermissionEnum]: {
    name: string;
    path: string;
    element: () => JSX.Element;
  }[];
} = {
  [RolePermissionEnum.OPERATION]: [
    {
      name: "Tables",
      path: Routes.Tables,
      element: Tables,
    },
    {
      name: "Reservations",
      path: Routes.Reservations,
      element: Reservations,
    },
    {
      name: "Games",
      path: Routes.Games,
      element: Games,
    },
    {
      name: "Gameplays",
      path: Routes.Gameplays,
      element: Gameplays,
    },
    {
      name: "Memberships",
      path: Routes.Memberships,
      element: Memberships,
    },
    {
      name: "Rewards",
      path: Routes.Rewards,
      element: Rewards,
    },
    {
      name: "Visits",
      path: Routes.Visits,
      element: Visits,
    },
    {
      name: "Change Password",
      path: Routes.ChangePassword,
      element: ChangePassword,
    },
    {
      name: "Analytics",
      path: Routes.Analytics,
      element: Analytics,
    },
  ],
  [RolePermissionEnum.MANAGEMENT]: [
    {
      name: "Menu",
      path: Routes.Menu,
      element: Menu,
    },
    {
      name: "User",
      path: Routes.User,
      element: User,
    },
    {
      name: "Users",
      path: Routes.Users,
      element: Users,
    },
    {
      name: "Gameplays By Games",
      path: Routes.GameplaysByGame,
      element: GameplaysByGame,
    },
    {
      name: "Gameplays By Mentor",
      path: Routes.GameplaysByMentor,
      element: GameplaysByMentor,
    },
  ],
};

export const NO_IMAGE_URL =
  "https://res.cloudinary.com/dvbg/image/upload/ar_4:4,c_crop/c_fit,h_100/davinci/no-image_pyet1d.jpg";
