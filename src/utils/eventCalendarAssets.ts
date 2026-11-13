// src/assets/event-calendar altındaki görseller; Vite dosya adlarını paketler (hash'li adres)
const urlsOf = (modules: Record<string, string>) =>
  Object.fromEntries(
    Object.entries(modules).map(([path, url]) => [
      path
        .split("/")
        .pop()
        ?.replace(/\.\w+$/, "") ?? path,
      url,
    ])
  );

const iconUrls = urlsOf(
  import.meta.glob("../assets/event-calendar/icons/*.png", {
    eager: true,
    import: "default",
    query: "?url",
  })
);
const cardUrls = urlsOf(
  import.meta.glob("../assets/event-calendar/cards/*.png", {
    eager: true,
    import: "default",
    query: "?url",
  })
);

export { default as POSTER_BACKGROUND_URL } from "../assets/event-calendar/background.jpg";
export { default as DAVINCI_LOGO_URL } from "../assets/event-calendar/davinci-logo.png";
export { default as KOA_LOGO_URL } from "../assets/event-calendar/koa-logo.png";

// Editördeki sıra bu listedir
export const EVENT_CALENDAR_ICON_KEYS = [
  "meeple",
  "cards",
  "castle",
  "notebook",
  "game-box",
  "box-tilted",
  "mushroom",
  "trophy",
  "popcorn",
  "dice-set",
  "hourglass",
  "bag",
  "tokens",
];

// Kart görselleri; rozet rengi görselin içine çizilidir, bu yüzden renk seçimi bu altı
// kartla sınırlıdır. badge: rozetin karttaki konumu (her kartta biraz farklı olduğu için
// yazı kartın kendi rozetine göre ortalanır)
export const EVENT_CALENDAR_CARDS = [
  {
    key: "yellow",
    color: "#f5b400",
    badge: { x: 0.025, y: 0.113, w: 0.163, h: 0.766 },
  },
  {
    key: "teal",
    color: "#78bdb0",
    badge: { x: 0.029, y: 0.065, w: 0.162, h: 0.847 },
  },
  {
    key: "red",
    color: "#de4a3f",
    badge: { x: 0.03, y: 0.076, w: 0.162, h: 0.831 },
  },
  {
    key: "blue",
    color: "#3578b8",
    badge: { x: 0.029, y: 0.114, w: 0.163, h: 0.798 },
  },
  {
    key: "purple",
    color: "#8e5ba8",
    badge: { x: 0.029, y: 0.123, w: 0.162, h: 0.781 },
  },
  {
    key: "green",
    color: "#6b8a35",
    badge: { x: 0.028, y: 0.111, w: 0.163, h: 0.735 },
  },
];

export const BADGE_COLORS = EVENT_CALENDAR_CARDS.map((card) => card.color);

export const toRgb = (hex: string) => {
  const value = parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
};

// Kayıtlı rengi en yakın karta eşler (eski ya da elle girilmiş renkler de çizilir)
export const getEventCalendarCard = (hex: string) => {
  const [r, g, b] = toRgb(hex);
  const distance = (color: string) => {
    const [cr, cg, cb] = toRgb(color);
    return (r - cr) ** 2 + (g - cg) ** 2 + (b - cb) ** 2;
  };
  return EVENT_CALENDAR_CARDS.reduce((best, card) =>
    distance(card.color) < distance(best.color) ? card : best
  );
};

export const getEventCalendarCardSrc = (hex: string) =>
  cardUrls[getEventCalendarCard(hex).key];

export const getEventCalendarIconSrc = (icon: string) => {
  if (EVENT_CALENDAR_ICON_KEYS.includes(icon)) return iconUrls[icon];
  return icon.startsWith("https://") ? icon : "";
};
