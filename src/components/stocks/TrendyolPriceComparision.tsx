import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { TbTag } from "react-icons/tb";
import { useGetAccountProducts } from "../../utils/api/account/product";
import { useGetMenuItems } from "../../utils/api/menu/menu-item";
import {
  useGetTrendyolProducts,
  useUpdateTrendyolPriceOnlyMutation,
  useUpdateTrendyolProductPriceMutation,
} from "../../utils/api/trendyol";
import Loading from "../common/Loading";
import GenericTable from "../panelComponents/Tables/GenericTable";
import ButtonFilter from "../panelComponents/common/ButtonFilter";

interface TrendyolPriceRow {
  _id: string;
  name: string;
  trendyolPrice: number;
  menuPrice: number;
  trendyolStock: number;
  barcode?: string;
}

const TrendyolPriceComparision = () => {
  const { t } = useTranslation();
  const trendyolProducts = useGetTrendyolProducts();
  const items = useGetMenuItems();
  const products = useGetAccountProducts();
  const {
    mutate: updateTrendyolPriceOnly,
    isPending: isUpdatingTrendyolPrice,
  } = useUpdateTrendyolPriceOnlyMutation();
  const { mutate: updateTrendyolProductPrice } =
    useUpdateTrendyolProductPriceMutation();

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
          trendyolPrice: foundTrendyolProduct?.salePrice ?? 0,
          menuPrice: foundMenuItem?.onlinePrice ?? 0,
          barcode: foundTrendyolProduct?.barcode,
          trendyolStock: foundTrendyolProduct?.quantity ?? 0,
        };
      })
      .sort((a, b) => {
        const getOrder = (row: TrendyolPriceRow) => {
          if (row.menuPrice > row.trendyolPrice) return 0;
          if (row.menuPrice < row.trendyolPrice) return 1;
          return 2;
        };
        return getOrder(a) - getOrder(b);
      });
  }, [trendyolItemProducts, trendyolProducts, items]);

  const columns = useMemo(
    () => [
      { key: t("Product"), isSortable: true },
      { key: t("Trendyol Price"), isSortable: true },
      { key: t("Online Price"), isSortable: true },
      { key: t("Actions"), isSortable: false },
    ],
    [t]
  );

  const rowKeys = useMemo(
    () => [{ key: "name" }, { key: "trendyolPrice" }, { key: "menuPrice" }],
    []
  );

  const actions = useMemo(
    () => [
      {
        name: t("Update Trendyol Price"),
        icon: <TbTag />,
        className: "cursor-pointer text-2xl",
        onClick: (row: TrendyolPriceRow) => {
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
    [t, updateTrendyolProductPrice]
  );

  const filters = useMemo(
    () => [
      {
        isUpperSide: false,
        isDisabled: isUpdatingTrendyolPrice,
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
    [t, updateTrendyolPriceOnly, isUpdatingTrendyolPrice]
  );

  return (
    <>
      {isUpdatingTrendyolPrice && <Loading />}
      <div className="w-[95%] mx-auto ">
        <GenericTable
          rowKeys={rowKeys}
          columns={columns}
          rows={rows}
          title={t("Trendyol Price Comparison")}
          filters={filters}
          isActionsActive={true}
          actions={actions}
          rowClassNameFunction={(row: TrendyolPriceRow) => {
            if (row?.menuPrice > row?.trendyolPrice) {
              return "bg-red-200";
            }
            if (row?.menuPrice < row?.trendyolPrice) {
              return "bg-green-200";
            }
            return "";
          }}
        />
      </div>
    </>
  );
};

export default TrendyolPriceComparision;
