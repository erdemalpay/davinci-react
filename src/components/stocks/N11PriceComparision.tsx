import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { TbTag } from "react-icons/tb";
import { useGetAccountProducts } from "../../utils/api/account/product";
import { useGetMenuItems } from "../../utils/api/menu/menu-item";
import {
  useGetN11Products,
  useUpdateAllN11PricesMutation,
  useUpdateN11PriceMutation,
} from "../../utils/api/n11";
import GenericTable from "../panelComponents/Tables/GenericTable";
import ButtonFilter from "../panelComponents/common/ButtonFilter";

interface N11PriceRow {
  _id: string;
  name: string;
  n11Price: number;
  itemPrice?: number;
  itemOnlinePrice?: number;
  stockCode?: string;
}

const N11PriceComparision = () => {
  const { t } = useTranslation();
  const n11Products = useGetN11Products();
  const items = useGetMenuItems();
  const products = useGetAccountProducts();
  const { mutate: updateAllN11Prices } = useUpdateAllN11PricesMutation();
  const { mutate: updateN11Price } = useUpdateN11PriceMutation();

  const n11ItemsProductsIds = useMemo(() => {
    return items
      ?.filter((item) => item.n11StockCode)
      ?.map((item) => item.matchedProduct);
  }, [items]);

  const n11ItemProducts = useMemo(() => {
    return products?.filter((product) =>
      n11ItemsProductsIds.includes(product._id)
    );
  }, [products, n11ItemsProductsIds]);

  const rows = useMemo(() => {
    return n11ItemProducts
      ?.map((n11ItemProduct) => {
        const foundItem = items.find(
          (item) => item.matchedProduct === n11ItemProduct._id
        );
        const foundN11Product = n11Products?.find(
          (n11Product) => n11Product.stockCode === foundItem?.n11StockCode
        );

        return {
          ...n11ItemProduct,
          n11Price: foundN11Product?.salePrice || 0,
          itemPrice: foundItem?.price,
          itemOnlinePrice: foundItem?.onlinePrice,
          stockCode: foundN11Product?.stockCode,
        };
      })
      .sort((a, b) => {
        const getOrder = (row: N11PriceRow) => {
          if ((row.itemOnlinePrice ?? 0) > row.n11Price) return 0;
          if ((row.itemOnlinePrice ?? 0) < row.n11Price) return 1;
          return 2;
        };
        return getOrder(a) - getOrder(b);
      });
  }, [n11ItemProducts, items, n11Products]);

  const columns = useMemo(
    () => [
      { key: t("Product"), isSortable: true },
      { key: t("n11 Price"), isSortable: true },
      { key: t("Item Price"), isSortable: true },
      { key: t("Item Online Price"), isSortable: true },
      { key: t("Actions"), isSortable: false },
    ],
    [t]
  );

  const rowKeys = useMemo(
    () => [
      { key: "name" },
      { key: "n11Price" },
      { key: "itemPrice" },
      { key: "itemOnlinePrice" },
    ],
    []
  );

  const actions = useMemo(
    () => [
      {
        name: t("Update n11 Price"),
        icon: <TbTag />,
        className: "cursor-pointer text-2xl",
        onClick: (row: N11PriceRow) => {
          if (
            !row.stockCode ||
            !row.itemOnlinePrice ||
            row.n11Price === row.itemOnlinePrice
          )
            return;
          updateN11Price({
            stockCode: row.stockCode,
            price: row.itemOnlinePrice,
          });
        },
      },
    ],
    [t, updateN11Price]
  );

  const filters = useMemo(
    () => [
      {
        isUpperSide: false,
        node: (
          <ButtonFilter
            buttonName={t("Update All n11 Prices")}
            onclick={() => {
              updateAllN11Prices();
            }}
          />
        ),
      },
    ],
    [t, updateAllN11Prices]
  );

  return (
    <>
      <div className="w-[95%] mx-auto ">
        <GenericTable
          rowKeys={rowKeys}
          columns={columns}
          rows={rows}
          title={t("n11 Price Comparison")}
          filters={filters}
          isActionsActive={true}
          actions={actions}
          rowClassNameFunction={(row: N11PriceRow) => {
            if ((row?.itemOnlinePrice ?? 0) > row?.n11Price)
              return "bg-red-200";
            if ((row?.itemOnlinePrice ?? 0) < row?.n11Price)
              return "bg-green-200";
            return "";
          }}
        />
      </div>
    </>
  );
};

export default N11PriceComparision;
