import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { Point } from "../../types";
import { patch } from "../api";
import { Paths, useGetList, useMutationApi } from "./factory";

const pointBaseUrl = `${Paths.Point}`;

// Get all points
export const useGetPoints = () => {
  return useGetList<Point>(pointBaseUrl, [pointBaseUrl]);
};

// Get user points
export const useGetUserPoints = (userId: number) => {
  return useGetList<Point>(`${pointBaseUrl}/user/${userId}`, [
    pointBaseUrl,
    "user",
    userId,
  ]);
};

// Mutations
export const usePointMutations = () => {
  const queryClient = useQueryClient();
  const { createItem, updateItem } = useMutationApi<Point>({
    baseQuery: pointBaseUrl,
    queryKey: [pointBaseUrl],
  });

  // Custom delete mutation that sets amount to 0 without optimistic update
  const deletePointMutation = useMutation(
    (id: number) =>
      patch<Partial<Point>, Point>({
        path: `${pointBaseUrl}/${id}`,
        payload: { amount: 0 },
      }),
    {
      onMutate: async (id: number) => {
        // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
        await queryClient.cancelQueries([pointBaseUrl]);

        // Snapshot the previous value
        const previousPoints =
          queryClient.getQueryData<Point[]>([pointBaseUrl]) || [];

        // Optimistically update the amount to 0
        const updatedPoints = previousPoints.map((point) =>
          point._id === id ? { ...point, amount: 0 } : point
        );

        queryClient.setQueryData([pointBaseUrl], updatedPoints);

        // Return a context object with the snapshotted value
        return { previousPoints };
      },
      onError: (error: unknown, _id, context) => {
        // If the mutation fails, use the context returned from onMutate to roll back
        if (context?.previousPoints) {
          queryClient.setQueryData([pointBaseUrl], context.previousPoints);
        }
        const errorMessage =
          (error as { response?: { data?: { message?: string } } })?.response
            ?.data?.message || "An unexpected error occurred";
        toast.error(errorMessage);
      },
      onSuccess: () => {
        queryClient.invalidateQueries([pointBaseUrl]);
        toast.success("All points removed successfully");
      },
    }
  );

  return {
    createPoint: createItem,
    updatePoint: updateItem,
    deletePoint: deletePointMutation.mutate,
  };
};
