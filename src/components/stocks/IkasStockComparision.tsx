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
  useUpdateIkasStocksMutation,
} from "../../utils/api/account/stock";
import {
  useGetIkasProducts,
  useUpdateIkasProductStockMutation,
} from "../../utils/api/ikas";
import { useGetMenuItems } from "../../utils/api/menu/menu-item";
import { useGetDisabledConditions } from "../../utils/api/panelControl/disabledCondition";
import { getItem } from "../../utils/getItem";
import GenericTable from "../panelComponents/Tables/GenericTable";
import ButtonFilter from "../panelComponents/common/ButtonFilter";

const IkasStockComparision = () => {
  const { t } = useTranslation();
  const { user } = useUserContext();
  const ikasProducts = useGetIkasProducts();
  const items = useGetMenuItems();
  const stocks = useGetAccountStocks();
  const products = useGetAccountProducts();
  const disabledConditions = useGetDisabledConditions();
  const { mutate: updateIkasStocks } = useUpdateIkasStocksMutation();
  const { mutate: updateIkasProductStock } =
    useUpdateIkasProductStockMutation();
  const { updateAccountStock } = useAccountStockMutations();

  const ikasStockComparisionPageDisabledCondition = useMemo(() => {
    return getItem(
      DisabledConditionEnum.STOCK_IKASSTOCKCOMPARISION,
      disabledConditions
    );
  }, [disabledConditions]);

  const ikasItemsProductsIds = useMemo(() => {
    return items
      ?.filter((item) => item.ikasId)
      ?.map((item) => item.matchedProduct);
  }, [items]);

  const ikasItemProducts = useMemo(() => {
    return products?.filter((product) =>
      ikasItemsProductsIds.includes(product._id)
    );
  }, [products, ikasItemsProductsIds]);

  const rows = useMemo(() => {
    return ikasItemProducts
      ?.map((ikasItemProduct) => {
        const foundStock = stocks.find(
          (stock) =>
            stock.product === ikasItemProduct._id && stock.location === 6
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
  }, [ikasItemProducts, stocks, ikasProducts, items]);

  const columns = useMemo(
    () => [
      { key: t("Product"), isSortable: true },
      { key: t("Ikas Stock"), isSortable: true },
      { key: t("Store Stock"), isSortable: true },
      { key: t("Actions"), isSortable: false },
    ],
    [t]
  );

  const rowKeys = useMemo(
    () => [{ key: "name" }, { key: "ikasStock" }, { key: "storeStock" }],
    []
  );

  const actions = useMemo(
    () => [
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
        isDisabled: ikasStockComparisionPageDisabledCondition?.actions?.some(
          (ac) =>
            ac.action === ActionEnum.UPDATESTORESTOCK &&
            user?.role?._id &&
            !ac?.permissionsRoles?.includes(user?.role?._id)
        ),
      },
      {
        name: t("Update Ikas Stocks"),
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
        isDisabled: ikasStockComparisionPageDisabledCondition?.actions?.some(
          (ac) =>
            ac.action === ActionEnum.UPDATEIKASSTOCK &&
            user?.role?._id &&
            !ac?.permissionsRoles?.includes(user?.role?._id)
        ),
      },
    ],
    [
      t,
      updateAccountStock,
      ikasStockComparisionPageDisabledCondition,
      user,
      items,
      updateIkasProductStock,
    ]
  );

  const filters = useMemo(
    () => [
      {
        isUpperSide: false,
        isDisabled: ikasStockComparisionPageDisabledCondition?.actions?.some(
          (ac) =>
            ac.action === ActionEnum.SYNC &&
            user?.role?._id &&
            !ac?.permissionsRoles?.includes(user?.role?._id)
        ),
        node: (
          <ButtonFilter
            buttonName={t("Update Ikas Stocks")}
            onclick={() => {
              updateIkasStocks();
            }}
          />
        ),
      },
    ],
    [ikasStockComparisionPageDisabledCondition, user, t, updateIkasStocks]
  );

  return (
    <>
      <div className="w-[95%] mx-auto ">
        <GenericTable
          rowKeys={rowKeys}
          columns={columns}
          rows={rows}
          title={t("Ikas Stock Comparision")}
          filters={filters}
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
