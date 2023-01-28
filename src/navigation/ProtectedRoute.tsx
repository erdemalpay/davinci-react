import { Navigate, useLocation } from "react-router-dom";
import { RolePermissionEnum } from "../types";
import { toast } from "react-toastify";
import { useContext } from "react";
import { UserContext } from "../context/UserContext";
import useAuth from "../hooks/useAuth";

interface ProtectedRouteProps {
  children: JSX.Element;
  requiredPermissions: RolePermissionEnum[];
}

export function ProtectedRoute({
  children,
  requiredPermissions,
}: ProtectedRouteProps) {
  useAuth();
  let location = useLocation();
  const { user } = useContext(UserContext);

  if (!user) return null;

  if (
    !requiredPermissions.every((permission) =>
      user?.role?.permissions?.includes(permission)
    )
  ) {
    toast.error(
      "You don't have rights to see this page. Login with a user that has the required permissions."
    );
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
