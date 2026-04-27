import { CafeActivity, MonthlyActivity } from "../../types";
import { Paths, useGetList, useMutationApi } from "./factory";

export function useCafeActivityMutations() {
  const {
    deleteItem: deleteCafeActivity,
    updateItem: updateCafeActivity,
    createItem: createCafeActivity,
  } = useMutationApi<CafeActivity>({
    baseQuery: Paths.CafeActivity,
  });

  return { deleteCafeActivity, updateCafeActivity, createCafeActivity };
}

export function useGetCafeActivitys() {
  return useGetList<CafeActivity>(Paths.CafeActivity);
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
