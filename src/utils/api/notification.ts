import { Notification } from "../../types";
import { Paths, useMutationApi } from "./factory";

export function useNotificationMutations() {
  const { createItem: createNotification } = useMutationApi<Notification>({
    baseQuery: Paths.Notification,
  });

  return { createNotification };
}
