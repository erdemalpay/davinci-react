import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { post } from ".././index";
import { Paths, useGetList, useMutationApi } from "../factory";
import { PanelControlPage } from "./../../../types/index";

const baseUrl = `${Paths.PanelControl}/pages`;

export function usePanelControlPageMutations() {
  const {
    deleteItem: deletePanelControlPage,
    updateItem: updatePanelControlPage,
    createItem: createPanelControlPage,
  } = useMutationApi<PanelControlPage>({
    baseQuery: baseUrl,
  });
  return {
    deletePanelControlPage,
    updatePanelControlPage,
    createPanelControlPage,
  };
}
export function createMultiplePage(
  pages: Partial<PanelControlPage>[]
): Promise<PanelControlPage> {
  return post<Partial<PanelControlPage>[], PanelControlPage>({
    path: `${Paths.PanelControl}/pages/multiple`,
    payload: pages,
  });
}

export function useCreateMultiplePageMutation() {
  const queryKey = [baseUrl];
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createMultiplePage,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (_err: any) => {
      const errorMessage =
        _err?.response?.data?.message || "An unexpected error occurred";
      setTimeout(() => toast.error(errorMessage), 200);
    },
  });
}
export function useGetPanelControlPages() {
  return useGetList<PanelControlPage>(baseUrl);
}
