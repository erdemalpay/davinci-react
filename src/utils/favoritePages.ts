import { getTabSlug } from "./slug";

export type FavoriteTab = {
  label: string;
};

export type FavoriteRoute = {
  name: string;
  path?: string;
  isOnSidebar?: boolean;
  exceptionalRoles?: number[];
  tabs?: FavoriteTab[];
  children?: FavoriteRoute[];
};

export type FavoritePage = {
  name: string;
  parentName?: string;
  path: string;
};

export function getSidebarPageOptions(
  routes: FavoriteRoute[],
  getChildren: (route: FavoriteRoute) => FavoriteRoute[] | undefined,
  getTabs: (route: FavoriteRoute) => FavoriteTab[] = (route) => route.tabs ?? []
): FavoritePage[] {
  const pages: FavoritePage[] = [];
  const seenPaths = new Set<string>();

  const addPage = (route: FavoriteRoute) => {
    if (!route.isOnSidebar || !route.path || seenPaths.has(route.path)) return;
    seenPaths.add(route.path);
    pages.push({ name: route.name, path: route.path });

    getTabs(route).forEach((tab) => {
      const tabPath = `${route.path}?tab=${getTabSlug(tab.label)}`;
      if (seenPaths.has(tabPath)) return;
      seenPaths.add(tabPath);
      pages.push({ name: tab.label, parentName: route.name, path: tabPath });
    });
  };

  routes.forEach((route) => {
    const children = getChildren(route);
    if (children?.length) {
      children.forEach(addPage);
    } else {
      addPage(route);
    }
  });

  return pages;
}

export function resolveFavoritePages(
  favoritePaths: string[],
  availablePages: FavoritePage[]
): FavoritePage[] {
  const pagesByPath = new Map(availablePages.map((page) => [page.path, page]));
  return favoritePaths.flatMap((path) => {
    const page = pagesByPath.get(path);
    return page ? [page] : [];
  });
}

export function toggleFavoritePage(
  favoritePaths: string[],
  path: string
): string[] {
  return favoritePaths.includes(path)
    ? favoritePaths.filter((favoritePath) => favoritePath !== path)
    : [...favoritePaths, path];
}

export function reorderFavoritePage(
  favoritePaths: string[],
  draggedPath: string,
  targetPath: string
): string[] {
  const draggedIndex = favoritePaths.indexOf(draggedPath);
  const targetIndex = favoritePaths.indexOf(targetPath);

  if (
    draggedIndex === -1 ||
    targetIndex === -1 ||
    draggedIndex === targetIndex
  ) {
    return favoritePaths;
  }

  const reorderedPaths = [...favoritePaths];
  const [draggedFavorite] = reorderedPaths.splice(draggedIndex, 1);
  reorderedPaths.splice(targetIndex, 0, draggedFavorite);
  return reorderedPaths;
}
