import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ButtonCall, ButtonCallTypeEnum, DeclineReasonEnum } from "../../types";
import { BreakButton } from "./BreakButton";

const mocks = vi.hoisted(() => ({
  calls: [] as ButtonCall[],
  createBreak: vi.fn(),
  decline: vi.fn(),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock("react-toastify", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}));
vi.mock("../../context/User.context", () => ({
  useUserContext: () => ({ user: { _id: "ali" } }),
}));
vi.mock("../../context/Location.context", () => ({
  useLocationContext: () => ({ selectedLocationId: 1 }),
}));
vi.mock("../../context/Data.context", () => ({
  useDataContext: () => ({ visits: [{ user: "ali", location: 1 }] }),
}));
vi.mock("../../utils/api/break", () => ({
  useBreakMutations: () => ({
    createBreak: mocks.createBreak,
    updateBreak: vi.fn(),
  }),
  useGetBreaksByLocation: () => [],
}));
vi.mock("../../utils/api/middleman", () => ({
  useGetMiddlemanByLocation: () => [],
}));
vi.mock("../../hooks/useBreakWarning", () => ({
  useBreakWarning: () => ({ warning: null, text: "" }),
}));
vi.mock("../../utils/api/buttonCall", () => ({
  useGetActiveButtonCalls: () => mocks.calls,
  useDeclineButtonCallMutation: () => ({ mutate: mocks.decline }),
}));

const myCall = {
  _id: "7",
  tableName: "5",
  location: 1,
  date: "2026-10-12",
  type: ButtonCallTypeEnum.GAMEMASTERCALL,
  startHour: "12:00:00",
  callCount: 1,
  assignedTo: "ali",
} as ButtonCall;

const goBusy = (label: string) => {
  fireEvent.click(screen.getByTitle("Busy"));
  fireEvent.click(screen.getByText(label));
};

describe("BreakButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.calls = [];
  });

  it("starts a break", () => {
    render(<BreakButton />);

    goBusy("Break");

    expect(mocks.createBreak).toHaveBeenCalledWith(
      expect.objectContaining({ user: "ali", type: "BREAK" })
    );
    expect(mocks.decline).not.toHaveBeenCalled();
  });

  it("hands back my call with the same reason while holding one", () => {
    mocks.calls = [myCall];
    render(<BreakButton />);

    goBusy("Break");

    expect(mocks.decline).toHaveBeenCalledWith({
      id: "7",
      reason: DeclineReasonEnum.BREAK,
    });
    expect(mocks.createBreak).not.toHaveBeenCalled();
  });

  it("keeps the note of other when handing back my call", () => {
    mocks.calls = [myCall];
    render(<BreakButton />);

    goBusy("Other");
    fireEvent.change(screen.getByLabelText("Explanation"), {
      target: { value: "Depo" },
    });
    fireEvent.click(screen.getByText("Mark me busy"));

    expect(mocks.decline).toHaveBeenCalledWith({
      id: "7",
      reason: DeclineReasonEnum.OTHER,
      note: "Depo",
    });
  });
});
