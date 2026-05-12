import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { RiFileTransferFill } from "react-icons/ri";
import { TbTransferOut } from "react-icons/tb";
import { useGetAccountProducts } from "../../utils/api/account/product";
import {
  useAccountStockMutations,
  useGetAccountStocks,
} from "../../utils/api/account/stock";
import { useGetMenuItems } from "../../utils/api/menu/menu-item";
import {
  useGetTrendyolProducts,
  useUpdateTrendyolInventoryOnlyMutation,
  useUpdateTrendyolProductStockMutation,
} from "../../utils/api/trendyol";
import Loading from "../common/Loading";
import GenericTable from "../panelComponents/Tables/GenericTable";
import ButtonFilter from "../panelComponents/common/ButtonFilter";

interface TrendyolStockRow {
  _id: string;
  name: string;
  trendyolStock: number;
  storeStock: number;
  storeStockId?: string;
  foundStock?: any;
  barcode?: string;
  menuPrice: number;
}

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
  const { mutate: updateTrendyolProductStock } =
    useUpdateTrendyolProductStockMutation();
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

        return {
          ...trendyolItemProduct,
          trendyolStock: foundTrendyolProduct?.quantity ?? 0,
          storeStock: foundStock?.quantity ?? 0,
          storeStockId: foundStock?._id,
          foundStock: foundStock,
          barcode: foundTrendyolProduct?.barcode,
          menuPrice: foundMenuItem?.onlinePrice ?? 0,
        };
      })
      .sort((a, b) => {
        const getOrder = (row: TrendyolStockRow) => {
          if (row.trendyolStock > row.storeStock) return 0;
          if (row.trendyolStock < row.storeStock) return 1;
          return 2;
        };
        return getOrder(a) - getOrder(b);
      });
  }, [trendyolItemProducts, stocks, trendyolProducts, items]);

  const columns = useMemo(
    () => [
      { key: t("Product"), isSortable: true },
      { key: t("Trendyol Stock"), isSortable: true },
      { key: t("Store Stock"), isSortable: true },
      { key: t("Actions"), isSortable: false },
    ],
    [t]
  );

  const rowKeys = useMemo(
    () => [{ key: "name" }, { key: "trendyolStock" }, { key: "storeStock" }],
    []
  );

  const actions = useMemo(
    () => [
      {
        name: t("Update Store Stock"),
        icon: <RiFileTransferFill />,
        className: "cursor-pointer text-2xl",
        onClick: (row: TrendyolStockRow) => {
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
        onClick: (row: TrendyolStockRow) => {
          if (row.trendyolStock === row.storeStock || !row.barcode) return;
          updateTrendyolProductStock({
            barcode: row.barcode,
            quantity: row.storeStock,
            salePrice: row.menuPrice,
            listPrice: row.menuPrice,
          });
        },
      },
    ],
    [t, updateAccountStock, updateTrendyolProductStock]
  );

  const filters = useMemo(
    () => [
      {
        isUpperSide: false,
        isDisabled: isUpdatingTrendyolInventory,
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
    ],
    [t, updateTrendyolInventoryOnly, isUpdatingTrendyolInventory]
  );

  return (
    <>
      {isUpdatingTrendyolInventory && <Loading />}
      <div className="w-[95%] mx-auto ">
        <GenericTable
          rowKeys={rowKeys}
          columns={columns}
          rows={rows}
          title={t("Trendyol Stock Comparison")}
          filters={filters}
          isActionsActive={true}
          actions={actions}
          rowClassNameFunction={(row: TrendyolStockRow) => {
            if (row?.trendyolStock > row?.storeStock) {
              return "bg-red-200";
            }
            if (row?.trendyolStock < row?.storeStock) {
              return "bg-green-200";
            }
            return "";
          }}
        />
      </div>
    </>
  );
};

export default TrendyolStockComparision;
