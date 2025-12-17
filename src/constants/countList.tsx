import CountListMenu from "../components/countLists/CountListMenu";

export type CountListOptions = {
  id: string;
  label: string;
  component: JSX.Element;
  isDisabled: boolean;
};

export const countListOptions: CountListOptions[] = [
  {
    id: "0",
    label: "Product Count List",
    component: <CountListMenu />,
    isDisabled: false,
  },
];
