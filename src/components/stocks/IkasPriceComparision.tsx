import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useGetAccountProducts } from "../../utils/api/account/product";
import { useGetAccountStocks } from "../../utils/api/account/stock";
import { useGetIkasProducts } from "../../utils/api/ikas";
import {
  useGetMenuItems,
  useUpdateIkasPricesMutation,
} from "../../utils/api/menu/menu-item";
import GenericTable from "../panelComponents/Tables/GenericTable";
import ButtonFilter from "../panelComponents/common/ButtonFilter";

const IkasPriceComparision = () => {
  const { t } = useTranslation();
  const ikasProducts = useGetIkasProducts();
  const ONLINE_PRICE_LIST_ID = "2ca3e615-516c-4c09-8f6d-6c3183699c21";
  const items = useGetMenuItems();
  const stocks = useGetAccountStocks();
  const products = useGetAccountProducts();
  const { mutate: updateIkasPrices } = useUpdateIkasPricesMutation();
  const ikasItemsProductsIds = items
    ?.filter((item) => item.ikasId)
    ?.map((item) => item.matchedProduct);
  const ikasItemProducts = products?.filter((product) =>
    ikasItemsProductsIds.includes(product._id)
  );
  const allRows = ikasItemProducts
    ?.map((ikasItemProduct) => {
      const foundItem = items.find(
        (item) => item.matchedProduct === ikasItemProduct._id
      );
      return {
        ...ikasItemProduct,
        ikasPrice: ikasProducts?.find(
          (ikasProduct) =>
            ikasProduct.id ===
            items.find((item) => item?.matchedProduct === ikasItemProduct._id)
              ?.ikasId
        )?.variants[0]?.prices[0]?.sellPrice,
        ikasOnlinePrice: ikasProducts
          ?.find(
            (ikasProduct) =>
              ikasProduct.id ===
              items.find((item) => item?.matchedProduct === ikasItemProduct._id)
                ?.ikasId
          )
          ?.variants[0]?.prices.find(
            (price) => price.priceListId === ONLINE_PRICE_LIST_ID
          )?.sellPrice,
        itemPrice: foundItem?.price,
        itemOnlinePrice: foundItem?.onlinePrice,
      };
    })
    .sort((a, b) => {
      const isAEqual = a.ikasPrice === a.itemPrice;
      const isBEqual = b.ikasPrice === b.itemPrice;
      if (isAEqual && !isBEqual) return 1;
      if (!isAEqual && isBEqual) return -1;
      return 0;
    });
  const [rows, setRows] = useState(allRows);
  const [tableKey, setTableKey] = useState(0);
  const columns = [
    { key: t("Product"), isSortable: true },
    { key: t("Ikas Price"), isSortable: true },
    { key: t("Ikas Online Price"), isSortable: true },
    { key: t("Item Price"), isSortable: true },
    { key: t("Item Online Price"), isSortable: true },
  ];
  const rowKeys = [
    { key: "name" },
    { key: "ikasPrice" },
    { key: "ikasOnlinePrice" },
    { key: "itemPrice" },
    { key: "itemOnlinePrice" },
  ];
  const filters = [
    {
      isUpperSide: false,
      node: (
        <ButtonFilter
          buttonName={t("Update Ikas Prices")}
          onclick={() => {
            updateIkasPrices();
          }}
        />
      ),
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
          title={t("Ikas Price Comparision")}
          filters={filters}
          isActionsActive={false}
          rowClassNameFunction={(row: any) => {
            if (
              row?.ikasPrice > row?.itemPrice ||
              row?.ikasOnlinePrice > row?.itemOnlinePrice
            ) {
              return "bg-red-200";
            }
            if (
              row?.ikasPrice < row?.itemPrice ||
              row?.ikasOnlinePrice < row?.itemOnlinePrice
            ) {
              return "bg-green-200";
            }
            return "";
          }}
        />
      </div>
    </>
  );
};

export default IkasPriceComparision;
