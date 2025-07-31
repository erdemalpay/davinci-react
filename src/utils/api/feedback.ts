import { useMemo } from "react";
import { Feedback } from "../../types";
import { Paths, useGetList, useMutationApi } from "./factory";

const baseUrl = `${Paths.Tables}/feedback`;
export function useFeedbackMutations() {
  const {
    deleteItem: deleteFeedback,
    updateItem: updateFeedback,
    createItem: createFeedback,
  } = useMutationApi<Feedback>({
    baseQuery: baseUrl,
  });
  return { deleteFeedback, updateFeedback, createFeedback };
}

export function useGetQueryFeedbacks(filter: {
  after?: string;
  before?: string;
  location?: number;
}) {
  const url = useMemo(() => {
    const params = new URLSearchParams();

    if (filter.after) {
      params.append("after", filter.after);
    }
    if (filter.before) {
      params.append("before", filter.before);
    }
    if (filter.location) {
      params.append("location", String(filter.location));
    }

    const query = params.toString();
    return query
      ? `${Paths.Tables}/feedback?${query}`
      : `${Paths.Tables}/feedback`;
  }, [
    `${Paths.Tables}/feedback`,
    filter.after,
    filter.before,
    filter.location,
  ]);

  return useGetList<Feedback>(url, [url], true);
}
