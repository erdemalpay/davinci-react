import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useUserContext } from "../../context/User.context";
import { ActionEnum, DisabledConditionEnum } from "../../types";
import { useGetAccountProducts } from "../../utils/api/account/product";
import {
  useGetMenuItems,
  useUpdateShopifyPricesMutation,
} from "../../utils/api/menu/menu-item";
import { useGetDisabledConditions } from "../../utils/api/panelControl/disabledCondition";
import { useGetShopifyProducts } from "../../utils/api/shopify";
import { getItem } from "../../utils/getItem";
import GenericTable from "../panelComponents/Tables/GenericTable";
import ButtonFilter from "../panelComponents/common/ButtonFilter";

const ShopifyPriceComparision = () => {
  const { t } = useTranslation();
  const { user } = useUserContext();
  const shopifyProducts = useGetShopifyProducts();
  const items = useGetMenuItems();
  const products = useGetAccountProducts();
  const disabledConditions = useGetDisabledConditions();
  const { mutate: updateShopifyPrices } = useUpdateShopifyPricesMutation();

  const shopifyPriceComparisionPageDisabledCondition = useMemo(() => {
    return getItem(
      DisabledConditionEnum.STOCK_SHOPIFYPRICECOMPARISION,
      disabledConditions
    );
  }, [disabledConditions]);

  const shopifyItemsProductsIds = useMemo(() => {
    return items
      ?.filter((item) => item.shopifyId)
      ?.map((item) => item.matchedProduct);
  }, [items]);

  const shopifyItemProducts = useMemo(() => {
    return products?.filter((product) =>
      shopifyItemsProductsIds.includes(product._id)
    );
  }, [products, shopifyItemsProductsIds]);

  const rows = useMemo(() => {
    return shopifyItemProducts
      ?.map((shopifyItemProduct) => {
        const foundItem = items.find(
          (item) => item.matchedProduct === shopifyItemProduct._id
        );
        const foundShopifyProduct = shopifyProducts?.find(
          (shopifyProduct) =>
            shopifyProduct.id.split("/").pop() === foundItem?.shopifyId
        );
        return {
          ...shopifyItemProduct,
          shopifyPrice: parseFloat(
            foundShopifyProduct?.variants?.edges?.[0]?.node?.price || "0"
          ),
          itemPrice: foundItem?.price,
          itemOnlinePrice: foundItem?.onlinePrice,
        };
      })
      .sort((a, b) => {
        const isAEqual = a.shopifyPrice === a.itemPrice;
        const isBEqual = b.shopifyPrice === b.itemPrice;
        if (isAEqual && !isBEqual) return 1;
        if (!isAEqual && isBEqual) return -1;
        return 0;
      });
  }, [shopifyItemProducts, items, shopifyProducts]);

  const columns = useMemo(
    () => [
      { key: t("Product"), isSortable: true },
      { key: t("Shopify Price"), isSortable: true },
      { key: t("Item Price"), isSortable: true },
      { key: t("Item Online Price"), isSortable: true },
    ],
    [t]
  );

  const rowKeys = useMemo(
    () => [
      { key: "name" },
      { key: "shopifyPrice" },
      { key: "itemPrice" },
      { key: "itemOnlinePrice" },
    ],
    []
  );

  const filters = useMemo(
    () => [
      {
        isUpperSide: false,
        isDisabled: shopifyPriceComparisionPageDisabledCondition?.actions?.some(
          (ac) =>
            ac.action === ActionEnum.SYNC &&
            user?.role?._id &&
            !ac?.permissionsRoles?.includes(user?.role?._id)
        ),
        node: (
          <ButtonFilter
            buttonName={t("Update Shopify Prices")}
            onclick={() => {
              updateShopifyPrices();
            }}
          />
        ),
      },
    ],
    [shopifyPriceComparisionPageDisabledCondition, user, t, updateShopifyPrices]
  );

  return (
    <>
      <div className="w-[95%] mx-auto ">
        <GenericTable
          rowKeys={rowKeys}
          columns={columns}
          rows={rows}
          title={t("Shopify Price Comparision")}
          filters={filters}
          isActionsActive={false}
          rowClassNameFunction={(row: any) => {
            if (row?.shopifyPrice > row?.itemPrice) {
              return "bg-red-200";
            }
            if (row?.shopifyPrice < row?.itemPrice) {
              return "bg-green-200";
            }
            return "";
          }}
        />
      </div>
    </>
  );
};

export default ShopifyPriceComparision;
