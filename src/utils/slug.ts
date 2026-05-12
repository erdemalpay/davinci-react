export const normalizeText = (text: string) =>
  text
    .toLowerCase()
    .replace(/ı/g, "i")
    .replace(/i̇/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c");

export const getTabSlug = (label: string) =>
  normalizeText(label)
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "tab";

export default getTabSlug;
