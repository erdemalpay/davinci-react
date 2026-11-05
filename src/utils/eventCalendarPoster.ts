import QRCode from "qrcode";
import { EventCalendarItem } from "../types";
import {
  DAVINCI_LOGO_URL,
  getEventCalendarCard,
  getEventCalendarCardSrc,
  getEventCalendarIconSrc,
  KOA_LOGO_URL,
  POSTER_BACKGROUND_URL,
  toRgb,
} from "./eventCalendarAssets";
import { loadImage } from "./loadImage";
import { eventsUrl } from "./registrationUrl";

const POSTER_WIDTH = 1080;
const POSTER_HEIGHT = 1350;

const FONT = "'Baloo 2', 'Arial Rounded MT Bold', Arial, sans-serif";

export type PosterData = {
  title: string;
  items: EventCalendarItem[];
  hasQr: boolean;
};

type Measure = (text: string) => number;

// Kelimeleri satırlara böler; en fazla maxLines satır, sığmayan son satır "…" ile biter
export const wrapLines = (
  measure: Measure,
  text: string,
  maxWidth: number,
  maxLines: number
) => {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  let consumed = 0;
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (current && measure(next) > maxWidth) {
      if (lines.length === maxLines - 1) break;
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
    consumed += 1;
  }
  if (current) {
    const rest = consumed < words.length ? words.slice(consumed).join(" ") : "";
    let last = rest ? `${current} ${rest}` : current;
    if (measure(last) > maxWidth) {
      while (last.length > 1 && measure(`${last}…`) > maxWidth)
        last = last.slice(0, -1);
      last = `${last.trimEnd()}…`;
    }
    lines.push(last);
  }
  return lines;
};

// Yazı tek satıra sığana kadar küçülür; en küçük boyutta da sığmazsa "…" ile kısalır
export const fitSingleLine = (
  measureAt: (size: number) => Measure,
  text: string,
  maxWidth: number,
  maxSize: number,
  minSize: number
) => {
  for (let size = maxSize; size >= minSize; size -= 1) {
    if (measureAt(size)(text) <= maxWidth) return { size, text };
  }
  const measure = measureAt(minSize);
  let cut = text;
  while (cut.length > 1 && measure(`${cut}…`) > maxWidth)
    cut = cut.slice(0, -1);
  return { size: minSize, text: `${cut.trimEnd()}…` };
};

// Başlık en fazla 2 satıra, kısaltmadan sığacak en büyük boyutta yazılır
export const layoutTitle = (
  measureAt: (size: number) => Measure,
  text: string,
  maxWidth: number
) => {
  const normalized = text.split(/\s+/).filter(Boolean).join(" ");
  for (let size = 84; size >= 34; size -= 2) {
    const lines = wrapLines(measureAt(size), normalized, maxWidth, 2);
    if (lines.join(" ") === normalized) return { size, lines };
  }
  return { size: 34, lines: wrapLines(measureAt(34), normalized, maxWidth, 2) };
};

const ROWS_TOP = 462;
const ROWS_BOTTOM = 1185;
const ROW_GAP = 4;
const ROW_MAX_HEIGHT = 140;

// Satırlar mevcut alanı doldurur; az satırda kartlar ROW_MAX_HEIGHT'ı geçmez
export const getRowHeight = (count: number) =>
  Math.min(
    ROW_MAX_HEIGHT,
    (ROWS_BOTTOM - ROWS_TOP - ROW_GAP * (count - 1)) / Math.max(count, 1)
  );

export const isLightColor = (hex: string) => {
  const [r, g, b] = toRgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.62;
};

const upper = (text: string) => text.toLocaleUpperCase("tr-TR");

// Yazı tipi index.css'te tanımlı; canvas kullanmadan önce yüklenmesi beklenir.
// Yüklenemezse yedek yazı tipiyle çizilir
const loadFont = () =>
  Promise.all([
    document.fonts.load(`800 40px ${FONT}`),
    document.fonts.load(`600 40px ${FONT}`),
  ]).catch(() => undefined);

const roundRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

const outlinedText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fill: string,
  outline: string,
  outlineWidth: number
) => {
  ctx.lineJoin = "round";
  ctx.lineWidth = outlineWidth;
  ctx.strokeStyle = outline;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = fill;
  ctx.fillText(text, x, y);
};

const setFont = (
  ctx: CanvasRenderingContext2D,
  weight: number,
  size: number
) => {
  ctx.font = `${weight} ${size}px ${FONT}`;
};

const measureAt =
  (ctx: CanvasRenderingContext2D, weight: number) =>
  (size: number): Measure =>
  (text) => {
    setFont(ctx, weight, size);
    return ctx.measureText(text).width;
  };

const drawTitle = (ctx: CanvasRenderingContext2D, title: string) => {
  const plate = { x: 55, y: 50, w: 560, h: 215 };
  ctx.save();
  ctx.translate(plate.x + plate.w / 2, plate.y + plate.h / 2);
  ctx.rotate(-0.025);
  ctx.shadowColor = "rgba(0,0,0,0.4)";
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 8;
  roundRect(ctx, -plate.w / 2, -plate.h / 2, plate.w, plate.h, 42);
  ctx.fillStyle = "#fff3d3";
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.lineWidth = 6;
  ctx.strokeStyle = "#5a2a14";
  ctx.stroke();
  const { size, lines } = layoutTitle(
    measureAt(ctx, 800),
    upper(title),
    plate.w - 70
  );
  setFont(ctx, 800, size);
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  const lineHeight = size * 0.98;
  const top = -((lines.length - 1) * lineHeight) / 2 + size * 0.3;
  lines.forEach((line, index) => {
    ctx.fillStyle = "#4a1a10";
    ctx.fillText(line, 0, top + index * lineHeight);
  });
  ctx.restore();

  ctx.save();
  ctx.translate(310, 305);
  ctx.rotate(-0.025);
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 4;
  roundRect(ctx, -215, -30, 430, 60, 12);
  ctx.fillStyle = "#b3261e";
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#7a1612";
  ctx.stroke();
  setFont(ctx, 800, 27);
  ctx.textAlign = "center";
  ctx.fillStyle = "#fff3d3";
  ctx.fillText("DA VINCI BOARD GAME", 0, 9);
  ctx.restore();
};

// Rozet yazısı, satır sayısı ne olursa olsun tüm rozetlerde aynı boyuttadır: en kısa
// rozete 3 satır sığacak ve en geniş kelime iç genişliğe sığacak kadar
const SHORTEST_BADGE_RATIO = 0.735;
const BADGE_INNER = 0.86;
const BADGE_WIDTH_RATIO = 0.162;

const getBadgeFontSize = (
  ctx: CanvasRenderingContext2D,
  items: EventCalendarItem[],
  rowHeight: number
) => {
  const innerH = SHORTEST_BADGE_RATIO * rowHeight * BADGE_INNER;
  const innerW = BADGE_WIDTH_RATIO * CARD_WIDTH * BADGE_INNER;
  let size = (innerH * 0.92) / (3 * 1.02);
  const measure = measureAt(ctx, 800);
  items.forEach((item) =>
    item.badge.forEach((line) => {
      const text = upper(line.trim());
      while (size > 10 && measure(size)(text) > innerW) size -= 0.5;
    })
  );
  return size;
};

// Rozet zemini kart görselinde hazır; burada sadece yazı çizilir
const drawBadge = (
  ctx: CanvasRenderingContext2D,
  item: EventCalendarItem,
  badgeColor: string,
  size: number,
  x: number,
  y: number,
  w: number,
  h: number
) => {
  const lines = item.badge.map((line) => upper(line.trim())).filter(Boolean);
  if (!lines.length) return;
  const isLight = isLightColor(badgeColor);
  const total = lines.length * size * 1.02;
  let cursor = y + (h - total) / 2;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  setFont(ctx, 800, size);
  lines.forEach((text) => {
    cursor += size * 0.86;
    if (isLight) {
      ctx.fillStyle = "#4a2410";
      ctx.fillText(text, x + w / 2, cursor);
    } else {
      outlinedText(
        ctx,
        text,
        x + w / 2,
        cursor,
        "#ffffff",
        "rgba(60,25,10,0.7)",
        Math.max(3, size * 0.12)
      );
    }
    cursor += size * 0.16;
  });
};

const CARD_X = 45;
const CARD_WIDTH = 990;
// İkon kutusu kart yüksekliği kadardır; yazıyla arasında bu pay bırakılır
const ICON_GAP = 55;
// Metnin kart içindeki başlangıcı (kart genişliğine oranı)
const TEXT_START = 0.235;

const drawRow = (
  ctx: CanvasRenderingContext2D,
  item: EventCalendarItem,
  card: HTMLImageElement | null,
  icon: HTMLImageElement | null,
  badgeSize: number,
  y: number,
  h: number
) => {
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.4)";
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 5;
  if (card) {
    ctx.drawImage(card, CARD_X, y, CARD_WIDTH, h);
  } else {
    roundRect(ctx, CARD_X, y, CARD_WIDTH, h, 30);
    ctx.fillStyle = "#f4e2b8";
    ctx.fill();
  }
  ctx.restore();

  const { color, badge } = getEventCalendarCard(item.color);
  drawBadge(
    ctx,
    item,
    color,
    badgeSize,
    CARD_X + badge.x * CARD_WIDTH,
    y + badge.y * h,
    badge.w * CARD_WIDTH,
    badge.h * h
  );

  const textX = CARD_X + TEXT_START * CARD_WIDTH;
  const textWidth =
    CARD_X + CARD_WIDTH - textX - (icon ? h - 6 + ICON_GAP : 45);
  const title = fitSingleLine(
    measureAt(ctx, 800),
    item.title,
    textWidth,
    Math.min(40, h * 0.31),
    18
  );
  const measureDesc = measureAt(ctx, 600);
  let descSize = Math.min(26, Math.max(16, h * 0.2));
  let descLines = item.description
    ? wrapLines(measureDesc(descSize), item.description, textWidth, 2)
    : [];
  // 2 satıra sığmıyorsa ve kart yeterince yüksekse yazı küçülüp 3 satıra iner
  if (h >= 120 && descLines[descLines.length - 1]?.endsWith("…")) {
    descSize -= 4;
    descLines = wrapLines(
      measureDesc(descSize),
      item.description,
      textWidth,
      3
    );
  }
  const descLineHeight = descSize * 1.15;
  const blockHeight =
    title.size * 1.05 +
    (descLines.length ? 4 + descLines.length * descLineHeight : 0);
  let cursor = y + (h - blockHeight) / 2;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  setFont(ctx, 800, title.size);
  ctx.fillStyle = "#7a2417";
  cursor += title.size * 0.85;
  ctx.fillText(title.text, textX, cursor);
  cursor += title.size * 0.2 + 4;
  setFont(ctx, 600, descSize);
  ctx.fillStyle = "#5b3a25";
  descLines.forEach((line) => {
    cursor += descLineHeight * 0.85;
    ctx.fillText(line, textX, cursor);
    cursor += descLineHeight * 0.15;
  });

  if (icon) {
    const box = h - 6;
    const scale = Math.min(box / icon.width, box / icon.height);
    const iw = icon.width * scale;
    const ih = icon.height * scale;
    ctx.drawImage(
      icon,
      CARD_X + CARD_WIDTH - 45 - box / 2 - iw / 2,
      y + h / 2 - ih / 2,
      iw,
      ih
    );
  }
};

// Okun gövdesi ve ucu; renk ve kalınlık parametre, koyu kenar için iki kez çizilir
const strokeArrow = (
  ctx: CanvasRenderingContext2D,
  color: string,
  width: number
) => {
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.moveTo(722, 1314);
  ctx.quadraticCurveTo(790, 1328, 866, 1308);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(850, 1296);
  ctx.lineTo(868, 1308);
  ctx.lineTo(850, 1321);
  ctx.stroke();
};

// Altbilgideki koyu panel (logolar ve QR); arkadaki görsel karışmasın diye neredeyse opak
const drawPlate = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number
) => {
  ctx.save();
  roundRect(ctx, x, y, w, 138, 28);
  ctx.fillStyle = "rgba(35,18,10,0.85)";
  ctx.fill();
  ctx.restore();
};

const drawFooter = (
  ctx: CanvasRenderingContext2D,
  logo: HTMLImageElement | null,
  koaLogo: HTMLImageElement | null,
  qr: HTMLImageElement | null,
  hasQr: boolean
) => {
  // Koyu zemin için hazırlanmış (beyaz yazılı) iki logo yan yana, aralarında ince çizgi
  drawPlate(ctx, 40, 1200, 380);
  if (logo) {
    const height = 120;
    ctx.drawImage(logo, 58, 1209, (logo.width / logo.height) * height, height);
  }
  if (koaLogo) {
    ctx.beginPath();
    ctx.moveTo(184, 1215);
    ctx.lineTo(184, 1323);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(255,243,211,0.45)";
    ctx.stroke();
    const width = 202;
    const height = (koaLogo.height / koaLogo.width) * width;
    ctx.drawImage(koaLogo, 198, 1269 - height / 2, width, height);
  }

  if (!hasQr) return;
  // Sol paneldeki logoların aynası: yazı, ok ve QR tek panelde
  drawPlate(ctx, 660, 1200, 380);
  ctx.textAlign = "center";
  setFont(ctx, 800, 30);
  outlinedText(ctx, "KAYIT İÇİN", 790, 1254, "#fff3d3", "#3a1a0c", 6);
  outlinedText(ctx, "OKUT", 790, 1288, "#fff3d3", "#3a1a0c", 6);
  strokeArrow(ctx, "rgba(58,26,12,0.9)", 10);
  strokeArrow(ctx, "#ffffff", 5);

  roundRect(ctx, 896, 1209, 120, 120, 16);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  if (qr) ctx.drawImage(qr, 902, 1215, 108, 108);
};

// Önizleme, indirme ve herkese açık sayfa aynı çizimi kullanır; çıktı 1080x1350 JPEG
export const renderPoster = async ({ title, items, hasQr }: PosterData) => {
  await loadFont();
  const [background, logo, koaLogo, qr, cards, icons] = await Promise.all([
    loadImage(POSTER_BACKGROUND_URL),
    loadImage(DAVINCI_LOGO_URL),
    loadImage(KOA_LOGO_URL),
    hasQr
      ? QRCode.toDataURL(eventsUrl(), { width: 320, margin: 1 }).then((src) =>
          loadImage(src)
        )
      : null,
    Promise.all(
      items.map((item) => loadImage(getEventCalendarCardSrc(item.color)))
    ),
    Promise.all(
      items.map((item) => {
        const src = getEventCalendarIconSrc(item.icon);
        return loadImage(src, src.startsWith("https://"));
      })
    ),
  ]);
  const canvas = document.createElement("canvas");
  canvas.width = POSTER_WIDTH;
  canvas.height = POSTER_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  ctx.fillStyle = "#3b2414";
  ctx.fillRect(0, 0, POSTER_WIDTH, POSTER_HEIGHT);
  if (background) ctx.drawImage(background, 0, 0, POSTER_WIDTH, POSTER_HEIGHT);
  drawTitle(ctx, title);
  const rowHeight = getRowHeight(items.length);
  const badgeSize = getBadgeFontSize(ctx, items, rowHeight);
  items.forEach((item, index) =>
    drawRow(
      ctx,
      item,
      cards[index],
      icons[index],
      badgeSize,
      ROWS_TOP + index * (rowHeight + ROW_GAP),
      rowHeight
    )
  );
  drawFooter(ctx, logo, koaLogo, qr, hasQr);
  return canvas.toDataURL("image/jpeg", 0.92);
};
