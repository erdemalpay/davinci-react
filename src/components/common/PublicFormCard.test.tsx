import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import PublicFormCard from "./PublicFormCard";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const renderCard = (isBrandBackground?: boolean) =>
  render(
    <PublicFormCard
      title="Başlık"
      subtitle="Alt başlık"
      isBrandBackground={isBrandBackground}
    >
      <p>içerik</p>
    </PublicFormCard>
  );

describe("PublicFormCard", () => {
  it("keeps the blue look of the campaign and cancel pages by default", () => {
    const { container, getByAltText } = renderCard();
    const outer = container.firstElementChild;
    expect(outer).toHaveClass("from-blue-50", "to-indigo-100");
    expect(outer).not.toHaveClass("from-[#f5f5f0]");
    expect(outer?.querySelector('[style*="background-image"]')).toBeNull();
    expect(getByAltText("Davinci Board Game Cafe")).toHaveClass("h-12");
  });

  it("uses the login page background when asked", () => {
    const { container } = renderCard(true);
    const outer = container.firstElementChild;
    expect(outer).toHaveClass("from-[#f5f5f0]");
    expect(outer).not.toHaveClass("from-blue-50");
    expect(outer?.querySelector('[style*="background-image"]')).not.toBeNull();
  });

  it("centres on the visible height so the phone address bar does not push it down", () => {
    const { container } = renderCard();
    expect(container.firstElementChild).toHaveClass("min-h-[100dvh]");
  });
});
