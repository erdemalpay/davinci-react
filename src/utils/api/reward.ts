import { Reward } from "../../types";
import { Paths, useGet, useMutationApi } from "./factory";

export function useRewardMutations() {
  const {
    deleteItem: deleteReward,
    updateItem: updateReward,
    createItem: createReward,
  } = useMutationApi<Reward>({
    baseQuery: Paths.Rewards,
  });

  return { deleteReward, updateReward, createReward };
}

export function useGetRewards() {
  return useGet<Reward[]>(Paths.Rewards);
}
