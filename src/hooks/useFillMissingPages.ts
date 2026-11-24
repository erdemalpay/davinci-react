import { useEffect, useRef } from "react";
import { allRoutes } from "../navigation/constants";
import { PanelControlPage, RoleEnum } from "../types";
import { Paths, useGet } from "../utils/api/factory";
import { useCreateMultiplePageMutation } from "../utils/api/panelControl/page";

// Adds the page permission records of pages (and tabs) the panel has but the
// database doesn't yet, open to Manager only, so a new page shows up without
// anyone opening Page Permissions first.
export const useFillMissingPages = (enabled: boolean) => {
  // Undefined until loaded: an empty list would look like every page is missing.
  const pages = useGet<PanelControlPage[]>(`${Paths.PanelControl}/pages`);
  const { mutate: createMultiplePage } = useCreateMultiplePageMutation();
  const isDone = useRef(false);

  useEffect(() => {
    if (!enabled || !pages || isDone.current) return;
    isDone.current = true;

    // One permission record per page name. If two routes share a name, their
    // tabs are merged; writing them one after another made the record flip
    // between the two tab lists on every panel load.
    const routesByName = new Map<
      string,
      { tabLabels: string[]; permissionsFrom?: string }
    >();
    for (const route of allRoutes) {
      const entry = routesByName.get(route.name);
      const tabLabels = (route.tabs ?? []).map((tab) => tab.label);
      if (entry) {
        const newLabels = tabLabels.filter(
          (label) => !entry.tabLabels.includes(label)
        );
        if (newLabels.length > 0) {
          console.warn(
            `Routes named "${route.name}" have different tabs; they share one permission record, so the tabs are merged.`
          );
          entry.tabLabels.push(...newLabels);
        }
      } else {
        routesByName.set(route.name, {
          tabLabels,
          permissionsFrom: route.permissionsFrom,
        });
      }
    }

    const missedRoutes = [];
    for (const [name, { tabLabels, permissionsFrom }] of routesByName) {
      const currentPage = pages.find((page) => page.name === name);
      const isAllTabsSame = tabLabels.every((label) =>
        currentPage?.tabs?.find((t) => t.name === label)
      );
      if (currentPage && isAllTabsSame) continue;

      const defaultRoles = (permissionsFrom &&
        pages.find((page) => page.name === permissionsFrom)
          ?.permissionRoles) || [RoleEnum.MANAGER];
      missedRoutes.push({
        name,
        permissionRoles: currentPage?.permissionRoles ?? defaultRoles,
        tabs: tabLabels.map((label) => ({
          name: label,
          permissionRoles:
            currentPage?.tabs?.find((t) => t.name === label)?.permissionRoles ??
            defaultRoles,
        })),
      });
    }

    if (missedRoutes.length > 0) {
      createMultiplePage(missedRoutes);
    }
  }, [enabled, pages]);
};
