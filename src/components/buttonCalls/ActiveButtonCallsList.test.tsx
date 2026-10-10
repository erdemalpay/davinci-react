import { act, fireEvent, render, screen, within } from "@testing-library/react";
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
  breakWarning: null as string | null,
}));

vi.mock("../../hooks/useBreakWarning", () => ({
  useBreakWarning: () => ({
    warning: mocks.breakWarning,
    text: "Not enough staff",
  }),
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
    mocks.breakWarning = null;
  });

  describe("holding my call", () => {
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
    // Hold, then "I can't take care of the table".
    const holdAndCant = () => {
      hold();
      fireEvent.click(screen.getByText("I can't take care of the table"));
    };

    it("does nothing on a short tap", () => {
      render(<ActiveButtonCallsList />);

      hold(DECLINE_HOLD_MS - 100);
      fireEvent.pointerUp(myChip());
      fireEvent.click(myChip());
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(screen.queryByRole("dialog")).toBeNull();
      expect(mocks.decline).not.toHaveBeenCalled();
      expect(mocks.finish).not.toHaveBeenCalled();
    });

    it("closes the call when the table was taken care of", () => {
      render(<ActiveButtonCallsList />);
      expect(screen.getByText("You")).toBeTruthy();

      hold();
      expect(screen.getByText("Table T5")).toBeTruthy();
      fireEvent.click(screen.getByText("The table was taken care of"));

      expect(mocks.finish).toHaveBeenCalledWith(
        expect.objectContaining({ tableName: "T5" })
      );
      expect(mocks.decline).not.toHaveBeenCalled();
      expect(screen.queryByRole("dialog")).toBeNull();
    });

    it("asks why when I can't take care of the table", () => {
      render(<ActiveButtonCallsList />);

      holdAndCant();
      expect(screen.getByText("Why?")).toBeTruthy();
      // The same choices as the Busy button.
      for (const label of [
        "Break",
        "I'm recommending a game",
        "I'm preparing an order",
        "I'm taking a payment",
        "WC",
        "Other",
      ]) {
        expect(screen.getByText(label)).toBeTruthy();
      }
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

      holdAndCant();
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

    it("shows the call's game for help, which can be changed", () => {
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

      holdAndCant();
      fireEvent.click(screen.getByText("I don't know the game"));
      expect(
        screen.getByText("Which game does the table need help with?")
      ).toBeTruthy();
      // Preselected in the dialog (the chip shows the game too).
      expect(
        within(screen.getByRole("dialog")).getByText("Catan")
      ).toBeTruthy();

      fireEvent.click(screen.getByText("Change game"));
      fireEvent.change(screen.getByLabelText("Search for a game"), {
        target: { value: "twi" },
      });
      fireEvent.click(screen.getByText("Twilight Imperium"));
      fireEvent.click(screen.getByRole("button", { name: "Decline" }));

      expect(mocks.decline).toHaveBeenCalledWith({
        id: "5",
        reason: DeclineReasonEnum.DOESNT_KNOW_GAME,
        note: undefined,
        game: 30,
      });
    });

    it("needs a game when the call has none", () => {
      render(<ActiveButtonCallsList />);

      holdAndCant();
      fireEvent.click(screen.getByText("I don't know the game"));
      const send = screen.getByRole("button", {
        name: "Decline",
      }) as HTMLButtonElement;
      expect(send.disabled).toBe(true);

      fireEvent.change(screen.getByLabelText("Search for a game"), {
        target: { value: "cat" },
      });
      fireEvent.click(screen.getByText("Catan"));
      fireEvent.click(send);

      expect(mocks.decline).toHaveBeenCalledWith(
        expect.objectContaining({
          reason: DeclineReasonEnum.DOESNT_KNOW_GAME,
          game: 10,
        })
      );
    });

    it("declines for a break right away when the cafe has enough staff", () => {
      render(<ActiveButtonCallsList />);

      holdAndCant();
      fireEvent.click(screen.getByText("Break"));

      expect(mocks.decline).toHaveBeenCalledWith(
        expect.objectContaining({ reason: DeclineReasonEnum.BREAK })
      );
    });

    it("asks before declining for a break when the cafe is short", () => {
      mocks.breakWarning = "lowStaff";
      render(<ActiveButtonCallsList />);

      holdAndCant();
      fireEvent.click(screen.getByText("Break"));

      expect(mocks.decline).not.toHaveBeenCalled();
      expect(screen.getByText("Not enough staff")).toBeTruthy();
    });

    it("can be cancelled after an accidental hold", () => {
      render(<ActiveButtonCallsList />);

      hold();
      fireEvent.click(screen.getByText("Cancel"));

      expect(screen.queryByRole("dialog")).toBeNull();
      expect(mocks.decline).not.toHaveBeenCalled();
      expect(mocks.finish).not.toHaveBeenCalled();
    });
  });

  describe("tapping someone else's call", () => {
    it("lets me take it over", () => {
      mocks.calls = [gmCall({ _id: "6", assignedTo: "ayse" })];
      render(<ActiveButtonCallsList />);

      expect(screen.getByText("Ayşe")).toBeTruthy();
      fireEvent.click(screen.getByLabelText("T1 - Take over or close"));
      fireEvent.click(screen.getByText("Take over"));

      expect(mocks.claim).toHaveBeenCalledWith("6");
    });

    it("lets me close it", () => {
      mocks.calls = [gmCall({ _id: "6", assignedTo: "ayse" })];
      render(<ActiveButtonCallsList />);

      fireEvent.click(screen.getByLabelText("T1 - Take over or close"));
      fireEvent.click(screen.getByText("Close call"));

      expect(mocks.finish).toHaveBeenCalledWith(
        expect.objectContaining({ tableName: "T1" })
      );
    });

    it("only offers closing while I'm handling another call", () => {
      mocks.calls = [
        gmCall({ _id: "5", tableName: "T1", assignedTo: "ali" }),
        gmCall({ _id: "6", tableName: "T2", assignedTo: "ayse" }),
      ];
      render(<ActiveButtonCallsList />);

      fireEvent.click(screen.getByLabelText("T2 - Close call"));

      expect(screen.getByText("Close call")).toBeTruthy();
      expect(screen.queryByText("Take over")).toBeNull();
    });

    it("has no buttons on the chip", () => {
      mocks.calls = [gmCall({ _id: "6", assignedTo: "ayse" })];
      render(<ActiveButtonCallsList />);

      expect(screen.queryByLabelText("Take over")).toBeNull();
      expect(screen.queryByText("✕")).toBeNull();
    });
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

  describe("service calls", () => {
    it("shows the assignee and can be taken over", () => {
      mocks.calls = [
        gmCall({
          _id: "8",
          tableName: "T8",
          type: ButtonCallTypeEnum.ORDERCALL,
          assignedTo: "ayse",
        }),
      ];
      render(<ActiveButtonCallsList />);

      expect(screen.getByText("Ayşe")).toBeTruthy();
      fireEvent.click(screen.getByLabelText("T8 - Take over or close"));
      fireEvent.click(screen.getByText("Take over"));
      expect(mocks.claim).toHaveBeenCalledWith("8");
    });

    it('are declined without the "I don\'t know the game" option', () => {
      vi.useFakeTimers();
      mocks.calls = [
        gmCall({
          _id: "8",
          tableName: "T8",
          type: ButtonCallTypeEnum.ORDERCALL,
          assignedTo: "ali",
        }),
      ];
      render(<ActiveButtonCallsList />);

      fireEvent.pointerDown(screen.getByLabelText("T8 - Hold to decline"));
      act(() => {
        vi.advanceTimersByTime(DECLINE_HOLD_MS);
      });
      vi.useRealTimers();
      fireEvent.click(screen.getByText("I can't take care of the table"));

      expect(screen.queryByText("I don't know the game")).toBeNull();
      fireEvent.click(screen.getByText("I'm taking a payment"));
      expect(mocks.decline).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "8",
          reason: DeclineReasonEnum.TAKING_PAYMENT,
        })
      );
    });
  });
});
