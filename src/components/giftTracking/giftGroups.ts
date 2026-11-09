import {
  AccountProduct,
  Gift,
  GiftItem,
  GiftRecipient,
  GiftTag,
} from "../../types";
import { formatAsLocalDate } from "../../utils/format";
import { getItem } from "../../utils/getItem";

export const shareStatusLabels: Record<string, string> = {
  WAITING: "Waiting",
  SHARED: "Shared",
  NOT_SHARED: "Not Shared",
};

export const giftTypeLabels: Record<string, string> = {
  GIFT: "Gift",
  LOAN: "Game Loan",
  RAFFLE: "Raffle",
};

export type GiftGroup = {
  _id: number;
  name: string;
  recipient: GiftRecipient;
  gifts: Gift[];
  total: number;
  lastDate: string;
};

type GiftGroupCriteria = {
  tags?: number[];
  blacklistedOnly?: boolean;
  after?: string;
  before?: string;
  type?: string;
};

const byDateDesc = (a: Gift, b: Gift) =>
  b.date.localeCompare(a.date) || b._id - a._id;

export function groupGifts(
  recipients: GiftRecipient[],
  gifts: Gift[],
  {
    tags = [],
    blacklistedOnly = false,
    after,
    before,
    type,
  }: GiftGroupCriteria = {}
): GiftGroup[] {
  return recipients
    .filter(
      (recipient) =>
        (tags.length === 0 ||
          recipient.tags.some((tag) => tags.includes(tag))) &&
        (!blacklistedOnly || recipient.isBlacklisted)
    )
    .map((recipient) => {
      const recipientGifts = gifts
        .filter(
          (gift) =>
            gift.recipient === recipient._id &&
            (!after || gift.date >= after) &&
            (!before || gift.date <= before) &&
            (!type || gift.type === type)
        )
        .sort(byDateDesc);
      return {
        _id: recipient._id,
        name: recipient.name,
        recipient,
        gifts: recipientGifts,
        total: recipientGifts.length,
        lastDate: recipientGifts[0]?.date ?? "",
      };
    })
    .filter((group) => group.total > 0)
    .sort((a, b) => b.lastDate.localeCompare(a.lastDate));
}

// Sheet'ten aktarılan kayıtların tarihi boş olabilir.
export function formatGiftDate(date: string): string {
  return date ? formatAsLocalDate(date) : "";
}

export function getTagNames(tagIds: number[], tags: GiftTag[]): string {
  return tagIds.map((id) => getItem(id, tags)?.name ?? "").join(", ");
}

export function getLabelOptions(
  labels: Record<string, string>,
  t: (key: string) => string
) {
  return Object.entries(labels).map(([value, label]) => ({
    value,
    label: t(label),
  }));
}

export function getGiftItemNames(
  items: GiftItem[],
  products: AccountProduct[]
): string {
  return items
    .map(
      ({ product, quantity }) =>
        `${getItem(product, products)?.name ?? product} x${quantity}`
    )
    .join(", ");
}

const QUANTITY_KEY_PREFIX = "quantity_";

export const giftQuantityKey = (productId: string) =>
  `${QUANTITY_KEY_PREFIX}${productId}`;

// Formda oyunlar çoklu seçimle, adetler oyun başına ayrı alanla tutulur.
export type GiftFormValues = Partial<Gift> & {
  products?: string[];
  [key: string]: unknown;
};

export function toGiftFormValues(gift: Gift): GiftFormValues {
  return {
    ...gift,
    products: gift.items.map(({ product }) => product),
    ...Object.fromEntries(
      gift.items.map(({ product, quantity }) => [
        giftQuantityKey(product),
        quantity,
      ])
    ),
  };
}

export function toGiftPayload({
  products = [],
  ...values
}: GiftFormValues): Partial<Gift> {
  return {
    ...Object.fromEntries(
      Object.entries(values).filter(
        ([key]) => !key.startsWith(QUANTITY_KEY_PREFIX)
      )
    ),
    items: products.map((product) => ({
      product,
      quantity: Number(values[giftQuantityKey(product)]) || 1,
    })),
  };
}
