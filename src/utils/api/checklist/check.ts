import { CheckType, FormElementsState } from "../../../types/index";
import { Paths, useGet, useGetList, useMutationApi } from "../factory";

const baseUrl = `${Paths.Checklist}/check`;
export interface CheckPayload {
  data: CheckType[];
  totalNumber: number;
  totalPages: number;
  page: number;
  limit: number;
}
export function useCheckMutations() {
  const {
    deleteItem: deleteCheck,
    updateItem: updateCheck,
    createItem: createCheck,
  } = useMutationApi<CheckType>({
    baseQuery: baseUrl,
  });
  return {
    deleteCheck,
    updateCheck,
    createCheck,
  };
}
export function useGetChecks() {
  return useGetList<CheckType>(baseUrl);
}

export function useGetQueryChecks(
  page: number,
  limit: number,
  filters: FormElementsState
) {
  const parts = [
    `page=${page}`,
    `limit=${limit}`,
    filters.createdBy && `createdBy=${filters.createdBy}`,
    filters.checklist && `checklist=${filters.checklist}`,
    filters.location && `location=${filters.location}`,
    filters.after && `after=${filters.after}`,
    filters.before && `before=${filters.before}`,
    filters.sort && `sort=${filters.sort}`,
    filters.asc !== undefined && `asc=${filters.asc}`,
    filters.search && `search=${filters.search.trim()}`,
  ];

  const queryString = parts.filter(Boolean).join("&");
  const url = `${baseUrl}/query?${queryString}`;

  return useGet<CheckPayload>(url, [url, page, limit, filters], true);
}
