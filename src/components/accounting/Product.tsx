import { useEffect, useState } from "react";
import { AccountProduct, AccountUnit } from "../../types";
import {
  useAccountProductMutations,
  useGetAccountProducts,
} from "../../utils/api/account-product";
import GenericTable from "../panelComponents/Tables/GenericTable";

type Props = {};

const Product = (props: Props) => {
  const products = useGetAccountProducts();
  const [tableKey, setTableKey] = useState(0);
  const { createAccountProduct, deleteAccountProduct, updateAccountProduct } =
    useAccountProductMutations();
  const columns = [
    { key: "Name", isSortable: true },
    { key: "Unit", isSortable: true },
  ];
  const rowKeys = [
    {
      key: "name",
      className: "min-w-32 pr-1",
    },
    {
      key: "unit",
      className: "min-w-32",
      node: (product: AccountProduct) => {
        return <div>{(product.unit as AccountUnit).name}</div>;
      },
    },
  ];
  useEffect(() => setTableKey((prev) => prev + 1), [products]);

  return (
    <>
      <div className="w-[95%] mx-auto my-10">
        <GenericTable
          key={tableKey}
          rowKeys={rowKeys}
          actions={[]}
          columns={columns}
          rows={products}
          title="Products"
        />
      </div>
    </>
  );
};

export default Product;
