import { describe, expect, it } from "vitest";
import {
  EVENT_CALENDAR_CARDS,
  getEventCalendarCard,
  getEventCalendarIconSrc,
} from "./eventCalendarAssets";
import {
  fitSingleLine,
  getRowHeight,
  isLightColor,
  layoutTitle,
  wrapLines,
} from "./eventCalendarPoster";

// Her karakter 10 birim genişliğinde
const measure = (text: string) => text.length * 10;
const measureAt = (size: number) => (text: string) => text.length * size;

describe("wrapLines", () => {
  it("wraps words into lines that fit", () => {
    expect(wrapLines(measure, "aaa bbb ccc", 70, 3)).toEqual([
      "aaa bbb",
      "ccc",
    ]);
  });

  it("ends the last line with an ellipsis when text does not fit", () => {
    const lines = wrapLines(measure, "aaa bbb ccc ddd eee", 70, 2);
    expect(lines).toHaveLength(2);
    expect(lines[1].endsWith("…")).toBe(true);
    expect(measure(lines[1])).toBeLessThanOrEqual(70);
  });

  it("returns nothing for empty text", () => {
    expect(wrapLines(measure, "  ", 70, 2)).toEqual([]);
  });
});

describe("fitSingleLine", () => {
  it("keeps the largest size that fits", () => {
    expect(fitSingleLine(measureAt, "abcd", 100, 40, 10)).toEqual({
      size: 25,
      text: "abcd",
    });
  });

  it("shortens the text at the minimum size", () => {
    const result = fitSingleLine(measureAt, "abcdefghij", 50, 20, 10);
    expect(result.size).toBe(10);
    expect(result.text.endsWith("…")).toBe(true);
  });
});

describe("layoutTitle", () => {
  it("uses the largest size that fits in two lines without cutting", () => {
    const { size, lines } = layoutTitle(
      measureAt,
      "KASIM AYI ETKİNLİKLERİ",
      600
    );
    expect(lines.join(" ")).toBe("KASIM AYI ETKİNLİKLERİ");
    expect(lines.length).toBeLessThanOrEqual(2);
    expect(size).toBeGreaterThan(34);
  });
});

describe("getRowHeight", () => {
  it("caps the height with few rows and shrinks with many", () => {
    expect(getRowHeight(2)).toBe(140);
    expect(getRowHeight(8)).toBeLessThan(getRowHeight(6));
  });
});

describe("isLightColor", () => {
  it("tells light and dark badge colors apart", () => {
    expect(isLightColor("#f2b632")).toBe(true);
    expect(isLightColor("#3f6fb5")).toBe(false);
  });
});

describe("getEventCalendarIconSrc", () => {
  it("maps preset keys, keeps https urls and drops everything else", () => {
    expect(getEventCalendarIconSrc("meeple")).toContain("meeple");
    expect(getEventCalendarIconSrc("https://x.com/a.png")).toBe(
      "https://x.com/a.png"
    );
    expect(getEventCalendarIconSrc("javascript:alert(1)")).toBe("");
    expect(getEventCalendarIconSrc("")).toBe("");
  });
});

describe("getEventCalendarCard", () => {
  it("returns the card of an exact preset color", () => {
    EVENT_CALENDAR_CARDS.forEach((card) =>
      expect(getEventCalendarCard(card.color).key).toBe(card.key)
    );
  });

  it("maps any other color to the nearest card", () => {
    expect(getEventCalendarCard("#ff0000").key).toBe("red");
    expect(getEventCalendarCard("#0000ff").key).toBe("blue");
  });
});
