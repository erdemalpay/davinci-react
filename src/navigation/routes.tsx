import { Route, Routes } from "react-router-dom";
import Login from "../pages/Login";
import Memberships from "../pages/Memberships";
import { RolePermissionEnum } from "../types";
import { ProtectedRoute } from "./ProtectedRoute";

export enum BaseRoutes {
  Base = "/",
  Bahceli = "/1",
  Login = "/login",
  Memberships = "/memberships",
  NotFound = "*",
}

const RouterContainer = () => {
  return (
    <Routes>
      <Route
        path={BaseRoutes.Memberships}
        element={
          <ProtectedRoute
            requiredPermissions={[RolePermissionEnum.CUSTOMER_DATA]}
          >
            <Memberships />
          </ProtectedRoute>
        }
      />
      <Route
        path={BaseRoutes.Bahceli}
        element={
          <ProtectedRoute
            requiredPermissions={[RolePermissionEnum.CUSTOMER_DATA]}
          >
            <Memberships />
          </ProtectedRoute>
        }
      />
      <Route path={BaseRoutes.Login} element={<Login />} />
      <Route path={BaseRoutes.NotFound} element={<h1>Page not found</h1>} />
    </Routes>
  );
};

export default RouterContainer;
