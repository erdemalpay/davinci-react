import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Order, OrderDiscount, OrderStatus, Table } from "../../../../types";
import UnpaidOrders from "./UnpaidOrders";

const mocks = vi.hoisted(() => ({
  discounts: [] as OrderDiscount[],
  createOrderForDiscount: vi.fn(),
  cancelOrderForDiscount: vi.fn(),
  updateOrder: vi.fn(),
  setPaymentAmount: vi.fn(),
  setTemporaryOrders: vi.fn(),
  setIsOrderDivisionActive: vi.fn(),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock("@material-tailwind/react", () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("../../../../context/Data.context", () => ({
  useDataContext: () => ({
    menuItems: [{ _id: 7, name: "Espresso" }],
  }),
}));

vi.mock("../../../../context/Order.context", () => ({
  useOrderContext: () => ({
    temporaryOrders: [],
    paymentAmount: "",
    isOrderDivisionActive: false,
    setPaymentAmount: mocks.setPaymentAmount,
    setTemporaryOrders: mocks.setTemporaryOrders,
    setIsOrderDivisionActive: mocks.setIsOrderDivisionActive,
  }),
}));

vi.mock("../../../../context/User.context", () => ({
  useUserContext: () => ({ user: { role: { _id: 1 } } }),
}));

vi.mock("../../../../utils/api/order/order", () => ({
  useCancelOrderForDiscountMutation: () => ({
    mutate: mocks.cancelOrderForDiscount,
  }),
  useCreateOrderForDiscountMutation: () => ({
    mutate: mocks.createOrderForDiscount,
    isPending: false,
  }),
  useOrderMutations: () => ({ updateOrder: mocks.updateOrder }),
}));

vi.mock("../../../../utils/api/order/orderDiscount", () => ({
  useGetOrderDiscounts: () => mocks.discounts,
}));

vi.mock("../../../common/SelectInput", () => ({
  default: () => null,
}));

vi.mock("./OrderScreenHeader", () => ({
  default: ({ header }: { header: string }) => <h2>{header}</h2>,
}));

const table = { _id: 1, isOnlineSale: false } as Table;
const order = {
  _id: 42,
  item: 7,
  quantity: 3,
  paidQuantity: 1,
  unitPrice: 10,
  status: OrderStatus.SERVED,
} as Order;
const customDiscount = {
  _id: 9,
  name: "Manager custom discount",
  isCustom: true,
  isStoreOrder: true,
  isOnlineOrder: false,
  isNoteRequired: true,
} as OrderDiscount;

const renderUnpaidOrders = (tableOrders: Order[] = [order]) =>
  render(
    <UnpaidOrders
      table={table}
      tableOrders={tableOrders}
      collectionsTotalAmount={0}
    />
  );

describe("UnpaidOrders custom discount action", () => {
  beforeEach(() => {
    mocks.discounts = [customDiscount];
  });

  it("shows the action only for an eligible undiscounted order with unpaid units", () => {
    const { unmount } = renderUnpaidOrders();
    expect(
      screen.getByRole("button", { name: "Apply Custom Discount" })
    ).toBeInTheDocument();
    unmount();

    renderUnpaidOrders([{ ...order, discount: 3 }]);
    expect(
      screen.queryByRole("button", { name: "Apply Custom Discount" })
    ).not.toBeInTheDocument();
  });

  it("shows the action for an unscoped custom definition on a store order", () => {
    mocks.discounts = [
      { ...customDiscount, isStoreOrder: false, isOnlineOrder: false },
    ];
    renderUnpaidOrders();

    expect(
      screen.getByRole("button", { name: "Apply Custom Discount" })
    ).toBeInTheDocument();
  });

  it("shows a black transparent action immediately after the price", () => {
    renderUnpaidOrders();

    const price = screen
      .getAllByText((_, element) => element?.textContent === "20.00₺")
      .find((element) => element.tagName === "P");
    const action = screen.getByRole("button", {
      name: "Apply Custom Discount",
    });

    expect(
      price?.compareDocumentPosition(action) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(action).toHaveClass("bg-transparent", "text-black");
    expect(action).not.toHaveClass("bg-red-50", "text-red-600");
  });

  it("opens the clicked order and closes only after mutation success", async () => {
    const user = userEvent.setup();
    renderUnpaidOrders();

    await user.click(
      screen.getByRole("button", { name: "Apply Custom Discount" })
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText("Espresso")).toBeInTheDocument();

    await user.type(screen.getByLabelText("New Unit Price"), "8");
    fireEvent.change(screen.getByLabelText("Affected Quantity"), {
      target: { value: "2" },
    });
    await user.type(screen.getByLabelText("Discount Note"), "  Customer care  ");
    await user.click(screen.getByRole("button", { name: "Apply" }));

    expect(mocks.createOrderForDiscount).toHaveBeenCalledTimes(1);
    expect(mocks.createOrderForDiscount.mock.calls[0][0]).toEqual({
      orders: [
        { totalQuantity: 3, selectedQuantity: 2, orderId: 42 },
      ],
      discount: 9,
      customDiscountAmount: 4,
      discountNote: "Customer care",
    });
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    const mutationOptions = mocks.createOrderForDiscount.mock.calls[0][1];
    mutationOptions.onError?.();
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    act(() => mutationOptions.onSuccess());
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    );
  });
});
