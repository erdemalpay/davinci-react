import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import {
  InventoryBox,
  InventoryLinkableGame,
  InventoryLocation,
  InventoryMovement,
} from "../../types";
import { getApiErrorMessage } from "../getApiErrorMessage";
import { Paths, useGetList, useMutationApi } from "./factory";
import { patch, post } from "./index";

const baseUrl = Paths.Inventory;

export function useInventoryLocationMutations() {
  const {
    updateItem: updateInventoryLocation,
    createItem: createInventoryLocation,
  } = useMutationApi<InventoryLocation>({
    baseQuery: `${baseUrl}/locations`,
    queryKey: [baseUrl, "locations"],
  });
  return { updateInventoryLocation, createInventoryLocation };
}
export function useGetInventoryLocations() {
  return useGetList<InventoryLocation>(`${baseUrl}/locations`, [
    baseUrl,
    "locations",
  ]);
}
export function useGetInventoryBoxes() {
  return useGetList<InventoryBox>(`${baseUrl}/boxes`, [baseUrl, "boxes"]);
}
export function useGetInventoryMovements() {
  return useGetList<InventoryMovement>(`${baseUrl}/movements`, [
    baseUrl,
    "movements",
  ]);
}
export function useGetInventoryLinkableGames() {
  return useGetList<InventoryLinkableGame>(`${baseUrl}/linkable-games`, [
    baseUrl,
    "linkable-games",
  ]);
}
// Sorgu anahtarları [baseUrl, ...] ile başlar; invalidation hepsini tazeler.
function useInventoryAction<TPayload, TResult = unknown>(
  path: string,
  method: "post" | "patch" = "post",
  invalidateKey: string[] = [baseUrl]
) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (payload: TPayload) =>
      method === "post"
        ? post<TPayload, TResult>({ path, payload })
        : patch<TPayload, TResult>({ path, payload }),
    onSettled: () => {
      // Yenilenme beklenir: mutateAsync çağıranı sunucu verisi gelmeden
      // yerel değeri bırakmasın.
      return queryClient.invalidateQueries({ queryKey: invalidateKey });
    },
    onError: (error: unknown) => {
      setTimeout(
        () =>
          toast.error(
            t(getApiErrorMessage(error, "An unexpected error occurred"))
          ),
        200
      );
    },
  });
}

export const useAddInventoryBoxesMutation = () =>
  useInventoryAction<
    { game: number; location: number; quantity: number; shortCode?: string },
    string[]
  >(`${baseUrl}/boxes`);
export const useMoveInventoryBoxesMutation = () =>
  useInventoryAction<{ ids: string[]; location: number; note?: string }>(
    `${baseUrl}/boxes/move`
  );
export const useDeactivateInventoryBoxesMutation = () =>
  useInventoryAction<{ ids: string[]; note?: string }>(
    `${baseUrl}/boxes/deactivate`
  );
