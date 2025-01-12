import { IkasProduct } from "../../types";
import { Paths, useGetList } from "./factory";

export function useGetIkasProducts() {
  return useGetList<IkasProduct>(`${Paths.Ikas}/product`);
}
