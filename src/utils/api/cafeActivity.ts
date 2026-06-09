import { CafeActivity, MonthlyActivity } from "../../types";
import { Paths, useGetList, useMutationApi } from "./factory";

export function useCafeActivityMutations(after: string, before: string) {
  const {
    deleteItem: deleteCafeActivity,
    updateItem: updateCafeActivity,
    createItem: createCafeActivity,
  } = useMutationApi<CafeActivity>({
    baseQuery: Paths.CafeActivity,
    queryKey: [Paths.CafeActivity, after, before],
  });
  return { deleteCafeActivity, updateCafeActivity, createCafeActivity };
}

export function useGetCafeActivitys() {
  return useGetList<CafeActivity>(Paths.CafeActivity);
}

export function useGetCafeActivitysByDateRange(after: string, before: string) {
  let url = `${Paths.CafeActivity}?after=${after}`;
  if (before) url = url.concat(`&before=${before}`);
  return useGetList<CafeActivity>(url, [Paths.CafeActivity, after, before], true);
}

export function useMonthlyActivityMutations() {
  const {
    createItem: createMonthlyActivity,
    updateItem: updateMonthlyActivity,
    deleteItem: deleteMonthlyActivity,
  } = useMutationApi<MonthlyActivity>({
    baseQuery: Paths.MonthlyActivity,
  });
  return { createMonthlyActivity, updateMonthlyActivity, deleteMonthlyActivity };
}

export function useGetMonthlyActivities() {
  return useGetList<MonthlyActivity>(Paths.MonthlyActivity);
}
