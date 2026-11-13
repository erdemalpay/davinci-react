import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import RegistrationNote from "./RegistrationNote";

// navigation/constants i18n'i de yüklediği için yalnızca useTranslation değiştirilir
vi.mock("react-i18next", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-i18next")>()),
  useTranslation: () => ({ t: (key: string) => key }),
}));

const renderNote = (note: string, checkInCode?: string) =>
  render(
    <MemoryRouter>
      <RegistrationNote note={note} checkInCode={checkInCode} />
    </MemoryRouter>
  );

describe("RegistrationNote", () => {
  it("{iptal} yerine kaydı iptal etme sayfasına giden bağlantı koyar", () => {
    renderNote("Değişirse {iptal}.", "KOD123");
    const link = screen.getByRole("link", { name: "CancelRegistrationHere" });
    expect(link.getAttribute("href")).toBe(
      "/tournament/registration/KOD123/cancel"
    );
    expect(screen.getByText(/Değişirse/).textContent).toBe(
      "Değişirse CancelRegistrationHere."
    );
  });

  it("kayıt kodu yoksa yalnızca metni yazar", () => {
    renderNote("Değişirse {iptal}.");
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByText(/Değişirse/).textContent).toBe(
      "Değişirse CancelRegistrationHere."
    );
  });

  it("{iptal} yoksa notu olduğu gibi gösterir", () => {
    renderNote("Sırayla alınırsınız", "KOD123");
    expect(screen.getByText("Sırayla alınırsınız")).toBeTruthy();
    expect(screen.queryByRole("link")).toBeNull();
  });
});
