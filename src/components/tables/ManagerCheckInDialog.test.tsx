import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ManagerCheckInDialog } from "./ManagerCheckInDialog";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

// A plain select stands in for the react-select input.
vi.mock("../common/SelectInput", () => ({
  default: ({
    options,
    value,
    onChange,
  }: {
    options: { value: string; label: string }[];
    value: { value: string } | null;
    onChange: (option: { value: string; label: string } | null) => void;
  }) => (
    <select
      aria-label="User"
      value={value?.value}
      onChange={(e) =>
        onChange(options.find((o) => o.value === e.target.value) ?? null)
      }
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  ),
}));

const users = [
  { _id: "erdem", name: "Erdem" },
  { _id: "ceren", name: "Ceren" },
] as never[];

describe("ManagerCheckInDialog", () => {
  it("checks the manager in by default", () => {
    const onConfirm = vi.fn();
    render(
      <ManagerCheckInDialog
        users={users}
        currentUserId="erdem"
        isInCafe={() => false}
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText("Check in"));
    expect(onConfirm).toHaveBeenCalledWith("erdem");
  });

  it("checks someone else in, or out when they're in the cafe", () => {
    const onConfirm = vi.fn();
    render(
      <ManagerCheckInDialog
        users={users}
        currentUserId="erdem"
        isInCafe={(id) => id === "ceren"}
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />
    );

    fireEvent.change(screen.getByLabelText("User"), {
      target: { value: "ceren" },
    });
    fireEvent.click(screen.getByText("Check out"));
    expect(onConfirm).toHaveBeenCalledWith("ceren");
  });
});
