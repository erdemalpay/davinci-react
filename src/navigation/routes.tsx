import { Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import CampaignForm from "../pages/CampaignForm";
import Login from "../pages/Login";
import TournamentLive from "../pages/TournamentLive";
import TournamentRegister from "../pages/TournamentRegister";
import { allRoutes, PublicRoutes } from "./constants";
import { PrivateRoutes } from "./PrivateRoutes";

const RouterContainer = () => {
  return (
    <Routes>
      {/* One layout route for all private pages (it used to be repeated
          once per page, giving the router pages × pages routes to match). */}
      <Route element={<PrivateRoutes />}>
        {allRoutes.map((route) => (
          <Route
            key={route.name}
            path={route.path}
            element={
              route.element && (
                <Suspense fallback={null}>
                  <route.element />
                </Suspense>
              )
            }
          />
        ))}
      </Route>

      <Route path={PublicRoutes.CampaignForm} element={<CampaignForm />} />
      <Route
        path={PublicRoutes.TournamentRegister}
        element={<TournamentRegister />}
      />
      <Route path={PublicRoutes.TournamentLive} element={<TournamentLive />} />
      <Route path={PublicRoutes.Login} element={<Login />} />
      <Route path={PublicRoutes.NotFound} element={<Login />} />
    </Routes>
  );
};

export default RouterContainer;
