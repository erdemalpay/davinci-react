import { Navigate, Outlet, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { useUserContext } from "../context/User.context";
import useAuth from "../hooks/useAuth";
import { RolePermissionEnum } from "../types";
import { PublicRoutes } from "./constants";

interface PrivateRoutesProps {
  requiredPermissions: RolePermissionEnum[];
}

export function PrivateRoutes({ requiredPermissions }: PrivateRoutesProps) {
  useAuth();
  const location = useLocation();
  const { user } = useUserContext();
  if (!user) return <></>;

  if (
    requiredPermissions.every((permission) =>
      user?.role?.permissions?.includes(permission)
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
