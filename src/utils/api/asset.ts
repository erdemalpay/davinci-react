import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { remove } from ".";
import { Paths, useGetList } from "./factory";

export type FolderImages = {
  url: string;
  publicId: string;
};

export function useGetFolderNames() {
  return useGetList<string>(`${Paths.Asset}/folders`, [Paths.Asset]);
}

export function useGetFolderImages(folderName: string) {
  return useGetList<FolderImages>(
    `${Paths.Asset}/folder/images?folderName=${folderName}`,
    [Paths.Asset, folderName],
    true
  );
}

export function deleteImage(id: string) {
  return remove({
    path: `${Paths.Asset}/image/${id}`,
  });
}

export function useDeleteImageMutation() {
  const queryKey = [`${Paths.Asset}`];
  const queryClient = useQueryClient();
  return useMutation(deleteImage, {
    onMutate: async () => {
      await queryClient.cancelQueries(queryKey);
    },
    // onSettled: () => {
    //   queryClient.invalidateQueries(queryKey);
    // },
    onError: (_err: any) => {
      const errorMessage =
        _err?.response?.data?.message || "An unexpected error occurred";
      setTimeout(() => toast.error(errorMessage), 200);
    },
  });
}
