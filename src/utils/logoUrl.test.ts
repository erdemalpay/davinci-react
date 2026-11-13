import { describe, expect, it } from "vitest";
import { cleanLogoUrl } from "./logoUrl";

describe("cleanLogoUrl", () => {
  it("Cloudinary adresine kırpma ve şeffaf arka plan ekler, https'e çevirir", () => {
    expect(
      cleanLogoUrl(
        "http://res.cloudinary.com/dvbg/image/upload/v1/tournament/logo.jpg"
      )
    ).toBe(
      "https://res.cloudinary.com/dvbg/image/upload/e_trim:10/e_make_transparent:10/f_png/v1/tournament/logo.jpg"
    );
  });

  it("Cloudinary olmayan adrese dokunmaz", () => {
    expect(cleanLogoUrl("https://example.com/logo.png")).toBe(
      "https://example.com/logo.png"
    );
  });
});
