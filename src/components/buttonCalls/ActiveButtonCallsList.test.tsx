import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ButtonCall,
  ButtonCallTypeEnum,
  DeclineReasonEnum,
  GmCallReasonEnum,
} from "../../types";
import {
  ActiveButtonCallsList,
  DECLINE_HOLD_MS,
} from "./ActiveButtonCallsList";

const mocks = vi.hoisted(() => ({
  calls: [] as ButtonCall[],
  decline: vi.fn(),
  claim: vi.fn(),
  finish: vi.fn(),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "en" },
  }),
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
    games: [
      { _id: 10, name: "Catan" },
      { _id: 30, name: "Twilight Imperium" },
    ],
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

  describe("declining my call", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      mocks.calls = [gmCall({ _id: "5", tableName: "T5", assignedTo: "ali" })];
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    const myChip = () => screen.getByLabelText("T5 - Hold to decline");
    const hold = (ms = DECLINE_HOLD_MS) => {
      fireEvent.pointerDown(myChip());
      act(() => {
        vi.advanceTimersByTime(ms);
      });
    };

    it("does nothing on a short tap", () => {
      render(<ActiveButtonCallsList />);

      hold(DECLINE_HOLD_MS - 100);
      fireEvent.pointerUp(myChip());
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(screen.queryByRole("dialog")).toBeNull();
      expect(mocks.decline).not.toHaveBeenCalled();
    });

    it("declines with a listed reason after holding the chip", () => {
      render(<ActiveButtonCallsList />);
      expect(screen.getByText("You")).toBeTruthy();

      hold();
      fireEvent.click(screen.getByText("I'm taking a payment"));

      expect(mocks.decline).toHaveBeenCalledWith({
        id: "5",
        reason: DeclineReasonEnum.TAKING_PAYMENT,
        note: undefined,
        game: undefined,
      });
      expect(screen.queryByRole("dialog")).toBeNull();
    });

    it("needs an explanation for other", () => {
      render(<ActiveButtonCallsList />);

      hold();
      fireEvent.click(screen.getByText("Other"));
      const send = screen.getByRole("button", {
        name: "Decline",
      }) as HTMLButtonElement;
      expect(send.disabled).toBe(true);

      fireEvent.change(screen.getByLabelText("Explanation"), {
        target: { value: " Depoya bakıyorum " },
      });
      fireEvent.click(send);

      expect(mocks.decline).toHaveBeenCalledWith({
        id: "5",
        reason: DeclineReasonEnum.OTHER,
        note: "Depoya bakıyorum",
        game: undefined,
      });
    });

    it("declines an explanation call for not knowing its game", () => {
      mocks.calls = [
        gmCall({
          _id: "5",
          tableName: "T5",
          assignedTo: "ali",
          gmCallReason: GmCallReasonEnum.EXPLANATION,
          game: 10,
        }),
      ];
      render(<ActiveButtonCallsList />);

      hold();
      fireEvent.click(screen.getByText("I don't know the game"));

      expect(mocks.decline).toHaveBeenCalledWith({
        id: "5",
        reason: DeclineReasonEnum.DOESNT_KNOW_GAME,
        note: undefined,
        game: undefined,
      });
    });

    it("asks which game when the call has none", () => {
      render(<ActiveButtonCallsList />);

      hold();
      fireEvent.click(screen.getByText("I don't know the game"));
      expect(mocks.decline).not.toHaveBeenCalled();

      fireEvent.change(screen.getByLabelText("Search for a game"), {
        target: { value: "twi" },
      });
      fireEvent.click(screen.getByText("Twilight Imperium"));

      expect(mocks.decline).toHaveBeenCalledWith({
        id: "5",
        reason: DeclineReasonEnum.DOESNT_KNOW_GAME,
        note: undefined,
        game: 30,
      });
    });

    it("can be cancelled after an accidental hold", () => {
      render(<ActiveButtonCallsList />);

      hold();
      fireEvent.click(screen.getByText("Cancel"));

      expect(screen.queryByRole("dialog")).toBeNull();
      expect(mocks.decline).not.toHaveBeenCalled();
    });

    it("does not start declining when closing the call", () => {
      render(<ActiveButtonCallsList />);

      fireEvent.pointerDown(screen.getByLabelText("Çağrıyı kapat"));
      act(() => {
        vi.advanceTimersByTime(DECLINE_HOLD_MS * 2);
      });

      expect(screen.queryByRole("dialog")).toBeNull();
    });
  });

  it("lets others take over a call assigned to someone else", () => {
    mocks.calls = [gmCall({ _id: "6", assignedTo: "ayse" })];
    render(<ActiveButtonCallsList />);

    expect(screen.getByText("Ayşe")).toBeTruthy();
    fireEvent.click(screen.getByLabelText("Take over"));

    expect(mocks.claim).toHaveBeenCalledWith("6");
  });

  it("hides take over while the user is handling another call", () => {
    mocks.calls = [
      gmCall({ _id: "5", tableName: "T1", assignedTo: "ali" }),
      gmCall({ _id: "6", tableName: "T2", assignedTo: "ayse" }),
    ];
    render(<ActiveButtonCallsList />);

    expect(screen.getByLabelText("T1 - Hold to decline")).toBeTruthy();
    expect(screen.queryByLabelText("Take over")).toBeNull();
  });

  it("shows the requested game on the chip", () => {
    mocks.calls = [
      gmCall({ gmCallReason: GmCallReasonEnum.EXPLANATION, game: 10 }),
    ];
    render(<ActiveButtonCallsList />);

    expect(screen.getByText("Catan")).toBeTruthy();
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
    expect(screen.queryByLabelText(/Hold to decline/)).toBeNull();
  });
});
