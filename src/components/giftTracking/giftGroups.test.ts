import { describe, expect, it } from "vitest";
import { AccountProduct, Gift, GiftRecipient, GiftTag } from "../../types";
import {
  formatGiftDate,
  getGiftItemNames,
  getLabelOptions,
  getTagNames,
  giftQuantityKey,
  groupGifts,
  toGiftFormValues,
  toGiftPayload,
} from "./giftGroups";

const recipient = (
  _id: number,
  name: string,
  overrides: Partial<GiftRecipient> = {}
): GiftRecipient => ({
  _id,
  name,
  tags: [],
  isBlacklisted: false,
  ...overrides,
});

const gift = (
  _id: number,
  recipientId: number,
  date: string,
  type = "GIFT"
): Gift => ({
  _id,
  recipient: recipientId,
  date,
  items: [{ product: "trio_turkce", quantity: 1 }],
  type,
  createdBy: "mehmet",
});

const recipients = [
  recipient(1, "Nefes", { tags: [10] }),
  recipient(2, "İstanbul Kültür", { tags: [20], isBlacklisted: true }),
  recipient(3, "Aday"),
];
const gifts = [
  gift(1, 1, "2026-05-22"),
  gift(2, 1, "2026-10-09"),
  gift(3, 2, "2026-09-09", "LOAN"),
];

describe("groupGifts", () => {
  it("hediyeleri alıcıya göre gruplar ve son gönderime göre sıralar", () => {
    const groups = groupGifts(recipients, gifts);
    expect(groups.map((group) => group.name)).toEqual([
      "Nefes",
      "İstanbul Kültür",
    ]);
    expect(groups[0].total).toBe(2);
    expect(groups[0].lastDate).toBe("2026-10-09");
    expect(groups[0].gifts.map((item) => item._id)).toEqual([2, 1]);
  });

  it("hediyesi olmayan alıcıyı listelemez", () => {
    expect(
      groupGifts(recipients, gifts).map((group) => group._id)
    ).not.toContain(3);
  });

  it("etikete göre süzer", () => {
    expect(
      groupGifts(recipients, gifts, { tags: [20] }).map((group) => group._id)
    ).toEqual([2]);
  });

  it("kara listeye göre süzer", () => {
    expect(
      groupGifts(recipients, gifts, { blacklistedOnly: true }).map(
        (group) => group._id
      )
    ).toEqual([2]);
  });

  it("tarih aralığında yalnızca aralıktaki hediyeleri bırakır", () => {
    const groups = groupGifts(recipients, gifts, {
      after: "2026-10-01",
      before: "2026-10-31",
    });
    expect(groups.map((group) => group._id)).toEqual([1]);
    expect(groups[0].gifts.map((item) => item._id)).toEqual([2]);
    expect(groups[0].total).toBe(1);
  });

  it("tek taraflı tarih filtresinde hediyesi olmayan alıcıyı çıkarır", () => {
    expect(
      groupGifts(recipients, gifts, { after: "2026-09-01" }).map(
        (group) => group._id
      )
    ).toEqual([1, 2]);
    expect(
      groupGifts(recipients, gifts, { before: "2026-05-31" }).map(
        (group) => group._id
      )
    ).toEqual([1]);
  });

  it("türe göre grup içindeki hediyeleri süzer, o türden hediyesi olmayanı gizler", () => {
    const groups = groupGifts(recipients, gifts, { type: "LOAN" });
    expect(groups.map((group) => group._id)).toEqual([2]);
    expect(groups[0].total).toBe(1);
    expect(groups[0].gifts.map((item) => item._id)).toEqual([3]);
  });

  it("toplam ve son tarihi tür süzgecinden sonra hesaplar", () => {
    const mixed = [...gifts, gift(4, 1, "2026-11-01", "LOAN")];
    const [group] = groupGifts(recipients, mixed, {
      type: "GIFT",
      tags: [10],
    });
    expect(group.total).toBe(2);
    expect(group.lastDate).toBe("2026-10-09");
  });

  it("tür süzgeci diğer ölçütlerle birlikte çalışır", () => {
    expect(
      groupGifts(recipients, gifts, {
        type: "GIFT",
        blacklistedOnly: true,
      })
    ).toEqual([]);
    expect(
      groupGifts(recipients, gifts, {
        type: "LOAN",
        after: "2026-10-01",
      })
    ).toEqual([]);
  });
});

describe("formatGiftDate", () => {
  it("tarihi proje biçiminde yazar", () => {
    expect(formatGiftDate("2026-08-27")).toBe("27/08/2026");
  });

  it("boş tarihte boş döner", () => {
    expect(formatGiftDate("")).toBe("");
  });
});

describe("getTagNames", () => {
  it("etiket adlarını birleştirir", () => {
    const tags = [
      { _id: 10, name: "Dernek", active: true },
      { _id: 20, name: "Fenomen", active: true },
    ] as GiftTag[];
    expect(getTagNames([20, 10], tags)).toBe("Fenomen, Dernek");
  });
});

describe("getLabelOptions", () => {
  it("etiket haritasını çevrilmiş seçeneklere dönüştürür", () => {
    expect(getLabelOptions({ GIFT: "Gift" }, (key) => `${key}!`)).toEqual([
      { value: "GIFT", label: "Gift!" },
    ]);
  });
});

describe("getGiftItemNames", () => {
  it("oyun adlarını adetleriyle yazar, bulunamayanda id'yi kullanır", () => {
    const products = [{ _id: "trio_turkce", name: "Trio" }] as AccountProduct[];
    expect(
      getGiftItemNames(
        [
          { product: "trio_turkce", quantity: 2 },
          { product: "silinmis", quantity: 1 },
        ],
        products
      )
    ).toBe("Trio x2, silinmis x1");
  });
});

describe("toGiftPayload", () => {
  it("oyun başına adetleri kalemlere çevirir, form alanlarını atar", () => {
    expect(
      toGiftPayload({
        date: "2026-11-09",
        products: ["catan", "kale"],
        [giftQuantityKey("catan")]: 2,
        [giftQuantityKey("kale")]: 1,
      })
    ).toEqual({
      date: "2026-11-09",
      items: [
        { product: "catan", quantity: 2 },
        { product: "kale", quantity: 1 },
      ],
    });
  });

  it("adet girilmeyen oyunu 1 sayar", () => {
    expect(toGiftPayload({ products: ["catan"] }).items).toEqual([
      { product: "catan", quantity: 1 },
    ]);
  });
});

describe("toGiftFormValues", () => {
  it("kalemleri oyun seçimine ve adet alanlarına açar", () => {
    const values = toGiftFormValues({
      ...gift(1, 1, "2026-11-09"),
      items: [{ product: "catan", quantity: 3 }],
    });
    expect(values.products).toEqual(["catan"]);
    expect(values[giftQuantityKey("catan")]).toBe(3);
  });
});
