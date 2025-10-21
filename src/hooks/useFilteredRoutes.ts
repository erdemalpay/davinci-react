import { useUserContext } from "../context/User.context";
import { allRoutes } from "../navigation/constants";
import { Role } from "../types";
import { useGetPanelControlPages } from "../utils/api/panelControl/page";

export const useFilteredRoutes = () => {
  const { user } = useUserContext();
  const pages = useGetPanelControlPages();

  if (!user || !pages) {
    return [];
  }

  const routes = allRoutes?.filter((route) => {
    if (!route.children) {
      return (
        route?.exceptionalRoles?.includes((user?.role as Role)._id) ||
        pages?.some(
          (page) =>
            page.name === route.name &&
            page.permissionRoles?.includes((user?.role as Role)._id)
        )
      );
    } else {
      return route.children.some(
        (child) =>
          child?.exceptionalRoles?.includes((user?.role as Role)._id) ||
          pages?.some(
            (page) =>
              page.name === child.name &&
              page.permissionRoles?.includes((user?.role as Role)._id)
          )
      );
    }
  });

  return routes || [];
};
