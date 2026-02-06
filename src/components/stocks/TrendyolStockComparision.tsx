import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { RiFileTransferFill } from "react-icons/ri";
import { TbTag, TbTransferOut } from "react-icons/tb";
import { useGetAccountProducts } from "../../utils/api/account/product";
import {
  useAccountStockMutations,
  useGetAccountStocks,
} from "../../utils/api/account/stock";
import { useGetMenuItems } from "../../utils/api/menu/menu-item";
import {
  useGetTrendyolProducts,
  useUpdateTrendyolInventoryOnlyMutation,
  useUpdateTrendyolPriceOnlyMutation,
  useUpdateTrendyolProductPriceMutation,
  useUpdateTrendyolProductStockMutation,
} from "../../utils/api/trendyol";
import Loading from "../common/Loading";
import GenericTable from "../panelComponents/Tables/GenericTable";
import ButtonFilter from "../panelComponents/common/ButtonFilter";

const TrendyolStockComparision = () => {
  const { t } = useTranslation();
  const trendyolProducts = useGetTrendyolProducts();
  const items = useGetMenuItems();
  const stocks = useGetAccountStocks();
  const products = useGetAccountProducts();
  const {
    mutate: updateTrendyolInventoryOnly,
    isPending: isUpdatingTrendyolInventory,
  } = useUpdateTrendyolInventoryOnlyMutation();
  const {
    mutate: updateTrendyolPriceOnly,
    isPending: isUpdatingTrendyolPrice,
  } = useUpdateTrendyolPriceOnlyMutation();
  const { mutate: updateTrendyolProductStock } =
    useUpdateTrendyolProductStockMutation();
  const { mutate: updateTrendyolProductPrice } =
    useUpdateTrendyolProductPriceMutation();
  const { updateAccountStock } = useAccountStockMutations();

  const trendyolItemsProductsIds = useMemo(() => {
    return items
      ?.filter((item) => item.trendyolBarcode)
      ?.map((item) => item.matchedProduct);
  }, [items]);

  const trendyolItemProducts = useMemo(() => {
    return products?.filter((product) =>
      trendyolItemsProductsIds.includes(product._id)
    );
  }, [products, trendyolItemsProductsIds]);

  const rows = useMemo(() => {
    return trendyolItemProducts
      ?.map((trendyolItemProduct) => {
        const foundStock = stocks.find(
          (stock) =>
            stock.product === trendyolItemProduct._id && stock.location === 6
        );
        const foundMenuItem = items.find(
          (item) => item?.matchedProduct === trendyolItemProduct._id
        );
        const foundTrendyolProduct = trendyolProducts?.find(
          (trendyolProduct) =>
            trendyolProduct.productMainId === foundMenuItem?.trendyolBarcode ||
            trendyolProduct.barcode === foundMenuItem?.trendyolBarcode ||
            trendyolProduct.stockCode === foundMenuItem?.trendyolBarcode
        );

        const trendyolStock = foundTrendyolProduct?.quantity ?? 0;
        const trendyolPrice = foundTrendyolProduct?.salePrice ?? 0;
        const menuPrice = foundMenuItem?.onlinePrice ?? 0;

        return {
          ...trendyolItemProduct,
          trendyolStock: trendyolStock,
          trendyolPrice: trendyolPrice,
          menuPrice: menuPrice,
          storeStock: foundStock?.quantity ?? 0,
          storeStockId: foundStock?._id,
          foundStock: foundStock,
          barcode: foundTrendyolProduct?.barcode,
        };
      })
      .sort((a, b) => {
        const isAEqual =
          a.trendyolStock === a.storeStock && a.trendyolPrice === a.menuPrice;
        const isBEqual =
          b.trendyolStock === b.storeStock && b.trendyolPrice === b.menuPrice;
        if (isAEqual && !isBEqual) return 1;
        if (!isAEqual && isBEqual) return -1;
        return 0;
      });
  }, [trendyolItemProducts, stocks, trendyolProducts, items]);

  const columns = useMemo(
    () => [
      { key: t("Product"), isSortable: true },
      { key: t("Trendyol Stock"), isSortable: true },
      { key: t("Store Stock"), isSortable: true },
      { key: t("Trendyol Price"), isSortable: true },
      { key: t("Menu Price"), isSortable: true },
      { key: t("Actions"), isSortable: false },
    ],
    [t]
  );

  const rowKeys = useMemo(
    () => [
      { key: "name" },
      { key: "trendyolStock" },
      { key: "storeStock" },
      { key: "trendyolPrice" },
      { key: "menuPrice" },
    ],
    []
  );

  const actions = useMemo(
    () => [
      {
        name: t("Update Store Stock"),
        icon: <RiFileTransferFill />,
        className: "cursor-pointer text-2xl",
        onClick: (row: any) => {
          if (row.trendyolStock === row.storeStock) return;
          if (!row.storeStockId) return;
          updateAccountStock({
            id: row?.storeStockId,
            updates: {
              ...row?.foundStock,
              quantity: row?.trendyolStock,
            },
          });
        },
      },
      {
        name: t("Update Trendyol Stock"),
        icon: <TbTransferOut />,
        className: "cursor-pointer text-2xl",
        onClick: (row: any) => {
          if (row.trendyolStock === row.storeStock || !row.barcode) return;
          updateTrendyolProductStock({
            barcode: row.barcode,
            quantity: row.storeStock,
            salePrice: row.menuPrice,
            listPrice: row.menuPrice,
          });
        },
      },
      {
        name: t("Update Trendyol Price"),
        icon: <TbTag />,
        className: "cursor-pointer text-2xl",
        onClick: (row: any) => {
          if (row.trendyolPrice === row.menuPrice || !row.barcode) return;
          updateTrendyolProductPrice({
            barcode: row.barcode,
            quantity: row.trendyolStock,
            salePrice: row.menuPrice,
            listPrice: row.menuPrice,
          });
        },
      },
    ],
    [
      t,
      updateAccountStock,
      updateTrendyolProductStock,
      updateTrendyolProductPrice,
    ]
  );

  const isUpdatingAny =
    isUpdatingTrendyolInventory || isUpdatingTrendyolPrice;

  const filters = useMemo(
    () => [
      {
        isUpperSide: false,
        isDisabled: isUpdatingAny,
        node: (
          <ButtonFilter
            buttonName={
              isUpdatingTrendyolInventory
                ? t("Updating...")
                : t("Update All Trendyol Stock")
            }
            onclick={() => {
              updateTrendyolInventoryOnly();
            }}
          />
        ),
      },
      {
        isUpperSide: false,
        isDisabled: isUpdatingAny,
        node: (
          <ButtonFilter
            buttonName={
              isUpdatingTrendyolPrice
                ? t("Updating...")
                : t("Update All Trendyol Price")
            }
            onclick={() => {
              updateTrendyolPriceOnly();
            }}
          />
        ),
      },
    ],
    [
      t,
      updateTrendyolInventoryOnly,
      updateTrendyolPriceOnly,
      isUpdatingAny,
      isUpdatingTrendyolInventory,
      isUpdatingTrendyolPrice,
    ]
  );

  return (
    <>
      {(isUpdatingTrendyolInventory || isUpdatingTrendyolPrice) && <Loading />}
      <div className="w-[95%] mx-auto ">
        <GenericTable
          rowKeys={rowKeys}
          columns={columns}
          rows={rows}
          title={t("Trendyol Stock & Price Comparison")}
          filters={filters}
          isActionsActive={true}
          actions={actions}
          rowClassNameFunction={(row: any) => {
            const stockMismatch = row?.trendyolStock !== row?.storeStock;
            const priceMismatch = row?.trendyolPrice !== row?.menuPrice;

            if (stockMismatch && priceMismatch) {
              return "bg-orange-200";
            }
            if (row?.trendyolStock > row?.storeStock) {
              return "bg-red-200";
            }
            if (row?.trendyolStock < row?.storeStock) {
              return "bg-green-200";
            }
            if (priceMismatch) {
              return "bg-yellow-200";
            }
            return "";
          }}
        />
      </div>
    </>
  );
};

export default TrendyolStockComparision;
