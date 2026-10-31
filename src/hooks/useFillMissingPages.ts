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
    const missedRoutes = [];
    for (const route of allRoutes) {
      const currentPage = pages.find((page) => page.name === route.name);
      const routeTabs = route?.tabs;

      const isAllTabsSame =
        routeTabs?.every((tab: any) => {
          return currentPage?.tabs?.find((t) => t.name === tab.label);
        }) ?? true;

      if (!currentPage || !isAllTabsSame) {
        missedRoutes.push({
          name: route.name,
          permissionRoles: currentPage?.permissionRoles ?? [RoleEnum.MANAGER],
          tabs: routeTabs?.map((tab: any) => {
            return {
              name: tab.label,
              permissionRoles: currentPage?.tabs?.find(
                (t) => t.name === tab.label
              )?.permissionRoles ?? [RoleEnum.MANAGER],
            };
          }),
        });
      }
    }

    if (missedRoutes.length > 0) {
      createMultiplePage(missedRoutes);
    }
  }, [enabled, pages]);
};
