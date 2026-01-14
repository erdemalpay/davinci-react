import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { RiFileTransferFill } from "react-icons/ri";
import { TbTransferOut } from "react-icons/tb";
import { useUserContext } from "../../context/User.context";
import { ActionEnum, DisabledConditionEnum } from "../../types";
import { useGetAccountProducts } from "../../utils/api/account/product";
import {
  useAccountStockMutations,
  useGetAccountStocks,
  useUpdateShopifyStocksMutation,
} from "../../utils/api/account/stock";
import {
  useGetShopifyProducts,
  useUpdateShopifyProductStockMutation,
} from "../../utils/api/shopify";
import { useGetMenuItems } from "../../utils/api/menu/menu-item";
import { useGetDisabledConditions } from "../../utils/api/panelControl/disabledCondition";
import { getItem } from "../../utils/getItem";
import GenericTable from "../panelComponents/Tables/GenericTable";
import ButtonFilter from "../panelComponents/common/ButtonFilter";

const ShopifyStockComparision = () => {
  const { t } = useTranslation();
  const { user } = useUserContext();
  const shopifyProducts = useGetShopifyProducts();
  const items = useGetMenuItems();
  const stocks = useGetAccountStocks();
  const products = useGetAccountProducts();
  const disabledConditions = useGetDisabledConditions();
  const { mutate: updateShopifyStocks } = useUpdateShopifyStocksMutation();
  const { mutate: updateShopifyProductStock } =
    useUpdateShopifyProductStockMutation();
  const { updateAccountStock } = useAccountStockMutations();

  const shopifyStockComparisionPageDisabledCondition = useMemo(() => {
    return getItem(
      DisabledConditionEnum.STOCK_SHOPIFYSTOCKCOMPARISION,
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
        const foundStock = stocks.find(
          (stock) =>
            stock.product === shopifyItemProduct._id && stock.location === 6
        );
        return {
          ...shopifyItemProduct,
          shopifyStock: shopifyProducts?.find(
            (shopifyProduct) =>
              shopifyProduct.id ===
              items.find((item) => item?.matchedProduct === shopifyItemProduct._id)
                ?.shopifyId
          )?.variants[0]?.inventory_quantity,
          storeStock: foundStock?.quantity,
          storeStockId: foundStock?._id,
          foundStock: foundStock,
        };
      })
      .sort((a, b) => {
        const isAEqual = a.shopifyStock === a.storeStock;
        const isBEqual = b.shopifyStock === b.storeStock;
        if (isAEqual && !isBEqual) return 1;
        if (!isAEqual && isBEqual) return -1;
        return 0;
      });
  }, [shopifyItemProducts, stocks, shopifyProducts, items]);

  const columns = useMemo(
    () => [
      { key: t("Product"), isSortable: true },
      { key: t("Shopify Stock"), isSortable: true },
      { key: t("Store Stock"), isSortable: true },
      { key: t("Actions"), isSortable: false },
    ],
    [t]
  );

  const rowKeys = useMemo(
    () => [{ key: "name" }, { key: "shopifyStock" }, { key: "storeStock" }],
    []
  );

  const actions = useMemo(
    () => [
      {
        name: t("Update Store Stock"),
        icon: <RiFileTransferFill />,
        className: " cursor-pointer text-2xl",
        onClick: (row: any) => {
          if (row.shopifyStock === row.storeStock) return;
          updateAccountStock({
            id: row?.storeStockId,
            updates: {
              ...row?.foundStock,
              quantity: row?.shopifyStock,
            },
          });
        },
        isDisabled: shopifyStockComparisionPageDisabledCondition?.actions?.some(
          (ac) =>
            ac.action === ActionEnum.UPDATESTORESTOCK &&
            user?.role?._id &&
            !ac?.permissionsRoles?.includes(user?.role?._id)
        ),
      },
      {
        name: t("Update Shopify Stocks"),
        icon: <TbTransferOut />,
        className: " cursor-pointer text-2xl",
        onClick: (row: any) => {
          const foundItemShopifyId = items.find(
            (item) => item.matchedProduct === row._id
          )?.shopifyId;
          if (row.shopifyStock === row.storeStock || !foundItemShopifyId) return;
          updateShopifyProductStock({
            productId: foundItemShopifyId,
            stockLocationId: 6,
            stockCount: row.storeStock,
          });
        },
        isDisabled: shopifyStockComparisionPageDisabledCondition?.actions?.some(
          (ac) =>
            ac.action === ActionEnum.UPDATESHOPIFYSTOCK &&
            user?.role?._id &&
            !ac?.permissionsRoles?.includes(user?.role?._id)
        ),
      },
    ],
    [
      t,
      updateAccountStock,
      shopifyStockComparisionPageDisabledCondition,
      user,
      items,
      updateShopifyProductStock,
    ]
  );

  const filters = useMemo(
    () => [
      {
        isUpperSide: false,
        isDisabled: shopifyStockComparisionPageDisabledCondition?.actions?.some(
          (ac) =>
            ac.action === ActionEnum.SYNC &&
            user?.role?._id &&
            !ac?.permissionsRoles?.includes(user?.role?._id)
        ),
        node: (
          <ButtonFilter
            buttonName={t("Update Shopify Stocks")}
            onclick={() => {
              updateShopifyStocks();
            }}
          />
        ),
      },
    ],
    [shopifyStockComparisionPageDisabledCondition, user, t, updateShopifyStocks]
  );

  return (
    <>
      <div className="w-[95%] mx-auto ">
        <GenericTable
          rowKeys={rowKeys}
          columns={columns}
          rows={rows}
          title={t("Shopify Stock Comparision")}
          filters={filters}
          isActionsActive={true}
          actions={actions}
          rowClassNameFunction={(row: any) => {
            if (row?.shopifyStock > row?.storeStock) {
              return "bg-red-200";
            }
            if (row?.shopifyStock < row?.storeStock) {
              return "bg-green-200";
            }
            return "";
          }}
        />
      </div>
    </>
  );
};

export default ShopifyStockComparision;
