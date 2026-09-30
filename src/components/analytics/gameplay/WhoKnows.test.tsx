import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { User } from "../../../types";
import WhoKnows from "./WhoKnows";

const games = [
  { _id: 10, name: "Catan" },
  { _id: 20, name: "Azul" },
];

const users = [
  {
    _id: "alice",
    name: "Alice",
    active: true,
    userGames: [{ game: 10, learnDate: "2026-01-01" }],
  },
  {
    _id: "bob",
    name: "Bob",
    active: true,
    userGames: [{ game: 20, learnDate: "2026-01-01" }],
  },
] as User[];

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock("../../../utils/api/game", () => ({
  useGetGamesMinimal: () => games,
}));

vi.mock("../../../utils/api/user", () => ({
  useGetAllUsers: () => users,
}));

vi.mock("../../../utils/api/panelControl/disabledCondition", () => ({
  useGetDisabledConditions: () => [],
}));

vi.mock("../../panelComponents/Tables/GenericTable", () => ({
  default: ({ rows }: { rows: Array<{ mentor: string }> }) => (
    <div>
      {rows.map((row) => (
        <span key={row.mentor}>{row.mentor}</span>
      ))}
    </div>
  ),
}));

describe("WhoKnows", () => {
  it("renders the game menu above the table header through a body portal", async () => {
    const user = userEvent.setup();
    const { container } = render(<WhoKnows />);

    await user.click(screen.getByRole("combobox"));

    const listbox = screen.getByRole("listbox");
    expect(container).not.toContainElement(listbox);
    expect(listbox.parentElement?.parentElement).toHaveStyle({
      zIndex: 9999,
    });
  });

  it("filters mentors by the selected game and restores them when cleared", async () => {
    const user = userEvent.setup();
    render(<WhoKnows />);

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();

    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByText("Catan"));

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.queryByText("Bob")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button"));

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });
});
