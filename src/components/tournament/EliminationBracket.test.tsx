import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  MatchStage,
  Tournament,
  TournamentFormat,
  TournamentMatch,
  TournamentStatus,
  Tiebreaker,
} from "../../types/tournament";
import EliminationBracket from "./EliminationBracket";
import { SeatEditing } from "./useSeatEditing";

// navigation/constants i18n'i de yüklediği için yalnızca useTranslation değiştirilir
vi.mock("react-i18next", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-i18next")>()),
  useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock("../../utils/api/tournament", () => ({
  useTournamentActions: () => ({
    submitScores: vi.fn(),
    moveParticipant: vi.fn(),
    removeParticipant: vi.fn(),
  }),
}));

// Gerçek turnuvadaki en uzun isim (25 karakter)
const LONG_NAME = "Hasibe Melis Koşar İpsala";

const tournament = {
  _id: 1,
  format: TournamentFormat.LEAGUE_THEN_ELIMINATION,
  status: TournamentStatus.ONGOING,
  tableSize: 4,
  eliminationTableSize: 4,
} as Tournament;

const match: TournamentMatch = {
  _id: 10,
  tournamentId: 1,
  stage: MatchStage.ELIMINATION,
  round: 1,
  tableNo: 1,
  isBye: false,
  isCompleted: false,
  players: [1, 2, 3, 4].map((participantId) => ({ participantId })),
};

const names = new Map([
  [1, LONG_NAME],
  [2, "Ali Demir"],
  [3, "Ayşe Kaya"],
  [4, "Kaan Sönmez"],
]);

const participants = [1, 2, 3, 4].map((_id) => ({ _id, isActive: true }));

const seatEditing: SeatEditing = {
  selected: undefined,
  isSelected: () => false,
  select: vi.fn(),
  moveTo: vi.fn(),
  remove: vi.fn(),
  canMoveTo: () => false,
  overlay: null,
};

const renderBracket = (props: { editable: boolean; pickOrder?: boolean }) =>
  render(
    <EliminationBracket
      tournament={
        props.pickOrder
          ? { ...tournament, tiebreaker: Tiebreaker.SCORE }
          : tournament
      }
      matches={[match]}
      participants={participants}
      names={names}
      editableRound={props.editable ? match.round : undefined}
      seatEditing={props.editable ? seatEditing : undefined}
    />
  );

// Uzun isimler kesilip "…" kalmasın: tek satırda durur, sığmazsa üstüne gelince tam adı görünür
describe("EliminationBracket uzun isimler", () => {
  it("puan girilen satırda isim tek satırda, tam adı tooltip'te", () => {
    renderBracket({ editable: true });
    expect(screen.getAllByRole("spinbutton")).toHaveLength(4);
    const name = screen.getByText(LONG_NAME);
    expect(name.getAttribute("title")).toBe(LONG_NAME);
    expect(name.className).toContain("truncate");
    expect(name.className).toContain("text-xs");
    expect(name.className).not.toContain("break-words");
  });

  it("sadece görüntülenen satırda da isim tek satırda, tam adı tooltip'te", () => {
    renderBracket({ editable: false });
    expect(screen.queryAllByRole("spinbutton")).toHaveLength(0);
    const name = screen.getByText(LONG_NAME);
    expect(name.getAttribute("title")).toBe(LONG_NAME);
    expect(name.className).toContain("truncate");
    expect(name.className).not.toContain("break-words");
  });

  it("kısa isimlerin de tooltip'i kendi adıdır", () => {
    renderBracket({ editable: true });
    expect(screen.getByText("Ali Demir").getAttribute("title")).toBe(
      "Ali Demir"
    );
  });

  it("tur sütunu uzun ismin sığacağı genişliktedir", () => {
    const { container } = renderBracket({ editable: true });
    expect(container.querySelector(".w-\\[21rem\\]")).not.toBeNull();
    expect(container.querySelector(".w-60")).toBeNull();
  });

  it("seçim sırası etiketi isim kutusunun dışında durur, isimle birlikte kesilmez", () => {
    renderBracket({ editable: true, pickOrder: true });
    const badge = screen.getAllByText("Pick Order N")[0];
    const name = screen.getByText(LONG_NAME);
    expect(name.contains(badge)).toBe(false);
    expect(badge.className).not.toContain("truncate");
    expect(name.className).toContain("truncate");
  });
});
