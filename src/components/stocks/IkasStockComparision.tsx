import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useGetAccountProducts } from "../../utils/api/account/product";
import { useGetAccountStocks } from "../../utils/api/account/stock";
import { useGetIkasProducts } from "../../utils/api/ikas";
import { useGetMenuItems } from "../../utils/api/menu/menu-item";
import GenericTable from "../panelComponents/Tables/GenericTable";

const IkasStockComparision = () => {
  const { t } = useTranslation();
  const ikasProducts = useGetIkasProducts();
  const items = useGetMenuItems();
  const stocks = useGetAccountStocks();
  const products = useGetAccountProducts();
  const ikasItemsProductsIds = items
    ?.filter((item) => item.ikasId)
    ?.map((item) => item.matchedProduct);
  const ikasItemProducts = products?.filter((product) =>
    ikasItemsProductsIds.includes(product._id)
  );
  const allRows = ikasItemProducts?.map((ikasItemProduct) => {
    return {
      ...ikasItemProduct,
      ikasStock: ikasProducts?.find(
        (ikasProduct) =>
          ikasProduct.id ===
          items.find((item) => item?.matchedProduct === ikasItemProduct._id)
            ?.ikasId
      )?.variants[0]?.stocks[0]?.stockCount,
      storeStock: stocks.find(
        (stock) => stock.product === ikasItemProduct._id && stock.location === 6
      )?.quantity,
    };
  });
  const [rows, setRows] = useState(allRows);
  const [tableKey, setTableKey] = useState(0);
  const columns = [
    { key: t("Product"), isSortable: true },
    { key: t("Ikas Stock"), isSortable: true },
    { key: t("Store Stock"), isSortable: true },
  ];
  const rowKeys = [
    { key: "name" },
    { key: "ikasStock" },
    { key: "storeStock" },
  ];
  useEffect(() => {
    setRows(allRows);
    setTableKey((prev) => prev + 1);
  }, [ikasProducts, items, products, stocks]);
  return (
    <>
      <div className="w-[95%] mx-auto ">
        <GenericTable
          key={tableKey}
          rowKeys={rowKeys}
          columns={columns}
          rows={rows}
          title={t("Ikas Stock Comparision")}
          isActionsActive={false}
          rowClassNameFunction={(row: any) => {
            if (row?.ikasStock > row?.storeStock) {
              return "bg-red-200";
            }
            if (row?.ikasStock < row?.storeStock) {
              return "bg-green-200";
            }
            return "";
          }}
        />
      </div>
    </>
  );
};

export default IkasStockComparision;
