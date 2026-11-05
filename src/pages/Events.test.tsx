import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Events from "./Events";

const mockTournaments = vi.fn();
const mockButton = vi.fn();

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock("../utils/api/eventQr", () => ({
  useGetPublicEventQrButton: () => mockButton(),
}));
vi.mock("../utils/api/tournament", () => ({
  useGetOpenTournaments: () => mockTournaments(),
}));

describe("Events", () => {
  beforeEach(() => {
    mockTournaments.mockReturnValue([]);
    mockButton.mockReturnValue("");
  });

  it("links each open tournament to its registration form", () => {
    mockTournaments.mockReturnValue([
      { _id: 1, name: "Kale Kombo", date: "2026-11-15", slug: "kale" },
    ]);
    render(<Events />);
    const link = screen.getAllByRole("link")[0];
    expect(link.getAttribute("href")).toBe(
      `${window.location.origin}/tournament/kale?source=qr`
    );
  });

  it("shows the extra button with its own link", () => {
    mockButton.mockReturnValue({
      title: "Tasarım Günü",
      url: "https://example.com/kayit",
    });
    render(<Events />);
    expect(
      screen.getByRole("link", { name: "Tasarım Günü" }).getAttribute("href")
    ).toBe("https://example.com/kayit");
  });

  it("shows only the welcome text when nothing is open", () => {
    render(<Events />);
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByText("Choose the event you want to join")).toBeTruthy();
  });

  it("waits for both requests before showing the page", () => {
    mockButton.mockReturnValue(undefined);
    render(<Events />);
    expect(screen.queryByText("Choose the event you want to join")).toBeNull();
  });
});
