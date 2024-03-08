import Analytics from "../pages/Analytics";
import Gameplays from "../pages/Gameplays";
import GameplaysByGame from "../pages/GameplaysByGame";
import GameplaysByMentor from "../pages/GameplaysByMentor";
import Games from "../pages/Games";
import Memberships from "../pages/Memberships";
import Menu from "../pages/Menu";
import NewGames from "../pages/NewGame";
import NewReservations from "../pages/NewReservations";
import Profile from "../pages/Profile";
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
  NewGames = "/new-games",
  NewReservations = "/new-reservations",
}

export const allRoutes: {
  [K in RolePermissionEnum]: {
    name: string;
    path: string;
    isOnSidebar: boolean;
    element: () => JSX.Element;
  }[];
} = {
  [RolePermissionEnum.OPERATION]: [
    {
      name: "Tables",
      path: Routes.Tables,
      element: Tables,
      isOnSidebar: true,
    },
    {
      name: "Reservations",
      path: Routes.Reservations,
      element: Reservations,
      isOnSidebar: true,
    },
    {
      name: "NewReservations",
      path: Routes.NewReservations,
      element: NewReservations,
      isOnSidebar: true,
    },
    {
      name: "Games",
      path: Routes.Games,
      element: Games,
      isOnSidebar: true,
    },
    {
      name: "Newgames",
      path: Routes.NewGames,
      element: NewGames,
      isOnSidebar: true,
    },
    {
      name: "Gameplays",
      path: Routes.Gameplays,
      element: Gameplays,
      isOnSidebar: true,
    },
    {
      name: "Memberships",
      path: Routes.Memberships,
      element: Memberships,
      isOnSidebar: true,
    },
    {
      name: "Rewards",
      path: Routes.Rewards,
      element: Rewards,
      isOnSidebar: true,
    },

    {
      name: "Visits",
      path: Routes.Visits,
      element: Visits,
      isOnSidebar: true,
    },
    {
      name: "Profile",
      path: Routes.Profile,
      element: Profile,
      isOnSidebar: true,
    },
    {
      name: "Analytics",
      path: Routes.Analytics,
      element: Analytics,
      isOnSidebar: true,
    },
    {
      name: "Gameplays By Games",
      path: Routes.GameplaysByGame,
      element: GameplaysByGame,
      isOnSidebar: true,
    },
    {
      name: "Gameplays By Mentor",
      path: Routes.GameplaysByMentor,
      element: GameplaysByMentor,
      isOnSidebar: true,
    },
  ],
  [RolePermissionEnum.MANAGEMENT]: [
    {
      name: "Menu",
      path: Routes.Menu,
      element: Menu,
      isOnSidebar: true,
    },
    {
      name: "User",
      path: Routes.User,
      element: User,
      isOnSidebar: false,
    },

    {
      name: "Users",
      path: Routes.Users,
      element: Users,
      isOnSidebar: true,
    },
  ],
};

export const NO_IMAGE_URL =
  "https://res.cloudinary.com/dvbg/image/upload/ar_4:4,c_crop/c_fit,h_100/davinci/no-image_pyet1d.jpg";
