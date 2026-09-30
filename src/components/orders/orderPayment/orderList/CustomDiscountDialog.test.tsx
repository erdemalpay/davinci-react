import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Order, OrderDiscount } from "../../../../types";
import CustomDiscountDialog from "./CustomDiscountDialog";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const order = {
  _id: 42,
  item: 7,
  quantity: 3,
  paidQuantity: 1,
  unitPrice: 10,
} as Order;

const discount = {
  _id: 9,
  name: "Manager custom discount",
  isCustom: true,
  isNoteRequired: true,
} as OrderDiscount;

const renderDialog = (overrides = {}) => {
  const props = {
    isOpen: true,
    order,
    itemName: "Espresso",
    discount,
    isPending: false,
    close: vi.fn(),
    submit: vi.fn(),
    ...overrides,
  };
  render(<CustomDiscountDialog {...props} />);
  return props;
};

describe("CustomDiscountDialog", () => {
  it("shows the item and remaining quantity and defaults quantity to one", () => {
    renderDialog();

    expect(screen.getByText("Espresso")).toBeInTheDocument();
    expect(screen.getByText("Remaining quantity: 2")).toBeInTheDocument();
    expect(screen.getByLabelText("Affected Quantity")).toHaveValue(1);
  });

  it("does not submit invalid values", async () => {
    const user = userEvent.setup();
    const { submit } = renderDialog();

    await user.click(screen.getByRole("button", { name: "Apply" }));

    expect(submit).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Enter a valid total discount amount"
    );
  });

  it("submits exact values and remains mounted", async () => {
    const user = userEvent.setup();
    const { submit } = renderDialog();

    await user.type(screen.getByLabelText("Total Discount Amount"), "12.5");
    fireEvent.change(screen.getByLabelText("Affected Quantity"), {
      target: { value: "2" },
    });
    await user.type(screen.getByLabelText("Discount Note"), "Customer care");
    await user.click(screen.getByRole("button", { name: "Apply" }));

    expect(submit).toHaveBeenCalledTimes(1);
    expect(submit).toHaveBeenCalledWith({
      totalDiscountAmount: 12.5,
      affectedQuantity: 2,
      note: "Customer care",
    });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("disables Apply while the mutation is pending", () => {
    renderDialog({ isPending: true });

    expect(screen.getByRole("button", { name: "Apply" })).toBeDisabled();
  });

  it("only asks for a note when the custom discount requires one", () => {
    renderDialog({
      discount: { ...discount, isNoteRequired: false },
    });

    expect(screen.queryByLabelText("Discount Note")).not.toBeInTheDocument();
  });
});
