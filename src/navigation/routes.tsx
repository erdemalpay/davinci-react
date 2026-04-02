import { Route, Routes } from "react-router-dom";
import CampaignForm from "../pages/CampaignForm";
import Login from "../pages/Login";
import { allRoutes, PublicRoutes } from "./constants";
import { PrivateRoutes } from "./PrivateRoutes";

const RouterContainer = () => {
  return (
    <Routes>
      {allRoutes.map((route) => (
        <Route key={route.name} element={<PrivateRoutes />}>
          {allRoutes?.map((route) => (
            <Route
              key={route.name}
              path={route.path}
              element={route.element && <route.element />}
            />
          ))}
        </Route>
      ))}

      <Route path={PublicRoutes.CampaignForm} element={<CampaignForm />} />
      <Route path={PublicRoutes.Login} element={<Login />} />
      <Route path={PublicRoutes.NotFound} element={<Login />} />
    </Routes>
  );
};

export default RouterContainer;
