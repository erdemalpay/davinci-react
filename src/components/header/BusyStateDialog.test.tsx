import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BreakTypeEnum } from "../../types";
import { BusyStateDialog } from "./BusyStateDialog";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "en" },
  }),
}));

describe("BusyStateDialog", () => {
  it("offers a break among the busy states", () => {
    const onSelect = vi.fn();
    render(<BusyStateDialog onSelect={onSelect} onCancel={vi.fn()} />);

    fireEvent.click(screen.getByText("Break"));
    expect(onSelect).toHaveBeenCalledWith(BreakTypeEnum.BREAK);
  });

  it("selects a busy state", () => {
    const onSelect = vi.fn();
    render(<BusyStateDialog onSelect={onSelect} onCancel={vi.fn()} />);

    fireEvent.click(screen.getByText("I'm taking a payment"));
    expect(onSelect).toHaveBeenCalledWith(BreakTypeEnum.TAKING_PAYMENT);
  });

  it("offers WC", () => {
    const onSelect = vi.fn();
    render(<BusyStateDialog onSelect={onSelect} onCancel={vi.fn()} />);

    fireEvent.click(screen.getByText("WC"));
    expect(onSelect).toHaveBeenCalledWith(BreakTypeEnum.WC);
  });

  it("asks for an explanation for other", () => {
    const onSelect = vi.fn();
    render(<BusyStateDialog onSelect={onSelect} onCancel={vi.fn()} />);

    fireEvent.click(screen.getByText("Other"));
    const submit = screen.getByText("Mark me busy") as HTMLButtonElement;
    expect(submit.disabled).toBe(true);

    fireEvent.change(screen.getByLabelText("Explanation"), {
      target: { value: "  Depoya gidiyorum " },
    });
    fireEvent.click(submit);
    expect(onSelect).toHaveBeenCalledWith(
      BreakTypeEnum.OTHER,
      "Depoya gidiyorum"
    );
  });

  it("can be cancelled", () => {
    const onCancel = vi.fn();
    const onSelect = vi.fn();
    render(<BusyStateDialog onSelect={onSelect} onCancel={onCancel} />);

    fireEvent.click(screen.getByText("Cancel"));
    expect(onCancel).toHaveBeenCalled();
    expect(onSelect).not.toHaveBeenCalled();
  });
});
