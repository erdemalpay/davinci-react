import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosHeaders } from "axios";
import { toast } from "react-toastify";
import { patch, postWithHeader, remove } from ".";
import { getApiErrorMessage } from "../getApiErrorMessage";
import { Paths, useGet, useGetList } from "./factory";

export type FolderImages = {
  url: string;
  publicId: string;
};

export const SCREEN_IMAGES_FOLDER = "tv-screen";

// duration is in seconds
export type ScreenImage = FolderImages & {
  duration: number;
};

export type UploadLog = {
  _id: number;
  fileName: string;
  status: "success" | "error";
  message: string;
  uploadedBy: string;
  folder: string;
  createdAt: string;
};

export function useGetFolderNames() {
  return useGetList<string>(`${Paths.Asset}/folders`, [Paths.Asset]);
}

export function useGetUploadLogs() {
  return useGetList<UploadLog>(`${Paths.Asset}/upload-logs`, [
    Paths.Asset,
    "upload-logs",
  ]);
}

export function useGetFolderImages(folderName: string) {
  return useGetList<FolderImages>(
    `${Paths.Asset}/folder/images?folderName=${folderName}`,
    [Paths.Asset, folderName],
    true
  );
}

export function useGetScreenImages(enabled: boolean) {
  return useGet<ScreenImage[]>(
    `${Paths.Asset}/screen-images`,
    [Paths.Asset, "screen-images"],
    true,
    { enabled }
  );
}

type ScreenImageSetting = Pick<ScreenImage, "publicId" | "duration">;

export function useUpdateScreenImagesMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (images: ScreenImageSetting[]) =>
      patch<{ images: ScreenImageSetting[] }, ScreenImage[]>({
        path: `${Paths.Asset}/screen-images`,
        payload: { images },
      }),
    // The response is the saved list, so no refetch is needed
    onSuccess: (savedImages) => {
      queryClient.setQueryData([Paths.Asset, "screen-images"], savedImages);
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, "An unexpected error occurred"));
    },
  });
}

type UploadParams = {
  files: File[];
  selectedFolder: string;
  itemId?: number;
};

export function useUploadImagesMutation(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();
  return useMutation<any, Error, UploadParams>({
    mutationFn: async ({ files, selectedFolder, itemId }) => {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));
      formData.append("foldername", selectedFolder);
      if (itemId) {
        formData.append("itemId", itemId.toString());
      }
      return postWithHeader<FormData, any>({
        path: "/asset/uploads",
        payload: formData,
        headers: new AxiosHeaders({ "Content-Type": "multipart/form-data" }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [Paths.Asset, "upload-logs"] });
      options?.onSuccess?.();
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: [Paths.Asset, "upload-logs"] });
    },
  });
}

export function deleteImage(url: string) {
  return remove({
    path: `${Paths.Asset}/image/${url}`,
  });
}

export function useDeleteImageMutation() {
  const queryKey = [`${Paths.Asset}`];
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteImage,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });
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
