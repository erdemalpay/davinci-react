import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { Point } from "../../types";
import { patch, post } from "../api";
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
  const { updateItem } = useMutationApi<Point>({
    baseQuery: pointBaseUrl,
    queryKey: [pointBaseUrl],
  });

  // Custom create mutation with optimistic update
  const createPointMutation = useMutation({
    mutationFn: (payload: Partial<Point>) =>
      post<Partial<Point>, Point>({
        path: pointBaseUrl,
        payload,
      }),
    onMutate: async (newPoint: Partial<Point>) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: [pointBaseUrl] });

        // Snapshot the previous value
        const previousPoints =
          queryClient.getQueryData<Point[]>([pointBaseUrl]) || [];

        // Check if user already has points
        const existingPointIndex = previousPoints.findIndex(
          (point) => point.user === newPoint.user
        );

        let updatedPoints: Point[];

        if (existingPointIndex !== -1) {
          // User exists, add to existing amount
          updatedPoints = previousPoints.map((point, index) =>
            index === existingPointIndex
              ? {
                  ...point,
                  amount: point.amount + (newPoint.amount || 0),
                }
              : point
          );
        } else {
          // User doesn't exist, create new entry with temporary ID
          const optimisticPoint: Point = {
            _id: Date.now(), // Temporary ID
            user: newPoint.user as string,
            amount: newPoint.amount || 0,
          };
          updatedPoints = [...previousPoints, optimisticPoint];
        }

        // Optimistically update the cache
        queryClient.setQueryData([pointBaseUrl], updatedPoints);

        // Return a context object with the snapshotted value
        return { previousPoints };
      },
      onError: (error: unknown, _newPoint, context) => {
        // If the mutation fails, use the context to roll back
        if (context?.previousPoints) {
          queryClient.setQueryData([pointBaseUrl], context.previousPoints);
        }
        const errorMessage =
          (error as { response?: { data?: { message?: string } } })?.response
            ?.data?.message || "An unexpected error occurred";
        toast.error(errorMessage);
      },
      onSuccess: () => {
        // Invalidate and refetch to get the real data from server
        queryClient.invalidateQueries({ queryKey: [pointBaseUrl] });
        toast.success("Points added successfully");
      },
    }
  );

  // Custom delete mutation that sets amount to 0 with optimistic update
  const deletePointMutation = useMutation({
    mutationFn: (id: number) =>
      patch<Partial<Point>, Point>({
        path: `${pointBaseUrl}/${id}`,
        payload: { amount: 0 },
      }),
      onMutate: async (id: number) => {
        // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
        await queryClient.cancelQueries({ queryKey: [pointBaseUrl] });

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
        queryClient.invalidateQueries({ queryKey: [pointBaseUrl] });
        toast.success("All points removed successfully");
      },
    }
  );

  return {
    createPoint: createPointMutation.mutate,
    updatePoint: updateItem,
    deletePoint: deletePointMutation.mutate,
  };
};
