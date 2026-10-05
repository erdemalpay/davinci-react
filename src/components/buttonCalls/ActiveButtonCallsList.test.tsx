import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ButtonCall, ButtonCallTypeEnum, GmCallReasonEnum } from "../../types";
import { ActiveButtonCallsList } from "./ActiveButtonCallsList";

const mocks = vi.hoisted(() => ({
  calls: [] as ButtonCall[],
  decline: vi.fn(),
  claim: vi.fn(),
  finish: vi.fn(),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock("../../context/Location.context", () => ({
  useLocationContext: () => ({ selectedLocationId: 1 }),
}));

vi.mock("../../context/User.context", () => ({
  useUserContext: () => ({ user: { _id: "ali" } }),
}));

vi.mock("../../context/Data.context", () => ({
  useDataContext: () => ({
    users: [
      { _id: "ali", name: "Ali" },
      { _id: "ayse", name: "Ayşe" },
    ],
    games: [{ _id: 10, name: "Catan" }],
  }),
}));

vi.mock("../../utils/api/buttonCall", () => ({
  useGetActiveButtonCalls: () => mocks.calls,
  useFinishButtonCallMutation: () => ({ mutate: mocks.finish }),
  useDeclineButtonCallMutation: () => ({ mutate: mocks.decline }),
  useClaimButtonCallMutation: () => ({ mutate: mocks.claim }),
}));

const gmCall = (overrides: Partial<ButtonCall>): ButtonCall => ({
  _id: "1",
  tableName: "T1",
  location: 1,
  date: "2026-10-05",
  type: ButtonCallTypeEnum.GAMEMASTERCALL,
  startHour: "12:00:00",
  callCount: 1,
  ...overrides,
});

describe("ActiveButtonCallsList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lets the assigned game master decline the call", () => {
    mocks.calls = [gmCall({ _id: "5", assignedTo: "ali" })];
    render(<ActiveButtonCallsList />);

    expect(screen.getByText("You")).toBeTruthy();
    fireEvent.click(screen.getByLabelText("I can't go"));

    expect(mocks.decline).toHaveBeenCalledWith("5");
    expect(mocks.claim).not.toHaveBeenCalled();
  });

  it("lets others take over a call assigned to someone else", () => {
    mocks.calls = [gmCall({ _id: "6", assignedTo: "ayse" })];
    render(<ActiveButtonCallsList />);

    expect(screen.getByText("Ayşe")).toBeTruthy();
    fireEvent.click(screen.getByLabelText("Take over"));

    expect(mocks.claim).toHaveBeenCalledWith("6");
  });

  it("shows the reason, game and assignee in the title", () => {
    mocks.calls = [
      gmCall({
        gmCallReason: GmCallReasonEnum.EXPLANATION,
        game: 10,
        assignedTo: "ayse",
      }),
    ];
    render(<ActiveButtonCallsList />);

    expect(
      screen.getByTitle(/Game explanation · Catan · Assigned to: Ayşe/)
    ).toBeTruthy();
  });

  it("does not show assignment controls on service calls", () => {
    mocks.calls = [gmCall({ type: ButtonCallTypeEnum.ORDERCALL })];
    render(<ActiveButtonCallsList />);

    expect(screen.queryByLabelText("Take over")).toBeNull();
    expect(screen.queryByLabelText("I can't go")).toBeNull();
  });
});
