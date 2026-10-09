import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Order, Table } from "../../../types";
import OrderTotal from "./OrderTotal";

const mocks = vi.hoisted(() => ({
  paymentAmount: "",
  temporaryOrders: [] as { order: Order; quantity: number }[],
  setPaymentAmount: vi.fn(),
  setTemporaryOrders: vi.fn(),
  setIsDiscountScreenOpen: vi.fn(),
  setIsProductSelectionOpen: vi.fn(),
  setSplitPayment: vi.fn(),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock("../../../context/Data.context", () => ({
  useDataContext: () => ({
    menuItems: [{ _id: 7, name: "Espresso" }],
  }),
}));

vi.mock("../../../context/Order.context", () => ({
  useOrderContext: () => ({
    paymentAmount: mocks.paymentAmount,
    temporaryOrders: mocks.temporaryOrders,
    splitPayment: null,
    setPaymentAmount: mocks.setPaymentAmount,
    setTemporaryOrders: mocks.setTemporaryOrders,
    setIsDiscountScreenOpen: mocks.setIsDiscountScreenOpen,
    setIsProductSelectionOpen: mocks.setIsProductSelectionOpen,
    setSplitPayment: mocks.setSplitPayment,
  }),
}));

const table = { _id: 1 } as Table;
const firstOrder = {
  _id: 42,
  item: 7,
  quantity: 2,
  paidQuantity: 0,
  unitPrice: 10,
} as Order;
const secondOrder = {
  _id: 43,
  item: 8,
  quantity: 1,
  paidQuantity: 0,
  unitPrice: 5,
} as Order;

const renderOrderTotal = (tableOrders: Order[] = [firstOrder]) =>
  render(
    <OrderTotal
      tableOrders={tableOrders}
      table={table}
      collectionsTotalAmount={0}
      refundAmount={0}
      unpaidAmount={10}
    />
  );

describe("OrderTotal unassigned payment note", () => {
  beforeEach(() => {
    mocks.paymentAmount = "";
    mocks.temporaryOrders = [];
  });

  it("explains the difference when all outstanding orders are selected for a lower amount", () => {
    mocks.paymentAmount = "10";
    mocks.temporaryOrders = [{ order: firstOrder, quantity: 2 }];

    renderOrderTotal();

    expect(
      screen.getByText(
        "The selected orders total differs from the amount to collect because previous payments were made without selecting orders."
      )
    ).toBeInTheDocument();
  });

  it("does not show the note while an outstanding order remains unselected", () => {
    mocks.paymentAmount = "10";
    mocks.temporaryOrders = [{ order: firstOrder, quantity: 2 }];

    renderOrderTotal([firstOrder, secondOrder]);

    expect(
      screen.queryByText(
        "The selected orders total differs from the amount to collect because previous payments were made without selecting orders."
      )
    ).not.toBeInTheDocument();
  });

  it("does not show the note when the selected total matches the amount to collect", () => {
    mocks.paymentAmount = "20";
    mocks.temporaryOrders = [{ order: firstOrder, quantity: 2 }];

    renderOrderTotal();

    expect(
      screen.queryByText(
        "The selected orders total differs from the amount to collect because previous payments were made without selecting orders."
      )
    ).not.toBeInTheDocument();
  });
});
