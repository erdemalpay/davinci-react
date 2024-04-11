import { Navigate, Outlet, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { useUserContext } from "../context/User.context";
import useAuth from "../hooks/useAuth";
import { RolePermissionEnum } from "../types";
import { allRoutes, PublicRoutes } from "./constants";

interface PrivateRoutesProps {
  requiredPermissions: RolePermissionEnum[];
}

export function PrivateRoutes({ requiredPermissions }: PrivateRoutesProps) {
  useAuth();
  const location = useLocation();
  const { user } = useUserContext();

  if (!user) return <></>;

  if (
    requiredPermissions.every(
      (permission) =>
        (user?.role?.permissions?.includes(permission) &&
          !allRoutes[permission]
            .find((route) => route.path === location.pathname)
            ?.disabledRoleIds?.includes(user.role._id)) ||
        allRoutes[permission]
          .find((route) => route.path === location.pathname)
          ?.exceptionRoleIds?.includes(user.role._id)
    )
  ) {
    return <Outlet />;
  }
  toast.error(
    `You don't have rights to see this page ${location.pathname}. Login with a user that has the required permissions.`
  );
  return (
    <Navigate to={PublicRoutes.Login} state={{ from: location }} replace />
  );
}
