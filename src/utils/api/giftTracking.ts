import { Gift, GiftRecipient, GiftTag } from "../../types";
import { Paths, useGetList, useMutationApi } from "./factory";

const baseUrl = Paths.GiftTracking;
const tagsUrl = `${baseUrl}/tags`;
const recipientsUrl = `${baseUrl}/recipients`;
const giftsUrl = `${baseUrl}/gifts`;

export function useGetGiftTags() {
  return useGetList<GiftTag>(tagsUrl);
}

export function useGiftTagMutations() {
  const { createItem: createGiftTag, updateItem: updateGiftTag } =
    useMutationApi<GiftTag>({
      baseQuery: tagsUrl,
    });
  return { createGiftTag, updateGiftTag };
}

export function useGetGiftRecipients() {
  return useGetList<GiftRecipient>(recipientsUrl);
}

export function useGiftRecipientMutations() {
  const {
    createItem: createGiftRecipient,
    updateItem: updateGiftRecipient,
    deleteItem: deleteGiftRecipient,
  } = useMutationApi<GiftRecipient>({
    baseQuery: recipientsUrl,
  });
  return { createGiftRecipient, updateGiftRecipient, deleteGiftRecipient };
}

export function useGetGifts() {
  return useGetList<Gift>(giftsUrl);
}

export function useGiftMutations() {
  const {
    createItem: createGift,
    updateItem: updateGift,
    deleteItem: deleteGift,
  } = useMutationApi<Gift>({
    baseQuery: giftsUrl,
  });
  return { createGift, updateGift, deleteGift };
}
