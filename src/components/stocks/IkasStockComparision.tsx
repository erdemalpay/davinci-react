import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { RiFileTransferFill } from "react-icons/ri";
import { TbTransferOut } from "react-icons/tb";
import { useGetAccountProducts } from "../../utils/api/account/product";
import {
  useAccountStockMutations,
  useGetAccountStocks,
} from "../../utils/api/account/stock";
import {
  useGetIkasProducts,
  useUpdateIkasProductStockMutation,
} from "../../utils/api/ikas";
import { useGetMenuItems } from "../../utils/api/menu/menu-item";
import GenericTable from "../panelComponents/Tables/GenericTable";

const IkasStockComparision = () => {
  const { t } = useTranslation();
  const ikasProducts = useGetIkasProducts();
  const items = useGetMenuItems();
  const stocks = useGetAccountStocks();
  const products = useGetAccountProducts();
  const { mutate: updateIkasProductStock } =
    useUpdateIkasProductStockMutation();
  const { updateAccountStock } = useAccountStockMutations();
  const ikasItemsProductsIds = items
    ?.filter((item) => item.ikasId)
    ?.map((item) => item.matchedProduct);
  const ikasItemProducts = products?.filter((product) =>
    ikasItemsProductsIds.includes(product._id)
  );
  const allRows = ikasItemProducts
    ?.map((ikasItemProduct) => {
      const foundStock = stocks.find(
        (stock) => stock.product === ikasItemProduct._id && stock.location === 6
      );
      return {
        ...ikasItemProduct,
        ikasStock: ikasProducts?.find(
          (ikasProduct) =>
            ikasProduct.id ===
            items.find((item) => item?.matchedProduct === ikasItemProduct._id)
              ?.ikasId
        )?.variants[0]?.stocks[0]?.stockCount,
        storeStock: foundStock?.quantity,
        storeStockId: foundStock?._id,
        foundStock: foundStock,
      };
    })
    .sort((a, b) => {
      const isAEqual = a.ikasStock === a.storeStock;
      const isBEqual = b.ikasStock === b.storeStock;
      if (isAEqual && !isBEqual) return 1;
      if (!isAEqual && isBEqual) return -1;
      return 0;
    });
  const [rows, setRows] = useState(allRows);
  const [tableKey, setTableKey] = useState(0);
  const columns = [
    { key: t("Product"), isSortable: true },
    { key: t("Ikas Stock"), isSortable: true },
    { key: t("Store Stock"), isSortable: true },
    { key: t("Actions"), isSortable: false },
  ];
  const rowKeys = [
    { key: "name" },
    { key: "ikasStock" },
    { key: "storeStock" },
  ];
  const actions = [
    {
      name: t("Update Store Stock"),
      icon: <RiFileTransferFill />,
      className: " cursor-pointer text-2xl",
      onClick: (row: any) => {
        if (row.ikasStock === row.storeStock) return;
        updateAccountStock({
          id: row?.storeStockId,
          updates: {
            ...row?.foundStock,
            quantity: row?.ikasStock,
          },
        });
      },
    },
    {
      name: t("Update Ikas Stock"),
      icon: <TbTransferOut />,
      className: " cursor-pointer text-2xl",
      onClick: (row: any) => {
        const foundItemIkasId = items.find(
          (item) => item.matchedProduct === row._id
        )?.ikasId;
        if (row.ikasStock === row.storeStock || !foundItemIkasId) return;
        updateIkasProductStock({
          productId: foundItemIkasId,
          stockLocationId: 6,
          stockCount: row.storeStock,
        });
      },
    },
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
          isActionsActive={true}
          actions={actions}
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
