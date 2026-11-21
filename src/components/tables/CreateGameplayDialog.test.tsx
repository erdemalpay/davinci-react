import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Table, TableTypes } from "../../types";
import { CreateGameplayDialog } from "./CreateGameplayDialog";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock("react-toastify", () => ({ toast: { error: vi.fn() } }));
vi.mock("../../context/Data.context", () => ({
  useDataContext: () => ({ users: [] }),
}));
vi.mock("../../hooks/useIsSmallScreen", () => ({ default: () => false }));
vi.mock("../../utils/api/buttonCall", () => ({
  useGetActiveButtonCalls: () => [],
}));
vi.mock("../../utils/api/gameplay", () => ({
  useCreateGameplayMutation: () => ({ mutate: vi.fn() }),
  useGetPopularGamesLast30Days: () => [],
}));

type PanelProps = {
  inputs: { formKey: string }[];
  formKeys: { key: string }[];
  constantValues: Record<string, unknown>;
};
let panel: PanelProps;
// The form panel only records what the dialog gives it.
vi.mock("../panelComponents/FormElements/GenericAddEditPanel", () => ({
  default: (props: PanelProps) => {
    panel = props;
    return null;
  },
}));

const table = (overrides: Partial<Table>) =>
  ({
    _id: 7,
    name: "12",
    date: "2026-10-30",
    location: 1,
    playerCount: 0,
    type: TableTypes.NORMAL,
    gameplays: [],
    ...overrides,
  } as unknown as Table);

const open = (t: Table) =>
  render(
    <CreateGameplayDialog
      isOpen
      close={vi.fn()}
      gameplay={{}}
      table={t}
      mentors={[]}
      games={[]}
    />
  );

describe("CreateGameplayDialog automatic entry", () => {
  beforeEach(() => {
    panel = undefined as unknown as PanelProps;
  });

  it("has no automatic entry on an activity table", () => {
    open(table({ type: TableTypes.ACTIVITY, tables: ["23", "24"] } as never));

    expect(panel.inputs.map((i) => i.formKey)).not.toContain("isAutoEntry");
    expect(panel.formKeys.map((k) => k.key)).not.toContain("isAutoEntry");
    expect(panel.constantValues.isAutoEntry).toBe(false);
  });

  it("offers automatic entry, on by default, on an ordinary table", () => {
    open(table({ playerCount: 2 }));

    expect(panel.inputs.map((i) => i.formKey)).toContain("isAutoEntry");
    expect(panel.formKeys.map((k) => k.key)).toContain("isAutoEntry");
    expect(panel.constantValues.isAutoEntry).toBe(true);
  });
});
