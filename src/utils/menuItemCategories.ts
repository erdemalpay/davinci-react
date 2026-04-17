import type { MenuItem } from "../types";

/** Birincil + ek kategori ID'leri (sıralı, mükerrersiz). */
export function getMenuItemCategoryIds(item: MenuItem): number[] {
  const primary = item.category;
  const extra = item.additionalCategories ?? [];
  const seen = new Set<number>([primary]);
  const out: number[] = [primary];
  for (const id of extra) {
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

/** Ürün bu menü kategorisi sekmesine (birincil veya ek) bağlı mı? */
export function itemBelongsToMenuCategory(
  item: MenuItem,
  categoryId: number
): boolean {
  return (
    item.category === categoryId ||
    (item.additionalCategories?.includes(categoryId) ?? false)
  );
}
