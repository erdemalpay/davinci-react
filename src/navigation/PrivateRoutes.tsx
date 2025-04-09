import { matchPath, Navigate, Outlet, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { useUserContext } from "../context/User.context";
import useAuth from "../hooks/useAuth";
import { useGetPanelControlPages } from "../utils/api/panelControl/page";
import { allRoutes, PublicRoutes } from "./constants";

export function PrivateRoutes() {
  useAuth();
  const pages = useGetPanelControlPages();
  const location = useLocation();
  const { user } = useUserContext();
  const currentRoute = allRoutes
    .filter((route) => route.path)
    .find((route) =>
      matchPath({ path: route.path ?? "", end: false }, location.pathname)
    );
  if (!user || pages.length === 0 || !allRoutes || !currentRoute) return null;

  if (
    pages
      .find((page) => page.name === currentRoute?.name)
      ?.permissionRoles.includes(user.role._id) ||
    allRoutes
      ?.find((route) => route.name === currentRoute?.name)
      ?.exceptionalRoles?.includes(user.role._id)
  ) {
    return <Outlet />;
  } else {
    console.log(allRoutes?.find((route) => route.name === currentRoute?.name));
    toast.error(
      `You don't have rights to see this page ${location.pathname}. Login with a user that has the required permissions.`
    );

    return (
      <Navigate to={PublicRoutes.Login} state={{ from: location }} replace />
    );
  }
}
