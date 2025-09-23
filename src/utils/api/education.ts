import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { patch } from ".";
import { Education } from "./../../types/index";
import { Paths, useGetList, useMutationApi } from "./factory";

export function useEducationMutations() {
  const {
    deleteItem: deleteEducation,
    updateItem: updateEducation,
    createItem: createEducation,
  } = useMutationApi<Education>({
    baseQuery: Paths.Education,
  });

  return { deleteEducation, updateEducation, createEducation };
}

export function useGetEducations() {
  return useGetList<Education>(Paths.Education);
}

export function updateEducationsOrder({
  id,
  newOrder,
}: {
  id: number;
  newOrder: number;
}) {
  return patch({
    path: `${Paths.Education}/order/${id}`,
    payload: { newOrder },
  });
}
export function useUpdateEducationsOrderMutation() {
  const queryKey = [`${Paths.Education}`];
  const queryClient = useQueryClient();
  return useMutation(updateEducationsOrder, {
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey });
      const prev = queryClient.getQueryData<Education[]>(queryKey);

      if (prev) {
        const dragged = prev.find((e) => e._id === vars.id);
        const target = prev.find((e) => e.order === vars.newOrder);
        if (dragged && target) {
          const updated = prev.map((e) => {
            if (e._id === dragged._id) return { ...e, order: target.order };
            if (e._id === target._id) return { ...e, order: dragged.order };
            return e;
          });
          queryClient.setQueryData(queryKey, updated);
        }
      }

      return { prev };
    },
    onError: (err, _vars, ctx) => {
      const msg =
        (err as any)?.response?.data?.message || "An unexpected error occurred";
      toast.error(msg);
      if (ctx?.prev) queryClient.setQueryData(queryKey, ctx.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}
