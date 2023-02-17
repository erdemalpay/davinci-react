import { Route, Routes } from "react-router-dom";
import Analytics from "../pages/Analytics";
import ChangePassword from "../pages/ChangePassword";
import Gameplays from "../pages/Gameplays";
import Games from "../pages/Games";
import Login from "../pages/Login";
import Memberships from "../pages/Memberships";
import Menu from "../pages/Menu";
import Reservations from "../pages/Reservations";
import Rewards from "../pages/Rewards";
import Tables from "../pages/Tables";
import User from "../pages/User";
import Users from "../pages/Users";
import Visits from "../pages/Visits";
import { RolePermissionEnum } from "../types";
import { PrivateRoutes } from "./PrivateRoutes";

export enum BaseRoutes {
  NotFound = "*",
  Login = "/login",
  ChangePassword = "/change-password",
  Analytics = "/analytics",
  Gameplays = "/gameplays",
  Games = "/games",
  Memberships = "/memberships",
  Menu = "/menu",
  Reservations = "/reservations",
  Rewards = "/rewards",
  Tables = "/tables",
  User = "/user/:user",
  Users = "/users",
  Visits = "/visits",
}

const RouterContainer = () => {
  return (
    <Routes>
      <Route
        element={
          <PrivateRoutes requiredPermissions={[RolePermissionEnum.OPERATION]} />
        }
      >
        <Route path={BaseRoutes.ChangePassword} element={<ChangePassword />} />
        <Route path={BaseRoutes.Games} element={<Games />} />
        <Route path={BaseRoutes.Memberships} element={<Memberships />} />
        <Route path={BaseRoutes.Reservations} element={<Reservations />} />
        <Route path={BaseRoutes.Rewards} element={<Rewards />} />
        <Route path={BaseRoutes.Tables} element={<Tables />} />
        <Route path={BaseRoutes.Visits} element={<Visits />} />
      </Route>
      <Route
        element={
          <PrivateRoutes
            requiredPermissions={[RolePermissionEnum.MANAGEMENT]}
          />
        }
      >
        <Route path={BaseRoutes.Menu} element={<Menu />} />
        <Route path={BaseRoutes.User} element={<User />} />
        <Route path={BaseRoutes.Users} element={<Users />} />
        <Route path={BaseRoutes.Analytics} element={<Analytics />} />
        <Route path={BaseRoutes.Gameplays} element={<Gameplays />} />
      </Route>

      <Route path={BaseRoutes.Login} element={<Login />} />
      <Route path={BaseRoutes.NotFound} element={<h1>Page not found</h1>} />
    </Routes>
  );
};

export default RouterContainer;
