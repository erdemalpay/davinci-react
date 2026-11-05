import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useMemo, useState } from "react";
import { MemoryRouter } from "react-router-dom";
import { expect, it, vi } from "vitest";
import { GeneralContextProvider } from "../../../context/General.context";
import { FormElementsState } from "../../../types";
import { FormKeyTypeEnum, InputTypes } from "../shared/types";
import GenericAddEditPanel from "./GenericAddEditPanel";
import { DataContextProvider } from "../../../context/Data.context";
import Tables from "../../../pages/Tables";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  initReactI18next: { type: "3rdParty", init: () => undefined },
}));
vi.mock("../../header/Header", () => ({
  Header: () => null,
}));

function StockForm() {
  const [form, setForm] = useState<FormElementsState>({});
  const inputs = useMemo(() => [
    {
      type: InputTypes.TAB,
      formKey: "product",
      label: "Product",
      placeholder: "Choose product",
      options: [{ value: "catan", label: "Catan" }],
      invalidateKeys: [{ key: "addToInventory", defaultValue: false }],
    },
    {
      type: InputTypes.SELECT,
      formKey: "location",
      label: "Location",
      options: [{ value: 1, label: `Cafe (Stock: ${form.product === "catan" ? 7 : 0})` }],
    },
  ], [form.product]);
  return <GenericAddEditPanel<FormElementsState>
    isOpen
    inputs={inputs}
    formKeys={[
      { key: "product", type: FormKeyTypeEnum.STRING },
      { key: "location", type: FormKeyTypeEnum.NUMBER },
      { key: "addToInventory", type: FormKeyTypeEnum.BOOLEAN },
    ]}
    constantValues={{ location: 1 }}
    setForm={setForm}
    submitItem={() => {}}
  />;
}

it("updates the selected location's stock label after choosing a product in the tab picker", async () => {
  const user = userEvent.setup();
  render(<QueryClientProvider client={new QueryClient()}>
    <GeneralContextProvider><StockForm /></GeneralContextProvider>
  </QueryClientProvider>);
  expect(screen.getByText("Cafe (Stock: 0)")).toBeInTheDocument();
  await user.click(screen.getByText("Choose product"));
  await user.click(screen.getByRole("button", { name: "Catan" }));
  expect(await screen.findByText("Cafe (Stock: 7)")).toBeInTheDocument();
  expect(screen.queryByText("Cafe (Stock: 0)")).not.toBeInTheDocument();
});

it("shows a product's cached stock in the Tables consumption modal", async () => {
  const user = userEvent.setup();
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(["/accounting/products"], [{ _id: "catan", name: "Catan" }]);
  client.setQueryData(["/accounting/stocks"], [{ _id: "stock-1", product: "catan", location: 1, quantity: 7 }]);
  client.setQueryData(["/location/all"], [{ _id: 1, name: "Cafe", active: true }]);
  render(<QueryClientProvider client={client}><MemoryRouter>
    <DataContextProvider><GeneralContextProvider><Tables /></GeneralContextProvider></DataContextProvider>
  </MemoryRouter></QueryClientProvider>);
  await user.click(screen.getAllByRole("button", { name: "Product Consumption" })[0]);
  await user.click(screen.getByText("Product", { selector: ".text-gray-400" }));
  await user.click(screen.getByRole("button", { name: "Catan" }));
  expect(await screen.findByText("Cafe (Stock: 7)")).toBeInTheDocument();
});
