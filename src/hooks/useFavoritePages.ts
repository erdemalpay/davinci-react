import {
  useIsMutating,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { Role, User } from "../types";
import { patch } from "../utils/api";
import { Paths } from "../utils/api/factory";
import { useGetPanelControlPages } from "../utils/api/panelControl/page";
import { useGetUser } from "../utils/api/user";
import {
  FavoritePage,
  FavoriteRoute,
  getSidebarPageOptions,
  reorderFavoritePage,
  resolveFavoritePages,
  toggleFavoritePage,
} from "../utils/favoritePages";
import { usernamify } from "../utils/string";
import { useResolvedSidebarRoutes } from "./useResolvedSidebarRoutes";

const currentUserQueryKey = [Paths.Users, "me"];
const favoritePagesMutationKey = [Paths.User, "favorite-pages"];

function updateFavoritePagesRequest(favoritePages: string[]): Promise<User> {
  return patch<{ favoritePages: string[] }, User>({
    path: `${Paths.User}/favorite-pages`,
    payload: { favoritePages },
  });
}

export function useFavoritePages(): {
  favoritePages: FavoritePage[];
  isUpdating: boolean;
  isFavorite: (path: string) => boolean;
  toggleFavorite: (path: string) => void;
  reorderFavorite: (draggedPath: string, targetPath: string) => void;
} {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const user = useGetUser();
  const routes = useResolvedSidebarRoutes() as FavoriteRoute[];
  const controlPages = useGetPanelControlPages();
  const activeFavoritePageMutations = useIsMutating({
    mutationKey: favoritePagesMutationKey,
  });
  const roleId = (user?.role as Role | undefined)?._id;

  const getAllowedChildren = useCallback(
    (route: FavoriteRoute) =>
      route.children?.filter(
        (child) =>
          child.exceptionalRoles?.includes(roleId ?? -1) ||
          controlPages.some(
            (page) =>
              page.name === child.name &&
              page.permissionRoles?.includes(roleId ?? -1)
          )
      ),
    [controlPages, roleId]
  );

  const getAllowedTabs = useCallback(
    (route: FavoriteRoute) => {
      if (!route.tabs?.length) return [];

      const pathBasedId = route.path
        ? route.path.replace(/^\//, "").replace(/-/g, "_")
        : null;
      const controlPage =
        controlPages.find((page) => page._id === usernamify(route.name)) ||
        (pathBasedId
          ? controlPages.find((page) => page._id === pathBasedId)
          : undefined) ||
        controlPages.find((page) => page.name === route.name);

      if (!controlPage) return [];

      const controlTabs =
        (controlPage.tabs as {
          name: string;
          permissionRoles?: number[];
        }[]) ?? [];

      if (controlTabs.length === 0) return route.tabs;

      return route.tabs.filter((tab) =>
        controlTabs.some(
          (controlTab) =>
            controlTab.name === tab.label &&
            controlTab.permissionRoles?.includes(roleId ?? -1)
        )
      );
    },
    [controlPages, roleId]
  );

  const availablePages = useMemo(
    () => getSidebarPageOptions(routes, getAllowedChildren, getAllowedTabs),
    [getAllowedChildren, getAllowedTabs, routes]
  );
  const favoritePaths = user?.settings?.favoritePages ?? [];

  const updateMutation = useMutation({
    mutationKey: favoritePagesMutationKey,
    mutationFn: updateFavoritePagesRequest,
    onMutate: async (nextFavoritePaths) => {
      await queryClient.cancelQueries({ queryKey: currentUserQueryKey });
      const previousUser = queryClient.getQueryData<User>(currentUserQueryKey);
      queryClient.setQueryData<User>(currentUserQueryKey, (cachedUser) =>
        cachedUser
          ? {
              ...cachedUser,
              settings: {
                ...cachedUser.settings,
                favoritePages: nextFavoritePaths,
              },
            }
          : cachedUser
      );
      return { previousUser };
    },
    onError: (_error, _favoritePages, context) => {
      if (context?.previousUser) {
        queryClient.setQueryData(currentUserQueryKey, context.previousUser);
      }
      toast.error(t("Could not update favorite pages"));
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData<User>(currentUserQueryKey, (cachedUser) =>
        cachedUser
          ? { ...cachedUser, settings: updatedUser.settings }
          : updatedUser
      );
    },
  });

  const isFavoritePagesSaving = () =>
    queryClient.isMutating({ mutationKey: favoritePagesMutationKey }) > 0;

  return {
    favoritePages: resolveFavoritePages(favoritePaths, availablePages),
    isUpdating: activeFavoritePageMutations > 0,
    isFavorite: (path) => favoritePaths.includes(path),
    toggleFavorite: (path) => {
      if (!user || isFavoritePagesSaving()) return;
      updateMutation.mutate(toggleFavoritePage(favoritePaths, path));
    },
    reorderFavorite: (draggedPath, targetPath) => {
      if (!user || isFavoritePagesSaving() || draggedPath === targetPath)
        return;
      updateMutation.mutate(
        reorderFavoritePage(favoritePaths, draggedPath, targetPath)
      );
    },
  };
}
