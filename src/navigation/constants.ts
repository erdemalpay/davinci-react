import Analytics from "../pages/Analytics";
import Gameplays from "../pages/Gameplays";
import GameplaysByGame from "../pages/GameplaysByGame";
import GameplaysByMentor from "../pages/GameplaysByMentor";
import Games from "../pages/Games";
import Memberships from "../pages/Memberships";
import Menu from "../pages/Menu";
import Profile from "../pages/Profile";
import Reservations from "../pages/Reservations";
import Rewards from "../pages/Rewards";
import Tables from "../pages/Tables";
import Users from "../pages/Users";
import Visits from "../pages/Visits";
import { RolePermissionEnum } from "../types";

export enum PublicRoutes {
  NotFound = "*",
  Login = "/login",
}

export enum Routes {
  Games = "/games",
  Memberships = "/memberships",
  Reservations = "/reservations",
  Rewards = "/rewards",
  Tables = "/tables",
  Visits = "/visits",
  Menu = "/menu",
  User = "/user/:userId",
  Users = "/users",
  Analytics = "/analytics",
  Gameplays = "/gameplays",
  GameplaysByGame = "/gameplays-by-game",
  GameplaysByMentor = "/gameplays-by-mentor",
  Profile = "/profile",
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
    { name: "Profile", path: Routes.Profile, element: Profile },

    {
      name: "Analytics",
      path: Routes.Analytics,
      element: Analytics,
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
  [RolePermissionEnum.MANAGEMENT]: [
    {
      name: "Menu",
      path: Routes.Menu,
      element: Menu,
    },

    {
      name: "Users",
      path: Routes.Users,
      element: Users,
    },
  ],
};

export const NO_IMAGE_URL =
  "https://res.cloudinary.com/dvbg/image/upload/ar_4:4,c_crop/c_fit,h_100/davinci/no-image_pyet1d.jpg";
