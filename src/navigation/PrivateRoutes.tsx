import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useUserContext } from "../context/User.context";
import useAuth from "../hooks/useAuth";
import { RolePermissionEnum } from "../types";

interface PrivateRoutesProps {
  requiredPermissions: RolePermissionEnum[];
}

export function PrivateRoutes({ requiredPermissions }: PrivateRoutesProps) {
  useAuth();
  let location = useLocation();
  const { user } = useUserContext();
  console.log({ user });

  if (!user) return <></>;
  /* toast.error(
    "You don't have rights to see this page. Login with a user that has the required permissions."
  ); */
  if (
    requiredPermissions.every((permission) =>
      user?.role?.permissions?.includes(permission)
    )
  ) {
    return <Outlet />;
  } else {
  }
  return <Navigate to="/login" state={{ from: location }} replace />;
}
