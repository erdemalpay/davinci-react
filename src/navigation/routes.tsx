import { Route, Routes } from "react-router-dom";
import Login from "../pages/Login";
import { RolePermissionEnum } from "../types";
import { allRoutes, PublicRoutes } from "./constants";
import { PrivateRoutes } from "./PrivateRoutes";

const RouterContainer = () => {
  return (
    <Routes>
      {Object.values(RolePermissionEnum).map((permission) => (
        <Route
          key={permission}
          element={<PrivateRoutes requiredPermissions={[permission]} />}
        >
          {allRoutes[permission].map((route) => (
            <Route
              key={route.name}
              path={route.path}
              element={<route.element />}
            />
          ))}
        </Route>
      ))}

      <Route path={PublicRoutes.Login} element={<Login />} />
      <Route path={PublicRoutes.NotFound} element={<Login />} />
    </Routes>
  );
};

export default RouterContainer;
